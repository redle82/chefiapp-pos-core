# Backup + Restore Drill (PT Pilot)

Owner: Elder Miranda de Andrade
Date: 2026-02-13

Restaurant: Sofia Gastrobar Ibiza
Restaurant UUID: 0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91

## Backup Run

- Backup ID: backup_20260213.sql
- Status: SUCCESS
- Target URI: docs/audit/pt/evidence/ops/backup_20260213.sql
- Checksum (SHA-256): 78d2dfdd6834fce70d96e85cc3434825d8a74d7e0953cf2d632779a89812f1ae
- Log: docs/audit/pt/evidence/ops/backup_20260213.log

## Restore Drill

- Environment: local docker-core (chefiapp-core-postgres)
- Restore start: 2026-02-13
- Restore end: 2026-02-13
- Target DB: chefiapp_core_restore_drill_20260213
- Outcome: SUCCESS
- Log: docs/audit/pt/evidence/ops/restore_20260213.log

## Notes

- Restore executed against a temporary database to avoid overwriting primary local data.
