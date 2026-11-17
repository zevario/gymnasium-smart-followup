import pool from '../../database/pool.js';

const CUSTOMER_PACKAGE_COLUMNS = `
  customer_package.id,
  customer_package.customer_id AS "customerId",
  customer.name AS "customerName",
  customer_package.package_id AS "packageId",
  package.name AS "packageName",
  package.category,
  package.schedule_type AS "scheduleType",
  customer_package.total_sessions AS "totalSessions",
  customer_package.used_sessions AS "usedSessions",
  customer_package.total_sessions - customer_package.used_sessions AS "remainingSessions",
  customer_package.purchased_at AS "purchasedAt",
  customer_package.started_at AS "startedAt",
  customer_package.expires_at AS "expiresAt",
  customer_package.status`;

const findCatalog = async ({ activeOnly = true } = {}) => {
  const result = await pool.query(
    `SELECT id,
       name,
       category,
       schedule_type AS "scheduleType",
       session_count AS "sessionCount",
       price,
       validity_days AS "validityDays",
       active
     FROM packages
     ${activeOnly ? 'WHERE active = TRUE' : ''}
     ORDER BY category, session_count`,
  );
  return result.rows;
};

const findPackageById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT id,
       name,
       category,
       schedule_type AS "scheduleType",
       session_count AS "sessionCount",
       validity_days AS "validityDays",
       active
     FROM packages
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const findByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT ${CUSTOMER_PACKAGE_COLUMNS}
     FROM customer_packages customer_package
     JOIN packages package ON package.id = customer_package.package_id
     JOIN customers customer ON customer.id = customer_package.customer_id
     WHERE customer_package.customer_id = $1
     ORDER BY customer_package.status = 'active' DESC,
       customer_package.expires_at NULLS LAST,
       customer_package.purchased_at DESC`,
    [customerId],
  );
  return result.rows;
};

const findById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT ${CUSTOMER_PACKAGE_COLUMNS}
     FROM customer_packages customer_package
     JOIN packages package ON package.id = customer_package.package_id
     JOIN customers customer ON customer.id = customer_package.customer_id
     WHERE customer_package.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

/**
 * Paket aktif yang berakhir dalam `days` hari ke depan dan masih punya sisa
 * sesi. Menjadi sumber kandidat pengingat paket.
 */
const findExpiring = async ({ days = 7 } = {}) => {
  const result = await pool.query(
    `SELECT ${CUSTOMER_PACKAGE_COLUMNS},
       customer.phone AS "customerPhone",
       (customer_package.expires_at - CURRENT_DATE)::int AS "daysLeft"
     FROM customer_packages customer_package
     JOIN packages package ON package.id = customer_package.package_id
     JOIN customers customer ON customer.id = customer_package.customer_id
     WHERE customer_package.status = 'active'
       AND customer_package.expires_at IS NOT NULL
       AND customer_package.expires_at >= CURRENT_DATE
       AND customer_package.expires_at <= CURRENT_DATE + $1::int
       AND customer_package.used_sessions < customer_package.total_sessions
       AND customer.status = 'active'
     ORDER BY customer_package.expires_at, customer.name`,
    [days],
  );
  return result.rows;
};

const createForCustomer = async ({ customerId, packageId, purchasedAt, startedAt, expiresAt }) => {
  const result = await pool.query(
    `INSERT INTO customer_packages
       (customer_id, package_id, total_sessions, purchased_at, started_at, expires_at)
     SELECT $1, package.id, package.session_count, $3::date, $4::date, $5::date
     FROM packages package
     WHERE package.id = $2
     RETURNING id`,
    [customerId, packageId, purchasedAt, startedAt, expiresAt],
  );
  return result.rowCount ? findById(result.rows[0].id) : null;
};

const PackageRepositories = {
  findCatalog,
  findPackageById,
  findByCustomer,
  findById,
  findExpiring,
  createForCustomer,
};

export default PackageRepositories;
