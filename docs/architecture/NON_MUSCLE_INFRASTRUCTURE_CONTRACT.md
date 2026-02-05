# Non-Muscle Infrastructure Contract — Infra e Contexto (não-muscular)

> **Propósito:** Definir todas as camadas do sistema que **não são músculos**, mas que permitem que os músculos existam, arranquem, sejam protegidos, observados e testados — **sem nunca decidir operação nem produzir verdade de negócio**.
>
> **Hierarquia:** Abaixo do Core Financeiro e do Menu, ao lado do ORE; nunca abaixo dos músculos. Estas camadas são nervos, pele, ambiente, contexto e andaimes — não vendem, não cozinham, não decidem; sem elas nada funciona.
>
> **Refs:** [ORE_ORGANISM_AND_MENU.md](./ORE_ORGANISM_AND_MENU.md), [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md), [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md), [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

**Supabase (quarentena):** Supabase may exist only as temporary Auth infrastructure. It is not a muscle, not a brain, not a core, and not a source of truth.

---

## 1. O que este documento NÃO é

- Não define lógica de negócio.
- Não substitui contratos de Menu, ORE ou Financeiro.
- Não decide comportamento operacional.
- Não cria atalhos de produção.
- Qualquer tentativa de decisão nestas camadas é **violação estrutural**.

---

## 2. Modelo mental (papéis)

| Camada             | Papel                                                   |
| ------------------ | ------------------------------------------------------- |
| ORE                | Cérebro (decide pode/não pode)                          |
| Menu Core          | Matéria (o que existe, quanto custa, o que é vendável)  |
| Músculos           | Execução (TPV, KDS, QR, Tasks, Stock, Relatórios, etc.) |
| Infra não-muscular | Nervos, pele, ambiente, contexto, andaimes              |

---

## 3. Estados de ambiente (regra canónica)

**Proibido como estados estruturais de operação:** DEV, PILOT, DEMO.

**Estados canónicos:**

| Estado    | Significado                                                            |
| --------- | ---------------------------------------------------------------------- |
| **TRIAL** | Restaurante real, dados reais; sem cobrança ou com limites explícitos. |
| **LIVE**  | Restaurante real, dados reais; cobrança ativa.                         |

**Regra:** TRIAL ≠ simulação, ≠ mock, ≠ sandbox. TRIAL é produção com limites, não um "modo". ORE não muda no TRIAL; só os limites mudam.

---

## 4. Bootstrap (sistema de inicialização)

**Função:** Criar contexto mínimo válido para que ORE e Menu possam operar.

**O que o Bootstrap FAZ:**

- Resolve `restaurant_id`.
- Resolve estado base (existe / não existe).
- Garante RuntimeContext.
- Nunca decide prontidão operacional.

**O que o Bootstrap NÃO faz:**

- Não valida menu.
- Não desbloqueia TPV.
- Não substitui ORE.

**Regra:** Bootstrap prepara o palco. ORE decide se a peça começa.

---

## 5. Runtime Context (ambiente vivo)

**Inclui:** `restaurant_id`, `trial_status`, `published`, `menuDefined`, `installed_modules`, `coreOnline`, e demais factos expostos ao cliente.

**Regra de ouro:** Runtime **expõe factos, não decisões**. Nenhuma entidade de Runtime decide "pode operar?" — isso é competência exclusiva do ORE.

---

## 6. Routing e Flow (rotas, gates, navegação)

**Inclui:** FlowGate, route guards, redirecionamentos, "Esta página pode abrir?".

**Regra absoluta:**

- Rotas **consultam** ORE (e Bootstrap/Auth quando aplicável).
- Rotas **não inferem** estado por si.
- Nenhuma rota **decide** sozinha.

---

## 7. Auth, sessão e identidade

- **Auth** identifica **quem**.
- **Bootstrap** resolve **onde** (restaurante, contexto).
- **ORE** decide **se pode** (operar nesta superfície).

**Regra:** Nunca misturar esses três. Auth não desbloqueia TPV; Bootstrap não publica menu; ORE não autentica.

---

## 8. Design System

**Inclui:** UI, layout, estética, componentes reutilizáveis.

**Lei:** Design System não contém regras de negócio nem decisão operacional; apenas formas, tokens e comportamentos visuais. Não decide estado; reflete estado.

---

## 9. Infra técnica (nervos, não cérebro)

**Inclui:** Docker, Supabase, APIs, Service Workers, cache, rede, logs.

**Regra:** Infra falha, sistema reage — **infra nunca é autoridade**. Supabase/Docker não decidem "pode vender?"; expõem dados. ORE e Menu são autoridade; infra é suporte.

---

## 10. Trial (substitui Demo / Pilot / Dev como estado estrutural)

**O que o TRIAL permite:**

- Criar menu, publicar menu, fazer pedidos reais, usar TPV/KDS (dentro dos limites definidos).

**O que o TRIAL limita (exemplos):**

- Volume, integrações externas, exportações, billing real — conforme política comercial.

**Regra:** ORE não muda no TRIAL. Só os limites mudam. Não há "modo demo" que altere a hierarquia Rei → Rainha → Cérebro → Músculos.

---

## 11. Proibições explícitas nestas camadas

- Flags de UI decidindo comportamento operacional.
- `if (isDev)` ou equivalente em lógica de negócio.
- Mock silencioso em produção.
- Estados mágicos ou "modo especial" que contornem ORE ou Menu.
- Código "só para teste" em caminhos core sem isolamento explícito.
- Infra (Supabase, Docker, cache) como fonte de verdade para "pode operar?" ou "preço/item".

**Regra suprema:** Qualquer tentativa de decisão operacional ou de verdade de negócio nestas camadas é violação estrutural.

---

## 12. Conexão com o que já existe

Este documento não substitui nenhum contrato existente; amarra e contém as camadas não-musculares para que não se infiltrem como pseudo-músculos ou pseudo-cérebros.

| Documento                                                                          | Relação                                                                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [ORE_ORGANISM_AND_MENU.md](./ORE_ORGANISM_AND_MENU.md)                             | Organismo (Rei → Rainha → Cérebro → Músculos); infra fica fora do organismo. |
| [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md)                                   | Menu = matéria soberana; infra não cria nem altera menu.                     |
| [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md)                           | Estados do menu; runtime expõe factos, ORE consome.                          |
| [ORE_MANUAL_HUMANO.md](../operations/ORE_MANUAL_HUMANO.md)                         | Pedagogia humana; manual não decide.                                         |
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | Core Financeiro = Rei; infra não é Core.                                     |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)                                 | Índice; este contrato entra como "Infra e contexto (não-muscular)".          |

---

## 13. Resumo

- **Entidades cobertas:** Bootstrap, Runtime, Trial, Routing/Flow, Auth, Design System, Infra técnica.
- **Papel:** Permitir que o organismo exista e opere; nunca decidir operação nem produzir verdade de negócio.
- **Classificação:** Tudo o que não é músculo, não é ORE, não é Menu e não é Core Financeiro pertence a esta contenção. Nada novo pode surgir como entidade estrutural sem ser classificado como músculo, derivação, implementação, feature ou violação.
