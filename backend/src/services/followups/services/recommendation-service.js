const generateRecommendations = async (client, customerIds = null) => {
  await client.query(
    `WITH visit_summary AS (
       SELECT attendance.customer_id,
         MAX(COALESCE(attendance.checked_in_at, attendance.created_at))
           FILTER (WHERE attendance.status IN ('present', 'late')) AS last_visit,
         COUNT(*) FILTER (
           WHERE attendance.status IN ('present', 'late')
             AND COALESCE(attendance.checked_in_at, attendance.created_at)
               >= NOW() - INTERVAL '30 days'
         )::int AS visits_last_30_days
       FROM attendances attendance
       GROUP BY attendance.customer_id
     ),
     no_response_summary AS (
       SELECT reminder.customer_id, COUNT(*)::int AS no_response_count
       FROM reminders reminder
       WHERE reminder.status = 'no_response'
       GROUP BY reminder.customer_id
     ),
     customer_activity AS (
       SELECT customer.id AS customer_id,
         customer.membership_end,
         visit_summary.last_visit,
         COALESCE(visit_summary.visits_last_30_days, 0) AS visits_last_30_days,
         COALESCE(no_response_summary.no_response_count, 0) AS no_response_count,
         (
           SELECT MIN(schedule.starts_at)
           FROM schedules schedule
           LEFT JOIN schedule_members member
             ON member.schedule_id = schedule.id
           WHERE schedule.status = 'scheduled'
             AND schedule.starts_at > NOW()
             AND (
               (schedule.type = 'personal_training'
                 AND schedule.customer_id = customer.id)
               OR
               (schedule.type = 'group_class'
                 AND member.customer_id = customer.id)
             )
         ) AS next_schedule_at
       FROM customers customer
       LEFT JOIN visit_summary ON visit_summary.customer_id = customer.id
       LEFT JOIN no_response_summary
         ON no_response_summary.customer_id = customer.id
       WHERE customer.status = 'active'
         AND customer.contact_permission = TRUE
         AND ($1::uuid[] IS NULL OR customer.id = ANY($1::uuid[]))
     ),
     signals AS (
       SELECT customer_activity.*,
         CASE
           WHEN membership_end < CURRENT_DATE
             OR membership_end <= CURRENT_DATE + 3
             OR last_visit <= NOW() - INTERVAL '30 days'
             OR no_response_count >= 2
             THEN 'high'
           WHEN membership_end <= CURRENT_DATE + 14
             OR last_visit <= NOW() - INTERVAL '14 days'
             OR no_response_count = 1
             OR COALESCE(visits_last_30_days, 0) <= 1
             THEN 'medium'
           ELSE 'low'
         END AS priority
       FROM customer_activity
     ),
     candidates AS (
       SELECT signals.*,
         CONCAT_WS(' ',
           CASE
             WHEN membership_end < CURRENT_DATE
               THEN 'Membership sudah berakhir.'
             WHEN membership_end <= CURRENT_DATE + 14
               THEN 'Membership berakhir pada '
                 || TO_CHAR(membership_end, 'DD Mon YYYY') || '.'
           END,
           CASE
             WHEN last_visit IS NULL
               THEN 'Belum ada riwayat kunjungan.'
             WHEN last_visit <= NOW() - INTERVAL '14 days'
               THEN 'Kunjungan terakhir '
                 || TO_CHAR(last_visit, 'DD Mon YYYY') || '.'
           END,
           CASE
             WHEN no_response_count > 0
               THEN no_response_count::text
                 || ' reminder sebelumnya belum mendapat respons.'
           END,
           CASE
             WHEN COALESCE(visits_last_30_days, 0) <= 1
               THEN COALESCE(visits_last_30_days, 0)::text
                 || ' kunjungan dalam 30 hari terakhir.'
             WHEN visits_last_30_days <= 3
               THEN visits_last_30_days::text
                 || ' kunjungan dalam 30 hari terakhir.'
           END
         ) AS reason,
         CASE
           WHEN membership_end <= CURRENT_DATE + 14
             THEN 'Hubungi untuk perpanjangan'
           WHEN no_response_count > 0
             THEN 'Tindak lanjuti reminder yang belum mendapat respons'
           WHEN last_visit IS NULL OR last_visit <= NOW() - INTERVAL '14 days'
             THEN 'Evaluasi pelanggan yang tidak aktif'
           ELSE 'Pantau aktivitas kunjungan'
         END AS recommended_action,
         jsonb_build_object(
           'membershipEnd', membership_end,
           'lastVisit', last_visit,
           'visitsLast30Days', COALESCE(visits_last_30_days, 0),
           'noResponseCount', no_response_count,
           'nextScheduleAt', next_schedule_at,
           'classificationMethod', 'rule-based'
         ) AS source_snapshot
       FROM signals
       WHERE membership_end <= CURRENT_DATE + 30
         OR last_visit IS NULL
         OR last_visit <= NOW() - INTERVAL '7 days'
         OR no_response_count > 0
         OR COALESCE(visits_last_30_days, 0) <= 3
     )
     INSERT INTO followup_recommendations
       (customer_id, status, priority, reason, recommended_action,
        source_snapshot, assigned_to)
     SELECT candidates.customer_id, 'pending', candidates.priority,
       COALESCE(NULLIF(candidates.reason, ''), 'Aktivitas pelanggan perlu ditinjau.'),
       candidates.recommended_action,
       candidates.source_snapshot,
       CASE
         WHEN pic.is_active = TRUE AND pic.role = 'staff' THEN pic.id
         ELSE NULL
       END
     FROM candidates
     JOIN customers customer ON customer.id = candidates.customer_id
     LEFT JOIN users pic ON pic.id = customer.pic_id
     WHERE NOT EXISTS (
       SELECT 1
       FROM followups followup
       WHERE followup.customer_id = candidates.customer_id
         AND followup.status IN ('pending', 'in_progress', 'no_response', 'postponed')
     )
       AND NOT EXISTS (
         SELECT 1
         FROM followups followup
         WHERE followup.customer_id = candidates.customer_id
           AND followup.status = 'completed'
           AND followup.updated_at >= NOW() - INTERVAL '30 days'
       )
       AND NOT EXISTS (
         SELECT 1
         FROM followup_recommendations recommendation
         WHERE recommendation.customer_id = candidates.customer_id
           AND recommendation.created_at >= NOW() - INTERVAL '30 days'
           AND recommendation.status <> 'pending'
       )
     ON CONFLICT (customer_id) WHERE status = 'pending'
     DO UPDATE SET
       priority = EXCLUDED.priority,
       reason = EXCLUDED.reason,
       recommended_action = EXCLUDED.recommended_action,
       source_snapshot = EXCLUDED.source_snapshot,
       draft_message = NULL,
       updated_at = NOW()
     WHERE followup_recommendations.source_snapshot
       IS DISTINCT FROM EXCLUDED.source_snapshot`,
    [customerIds],
  );
};

const RecommendationService = { generateRecommendations };

export default RecommendationService;
