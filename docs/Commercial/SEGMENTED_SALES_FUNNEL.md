# Segmented Sales Funnel

**Propósito:** Funis comerciais por vertical (Small, Multi-location, Enterprise) com landing variations, pain points, scripts de demo e objecções.  
**Ref:** [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md)

---

## 1. Vertical: Small Restaurants

### 1.1 Perfil

| Campo | Valor |
|-------|-------|
| **Segmento** | 1–2 locais, <10 mesas, dono operacional |
| **Persona** | Dono que atende balcão e cozinha |
| **Rota** | `/small` ou `?segment=small` |

### 1.2 Landing variation

**Hero:**  
> Menos caos. Um sistema. Controlo em tempo real.

**Subtítulo:**  
> O TPV que pensa. Pagamento em 2 toques. Cozinha e salão em sincronia.

**Social proof:**  
> Primeira venda em menos de 10 minutos.

**CTA principal:** Começar grátis  
**CTA secundário:** Ver como funciona (vídeo 60s)

### 1.3 Pain points

- Garçons sobrecarregados; erros frequentes (pedido esquecido, pagamento duplo)
- Falta de visibilidade: dono não sabe estado do salão em tempo real
- Sistema actual complexo ou caro; resistência a mudar
- Tempo de pagamento longo (2–3 min) → perda de turnover

### 1.4 Value argument

| Proposta | Evidência |
|----------|-----------|
| Pagamento em 2 toques (< 5s) | Demo em vídeo; "36x mais rápido" |
| Mapa vivo do salão | Screenshot; "estado em 1 olhar" |
| Menu adapta à pressão da cozinha | "Esconde pratos lentos quando saturado" |
| Trial 14 dias sem cartão | Zero fricção para testar |

### 1.5 Demo script (15 min)

1. **Abertura (1 min):** "Vou mostrar como o ChefIApp reduz caos e acelera pagamentos."
2. **Contexto (2 min):** "Quantas mesas tem? Quantos colaboradores no pico?"
3. **Demo TPV (4 min):** Pedido → KDS → Pagamento 2 toques → Mesa libera
4. **Demo Mapa (3 min):** "Aqui vê o estado do salão. Timer, cores, urgência."
5. **Demo KDS (3 min):** "Cozinha cheia? O menu esconde pratos lentos."
6. **Fechamento (2 min):** "Quer começar o trial? 14 dias grátis, sem cartão."

### 1.6 Objection handling

| Objecção | Resposta |
|----------|----------|
| "Já tenho Last.app" | "Last organiza. ChefIApp guia. Pode usar ambos. ChefIApp é o TPV que pensa e reduz erros." |
| "É caro?" | "Começa em €29/mês. Trial 14 dias grátis. Se não reduzir erros, não paga." |
| "É complicado?" | "Primeira venda em menos de 10 minutos. O sistema diz-lhe o que fazer." |
| "Não tenho tempo para mudar" | "Setup em 10 min. Pode testar ao fim-de-semana. Zero risco." |

---

## 2. Vertical: Multi-Location Chains

### 2.1 Perfil

| Campo | Valor |
|-------|-------|
| **Segmento** | 2–5 locais, gestor central |
| **Persona** | Gestor ou dono com várias casas |
| **Rota** | `/multi` ou `?segment=multi` |

### 2.2 Landing variation

**Hero:**  
> Um comando para todas as casas. Dados em tempo real.

**Subtítulo:**  
> Consolida vendas, turnos e tarefas num único dashboard. Uma verdade para sala, bar e cozinha.

**Social proof:**  
> Consolidação sem complexidade. Multi-local sem multi-sistema.

**CTA principal:** Agendar demo  
**CTA secundário:** Falar com vendas

### 2.3 Pain points

- Dados fragmentados entre locais; relatórios manuais
- Falta de visibilidade central: qual casa está a performar?
- Turnos e escalas por local, sem visão agregada
- Custos com múltiplos fornecedores (POS, gestão, etc.)

### 2.4 Value argument

