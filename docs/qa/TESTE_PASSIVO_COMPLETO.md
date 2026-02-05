# Teste passivo completo

**Propósito:** Verificações somente leitura (sem escritas no Core nem no frontend) para validar o estado do sistema após a migração Supabase → Docker Core.

**Referências:** [AUDITORIA_SUPABASE_DOCKER_CORE.md](AUDITORIA_SUPABASE_DOCKER_CORE.md) § 9, [VALIDACAO_POS_DROP_LEGACY_LOCAL.md](VALIDACAO_POS_DROP_LEGACY_LOCAL.md), [test_post_drop_local.sh](../../scripts/test_post_drop_local.sh).

---

## Definição de "passivo"

**Teste passivo:** Verificações que **não alteram estado** — apenas leitura (GET, SELECT, carregar páginas, observar UI). Nenhuma escrita no Core (INSERT/UPDATE/DELETE, RPCs de escrita), nenhuma acção de criação/edição no frontend que persista.

---

## Checklist do teste passivo

### 1. Smoke automático

- **Pré-requisito:** Docker Core a correr; dev server do merchant-portal em http://localhost:5175 (`cd merchant-portal && npm run dev`).
- **Comando:** `bash scripts/test_post_drop_local.sh`
- **Critério de sucesso:** O script termina com «TESTE AUTOMÁTICO PASSOU» (Docker healthy, tabelas gm_%, sem tabelas legacy, npm run test, HTTP 200 em /app/dashboard e /app/install).

### 2. Leitura DB (opcional)

- **Comando:** `docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'gm_%';"`
- **Critério de sucesso:** Retorna um número (ex.: 17). Apenas SELECT; sem INSERT/UPDATE/DELETE.

### 3. Navegação e UI (somente leitura)

- **Acções:** Abrir no browser:
  - http://localhost:5175/
  - http://localhost:5175/app/dashboard
  - http://localhost:5175/app/install
  - http://localhost:5175/op/kds
- **Observar:** Conteúdo carrega; consola do browser sem erros vermelhos; sem loop de redirect.
- **Proibido:** Não criar restaurante, não instalar terminais, não criar pedidos (esses passos envolvem escrita e ficam fora do teste passivo).

### 4. Testes unitários

- **Comando:** `cd merchant-portal && npm run test`
- **Critério de sucesso:** 119 passed, 6 skipped (ou valor actual). Já incluído no passo 1; não persistem dados no Core.

---

## Registo do resultado

| Campo | Valor |
|-------|--------|
| **Data da execução** | 2025-02-03 |
| **Passo 1 (smoke)** | PASSOU |
| **Passo 2 (psql SELECT)** | PASSOU (17 tabelas gm_%) |
| **Passo 3 (navegação passiva)** | A verificar manualmente (abrir URLs e observar consola) |
| **Passo 4 (unitários)** | PASSOU (119 passed, 6 skipped) |
| **Conclusão** | Teste automático (passos 1, 2 e 4) passou. Passo 3 requer validação manual conforme checklist (§ 3). |

---

**Última actualização:** 2025-02-03 — Execução do teste passivo; registo preenchido.
