-- Performance hardening: create missing indexes for foreign keys

DO $$
DECLARE
  fk_record record;
  index_name text;
BEGIN
  FOR fk_record IN
    WITH foreign_keys AS (
      SELECT
        con.oid AS constraint_oid,
        ns.nspname AS schema_name,
        rel.relname AS table_name,
        con.conname AS constraint_name,
        con.conrelid AS table_oid,
        con.conkey AS key_attnums,
        (
          SELECT string_agg(quote_ident(att.attname), ', ' ORDER BY key_pos.ordinality)
          FROM unnest(con.conkey) WITH ORDINALITY AS key_pos(attnum, ordinality)
          JOIN pg_attribute att
            ON att.attrelid = con.conrelid
           AND att.attnum = key_pos.attnum
        ) AS key_columns,
        (
          SELECT string_agg(att.attname, '_' ORDER BY key_pos.ordinality)
          FROM unnest(con.conkey) WITH ORDINALITY AS key_pos(attnum, ordinality)
          JOIN pg_attribute att
            ON att.attrelid = con.conrelid
           AND att.attnum = key_pos.attnum
        ) AS key_columns_suffix
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE con.contype = 'f'
        AND ns.nspname = 'public'
        AND rel.relkind = 'r'
    )
    SELECT fk.*
    FROM foreign_keys fk
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_index idx
      WHERE idx.indrelid = fk.table_oid
        AND idx.indisvalid = true
        AND idx.indisready = true
        AND array_length(string_to_array(trim(idx.indkey::text), ' ')::smallint[], 1) >= array_length(fk.key_attnums, 1)
        AND (string_to_array(trim(idx.indkey::text), ' ')::smallint[])[1:array_length(fk.key_attnums, 1)] = fk.key_attnums
    )
  LOOP
    index_name := format(
      'idx_%s_%s_fk',
      fk_record.table_name,
      fk_record.key_columns_suffix
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      index_name,
      fk_record.schema_name,
      fk_record.table_name,
      fk_record.key_columns
    );
  END LOOP;
END;
$$;
