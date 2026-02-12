# Contrato de Modo Trial

## Lei do sistema

**O modo Trial é observação sem identidade forte. Trial nunca cria restaurante, nunca activa piloto, nunca escreve no Core.**

Este documento é contrato formal no Core. Referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md). Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) (modo PUBLIC) e a [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md).

---

## 1. Definição

| Aspecto            | Especificação                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **O que é**        | Modo de observação e aprendizagem; sem identidade forte; dados explicativos ou fake                                                                                       |
| **Onde se activa** | Entrada por "Explorar trial" → rota `/trial-guide`                                                                                                                        |
| **Boot**           | PUBLIC — não inicializa Runtime nem Core ([APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md))                                                                 |
| **Estado global**  | Quando aplicável (ex.: tour dentro da app), GlobalUIState (ou equivalente) deve expor `isTrial === true`; ver [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md) |

---

## 2. Regras obrigatórias

- **Trial nunca cria restaurante.** Nenhum fluxo iniciado a partir de `/trial-guide` pode criar `gm_restaurants` nem owner.
- **Trial nunca activa piloto.** Não há transição Trial → Piloto sem passar por Auth e portal.
- **Trial nunca escreve no Core.** Nenhuma chamada REST/RPC ao Core (pedidos, menu, billing, etc.) com efeito persistente pode ser originada no modo Trial.
- **Rotas no modo Trial:** Apenas `/` e `/trial-guide` são consideradas "no modo Trial". Rotas `/app/*` e `/op/*` não são acessíveis no modo Trial puro (sem auth).

---

## 3. CTAs na tela Trial

- O CTA principal na página `/trial-guide` deve declarar intenção de "explorar o sistema" ou "operar de verdade", não "abrir meu dashboard" sem contexto.
- Se o utilizador quiser operar com dados reais, o destino é `/auth` (não `/dashboard` sem sessão).
- Copy canónica: "Explorar o Sistema (Trial)" para o botão que leva a `/auth`; "Voltar à landing" para regressar a `/`.

---

## 4. Referências

- [NAVIGATION_OPERATIONAL_CONTRACT.md](./NAVIGATION_OPERATIONAL_CONTRACT.md) — fluxo Trial → TPV trial → /trial-guide (nunca landing); 5 estados
- [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md) — botão Explorar trial; três portais
- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — PUBLIC não inicializa Core
- [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) — rotas públicas
- [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md) — isTrial
- [CANONICAL_ROUTES_BY_MODE.md](./CANONICAL_ROUTES_BY_MODE.md) — mapa rota → modo

**Violação:** Trial que cria restaurante, activa piloto ou escreve no Core é regressão arquitectural.
