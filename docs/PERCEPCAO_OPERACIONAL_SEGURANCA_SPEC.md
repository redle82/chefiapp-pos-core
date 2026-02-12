# Módulo de Percepção Operacional e Segurança Assistida — SPEC OFICIAL

**Data:** 2026-01-29
**Status:** Especificação oficial (referência única para evolução)
**Objetivo:** Definir o módulo de percepção operacional e segurança assistida do ChefIApp — **não** como “câmera com IA”, mas como sistema de percepção integrado ao cérebro do restaurante.

---

## 1. O que JÁ ESTÁ CERTO (e é mais avançado do que parece)

O que está montado hoje já está além de 90% das “câmeras com IA” do mercado.

### ✔ Acertos importantes

| Acerto                                         | Detalhe                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Separou Percepção de Segurança tradicional** | Nome “Percepção” é ótimo. Não fala em vigilância, fala em análise de cena.                    |
| **Não identifica pessoas**                     | Texto explícito: “Sem identificar pessoas”. Ouro na Europa (GDPR).                            |
| **Não tenta embutir vídeo onde não dá**        | Explica corretamente a limitação do iCSee. UX honesta > promessa falsa.                       |
| **Pipeline mental correto**                    | Link da câmera → confirmar sinal → analisar com IA. Já é um data pipeline, não um CCTV tosco. |
| **Virou configuração, não feature solta**      | Está em `/config/perception`. Diz: “isto é parte do sistema”, não um gadget.                  |

**Resumo:** O esqueleto está certo. Falta maturidade conceitual e operacional, não reinvenção.

---

## 2. O que está ERRADO ou perigoso agora

### ❌ Problema 1 — “Colar link e mandar para LLM” é frágil

Hoje, conceitualmente, o fluxo é:

**Link da câmera → IA descreve a cena**

Isso é bom para demo, **péssimo para produto real**, porque:

- Links expiram
- Frames mudam
- LLM não é sistema de monitoramento
- Não há noção de tempo, repetição, padrão

**Conclusão:** Não escala e não é confiável como base única.

---

### ❌ Problema 2 — Falta o conceito de ZONA

A câmera vê tudo, mas o sistema não sabe o que é importante.

**Hoje falta:**

- “Isto é cozinha”
- “Isto é estoque”
- “Isto é área crítica”
- “Isto é área irrelevante”

**Sem zonas:** não há inferência, só descrição.

---

### ❌ Problema 3 — Falta o conceito de EVENTO

Descrever uma imagem ≠ perceber algo.

O módulo precisa gerar:

- **evento**
- **alerta**
- **sugestão**
- **tarefa**

Hoje gera texto. **Texto sozinho não muda operação.**

---

## 3. Modelo correto: quatro camadas

Evolução alinhada ao que já existe no ChefIApp.

### CAMADA 1 — Fonte (já existe)

- RTSP / iCSee / ONVIF
- Link salvo
- Confirmação manual de sinal (“Abrir câmera noutra janela” para partilhas; “Ver ao vivo” para streams diretos)

✔ **Já implementado.**

---

### CAMADA 2 — Observação (próximo passo real)

Em vez de “analisar imagem”, o sistema passa a **observar**:

- Movimento vs. ausência de movimento
- Duração
- Repetição
- **Zonas**

Nada de LLM aqui ainda.

**Exemplos de saída:**

- “Zona cozinha sem movimento há 7 min”
- “Zona estoque com presença fora de horário”
- “Fluxo alto no salão + poucos movimentos de serviço”

---

### CAMADA 3 — Inferência (onde mora a inteligência)

Aqui entra IA + regras simples:

- Isto é normal?
- Isto é esperado para este horário?
- Isto conversa com pedidos / KDS / mesas?

**Exemplo:**
“Pedidos ativos + cozinha parada = gargalo provável”

Não é visão computacional pesada — é **contexto**.

---

### CAMADA 4 — Ação (integração com o sistema)

A percepção vira:

