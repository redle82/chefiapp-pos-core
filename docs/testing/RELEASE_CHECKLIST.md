# Checklist de Release — ChefIApp

**Propósito:** Checklist **genérico** de release (além de [GO_LIVE_CHECKLIST.md](../ops/GO_LIVE_CHECKLIST.md) e [rollback-checklist.md](../ops/rollback-checklist.md)): pré-release, build, deploy, pós-release e smoke.  
**Público:** DevOps, engenharia, release manager.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [DEPLOYMENT.md](../ops/DEPLOYMENT.md) · [RUNBOOKS.md](../ops/RUNBOOKS.md)

---

## 1. Objetivo

Um único checklist de release que cubra: preparação, build, deploy, validação pós-deploy e rollback (referência). Não substitui GO_LIVE (primeiro restaurante) nem rollback (procedimento detalhado); complementa-os para cada release posterior.

---

## 2. Pré-release

### 2.1 Código e qualidade

- [ ] Branch de release criada e atualizada (ex.: `release/vX.Y.Z` ou `main` estável).
- [ ] CI a passar (build, lint, unit tests).
- [ ] Testes críticos (E2E, integração) executados e a passar.
- [ ] Sem mudanças não revistas na área crítica (Core, boundary, gates).
- [ ] Changelog ou release notes atualizados (opcional mas recomendado).

### 2.2 Dependências e ambiente

- [ ] Versões de dependências conhecidas (package.json, lockfile).
- [ ] Variáveis de ambiente de produção documentadas e disponíveis.
- [ ] Migrations (se houver) testadas em staging; script de rollback conhecido.

### 2.3 Comunicação

- [ ] Equipa informada da janela de release.
- [ ] Utilizadores/clientes informados se a release tiver impacto visível (opcional).

---

## 3. Build

- [ ] Build de produção executado com sucesso (`npm run build` ou equivalente).
- [ ] Artefactos gerados (ex.: `dist/`) verificados.
- [ ] Sem erros de build nem warnings críticos.
- [ ] Versão/tag aplicada conforme convenção (ex.: semver).

---

## 4. Deploy

### 4.1 Frontend (Merchant Portal / Vercel)

- [ ] Deploy executado (ex.: `vercel --prod` ou pipeline).
- [ ] Variáveis de ambiente de produção configuradas no destino.
- [ ] URL de produção acessível (ex.: app.chefiapp.com).
- [ ] Sem erros no log de deploy.

### 4.2 Backend / Core (se aplicável)

- [ ] Migrations aplicadas (Supabase `db push` ou Docker Core).
- [ ] Serviços Core/API em execução e acessíveis.
- [ ] Health check do Core/API responde 200 (se existir).

### 4.3 Mobile (se aplicável)

- [ ] Build EAS/Expo executado.
- [ ] Update ou binary publicado no canal correto.
- [ ] Versão visível na loja ou no canal de distribuição (conforme processo).

---

## 5. Pós-release (validação)

### 5.1 Smoke tests

- [ ] Landing (/) carrega.
- [ ] Login/auth acessível e funcional.
- [ ] Dashboard (após login) carrega.
- [ ] Pelo menos um fluxo crítico: ex.: abrir TPV ou KDS (se publicado); ou criar produto no menu.
- [ ] Sem erros críticos no Sentry (ou equivalente) nos primeiros 5–10 min.

### 5.2 Verificações rápidas

- [ ] Health check (se existir) responde OK.
- [ ] Sem regressões óbvias (rotas principais, gates).
- [ ] Logs sem erros críticos.

---

## 6. Rollback (referência)

Se algo falhar após o release:

1. **Decidir:** Rollback completo ou hotfix?
2. **Executar:** Seguir [rollback-checklist.md](../ops/rollback-checklist.md) e [rollback-procedure.md](../ops/rollback-procedure.md).
3. **Validar:** Smoke após rollback.
4. **Comunicar:** Equipa e utilizadores se necessário.
5. **Documentar:** Incidente e causa raiz; atualizar este checklist se aplicável.

---

## 7. Referências

| Documento | Uso |
|-----------|-----|
| [GO_LIVE_CHECKLIST.md](../ops/GO_LIVE_CHECKLIST.md) | Primeiro go-live (restaurante piloto); validação completa. |
| [rollback-checklist.md](../ops/rollback-checklist.md) | Rollback de app e de migration (1 página). |
| [rollback-procedure.md](../ops/rollback-procedure.md) | Procedimento detalhado de rollback. |
| [DEPLOYMENT.md](../ops/DEPLOYMENT.md) | Deploy canónico; variáveis; provisioning. |
| [RUNBOOKS.md](../ops/RUNBOOKS.md) | Índice de runbooks (alertas, incident, rollback). |

---

## 8. Resumo (uma página)

| Fase | Ações principais |
|------|-------------------|
| **Pré-release** | CI verde, testes críticos, migrations testadas, equipa informada. |
| **Build** | Build prod OK, artefactos verificados, versão tagada. |
| **Deploy** | Frontend + Core (se aplicável) + Mobile (se aplicável); env vars; health check. |
| **Pós-release** | Smoke: landing, auth, dashboard, fluxo crítico; Sentry sem erros críticos. |
| **Rollback** | Se falha: rollback-checklist + procedure; validar; comunicar; documentar. |

---

*Documento vivo. Alterações no processo de release devem ser reflectidas aqui e nos runbooks.*
