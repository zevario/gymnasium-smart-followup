import pool from '../../../config/database.js';

const findAll = async ({ search = '', status, limit = 10, offset = 0 }) => {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(c.name ILIKE $${values.length} OR c.email ILIKE $${values.length} OR c.phone ILIKE $${values.length} OR c.membership_package ILIKE $${values.length} OR pic.name ILIKE $${values.length})`,
    );
  }

  if (status) {
    values.push(status);
    conditions.push(`c.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const query = `
    SELECT
      c.id, c.name, c.email, c.phone, c.gender, c.address, c.notes,
      c.membership_package,
      c.membership_start::text AS membership_start,
      c.membership_end::text AS membership_end,
      c.contact_permission, c.pic_id, pic.name AS pic_name,
      c.status, c.created_by, c.created_at, c.updated_at,
      visits.last_visit
    FROM customers c
    LEFT JOIN users pic
      ON pic.id = c.pic_id
      AND pic.is_active = TRUE
      AND pic.role IN ('spv', 'staff')
    LEFT JOIN (
      SELECT customer_id,
        MAX(COALESCE(checked_in_at, created_at)) AS last_visit
      FROM attendances
      WHERE status IN ('present', 'late')
      GROUP BY customer_id
    ) visits ON visits.customer_id = c.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM customers c
    LEFT JOIN users pic
      ON pic.id = c.pic_id
      AND pic.is_active = TRUE
      AND pic.role IN ('spv', 'staff')
    ${whereClause}
  `;

  const [data, count] = await Promise.all([
    pool.query(query, values),
    pool.query(countQuery, values.slice(0, values.length - 2)),
  ]);

  return {
    customers: data.rows,
    total: Number(count.rows[0].total),
  };
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT
      c.id, c.name, c.email, c.phone, c.gender, c.address, c.notes,
      c.membership_package,
      c.membership_start::text AS membership_start,
      c.membership_end::text AS membership_end,
      c.contact_permission, c.pic_id, pic.name AS pic_name,
      c.status, c.created_by, c.created_at, c.updated_at,
      visits.last_visit
     FROM customers c
     LEFT JOIN users pic ON pic.id = c.pic_id
     LEFT JOIN (
       SELECT customer_id,
         MAX(COALESCE(checked_in_at, created_at)) AS last_visit
       FROM attendances
       WHERE status IN ('present', 'late')
       GROUP BY customer_id
     ) visits ON visits.customer_id = c.id
     WHERE c.id = $1`,
    [id],
  );

  return result.rows[0] || null;
};

const create = async (customerData) => {
  const {
    name,
    email,
    phone,
    gender,
    address,
    notes,
    membership_package,
    membership_start,
    membership_end,
    contact_permission,
    pic_id,
    createdBy,
  } = customerData;

  const result = await pool.query(
    `INSERT INTO customers
      (name, email, phone, gender, address, notes, membership_package,
       membership_start, membership_end, contact_permission, pic_id,
       status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12)
     RETURNING id`,
    [
      name,
      email || null,
      phone,
      gender || null,
      address || null,
      notes || null,
      membership_package,
      membership_start || null,
      membership_end,
      contact_permission,
      pic_id || null,
      createdBy,
    ],
  );

  return findById(result.rows[0].id);
};

const update = async (id, customerData) => {
  const allowedFields = {
    name: 'name',
    email: 'email',
    phone: 'phone',
    gender: 'gender',
    address: 'address',
    notes: 'notes',
    membership_package: 'membership_package',
    membership_start: 'membership_start',
    membership_end: 'membership_end',
    contact_permission: 'contact_permission',
    pic_id: 'pic_id',
    status: 'status',
  };

  const fields = Object.keys(customerData)
    .filter((key) => allowedFields[key]);

  if (!fields.length) {
    return findById(id);
  }

  const values = fields.map((field) => (
    customerData[field] === '' ? null : customerData[field]
  ));

  const assignments = fields.map(
    (field, index) => `${allowedFields[field]} = $${index + 1}`,
  );

  values.push(id);

  const result = await pool.query(
    `UPDATE customers
     SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id`,
    values,
  );

  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const deactivate = async (id) => {
  const result = await pool.query(
    `UPDATE customers
     SET status = 'inactive', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id],
  );

  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const isEligiblePic = async (id) => {
  const result = await pool.query(
    `SELECT EXISTS(
       SELECT 1
       FROM users
       WHERE id = $1 AND is_active = TRUE AND role IN ('spv', 'staff')
     ) AS eligible`,
    [id],
  );
  return result.rows[0].eligible;
};

const CustomerRepositories = {
  findAll,
  findById,
  create,
  update,
  deactivate,
  isEligiblePic,
};

export default CustomerRepositories;
