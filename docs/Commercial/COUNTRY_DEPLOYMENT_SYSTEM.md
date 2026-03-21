# Country Deployment System

**Propósito:** Sistema de lançamento de landings localizadas por país. **Gateway-first:** apenas BR, ES, GB, US.  
**Ref:** [GATEWAY_DEPLOYMENT_MATRIX.md](./GATEWAY_DEPLOYMENT_MATRIX.md)

---

## 1. Estrutura de landing por país

Para cada país alvo, a landing inclui:

| Elemento | Descrição | Implementação |
|----------|-----------|---------------|
| **Hero** | Value proposition localizada | Título + subtítulo por idioma |
| **Pricing** | Moeda local | EUR, BRL, USD, GBP conforme país |
| **WhatsApp CTA** | Número local (quando disponível) | Link `wa.me/{countryCode}{number}` |
| **Demo booking** | Form ou Calendly embed | Integração por país/idioma |
| **SEO** | H1/H2, meta, hreflang | Estrutura abaixo |

---

## 2. Países alvo — especificação completa (gateway-first)

### España (ES)

| Campo | Valor |
|-------|-------|
| **Rota** | `/es` |
| **Locale** | es |
| **Moeda** | EUR |
| **WhatsApp** | +34 XXX XXX XXX (configurar) |

**Hero (H1):**  
> ChefIApp OS — El sistema operativo para restaurantes en España

**H2 SEO:**
- Por qué los restaurantes en España eligen ChefIApp
- POS + Orquestración de equipo en un solo lugar
- Pago en 2 toques. Cocina y sala en sincronía.

**Meta title:** ChefIApp España | POS + Orquestración de Equipo para Restaurantes  
**Meta description:** Sistema operativo para restaurantes. Pago rápido, KDS inteligente, tareas automáticas. Prueba gratis 14 días. Empieza en minutos.

**Regulatório:** Cumplimiento RGPD; facturación española.  
**Delivery:** "Integración delivery: modo manual asistido hoy. Agregadores en roadmap."

---

### Brasil (BR)

| Campo | Valor |
|-------|-------|
| **Rota** | `/br` |
| **Locale** | pt-BR |
| **Moeda** | BRL |
| **WhatsApp** | +55 XX XXXXX-XXXX (configurar) |

**Hero (H1):**  
> ChefIApp OS — O sistema operacional para restaurantes brasileiros

**H2 SEO:**
- Por que restaurantes no Brasil escolhem o ChefIApp
- POS + Orquestração de equipe em um só lugar
- Pagamento em 2 toques. Cozinha e salão em sincronia.

**Meta title:** ChefIApp Brasil | POS + Orquestração de Equipe para Restaurantes  
**Meta description:** Sistema operacional para restaurantes. Pagamento rápido, KDS inteligente, tarefas automáticas. Teste grátis 14 dias. Comece em minutos.

**Regulatório:** LGPD; faturamento via NF-e / NFC-e conforme estado.  
**Delivery:** "Delivery: modo manual assistido hoje. iFood, Rappi, Uber Eats via agregador em roadmap."

---

### United States (US)

| Campo | Valor |
|-------|-------|
| **Rota** | `/us` ou `/` |
| **Locale** | en |
| **Moeda** | USD |
| **CTA principal** | Email / Calendly (SMS opcional) |

**Hero (H1):**  
> ChefIApp OS — The Operating System for Restaurants

**H2 SEO:**
- Why US restaurants choose ChefIApp
- POS + Workforce orchestration in one place
- 2-tap payment. Kitchen and floor in sync.

**Meta title:** ChefIApp USA | POS + Workforce Orchestration for Restaurants  
**Meta description:** Restaurant operating system. Fast payment, smart KDS, automatic tasks. 14-day free trial. Start in minutes.

**Regulatório:** State-by-state sales tax; PCI compliance.  
**Delivery:** "Delivery: manual-assisted mode today. Aggregators (DoorDash, Uber Eats) on roadmap."

---

### United Kingdom (GB)

| Campo | Valor |
|-------|-------|
| **Rota** | `/gb` |
| **Locale** | en |
| **Moeda** | GBP |
| **WhatsApp** | +44 XXXX XXXXXX (configurar) |

**Hero (H1):**  
> ChefIApp OS — The Operating System for UK Restaurants

**H2 SEO:**
- Why UK restaurants choose ChefIApp
- POS + Workforce orchestration in one place
- 2-tap payment. Kitchen and floor in sync.

**Meta title:** ChefIApp UK | POS + Workforce Orchestration for Restaurateurs  
**Meta description:** Restaurant operating system. Fast payment, smart KDS, automatic tasks. 14-day free trial. Start in minutes.

---

## 3. Secção de comparação com concorrentes (por país)

Estrutura comum para todos os países. Texto localizado.

| Concorrente | Positioning local | ChefIApp diferenciação |
|-------------|-------------------|-------------------------|
| **Toast** | POS completo, pagamentos, hardware | Orquestração de equipa; tarefas automáticas; KDS híbrido |
| **Square** | Pagamentos, POS simples | Workforce Orchestrator; decisões baseadas em contexto |
| **LastApp** | Organização de restaurante | ChefIApp guia; Last organiza. TPV que pensa |
| **Local POS** | Soluções regionais (ex: Ticket, Tiller) | Plataforma modular; automação comportamental |

---

## 4. Mensagens de integração delivery por região

| Região | Mensagem |
|--------|----------|
| **Europa (ES, GB)** | "Delivery: modo manual assistido hoje. Integração com agregadores (Deliverect, Otter) em roadmap." |
| **Brasil** | "Delivery: modo manual assistido hoje. iFood, Rappi, Uber Eats via agregador em roadmap." |
| **US** | "Delivery: manual-assisted mode today. DoorDash, Uber Eats via aggregator on roadmap." |

---

## 5. Estrutura SEO (H1/H2) canónica

```
H1: [ChefIApp OS — Value proposition localizada]
H2: [Por que [país] escolhe ChefIApp]
H2: [POS + Orquestração de equipa num único lugar]
H2: [Pricing — Planos por moeda local]
H2: [Comparação com Toast, Square e alternativas]
H2: [FAQ — Perguntas frequentes]
H2: [Agendar demo / Começar grátis]
```

---

## 6. Meta tags template

```html
<title>{meta_title} | ChefIApp</title>
<meta name="description" content="{meta_description}" />
<meta property="og:title" content="{meta_title}" />
<meta property="og:description" content="{meta_description}" />
<meta property="og:locale" content="{locale_bcp47}" />
<link rel="alternate" hreflang="es" href="https://chefiapp.com/es" />
<link rel="alternate" hreflang="pt-BR" href="https://chefiapp.com/br" />
<link rel="alternate" hreflang="en-GB" href="https://chefiapp.com/gb" />
<link rel="alternate" hreflang="en" href="https://chefiapp.com/us" />
<link rel="alternate" hreflang="x-default" href="https://chefiapp.com/gb" />
```
