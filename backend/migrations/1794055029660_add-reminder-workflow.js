/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn('schedules', {
    reminder_2h_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });

  pgm.dropConstraint('reminders', 'reminders_status_check');
  pgm.addConstraint('reminders', 'reminders_status_check', {
    check: "status IN ('scheduled', 'sent', 'responded', 'no_response', 'cancelled')",
  });
  pgm.alterColumn('reminders', 'message', {
    notNull: false,
  });
  pgm.addColumns('reminders', {
    lead_minutes: {
      type: 'integer',
      notNull: true,
      default: 1440,
    },
    approval_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    assigned_to: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    approved_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    approved_at: {
      type: 'timestamptz',
    },
    sent_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
  });

  pgm.addConstraint('reminders', 'reminders_lead_minutes_check', {
    check: 'lead_minutes IN (120, 1440)',
  });
  pgm.addConstraint('reminders', 'reminders_approval_status_check', {
    check: "approval_status IN ('pending', 'approved', 'rejected')",
  });
  pgm.createIndex(
    'reminders',
    ['schedule_id', 'customer_id', 'lead_minutes'],
    {
      name: 'reminders_schedule_customer_lead_unique',
      unique: true,
      where: "schedule_id IS NOT NULL AND status = 'scheduled'",
    },
  );
  pgm.createIndex('reminders', ['assigned_to', 'status']);
  pgm.createIndex('reminders', ['approval_status', 'scheduled_at']);

  pgm.createTable('reminder_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    reminder_id: {
      type: 'uuid',
      notNull: true,
      references: 'reminders',
      onDelete: 'RESTRICT',
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    pic_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    event_type: {
      type: 'varchar(30)',
      notNull: true,
    },
    previous_status: {
      type: 'varchar(20)',
    },
    new_status: {
      type: 'varchar(20)',
    },
    approval_status: {
      type: 'varchar(20)',
    },
    message_snapshot: {
      type: 'text',
    },
    note: {
      type: 'text',
    },
    performed_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.addConstraint('reminder_events', 'reminder_events_type_check', {
    check: "event_type IN ('created', 'draft_updated', 'approved', 'rejected', 'assigned', 'staff_approved', 'sent', 'responded', 'no_response', 'cancelled', 'rescheduled')",
  });
  pgm.createIndex('reminder_events', ['reminder_id', 'created_at']);
  pgm.createIndex('reminder_events', ['customer_id', 'created_at']);

  pgm.addColumns('followup_events', {
    pic_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    followup_id: {
      type: 'uuid',
      references: 'followups',
      onDelete: 'SET NULL',
    },
  });
  pgm.dropConstraint('followup_events', 'followup_events_type_check');
  pgm.addConstraint('followup_events', 'followup_events_type_check', {
    check: "event_type IN ('status', 'activity', 'recommendation', 'approved', 'assigned')",
  });

  pgm.addColumns('followups', {
    draft_message: {
      type: 'text',
    },
    approved_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    approved_at: {
      type: 'timestamptz',
    },
  });

  pgm.createTable('followup_recommendations', {
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
    followup_id: {
      type: 'uuid',
      references: 'followups',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
    },
    reason: {
      type: 'text',
      notNull: true,
    },
    recommended_action: {
      type: 'varchar(150)',
      notNull: true,
    },
    source_snapshot: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    assigned_to: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    draft_message: {
      type: 'text',
    },
    reviewed_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    reviewed_at: {
      type: 'timestamptz',
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
  pgm.addConstraint(
    'followup_recommendations',
    'followup_recommendations_status_check',
    {
      check: "status IN ('pending', 'approved', 'dismissed')",
    },
  );
  pgm.addConstraint(
    'followup_recommendations',
    'followup_recommendations_priority_check',
    {
      check: "priority IN ('low', 'medium', 'high')",
    },
  );
  pgm.createIndex(
    'followup_recommendations',
    ['customer_id'],
    {
      name: 'followup_recommendations_pending_customer_unique',
      unique: true,
      where: "status = 'pending'",
    },
  );
  pgm.createIndex(
    'followup_recommendations',
    ['status', 'priority', 'created_at'],
  );

  pgm.createTable('staff_notifications', {
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
    notification_type: {
      type: 'varchar(30)',
      notNull: true,
    },
    notification_date: {
      type: 'date',
      notNull: true,
    },
    title: {
      type: 'varchar(150)',
      notNull: true,
    },
    payload: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    read_at: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.addConstraint('staff_notifications', 'staff_notifications_type_check', {
    check: "notification_type IN ('daily_digest')",
  });
  pgm.addConstraint('staff_notifications', 'staff_notifications_user_date_unique', {
    unique: ['user_id', 'notification_type', 'notification_date'],
  });
  pgm.createIndex('staff_notifications', ['user_id', 'created_at']);
};

/**
 * This workflow migration is intentionally not reversible: rolling it back
 * would discard reminder/follow-up audit history and could invalidate statuses.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = () => {};