| Proposta | Evidência |
|----------|-----------|
| Um dashboard, todas as casas | Screenshot; "vendas por local em tempo real" |
| Turnos consolidados | "Escalas por zona e local" |
| Tarefas automáticas por local | "Orquestrador adapta ao estado de cada casa" |
| Billing por local ou agregado | "Um contrato ou por unidade" |

### 2.5 Demo script (25 min)

1. **Abertura (2 min):** "Vou mostrar como unificar o comando de várias casas."
2. **Discovery (5 min):** "Quantos locais? Que sistemas usa hoje? Qual a maior dor?"
3. **Demo Dashboard (8 min):** Visão por local, vendas, turnos, tarefas
4. **Demo Orquestrador (5 min):** "Quando uma casa está calma, aparecem tarefas de manutenção. Em pico, só o essencial."
5. **Pricing / Próximos passos (5 min):** "Pro com até 3 locais. Enterprise ilimitado."

### 2.6 Objection handling

| Objecção | Resposta |
|----------|----------|
| "Já temos sistema por local" | "Integramos via API ou migramos gradualmente. Um local de cada vez." |
| "É escalável?" | "Pro até 3 locais. Enterprise ilimitado. Multi-tenant robusto." |
| "E o suporte?" | "Pro: email. Enterprise: suporte prioritário." |
| "Migração demora?" | "Por local: 1–2 dias. Sem paragem. Dados preservados." |

---

## 3. Vertical: Enterprise Hospitality Groups

### 3.1 Perfil

| Campo | Valor |
|-------|-------|
| **Segmento** | 6+ locais, franchising, grupos hoteleiros |
| **Persona** | Director operacional, IT, franchisor |
| **Rota** | `/enterprise` |

### 3.2 Landing variation

**Hero:**  
> Orquestração de equipa a escala. Compliance e auditoria.

**Subtítulo:**  
> RBAC, auditoria, API documentada. Multi-tenant enterprise-ready.

**Social proof:**  
> Plataforma modular. Integre o que precisa.

**CTA principal:** Falar com vendas  
**CTA secundário:** Ver documentação da API

### 3.3 Pain points

- Controlo de acesso e auditoria (quem fez o quê)
- Compliance fiscal e operacional por país/região
- Integração com ERP, BI, sistemas corporativos
- Escalabilidade e SLA para múltiplos locais

### 3.4 Value argument

| Proposta | Evidência |
|----------|-----------|
| RBAC por papel e zona | "Owner, Manager, Staff, Kitchen, Cleaning" |
| Auditoria completa | "Histórico de decisões e alterações" |
| API pública documentada | "Integração com ERP, BI, CRMs" |
| Multi-tenant com isolamento | "Dados segregados por tenant" |

### 3.5 Demo script (45 min)

1. **Abertura (5 min):** "Vou mostrar a arquitectura enterprise e os módulos relevantes."
2. **Discovery (10 min):** "Quantos locais? Stack actual? Requisitos de compliance?"
3. **Demo RBAC + Auditoria (10 min):** Papéis, permissões, logs
4. **Demo Orquestrador + Tarefas (10 min):** Regras, idempotência, anti-spam
5. **API + Integrações (5 min):** Endpoints, webhooks, documentação
6. **Pricing + SLA (5 min):** Enterprise, suporte, customização

### 3.6 Objection handling

| Objecção | Resposta |
|----------|----------|
| "Precisamos de certificação específica" | "Documentamos arquitectura e fluxos. Apoiamos auditorias." |
| "Integração com nosso ERP?" | "API REST documentada. Webhooks. Podemos avaliar conectores." |
| "SLA?" | "Enterprise inclui SLA e suporte prioritário." |
| "Security review?" | "Fornecemos documentação de segurança. Dados em EU/região conforme." |

---

## 4. Resumo — CTAs por vertical

| Vertical | CTA principal | CTA secundário |
|----------|---------------|----------------|
| Small | Começar grátis | Ver como funciona |
| Multi | Agendar demo | Falar com vendas |
| Enterprise | Falar com vendas | Ver documentação API |

---

## 5. Query params para campanhas

- `?segment=small` — Small restaurants
- `?segment=multi` — Multi-location
- `?segment=enterprise` — Enterprise

Usar em links de campanhas para pré-selecionar copy e formulários.
