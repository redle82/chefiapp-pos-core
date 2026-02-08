#!/bin/bash
# scripts/prepare-schema-parts.sh
# Concatenates migration files into chunks of ~50KB or just fixed counts to stay within limits.

mkdir -p temp_schema_parts
rm -f temp_schema_parts/*.sql

# Get all files sorted
FILES=$(ls legacy_supabase/migrations/*.sql 2>/dev/null | sort || true)

CHUNK_SIZE=3
COUNTER=0
PART=1

for f in $FILES; do
  cat "$f" >> "temp_schema_parts/schema_part_${PART}.sql"
  echo ";" >> "temp_schema_parts/schema_part_${PART}.sql" # Ensure separator
  COUNTER=$((COUNTER + 1))

  if [ $COUNTER -ge $CHUNK_SIZE ]; then
    COUNTER=0
    PART=$((PART + 1))
  fi
done

echo "Created schema parts:"
ls -lh temp_schema_parts/
