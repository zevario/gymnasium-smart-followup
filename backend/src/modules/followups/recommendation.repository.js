import pool from '../../database/pool.js';

const findAllRecommendations = async () => {
  const result = await pool.query(
    `SELECT recommendation.id,
       recommendation.customer_id AS "customerId",
       customer.name AS "customerName",
       customer.phone,
       customer.membership_package AS "membershipPackage",
       customer.membership_end AS "membershipEnd",
       customer.pic_id AS "picId",
       pic.name AS "picName",
       recommendation.status,
       recommendation.priority,
       recommendation.reason,
       recommendation.recommended_action AS "recommendedAction",
       recommendation.source_snapshot AS "sourceSnapshot",
       recommendation.assigned_to AS "assignedTo",
       assignee.name AS "assignedToName",
       recommendation.draft_message AS "draftMessage",
       recommendation.created_at AS "createdAt"
     FROM followup_recommendations recommendation
     JOIN customers customer ON customer.id = recommendation.customer_id
     LEFT JOIN users pic ON pic.id = customer.pic_id
     LEFT JOIN users assignee ON assignee.id = recommendation.assigned_to
     WHERE recommendation.status = 'pending'
       AND customer.status = 'active'
     ORDER BY CASE recommendation.priority
       WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       recommendation.created_at`,
  );
  return result.rows;
};

const reviewRecommendation = async ({ id, decision, assignedTo, draftMessage, note, actorId }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recommendationResult = await client.query(
      `SELECT recommendation.*, customer.name AS customer_name,
         customer.pic_id, customer.contact_permission, customer.status AS customer_status
       FROM followup_recommendations recommendation
       JOIN customers customer ON customer.id = recommendation.customer_id
       WHERE recommendation.id = $1
       FOR UPDATE OF recommendation`,
      [id],
    );
    if (!recommendationResult.rowCount) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }
    const recommendation = recommendationResult.rows[0];
    if (recommendation.status !== 'pending') {
      await client.query('ROLLBACK');
      return { alreadyReviewed: true };
    }
    if (
      decision === 'approve' &&
      (!recommendation.contact_permission || recommendation.customer_status !== 'active')
    ) {
      await client.query('ROLLBACK');
      return { contactDenied: true };
    }
    if (decision === 'dismiss') {
      await client.query(
        `UPDATE followup_recommendations
         SET status = 'dismissed', reviewed_by = $1,
             reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [actorId, id],
      );
      await client.query(
        `INSERT INTO followup_events
           (customer_id, event_type, previous_status, new_status, note,
            performed_by, pic_id)
         VALUES ($1, 'recommendation', 'pending', 'dismissed', $2, $3, $4)`,
        [
          recommendation.customer_id,
          note?.trim() || recommendation.reason,
          actorId,
          recommendation.pic_id,
        ],
      );
      await client.query('COMMIT');
      return { status: 'dismissed' };
    }

    const staffResult = await client.query(
      `SELECT id FROM users
       WHERE id = $1 AND role = 'staff' AND is_active = TRUE`,
      [assignedTo],
    );
    if (!staffResult.rowCount) {
      await client.query('ROLLBACK');
      return { invalidAssignee: true };
    }

    const followupResult = await client.query(
      `INSERT INTO followups
         (customer_id, subject, status, priority, assigned_to, created_by,
          draft_message, approved_by, approved_at)
       VALUES ($1, $2, 'in_progress', $3, $4, $5, $6, $5, NOW())
       RETURNING id`,
      [
        recommendation.customer_id,
        `Follow-up ${recommendation.customer_name}`,
        recommendation.priority === 'medium' ? 'normal' : recommendation.priority,
        assignedTo,
        actorId,
        draftMessage?.trim() || null,
      ],
    );
    const followupId = followupResult.rows[0].id;
    await client.query(
      `UPDATE followup_recommendations
       SET status = 'approved', followup_id = $1, assigned_to = $2,
           draft_message = $3, reviewed_by = $4, reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5`,
      [followupId, assignedTo, draftMessage?.trim() || null, actorId, id],
    );
    await client.query(
      `INSERT INTO followup_events
         (customer_id, followup_id, event_type, previous_status, new_status,
          note, performed_by, pic_id)
       VALUES ($1, $2, 'approved', 'pending', 'in_progress', $3, $4, $5)`,
      [recommendation.customer_id, followupId, recommendation.reason, actorId, assignedTo],
    );
    await client.query(
      `INSERT INTO followup_events
         (customer_id, followup_id, event_type, previous_status, new_status,
          note, performed_by, pic_id)
       VALUES ($1, $2, 'assigned', NULL, 'in_progress', $3, $4, $5)`,
      [
        recommendation.customer_id,
        followupId,
        'Pekerjaan ditugaskan kepada Staff.',
        actorId,
        assignedTo,
      ],
    );
    await client.query('COMMIT');
    return { status: 'approved', followupId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const RecommendationRepositories = {
  findAllRecommendations,
  reviewRecommendation,
};

export default RecommendationRepositories;
