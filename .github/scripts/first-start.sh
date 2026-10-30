#!/usr/bin/env bash
# Drops all tables, starts the server and waits until it has seeded the demo data again
set -e
node -e "import('./src/db.js').then(async (db) => { for (const t of ['reviews', 'appointments', 'services', 'doctor_branches', 'doctors', 'branches', 'users', 'organizations', 'specialties']) await db.query('DROP TABLE ' + t); await db.close() })"
node src/index.js &
trap 'kill $!' EXIT
for i in $(seq 1 30); do curl -sf localhost:3000/api/stats | grep -q '"clinics":6' && exit 0; sleep 2; done
exit 1
