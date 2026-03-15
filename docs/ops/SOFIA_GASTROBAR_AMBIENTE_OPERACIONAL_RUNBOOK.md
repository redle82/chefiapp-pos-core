# Sofia Gastrobar — Runbook: ambiente operacional (Docker/Core)

**Objetivo:** Ativar o ambiente “Sofia operacional” em local: sessão do dono (mock pilot), nome “Sofia Gastrobar” na topbar, tenant 100 selado, sem banner “Modo demonstração”.

**Referência:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md).

---

## 1. Pré-requisitos

- **Docker Core** a correr (PostgREST em 3001).
- Migrações aplicadas, incluindo:
  - `20260226_sofia_gastrobar_real_identity.sql` (nome, slug, product_mode no restaurante 100)
  - `06-seed-enterprise.sql` (membership owner, módulos, caixa, setup)
- **merchant-portal** clonado na máquina local.

---

## 2. Configuração do portal para Sofia operacional

Em `merchant-portal/.env.local` (criar a partir de `.env.local.example` se não existir), garantir:

```env
# CORE (Docker local)
VITE_CORE_URL=http://localhost:3001
VITE_CORE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long

# Sofia operacional — mock auth + tenant 100 (evita "Sessão encerrada" e "Restaurante")
VITE_ALLOW_MOCK_AUTH=true
VITE_DEBUG_DIRECT_FLOW=true

# Opcional: esconder banner "Modo demonstração"
# VITE_FORCE_PRODUCT_MODE=live
```

- **VITE_ALLOW_MOCK_AUTH=true** — Permite o ramo de mock auth no `AuthProvider`; sem isto o `user` fica null e a topbar mostra “Sessão encerrada”.
- **VITE_DEBUG_DIRECT_FLOW=true** — Faz o AUTO-PILOT gravar `chefiapp_pilot_mode` e `chefiapp_restaurant_id = SOFIA_RESTAURANT_ID` (100); assim o FlowGate e a identidade usam o restaurante Sofia. Com isto, a sessão mock ativa mesmo sem `?debug=1` (ver AuthProvider: pilotOk = isPilot && (isDebugMode() \|\| CONFIG.DEBUG_DIRECT_FLOW)).
- **Para usar Docker Core em vez de Supabase:** comentar em `.env.local` as linhas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; assim o portal usa `VITE_CORE_URL` (localhost:3001) e o tenant Sofia.
- **VITE_FORCE_PRODUCT_MODE=live** (opcional) — Faz o runtime iniciar em modo “live”; o banner castanho “Modo demonstração” deixa de aparecer. Alternativa: após primeiro load, gravar em `localStorage` `chefiapp_product_mode=live` e recarregar.

---

## 3. Passos de ativação

1. **Subir o Core** (se ainda não estiver):
   - `cd docker-core && docker compose -f docker-compose.core.yml up -d` (ou comando canónico do projeto).
   - Verificar: `http://localhost:3001/rest/v1/` devolve 200.

2. **Aplicar migrações** (se ainda não aplicadas):
   - Seguir `docker-core/MIGRATIONS.md` ou script de migrações do projeto (ex.: `make migrate` ou `dbmate up`).

3. **Configurar `.env.local`** conforme §2.

4. **Iniciar o merchant-portal:**
   - `cd merchant-portal && pnpm run dev`
   - Abrir no browser: `http://localhost:5175/admin/config/general` ou `http://localhost:5175/app/dashboard`.

5. **Primeira vez (opcional):** Se o mock não ativar, abrir uma vez com `?debug=1` (ex.: `http://localhost:5175/admin/config/general?debug=1`) para que `isDebugMode()` seja true e o mock ative com `isPilot`; depois pode remover o parâmetro.

---

## 4. Validação

Após carregar a página:

| Verificação | Esperado |
|-------------|----------|
| Topbar — nome do restaurante | “Sofia Gastrobar” (vindo do Core, não “Restaurante”). |
| Topbar — utilizador / sessão | Utilizador ativo (ex. “Pilot User” ou “Dono”), **não** “Sessão encerrada”. |
| Banner castanho | Se `VITE_FORCE_PRODUCT_MODE=live` estiver definido (ou `chefiapp_product_mode=live` no localStorage), o banner “Modo demonstração” não aparece. |

Se “Sessão encerrada” ou “Restaurante” persistirem: confirmar que `VITE_ALLOW_MOCK_AUTH` e `VITE_DEBUG_DIRECT_FLOW` estão em `true` em `.env.local`, reiniciar o dev server e recarregar a página; confirmar que o Core está acessível em 3001.

---

## 5. Próximos passos (após sessão e tenant ok)

- **Fase 2 — ambiente operacional vivo:** Ver [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md) para roadmap executável (catálogo, superfícies simultâneas, equipe, tarefas, relatórios).
- Executar o smoke do circuito de catálogo: [SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md](./SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md).
- Completar 5 funcionários (3 do seed + 2 no Admin → Config → Pessoas): [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) §8 (Equipe).
- Validar tarefas e relatórios conforme doc principal §9–§10.
