# Validação Bloco 3 — Production Readiness

**Objetivo:** Confirmar testes, gate CI, release, migrações e observabilidade antes de instalar em clientes. Checklist completo: [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](./ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) (Bloco 3).

---

## 5 itens (verificação)

1. **Testes** — Estado de `npm test` documentado (verde/vermelho aceite). Ref.: ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST item 14.
2. **Gate CI** — GitHub Actions configurado e bloqueia merge em falha. Ref.: [.github/workflows/ci.yml](../.github/workflows/ci.yml).
3. **Check release** — Checklist mínimo antes de cada release. Ref.: [docs/testing/RELEASE_CHECKLIST.md](./testing/RELEASE_CHECKLIST.md).
4. **Migrações** — Migrações de BD documentadas e aplicáveis; runbook se necessário. Ref.: `supabase/migrations/`, [docs/ops/RUNBOOKS.md](./ops/RUNBOOKS.md).
5. **Log / observabilidade** — Dashboard operacional, SLO_SLI, alertas, audit events suficientes para produção. Ref.: ONDA_3_TAREFAS_90_DIAS.

---

## Próximo

Bloco 4 — Valor percebido (welcome, landing/pitch, preço piloto). Bloco 5 — Onda 5 (escopo, congelar, executar). [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](./ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md).
