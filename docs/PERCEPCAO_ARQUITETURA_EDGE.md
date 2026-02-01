# Percepção Operacional — Arquitetura Edge-First (Europa-Ready)

**Data:** 2026-01-29  
**Referência:** [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md), [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md)  
**Objetivo:** Definir a arquitetura técnica do módulo Percepção com processamento edge-first e conformidade Europa (GDPR, privacidade, localização de dados).

---

## 1. Princípio Edge-First

**O que significa:** O máximo de processamento acontece **no local** (no restaurante ou num dispositivo/gateway próximo à câmera). Só sobem para a nuvem **eventos estruturados** (zona, movimento, duração), nunca vídeo nem imagens por defeito.

**Benefícios:**

- **Privacidade:** Vídeo não sai do local; só metadados e eventos.
- **Latência:** Observação e deteção de padrões em tempo real, sem depender da cloud.
- **Custo e largura de banda:** Não é preciso enviar stream contínuo para a cloud.
- **Conformidade:** Facilita GDPR e exigências de “dados na UE” — os dados sensíveis (vídeo) ficam no edge.

---

## 2. Fluxo de dados (alto nível)

```
┌─────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   Câmera    │────▶│  EDGE (observação)       │────▶│  Eventos        │
│ RTSP/iCSee  │     │  • Movimento / ausência  │     │  • zone         │
│ ONVIF       │     │  • Duração por zona      │     │  • event_type   │
└─────────────┘     │  • Sem LLM, sem faces    │     │  • timestamp    │
                   └──────────────────────────┘     │  • confidence   │
                              │                      └────────┬────────┘
                              │                               │
                              ▼                               ▼
                   ┌──────────────────────────┐     ┌─────────────────┐
                   │  CORE / Cloud (opcional) │     │  ChefIApp       │
                   │  • Inferência (regras)    │     │  • gm_tasks     │
                   │  • Tarefas, alertas      │     │  • AlertEngine  │
                   │  • LLM narrativa (opcional)     │  • Dashboard    │
                   └──────────────────────────┘     └─────────────────┘
```

**Regra de ouro:** No edge saem apenas **eventos** (payloads como em PERCEPCAO_EVENTOS_E_TAREFAS.md). Vídeo e frames não são enviados para a cloud por defeito.

---

## 3. Componentes

### 3.1 Edge — Observador (Camada 2)

- **Onde corre:** No local do restaurante (Raspberry Pi, NUC, gateway, ou serviço próximo à rede local).
- **Entrada:** Stream da câmera (RTSP, MJPEG, etc.) ou acesso a snapshot periódico.
- **Processamento:** Deteção de movimento, ausência de movimento, duração por **zona** (zona configurada por câmera). Sem reconhecimento facial, sem identificação de pessoas.
- **Saída:** Eventos estruturados (ex.: `PERCEPTION_ZONE_IDLE`, `PERCEPTION_MOVEMENT_OUTSIDE_HOURS`) com `zone`, `timestamp`, `confidence`, etc.
- **Tecnologia sugerida:** Visão computacional leve (OpenCV, deteção de movimento, máscaras por zona) ou integração com câmera/ONVIF que já exponha eventos de movimento. Sem LLM no edge na fase inicial.

### 3.2 Emissor de eventos

- **Onde corre:** Mesmo que o observador (edge) ou num serviço local que agregue vários observadores.
- **Função:** Enviar eventos para o Core (ChefIApp) via API REST ou fila. Payload conforme PERCEPCAO_EVENTOS_E_TAREFAS.md.
- **Segurança:** Autenticação (API key, JWT) e TLS. Sem enviar imagens no corpo do pedido por defeito.

### 3.3 Core / Cloud — Inferência e ação (Camadas 3 e 4)

- **Onde corre:** Servidor ChefIApp (Docker Core, Supabase, ou cloud).
- **Entrada:** Eventos de Percepção.
- **Processamento:** Regras (ex.: “zona parada há X min” → tarefa), criação de tarefas (gm_tasks), alertas (AlertEngine), opcionalmente LLM para narrativa/sugestão a partir de **eventos** (não de imagem).
- **Armazenamento:** Apenas eventos e metadados (context, zone, timestamp). Nenhuma imagem armazenada por defeito.

### 3.4 LLM (opcional, no lugar certo)

