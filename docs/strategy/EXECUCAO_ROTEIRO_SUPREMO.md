# Execução Roteiro Supremo — Core ON

**Data:** 2026-02-03
**Estado:** A verificado; B–G para executar no browser.

---

## 0) Pré-check (Preflight com Core OFF)

Para confirmar que o preflight funciona: com Core **parado**, abrir `/dashboard` → deves ver **"Operação: Bloqueado — Core offline"** e CTA "Ver instruções".
_(Opcional: `docker compose -f docker-compose.core.yml down` → abrir <http://localhost:5175/dashboard> → confirmar → depois `up -d` de novo.)_

---

## A) Subir o Core ✅ EXECUTADO

| Passo | Comando / Verificação                                               | Resultado                                       |
| ----- | ------------------------------------------------------------------- | ----------------------------------------------- |
| 1     | `cd docker-core && docker compose -f docker-compose.core.yml up -d` | Core já estava no ar.                           |
| 2     | `docker ps --format "table {{.Names}}\t{{.Ports}}"`                 | nginx 3001, postgres 54320→5432, realtime 4000. |
| 3     | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/`     | **200** = OK.                                   |

**Conclusão A:** PostgREST responde; Core é a autoridade central.

---

## B) Ver o dashboard reagir (sem refresh manual)

- **URL:** <http://localhost:5175/dashboard>
- **Pré-requisito:** Sessão autenticada (ex.: "Simular Registo (Piloto)" em `/auth` → bootstrap/config já feitos).
- **O que ver:**
  - Core online → cartão **Operação** com **Pronto** (verde).
  - **Abrir TPV** habilitado (não cinzento).
  - Nenhum blocker "Core offline".
- **Se não mudar:** wiring do health/preflight (polling ou contexto).

---

## C) Abrir TPV e iniciar operação

| Passo | Ação                                                                     | Critério                                                                     |
| ----- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 5     | Clicar **Abrir TPV** no dashboard ou ir a <http://localhost:5175/op/tpv> | TPV carrega.                                                                 |
| 6     | No TPV: botão **Abrir Turno** → clicar                                   | Toast de sucesso; sem redirect. Produtos visíveis; sem aviso "Core offline". |

---

## D) Criar pedido (TPV → Core)

| Passo | Ação                                                       | Critério                                         |
| ----- | ---------------------------------------------------------- | ------------------------------------------------ |
| 7     | Selecionar **Mesa** ou **Balcão**; adicionar **1 produto** | Pedido nasce (OPEN). Carrinho vira pedido ativo. |

---

## E) Enviar à cozinha (TPV → KDS)

| Passo | Ação                                    | Critério          |
| ----- | --------------------------------------- | ----------------- |
| 8     | No TPV: **Preparar / Enviar à cozinha** | Pedido → IN_PREP. |

---

## F) Cozinha (KDS)

| Passo | Ação                                 | Critério                        |
| ----- | ------------------------------------ | ------------------------------- |
| 9     | Abrir <http://localhost:5175/op/kds> | KDS carrega.                    |
| 10    | Ver pedido e itens                   | Pedido visível; itens listados. |
| 11    | **Marcar item pronto**               | Item → READY.                   |

---

## G) Fecho (TPV)

| Passo | Ação                  | Critério                                                                    |
| ----- | --------------------- | --------------------------------------------------------------------------- |
| 12    | Voltar ao TPV         | Pedido aparece como READY.                                                  |
| 13    | **Servir**            | Transição correta.                                                          |
| 14    | **Pagar** → confirmar | Fluxo de pagamento executa.                                                 |
| 15    | —                     | Pedido → CLOSED. Caixa/turno continuam abertos. Sem erro/redirect estranho. |

---

## Critério final (binário)

O roteiro **PASSA** se:

- TPV cria pedidos.
- KDS não cria pedidos (só executa).
- Estados fluem: **OPEN → IN_PREP → READY → CLOSED**.
- Dashboard, TPV e KDS mostram a mesma realidade.
- Core é a única autoridade.

Se isso acontecer → **ChefIApp está operacional de verdade.**

---

## Resumo de comandos (referência)

```bash
# Core
cd docker-core
docker compose -f docker-compose.core.yml up -d
docker compose -f docker-compose.core.yml ps
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/

# Frontend (se precisar)
cd merchant-portal && npm run dev
# → http://localhost:5175
```
