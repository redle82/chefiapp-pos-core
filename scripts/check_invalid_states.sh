#!/bin/bash
# Run invalid states check and log alerts (Phase B)
set -e
DB_CONTAINER=chefiapp-core-postgres
DB_NAME=postgres

echo "[Alert] Running invalid states check..."
docker exec $DB_CONTAINER psql -U postgres -d $DB_NAME -c "SELECT public.log_alerts_from_invalid_states();"
echo "[Alert] Done."
