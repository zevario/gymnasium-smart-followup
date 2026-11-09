import pool from '../../database/pool.js';

const getSummary = async ({ from, to }) => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int
        FROM reminders
        WHERE scheduled_at >= $1 AND scheduled_at < $2
          AND status = 'scheduled') AS "scheduledReminders",
       (SELECT COUNT(*)::int
        FROM reminders
        WHERE sent_at >= $1 AND sent_at < $2) AS "sentReminders",
       (SELECT COUNT(*)::int
        FROM reminders
        WHERE responded_at >= $1 AND responded_at < $2) AS "responsesReceived",
       (SELECT COUNT(*)::int
        FROM reminders
        WHERE status = 'no_response'
          AND updated_at >= $1 AND updated_at < $2) AS "noResponse",
       (SELECT COUNT(*)::int
        FROM followups
        WHERE status = 'completed'
          AND completed_at >= $1 AND completed_at < $2) AS "completedFollowups",
       (SELECT COUNT(*)::int
        FROM followups
        WHERE status = 'postponed'
          AND updated_at >= $1 AND updated_at < $2) AS "postponedFollowups",
       (SELECT COUNT(DISTINCT customer_id)::int
        FROM (
          SELECT customer_id
          FROM followup_recommendations
          WHERE priority = 'high'
            AND status IN ('pending', 'approved')
            AND created_at >= $1 AND created_at < $2
          UNION
          SELECT customer_id
          FROM followups
          WHERE priority = 'high'
            AND status IN ('pending', 'in_progress', 'no_response', 'postponed')
            AND created_at >= $1 AND created_at < $2
        ) high_priority) AS "highPriorityMembers"`,
    [from, to],
  );
  return result.rows[0];
};

const getStaffActivity = async ({ from, to }) => {
  const result = await pool.query(
    `WITH activity AS (
       SELECT event.performed_by AS user_id,
         COUNT(*) FILTER (WHERE event.event_type = 'activity')::int AS contacts,
         COUNT(*) FILTER (WHERE event.event_type = 'status')::int AS status_changes,
         0::int AS reminders_sent
       FROM followup_events event
       WHERE event.created_at >= $1 AND event.created_at < $2
         AND event.performed_by IS NOT NULL
       GROUP BY event.performed_by
       UNION ALL
       SELECT reminder.sent_by AS user_id,
         0::int, 0::int, COUNT(*)::int
       FROM reminders reminder
       WHERE reminder.sent_at >= $1 AND reminder.sent_at < $2
         AND reminder.sent_by IS NOT NULL
       GROUP BY reminder.sent_by
     )
     SELECT staff_user.id AS "userId", staff_user.name, staff_user.role,
       SUM(activity.contacts)::int AS contacts,
       SUM(activity.status_changes)::int AS "statusChanges",
       SUM(activity.reminders_sent)::int AS "remindersSent",
       SUM(activity.contacts + activity.status_changes
         + activity.reminders_sent)::int AS total
     FROM activity
     JOIN users staff_user ON staff_user.id = activity.user_id
     GROUP BY staff_user.id
     ORDER BY total DESC, staff_user.name`,
    [from, to],
  );
  return result.rows;
};

const getTrends = async ({ from, to }) => {
  const result = await pool.query(
    `WITH daily AS (
       SELECT DATE(event.created_at) AS date,
         COUNT(*) FILTER (WHERE event.event_type = 'activity')::int AS contacts,
         COUNT(*) FILTER (WHERE event.event_type = 'status')::int AS followup_status_changes,
         0::int AS reminders_sent,
         0::int AS responses_received
       FROM followup_events event
       WHERE event.created_at >= $1 AND event.created_at < $2
       GROUP BY DATE(event.created_at)
       UNION ALL
       SELECT DATE(reminder.sent_at), 0, 0, COUNT(*)::int, 0
       FROM reminders reminder
       WHERE reminder.sent_at >= $1 AND reminder.sent_at < $2
       GROUP BY DATE(reminder.sent_at)
       UNION ALL
       SELECT DATE(reminder.responded_at), 0, 0, 0, COUNT(*)::int
       FROM reminders reminder
       WHERE reminder.responded_at >= $1 AND reminder.responded_at < $2
       GROUP BY DATE(reminder.responded_at)
     )
     SELECT date,
       SUM(contacts)::int AS contacts,
       SUM(followup_status_changes)::int AS "followupStatusChanges",
       SUM(reminders_sent)::int AS "remindersSent",
       SUM(responses_received)::int AS "responsesReceived"
     FROM daily
     GROUP BY date
     ORDER BY date`,
    [from, to],
  );
  return result.rows;
};

const getReport = async ({ from, to }) => {
  const [summary, staffActivity, trends] = await Promise.all([
    getSummary({ from, to }),
    getStaffActivity({ from, to }),
    getTrends({ from, to }),
  ]);
  return { summary, staffActivity, trends, from, to };
};

const ReportRepositories = { getReport };

export default ReportRepositories;
