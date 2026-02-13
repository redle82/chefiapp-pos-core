# SAF-T Export (PT Pilot)

Owner: Elder Miranda de Andrade
Date: 2026-02-13
Restaurant: Sofia Gastrobar Ibiza
Restaurant UUID: 0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91
Period: 2026-01-20 to 2026-02-13

## Command

npx ts-node scripts/audit/generate-saft-local.ts \
 --restaurant-id "0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91" \
 --start "2026-01-20" \
 --end "2026-02-13"

## Result

Completed locally (simulated SAF-T export).

## Evidence

- XML: docs/audit/pt/evidence/engineering/saft_export_20260213.xml
- Log: docs/audit/pt/evidence/engineering/saft_export_20260213.log
- Validation JSON: docs/audit/pt/evidence/engineering/pt_validation_report_20260213.json
