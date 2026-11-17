import pool from '../../database/pool.js';
import { reject } from '../../utils/http-error.js';
import PackageRepositories from './package.repository.js';

/**
 * Memberikan paket kepada pelanggan.
 *
 * Paket trial berlaku sejak tanggal pembelian. Paket lain berlaku sejak booking
 * pertama, sehingga `started_at` dan `expires_at` sengaja dibiarkan kosong dan
 * baru diisi saat sesi pertama dipakai.
 */
const assignPackage = async ({ customerId, packageId, purchasedAt }) => {
  const customer = await pool.query(`SELECT id, status FROM customers WHERE id = $1`, [customerId]);
  if (!customer.rowCount) reject('Customer not found', 404);
  if (customer.rows[0].status !== 'active') reject('Customer is inactive', 400);

  const target = await PackageRepositories.findPackageById(packageId);
  if (!target) reject('Package not found', 404);
  if (!target.active) reject('Package is no longer offered', 400);

  const purchaseDate = purchasedAt || new Date().toISOString().slice(0, 10);
  const startsAtPurchase = target.category === 'trial';
  const expiresAt = startsAtPurchase
    ? new Date(Date.parse(purchaseDate) + target.validityDays * 86400000).toISOString().slice(0, 10)
    : null;

  return PackageRepositories.createForCustomer({
    customerId,
    packageId,
    purchasedAt: purchaseDate,
    startedAt: startsAtPurchase ? purchaseDate : null,
    expiresAt,
  });
};

/**
 * Memakai satu sesi untuk sebuah kehadiran, di dalam transaksi pemanggil.
 *
 * Paket dipilih dari yang lebih dulu kedaluwarsa. Baris dikunci lebih dulu agar
 * dua pencatatan kehadiran bersamaan tidak memakai sisa sesi yang sama.
 * Mengembalikan null bila pelanggan tidak punya paket yang cocok; kehadiran
 * tetap tercatat dan pemanggil memberi tahu petugas.
 */
const consumeSession = async (client, { customerId, scheduleType, attendanceId, recordedBy }) => {
  const candidate = await client.query(
    `SELECT customer_package.id,
       customer_package.started_at,
       customer_package.used_sessions,
       customer_package.total_sessions,
       package.validity_days
     FROM customer_packages customer_package
     JOIN packages package ON package.id = customer_package.package_id
     WHERE customer_package.customer_id = $1
       AND package.schedule_type = $2
       AND customer_package.status = 'active'
       AND customer_package.used_sessions < customer_package.total_sessions
       AND (customer_package.expires_at IS NULL OR customer_package.expires_at >= CURRENT_DATE)
     ORDER BY customer_package.expires_at NULLS LAST, customer_package.purchased_at
     LIMIT 1
     FOR UPDATE OF customer_package`,
    [customerId, scheduleType],
  );

  if (!candidate.rowCount) return null;

  const row = candidate.rows[0];
  const firstUse = row.started_at === null;
  const updated = await client.query(
    `UPDATE customer_packages
     SET used_sessions = used_sessions + 1,
       started_at = COALESCE(started_at, CURRENT_DATE),
       expires_at = COALESCE(expires_at, CURRENT_DATE + $2::int),
       status = CASE
         WHEN used_sessions + 1 >= total_sessions THEN 'used_up'
         ELSE status
       END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, used_sessions AS "usedSessions", total_sessions AS "totalSessions",
       started_at AS "startedAt", expires_at AS "expiresAt", status`,
    [row.id, row.validity_days],
  );

  await client.query(
    `INSERT INTO package_session_usages (customer_package_id, attendance_id, recorded_by)
     VALUES ($1, $2, $3)`,
    [row.id, attendanceId, recordedBy],
  );

  return { ...updated.rows[0], firstUse };
};

/**
 * Mengembalikan sesi yang sudah dipakai saat kehadiran dibatalkan. Paket yang
 * tadinya habis kembali aktif, kecuali masa berlakunya sudah lewat.
 */
const returnSession = async (client, { attendanceId }) => {
  const usage = await client.query(
    `DELETE FROM package_session_usages
     WHERE attendance_id = $1
     RETURNING customer_package_id AS "customerPackageId"`,
    [attendanceId],
  );
  if (!usage.rowCount) return null;

  const result = await client.query(
    `UPDATE customer_packages
     SET used_sessions = GREATEST(used_sessions - 1, 0),
       status = CASE
         WHEN status = 'used_up' AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
           THEN 'active'
         ELSE status
       END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, used_sessions AS "usedSessions", total_sessions AS "totalSessions", status`,
    [usage.rows[0].customerPackageId],
  );
  return result.rows[0];
};

/**
 * Menandai paket aktif yang masa berlakunya sudah lewat. Dipanggil siklus
 * penjadwal reminder agar daftar kandidat tidak memakai paket kedaluwarsa.
 */
const expirePassedPackages = async (client = pool) => {
  const result = await client.query(
    `UPDATE customer_packages
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'active'
       AND expires_at IS NOT NULL
       AND expires_at < CURRENT_DATE
     RETURNING id`,
  );
  return result.rowCount;
};

const PackageServices = {
  assignPackage,
  consumeSession,
  returnSession,
  expirePassedPackages,
};

export default PackageServices;
