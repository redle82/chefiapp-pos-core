# Strategic Positioning

**Propósito:** Diferenciação ChefIApp vs Toast, Square e LastApp. Enfoque em Workforce Orchestrator, automação comportamental, arquitectura modular e inteligência operacional.  
**Ref:** [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md), [MANIFESTO_COMERCIAL.md](../MANIFESTO_COMERCIAL.md)

---

## 1. Posicionamento central

**ChefIApp OS** — Sistema operacional para restaurantes com orquestração de equipa e automação comportamental.

**Frase de âncora:**
> "Last.app organiza o restaurante. ChefIApp guia-o."

---

## 2. ChefIApp vs Toast

| Dimensão | Toast | ChefIApp |
|----------|-------|----------|
| **Foco** | POS completo, pagamentos, hardware, escala | Orquestração de equipa, inteligência operacional |
| **Pagamentos** | Ecossistema próprio, hardware Toast | Stripe/SumUp; BYOD ou hardware standard |
| **Workforce** | Módulo separado, integração | Workforce Orchestrator nativo; tarefas baseadas em contexto |
| **KDS** | Display cozinha clássico | KDS híbrido: Orders + Task Board (quando idle) |
| **Automação** | Regras estáticas | Automação comportamental (KDS_LOAD, zona, pico) |
| **Arquitectura** | Monolito, tudo incluído | Modular; cobrança por módulo |
| **Mercado** | US-first, escala global | Europa, LATAM; multi-moeda, multi-idioma |

**Diferencial ChefIApp:**
- **Workforce Orchestrator** — Tarefas geradas por estado (cozinha cheia vs vazia); atribuição por zona e role.
- **KDS que pensa** — Quando não há pedidos, vira painel de tarefas (mise, limpeza, etc.).
- **Plataforma modular** — Pode comprar só POS ou só Workforce (fase futura).

**O que NÃO competimos:**
- Hardware próprio
- Infraestrutura à escala Toast
- Suporte 24/7 global

---

## 3. ChefIApp vs Square

| Dimensão | Square | ChefIApp |
|----------|--------|----------|
| **Foco** | Pagamentos, simplicidade, SMB | Orquestração operacional, equipa |
| **POS** | Simples, rápido | POS + contexto (mesa, zona, KDS) |
| **Restaurante** | Módulos opcionais | Restaurante é o core |
| **Tarefas** | Não tem | Workforce Orchestrator nativo |
| **Decisões** | Manual | Baseadas em contexto (KDS_LOAD, zona) |
| **Preço** | Pay-per-use, low-touch | SaaS mensal, mais funcionalidades |

**Diferencial ChefIApp:**
- **Decisões baseadas em contexto** — Menu adapta quando cozinha saturada; tarefas aparecem quando calmo.
- **Workforce Orchestrator** — Square não tem orquestração de tarefas por zona/role.
- **Restaurante-first** — Não é um POS genérico adaptado; é desenhado para sala/cozinha/bar.

**O que NÃO competimos:**
- Simplicidade extrema (Square é mais simples)
- Volume de transacções pay-per-swipe

---

## 4. ChefIApp vs LastApp

| Dimensão | LastApp | ChefIApp |
|----------|---------|----------|
| **Foco** | Organização, QR, mesas, reservas | Orquestração, decisões, guia operacional |
| **Posicionamento** | "Organiza o restaurante" | "Guia o restaurante" |
| **TPV** | Integra com terceiros | POS nativo |
| **Sugestões** | Listas, checklists | Sugestões contextuais (agora faça X) |
| **Tarefas** | Manuais ou checklists | Automáticas por estado (idle vs pico) |
| **KDS** | Não é foco | KDS híbrido central |

**Diferencial ChefIApp:**
- **TPV que pensa** — Não só registra; sugere a próxima acção e explica o porquê.
- **Coexistência** — ChefIApp guia; Last organiza. Podem ser usados em conjunto.
- **Workforce Orchestrator** — Tarefas geradas por regras (não apenas checklists estáticos).

**O que NÃO fazemos:**
- Substituir LastApp como "organizador"
- Competir em features de QR/mesas isoladamente

---

## 5. Pilares de diferenciação

### 5.1 Workforce Orchestrator

- Tarefas geradas por contexto: KDS_LOAD, zona ocupada, tempo idle
- Regras: KDS cheio → só tarefas operacionais; KDS vazio → tarefas de manutenção
- Atribuição por zona e role
- Anti-spam: idempotência por janela temporal

### 5.2 Automação comportamental

- Sistema adapta às condições: pico vs calmo
- Menu esconde pratos lentos quando cozinha saturada
- KDS muda de Orders View para Tasks View quando idle
- Decisões baseadas em estado, não em regras fixas

### 5.3 Arquitectura modular

- Módulos vendíveis: Core, POS, Workforce, Intelligence
- Cobrança por módulo ativo
- Não é "tudo ou nada"

### 5.4 Inteligência operacional

- Mapa vivo do salão (timer, cores, urgência)
- Métricas em tempo real (por zona, por período)
- Auditoria e RBAC (Enterprise)

---

## 6. Anti-posicionamento (o que NÃO somos)

- **Não somos** "mais um POS barato" — competimos em inteligência, não em preço de hardware
- **Não somos** "hub de integrações" — foco operacional, simplicidade
- **Não somos** "substituição do Last.app" — coexistimos; ChefIApp guia, Last organiza
- **Não somos** "Toast ou Square" — não competimos em hardware ou escala de pagamentos

---

## 7. Mensagens de venda recomendadas

**Usar:**
- "TPV que pensa"
- "O sistema diz-lhe o que fazer"
- "Trabalhe 10x mais rápido"
- "Orquestração de equipa a escala"
- "Plataforma modular"

**Evitar:**
- "Sistema operacional do restaurante" (muito amplo)
- "ERP completo"
- "Substitui Last.app"
- "Como Toast, mas mais barato"

---

## 8. Referências

- [MANIFESTO_COMERCIAL.md](../MANIFESTO_COMERCIAL.md)
- [COMMERCIAL_PITCH.md](../strategy/COMMERCIAL_PITCH.md)
- [PLATFORM_MODULAR_DECISION.md](../strategy/PLATFORM_MODULAR_DECISION.md)
