# Contrato: Dashboard Operacional V2 (OPERATIONAL_OS)

**Propósito:** Definir o que aparece, o que nunca aparece e o que só aparece após instalação de terminais no dashboard do ChefIApp OS em modo OPERATIONAL_OS. Fonte canónica para layout e conteúdo do Control Plane.

**Referências:** [CURRENT_SYSTEM_MAP.md](../architecture/CURRENT_SYSTEM_MAP.md), [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md), [ROADMAP_POS_FREEZE.md](../strategy/ROADMAP_POS_FREEZE.md). Header operacional (identidade): [OPERATIONAL_HEADER_CONTRACT.md](OPERATIONAL_HEADER_CONTRACT.md).

---

## 1. Princípio

**Dashboard = Painel de Comando, não landing page.**

A sidebar responde a uma única pergunta: *"O que impede ou permite operar agora?"*  
O centro da tela mostra **estado + ação**, não marketing interno.

---

## 2. Primeira dobra (sem scroll)

Conteúdo visível sem rolar:

1. **Operação**
   - Estado: **Pronta** ou **Bloqueada**.
   - Motivo em 1 linha (ex.: "Core offline", "Turno fechado").
   - Ação única (ex.: "Instalar terminal", "Abrir turno", "Ver instruções").

2. **Estado operacional**
   - Core: **ON** / **OFF**.
   - Turno: **Aberto** / **Fechado**.
   - Terminais: **Instalados** / **Não instalados**.

Nada mais nesta dobra.

---

## 3. Segunda dobra

Conteúdo abaixo da primeira dobra (com scroll):

- **Histórico por turno** (últimos 7 dias).
- **Receita / métricas do dia** (pedidos, receita, turnos ativos, export).
- **Alertas reais** (contagem e atalho para ver alertas).

---

## 4. Sidebar

- **Fonte maior;** menos itens; **ordem por dependência** (não por "feature").
- **TPV/KDS** só aparecem como:
  - **Não instalado** → CTA "Instalar terminal" (rota `/app/install`).
  - **Instalado** → item navegável na árvore "Operar".
- Um único indicador de Core (OperacaoCard); sem duplicação de "Core offline".
- Hierarquia clara: título da sidebar > secções (Começar, Operar, Equipe, Gestão) > itens.

---

## 5. O que NUNCA aparece em modo OPERATIONAL_OS

Os seguintes elementos **não** são mostrados quando `VITE_UI_MODE=OPERATIONAL_OS`:

- Trial ativo.
- Plano & faturação (card ou secção no centro; botão faturação na sidebar).
- Primeira venda em poucos passos.
- Atalhos rápidos (TPV, KDS, Cardápio, Faturação no centro).
- "Sistema pronto" (badge/card na sidebar).
- Indicadores duplicados de Core (ex.: CoreStatusBadge separado do OperacaoCard).

Estes elementos pertencem a outras fases do produto (onboarding/SaaS genérico) e não refletem a verdade operacional do Control Plane.

---

## 6. O que só aparece APÓS instalação de terminais (trilho ativo)

Quando o trilho de instalação de terminais existir (`VITE_TERMINAL_INSTALLATION_TRACK=true` ou equivalente com `gm_terminals` / device_id):

- **TPV** e **KDS** aparecem como destinos **navegáveis** na árvore "Operar" (não apenas "Não instalado" + CTA).
- Atalhos ou entradas para TPV/KDS no **centro** da tela só quando existem terminais instalados.

Enquanto o trilho não existir (Gap A do ROADMAP_POS_FREEZE), TPV/KDS são sempre "Não instalado" com CTA "Instalar terminal".

---

## 7. Regra do menu

- A mensagem **"Menu publicado e disponível para venda"** só é mostrada quando há **capacidade operacional de venda**: terminais instalados e, quando aplicável, turno aberto.
- Caso contrário (terminais não instalados ou turno fechado), usar mensagem **neutra** (ex.: "Cardápio publicado") para não criar expectativa de venda imediata.

Ou seja: "disponível para venda" = verdade operacional (posso vender agora). "Cardápio publicado" = estado do conteúdo (o menu está publicado), sem implicar que o utilizador pode vender já.

---

## 8. Mapeamento backend ↔ UI ↔ verdade operacional

| Verdade operacional | Fonte backend / contrato | UI (OPERATIONAL_OS) |
|--------------------|---------------------------|----------------------|
| Core ligado/desligado | Core health (Docker Core ping / health endpoint) | OperacaoCard: estado "Pronta" ou "Bloqueada"; motivo "Core offline" quando aplicável |
| Operação pronta/bloqueada | ORE / preflight (`usePreflightOperational`, `computePreflight`) | Subtítulo sidebar "Estado: Pronta" / "Estado: Operação bloqueada"; ação única no OperacaoCard |
| Turno aberto/fechado | ShiftContext; Core (turno ativo) | Estado operacional na primeira dobra; Histórico por turno na segunda dobra |
| Terminais instalados/não | `gm_terminals`, device_id (quando trilho existir) | Sidebar "Operar": TPV/KDS como "Não instalado" + CTA ou como itens navegáveis |
| Menu publicado | MenuState (deriveMenuState, useMenuState); publicação no Core | Bloco estado do menu: "Cardápio publicado" ou "disponível para venda" conforme regra do menu (§7) |
| Receita / pedidos do dia | Core (projeções; métricas por turno) | OperationalMetricsCards na segunda dobra |
| Alertas ativos | AlertEngine; Core ou fonte de alertas | Secção Alertas na segunda dobra |

---

## 9. Variáveis de configuração

- **`VITE_UI_MODE=OPERATIONAL_OS`** — Ativa o modo Painel de Comando: aplica primeira/segunda dobra, esconde elementos listados em §5, aplica regra do menu e regras da sidebar. Modo canónico para o Control Plane.
- **`VITE_TERMINAL_INSTALLATION_TRACK`** — `false` (default enquanto Gap A): TPV/KDS sempre "Não instalado" + CTA. `true` quando o trilho de terminais existir: TPV/KDS navegáveis conforme estado real.

---

Última atualização: Contrato Dashboard V2; alinhado ao plano de refatoração UI e ao ROADMAP_POS_FREEZE.
