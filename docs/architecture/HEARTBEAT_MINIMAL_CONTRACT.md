# Pilot Closure — Heartbeat Minimal Contract (v0)

**Purpose:** Distinguir inequivocamente entre um terminal "silencioso" e um terminal "offline".

**Status:** REQUIRED FOR PILOT. OPTIONAL BEYOND PILOT.
**Authority:** Docker Core.

---

## 1. Mecanismo de Heartbeat

O heartbeat é um sinal vital simples e unidirecional:

- **Origem:** Terminal (TPV, KDS, AppStaff).
- **Destino:** Docker Core.
- **Payload:** Identificador do terminal (apenas `terminal_id`).
- **Método:** HTTP POST/PUT ou via RPC de banco de dados (ex: `update_presence`).

## 2. Intervalo e Timeout

Regras rígidas para o piloto:

-1. **Intervalo:** O cliente envia um sinal ("pulso") a cada N segundos (ex: 30s). 2. **Offline Buffer:** Se o envio falhar (erro de rede), o pulso NÃO é enfileirado no OfflineQueueService padrão (para evitar flood na reconexão), mas apenas o _último_ estado conhecido é mantido em memória para re-tentativa imediata ou descarte. O heartbeat é efêmero.

- **Janela de Timeout:** 90 segundos (3x o intervalo).

## 3. Consequência de UI (Estado Binário)

O sistema reconhece apenas dois estados visuais para o operador no Command Center:

1. **ONLINE (Verde):** Último heartbeat recebido há menos de 90 segundos.
2. **OFFLINE (Cinza/Vermelho):** Último heartbeat recebido há mais de 90 segundos.

Não existe estado "Degradado", "Lento" ou "Instável" para o piloto.

## 4. Sem Garantias Complexas

Este contrato remove complexidade para garantir viabilidade:

- **Sem Retries Inteligentes:** Se o heartbeat falhar, o terminal tenta novamente no próximo ciclo. Não há fila de heartbeats.
- **Sem Alertas Ativos:** A mudança de estado para OFFLINE não dispara notificações push, SMS ou emails. É puramente visual no dashboard.
- **Sem Auto-Healing:** O Core não tenta "acordar" terminais offline.

---

**Conclusão:** O Heartbeat serve apenas para responder à pergunta "O terminal está vivo?" no momento presente. Histórico de uptime não é requerido.
