# ChefIApp — AI Gateway e Serviço de IA (SPEC)

**Data:** 2026-01-29
**Objetivo:** Uma única integração de LLM para todo o ChefIApp OS. Vários papéis (intents), um mesmo cérebro. Definir o gateway interno, o contrato do serviço e os intents oficiais.

---

## 1. Princípio: UMA IA, VÁRIOS PAPÉIS

O ChefIApp **não** tem várias IAs (câmera, mentor, financeiro, dashboard). Tem um **sistema operacional** que usa uma **capacidade cognitiva central**.

**Arquitetura conceitual:**

```
LLM Provider (OpenAI / Anthropic / Cloud / etc.)
                    ↓
             ChefIApp AI Gateway
                    ↓
    ┌───────────┬───────────┬───────────┬──────────────┐
    │           │           │           │               │
 Percepção   Mentor IA   Decisão &   Diagnóstico   Explicação
 Operacional              Tarefas   do Sistema    (Demo/Dashboard)
```

- **Uma chave de API.**
- **Um gateway interno.**
- **Vários modos de uso** (intent + contexto).

Evita: custos duplicados, prompts incoerentes, comportamento inconsistente, produto frágil.

---

## 2. O que a IA FAZ (e o que NÃO faz)

### 2.1 Três funções específicas

| Função                        | Descrição                                                                          | Exemplo                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Inferir significado**       | Responde a: "Isto é normal?", "Isto é problema?", "O que é mais importante agora?" | Eventos Percepção + pedidos ativos → "Provável gargalo na cozinha. Prioridade média-alta."                      |
| **Traduzir sistema → humano** | Explica por que algo está a acontecer, em linguagem natural                        | "A cozinha está parada há mais de 5 min no pico, com pedidos ativos. Isso costuma causar atrasos em 10–15 min." |
| **Sugerir próxima ação**      | Não executa; sugere ação que vira tarefa, card ou aviso                            | "Verificar gargalo na cozinha", "Chamar reforço no salão", "Priorizar mesa 5"                                   |

### 2.2 Onde a IA NÃO entra

- Decidir pagamentos
- Executar ações críticas (ex.: fechar caixa, anular pedido)
- Gravar estados definitivos sozinha
- Vigiar ou identificar pessoas
- Substituir regras duras do sistema

**Regra:** _Ela aconselha. O sistema decide. O humano executa._

---

## 3. Configuração: uma variável de ambiente (conceito)

Um único ponto de configuração LLM para o gateway:

```env
# Provider: openai | anthropic | azure | custom
LLM_PROVIDER=openai
LLM_API_KEY=xxxx
LLM_MODEL=gpt-4o-mini

# Opcional: endpoint custom (proxy, gateway próprio)
# LLM_BASE_URL=https://api.chefiapp.pt/ai
```

**Nota:** Hoje o frontend usa `VITE_LLM_VISION_ENDPOINT` para Percepção (analisar cena). Na evolução, esse endpoint pode ser um **proxy** que recebe `{ context, intent }` e chama o mesmo LLM com o prompt adequado. Assim mantém-se uma única integração real (API key + modelo) no backend.

---

## 4. Contrato do serviço central

### 4.1 API conceitual

```ts
// Serviço central (backend ou gateway)
ai.infer(context: Record<string, unknown>, intent: Intent): Promise<InferResult>
```

**Intent** define o papel e o tipo de resposta (ver secção 5).
**Context** contém os dados já processados pelo sistema (eventos, pedidos, estado, etc.). O modelo não muda; mudam o **prompt** e o **contexto**.

### 4.2 Forma do resultado

```ts
interface InferResult {
  /** Explicação em linguagem natural (sistema → humano) */
  explanation: string;
  /** Sugestão de ação (opcional) — vira tarefa/card */
  suggestion?: string;
  /** Prioridade sugerida: low | medium | high | critical */
  priority?: "low" | "medium" | "high" | "critical";
  /** Metadados para auditoria / debug */
  meta?: { model?: string; tokens?: number; intent: string };
}
```

Quem chama (Percepção, Mentor, Dashboard, Demo) usa `explanation` e opcionalmente `suggestion` + `priority` para criar tarefas ou mostrar cards.

---

## 5. Intents oficiais (mapeamento)

Todos os usos de IA no ChefIApp passam por um destes intents. Um único gateway escolhe o prompt e o formato de contexto consoante o intent.

| Intent                   | Módulo / uso          | Contexto típico                                                                  | Saída típica                                                              |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `perception_explanation` | Percepção Operacional | Eventos (zone, movement, duration), pedidos ativos, horário                      | Explicação do padrão + sugestão ("gargalo provável", "verificar cozinha") |
| `mentor_advice`          | Mentor IA             | Estado do restaurante (mesas, pedidos, tarefas, alertas), pergunta do utilizador | Conselho em linguagem natural, próximos passos                            |
| `dashboard_summary`      | Dashboard             | Alertas, tarefas abertas, métricas do dia, modo (demo/pilot/live)                | Resumo do que importa agora + explicação de alertas                       |
| `demo_narration`         | Modo Demo             | Estado simulado, secção atual do demo                                            | Narração explicativa ("O que é isto", "Por que existe")                   |
| `system_diagnosis`       | Diagnóstico / Saúde   | Logs agregados, estado dos módulos, erros recentes                               | Explicação do estado do sistema em linguagem acessível                    |

