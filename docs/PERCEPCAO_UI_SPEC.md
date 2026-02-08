# Percepção Operacional — UI (Config + Dashboard)

**Data:** 2026-01-29  
**Referência:** [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md), [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md)  
**Objetivo:** Definir a UI final do módulo Percepção — página de configuração e apresentação de eventos no Dashboard / Alertas.

---

## 1. Página de Configuração (`/config/perception`)

### 1.1 Estrutura (de cima para baixo)

| Secção | Conteúdo |
|--------|----------|
| **Cabeçalho** | Título "Percepção Operacional", subtítulo sobre câmera + análise sem identificar pessoas |
| **Fonte** | Link da câmera (input) + Zona da câmera (select) + Guardar + Ver ao vivo / Abrir noutra janela (iCSee) |
| **Confirmação** | Bloco "Câmera ligada?" — indicador de sinal, preview (ou mensagem iCSee), botão "Abrir câmera noutra janela" quando aplicável |
| **Observação** | "Gerar observação" (botão) — detecção de padrões básicos (zona, movimento, duração); output estruturado quando houver backend |
| **Análise com IA** | Botão "Analisar com IA" — LLM a consumir evento/contexto; texto explicativo e resultado em linguagem natural |

### 1.2 Campo: Zona da câmera (obrigatório na spec)

- **Tipo:** select (dropdown).
- **Label:** "Zona da câmera".
- **Opções iniciais:** Cozinha, Salão, Estoque, Caixa, Entrada, Outro.
- **Valores (value):** `kitchen`, `floor`, `storage`, `cash`, `entrance`, `other`.
- **Persistência:** junto com o link (ex.: `localStorage` `chefiapp_perception_camera_zone`) até existir backend.
- **Posição:** imediatamente abaixo do input "Link da câmera", no mesmo bloco cinza (Fonte).

**Copy do label:** "Zona da câmera — onde esta câmera está (cozinha, salão, estoque, etc.). Necessário para interpretar eventos."

### 1.3 Secção "Gerar observação"

- **Título:** "Observação (padrões básicos)".
- **Descrição:** "Deteta movimento vs. ausência de movimento, duração por zona. Não descreve a cena — gera eventos estruturados (ex.: zona parada há X min)."
- **Botão:** "Gerar observação" (ou "Detetar padrões").
- **Comportamento (fase 1):** Se não existir endpoint de observação, botão desativado ou tooltip: "Em breve: deteção de padrões por zona."
- **Comportamento (fase 2):** Chamada ao endpoint de observação; resultado em JSON ou cards resumidos (zona, movimento, duração, confiança).
- **Output (quando houver):** Exibir resumo legível (ex.: "Cozinha — sem movimento há 6 min") e opcionalmente payload para debug.

### 1.4 Secção "Análise com IA"

- Manter como está: botão "Analisar com IA", uso de `VITE_LLM_VISION_ENDPOINT`, resultado em texto.
- Copy opcional: "Usa o link e a zona guardados. A API pode devolver descrição da cena ou sugestão com base em eventos."

### 1.5 Ordem visual recomendada

1. Cabeçalho  
2. Bloco Fonte (link + zona + guardar + ver ao vivo / abrir noutra janela)  
3. Bloco Confirmação (câmera ligada? preview / iCSee)  
4. Bloco Observação (gerar observação)  
5. Bloco Análise com IA  

---

## 2. Dashboard — eventos de Percepção

### 2.1 Onde aparecem

| Local | O quê |
|-------|--------|
| **Dashboard principal** | Card ou lista "Sugestões / Alertas" que inclua eventos com `alertType` ou `source_event` de Percepção (ex.: `PERCEPTION_ZONE_IDLE`). |
| **Página Alertas** | Lista existente (`/alerts`); alertas de Percepção têm `alertType` começando por `PERCEPTION_`; filtro opcional "Percepção". |
| **Lista de Tarefas** | Tarefas com `source_event` tipo `PERCEPTION_*` ou `task_type` ZONA_PARADA, etc.; título e descrição derivados do evento. |

### 2.2 Card de evento (Percepção) no Dashboard

- **Conteúdo:** Ícone (ex.: 📷 ou 🟡), título curto (ex.: "Cozinha parada há 6 min"), descrição opcional (ex.: "Zona sem movimento. Verificar gargalo antes do pico."), timestamp.
- **Ação:** Link para "Ver detalhe" ou para `/alerts` filtrado por esse alerta; opcional "Criar tarefa" se ainda não existir tarefa associada.
- **Estilo:** Alinhado aos restantes cards de sugestão/alerta do ChefIApp (cor, borda, tipografia).

### 2.3 Página Alertas — filtro Percepção

- **Opção de filtro:** "Percepção" (ou "Câmera / Zonas") além de "Todos" e "Críticos".
- **Critério:** `alertType` começa com `PERCEPTION_` ou `details.zone` presente.
- **Card de alerta:** Usar `AlertCard` existente; garantir que `title` e `message` e `details` (zona, duração, etc.) vêm do payload de Percepção.

### 2.4 Copy e acessibilidade

- Títulos de eventos em português: "Zona parada há X min", "Movimento fora de horário", "Atividade inesperada".
- Sem referência a "vigilância" ou "vigiar"; usar "observação", "padrões", "zona".

---

## 3. Resumo de implementação (UI)

| Passo | Descrição |
|-------|-----------|
| 1 | Adicionar campo **Zona da câmera** (select) em `/config/perception` e persistir em `localStorage`. |
| 2 | Adicionar secção **"Observação (padrões básicos)"** com botão "Gerar observação"; fase 1: desativado ou "Em breve". |
| 3 | Quando existir endpoint de observação: ligar botão ao endpoint e mostrar resultado (resumo + opcional JSON). |
| 4 | Na página Alertas: filtro "Percepção" e exibição correta de `alertType` / `details` para eventos PERCEPTION_*. |
| 5 | No Dashboard principal: incluir eventos de Percepção no bloco de sugestões/alertas (quando houver dados). |

---

## Referências

- [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md) — SPEC oficial
- [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md) — Modelo de eventos e tarefas
- `merchant-portal/src/pages/Config/ConfigPerceptionPage.tsx` — Página de config atual
- `merchant-portal/src/pages/Alerts/AlertsDashboardPage.tsx` — Página de alertas
