/**
 * Paket aktif dan log prediksi (PRD v3).
 *
 * Sebelum migrasi ini paket pelanggan hanya tiga kolom teks di `customers`,
 * sehingga sisa sesi tidak dapat dihitung dan tidak dapat divalidasi. Empat
 * tabel di bawah memisahkan katalog paket, paket milik pelanggan, catatan
 * pemakaian sesi, dan hasil klasifikasi prioritas.
 */

export const up = (pgm) => {
  // Instalasi lama memakai satu tabel datar `session_packages` dari migrasi yang
  // filenya tidak ada di repo. Rancangan itu digantikan skema PRD v3: katalog
  // paket terpisah, pemakaian sesi tercatat per baris. Dibuang lebih dulu, dan
  // IF EXISTS agar instalasi bersih juga bisa menjalankan migrasi ini.
  pgm.sql('ALTER TABLE reminders DROP COLUMN IF EXISTS package_id');
  pgm.sql('DROP TABLE IF EXISTS session_packages');

  pgm.createTable('packages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(120)',
      notNull: true,
    },
    category: {
      type: 'varchar(30)',
      notNull: true,
    },
    // Tipe jadwal yang memakai sesi paket ini. Disimpan sebagai data agar
    // pencocokan kehadiran ke paket tidak menjadi tabel terjemahan di kode.
    schedule_type: {
      type: 'varchar(30)',
      notNull: true,
    },
    session_count: {
      type: 'integer',
      notNull: true,
    },
    price: {
      type: 'integer',
      notNull: true,
    },
    validity_days: {
      type: 'integer',
      notNull: true,
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('packages', 'packages_category_check', {
    check: "category IN ('group_class', 'personal_training', 'trial', 'open_gym')",
  });
  pgm.addConstraint('packages', 'packages_schedule_type_check', {
    check: "schedule_type IN ('group_class', 'personal_training')",
  });
  pgm.addConstraint('packages', 'packages_session_count_check', {
    check: 'session_count > 0',
  });
  pgm.addConstraint('packages', 'packages_price_check', {
    check: 'price >= 0',
  });
  pgm.addConstraint('packages', 'packages_validity_days_check', {
    check: 'validity_days > 0',
  });
  pgm.addConstraint('packages', 'packages_name_unique', {
    unique: ['name'],
  });

  pgm.createTable('customer_packages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    package_id: {
      type: 'uuid',
      notNull: true,
      references: 'packages',
      onDelete: 'RESTRICT',
    },
    total_sessions: {
      type: 'integer',
      notNull: true,
    },
    used_sessions: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    purchased_at: {
      type: 'date',
      notNull: true,
    },
    // Masa berlaku paket non-trial dihitung sejak booking pertama, bukan sejak
    // pembelian, sehingga kedua kolom ini baru terisi saat sesi pertama dipakai.
    started_at: {
      type: 'date',
    },
    expires_at: {
      type: 'date',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('customer_packages', 'customer_packages_status_check', {
    check: "status IN ('active', 'used_up', 'expired', 'cancelled')",
  });
  pgm.addConstraint('customer_packages', 'customer_packages_total_sessions_check', {
    check: 'total_sessions > 0',
  });
  // Sisa sesi tidak boleh negatif. Dijaga database, bukan hanya kode aplikasi,
  // agar jalur tulis mana pun ikut terikat aturan yang sama.
  pgm.addConstraint('customer_packages', 'customer_packages_used_sessions_check', {
    check: 'used_sessions >= 0 AND used_sessions <= total_sessions',
  });
  pgm.addConstraint('customer_packages', 'customer_packages_period_check', {
    check: 'started_at IS NULL OR expires_at IS NULL OR expires_at >= started_at',
  });
  pgm.createIndex('customer_packages', ['customer_id', 'status']);
  pgm.createIndex('customer_packages', 'expires_at');

  pgm.createTable('package_session_usages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    customer_package_id: {
      type: 'uuid',
      notNull: true,
      references: 'customer_packages',
      onDelete: 'RESTRICT',
    },
    attendance_id: {
      type: 'uuid',
      references: 'attendances',
      onDelete: 'SET NULL',
    },
    used_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    recorded_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Satu kehadiran memakai paling banyak satu sesi. Mencegah pengurangan ganda
  // bila pencatatan kehadiran diulang.
  pgm.createIndex('package_session_usages', 'attendance_id', {
    unique: true,
    where: 'attendance_id IS NOT NULL',
  });
  pgm.createIndex('package_session_usages', 'customer_package_id');

  pgm.createTable('prediction_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
    },
    score: {
      type: 'numeric(5,4)',
    },
    model_version: {
      type: 'varchar(60)',
      notNull: true,
    },
    // Membedakan keluaran model dari keluaran aturan sederhana, karena evaluasi
    // menuntut keduanya dilaporkan berdampingan.
    source: {
      type: 'varchar(20)',
      notNull: true,
      default: 'baseline',
    },
    features: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    predicted_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('prediction_logs', 'prediction_logs_priority_check', {
    check: "priority IN ('low', 'medium', 'high')",
  });
  pgm.addConstraint('prediction_logs', 'prediction_logs_source_check', {
    check: "source IN ('model', 'baseline')",
  });
  pgm.addConstraint('prediction_logs', 'prediction_logs_score_check', {
    check: 'score IS NULL OR (score >= 0 AND score <= 1)',
  });
  pgm.createIndex('prediction_logs', ['customer_id', 'predicted_at']);

  // Pengingat paket adalah jenis reminder baru, dan satu paket hanya boleh
  // memicu satu pengingat agar pelanggan tidak dihubungi berulang.
  pgm.addColumns('reminders', {
    customer_package_id: {
      type: 'uuid',
      references: 'customer_packages',
      onDelete: 'SET NULL',
    },
  });
  pgm.dropConstraint('reminders', 'reminders_type_check');
  pgm.addConstraint('reminders', 'reminders_type_check', {
    check: "type IN ('schedule', 'followup', 'general', 'package')",
  });
  // Pengingat paket dibuat H-7, yaitu 10080 menit sebelum tanggal berakhir.
  pgm.dropConstraint('reminders', 'reminders_lead_minutes_check');
  pgm.addConstraint('reminders', 'reminders_lead_minutes_check', {
    check: 'lead_minutes IN (120, 1440, 10080)',
  });
  pgm.createIndex('reminders', 'customer_package_id', {
    unique: true,
    where: 'customer_package_id IS NOT NULL',
  });

  // Katalog paket Gymnasyum sesuai PRD v3. Data acuan, bukan data operasional,
  // sehingga ikut migrasi agar sama di setiap instalasi.
  pgm.sql(`
    INSERT INTO packages (name, category, schedule_type, session_count, price, validity_days)
    VALUES
      ('Group Class Regular 4 Sesi', 'group_class', 'group_class', 4, 600000, 45),
      ('Group Class Regular 8 Sesi', 'group_class', 'group_class', 8, 1200000, 45),
      ('Group Class Regular 12 Sesi', 'group_class', 'group_class', 12, 1800000, 60),
      ('Personal Training Junior Coach 8 Sesi', 'personal_training', 'personal_training', 8, 3200000, 45),
      ('Trial Personal Training Junior Coach', 'trial', 'personal_training', 1, 400000, 7),
      ('Open Gym 4 Sesi', 'open_gym', 'group_class', 4, 500000, 30)
    ON CONFLICT (name) DO NOTHING
  `);
};

export const down = (pgm) => {
  pgm.dropIndex('reminders', 'customer_package_id', { unique: true });
  pgm.dropConstraint('reminders', 'reminders_lead_minutes_check');
  pgm.addConstraint('reminders', 'reminders_lead_minutes_check', {
    check: 'lead_minutes IN (120, 1440)',
  });
  pgm.dropConstraint('reminders', 'reminders_type_check');
  pgm.addConstraint('reminders', 'reminders_type_check', {
    check: "type IN ('schedule', 'followup', 'general')",
  });
  pgm.dropColumns('reminders', ['customer_package_id']);
  pgm.dropTable('prediction_logs');
  pgm.dropTable('package_session_usages');
  pgm.dropTable('customer_packages');
  pgm.dropTable('packages');
};
