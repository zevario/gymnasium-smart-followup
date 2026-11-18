#!/bin/zsh
set -eu
cd "${0:A:h:h:h}/backend"
unset PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD PGSERVICE
if ! curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
  export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
  node src/pilot-server.js &
  server_pid=$!
  trap 'kill "$server_pid" 2>/dev/null || true' EXIT
  for i in {1..30}; do
    curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1 && break
    sleep 1
  done
  curl -fsS http://127.0.0.1:3001/api/health >/dev/null
  open http://127.0.0.1:3001
  wait "$server_pid"
else
  open http://127.0.0.1:3001
fi
