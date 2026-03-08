# Arquitetura merchant-portal

> Documento canónico da arquitetura do merchant-portal.
> Atualizado durante refatoração cirúrgica.

## Visão Geral

O merchant-portal é a aplicação web principal do ChefIApp, servindo:
- TPV (Terminal Ponto de Venda)
- KDS (Kitchen Display System)
- Onboarding e configuração de restaurantes
- Dashboard e relatórios
- App Staff (operação mobile-first)

## Stack Tecnológico

- **Build:** Vite 7.2.4
- **Framework:** React 19.2.0
- **Linguagem:** TypeScript 5.9.3
- **Estado:** Context API + Zustand
- **Estilo:** Tailwind CSS 4.x + core-design-system
- **Mobile:** Capacitor 8.x
- **i18n:** react-i18next (pt-BR, pt-PT, en, es)

## Arquitetura de Camadas

```
src/
├── app/              # Bootstrap, routing, providers globais
├── domain/           # Regras puras (sem React, sem API)
│   ├── payment/      # Cálculos e validações de pagamento
│   ├── order/        # Cálculos de pedidos, status helpers
│   ├── kitchen/      # Tempo de preparo, estados de timer
│   ├── restaurant/   # Validação de identidade/localização
│   └── reports/      # Agregações e formatação
├── infra/            # Integrações externas
│   ├── payments/     # Providers: Stripe, SumUp, Pix, Manual
│   ├── docker-core/  # Cliente PostgREST
│   ├── readers/      # Leitura de dados do Core
│   ├── writers/      # Escrita de dados no Core
│   └── schemas/      # Validação Zod de payloads
├── features/         # Módulos de produto (UI + hooks)
│   ├── onboarding/   # Fluxo de onboarding
│   ├── tpv/          # Terminal de venda
│   ├── kds/          # Display de cozinha
│   ├── config/       # Configuração do restaurante
│   ├── billing/      # Faturação e planos
│   └── reports/      # Relatórios
├── shared/           # Código compartilhado
│   ├── ui/           # Primitives de UI
│   ├── utils/        # Utilitários puros
│   └── types/        # Tipos base
├── core/             # (legado, migrar gradualmente para domain/)
├── pages/            # (legado, migrar gradualmente para features/)
├── components/       # (legado, migrar para features/ ou shared/ui/)
├── ui/               # Design system
├── hooks/            # Hooks compartilhados
├── locales/          # Traduções i18n
├── context/          # Context providers globais
└── routes/           # Configuração de rotas
```

## Regras de Dependência

```
┌─────────────────────────────────────────────────────────────┐
│                        features/                             │
│  (UI + hooks, importa de domain/ e infra/)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         domain/                              │
│  (regras puras, SEM React, SEM infra)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          infra/                              │
│  (integrações, implementa interfaces de domain/)            │
└─────────────────────────────────────────────────────────────┘
```

**Regra sagrada:**
1. `domain/` NÃO importa React nem infra
2. `features/` importa de `domain/` e `infra/`, nunca o contrário
3. UI NÃO contém regra de negócio
4. Toda lógica de cálculo, validação e transição de estado vive em `domain/`

## Módulos Principais

### TPV (Terminal Ponto de Venda)
- **Localização:** `features/tpv/` (alvo) / `pages/TPV/` (atual)
- **Responsabilidade:** Operação de caixa, pedidos, pagamentos
- **Arquivos críticos:** TPV.tsx (2774 linhas - refatorar)

### KDS (Kitchen Display System)
- **Localização:** `features/kds/` (alvo) / `pages/KDS/` (atual)
- **Responsabilidade:** Display de pedidos para cozinha
- **Arquivos críticos:** KDSMinimal.tsx (1356 linhas)

### Onboarding
- **Localização:** `features/onboarding/` (alvo) / `pages/Onboarding/` (atual)
- **Responsabilidade:** Setup inicial do restaurante
- **Seções:** Identity, Location, Schedule, People, Payments, Publish

### Config
- **Localização:** `features/config/` (alvo) / `pages/Config/` (atual)
- **Responsabilidade:** Configuração permanente do restaurante
- **i18n:** Namespace `config` em 4 locales

### Billing
- **Localização:** `features/billing/` (alvo) / `pages/Billing/` (atual)
- **Responsabilidade:** Planos, assinatura, checkout Stripe

## Estado da Aplicação

### Context Providers (principais)
- `AuthProvider` - Autenticação
- `TenantContext` - Restaurante atual
- `RestaurantRuntimeContext` - Runtime operacional
- `ShiftContext` - Turno atual
- `OrderProvider` - Pedidos TPV

### Zustand Stores
- `useOperationalStore` - KPIs, pedidos, cozinha, stock
- `useCatalogStore` - Produtos, categorias, modificadores

## Integrações de Pagamento

| Provider | Região | Status |
|----------|--------|--------|
| Stripe | Global | Ativo |
| SumUp | Europa | Ativo |
| PIX | Brasil | Ativo |
| MB Way | Portugal | Ativo |
| Manual/Cash | Global | Ativo |
| CashKeeper | Europa | Planejado |

## Mapa de Rotas Principais

| Rota | Módulo | Descrição |
|------|--------|-----------|
| `/tpv` | TPV | Terminal de venda |
| `/kds` | KDS | Display de cozinha |
| `/onboarding/*` | Onboarding | Setup do restaurante |
| `/config/*` | Config | Configuração |
| `/billing` | Billing | Faturação |
| `/dashboard` | Dashboard | Visão geral |
| `/app/staff/*` | AppStaff | App operacional |

## Histórico de Refatoração

### 2026-02-22 - Refatoração Cirúrgica Total

**Concluído:**
- ✅ Criada estrutura `domain/` com 5 subdomínios (payment, order, kitchen, restaurant, reports)
- ✅ Criada estrutura `shared/ui/` com primitives consolidados
- ✅ Criado Payment Layer plugável em `infra/payments/`
- ✅ Adicionado Zod para validação de schemas em `infra/schemas/`
- ✅ Configurados path aliases (@domain, @infra, @features, @shared, @core)
- ✅ Removidos arquivos legacy
- ✅ PaymentModal refatorado para usar domain layer

**Pendente:**
- Eliminar 529 ocorrências de `any`
- Migrar `pages/` para `features/` gradualmente
- Consolidar Context Providers duplicados

Ver `docs/MIGRATION.md` para detalhes completos.

---

*Última atualização: 2026-02-22*
