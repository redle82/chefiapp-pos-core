# Contrato de Rotas da Landing — Core

## Lei do sistema

**A landing tem um único mapa de destinos. Ninguém altera botões nem rotas sem alterar este contrato.**

Este documento é contrato formal no Core. Referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

**Semântica estado/intenção:** O mapa técnico de rotas e botões aqui definido é complementado pelo contrato [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md), que define botões como **portais de estado** (modos Demo / Piloto / Operacional) e os três caminhos canónicos na landing (Operar / Explorar demo / Já tenho acesso). Alterações de copy ou intenção dos CTAs devem respeitar ambos os contratos.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Rotas públicas (Landing e entrada)

| Rota                   | Componente / Comportamento                                                       | Imutável |
| ---------------------- | -------------------------------------------------------------------------------- | -------- |
| `/`                    | LandingPage (Sovereign + Last.app)                                               | Sim      |
| `/auth`                | Redireciona para `/onboarding` (único ponto de entrada auth a partir da landing) | Sim      |
| `/demo`                | DemoTourPage (tour em 4 passos)                                                  | Sim      |
| `/onboarding`          | OnboardingLayout                                                                 | Sim      |
| `/onboarding/:section` | OnboardingLayout                                                                 | Sim      |
| `/billing/success`     | BillingSuccessPage                                                               | Sim      |
| `/public/:slug`        | PublicWebPage (menu/presença)                                                    | Sim      |

**Regra:** A landing **nunca** aponta para `/login`, query strings de OAuth, nem para rotas internas (dashboard, config) sem passar por `/auth` ou `/onboarding`. O Core (CoreFlow / FlowGate) decide o fluxo após `/auth`.

**Boot:** A landing (/, /demo, /auth, /billing/success) é renderizada em modo **MARKETING** — sem RestaurantRuntimeProvider nem ShiftProvider; nenhuma chamada ao Core. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md). A landing tem de funcionar com backend desligado.

---

## 2. Mapeamento botões da Landing → destino

| Botão / link                     | Destino                                               | Ficheiro                          |
| -------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Entrar em operação               | `/auth`                                               | Hero.tsx                          |
| Ver demonstração                 | `/demo`                                               | Hero.tsx, Footer.tsx              |
| Fale no WhatsApp                 | `https://wa.me/{VITE_CONTACT_WHATSAPP}` (externo)     | Hero.tsx, Footer.tsx              |
| Já tenho conta                   | `/auth`                                               | Hero.tsx, Footer.tsx              |
| Começar agora (14 dias grátis)   | `/auth`                                               | Footer.tsx                        |
| Acesso existente (header)        | `/auth`                                               | Hero.tsx                          |
| Abrir Portal                     | `/auth`                                               | Demonstration.tsx                 |
| 15 MINUTOS (HowItWorks passo 01) | `/demo`                                               | HowItWorks.tsx                    |
| Dúvidas? WhatsApp / email        | WHATSAPP_URL, mailto:VITE_CONTACT_EMAIL               | Footer.tsx                        |
| Termos / Privacidade             | `#terms`, `#privacy` (âncora)                         | Footer.tsx                        |
| Ver página pública (Sofia)       | `https://sofiagastrobaribiza.com` (externo)           | Demonstration.tsx                 |
| FAQ contacto                     | `mailto:comercial@chefiapp.com` ou VITE_CONTACT_EMAIL | FAQ.tsx                           |
| Entrar no sistema (com sessão)   | `/admin`                                              | Hero.tsx (header e CTA principal) |

**Regra de vendas:** A landing (`/`) **nunca** redireciona automaticamente. Com sessão válida, o CTA na landing é "Entrar no sistema" (ou "Ir ao sistema") → `/admin`; o acesso ao sistema é **sempre por clique**, nunca por timeout ou redirect automático.

**Regra:** Nenhum novo botão na landing pode apontar para rota não listada aqui sem actualizar este contrato.

---

## 3. Variáveis de ambiente (Landing)

| Variável                | Uso                        | Fallback              |
| ----------------------- | -------------------------- | --------------------- |
| `VITE_CONTACT_WHATSAPP` | Número para link WhatsApp  | 351000000000          |
| `VITE_CONTACT_EMAIL`    | Email no footer e contacto | contacto@chefiapp.com |

