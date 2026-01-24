# Arquitetura Multi-Core — ChefIApp

Decisão estratégica: poucos núcleos soberanos, muitos adaptadores. Só vira Core o que define a realidade do sistema.

## Núcleos
- **Core Restaurante**: TPV, Fidelização, Menu, Preço, Clientes, Contratos públicos.
- **Core AppStaff**: Trabalho humano, turnos, tarefas, conformidade, justiça operacional.
- **Core Inteligência (futuro)**: Modelos, previsões, otimização, recomendações governadas.

## Regras de Ouro
- Integrações como sensores/atuadores: não possuem verdade própria.
- Contratos públicos descrevem promessas ao usuário (preview, URL, live), não o processo interno.
- Ontologia única por núcleo; acoplamento entre núcleos via eventos e contratos estáveis.

## Camadas
- **Adapter Layer**: Marketplaces, mensageria, pagamentos externos, delivery.
- **Core Layer**: Ontologia, contratos, invariantes, event log, projeções.
- **External Services**: armazenamentos auxiliares, BI, monitoramento.

## Fluxo de Responsabilidade
- Mudança em adapter não exige mudança de Core.
- Verdade operacional nasce do Core e é auditável.
- Legal Adaptation Engine cruza núcleos via perfis por país.

## ASCII — Mapa Simplificado

```
          ┌────────────────────────────┐
          │     MARKETPLACES            │
          │ Glovo / Uber / Just Eat     │
          └───────────┬────────────────┘
                      │ (Pedidos, status)
                      ▼
        ┌──────────────────────────────────┐
        │        ADAPTER LAYER              │
        │  (sem regra, sem verdade)         │
        └───────────┬──────────────────────┘
                    ▼
        ┌──────────────────────────────────┐
        │        CHEFIAPP CORE              │
        │ Ontologia • Contratos • Fluxo    │
        │ Verdade • Fidelização • TPV      │
        └───────────┬───────────┬─────────┘
                    │           │
        ┌───────────▼───┐   ┌───▼──────────┐
        │  WEB CLIENTE   │   │  APPSTAFF    │
        │ Página + Pedido│   │ Trabalho Hum.│
        │ Fidelização    │   │ Tarefas      │
        └───────────────┘   └──────────────┘
```

## Princípios de Evolução
- Substitua serviços externos quando definirem verdade crítica (ex.: fidelização).
- Preserve interfaces de contratos ao evoluir núcleos.
- Auditabilidade e imutabilidade como base (event sourcing).
