import 'dotenv/config';
import bcrypt from 'bcrypt';
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
// history: siklus follow-up lama yang sudah selesai, agar halaman Laporan punya kohort matang.
const scenarios = [
  // Rajin: diharapkan Low
  {
    name: 'Ayu Lestari',
    visits: [...P(7), 'late'],
    spanDays: 28,
    replies: ['responded', 'responded', 'responded', 'responded'],
    pkg: { name: 'Group Class Regular 12 Sesi', used: 6, expiresIn: 35 },
    history: { goal: 'renewal', daysAgo: 40, contacted: true, converted: true },
    tomorrow: true,
  },
  {
    name: 'Budi Hartono',
    visits: P(9),
    spanDays: 29,
    replies: ['responded', 'responded', 'responded'],
    pkg: { name: 'Personal Training Junior Coach 8 Sesi', used: 3, expiresIn: 30 },
    history: { goal: 'renewal', daysAgo: 35, contacted: true, converted: true },
  },
  {
    name: 'Citra Maharani',
    visits: [...P(6), 'late'],
    spanDays: 26,
    replies: ['responded', 'responded', 'responded', 'responded', 'responded'],
    pkg: { name: 'Group Class Regular 8 Sesi', used: 4, expiresIn: 28 },
    history: { goal: 'renewal', daysAgo: 30, contacted: true, converted: false },
  },
  {
    name: 'Dewi Anggraini',
    visits: P(8),
    spanDays: 30,
    replies: ['responded', 'responded', 'no_response', 'responded'],
    pkg: { name: 'Group Class Regular 12 Sesi', used: 5, expiresIn: 40 },
    history: { goal: 'trial', daysAgo: 45, contacted: true, converted: true },
  },
  // Sedang: diharapkan Medium
  {
    name: 'Eko Prasetyo',
    visits: ['present', 'absent', 'present', 'excused', 'present'],
    spanDays: 40,
    lastVisitDaysAgo: 8,
    replies: ['responded', 'no_response', 'responded', 'no_response'],
    pkg: { name: 'Open Gym 4 Sesi', used: 2, expiresIn: 18 },
    history: { goal: 'trial', daysAgo: 38, contacted: false, converted: false },
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
    history: { goal: 'trial', daysAgo: 33, contacted: true, converted: true },
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
      if (s.history) {
        // Siklus lama yang sudah ditutup; waktunya mengikuti schedule() di pilot.policy.js.
        const { goal, daysAgo, contacted, converted } = s.history;
        const trial = goal === 'trial';
        const anchor = at(-daysAgo, 0);
        const opens = new Date(anchor.getTime() + (trial ? DAY : -7 * DAY));
        const expires = new Date(anchor.getTime() + (trial ? 14 : 8) * DAY);
        const paidAt = new Date(anchor.getTime() + (trial ? 5 : -2) * DAY);
        const person = await client.query(
          `INSERT INTO pilot_people(location,source_id,name,phone,consent,complaint,observed_at)
           VALUES('bintaro',$1,$2,$3,'granted',false,$4)
           ON CONFLICT(location,source_id) DO UPDATE SET name=excluded.name RETURNING id`,
          [String(customerId), s.name, `+628130000${number}`, opens],
        );
        const facts = {
          consentRef: 'demo-ai',
          consentAt: at(-(s.spanDays + 5)).toISOString(),
          package: trial ? 'Trial Personal Training Junior Coach' : s.pkg.name,
          anchor: anchor.toISOString(),
          interest: 'none',
          visits: 0,
          transaction: converted ? `DEMO-AI-${number}` : null,
          ...(converted ? { transactionAt: paidAt.toISOString() } : {}),
          ...(trial ? {} : { membershipState: 'renewable' }),
        };
        const cycle = await client.query(
          `INSERT INTO pilot_cycles(person_id,goal,source_cycle,facts,observed_at,opens_at,due_at,
             expires_at,owner_id,status,reason,eligible_at)
           VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,'closed',$9,$5) RETURNING id`,
          [
            person.rows[0].id,
            goal,
            `demo-ai-history-${number}`,
            JSON.stringify(facts),
            opens,
            new Date(opens.getTime() + DAY),
            expires,
            staff.id,
            converted ? 'transaction_confirmed' : 'window_expired',
          ],
        );
        if (contacted) {
          const sentAt = new Date(opens.getTime() + 3 * 3600000);
          await client.query(
            `INSERT INTO pilot_attempts(id,cycle_id,actor_id,message,verification,state,created_at,accepted_at)
             VALUES(gen_random_uuid(),$1,$2,'Pesan follow-up demo.','Dicatat manual (data demo).','accepted',$3,$3)`,
            [cycle.rows[0].id, staff.id, sentAt],
          );
        }
      }
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

    // Akun portal customer yang sudah aktif, agar demo tidak bergantung pada email aktivasi.
    const demoEmail = (
      process.env.DEMO_CUSTOMER_EMAIL || 'demo.customer@example.com'
    ).toLowerCase();
    const demoPassword = process.env.DEMO_CUSTOMER_PASSWORD || '';
    if (demoPassword.length < 10) {
      console.log('Akun customer demo dilewati: isi DEMO_CUSTOMER_PASSWORD (minimal 10 karakter).');
    } else if (
      !(await client.query('SELECT 1 FROM member_accounts WHERE email=$1', [demoEmail])).rowCount
    ) {
      const person = await client.query(
        `INSERT INTO pilot_people(location,source_id,name,phone,consent,complaint,observed_at)
         VALUES('bintaro','portal-demo-customer','Customer Demo','+6281300000099','granted',false,now())
         ON CONFLICT(location,source_id) DO UPDATE SET name=excluded.name RETURNING id`,
      );
      await client.query(
        `INSERT INTO member_accounts(person_id,email,password_hash,activation_pending)
         VALUES($1,$2,$3,false)`,
        [person.rows[0].id, demoEmail, await bcrypt.hash(demoPassword, 12)],
      );
      console.log(`Akun customer demo aktif: ${demoEmail}`);
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