---

## 4. O que a Landing NÃO faz

- Não aponta para `/login` nem para URLs com `?oauth=`, `?error=`, etc. (FlowGate trata callbacks).
- Não define múltiplos pontos de “entrar” (ex.: um para login e outro para signup); `/auth` é o único.
- Não expõe rotas protegidas (dashboard, config, tpv, kds, garcom) como links directos na landing; o utilizador entra por `/auth` e o Core redireciona.

---

## 5. Enforcement

- **App.tsx:** Rotas `/`, `/auth`, `/demo`, `/onboarding` e públicas listadas em §1 existem e não são removidas sem alterar este contrato.
- **Landing (Hero, Footer, Demonstration, HowItWorks, FAQ):** Links e botões respeitam o mapeamento §2.
- **CoreFlow / FlowGate:** Continuam a tratar `/auth` e `/` como pontos de decisão; redirecionamento pós-auth não é responsabilidade da landing.

---

## 6. Alterações

Para alterar um destino de botão ou uma rota pública da landing:

1. Actualizar este documento (§1 e §2).
2. Actualizar o código (App.tsx ou componente da landing).
3. Registar em [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) se for decisão de produto ou arquitectura.

**Violação:** Adicionar ou mudar destino de botão/rota sem actualizar o contrato é regressão arquitectural.

---

## 7. Consciência de runtime (opcional)

**Propósito:** A landing pode “sentir” o estado do sistema e adaptar CTA, **sem redireccionar automaticamente**, sem mentir nem bypassar o Core. Isto é contrato de **percepção** (Landing ↔ Runtime), não de rotas. **Landing = página de vendas; nunca auto-redirect.**

| Condição                                                   | Comportamento permitido                                                                                                                                                     | Responsável                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Sessão válida** (utilizador já autenticado)              | CTA principal “Entrar no sistema” (ou “Ir ao sistema”) → `/admin`; badge discreto “Sessão ativa”. **Nunca** redirecionamento automático (setTimeout, useEffect que navega). | Landing consome estado (ex.: hook/contexto de auth); acesso ao sistema **apenas por clique**. |
| **Restaurante ativo** (tenant selado, onboarding completo) | Idem: CTA pode reflectir “Entrar no sistema” → `/admin`. Sem auto-redirect.                                                                                                 | Landing não decide sozinha; usa sinal do Runtime/Core.                                        |
| **Sem sessão / sem restaurante**                           | Comportamento actual: “Entrar em operação” → `/auth`; “Ver demonstração” → `/demo`.                                                                                         | Contrato §1 e §2.                                                                             |

**Regras:**

- A landing **não inventa** estado; consome o que o Runtime/Core expõe (sessão, tenant, onboarding completo).
- A landing (`/`) **nunca** redirecciona sozinha; a entrada no sistema faz-se **apenas por CTA explícito** (ex.: "Entrar no sistema" → `/admin`).
- **Copy sugerida (microcopy, não arquitetura):** abaixo do CTA principal, texto tipo “Configuração guiada. 15 minutos.” para reduzir fricção comercial, sem alterar destinos.

**Estado actual:** Consciência de runtime **implementada**. A landing consome sessão (auth) e adapta CTA; **sem** redirecionamento automático.

| Onde           | Comportamento                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hero.tsx**   | useAuth(); header e CTAs: com sessão → "Entrar no sistema" / "Ir ao sistema" → `/admin`; badge "Sessão ativa"; sem sessão → "Entrar em operação" → `/auth`. **Nenhum** setTimeout nem useEffect que navegue. |
| **Footer.tsx** | useAuth(); CTA principal: com sessão → "Entrar no sistema" → `/admin`; sem sessão → "Começar agora (14 dias grátis)" → `/auth`; link secundário "Já tenho conta" / "Entrar no sistema" conforme sessão.      |

Nenhuma nova obrigação de código além do que já está em Hero e Footer; alterações futuras (ex.: tenant/onboarding completo) devem respeitar as regras acima e actualizar esta tabela.

**Referência:** CORE_STATE (estado do núcleo); CoreFlow/FlowGate (decisão pós-auth). A landing não substitui o Core; **reflecte** estado quando o Core expõe (sessão).
