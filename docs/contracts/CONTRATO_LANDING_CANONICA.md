# Contrato Landing Canónica — Uma landing, um preço, uma promessa

**Frase de autoridade:** _Um produto sério tem uma landing, um preço, uma promessa. O resto são variações internas (legacy, piloto, B2B), nunca visíveis ao primeiro contacto._

**Decisão selada:** O visitante (VISITOR) vê sempre a mesma verdade: landing operacional, preço 79 €/mês, uma única porta de entrada. Qualquer desvio é bug de produto.

---

## (A) Rota e conteúdo canónicos

| Dimensão     | Valor canónico                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Rota**     | `/` — URL limpa; utilizador abre o site e vê a landing operacional.                                                                |
| **Conteúdo** | Landing operacional: Hero com logo central, "Sistema **OPERACIONAL** para Restaurantes", subcopy TPV/cozinha/caixa no mesmo fluxo. |
| **Preço**    | **79 €/mês** — única fonte de verdade exibida ao visitante. Fonte de código: `merchant-portal/src/core/pricing/canonicalPrice.ts`. |
| **Promessa** | "TPV, cozinha e caixa no mesmo fluxo." — identidade operacional; sem "Execução em tempo real" como hero na primeira impressão.     |

**Proibido ao visitante:** 49 €, 99 €, ou qualquer outro preço como oferta principal; segunda landing como entry-point; modal/overlay como primeira página.

---

## (B) Portas de serviço (não são entry-point)

| Porta             | Uso                                             | Regra                                                                                             |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **/landing**      | Alias legado.                                   | Redireciona para `/` (uma única URL canónica).                                                    |
| **/app/demo-tpv** | Demo TPV com overlay (ProductFirstLandingPage). | Rota interna; não linkada na jornada VISITOR (Hero, Footer, FlowGate). Não é primeira impressão.  |
| **/auth**         | Registo/login.                                  | Destino após CTAs "Começar agora" / "Já tenho acesso"; nunca a primeira coisa que o visitante vê. |
| **/demo-guiado**  | Prova de fluxo (3 min).                         | Acessível via CTA na landing; não substitui a landing como porta principal.                       |

---

## (C) Destino canónico do VISITOR (FlowGate / LifecycleState)

Quando o gate redireciona um VISITOR (rota não permitida ou primeira entrada), o destino é a **landing operacional** (`/`), não o auth.

| Estado      | Destino canónico | Rotas permitidas (exemplos)                                                                     |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **VISITOR** | `/`              | `/`, `/landing`, `/pricing`, `/features`, `/demo-guiado`, `/demo`, `/auth`, `/help/start-local` |

Implementação: `CANONICAL_DESTINATION[VISITOR] = "/"` em `merchant-portal/src/core/lifecycle/LifecycleState.ts`. Rotas permitidas em `ROUTES_BY_STATE[VISITOR]` incluem `"/"` e `"/landing"`; `/landing` redireciona para `/` no router.

---

## (D) Fonte única de preço

- **Ficheiro:** `merchant-portal/src/core/pricing/canonicalPrice.ts`
- **Constantes:** `CANONICAL_MONTHLY_PRICE_EUR = 79`, `CANONICAL_MONTHLY_PRICE_LABEL = "79 €/mês"`, `CANONICAL_MONTHLY_PRICE_OVERLAY` para overlay/modal.
- **Uso obrigatório:** Hero, FAQ, Pricing, Auth e Demo não devem exibir 49 nem 99 ao visitante; qualquer valor de preço visível deve vir de `canonicalPrice.ts`.

---

**Regra de cumprimento:** Qualquer alteração à rota de entrada, conteúdo da primeira página, preço exibido ao visitante ou destino do VISITOR no gate deve respeitar este contrato. O código executa esta lei; não a inventa.
