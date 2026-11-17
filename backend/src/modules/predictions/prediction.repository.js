import pool from '../../database/pool.js';

/**
 * Fitur per pelanggan untuk klasifikasi prioritas.
 *
 * Hanya memakai data yang benar-benar ada di aplikasi, agar inference tidak
 * meminta nilai yang tidak bisa disediakan backend. Usia, gender, alamat, dan
 * harga paket sengaja tidak diambil: batasan persona pada PRD melarangnya.
 */
const collectFeatures = async (client = pool) => {
  const result = await client.query(
    `WITH visit_stats AS (
       SELECT attendance.customer_id,
         COUNT(*) FILTER (
           WHERE attendance.status IN ('present', 'late')
             AND COALESCE(attendance.checked_in_at, attendance.created_at)
               >= NOW() - INTERVAL '30 days'
         )::int AS visits_30_days,
         COUNT(*) FILTER (WHERE attendance.status = 'excused')::int AS reschedules,
         COUNT(*) FILTER (WHERE attendance.status IN ('present', 'late'))::int AS attended,
         COUNT(*)::int AS booked,
         MAX(COALESCE(attendance.checked_in_at, attendance.created_at))
           FILTER (WHERE attendance.status IN ('present', 'late')) AS last_visit
       FROM attendances attendance
       GROUP BY attendance.customer_id
     ),
     reminder_stats AS (
       SELECT reminder.customer_id,
         COUNT(*) FILTER (WHERE reminder.status = 'no_response')::int AS no_responses,
         COUNT(*) FILTER (WHERE reminder.status = 'responded')::int AS responses,
         COUNT(*) FILTER (WHERE reminder.sent_at IS NOT NULL)::int AS sent
       FROM reminders reminder
       GROUP BY reminder.customer_id
     ),
     package_stats AS (
       SELECT DISTINCT ON (customer_package.customer_id)
         customer_package.customer_id,
         customer_package.total_sessions - customer_package.used_sessions AS remaining_sessions,
         (customer_package.expires_at - CURRENT_DATE)::int AS days_to_expiry
       FROM customer_packages customer_package
       WHERE customer_package.status = 'active'
       ORDER BY customer_package.customer_id, customer_package.expires_at NULLS LAST
     )
     SELECT customer.id AS "customerId",
       COALESCE(visit_stats.visits_30_days, 0) AS "visits30Days",
       CASE
         WHEN visit_stats.last_visit IS NULL THEN NULL
         ELSE EXTRACT(DAY FROM NOW() - visit_stats.last_visit)::int
       END AS "daysSinceLastVisit",
       CASE
         WHEN COALESCE(visit_stats.booked, 0) = 0 THEN NULL
         ELSE ROUND(visit_stats.attended::numeric / visit_stats.booked, 4)::float8
       END AS "attendanceRatio",
       COALESCE(visit_stats.reschedules, 0) AS "reschedules",
       COALESCE(reminder_stats.no_responses, 0) AS "noResponses",
       CASE
         WHEN COALESCE(reminder_stats.sent, 0) = 0 THEN NULL
         ELSE ROUND(reminder_stats.responses::numeric / reminder_stats.sent, 4)::float8
       END AS "responseRatio",
       package_stats.remaining_sessions AS "remainingSessions",
       package_stats.days_to_expiry AS "daysToExpiry"
     FROM customers customer
     LEFT JOIN visit_stats ON visit_stats.customer_id = customer.id
     LEFT JOIN reminder_stats ON reminder_stats.customer_id = customer.id
     LEFT JOIN package_stats ON package_stats.customer_id = customer.id
     WHERE customer.status = 'active'
       AND customer.contact_permission = TRUE`,
  );
  return result.rows;
};

/**
 * Menyimpan hasil klasifikasi. Versi model dan sumbernya ikut tercatat agar
 * keluaran model dan keluaran baseline dapat dibandingkan belakangan.
 */
const saveLogs = async (client, predictions) => {
  if (!predictions.length) return 0;

  const values = [];
  const rows = predictions.map((prediction, index) => {
    const offset = index * 6;
    values.push(
      prediction.customerId,
      prediction.priority,
      prediction.score,
      prediction.modelVersion,
      prediction.source,
      JSON.stringify(prediction.features),
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}::jsonb)`;
  });

  const result = await client.query(
    `INSERT INTO prediction_logs
       (customer_id, priority, score, model_version, source, features)
     VALUES ${rows.join(', ')}`,
    values,
  );
  return result.rowCount;
};

const PredictionRepositories = { collectFeatures, saveLogs };
export default PredictionRepositories;
