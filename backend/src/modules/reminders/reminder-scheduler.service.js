import pool from '../../database/pool.js';
import RecommendationService from '../followups/recommendation.service.js';

const appendScheduleEvent = async (client, reminder, eventType, newStatus, note) => {
  await client.query(
    `INSERT INTO reminder_events
       (reminder_id, customer_id, pic_id, event_type, previous_status,
        new_status, approval_status, message_snapshot, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      reminder.id,
      reminder.customer_id,
      reminder.pic_id,
      eventType,
      reminder.status,
      newStatus,
      reminder.approval_status,
      reminder.message,
      note,
    ],
  );
};

const reconcileScheduleReminders = async (client, scheduleId, { invalidateDraft = false } = {}) => {
  const scheduleResult = await client.query(
    `SELECT id, title, type, customer_id, starts_at, status,
       reminder_2h_enabled, created_by
     FROM schedules
     WHERE id = $1`,
    [scheduleId],
  );
  if (!scheduleResult.rowCount) return;
  const schedule = scheduleResult.rows[0];
  const existingResult = await client.query(
    `SELECT reminder.id, reminder.customer_id, customer.pic_id,
       reminder.status, reminder.approval_status, reminder.message,
       reminder.scheduled_at, reminder.lead_minutes
     FROM reminders reminder
     JOIN customers customer ON customer.id = reminder.customer_id
     WHERE reminder.schedule_id = $1 AND reminder.status = 'scheduled'
     FOR UPDATE`,
    [scheduleId],
  );
  const participantsResult = await client.query(
    `SELECT customer.id
     FROM customers customer
     WHERE customer.status = 'active'
       AND (
         ($2 = 'personal_training' AND customer.id = $3)
         OR
         ($2 = 'group_class' AND EXISTS (
           SELECT 1 FROM schedule_members member
           WHERE member.schedule_id = $1 AND member.customer_id = customer.id
         ))
       )
       AND customer.contact_permission = TRUE`,
    [scheduleId, schedule.type, schedule.customer_id],
  );
  const participants = new Map(participantsResult.rows.map((row) => [row.id, row]));

  for (const reminder of existingResult.rows) {
    const participant = participants.get(reminder.customer_id);
    const leadDisabled = reminder.lead_minutes === 120 && !schedule.reminder_2h_enabled;
    if (schedule.status !== 'scheduled' || !participant || leadDisabled) {
      await client.query(
        `UPDATE reminders
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [reminder.id],
      );
      await appendScheduleEvent(
        client,
        reminder,
        'cancelled',
        'cancelled',
        schedule.status === 'cancelled'
          ? 'Schedule was cancelled.'
          : 'Schedule membership or reminder option changed.',
      );
      continue;
    }

    const nextScheduledAt = new Date(
      new Date(schedule.starts_at).getTime() - reminder.lead_minutes * 60_000,
    );
    const currentScheduledAt = reminder.scheduled_at ? new Date(reminder.scheduled_at) : null;
    const dateChanged =
      !currentScheduledAt || currentScheduledAt.getTime() !== nextScheduledAt.getTime();
    if (dateChanged || invalidateDraft) {
      await client.query(
        `UPDATE reminders
         SET scheduled_at = $1,
             message = NULL,
             approval_status = 'pending',
             approved_by = NULL,
             approved_at = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [nextScheduledAt, reminder.id],
      );
      await appendScheduleEvent(
        client,
        reminder,
        'rescheduled',
        'scheduled',
        'Schedule details changed; reminder requires a new review.',
      );
    }
  }
};

const createUpcomingReminders = async (client) => {
  const result = await client.query(
    `WITH due_candidates AS (
       SELECT schedule.id AS schedule_id,
         participant.customer_id,
         participant.pic_id,
         schedule.created_by,
         schedule.starts_at,
         1440::integer AS lead_minutes
       FROM schedules schedule
       JOIN LATERAL (
         SELECT member.customer_id, customer.pic_id
         FROM schedule_members member
         JOIN customers customer ON customer.id = member.customer_id
         WHERE member.schedule_id = schedule.id
           AND customer.status = 'active'
           AND customer.contact_permission = TRUE
         UNION ALL
         SELECT customer.id, customer.pic_id
         FROM customers customer
         WHERE schedule.type = 'personal_training'
           AND customer.id = schedule.customer_id
           AND customer.status = 'active'
           AND customer.contact_permission = TRUE
       ) participant ON TRUE
       WHERE schedule.status = 'scheduled'
         AND schedule.starts_at > NOW()
         AND schedule.starts_at <= NOW() + INTERVAL '24 hours'
       UNION ALL
       SELECT schedule.id,
         participant.customer_id,
         participant.pic_id,
         schedule.created_by,
         schedule.starts_at,
         120::integer
       FROM schedules schedule
       JOIN LATERAL (
         SELECT member.customer_id, customer.pic_id
         FROM schedule_members member
         JOIN customers customer ON customer.id = member.customer_id
         WHERE member.schedule_id = schedule.id
           AND customer.status = 'active'
           AND customer.contact_permission = TRUE
         UNION ALL
         SELECT customer.id, customer.pic_id
         FROM customers customer
         WHERE schedule.type = 'personal_training'
           AND customer.id = schedule.customer_id
           AND customer.status = 'active'
           AND customer.contact_permission = TRUE
       ) participant ON TRUE
       WHERE schedule.status = 'scheduled'
         AND schedule.reminder_2h_enabled = TRUE
         AND schedule.starts_at > NOW()
         AND schedule.starts_at <= NOW() + INTERVAL '2 hours'
     ),
     eligible_candidates AS (
       SELECT due_candidates.*,
         CASE
           WHEN pic.is_active = TRUE AND pic.role = 'staff'
           THEN pic.id
           ELSE NULL
         END AS eligible_pic_id
       FROM due_candidates
       LEFT JOIN users pic ON pic.id = due_candidates.pic_id
     )
     INSERT INTO reminders
       (customer_id, schedule_id, type, channel, message, status, scheduled_at,
        lead_minutes, approval_status, assigned_to, created_by)
     SELECT customer_id, schedule_id, 'schedule', 'whatsapp', NULL,
       'scheduled',
       starts_at - make_interval(mins => lead_minutes),
       lead_minutes, 'pending', eligible_pic_id, created_by
     FROM eligible_candidates
     ON CONFLICT (schedule_id, customer_id, lead_minutes)
       WHERE schedule_id IS NOT NULL AND status = 'scheduled'
     DO NOTHING
     RETURNING id, customer_id, schedule_id, assigned_to`,
  );

  for (const reminder of result.rows) {
    const customer = await client.query('SELECT pic_id FROM customers WHERE id = $1', [
      reminder.customer_id,
    ]);
    await client.query(
      `INSERT INTO reminder_events
         (reminder_id, customer_id, pic_id, event_type, new_status, approval_status, note)
       VALUES ($1, $2, $3, 'created', 'scheduled', 'pending', $4)`,
      [
        reminder.id,
        reminder.customer_id,
        customer.rows[0]?.pic_id || null,
        'Automatically generated schedule reminder; approval is required.',
      ],
    );
  }
};

const moveSentRemindersToNoResponse = async (client) => {
  const result = await client.query(
    `UPDATE reminders
     SET status = 'no_response', updated_at = NOW()
     WHERE status = 'sent'
       AND sent_at <= NOW() - INTERVAL '24 hours'
     RETURNING id, customer_id, assigned_to, message`,
  );
  for (const reminder of result.rows) {
    await client.query(
      `INSERT INTO reminder_events
         (reminder_id, customer_id, pic_id, event_type, previous_status,
          new_status, approval_status, message_snapshot, note, performed_by)
       SELECT $1, $2, customer.pic_id, 'no_response', 'sent', 'no_response',
         'approved', $3, 'No customer response recorded within 24 hours.', NULL
       FROM customers customer
       WHERE customer.id = $2`,
      [reminder.id, reminder.customer_id, reminder.message],
    );
  }
};

const createDailyStaffDigests = async (client) => {
  const localTime = await client.query(
    `SELECT (NOW() AT TIME ZONE 'Asia/Jakarta')::date AS local_date,
       (NOW() AT TIME ZONE 'Asia/Jakarta')::time AS local_time`,
  );
  if (localTime.rows[0].local_time < '08:00:00') return;

  await client.query(
    `INSERT INTO staff_notifications
       (user_id, notification_type, notification_date, title, payload)
     SELECT staff.id,
       'daily_digest',
       (NOW() AT TIME ZONE 'Asia/Jakarta')::date,
       'Ringkasan pekerjaan harian',
       jsonb_build_object(
         'pendingApproval', (
           SELECT COUNT(*)::int
           FROM reminders reminder
           WHERE reminder.assigned_to = staff.id
             AND reminder.approval_status = 'pending'
             AND reminder.status = 'scheduled'
         ),
         'notSent', (
           SELECT COUNT(*)::int
           FROM reminders reminder
           WHERE reminder.assigned_to = staff.id
             AND reminder.status = 'scheduled'
             AND reminder.approval_status = 'approved'
         ),
         'noResponse', (
           SELECT COUNT(*)::int
           FROM reminders reminder
           WHERE reminder.assigned_to = staff.id
             AND reminder.status = 'no_response'
         ),
         'postponedFollowups', (
           SELECT COUNT(*)::int
           FROM followups followup
           WHERE followup.assigned_to = staff.id
             AND followup.status = 'postponed'
         )
       )
     FROM users staff
     WHERE staff.role = 'staff' AND staff.is_active = TRUE
     ON CONFLICT (user_id, notification_type, notification_date)
     DO NOTHING`,
  );
};

let isRunning = false;
let intervalHandle;

const runReminderScheduler = async () => {
  if (isRunning) return;
  isRunning = true;
  let client;
  let hasLock = false;
  try {
    client = await pool.connect();
    const lockResult = await client.query('SELECT pg_try_advisory_lock(1794055029660) AS locked');
    hasLock = lockResult.rows[0].locked;
    if (!hasLock) return;

    await client.query('BEGIN');
    await createUpcomingReminders(client);
    await moveSentRemindersToNoResponse(client);
    await RecommendationService.generateRecommendations(client);
    await createDailyStaffDigests(client);
    await client.query('COMMIT');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    try {
      if (client && hasLock) {
        await client.query('SELECT pg_advisory_unlock(1794055029660)');
      }
    } finally {
      if (client) client.release();
      isRunning = false;
    }
  }
};

const startReminderScheduler = () => {
  if (intervalHandle) return;
  const run = () => {
    runReminderScheduler().catch((error) => {
      console.error('Reminder scheduler failed:', error);
    });
  };
  run();
  intervalHandle = setInterval(run, 60_000);
};

const stopReminderScheduler = () => {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
};

const ReminderSchedulerService = {
  reconcileScheduleReminders,
  runReminderScheduler,
  startReminderScheduler,
  stopReminderScheduler,
};

export default ReminderSchedulerService;
