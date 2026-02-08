# Menu Core Contract — Contrato arterial do sistema

> **Propósito:** Definir o Menu como fonte primária de verdade operacional (artéria central). Posição na hierarquia do Core, dependentes downstream, invariantes, relação com Financial Core e Bootstrap. Nenhuma alteração aqui sobrepõe o Docker Financial Core.

---

## Soberania

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

**Posição hierárquica:** Segundo contrato mais importante do sistema. Analogia: Rei = Core Financeiro (verdade última); Rainha = Menu Core (movimenta, conecta, alimenta, propaga). Se a Rainha cai, o jogo continua… mas em colapso estratégico.

---

## 1. Papel do Menu (fonte primária de verdade operacional)

O Menu **não é uma feature**. É o **contrato arterial do sistema**. Se ele falha, todo o organismo entra em falência parcial.

O Menu é a **fonte primária de verdade operacional** para:

| Consumidor                                    | O que consome do Menu                              |
| --------------------------------------------- | -------------------------------------------------- |
| TPV / Mini-TPV                                | Venda, preço, imposto, estação por produto         |
| KDS                                           | Tempo, estação, fluxo por item                     |
| QR / Web                                      | Exposição pública do cardápio                      |
| Stock / Inventário                            | Ingredientes, consumo (quando existir contrato)    |
| Staff / Tarefas                               | Responsabilidades, papéis ligados a itens/estações |
| Financeiro / Core                             | Receita, margem, IVA, auditoria                    |
| Relatórios                                    | O que vende, quando, onde                          |
| Reservas                                      | Capacidade vs itens                                |
| Pedidos prontos / painéis                     | Itens e preços                                     |
| Integrações externas (Uber Eats, Glovo, etc.) | Catálogo e preços                                  |

**Frase de trabalho:** "Se o Menu falha, o organismo entra em falência parcial."

---

## 2. Posição na hierarquia

```
CORE (Docker: Postgres + Kernel + Execution Engine)
  ├── Financial Core (soberano; pedidos, pagamentos, reconciliação)
  ├── Menu Core    ← Este contrato
  ├── Order Core   (consome Menu para linhas e preços)
  ├── Inventory Core (consome Menu para consumo/ingredientes)
  └── … (outros domínios conforme evolução)
```

- **Menu Core** não substitui nem conflita com **Financial Core**: Menu fornece catálogo, preços e regras operacionais; Financial Core persiste pedidos, pagamentos e reconciliação. São acoplados mas com responsabilidades distintas.

---

## 3. Contratos downstream (quem depende do Menu)

**Regra de blindagem:** Ninguém mexe no Menu sem saber o impacto nestes contratos.

