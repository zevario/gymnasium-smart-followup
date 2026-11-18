#!/bin/zsh
export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
unset PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD PGSERVICE
{
  echo "=== socket yang tersedia ==="
  ls -1 /tmp/.s.PGSQL.* /var/run/postgresql/.s.PGSQL.* 2>/dev/null || echo "(tidak ada socket di /tmp atau /var/run/postgresql)"
  echo
  echo "=== coba lewat socket tanpa password ==="
  for sock in /tmp /var/run/postgresql; do
    for u in arip postgres; do
      printf "%-22s user=%-9s -> " "$sock" "$u"
      PGCONNECT_TIMEOUT=5 psql -w -h "$sock" -p 5432 -U "$u" -d postgres -tAc "select version()" 2>&1 | head -1 | cut -c1-90
    done
  done
  echo
  echo "=== coba TCP tanpa password, user postgres ==="
  PGCONNECT_TIMEOUT=5 psql -w -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "select version()" 2>&1 | head -1 | cut -c1-90
} 2>&1 | tee "${0:A:h:h:h}/diagnosa-db.txt"
