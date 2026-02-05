# ONBOARDING_FLOW_CONTRACT — Fluxo de onboarding (4 passos)

**Propósito:** Contrato único do fluxo de onboarding: estados, passagens, modais vs páginas, critérios de "pronto para operação" e retomada. Fonte de verdade para implementação (FlowGate, CoreFlow, UI).

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [TRIAL_ACCOUNT_CONTRACT.md](TRIAL_ACCOUNT_CONTRACT.md), [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md), [MENU_MINIMAL_CONTRACT.md](MENU_MINIMAL_CONTRACT.md), [OPERATION_MODE_CONTRACT.md](OPERATION_MODE_CONTRACT.md), [FIRST_SALE_RITUAL.md](FIRST_SALE_RITUAL.md), [TRIAL_OPERATION_CONTRACT.md](TRIAL_OPERATION_CONTRACT.md).

Este contrato cobre os passos **3 (Bootstrap)** a **6 (Trial silencioso)** da [Sequência Canônica v1.0](FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10): o wizard (passos 3–5) conduz ao passo 6. Landing e Auth são LANDING_ENTRY e TRIAL_ACCOUNT; Trial em background e Billing são TRIAL_OPERATION e [TRIAL_TO_PAID_CONTRACT](TRIAL_TO_PAID_CONTRACT.md).

---

## 1. Âmbito

Fluxo **Trial Account → Restaurante operacional** (primeira venda feita). Inclui apenas os **4 passos** do funil:

1. Criar restaurante  
2. Criar menu mínimo  
3. Escolher modo de operação  
4. Primeira venda (guiada)

Tudo o que vem antes (Landing, Signup/Login, Trial Account) é coberto por LANDING_ENTRY e TRIAL_ACCOUNT. Tudo o que vem depois (Dashboard, TPV, KDS, AppStaff) é operação normal (TRIAL_OPERATION).

---

## 2. Estados do fluxo

| Estado | Descrição | Quem dispara a transição |
|--------|-----------|---------------------------|
| `trial_no_restaurant` | User + Trial ativos; restaurante ainda não criado. | — (entrada do fluxo) |
| `restaurant_bootstrap` | Restaurante criado; menu ainda não mínimo. | UI: submissão do formulário "Criar restaurante" → Core persiste. |
| `menu_minimal` | Menu válido (1 categoria, 1 produto, preço). | UI: conclusão do passo menu mínimo → Core persiste. |
| `operation_mode_set` | Modo escolhido (vender agora / configurar melhor). | UI: escolha no passo 3 → Core ou estado local persiste. |
| `first_sale_done` | Primeira venda realizada (pedido criado e pago). | Core: evento de pedido pago; UI pode marcar "ritual concluído". |
| `operational` | Restaurante em vida normal do trial (Dashboard, TPV, KDS). | Automático após first_sale_done; FlowGate/CoreFlow permitem rotas operacionais. |

**Transições:** lineares para efeito de onboarding (não se regride de passo sem motivo explícito). Retomada: ver secção 5.

---

## 3. Modais sequenciais vs páginas

**Regra:** As telas de onboarding (passos 1–4 do wizard, correspondentes às telas 3–6 do mapa de 10 telas) são **modais sequenciais**, não páginas grandes. O mesmo fluxo em web e mobile; state-driven, não device-driven.

**Mapeamento estado actual vs alvo:**

| Passo | Contrato | Estado actual (rotas) | Alvo |
|-------|----------|------------------------|------|
| 1 | RESTAURANT_BOOTSTRAP | `/app/bootstrap` (BootstrapPage — página única) | Modal "Criar restaurante" ou manter página mínima; decisão de produto. |
| 2 | MENU_MINIMAL | `/app/setup/menu`, `/onboarding/first-product` (FirstProductPage) | Modal "Menu mínimo" (1 categoria, 1 produto, preço). |
| 3 | OPERATION_MODE | Não existe rota dedicada | Modal "Escolher modo" (vender agora / configurar melhor). |
| 4 | FIRST_SALE_RITUAL | Redirecionamento para TPV; primeira venda no TPV | Fluxo guiado: abrir turno → criar pedido → marcar pago (pode ser modal + TPV embebido ou passo a passo). |

A implementação actual pode manter páginas até haver recursos para modais; o contrato define o **alvo** (modais sequenciais) para coerência com a visão "venda em minutos".

---

## 4. Critérios de conclusão por passo

- **Passo 1 (Criar restaurante):** Conforme [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md). Obrigatório: nome do restaurante, país/moeda, tipo de serviço. Estado após: Restaurant criado, status bootstrap.  
- **Passo 2 (Menu mínimo):** Conforme [MENU_MINIMAL_CONTRACT.md](MENU_MINIMAL_CONTRACT.md). Obrigatório: 1 categoria, 1 produto, preço. Estado após: menu válido (mínimo).  
- **Passo 3 (Escolher modo):** Conforme [OPERATION_MODE_CONTRACT.md](OPERATION_MODE_CONTRACT.md). Escolha registada; UI adapta (CTA para TPV vs Config). Estado após: modo definido.  
- **Passo 4 (Primeira venda):** Conforme [FIRST_SALE_RITUAL.md](FIRST_SALE_RITUAL.md). Ritual: abrir TPV/turno se aplicável → criar pedido com pelo menos um item → marcar como pago. Estado após: Trial ativo, Restaurant operacional.

A passagem ao passo seguinte só ocorre quando o critério do passo actual está satisfeito (persistência no Core ou estado derivado).

### Obrigatório vs pulável (alinhado à Sequência Canônica v1.0)

| Passo do onboarding | Obrigatório? | Notas |
|---------------------|--------------|-------|
| 1 — Bootstrap (criar restaurante) | Sim | Sem restaurante não se avança. |
| 2 — Menu mínimo / primeiro produto | Não (pulável) | "Continuar sem adicionar agora"; UI pode permitir pular. |
| 3 — Escolher modo | Implícito ou opcional | Pode estar implícito na UI (ex.: CTA direto para TPV). |
| 4 — Primeira venda (Aha Moment) | Sim | Destrava operacional; obrigatório para passar a operacional. |

---

## 5. Retomada

Se o utilizador sair a meio (fecha o browser, muda de dispositivo, etc.):

- **Persistência:** O estado de onboarding é **state-driven** e persistido no backend por tenant (restaurant_id). Restaurante criado, menu mínimo, e primeira venda são dados no Core; o modo de operação pode estar no Core ou em configuração do tenant.
- **Retomar:** Ao voltar (mesmo dispositivo ou outro), o FlowGate/CoreFlow determinam o destino com base em: tem restaurante? tem menu mínimo? primeira venda feita? Se sim → destino operacional (ex.: `/app/dashboard`). Se não → destino ao primeiro passo em falta (ex.: ainda sem restaurante → bootstrap; sem menu mínimo → passo menu; etc.).
- **Não recomeçar do zero:** Nunca apagar restaurante ou menu já criados para "recomeçar o wizard"; apenas continuar do passo em falta.

---

## 6. Referências

- **Funil e telas:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md)  
- **Contratos de passagem:** RESTAURANT_BOOTSTRAP, MENU_MINIMAL, OPERATION_MODE, FIRST_SALE_RITUAL, TRIAL_OPERATION  
- **Implementação:** FlowGate, CoreFlow (rotas e destino canónico); BootstrapPage, FirstProductPage, TPV (ritual). O contrato é a fonte de verdade; o código implementa.
