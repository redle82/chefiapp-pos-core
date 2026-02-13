# SAF-T Export Test (PT Pilot)

Owner: Elder Miranda de Andrade
Date: 2026-02-13
Environment: test

Restaurant: Sofia Gastrobar Ibiza
Restaurant UUID: 0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91
Period start: 2026-01-20
Period end: 2026-02-13

## Command

- supabase functions invoke saft-export --body '{"restaurant_id":"0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91","start":"2026-01-20","end":"2026-02-13"}'

## Output

- SAF-T XML file: ./evidence/engineering/saft_export_20260213.xml

## Notes

- Any errors or warnings
