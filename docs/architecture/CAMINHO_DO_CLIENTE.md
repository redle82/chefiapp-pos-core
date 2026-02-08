# CAMINHO DO CLIENTE — Visão Geral (GloriaFood / Toast / Square / Lightspeed)

**Status:** CANONICAL  
**Tipo:** Contrato de produto — fluxo do cliente do primeiro contacto à operação  
**Local:** docs/architecture/CAMINHO_DO_CLIENTE.md  
**Hierarquia:** Referenciado por [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) e [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)

---

## Regra-mãe

**Landing vende, Portal configura, Operação executa, Billing controla.**  
Nada se mistura.

---

## 1. Landing Page (Marketing Público)

| Campo | Valor |
|-------|--------|
| **URL** | `/` |
| **Função** | Explicar o produto, gerar confiança, converter |
| **CTAs possíveis** | Entrar em operação · Ver demonstração · Já tenho conta |

| CTA | Destino |
|-----|---------|
| Entrar em operação | `/signup` |
| Já tenho conta | `/auth` (login) |
| Ver demonstração | `/demo` (opcional) |

**Regra:** Sem runtime, sem Core, sem restaurante ativo. Igual GloriaFood, Toast, Square.

---

## 2. Signup / Criação de Conta

| Campo | Valor |
|-------|--------|
| **URL** | `/signup` |
| **O que acontece** | Cria conta do proprietário, cria `restaurant_id`, estado inicial do restaurante: `status: "draft"`, `isPublished: false`, `isOperational: false` |
| **Depois do signup** | Redireciona para `/app/dashboard` |

**Importante:** Não existe “wizard que prende”. O onboarding aconselha, não bloqueia.

---

## 2a. Bootstrap e seleção de tenant (pós-auth)

| Campo | Valor |
|-------|--------|
| **Rotas** | `/bootstrap`, `/app/select-tenant` |
| **Quando** | Após login/signup: se o utilizador não tiver nenhum restaurante → `/bootstrap`; se tiver 0 tenants após resolução → redirect para `/bootstrap`; se tiver 1 → auto-select e `/dashboard`; se tiver >1 → página de seleção em `/app/select-tenant`. |
| **Bootstrap** | Cria o primeiro restaurante (`gm_restaurants`) e o membro owner (`gm_restaurant_members`); destino `/app/dashboard`. |
| **Contratos** | [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md), [TENANT_SELECTION_CONTRACT.md](./TENANT_SELECTION_CONTRACT.md). |

**Regra:** Nenhuma rota `/app/*` (exceto `/app/select-tenant` e `/bootstrap`) monta sem tenant selado. FlowGate aplica esse gate.

---

## 3. Portal de Gestão (O Cérebro)

| Campo | Valor |
|-------|--------|
| **Base** | `/app` |
| **Rotas principais** | `/app/dashboard`, `/app/restaurant`, `/app/menu`, `/app/people`, `/app/payments`, `/app/billing`, `/app/settings`, `/app/publish` |

Aqui o cliente configura restaurante, cardápio, equipe, métodos de pagamento, faturação e publica o restaurante. Mesmo sem pagar ainda, pode configurar, explorar e ver o sistema. Igual GloriaFood e Lightspeed.

---

## 4. Billing / Pagamento (SaaS sério)

| Campo | Valor |
|-------|--------|
| **URL** | `/app/billing` |
| **O que acontece** | Escolhe plano, adiciona cartão, inicia assinatura |
| **Estados possíveis** | `billingStatus`: `trial` \| `active` \| `past_due` \| `suspended` |

**Regra:** Sem billing ativo → operação bloqueada. Com billing ativo → pode operar.  
Billing nunca bloqueia configuração, só operação.

---

## 5. Publicação do Restaurante

| Campo | Valor |
|-------|--------|
| **URL** | `/app/publish` |
| **Ação** | Botão “Publicar restaurante” |
| **Efeito** | `isPublished = true` |
| **Libera** | KDS, TPV, presença online, apps operacionais |

Antes disso, tudo aparece como “Em preparação”, não como erro.

---

## 6. Operação — Desktop do Cliente (TPV / KDS)

### TPV (Caixa)

| Campo | Valor |
|-------|--------|
| **URL** | `/op/tpv` |
| **Regras** | Exige `isPublished === true`, `billingStatus === active`, e caixa aberto |
| **Desktop** | Browser (ou PWA / Electron em fase seguinte) |