- **tarefa**
- **alerta**
- **sugestão no dashboard**
- **entrada no histórico**

**Exemplo de sugestão:**

> 🟡 **Sugestão**
> Cozinha parada há 6 min durante pico.
> Verificar gargalo antes de atrasos.

---

## 4. Framing e o que NÃO fazer

### ❌ Não é

- “Câmera de segurança com IA”
- CCTV inteligente
- Vigilância de pessoas

### ✅ É

**Módulo de Percepção Operacional e Segurança Assistida**

Objetivo: entender o que está a acontecer, detetar anomalias, antecipar problemas operacionais e de segurança — **reduzir risco, não criar paranoia.**

Alinhado à definição de inteligência do ChefIApp: **perceber o que ainda não virou dado**.

### Regras

| Proibido                          | Motivo                              |
| --------------------------------- | ----------------------------------- |
| Reconhecimento facial             | Problema legal e ético              |
| “Pontuar” funcionários por câmera | Perda de confiança da equipe        |
| Ferramenta punitiva               | Cria rejeição imediata              |
| Prometer “controlo total”         | Conflito legal e expectativa errada |

**Frase correta:**
_“O sistema observa padrões do espaço, não pessoas.”_

Apresentação: **proteção e apoio**, não vigilância. Segurança contextual, não Big Brother.

---

## 5. ZONAS (conceito central)

Sem zonas não há inferência. Na UI de Percepção deve existir:

**Campo: Zona da câmera**

Valores iniciais (sugestão):

- **Cozinha**
- **Salão**
- **Estoque**
- **Caixa**
- **Entrada**
- (Outro / personalizável)

Cada câmera configurada fica associada a uma zona. A observação e os eventos passam a ser **por zona**.

---

## 6. EVENTOS (tipos iniciais)

Sem dashboard novo no início. Tipos de evento simples:

| Tipo                     | Significado                                       |
| ------------------------ | ------------------------------------------------- |
| `ZONE_IDLE_TOO_LONG`     | Zona sem movimento há X minutos (acima do limiar) |
| `MOVEMENT_OUTSIDE_HOURS` | Movimento em zona fora do horário esperado        |
| `UNEXPECTED_ACTIVITY`    | Atividade não esperada (ex.: após fechamento)     |

Estes eventos:

- Podem aparecer no Dashboard (cards de eventos)
- Podem virar tarefas
- São o output da Camada 2 + 3, não “descrição de cena”

**Formato de exemplo (observação/inferência):**

```json
{
  "zone": "kitchen",
  "movement": "low",
  "duration_minutes": 6,
  "timestamp": "...",
  "confidence": 0.82,
  "event_type": "ZONE_IDLE_TOO_LONG"
}
```

---

## 7. Papel do LLM (no lugar certo)

**LLM não serve para “olhar imagem” como base do sistema.**

LLM entra para:

- Explicar **eventos** em linguagem humana
- Agrupar padrões
- Gerar recomendações legíveis

Ou seja: **eventos primeiro, LLM a posteriori** para narrativa e sugestões.

---

## 8. Próximos passos CONCRETOS (ordem)

### PASSO 1 — Introduzir ZONAS (urgente)

Na UI de Percepção (`/config/perception`):

- Adicionar campo: **Zona da câmera**
- Opções: Cozinha, Salão, Estoque, Caixa, Entrada (e eventual “Outro”)
- Persistir junto com o link da câmera (ex.: `localStorage` ou backend quando existir)

**Isto muda tudo** para a evolução seguinte.

---

### PASSO 2 — Trocar “Analisar com IA” por “Gerar observação”

Mesmo botão (ou equivalente), conceito diferente:

- ❌ “Descrever a cena”
- ✅ “Detectar padrões básicos”

Output alvo (exemplo): movimento/ausência, duração, zona, timestamp, confiança — **estruturado**, não só texto.

---

### PASSO 3 — Criar EVENTOS SIMPLES

