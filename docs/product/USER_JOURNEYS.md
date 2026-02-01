# User Journeys — ChefIApp

**Propósito:** Documento canónico único que consolida os **percursos do utilizador**: do primeiro contacto à operação. Consolida [CAMINHO_DO_CLIENTE.md](../architecture/CAMINHO_DO_CLIENTE.md) e [CUSTOMER_JOURNEY_MAP.md](../architecture/CUSTOMER_JOURNEY_MAP.md).  
**Público:** Produto, vendas, engenharia.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [ROTAS_E_CONTRATOS.md](../architecture/ROTAS_E_CONTRATOS.md)

---

## 1. Regra-mãe

**Landing vende, Portal configura, Operação executa, Billing controla.**  
Nada se mistura. Alinhado ao modelo GloriaFood / Toast / Square / Lightspeed.

---

## 2. Resumo do percurso

```
Landing (/)
  → Signup (/signup ou /auth?mode=signup)
  → Bootstrap ou Seleção de tenant
      · 0 restaurantes → /bootstrap → cria 1º restaurante → /app/dashboard
      · 1 restaurante → auto-select → /app/dashboard
      · >1 restaurantes → /app/select-tenant → escolha → /app/dashboard
  → Portal de Gestão (/app/dashboard)
  → Configuração (restaurante, cardápio, billing, equipa)
  → Billing (/app/billing) — trial ou active
  → Publicar (/app/publish) — isPublished = true
  → Operação
      · TPV (/op/tpv)
      · KDS (/op/kds)
      · Staff App (mobile)
  → (opcional) Presença online (/public/:slug ou /r/:slug)
```

---

## 3. User journeys por fase

### 3.1 Landing (Marketing Público)

| Campo | Valor |
|-------|--------|
| **URL** | `/` |
| **Função** | Explicar o produto, gerar confiança, converter. |
| **CTAs** | Entrar em operação → `/signup` · Já tenho conta → `/auth` · Ver demonstração → `/demo` |
| **Regra** | Sem runtime, sem Core, sem restaurante ativo. |

### 3.2 Signup e criação de conta

| Campo | Valor |
|-------|--------|
| **URL** | `/signup` (redireciona para `/auth?mode=signup`) |
| **O que acontece** | Cria conta (Supabase Auth); não cria restaurante nesta etapa. |
| **Depois** | Redireciona para destino que exige tenant (bootstrap ou select-tenant ou dashboard conforme resolução). |

### 3.3 Bootstrap e seleção de tenant

| Caso | Ação | Destino |
|------|------|---------|
| **0 restaurantes** | Redirect `/bootstrap` → cria 1º restaurante (gm_restaurants) + owner (gm_restaurant_members) | `/app/dashboard` |
| **1 restaurante** | Auto-select tenant | `/app/dashboard` |
| **>1 restaurantes** | Página `/app/select-tenant` → utilizador escolhe | `/app/dashboard` |

**Regra:** Nenhuma rota `/app/*` (exceto `/app/select-tenant` e `/bootstrap`) monta sem tenant selado.

### 3.4 Portal de gestão (O Cérebro)

| Campo | Valor |
|-------|--------|
| **Base** | `/app` |
| **Rotas principais** | `/app/dashboard`, `/app/restaurant`, `/app/menu`, `/app/people`, `/app/billing`, `/app/settings`, `/app/publish`, `/app/install` |
| **Função** | Configurar restaurante, cardápio, equipa, pagamentos, faturação; publicar. Mesmo sem pagar ainda, pode configurar e explorar. |

### 3.5 Billing (SaaS)

| Campo | Valor |
|-------|--------|
| **URL** | `/app/billing` |
| **O que acontece** | Escolher plano, adicionar cartão, iniciar assinatura. |
| **Estados** | trial | active | past_due | suspended |
| **Regra** | Sem billing ativo → operação bloqueada. Billing nunca bloqueia configuração, só operação. |

### 3.6 Publicação

| Campo | Valor |
|-------|--------|
| **URL** | `/app/publish` |
| **Ação** | Botão "Publicar restaurante" → isPublished = true |
| **Libera** | KDS, TPV, presença online, apps operacionais. |
| **Antes** | Tudo aparece como "Em preparação", não como erro. |

### 3.7 Operação

| Terminal | URL / Onde | Regras |
|----------|------------|--------|
| **TPV** | `/op/tpv` | isPublished + billing ativo + (para vendas reais) caixa aberto. |
| **KDS** | `/op/kds` | isPublished + billing ativo; fullscreen. |
| **Caixa** | `/op/cash` | operational (turno aberto). |
| **Staff** | App mobile (iOS/Android) | Login, check-in, tarefas; não web. |

### 3.8 Presença online do restaurante

| Campo | Valor |
|-------|--------|
| **URL** | `/public/:slug` (ou canónico `/r/:slug`) |
| **Conteúdo** | Menu público, horários, localização; pedido online (fase futura). |
| **Ativo só se** | isPublished === true. |

---

## 4. Mapa visual (ASCII)

Ver diagrama completo em [CUSTOMER_JOURNEY_MAP.md](../architecture/CUSTOMER_JOURNEY_MAP.md). Resumo:

```
Landing → Signup → Bootstrap/Select-tenant → Portal → Billing → Publish → Operação (TPV | KDS | Staff)
                                                                              ↓
                                                                    Presença online (/public/:slug)
```

---

## 5. Referências

- [CAMINHO_DO_CLIENTE.md](../architecture/CAMINHO_DO_CLIENTE.md) — Contrato completo do fluxo; decisões fechadas.
- [CUSTOMER_JOURNEY_MAP.md](../architecture/CUSTOMER_JOURNEY_MAP.md) — Mapa ASCII detalhado.
- [ROTAS_E_CONTRATOS.md](../architecture/ROTAS_E_CONTRATOS.md) — Rota → contrato MD.
- [READY_TO_PUBLISH_CHECKLIST.md](../architecture/READY_TO_PUBLISH_CHECKLIST.md) — Checklist antes de publicar.
- **USER_JOURNEYS.md** — Este documento (consolidado).

---

*Documento vivo. Alterações no percurso do cliente devem ser reflectidas em CAMINHO_DO_CLIENTE e nos contratos de rota.*
