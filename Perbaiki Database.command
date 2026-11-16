#!/bin/zsh
export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "${0:A:h}"
PW=$(grep -m1 '^PGPASSWORD=' backend/.env | cut -d= -f2-)
if [ -z "$PW" ]; then echo "PGPASSWORD kosong di backend/.env. Isi dulu."; echo; read "?Tekan Enter untuk menutup..."; exit 1; fi
unset PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD PGSERVICE

ESC=${PW//\'/\'\'}
SQLF=$(mktemp /tmp/gym-setup.XXXXXX.sql)
chmod 600 "$SQLF"
cat > "$SQLF" <<SQL
CREATE ROLE arip WITH LOGIN CREATEDB;
ALTER ROLE arip WITH LOGIN PASSWORD '$ESC';
CREATE DATABASE gymnasyum_db OWNER arip;
ALTER DATABASE gymnasyum_db OWNER TO arip;
SELECT 'SETUP ROLE+DB SELESAI' AS hasil;
SQL

echo "================================================================"
echo " Masukkan password superuser 'postgres' saat diminta di bawah."
echo " (password yang kamu set waktu instal PostgreSQL 18)"
echo "================================================================"
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -f "$SQLF"
rc=$?
rm -f "$SQLF"
if [ $rc -ne 0 ]; then echo; echo ">>> Gagal login sebagai postgres. Password salah atau role postgres tidak ada."; echo; read "?Tekan Enter untuk menutup..."; exit 1; fi

echo
echo "=== verifikasi koneksi sebagai arip ==="
PGPASSWORD="$PW" psql -w -h 127.0.0.1 -p 5432 -U arip -d gymnasyum_db -tAc "select 'KONEKSI ARIP OK'" || { echo ">>> masih gagal"; read "?Tekan Enter..."; exit 1; }

echo
echo "=== menjalankan migrasi ==="
npm run db:migrate || { echo ">>> migrasi gagal"; read "?Tekan Enter..."; exit 1; }

echo
echo "=== membuat akun administrator awal ==="
npm --prefix backend run seed:admin

echo
echo "================================================================"
echo " SELESAI. Sekarang klik ganda 'Buka Gymnasyum.command'."
echo "================================================================"
read "?Tekan Enter untuk menutup..."
