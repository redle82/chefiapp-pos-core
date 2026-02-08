# Contrato Web Operacional — Command Center

## Lei do sistema

**A Web Operacional é uma tela ÚNICA: SystemTree + WorkTree à esquerda, painel central à direita. Selecionar nó NÃO muda de página; apenas muda o conteúdo do painel central. A Web orquestra (cria, configura, observa, delega). Nunca executa tarefa física, prepara pedido nem fecha caixa.**

Este documento é contrato formal do Core. Complementa [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) com a estrutura explícita do Command Center.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Tela única

- **Uma rota** (ex.: `/dashboard` ou `/app`) contém todo o Command Center.
- **Navegação lateral** = mudança de `activeModule` (estado). Não há "Abrir X" para nova página.
- **Painel central** = renderização do módulo selecionado. Tudo inline.

---

## 2. SystemTree (lado esquerdo — visão estrutural)

Todos os nós visíveis. Nada escondido.

| Nó | Conteúdo / acção |
|----|------------------|
| **Core** | Estado geral do sistema (health, tenant, modo). |
| **AppStaff** | Quem está online; execução; botão App Store; botão Google Play. |
| **iOS** | Botão App Store (instalar AppStaff). |
| **Android** | Botão Google Play (instalar AppStaff). |
| **KDS** | Estado do terminal; botão "Instalar KDS". |
| **TPV** | Estado do caixa; botão "Instalar TPV". |
| **Web Pública** | Link "Ver página pública" (GloriaFood). |
| **Impressão** | Estado da impressão; fila; configuração. |
| **Offline** | Estado de sync; fila offline; alertas. |
| **Billing** | Subscrição; Stripe; plano. |

---

## 3. WorkTree (lado esquerdo — abaixo da SystemTree, fluxos operacionais)

| Nó | Conteúdo do painel central |
|----|-----------------------------|
| **Tarefas** | Criar tarefas; delegar (por cargo); ver execução. |
| **Turnos** | Ver turnos; check-in/out (se permitido); horários. |
| **Alertas** | Lista de alertas operacionais; prioridade; acções. |
| **Pedidos** | Ver pedidos; estado; fila (read-only ou acções permitidas pelo Core). |
| **Cozinha** | Ver fila (read-only); ver tarefas não relacionadas a pedidos. |
| **Caixa** | Ver caixa; estado; sessão (read-only ou acções permitidas). |
| **Incidentes** | Lista de incidentes; escalação; resolução. |

---

## 4. Painel central

- **Renderiza** o módulo correspondente ao nó selecionado (SystemTree ou WorkTree).
- **Nunca executa** acções físicas (preparar pedido, fechar caixa, imprimir no hardware). Apenas **cria, delega, observa**.
- **Orquestração:** Comandos enviados ao Core; Core valida e propaga aos terminais (AppStaff, KDS, TPV).

---

## 5. O que a Web Operacional NÃO faz

| Proibido | Motivo |
|----------|--------|
| Executar tarefa no lugar do staff | AppStaff/KDS executam. |
| Preparar pedido / cozinhar | KDS/cozinha executam. |
| Fechar caixa / cobrar no hardware | TPV executa. |
| Chat livre entre pessoas | Comunicação = técnica, contextual, auditável (CORE_OPERATIONAL_COMMUNICATION_CONTRACT). |
| Esconder nós da árvore | Tudo visível; sem "modo avançado" que omita Core/KDS/TPV/Billing. |

---

## 6. Relação com outros contratos

- **CORE_OPERATIONAL_UI_CONTRACT:** Shell, PanelRoot, contexto operacional, `data-chefiapp-os`.
- **CORE_PUBLIC_WEB_CONTRACT:** Web Pública (GloriaFood) é terminal distinto; Command Center pode ter link "Ver página pública".
- **CORE_APPSTAFF_CONTRACT:** Command Center mostra estado e "Instalar App"; não renderiza o terminal AppStaff (mobile only).
- **CORE_KDS_CONTRACT / CORE_TPV_BEHAVIOUR_CONTRACT:** Command Center mostra estado e botões de instalação; não substitui KDS/TPV.

---

## 7. Garantia

- Web abre no navegador.
- Uma única tela com SystemTree + WorkTree + painel central.
- Core governa; Web orquestra.
