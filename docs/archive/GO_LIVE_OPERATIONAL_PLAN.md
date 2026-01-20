# Plano de Go‑Live Operacional — ChefIApp POS Core

Data: 2026-01-03
Audiência: Operação/PM/Fundador + suporte técnico
Objetivo: colocar dinheiro real em produção com rollout controlado, métricas mínimas e gatilhos claros de parada/rollback.

---

## 1) Definições (para evitar ambiguidade)

- **Go‑live**: habilitar TPV com dinheiro real para pelo menos 1 restaurante/tenant.
- **Rollout**: expandir gradualmente para mais tenants.
- **Fail‑closed**: na dúvida, o sistema bloqueia operação de risco (não “chuta”).
- **Sinal verde**: critérios objetivos (métricas + invariantes + auditoria) atendidos.

---

## 2) Pré‑produção (checklist obrigatório)

### 2.1 Checklist técnico
- **Build/Typecheck**
  - `npm run -s typecheck` ✅
  - `npm -w merchant-portal run -s build` ✅
- **DB / migrations**
  - migrations aplicadas e versionadas
  - invariantes críticas ativas (pagamento/imutabilidade/locks conforme arquitetura)
- **RLS / multi‑tenant**
  - tenant isolation testado com 2 tenants reais (não só staging)
  - tentativa de acesso cruzado deve falhar
- **Observability mínima**
  - exceções reportadas (Sentry ou equivalente)
  - logs estruturados nos fluxos críticos (auth, TPV, pagamentos)
  - métricas mínimas coletadas

### 2.2 Checklist operacional
- **Treinamento**
  - operador sabe: abrir/fechar caixa, cancelar, reemitir, recuperar falha
- **Suporte**
  - canal de suporte e janela de plantão no dia do go‑live
- **Procedimentos**
  - “como pausar vendas” (kill switch / feature flag)
  - “como reverter” (rollback operacional e técnico)

---

## 3) Métricas mínimas obrigatórias (durante rollout)

### 3.1 TPV (dinheiro)
- Taxa de sucesso de pagamento ($\ge 99.5\%$ no piloto)
- Duplicação de pagamento (meta: **0**)
- Divergência pedido vs pagamento (meta: **0**) 

### 3.2 Operação
- Tempo de boot (p50/p95)
- Tempo para primeira interação (p50/p95)
- Latência RPC crítica (p50/p95)
- Erros por hora (com severidade)

### 3.3 Offline
- Tamanho do storage local (tendência)
- Taxa de falha de replay/merge (meta: próxima de 0)

---

## 4) Gatilhos de parada (STOP THE LINE)

Se qualquer condição ocorrer, **pausar rollout imediatamente** e voltar para análise:

- **Qualquer** evidência de pagamento duplicado
- Qualquer evidência de “pedido pago sem pagamento” ou “pagamento sem fechamento correto”
- Erros críticos sem rastreabilidade (sem stack/contexto)
- Boot p95 degradando acima do limite definido (ex.: >2s em device alvo)
- Falhas offline que criem estado inconsistente

---

## 5) Rollout em fases (gradual)

### Fase 0 — Dry‑run (staging com operação real)
- Rodar um “dia simulado” com equipe interna
- Critério de saída: checklist técnico+operacional completo

### Fase 1 — Piloto (1 restaurante / 1 operador)
- Ativar TPV somente para 1 tenant
- Monitorar métricas em tempo real
- Janela: 1–3 dias
- Critério de saída:
  - 0 inconsistências financeiras
  - estabilidade operacional aceitável

### Fase 2 — Early adopters (3–5 restaurantes)
- Expandir para tenants com perfil controlado
- Critério de saída:
  - métricas estáveis
  - suporte não saturado

### Fase 3 — Escala inicial (10–25 restaurantes)
- Expandir com limites de taxa e monitoramento
- Critério de saída:
  - incidentes dentro de SLO

### Fase 4 — Produção normal (50–100)
- Entrar em ciclo regular de releases

---

## 6) Estratégia de feature flags / controle por tenant

- Flags por tenant para:
  - TPV (dinheiro real)
  - recursos de AppStaff
  - integrações externas

Regras:
- flags **fail‑closed**
- “switch de emergência” deve existir e ser testado

---

## 7) Rollback (técnico e operacional)

### 7.1 Rollback operacional
- Desativar flag de TPV para tenant afetado
- Migrar para procedimento manual (fallback) documentado

### 7.2 Rollback técnico
- Se mudança recente causou regressão:
  - reverter release/commit
  - preservar logs/eventos para auditoria

---

## 8) Quem decide o quê (RACI mínimo)

- **Go/No‑Go**: CTO + Operação (dupla assinatura)
- **Stop the line**: qualquer operador pode acionar; decisão de retomada é do CTO
- **Rollout para novo tenant**: Operação aprova, técnico executa

---

## 9) Checklist do “Dia 1” (script operacional)

- Antes de abrir:
  - confirmar caixa aberto
  - confirmar conectividade
  - confirmar observability ativa
- Durante:
  - monitorar erros/latência
  - registrar incidentes imediatamente
- Depois:
  - fechar caixa
  - reconciliar pedidos x pagamentos
  - registrar veredito (Go/No‑Go para próximo dia)