- Definir tipos: `ZONE_IDLE_TOO_LONG`, `MOVEMENT_OUTSIDE_HOURS`, `UNEXPECTED_ACTIVITY`
- Estes eventos podem já aparecer no Dashboard e virar tarefas
- Sem novo dashboard dedicado no início; integrar nos blocos existentes

---

### PASSO 4 — LLM do jeito certo

- LLM consome **eventos** (e eventualmente contexto de pedidos/KDS/horário)
- Gera explicação em linguagem natural e sugestões
- Não substitui a observação; complementa-a

---

## 9. Estado atual da UI (referência)

**Onde:** Configuração → Percepção (`/config/perception`).

**O que existe:**

- Campo **Link da câmera** (guardado em `localStorage`: `chefiapp_perception_camera_url`)
- Botão **Guardar link**
- Deteção de link iCSee (partilha): bloco “Link iCSee (partilha)” + **Abrir câmera noutra janela**
- Para links que não são iCSee: **Ver ao vivo** (preview) + indicador “Câmera ligada” / “Sem sinal”
- Botão **Analisar com IA**: envia `cameraUrl` para `VITE_LLM_VISION_ENDPOINT` (POST `{ imageUrl, cameraUrl }`), mostra descrição da cena

**O que falta na UI (próximos passos):**

- Campo **Zona da câmera**
- Conceito de “Gerar observação” em vez de só “Analisar com IA”
- Apresentação de **eventos** (no Dashboard / lista de alertas)

---

## 10. Integração com o ChefIApp

| Sistema                | Integração                             |
| ---------------------- | -------------------------------------- |
| **Dashboard**          | Alertas e sugestões (cards de eventos) |
| **Sistema de Tarefas** | Ações geradas a partir de eventos      |
| **Modo Demo**          | Explicação do que seria observado      |
| **Modo Pilot**         | Alertas em sandbox                     |
| **Modo Live**          | Alertas reais                          |

**Princípio:** Câmera sozinha não vale nada. **Câmera + zona + evento + contexto = inteligência.**

---

## 11. Privacidade e segurança (Europa-ready)

- Nenhuma imagem armazenada por defeito
- Apenas eventos e metadados
- Logs agregados, não frames
- **O sistema observa padrões do espaço, não pessoas.**

Argumento de venda forte na Europa (GDPR).

---

## 12. Próximos documentos (escolher ordem)

| Opção | Conteúdo                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| **A** | ~~SPEC OFICIAL~~ ✅ Este documento                                                                                  |
| **B** | ~~UI final do módulo (config + dashboard)~~ ✅ [PERCEPCAO_UI_SPEC.md](PERCEPCAO_UI_SPEC.md)                         |
| **C** | ~~Modelo de eventos + integração com tarefas~~ ✅ [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md)  |
| **D** | ~~Arquitetura técnica edge-first (Europa-ready)~~ ✅ [PERCEPCAO_ARQUITETURA_EDGE.md](PERCEPCAO_ARQUITETURA_EDGE.md) |

Todas as opções A–D estão documentadas. Esta spec é a referência única do módulo.

---

## Referências

- [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md) — Modelo de eventos e integração com tarefas
- [PERCEPCAO_UI_SPEC.md](PERCEPCAO_UI_SPEC.md) — UI (config + dashboard)
- [PERCEPCAO_ARQUITETURA_EDGE.md](PERCEPCAO_ARQUITETURA_EDGE.md) — Arquitetura edge-first (Europa-ready)
- [CHEFIAPP_AI_GATEWAY_SPEC.md](CHEFIAPP_AI_GATEWAY_SPEC.md) — Uma IA, vários papéis (gateway + intents)
- [MODO_TRIAL_EXPLICATIVO_SPEC.md](MODO_TRIAL_EXPLICATIVO_SPEC.md) — Copy e integração no Demo Guide
- [LANCAMENTO_SISTEMA_OPERACIONAL_RESTAURANTES.md](LANCAMENTO_SISTEMA_OPERACIONAL_RESTAURANTES.md) — Contexto de lançamento
