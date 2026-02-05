# PRÓXIMOS PASSOS — CHEFIAPP POS CORE

**Data da última atualização:** 2026-02-03  
**Referência canónica:** [docs/plans/FASE_2_PLANO_COMPLETO.md](docs/plans/FASE_2_PLANO_COMPLETO.md)

---

## Estado actual (Fase 2)

- **2.1** Superfícies e instalação ✅ (TPV/KDS PWA, OPERATIONAL_SURFACES_CONTRACT)
- **2.2** Pessoas e turnos ✅ (gm_cash_registers, opened_by, turno/caixa)
- **2.3** Caixa, pagamentos e fecho ✅ (CloseCashRegisterModal, ShiftHistorySection, get_shift_history)
- **2.4** Observabilidade e alertas ✅ (OPERATIONAL_ALERTS_CONTRACT, Dashboard honesto)
- **2.5** Uso real prolongado + freeze — **próximo**

Infra: Docker Core (Supabase removido; legacy_supabase). Ver [docs/plans/FASE_2_PLANO_COMPLETO.md](docs/plans/FASE_2_PLANO_COMPLETO.md).

---

## Ordem de execução (pré-piloto)

1. **Docker Core:** `docker compose -f docker-core/docker-compose.core.yml ps` → postgres healthy.
2. **Dev server:** `cd merchant-portal && npm run dev` → http://localhost:5175.
3. **Smoke:** noutro terminal: `bash scripts/test_post_drop_local.sh` → deve terminar com «TESTE AUTOMÁTICO PASSOU».
4. **Teste humano:** abrir http://localhost:5175 e seguir [VALIDACAO_POS_DROP_LEGACY_LOCAL.md](docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md) (passos 5–7).
5. **Piloto:** quando 1–4 estiverem OK, iniciar piloto conforme USO_REAL_PROLONGADO_PILOTO.md.

---

## Próxima acção

**Executar piloto Fase 2.5** conforme:

1. **[docs/plans/FASE_2.5_USO_REAL_FREEZE.md](docs/plans/FASE_2.5_USO_REAL_FREEZE.md)** — checklist pré-piloto, durante o piloto e freeze.
2. **[docs/ops/USO_REAL_PROLONGADO_PILOTO.md](docs/ops/USO_REAL_PROLONGADO_PILOTO.md)** — plano do piloto, ritual diário, registo diário.

### Pré-piloto (antes de abrir ao restaurante)

- Executar **teste humano canónico:** [docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md](docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md).
- Executar **smoke automático:** `bash scripts/test_post_drop_local.sh` (Docker Core, tabelas gm_%, `npm run test`, /app/dashboard e /app/install em http://localhost:5175). O dev server usa porta 5175 por defeito (vite.config); variável `VITE_PORT` para override.

### Após sucesso do piloto

- Tag: `git tag operational-phase-2-freeze-v1`
- Preencher **secção 6** em [docs/ops/ROLLBACK_OPERATIONAL_FREEZE.md](docs/ops/ROLLBACK_OPERATIONAL_FREEZE.md).
- Atualizar **2.5 — Resultado** em [docs/plans/FASE_2_PLANO_COMPLETO.md](docs/plans/FASE_2_PLANO_COMPLETO.md).

---

**VERSION:** Ver [VERSION](VERSION). Infra actual: Docker Core (CORE).
