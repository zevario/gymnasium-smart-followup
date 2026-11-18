#!/bin/zsh
# 1. Membersihkan catatan migrasi 'session_packages' yang filenya tidak ada di
#    repo, agar riwayat database kembali sama dengan repo.
# 2. Menjalankan migrasi.
# 3. Menyalakan API aplikasi di port 3000.
# Portal staf dan customer tetap dilayani 'Buka Gymnasyum.command' di port 3001.
export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "${0:A:h:h:h}"
PW=$(grep -m1 '^PGPASSWORD=' backend/.env | cut -d= -f2-)
USR=$(grep -m1 '^PGUSER=' backend/.env | cut -d= -f2-)
DB=$(grep -m1 '^PGDATABASE=' backend/.env | cut -d= -f2-)
unset PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD PGSERVICE

echo "================================================================"
echo " 1. Menyamakan riwayat migrasi"
echo "================================================================"
PGPASSWORD="$PW" psql -w -h 127.0.0.1 -p 5432 -U "$USR" -d "$DB" \
  -c "DELETE FROM pgmigrations WHERE name = '1794055029668_session_packages'" || {
  echo ">>> Tidak bisa terhubung ke database."
  read "?Tekan Enter untuk menutup..."
  exit 1
}

echo
echo "================================================================"
echo " 2. Migrasi database"
echo "================================================================"
if ! npm run db:migrate; then
  echo
  echo ">>> Migrasi gagal."
  read "?Tekan Enter untuk menutup..."
  exit 1
fi

echo
echo "================================================================"
echo " 3. API aplikasi pada http://127.0.0.1:3000"
echo " Biarkan jendela ini terbuka selama API dipakai."
echo "================================================================"
npm --prefix backend start
read "?API berhenti. Tekan Enter untuk menutup..."
