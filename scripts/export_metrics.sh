#!/bin/bash
# Export core metrics as CSV (Phase B)
set -e
DB_CONTAINER=chefiapp-core-postgres
DB_NAME=postgres
EXPORT_FILE=${1:-core_metrics_export.csv}

echo "[Export] Exporting metrics to $EXPORT_FILE..."
docker exec $DB_CONTAINER psql -U postgres -d $DB_NAME -c "\copy (SELECT * FROM public.core_metrics ORDER BY metric_time DESC) TO STDOUT WITH CSV HEADER" > "$EXPORT_FILE"
echo "[Export] Done."