| Contrato                                                             | Dependência do Menu                             |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md)   | Venda, preço, imposto, estação por produto      |
| [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                       | Tempo, estação, fluxo por item                  |
| QR/Web / PublicWeb                                                   | Exposição pública do cardápio                   |
| Stock/Inventário                                                     | Consumo, ingredientes (quando existir contrato) |
| [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md) | Tarefas ligadas a itens/estações                |
| Finance/Relatórios                                                   | Receita, margem, IVA por produto                |

---

## 4. Invariantes (o que nunca pode quebrar)

- **Menu não pode ser volátil para venda:** não existe "menu meio feito" como fonte de pedidos.
- **Preço obrigatório** para itens que alimentam TPV/Finance: sem preço = estado inválido para venda.
- **Publicação consciente:** sem menu válido não há QR/web ativo; checklist antes de publicar.
- **Menu inicial = completo, válido e simples** (ref. [MENU_BUILDER_CONTRACT_V1.md](./MENU_BUILDER_CONTRACT_V1.md)).
- **Core e Bootstrap:** o Core não deve aceitar pedidos para itens sem menu válido; o Bootstrap/readiness inclui "menu existente e publicável".

---

## 5. Relação com Financial Core

- O **Financial Core** consome o Menu para: validar linhas de pedido (product_id, preço, IVA), calcular totais, persistir receita.
- O Menu **não** persiste pagamentos nem reconciliação; fornece catálogo e regras de preço.
- Alterações no schema de menu que afectem preço, IVA ou identificação de produto têm impacto no Financial Core e devem ser tratadas com contrato e migração.

---

## 6. Relação com Bootstrap

- **Bootstrap / readiness:** um restaurante operacional exige menu existente, consistente e (se aplicável) publicável.
- Referência: [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md), [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md) — "dados suficientes" e CTA quando não há menu.

---

## 7. Interaction Matrix — Quem lê, quem escreve, quem obedece

Definição canónica: **com quem o Menu fala, com quem NÃO fala, como fala, quando fala e quem pode interagir.** Qualquer violação é falha arquitetural.

### 7.1 Com quem o Menu Core FALA (downstream)

Emite verdade operacional para:

| Núcleo          | Consumidores                                                                                                                          | Forma                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Operacional** | TPV, KDS, QR/Web, Mini TPV/KDS, Painel pedidos prontos, AppStaff (todas as roles)                                                     | Read-only; snapshot + subscription. O Menu **nunca** recebe decisão desses terminais. |
| **Gestão**      | Dashboard, Menu Builder, Configuração, Onboarding, Advisor/Checklist                                                                  | Estado + critérios + mensagens humanas. Nunca executam venda.                         |
| **Dados**       | Inventory/Stock, Tasks (tarefas dependentes de itens), Reservas (item ↔ reserva), Relatórios, Exportadores (ex.: Uber Eats no futuro) | Referência canónica (`product_id`) + preço imutável por evento.                       |

### 7.2 Com quem o Menu Core NÃO fala (proibição explícita)

Se alguma destas camadas **decidir algo sobre o menu**, é violação.

- Auth
- Billing SaaS
- Gateway de pagamento
- Landing
- Marketing
- Design System
- Layout
- Estado visual
- Feature flags
- Demo / Pilot modes
- Service Workers
- Cache como autoridade
- Supabase como fonte primária

### 7.3 COMO o Menu Core fala

Nunca por "intenção" nem por "UI state". Apenas por:

- **Interfaces formais:** schema canónico (`product_id`, `price_cents`, `availability`, `published_at`), [MenuOperationalState](./MENU_OPERATIONAL_STATE.md) (EMPTY, INCOMPLETE, VALID_UNPUBLISHED, LIVE).
- **Eventos:** MENU_DEFINED, MENU_VALIDATED, MENU_PUBLISHED.

**Proibido:** callbacks soltos, flags UI, booleanos mágicos.

### 7.4 QUANDO fala (timing)

O Menu não reage a UI; reage a factos.

| Momento               | O que emite       |
| --------------------- | ----------------- |
| Item criado/editado   | Novo snapshot     |
| Critérios satisfeitos | VALID_UNPUBLISHED |
| Publicação confirmada | LIVE              |
| Consumo operacional   | Snapshot imutável |

**Regra:** O Menu não "avisa"; é **consultado**. Pull > Push (exceto eventos de publicação).

### 7.5 QUEM pode interagir (autoridade)

**Escrita (STRICT):**

| Quem               | Pode escrever?           |
| ------------------ | ------------------------ |
| Dono (Web)         | ✅                       |
| Gerente (Web)      | ❌ (por contrato actual) |
| Staff              | ❌                       |
| AppStaff           | ❌                       |
| TPV / KDS / QR/Web | ❌                       |
| Core Financeiro    | 🔒 Valida, não cria      |

**Leitura (ampla, segura):** Todos os terminais, AppStaff, QR/Web (só se LIVE), Relatórios, Inventory — ✅.

### 7.6 Regra suprema (frase canónica)

> O Menu não pede permissão para existir.
> Ele apenas precisa ser válido para ser publicado.
> Tudo o resto obedece.

### 7.7 Diagrama hierárquico (Core → Menu → Terminais)

```
                           ┌─────────────────────────────┐
                           │   CORE FINANCIAL SOVEREIGN   │
                           │   (Rei – verdade final)      │
                           │                             │
                           │  • Valida preços            │
                           │  • Valida linhas de pedido  │
                           │  • Garante atomicidade      │
                           └──────────────┬──────────────┘
                                          │
                                          │ valida / consome
                                          ▼
                   ┌─────────────────────────────────────────┐
                   │           MENU CORE CONTRACT             │
                   │        (Rainha – artéria central)        │
                   │                                         │
                   │  • Fonte primária de verdade             │
                   │  • Preço obrigatório                     │
                   │  • Estado operacional (EMPTY → LIVE)     │
                   │  • Publicação consciente                 │
                   │                                         │
                   │  ❌ Não vende                            │
                   │  ❌ Não cobra                            │
                   │  ❌ Não decide layout                    │
                   │                                         │
                   │  ✔ Subordinado apenas ao Core Financeiro │
                   └──────────────┬──────────────┬───────────┘
                                  │              │
               snapshot / read-only│              │eventos / estado
                                  │              │
          ┌───────────────────────▼───────┐  ┌───▼──────────────────────┐
          │        NÚCLEO OPERACIONAL      │  │     NÚCLEO DE GESTÃO      │
          │        (execução viva)         │  │     (decisão humana)     │
          │                               │  │                          │
          │  • TPV                        │  │  • Dashboard             │
          │  • KDS                        │  │  • Menu Builder           │
          │  • Mini TPV / Mini KDS        │  │  • Configuração           │
          │  • Painel de Pedidos Prontos  │  │  • Onboarding             │
          │  • App Staff (todas as roles) │  │  • Advisor / Checklists   │
          │                               │  │                          │
          │  ❌ Não alteram menu           │  │  ❌ Não vendem            │
          │  ✔ Consomem menu LIVE         │  │  ✔ Criam / publicam menu  │
          └──────────────┬────────────────┘  └──────────────┬───────────┘
                         │                                   │
                         │ referência canónica               │ comandos explícitos
                         ▼                                   ▼
          ┌─────────────────────────────────────────────────────────┐
          │                  NÚCLEO DE DADOS & DERIVAÇÕES            │
          │                                                         │
          │  • Inventory / Stock                                   │
          │  • Tasks (dependentes de itens)                         │
          │  • Reservas                                            │
          │  • Relatórios                                          │
          │  • Exportadores (UberEats, etc. – futuro)               │
          │                                                         │
          │  ✔ Consomem product_id + price_cents                    │
          │  ❌ Não decidem disponibilidade                         │
          └─────────────────────────────────────────────────────────┘


         ─────────────────────────────────────────────────────────────
         ZONA PROIBIDA (o Menu NÃO fala, NÃO depende, NÃO obedece)
         ─────────────────────────────────────────────────────────────

          ❌ Auth
          ❌ Billing SaaS
          ❌ Gateway de Pagamento
          ❌ Landing / Marketing
          ❌ Design System
          ❌ Layout / UI
          ❌ Feature Flags
          ❌ Demo / Pilot / DEV
          ❌ Cache como autoridade
          ❌ Supabase como fonte primária
```

---

## 8. Referências

| Documento                                                                          | Uso                                                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [MENU_BUILDER_CONTRACT_V1.md](./MENU_BUILDER_CONTRACT_V1.md)                       | Criação, preset, schema, UX, regra "menu nunca vazio".                                                 |
| [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md)                           | Estado operacional (EMPTY, INCOMPLETE, VALID_UNPUBLISHED, LIVE); quem bloqueia o quê; copy.            |
| [MENU_DERIVATIONS.md](./MENU_DERIVATIONS.md)                                       | O que cada núcleo pode derivar; derivado vs copiado; snapshot vs live; nunca recalculado fora do Menu. |
| [MENU_FALLBACK_CONTRACT.md](./MENU_FALLBACK_CONTRACT.md)                           | Fallback quando Core não responde.                                                                     |
| [MENU_CONTRACT.md](./MENU_CONTRACT.md)                                             | Itens por superfície (navegação).                                                                      |
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | Soberania.                                                                                             |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)                                 | Índice.                                                                                                |
