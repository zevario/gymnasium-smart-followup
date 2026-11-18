#!/bin/zsh
# Membaca daftar migrasi dan tabel yang benar-benar ada di database.
export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "${0:A:h:h:h}"
PW=$(grep -m1 '^PGPASSWORD=' backend/.env | cut -d= -f2-)
USR=$(grep -m1 '^PGUSER=' backend/.env | cut -d= -f2-)
DB=$(grep -m1 '^PGDATABASE=' backend/.env | cut -d= -f2-)
unset PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD PGSERVICE
psql() { PGPASSWORD="$PW" command psql -w -h 127.0.0.1 -p 5432 -U "$USR" -d "$DB" "$@"; }
{
  echo "=== migrasi yang sudah dijalankan ==="
  psql -c "SELECT name, run_on FROM pgmigrations ORDER BY id"
  echo "=== daftar tabel ==="
  psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  echo "=== kolom tabel yang namanya mengandung package/session/prediction ==="
  psql -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (table_name LIKE '%package%' OR table_name LIKE '%session%' OR table_name LIKE '%prediction%') ORDER BY table_name, ordinal_position"
  echo "=== jumlah baris ==="
  psql -c "SELECT (SELECT COUNT(*) FROM session_packages) AS session_packages, (SELECT COUNT(*) FROM reminders WHERE package_id IS NOT NULL) AS reminder_paket, (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM attendances) AS attendances, (SELECT COUNT(*) FROM reminders) AS reminders"
  echo "=== isi session_packages ==="
  psql -c "SELECT * FROM session_packages LIMIT 10"
  echo "=== constraint reminders ==="
  psql -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='reminders'::regclass ORDER BY conname"
} > "${0:A:h:h:h}/skema-db.txt" 2>&1
echo "Selesai. Hasil ada di skema-db.txt"
