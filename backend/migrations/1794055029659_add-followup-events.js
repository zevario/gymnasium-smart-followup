/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.dropConstraint('followups', 'followups_status_check');
  pgm.addConstraint('followups', 'followups_status_check', {
    check: "status IN ('pending', 'in_progress', 'completed', 'no_response', 'postponed', 'blocked')",
  });

  pgm.createTable('followup_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'CASCADE',
    },
    event_type: {
      type: 'varchar(20)',
      notNull: true,
    },
    previous_status: {
      type: 'varchar(20)',
    },
    new_status: {
      type: 'varchar(20)',
    },
    channel: {
      type: 'varchar(30)',
    },
    note: {
      type: 'text',
    },
    result: {
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

  pgm.addConstraint('followup_events', 'followup_events_type_check', {
    check: "event_type IN ('status', 'activity')",
  });
  pgm.createIndex('followup_events', ['customer_id', 'created_at']);
};

/**
 * Keep the expanded status constraint on rollback: newer status values may
 * already be stored, and narrowing it would make rollback destructive.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('followup_events');
};
