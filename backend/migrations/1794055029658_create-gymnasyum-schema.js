/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    // 1. USERS
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    email: {
      type: 'varchar(150)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('admin', 'spv', 'staff')",
  });

  // 2. CUSTOMERS
  pgm.createTable('customers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(150)',
      notNull: true,
    },
    email: {
      type: 'varchar(150)',
    },
    phone: {
      type: 'varchar(30)',
      notNull: true,
    },
    gender: {
      type: 'varchar(20)',
    },
    address: {
      type: 'text',
    },
    notes: {
      type: 'text',
    },
    membership_package: {
      type: 'varchar(100)',
      notNull: true,
    },
    membership_start: {
      type: 'date',
    },
    membership_end: {
      type: 'date',
      notNull: true,
    },
    contact_permission: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    pic_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
    },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('customers', 'customers_gender_check', {
    check: "gender IS NULL OR gender IN ('male', 'female', 'other')",
  });

  pgm.addConstraint('customers', 'customers_status_check', {
    check: "status IN ('active', 'inactive')",
  });

  pgm.addConstraint('customers', 'customers_membership_dates_check', {
    check: 'membership_start IS NULL OR membership_start <= membership_end',
  });

  pgm.createIndex('customers', 'name');
  pgm.createIndex('customers', 'phone');
  pgm.createIndex('customers', 'email', { unique: true });
  pgm.createIndex('customers', 'pic_id');

  // 3. SCHEDULES
  pgm.createTable('schedules', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'varchar(150)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    type: {
      type: 'varchar(30)',
      notNull: true,
    },
    customer_id: {
      type: 'uuid',
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    trainer_name: {
      type: 'varchar(150)',
    },
    location: {
      type: 'varchar(150)',
    },
    starts_at: {
      type: 'timestamptz',
      notNull: true,
    },
    ends_at: {
      type: 'timestamptz',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'scheduled',
    },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('schedules', 'schedules_type_check', {
    check: "type IN ('group_class', 'personal_training')",
  });

  pgm.addConstraint('schedules', 'schedules_status_check', {
    check: "status IN ('scheduled', 'completed', 'cancelled')",
  });

  pgm.addConstraint('schedules', 'schedules_time_check', {
    check: 'ends_at > starts_at',
  });

  pgm.addConstraint('schedules', 'schedules_customer_type_check', {
    check: `
      (type = 'personal_training' AND customer_id IS NOT NULL)
      OR
      (type = 'group_class' AND customer_id IS NULL)
    `,
  });

  pgm.createIndex('schedules', 'starts_at');
  pgm.createIndex('schedules', 'status');
  pgm.createIndex('schedules', 'type');

  // 4. SCHEDULE MEMBERS
  // Peserta Group Class. Jumlah peserta tidak dibatasi.
  pgm.createTable('schedule_members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    schedule_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedules',
      onDelete: 'CASCADE',
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('schedule_members', 'schedule_members_unique', {
    unique: ['schedule_id', 'customer_id'],
  });

  pgm.createIndex('schedule_members', 'customer_id');

  // 5. ATTENDANCES
  pgm.createTable('attendances', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    schedule_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedules',
      onDelete: 'CASCADE',
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'present',
    },
    checked_in_at: {
      type: 'timestamptz',
    },
    notes: {
      type: 'text',
    },
    recorded_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('attendances', 'attendances_status_check', {
    check: "status IN ('present', 'absent', 'late', 'excused')",
  });

  pgm.addConstraint('attendances', 'attendances_schedule_customer_unique', {
    unique: ['schedule_id', 'customer_id'],
  });

  pgm.createIndex('attendances', 'customer_id');
  pgm.createIndex('attendances', 'status');

  // 6. REMINDERS
  pgm.createTable('reminders', {
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
    schedule_id: {
      type: 'uuid',
      references: 'schedules',
      onDelete: 'SET NULL',
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
    },
    channel: {
      type: 'varchar(20)',
      notNull: true,
      default: 'manual',
    },
    message: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'scheduled',
    },
    scheduled_at: {
      type: 'timestamptz',
    },
    sent_at: {
      type: 'timestamptz',
    },
    responded_at: {
      type: 'timestamptz',
    },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('reminders', 'reminders_type_check', {
    check: "type IN ('schedule', 'followup', 'general')",
  });

  pgm.addConstraint('reminders', 'reminders_channel_check', {
    check: "channel IN ('manual', 'email', 'whatsapp', 'in_app')",
  });

  pgm.addConstraint('reminders', 'reminders_status_check', {
    check: "status IN ('scheduled', 'sent', 'responded', 'no_response')",
  });

  pgm.createIndex('reminders', 'customer_id');
  pgm.createIndex('reminders', 'schedule_id');
  pgm.createIndex('reminders', 'status');
  pgm.createIndex('reminders', 'scheduled_at');

  // 7. FOLLOWUPS
  pgm.createTable('followups', {
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
    reminder_id: {
      type: 'uuid',
      references: 'reminders',
      onDelete: 'SET NULL',
    },
    subject: {
      type: 'varchar(150)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: 'normal',
    },
    due_at: {
      type: 'timestamptz',
    },
    completed_at: {
      type: 'timestamptz',
    },
    assigned_to: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('followups', 'followups_status_check', {
    check: "status IN ('pending', 'in_progress', 'completed', 'no_response')",
  });

  pgm.addConstraint('followups', 'followups_priority_check', {
    check: "priority IN ('low', 'normal', 'high')",
  });

  pgm.createIndex('followups', 'customer_id');
  pgm.createIndex('followups', 'status');
  pgm.createIndex('followups', 'assigned_to');
  pgm.createIndex('followups', 'due_at');

  // 8. SESSIONS
  // Refresh token disimpan dalam bentuk hash, bukan token asli.
  pgm.createTable('sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    refresh_token_hash: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    revoked_at: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('sessions', 'user_id');
  pgm.createIndex('sessions', 'expires_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('sessions');
  pgm.dropTable('followups');
  pgm.dropTable('reminders');
  pgm.dropTable('attendances');
  pgm.dropTable('schedule_members');
  pgm.dropTable('schedules');
  pgm.dropTable('customers');
  pgm.dropTable('users');
};
