const pool = require('./db');
const bcrypt = require('bcryptjs');

async function runSeed() {
  try {
    console.log('⏳ Menyiapkan skema database & data dummy...');

    // 1. Reset tabel & tipe lama agar bersih
    await pool.query(`
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS follow_ups CASCADE;
      DROP TABLE IF EXISTS follow_up_settings CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      DROP TYPE IF EXISTS follow_up_status_type CASCADE;
      DROP TYPE IF EXISTS priority_level_type CASCADE;
      DROP TYPE IF EXISTS membership_status_type CASCADE;
      DROP TYPE IF EXISTS contact_permission_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);

    // 2. Buat Tipe Enum & Tabel Baru
    await pool.query(`
      CREATE TYPE user_role AS ENUM ('system_admin', 'supervisor', 'admin_sales');
      CREATE TYPE contact_permission_status AS ENUM ('Aktif', 'Ditarik');
      CREATE TYPE membership_status_type AS ENUM ('Aktif', 'Trial aktif', 'Perlu ditinjau');
      CREATE TYPE priority_level_type AS ENUM ('Tinggi', 'Sedang', 'Rendah');
      CREATE TYPE follow_up_status_type AS ENUM ('Scheduled', 'Sent', 'Responded', 'No Response', 'Ditunda', 'Selesai', 'Ditolak');

      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role user_role NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL UNIQUE,
          membership_type VARCHAR(100) NOT NULL,
          membership_status membership_status_type DEFAULT 'Trial aktif',
          remaining_sessions INT DEFAULT 0,
          last_visit_date DATE NULL,
          contact_permission contact_permission_status DEFAULT 'Aktif',
          assigned_pic_id INT REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT check_positive_sessions CHECK (remaining_sessions >= 0)
      );

      CREATE TABLE follow_up_settings (
          id SERIAL PRIMARY KEY,
          start_time TIME DEFAULT '08:00:00',
          end_time TIME DEFAULT '18:00:00',
          timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
          min_contact_gap_days INT DEFAULT 3,
          max_proactive_contacts INT DEFAULT 3,
          trial_cycle_config JSONB DEFAULT '{"first_contact": 24, "second_contact": 72, "third_contact": 336}',
          renewal_cycle_config JSONB DEFAULT '["H-7", "H-2", "H+7"]',
          max_attempts_per_cycle INT DEFAULT 2,
          updated_by INT REFERENCES users(id),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE follow_ups (
          id SERIAL PRIMARY KEY,
          customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
          pic_id INT REFERENCES users(id) ON DELETE SET NULL,
          purpose VARCHAR(50) NOT NULL,
          priority_score INT DEFAULT 50,
          priority_level priority_level_type DEFAULT 'Sedang',
          due_date TIMESTAMP NOT NULL,
          due_description VARCHAR(100),
          status follow_up_status_type DEFAULT 'Scheduled',
          message_draft TEXT NULL,
          supervisor_notes TEXT NULL,
          sent_at TIMESTAMP NULL,
          responded_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          action_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO follow_up_settings (min_contact_gap_days, max_proactive_contacts)
      VALUES (3, 3);
    `);

    // 3. Password default untuk akun demo
    const hashedPassword = await bcrypt.hash('GymnasyumDemo123!', 10);

    // 4. Masukkan Akun Pengguna Demo
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Alya Putri', 'alya.putri@gymnasyum.id', $1, 'admin_sales'),
      ('Nisa Amalia', 'nisa.amalia@gymnasyum.id', $1, 'supervisor'),
      ('Raka Kurnia', 'raka.kurnia@gymnasyum.id', $1, 'system_admin')
      RETURNING id, name, role;
    `, [hashedPassword]);

    const alyaId = userRes.rows.find(u => u.role === 'admin_sales').id;
    const nisaId = userRes.rows.find(u => u.role === 'supervisor').id;

    // 5. Masukkan Pelanggan Demo
    const custRes = await pool.query(`
      INSERT INTO customers (name, phone, membership_type, membership_status, remaining_sessions, last_visit_date, contact_permission, assigned_pic_id) VALUES
      ('Dimas Saputra', '081234567801', 'Trial Group Class', 'Trial aktif', 0, CURRENT_DATE - INTERVAL '1 day', 'Aktif', $1),
      ('Rina Pramesti', '081234567802', 'Group Class 8 Sesi', 'Aktif', 1, CURRENT_DATE - INTERVAL '3 days', 'Aktif', $1),
      ('Budi Santoso', '081234567803', 'Open Gym Bulanan', 'Perlu ditinjau', 0, CURRENT_DATE - INTERVAL '10 days', 'Ditarik', $2),
      ('Siti Rahma', '081234567804', 'Trial Personal Training', 'Trial aktif', 0, CURRENT_DATE - INTERVAL '2 days', 'Aktif', $1)
      RETURNING id, name;
    `, [alyaId, nisaId]);

    const dimasId = custRes.rows.find(c => c.name === 'Dimas Saputra').id;
    const rinaId = custRes.rows.find(c => c.name === 'Rina Pramesti').id;
    const budiId = custRes.rows.find(c => c.name === 'Budi Santoso').id;

    // 6. Masukkan Follow Up Demo
    await pool.query(`
      INSERT INTO follow_ups (customer_id, pic_id, purpose, priority_score, priority_level, due_date, due_description, status, message_draft) VALUES
      ($1, $4, 'Trial', 82, 'Tinggi', NOW(), 'Hari ini, 10.30 (Trial kemarin)', 'Scheduled', 'Halo Kak Dimas! Gimana pengalaman kelas trial-nya kemarin? Mau info nih kalau hari ini ada promo membership khusus untuk Kakak.'),
      ($2, $4, 'Perpanjangan', 75, 'Tinggi', NOW(), 'Hari ini, 14.00 (Sisa 1 sesi)', 'Scheduled', 'Halo Kak Rina, sesi paket Group Class Kakak tersisa 1 sesi lagi ya. Mau sekalian kita amankan slot perpanjangannya mumpung ada promo diskon 15%?'),
      ($3, $4, 'Perpanjangan', 45, 'Sedang', NOW() + INTERVAL '1 day', 'Besok, 11.00', 'Scheduled', 'Halo Kak Budi, sekadar mengingatkan masa berlaku membership Kakak akan berakhir beberapa hari lagi.')
    `, [dimasId, rinaId, budiId, alyaId]);

    // 7. Masukkan Log Aktivitas
    await pool.query(`
      INSERT INTO activity_logs (user_id, action_text) VALUES
      ($1, 'Alya Putri menjadwalkan reminder trial untuk Dimas Saputra'),
      ($2, 'Nisa Amalia memperbarui konfigurasi jeda follow-up menjadi 3 hari')
    `, [alyaId, nisaId]);

    console.log('✅ Skema tabel & data dummy berhasil dibuat otomatis di PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal membuat skema/data:', error.message);
    process.exit(1);
  }
}

runSeed();