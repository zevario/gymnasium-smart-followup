import 'dotenv/config';
import pool from '../pool.js';
import { importBatch } from '../../modules/pilot/pilot.service.js';

/**
 * Data demo untuk bagian AI: 12 customer fiktif dengan riwayat yang sengaja dirancang
 * agar model prioritas (ai/) menghasilkan campuran Low, Medium, dan High, dan fitur paket
 * (sisa sesi, pengingat H-7) ikut terlihat. Polanya mengikuti simulasi data latih
 * (ai/docs/asumsi_dataset.md). Customer yang sudah ada (email sama) dilewati, jadi aman
 * dijalankan ulang. Jalankan setelah `npm run seed:admin` dan minimal satu akun staff.
 */
const DAY = 86400000;
const at = (daysFromNow, hour = 9) => {
  const date = new Date(Date.now() + daysFromNow * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};
const P = (n) => Array.from({ length: n }, () => 'present');

// visits: status booking lama (paling lama dulu), dibagi rata ke `spanDays` terakhir.
// replies: hasil reminder yang sudah terkirim. pkg: paket aktif (null = tidak ada).
// followup: tugas di Dashboard/Semua follow-up (trial selesai atau paket akan/baru habis).
const scenarios = [
  // Rajin: diharapkan Low
  {
    name: 'Ayu Lestari',
    visits: [...P(7), 'late'],
    spanDays: 28,
    replies: ['responded', 'responded', 'responded', 'responded'],
    pkg: { name: 'Group Class Regular 12 Sesi', used: 6, expiresIn: 35 },
    tomorrow: true,
  },
  {
    name: 'Budi Hartono',
    visits: P(9),
    spanDays: 29,
    replies: ['responded', 'responded', 'responded'],
    pkg: { name: 'Personal Training Junior Coach 8 Sesi', used: 3, expiresIn: 30 },
  },
  {
    name: 'Citra Maharani',
    visits: [...P(6), 'late'],
    spanDays: 26,
    replies: ['responded', 'responded', 'responded', 'responded', 'responded'],
    pkg: { name: 'Group Class Regular 8 Sesi', used: 4, expiresIn: 28 },
  },
  {
    name: 'Dewi Anggraini',
    visits: P(8),
    spanDays: 30,
    replies: ['responded', 'responded', 'no_response', 'responded'],
    pkg: { name: 'Group Class Regular 12 Sesi', used: 5, expiresIn: 40 },
  },
  // Sedang: diharapkan Medium
  {
    name: 'Eko Prasetyo',
    visits: ['present', 'absent', 'present', 'excused', 'present'],
    spanDays: 40,
    lastVisitDaysAgo: 8,
    replies: ['responded', 'no_response', 'responded', 'no_response'],
    pkg: { name: 'Open Gym 4 Sesi', used: 2, expiresIn: 18 },
    tomorrow: true,
  },
  {
    name: 'Fitri Handayani',
    visits: ['present', 'absent', 'present', 'absent', 'late'],
    spanDays: 45,
    lastVisitDaysAgo: 16,
    replies: ['responded', 'no_response'],
    pkg: { name: 'Group Class Regular 8 Sesi', used: 6, expiresIn: 20 },
  },
  {
    name: 'Gilang Ramadhan',
    visits: ['present', 'excused', 'present', 'absent', 'present', 'present'],
    spanDays: 50,
    lastVisitDaysAgo: 6,
    replies: ['no_response', 'responded', 'responded', 'no_response'],
    pkg: { name: 'Group Class Regular 4 Sesi', used: 3, expiresIn: 25 },
  },
  {
    name: 'Hana Puspita',
    visits: ['present', 'absent', 'present', 'present'],
    spanDays: 40,
    lastVisitDaysAgo: 12,
    replies: ['responded', 'no_response'],
    pkg: { name: 'Personal Training Junior Coach 8 Sesi', used: 6, expiresIn: 22 },
  },
  // Perlu perhatian: diharapkan High
  {
    name: 'Indra Wijaya',
    visits: ['present', 'absent', 'present', 'absent', 'absent'],
    spanDays: 45,
    lastVisitDaysAgo: 18,
    replies: ['responded', 'no_response', 'no_response', 'no_response', 'no_response'],
    pkg: { name: 'Group Class Regular 8 Sesi', used: 5, expiresIn: 5 },
    tomorrow: true,
    followup: { goal: 'renewal', anchorDays: 5, interest: 'none', visits: 1 },
  },
  {
    name: 'Joko Susilo',
    visits: ['present', 'absent', 'present', 'absent'],
    spanDays: 60,
    lastVisitDaysAgo: 25,
    replies: ['no_response', 'no_response', 'no_response'],
    pkg: null,
    followup: { goal: 'renewal', anchorDays: -5, interest: 'none', visits: 0 },
  },
  {
    name: 'Kartika Sari',
    visits: ['excused', 'present', 'excused', 'absent', 'excused', 'present'],
    spanDays: 45,
    lastVisitDaysAgo: 15,
    replies: ['no_response', 'responded', 'no_response', 'no_response'],
    pkg: { name: 'Open Gym 4 Sesi', used: 3, expiresIn: 12 },
    tomorrow: true,
  },
  {
    name: 'Lina Marlina',
    visits: ['absent'],
    spanDays: 4,
    replies: ['no_response'],
    pkg: { name: 'Trial Personal Training Junior Coach', used: 0, expiresIn: 3 },
    followup: { goal: 'trial', anchorDays: -1.5, interest: 'information', visits: 0 },
  },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const admin = (
      await client.query(
        `SELECT id FROM users WHERE role = 'admin' AND is_active ORDER BY created_at LIMIT 1`,
      )
    ).rows[0];
    const staff = (
      await client.query(
        `SELECT id FROM users WHERE role IN ('staff', 'spv') AND is_active ORDER BY role DESC, created_at LIMIT 1`,
      )
    ).rows[0];
    if (!admin || !staff) throw new Error('Butuh akun admin dan staff/supervisor aktif.');
    const catalog = Object.fromEntries(
      (await client.query('SELECT id, name, session_count FROM packages')).rows.map((p) => [
        p.name,
        p,
      ]),
    );

    let created = 0;
    const followups = [];
    for (const [index, s] of scenarios.entries()) {
      const number = String(index + 1).padStart(2, '0');
      const pkg = s.pkg && catalog[s.pkg.name];
      if (s.pkg && !pkg) throw new Error(`Paket "${s.pkg.name}" tidak ada di tabel packages.`);
      const customer = await client.query(
        `INSERT INTO customers (name, email, phone, gender, address, notes, membership_package,
           membership_start, membership_end, contact_permission, pic_id, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10, 'active', $11)
         ON CONFLICT (email) DO NOTHING RETURNING id`,
        [
          s.name,
          `ai.demo.${number}@example.com`,
          `08130000${number}`,
          index % 2 ? 'male' : 'female',
          `Alamat demo AI ${number}`,
          'Customer fiktif untuk demo AI (seed-ai-demo.js).',
          s.pkg?.name ?? 'Group Class Regular 8 Sesi',
          at(-(s.spanDays + 5)),
          s.pkg ? at(s.pkg.expiresIn) : at(-5),
          staff.id,
          admin.id,
        ],
      );
      if (!customer.rowCount) continue; // sudah ada
      const customerId = customer.rows[0].id;
      created += 1;
      if (s.followup) {
        const { goal, anchorDays, interest, visits } = s.followup;
        followups.push({
          location: 'bintaro',
          customerId: String(customerId),
          name: s.name,
          phone: `+628130000${number}`,
          consent: 'granted',
          consentRef: 'demo-ai',
          consentAt: at(-(s.spanDays + 5)).toISOString(),
          complaint: false,
          observedAt: new Date().toISOString(),
          cycleId: `demo-ai-${number}`,
          goal,
          package: s.pkg?.name ?? 'Group Class Regular 8 Sesi',
          anchor: new Date(Date.now() + anchorDays * DAY).toISOString(),
          interest,
          visits,
          transaction: null,
          ...(goal === 'renewal' ? { membershipState: 'renewable' } : {}),
        });
      }

      // Booking lama: tersebar sampai `lastVisitDaysAgo` (default 1) hari lalu.
      const last = s.lastVisitDaysAgo ?? 1;
      for (const [i, status] of s.visits.entries()) {
        const daysAgo =
          s.visits.length === 1
            ? last
            : Math.round(s.spanDays - (i * (s.spanDays - last)) / (s.visits.length - 1));
        const startsAt = at(-daysAgo, 8);
        const schedule = await client.query(
          `INSERT INTO schedules (title, description, type, trainer_name, location, starts_at, ends_at,
             status, reminder_2h_enabled, created_by)
           VALUES ('Group Class Regular', 'Demo AI', 'group_class', 'Coach Demo', 'Gymnasyum Bintaro',
             $1, $2, 'completed', FALSE, $3) RETURNING id`,
          [startsAt, new Date(startsAt.getTime() + 3600000), admin.id],
        );
        await client.query(
          'INSERT INTO schedule_members (schedule_id, customer_id) VALUES ($1, $2)',
          [schedule.rows[0].id, customerId],
        );
        await client.query(
          `INSERT INTO attendances (schedule_id, customer_id, status, checked_in_at, notes, recorded_by)
           VALUES ($1, $2, $3, $4, 'Demo AI', $5)`,
          [
            schedule.rows[0].id,
            customerId,
            status,
            ['present', 'late'].includes(status) ? startsAt : null,
            staff.id,
          ],
        );
      }

      // Reminder yang sudah terkirim, tersebar dalam 30 hari terakhir.
      for (const [i, status] of s.replies.entries()) {
        const sentAt = at(-(28 - i * 5), 9);
        await client.query(
          `INSERT INTO reminders (customer_id, type, channel, message, status, scheduled_at, sent_at,
             responded_at, created_by, lead_minutes, approval_status, assigned_to, approved_by, approved_at, sent_by)
           VALUES ($1, 'followup', 'whatsapp', 'Pesan demo AI.', $2, $3, $3, $4, $5, 1440, 'approved', $6, $5, $3, $6)`,
          [
            customerId,
            status,
            sentAt,
            status === 'responded' ? new Date(sentAt.getTime() + 2 * 3600000) : null,
            admin.id,
            staff.id,
          ],
        );
      }

      if (pkg) {
        await client.query(
          `INSERT INTO customer_packages (customer_id, package_id, total_sessions, used_sessions, status,
             purchased_at, started_at, expires_at)
           VALUES ($1, $2, $3, $4, 'active', $5, $5, $6)`,
          [
            customerId,
            pkg.id,
            pkg.session_count,
            s.pkg.used,
            at(-(s.spanDays + 2)),
            at(s.pkg.expiresIn),
          ],
        );
      }

      // Kelas ±20 jam lagi: masuk jendela 24 jam penjadwal, jadi reminder jadwal langsung dibuat.
      if (s.tomorrow) {
        const startsAt = new Date(Math.ceil((Date.now() + 20 * 3600000) / 3600000) * 3600000);
        const schedule = await client.query(
          `INSERT INTO schedules (title, description, type, trainer_name, location, starts_at, ends_at,
             status, reminder_2h_enabled, created_by)
           VALUES ('Group Class Regular', 'Demo AI', 'group_class', 'Coach Demo', 'Gymnasyum Bintaro',
             $1, $2, 'scheduled', FALSE, $3) RETURNING id`,
          [startsAt, new Date(startsAt.getTime() + 3600000), admin.id],
        );
        await client.query(
          'INSERT INTO schedule_members (schedule_id, customer_id) VALUES ($1, $2)',
          [schedule.rows[0].id, customerId],
        );
      }
    }
    await client.query('COMMIT');
    console.log(`Data demo AI: ${created} customer baru, ${scenarios.length - created} sudah ada.`);
    // Lewat impor resmi backend (sama dengan menu Pengaturan → Impor), agar skor dan status tugas ikut dihitung.
    if (followups.length) {
      const result = await importBatch(followups, staff.id);
      console.log(`Tugas follow-up demo: ${result.updated} dibuat.`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch((error) => {
  console.error('Seed demo AI gagal:', error.message);
  process.exitCode = 1;
});