### 5.1 Detalhe por intent

**perception_explanation**

- **Input:** `{ zone, movement, duration_minutes, active_orders?, time_period?, event_type? }`
- **Output:** Explicação + sugestão (ex.: "Cozinha parada há 6 min no pico. Verificar gargalo.").

**mentor_advice**

- **Input:** Estado do sistema (mesas, pedidos, tarefas, alertas) + pergunta ou tópico.
- **Output:** Resposta em texto + opcional lista de ações sugeridas.

**dashboard_summary**

- **Input:** Alertas ativos, tarefas abertas, KPI do dia, modo.
- **Output:** Resumo curto + explicação dos alertas mais importantes.

**demo_narration**

- **Input:** Secção do demo (ex.: "tpv", "kds", "perception"), estado simulado.
- **Output:** Texto narrativo para mostrar no Modo Demo.

**system_diagnosis**

- **Input:** Métricas, erros recentes, estado de módulos (sem dados sensíveis).
- **Output:** Explicação do estado de saúde do sistema.

---

## 6. AI Gateway interno (desenho)

O **AI Gateway** é a camada que:

1. Recebe pedidos com `intent` + `context`.
2. Seleciona o **prompt template** e formata o contexto conforme o intent.
3. Chama **um único** provedor LLM (OpenAI, Anthropic, etc.) com uma única API key.
4. Normaliza a resposta para `InferResult` (explanation, suggestion, priority).
5. Opcionalmente regista uso (tokens, intent) para custo e auditoria.

```
┌─────────────────────────────────────────────────────────┐
│                  ChefIApp AI Gateway                    │
│  • Recebe: { intent, context }                          │
│  • Seleciona prompt por intent                          │
│  • Chama LLM (uma API key, um modelo)                   │
│  • Devolve: { explanation, suggestion?, priority? }     │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   Percepção            Mentor IA            Dashboard / Demo
   (eventos)             (estado + pergunta)  (resumo / narração)
```

A **visão por imagem** (ex.: analisar frame de câmera) pode ser um intent à parte, ex.: `perception_vision`, que recebe URL ou frame e devolve descrição. Mesmo assim: mesma API key, mesmo gateway, outro prompt. Ou manter temporariamente `VITE_LLM_VISION_ENDPOINT` como proxy que internamente chama o mesmo LLM com role "vision".

---

## 7. Aplicação aos módulos que referiu

| Módulo                    | Intent                                                    | O que a IA recebe                                         | O que a IA devolve                            |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| **Percepção Operacional** | `perception_explanation` (e opcional `perception_vision`) | Eventos (zona, movimento, duração) + contexto operacional | Explicação de padrões + sugestão de ação      |
| **Mentor IA**             | `mentor_advice`                                           | Estado do sistema + pergunta do dono                      | Conselho e próximos passos                    |
| **Dashboard**             | `dashboard_summary`                                       | Alertas, tarefas, métricas, modo                          | Resumo do que importa + explicação de alertas |
| **Modo Demo**             | `demo_narration`                                          | Secção atual + estado simulado                            | Narração "o que é / por que existe"           |

Tudo com a **mesma IA**; só mudam o intent e o contexto.

---

## 8. Posicionamento de produto

O ChefIApp não se vende como "TPV com IA". Vende-se como:

**Um sistema operacional que percebe, entende e explica antes do humano.**

Isso exige:

- Uma IA central
- Integrada ao contexto (eventos, pedidos, tarefas)
- Usada com parcimônia (inferir, explicar, sugerir — não executar)
- Explicável (resposta em linguagem natural, auditável por intent)

---

## 9. Implementação (referência)

- **Gateway em código:** `merchant-portal/src/core/ai/aiGateway.ts`
  - `infer(intent, context): Promise<InferResult>`
  - Se `VITE_AI_GATEWAY_ENDPOINT` estiver definido, POST para o endpoint; senão, mock por intent.
- **Primeiro uso real:** Config → Percepção — botão «Analisar com IA» chama `infer('perception_explanation', { zone, cameraUrl, ... })` e mostra `explanation` + `suggestion`.

---

## 10. Próximos passos de implementação

| Passo | Descrição                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Introduzir variáveis `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL` (backend ou gateway).                                               |
| 2     | Implementar o endpoint real do AI Gateway: rota que recebe `{ intent, context }`, escolhe prompt, chama LLM, devolve `InferResult`. |
| 3     | Mentor IA, Dashboard e Demo passam a usar `infer()` com os respetivos intents.                                                      |
| 4     | Documentar prompts por intent e política de custos/quotas por intent.                                                               |

---

## Referências

- [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md) — Papel da IA na Percepção (eventos, não imagem crua)
- [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md) — Payload de eventos para contexto da IA
- `merchant-portal/src/core/ai/aiGateway.ts` — Gateway em código (infer + mock; opcional VITE_AI_GATEWAY_ENDPOINT)
- `merchant-portal/src/config.ts` — `AI_GATEWAY_ENDPOINT` (opcional)