### KDS (Cozinha)

| Campo | Valor |
|-------|--------|
| **URL** | `/op/kds` |
| **Regras** | Mesmo gate do TPV; fullscreen, sem sidebar, sem distração |

---

## 7. Staff Mobile (Garçom / Cozinha / Sala)

- **App:** ChefIApp Staff (iOS / Android), não web.
- **Login:** QR Code, código curto ou conta já vinculada ao restaurante.
- Nunca entra pelo web. Igual Toast Go / Square Staff.

---

## 8. Presença Online do Restaurante (Website dele)

| Campo | Valor |
|-------|--------|
| **URL** | `/r/:slug` (ex.: `/r/sofia-gastrobar`) |
| **Conteúdo** | Menu público, horários, localização, pedido online (fase futura) |
| **Ativo só se** | `isPublished === true` |

*(Implementação atual do merchant-portal pode usar `/public/:slug`; o contrato de site público define a URL canónica.)*

---

## Fluxo resumido (como as grandes)

```
Landing (/)
  ↓
Signup (/auth?mode=signup ou /signup)
  ↓
Bootstrap ou Seleção de tenant
   ├── 0 restaurantes → /bootstrap → cria 1º restaurante → /app/dashboard
   ├── 1 restaurante → auto-select → /app/dashboard
   └── >1 restaurantes → /app/select-tenant → escolha → /app/dashboard
  ↓
Portal de Gestão (/app/dashboard)
  ↓
Configuração completa
  ↓
Billing (/app/billing)
  ↓
Publicar (/app/publish)
  ↓
Operação
   ├── TPV (/op/tpv)
   ├── KDS (/op/kds)
   └── Staff App (mobile)
```

---

## Por que isto funciona (e vende)

- Não assusta o cliente  
- Não prende em wizard  
- Mostra valor antes de cobrar  
- Separa gestão ≠ operação  
- Escala B2B internacional  
- É o modelo Toast / Square / Lightspeed / GloriaFood  

---

## Decisões fechadas (não reabrir)

O que está abaixo foi decidido e documentado como contrato. Não voltar a discutir como se fosse em aberto.

| Tema | Decisão |
|------|---------|
| Landing “boa o suficiente” | Está. Não bloquear produto por redesign da landing. |
| Trocar landing por template externo | Não precisa. Landing atual é a canónica. |
| Onboarding como wizard obrigatório | Não. Onboarding aconselha, não bloqueia. |
| “Qual é a rota certa” | Já definida neste documento e em CORE_RUNTIME_AND_ROUTES_CONTRACT. |
| “Como fazem as grandes” | Alinhado: mesmo fluxo GloriaFood / Toast / Square / Lightspeed. |

**Fechado e escrito:**

- Landing vende
- Portal configura
- Billing controla
- Operação executa
- Staff é mobile
- Web pública só após publish

A arquitetura mental do produto está correta. O caminho do cliente está claro. Este documento existe para evitar regressão e confusão no futuro. O próximo passo não é refazer fundação — é **execução incremental**: melhorar copy, afinar gates, amarrar billing, empacotar desktop (PWA/Electron depois), vender.

---

## Próximos passos (escala) — documentados

Os itens abaixo foram formalizados em contratos MD:

| Item | Documento |
|------|------------|
| Mapa visual do Customer Journey | [CUSTOMER_JOURNEY_MAP.md](./CUSTOMER_JOURNEY_MAP.md) |
| Checklist “ready to publish” | [READY_TO_PUBLISH_CHECKLIST.md](./READY_TO_PUBLISH_CHECKLIST.md) |
| Contrato de billing e suspensão | [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) |
| Contrato de distribuição desktop | [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md) |

**Índice rota → contrato:** [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — toda a rota oficial mapeada para o contrato MD que a governa.

---

## Referências

- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — índice canónico: rota → contrato MD
- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — rotas oficiais e runtime
- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — boot por camada (PUBLIC / AUTH / MANAGEMENT / OPERATIONAL)
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — gates de /op/*
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — login/signup → /app/dashboard
- [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) — estados e bloqueio de operação
- [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md) — PWA/Electron
- [READY_TO_PUBLISH_CHECKLIST.md](./READY_TO_PUBLISH_CHECKLIST.md) — checklist para publicar
- [CUSTOMER_JOURNEY_MAP.md](./CUSTOMER_JOURNEY_MAP.md) — mapa do fluxo do cliente

**Violação = regressão de produto.**