- **Entrada:** Eventos (e contexto de pedidos/KDS/horário), **não** frames nem vídeo.
- **Função:** Explicar em linguagem natural, agrupar padrões, gerar sugestões.
- **Onde corre:** Cloud ou serviço gerido; sem necessidade de enviar vídeo.

---

## 4. Europa-Ready (GDPR e privacidade)

### 4.1 Princípios aplicados

| Princípio | Aplicação no módulo Percepção |
|-----------|-------------------------------|
| **Minimização de dados** | Só se recolhem e tratam eventos (zona, movimento, duração). Vídeo fica no edge; não é enviado nem armazenado por defeito. |
| **Sem dados biométricos** | Não há reconhecimento facial nem identificação de pessoas. "O sistema observa padrões do espaço, não pessoas." |
| **Finalidade e legitimidade** | Finalidade: percepção operacional e segurança assistida (gargalos, anomalias, prevenção). Não vigilância de pessoas. |
| **Limitação do prazo de conservação** | Eventos e logs com política de retenção definida (ex.: 30–90 dias); sem retenção indefinida de vídeo. |
| **Localização dos dados** | Dados de eventos podem ser armazenados em região UE (configurável). Vídeo não sai do estabelecimento por defeito. |

### 4.2 O que NÃO se faz

- Não armazenar imagens ou vídeo na cloud por defeito.
- Não identificar pessoas (sem face, sem biometria).
- Não usar a câmera para “pontuar” ou vigiar funcionários; uso apresentado como proteção e apoio ao negócio.

### 4.3 Documentação e conformidade

- **Registo de atividades de tratamento:** Incluir finalidade, categorias de dados (eventos, metadados), base legal, retenção, medidas de segurança.
- **Informação ao titular:** Ex.: "O sistema observa padrões de movimento no espaço para identificar gargalos e situações de risco, sem identificar pessoas."
- **Segurança:** TLS em trânsito; armazenamento de eventos com controlo de acesso; sem expor vídeo em APIs públicas.

---

## 5. Opções de implantação

| Modo | Edge | Cloud | Uso típico |
|------|------|-------|------------|
| **Full edge** | Observador + emissor no local; eventos enviados para Core (on-prem ou cloud) | Core pode ser on-prem ou em cloud; só recebe eventos | Restaurante com gateway local; máxima privacidade. |
| **Híbrido** | Observador no local; emissor envia eventos para Core em cloud (UE) | Core + tarefas + alertas + opcional LLM em cloud | Produto SaaS com dados de eventos na UE; vídeo não sai do local. |
| **SaaS (sem vídeo na cloud)** | Cliente usa câmera com link/stream; observador pode ser serviço gerido em região UE que **não persiste** vídeo | Core e LLM em cloud; observador pode ser nosso serviço que processa stream em memória e emite apenas eventos | Quando o cliente não tem edge próprio; garantindo que nenhum frame é armazenado. |

**Recomendação:** Preferir **full edge** ou **híbrido** para clientes na Europa; SaaS sem persistência de vídeo só com garantias claras e documentadas.

---

## 6. Segurança técnica

- **Autenticação:** Emissor de eventos autentica-se perante o Core (API key, JWT, ou mTLS).
- **Trânsito:** HTTPS/TLS para todas as comunicações edge → Core e frontend → backend.
- **Armazenamento:** Eventos no Core com controlo de acesso (por restaurante); sem armazenar imagens.
- **Auditoria:** Logs de ingestão de eventos (quem, quando, tipo) para rastreabilidade; sem log de conteúdo de vídeo.

---

## 7. Resumo

- **Edge-first:** Observação (movimento, zonas, duração) no local; só eventos sobem para o Core.
- **Europa-ready:** Sem imagens na cloud por defeito; sem dados biométricos; eventos com retenção limitada; dados em região UE quando em cloud.
- **Alinhado à SPEC:** Camadas 1–4 (fonte, observação, inferência, ação) com responsabilidades claras; LLM apenas sobre eventos, não sobre vídeo.

---

## Referências

- [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md) — SPEC oficial
- [PERCEPCAO_EVENTOS_E_TAREFAS.md](PERCEPCAO_EVENTOS_E_TAREFAS.md) — Modelo de eventos e integração com tarefas
- [PERCEPCAO_UI_SPEC.md](PERCEPCAO_UI_SPEC.md) — UI (config + dashboard)
