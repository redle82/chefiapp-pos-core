# SYSTEM TRUTH CODEX (ChefIApp)

Este documento é a lei suprema do sistema.  
Qualquer PR que viole este Codex deve ser rejeitado.

---

## 0) Definições

**CORE**: camada financeira/operacional (sessão, pedidos, pagamentos, consistência). O resto é MÓDULO.
**Truth**: o estado real do Core (health, fila, reconciliação, dados persistidos).  
**UI**: projeção do Truth no ecrã.

---

## 1) As 3 Leis da Verdade

### Lei 1 — UI é Consequência
A UI não “antecipa” o Core.  
Se não há confirmação, a UI não finge que aconteceu.

### Lei 2 — Não existe “Online Mode”
Existe apenas **Fast Offline**:  
**Ação → Registro local → Fila → Reconciler → API → Confirmação**  
Online é só “fila com latência baixa”.

### Lei 3 — Truth Zero (Onboarding é sagrado)
Nunca iniciar onboarding/cadastro/ativação se o Core está DOWN/UNKNOWN.  
Se o Core não responde, o sistema deve:
- bloquear a ação
- explicar o porquê
- oferecer “Retry” e (se aplicável) “Demo Mode” **explicitamente rotulado**

---

## 2) Regras do CORE (imutabilidade e causalidade)

Estas regras são inegociáveis:

- **Estados financeiros irreversíveis**
- **Operações fechadas são imutáveis**
- **Sem pagamento sem pedido finalizado**
- **Sem pedido sem sessão ativa**
- **Sem transições escondidas**

O Core aplica constraints formais (ex.: não criar ORDER sem SESSION ativa; total imutável após LOCKED; item imutável após LOCKED).

As máquinas de estado são “source of truth” versionadas (JSON) + executor tipado.

---

## 3) Contrato do Health (Truth Signal)

### Status possíveis
- UNKNOWN: inicial / não verificado
- UP: ok
- DEGRADED: ok porém lento (latência acima do limiar)
- DOWN: indisponível / erro / timeout

### Regras obrigatórias
- Polling **dinâmico** (DOWN = mais agressivo; UP = normal)
- Toda ação crítica deve passar por gating (ex.: create/publish/pay)
- Logs devem registrar mudanças de estado (UP→DOWN etc.)

---

## 4) Contrato da Fila Offline (Unified Loop)

### Tipos de eventos
Tudo que muda o Core entra na fila (criar pedido, atualizar itens, fechar pedido, etc.).

### Regras
- “failed” não auto-retry infinito: precisa de gesto humano (Retry CTA) quando atingir limite.
- Retry humano deve resetar tentativas/backoff e voltar o item para “queued”.
- Reconciler deve acordar por **push** (enqueue) + manter um poll de segurança.

---

## 5) Observabilidade é obrigatória

### Painel de Observabilidade
Deve existir uma visão acessível no TPV para:
- health snapshot (status, last ok, latência, falhas)
- queue stats (queued/syncing/failed/applied)
- próximo retry / último aplicado
- log do operador (eventos e transições)

### Timeline por pedido
Cada pedido deve exibir causalidade:
enqueue → tentativas/backoff → erro (com lastError) → aplicado

---

## 6) Regras de Teste (Truth Freeze)

### Suite obrigatória
- `test:truth` é gate de PR (regressão anti-mentira)
- testes devem validar:
  - Truth Zero (onboarding bloqueado em DOWN)
  - reconciliação offline→online
  - backoff
  - retry humano
  - seletores (`data-testid`) estáveis

### Chaos (Truth or Death)
Infra deve permitir flapping controlável do Core (manual ou determinístico) para provar:
- DOWN detection trava UI
- recuperação volta a liberar fluxo sem precisar reload

---

## 7) Como decidir UX em caso de dúvida

Se você não consegue provar que algo aconteceu:
- trate como “pendente”
- mostre status real
- ofereça ações honestas (Retry / Recarregar / Suporte)
- nunca esconda falha com animação/progresso falso

---

## 8) Cláusula final

Se o código viola o Codex, o código está errado — mesmo que “funcione”.
