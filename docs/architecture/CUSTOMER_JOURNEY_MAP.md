# CUSTOMER_JOURNEY_MAP — Mapa do fluxo do cliente

**Status:** CANONICAL
**Tipo:** Mapa visual (texto/ASCII) do caminho do cliente
**Local:** docs/architecture/CUSTOMER_JOURNEY_MAP.md
**Hierarquia:** Subordinado a [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Objetivo

Diagrama do fluxo Landing → Signup → Portal → Billing → Publish → Operação para vendas, onboarding e comunicação. Fonte de verdade do fluxo: [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md).

---

## Mapa (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. LANDING (Marketing Público)                                            │
│  /                                                                          │
│  • Explicar produto • Gerar confiança • Converter                            │
│  CTAs: Entrar em operação → /signup │ Já tenho conta → /auth │ Demo → /demo │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. SIGNUP / Criação de conta                                               │
│  /signup                                                                     │
│  • Cria conta + restaurant_id • status: draft, isPublished: false            │
│  → Redireciona para /app/dashboard (sem wizard que prende)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. PORTAL DE GESTÃO (O Cérebro)                                            │
│  /app/dashboard │ /app/restaurant │ /app/menu │ /app/people │ /app/payments  │
│  /app/billing │ /app/settings │ /app/publish                                 │
│  • Configurar tudo • Mesmo sem pagar pode explorar                           │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────┐
│  4. BILLING                   │    │  5. PUBLICAR                           │
│  /app/billing                 │    │  /app/publish                           │
│  • Plano • Cartão • Assinatura│    │  • Botão "Publicar restaurante"        │
│  Estados: trial │ active │    │    │  • isPublished = true                  │
│  past_due │ suspended          │    │  • Libera TPV, KDS, web, apps          │
└──────────────────────────────┘    └──────────────────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. OPERAÇÃO                                                                 │
│  /op/tpv (TPV) │ /op/kds (KDS) │ Staff App (mobile)                         │
│  Gates: isPublished + billing ativo + caixa (TPV)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. STAFF MOBILE (iOS/Android)     │  8. PRESENÇA ONLINE                    │
│  • QR / código curto               │  /r/:slug ou /public/:slug             │
│  • Nunca pelo web                   │  Menu, horários; ativo se published   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo em uma linha

**Landing → Signup → Portal → Billing → Publicar → Operação (TPV / KDS / Staff).**

Landing vende. Portal configura. Billing controla. Operação executa. Nada se mistura.

---

## Referências

- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — contrato completo do fluxo
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — rota → contrato MD
