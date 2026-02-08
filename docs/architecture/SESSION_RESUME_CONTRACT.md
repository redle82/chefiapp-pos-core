# Contrato de Retoma de Sessão (Last-Context Resolution)

## Lei do sistema

**"Já tenho acesso" retoma o último estado operacional conhecido. Após login, o sistema redirecciona para a última rota válida visitada (dashboard, TPV, KDS, caixa) quando existir; caso contrário, para `/app/dashboard`.**

Este documento é contrato formal no Core. Referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md). Estende [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) com resolução de último contexto. Subordinado a [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md).

---

## 1. Objetivo

- Fazer o sistema "lembrar" o utilizador — como um OS.
- O link "Já tenho acesso" / "Acesso existente" não é um login genérico; é retomar o último modo (Piloto ou Operacional) e a última rota onde o utilizador estava.

---

## 2. Comportamento

| Momento | Acção |
|---------|-------|
| **Navegação no app** | Quando o utilizador visita uma rota permitida, o cliente persiste essa rota (ex.: `sessionStorage`) com chave canónica (ex.: `chefiapp_lastRoute`). |
| **Após login/signup** | Antes de redireccionar, o cliente lê a última rota guardada. Se for uma rota permitida, redirecciona para ela; senão, redirecciona para `/app/dashboard`. |
| **Sessão já existente** | Se o utilizador já tem sessão e entra em `/auth` (ex.: "Acesso existente"), o mesmo critério aplica: redireccionar para última rota válida ou `/app/dashboard`. |

---

## 3. Rotas permitidas para last-context

A lista de rotas que podem ser guardadas e usadas como destino pós-login é fixa:

| Rota | Modo |
|------|------|
| `/dashboard` | Gestão (portal) |
| `/app/dashboard` | Gestão (portal) |
| `/op/tpv` | Operação (TPV) |
| `/op/kds` | Operação (KDS) |
| `/op/cash` | Operação (caixa) |

Nenhuma outra rota pode ser usada como destino de retoma. Rotas como `/bootstrap`, `/app/select-tenant`, `/auth` não são permitidas.

---

## 4. Implementação (referência)

- **Persistência:** Na árvore que monta as rotas de gestão/operação (ex.: `AppContentWithBilling`), em cada mudança de rota (`useLocation().pathname`), se a rota estiver na lista permitida, escrever em `sessionStorage` (chave `chefiapp_lastRoute`).
- **Leitura:** Na página de Auth, após login/signup ou ao detectar sessão existente, ler `chefiapp_lastRoute`; se o valor estiver na lista permitida, `navigate(valor, { replace: true })`; senão, `navigate("/app/dashboard", { replace: true })`.

---

## 5. Relação com AUTH_AND_ENTRY_CONTRACT

- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) define: login **sempre** entra em gestão (`/app/dashboard`) como **comportamento base**.
- Este contrato **estende** esse comportamento: o destino padrão continua a ser `/app/dashboard`, mas o cliente pode substituí-lo pela última rota válida quando existir, mantendo a lista de destinos permitidos (gestão + operação).

---

## 6. Referências

- [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md) — portal "Já tenho acesso"
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — auth e destino base
- [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md) — FlowGate, tenant
- [CANONICAL_ROUTES_BY_MODE.md](./CANONICAL_ROUTES_BY_MODE.md) — rotas por modo

**Violação:** Usar como destino de retoma uma rota fora da lista permitida é regressão arquitectural.
