# MRP-001 - First PR Starter Pack

Data: 2026-03-07
Objetivo: abrir o primeiro PR de execucao P0 com formato e evidencia padronizados.

Referencias:

- `docs/audit/MONOREPO_MRP_PR_EXECUTION_PLAYBOOK_2026-03-07.md`
- `docs/audit/MONOREPO_LINEAR_ISSUE_PR_TEMPLATES_MRP_2026-03-07.md`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`

## Metadados recomendados

- Branch: `feat/fase2-electron-desktop-shell`
- Titulo do PR: `[integration-gateway] MRP-001 Runtime authority cutover prep (contract hardening + evidence)`
- Issue relacionada: ticket Linear de `MRP-001`

## PR body (copiar/colar)

```md
## Objetivo

Entregar `MRP-001`: definir autoridade unica de gateway runtime entre `server` e `integration-gateway`.

## Escopo

- [ ] Mapear endpoints/handlers duplicados de integracao
- [ ] Consolidar autoridade runtime canonica
- [ ] Aplicar camada de compatibilidade temporaria (se necessaria)
- [ ] Documentar prazo de remocao da compat layer

## Arquivos Provaveis

- `server/integration-gateway.ts`
- `integration-gateway/src/index.ts`
- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- `scripts/flows/mrp001-cutover-smoke.sh`
- `.github/workflows/ci.yml`

## Validacao Tecnica

- [ ] `GET /health` funcional no caminho alvo
- [ ] Fluxos de webhook criticos sem regressao
- [ ] Launch ACK operacional apos consolidacao

## Evidencia Esperada

- [ ] Tabela antes/depois de endpoints por autoridade
- [ ] Logs/resultado de smokes dos fluxos criticos
- [ ] Registro do compat mode (se ativo)
- [ ] Execucao de `npm run smoke:mrp001-cutover` com `EXIT:0`
- [ ] Report em `docs/audit/runs/mrp001-cutover-smoke-2026-03-07-225923.md`

## Criterio de Merge

- [ ] DoD do `MRP-001` atendido
- [ ] Uma autoridade runtime ativa para integracoes
- [ ] Riscos residuais registrados
- [ ] Data de remocao do compat mode definida (se existir)
```

## Tabela de evidencia (preencher no PR)

```md
| Evidencia                        | Antes             | Depois                | Status |
| -------------------------------- | ----------------- | --------------------- | ------ |
| Autoridade de endpoint `/health` | <quem respondia>  | <quem responde agora> | [ ]    |
| Webhook critico A                | <resultado antes> | <resultado depois>    | [ ]    |
| Webhook critico B                | <resultado antes> | <resultado depois>    | [ ]    |
| Launch ACK                       | <resultado antes> | <resultado depois>    | [ ]    |
| Compat mode (se houver)          | <nao/descricao>   | <descricao e prazo>   | [ ]    |
```

## Checklist rapido de submissao

1. PR cita `MRP-001` no titulo ou descricao.
1. Link para issue Linear `MRP-001` adicionado.
1. Evidencias objetivas anexadas (logs/tabela/smokes).
1. Risco residual e proximo passo registrados.
1. Confirmar gate de CI por escopo em `.github/workflows/ci.yml` para `MRP-001`.
1. Confirmar `INTEGRATION_LEGACY_COMPAT_MODE=1` (default, compat ativo).
1. Confirmar `INTEGRATION_LEGACY_COMPAT_MODE=0` (rotas sobrepostas -> `410 compatibility_disabled`).

## Comandos de validacao (copiar/colar)

```bash
npm run smoke:mrp001-cutover
```

```bash
curl -sS http://localhost:4320/health
```

## Bloco para checkpoint P0 (copiar/colar)

```md
### Checkpoint P0 - MRP-001

- PR: <link_pr>
- Issue: <link_issue_linear>
- Autoridade final definida: <server|integration-gateway>
- Compat mode: <nao|sim + prazo_remocao>
- Evidencias anexadas: tabela antes/depois + logs de smoke + launch ACK
```
