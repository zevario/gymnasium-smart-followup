import pool from '../../database/pool.js';

/**
 * Draft pesan dari layanan Generative AI (folder AI tim, `POST /draft`, Google Gemini dengan
 * template cadangan). Backend hanya mengirim fakta dari database; layanan menyusun kalimatnya
 * dan memeriksa bahwa angka di draft berasal dari fakta itu. Draft selalu ditinjau petugas
 * sebelum dikirim, dan tidak pernah disimpan atau dikirim otomatis.
 */
const KINDS = new Set([
  'schedule_reminder',
  'package_reminder',
  'followup_trial',
  'followup_renewal',
]);
const MIN_LENGTH = 5;
const MAX_LENGTH = 500; // sama dengan batas pesan di pilot.schema.js

const notConfigured = {
  available: false,
  provider: null,
  draft: null,
  reason: 'DRAFT_API_URL is not configured.',
};

/**
 * Meminta draft. Mengembalikan null bila layanan tidak dikonfigurasi, gagal, lewat batas
 * waktu, atau menjawab di luar kontrak; pemanggil lalu memakai template miliknya sendiri.
 */
export const requestDraft = async (facts) => {
  const endpoint = process.env.DRAFT_API_URL;
  if (!endpoint || !KINDS.has(facts?.kind)) return null;
  try {
    const httpResponse = await fetch(new URL('/draft', endpoint), {
      method: 'POST',
      // Gemini gratis bisa butuh 2-14 detik; layanan AI menyerah di 12 detik lalu memakai template.
      // Draft follow-up dibuat di dalam transaksi, jadi baris tugas terkunci selama menunggu.
      signal: AbortSignal.timeout(Number(process.env.DRAFT_TIMEOUT_MS || 15000)),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facts),
    });
    if (!httpResponse.ok) return null;
    const body = await httpResponse.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (message.length < MIN_LENGTH || message.length > MAX_LENGTH) return null;
    return {
      message,
      source: body.source === 'gemini' ? 'gemini' : 'template',
      model: typeof body.model === 'string' ? body.model.slice(0, 60) : null,
      reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : null,
    };
  } catch {
    return null;
  }
};

const toDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) : null;

/** Fakta draft untuk satu reminder, dengan aturan akses yang sama dengan daftar reminder. */
const findReminderFacts = async (id, user) => {
  const values = [id];
  let access = '';
  if (user.role === 'staff') {
    values.push(user.id);
    access = 'AND reminder.assigned_to = $2';
  }
  const result = await pool.query(
    `SELECT reminder.type,
       customer.name AS "customerName",
       schedule.title AS "className",
       schedule.starts_at AS "classStartsAt",
       package.name AS "packageName",
       customer_package.total_sessions - customer_package.used_sessions AS "remainingSessions",
       customer_package.expires_at AS "expiresAt",
       latest_priority.priority
     FROM reminders reminder
     JOIN customers customer ON customer.id = reminder.customer_id
     LEFT JOIN schedules schedule ON schedule.id = reminder.schedule_id
     LEFT JOIN customer_packages customer_package
       ON customer_package.id = reminder.customer_package_id
     LEFT JOIN packages package ON package.id = customer_package.package_id
     LEFT JOIN LATERAL (
       SELECT log.priority FROM prediction_logs log
       WHERE log.customer_id = reminder.customer_id
       ORDER BY log.predicted_at DESC LIMIT 1
     ) latest_priority ON TRUE
     WHERE reminder.id = $1 ${access}`,
    values,
  );
  return result.rows[0] || null;
};

/** Draft untuk reminder jadwal atau paket. `notFound` bila reminder tidak ada atau bukan milik staff. */
const generateReminderDraft = async (id, user) => {
  if (!process.env.DRAFT_API_URL) return notConfigured;
  const row = await findReminderFacts(id, user);
  if (!row) return { notFound: true };
  if (!['schedule', 'package'].includes(row.type)) {
    return {
      ...notConfigured,
      reason: 'Draft is available for schedule and package reminders only.',
    };
  }
  const draft = await requestDraft({
    kind: row.type === 'package' ? 'package_reminder' : 'schedule_reminder',
    customerName: row.customerName,
    priority: row.priority,
    className: row.className,
    classStartsAt: row.classStartsAt,
    packageName: row.packageName,
    remainingSessions: row.remainingSessions,
    expiresAt: toDate(row.expiresAt),
  });
  if (!draft) return { ...notConfigured, reason: 'Draft service is unavailable.' };
  return {
    available: true,
    provider: draft.source,
    model: draft.model,
    draft: draft.message,
    reason: draft.reason,
  };
};

/** Draft follow-up dari fakta yang sudah disusun pemanggil (lihat pilot.drafts.js). */
const generateFollowupDraft = async (facts) => {
  if (!process.env.DRAFT_API_URL) return notConfigured;
  const draft = await requestDraft(facts);
  if (!draft) return { ...notConfigured, reason: 'Draft service is unavailable.' };
  return {
    available: true,
    provider: draft.source,
    model: draft.model,
    draft: draft.message,
    reason: draft.reason,
  };
};

const getDraftGeneratorStatus = async () => {
  const endpoint = process.env.DRAFT_API_URL;
  if (!endpoint) return { available: false, provider: null, reason: notConfigured.reason };
  try {
    const httpResponse = await fetch(new URL('/health', endpoint), {
      signal: AbortSignal.timeout(Number(process.env.DRAFT_TIMEOUT_MS || 15000)),
    });
    const status = (await httpResponse.json())?.draft;
    if (!httpResponse.ok || !status) throw new Error('unexpected');
    return {
      available: true,
      provider: status.configured ? status.provider : 'template',
      model: status.configured ? status.model : null,
      reason: status.configured ? null : 'GEMINI_API_KEY is not set; drafts use templates.',
    };
  } catch {
    return { available: false, provider: null, reason: 'Draft service is unreachable.' };
  }
};

const DraftGeneratorService = {
  generateReminderDraft,
  generateFollowupDraft,
  getDraftGeneratorStatus,
};

export default DraftGeneratorService;
