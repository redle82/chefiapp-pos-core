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

**Landing canónica:** [LANDING_CANON.md](../strategy/LANDING_CANON.md) — uma única landing = **LandingV2** em `/landing-v2` e `/v2`. Código: `merchant-portal/src/pages/LandingV2/`.

| Rota                     | Componente / Comportamento                                                       | Imutável |
| ------------------------ | -------------------------------------------------------------------------------- | -------- |
| `/`                      | Redireciona para `/auth/phone` (App.tsx)                                         | Sim      |
| `/landing`               | Redireciona para `/auth/phone` (App.tsx)                                         | Sim      |
| `/landing-v2`, `/v2`     | **LandingV2Page** (landing canónica de marketing)                                | Sim      |
| `/blog`, `/blog/tpv-restaurantes` | **BlogTPVRestaurantesPage** (artigo TPV/restaurantes, SEO; link na navbar e footer) | Sim  |
| `/changelog`             | **ChangelogPage** (o que mudou; só itens em produção; link no footer)             | Sim  |
| `/security`             | **SecurityPage** (segurança e dados; afirmações verificáveis; link no footer Legal) | Sim  |
| `/status`               | **StatusPage** (estado do sistema; página estática; link no footer Suporte)       | Sim  |
| `/auth`, `/auth/phone`   | Entrada de autenticação; ponto de entrada a partir da landing                     | Sim      |
| `/onboarding`            | OnboardingLayout                                                                 | Sim      |
| `/onboarding/:section`   | OnboardingLayout                                                                 | Sim      |
| `/billing/success`       | BillingSuccessPage                                                               | Sim      |
| `/pricing`, `/features`  | PricingPage, FeaturesPage (páginas públicas)                                    | Sim      |
| `/legal/terms`, `/legal/privacy` | LegalTermsPage, LegalPrivacyPage                                          | Sim      |
| `/public/:slug`          | PublicWebPage (menu/presença do restaurante)                                     | Sim      |

**Regra:** A landing **nunca** aponta para `/login`, query strings de OAuth, nem para rotas internas (dashboard, config) sem passar por `/auth` ou `/onboarding`. O Core (CoreFlow / FlowGate) decide o fluxo após `/auth`.

**Boot:** As rotas de marketing (/landing-v2, /v2, /blog, /pricing, /features, /legal/*) são renderizadas em modo **MARKETING** — sem RestaurantRuntimeProvider nem ShiftProvider; nenhuma chamada ao Core. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md). A landing tem de funcionar com backend desligado.

---

## 2. Mapeamento botões da Landing → destino

**Landing canónica = LandingV2** (HeroV2, FooterV2 e secções em `LandingV2/sections/`). Copy e i18n em `LandingV2/i18n/landingV2Copy.ts`.

| Botão / link                     | Destino                                               | Ficheiro                          |
| -------------------------------- | ----------------------------------------------------- | --------------------------------- |
| O Sistema / Para quem / Preço / FAQ | `#plataforma`, `#para-quem`, `#preco`, `#faq` (âncoras) | HeroV2.tsx (navbar)        |
| Blog                             | `/blog/tpv-restaurantes`                              | HeroV2.tsx (navbar), FooterV2.tsx  |
| Changelog                        | `/changelog`                                          | FooterV2.tsx (Empresa)             |
| Entrar / Testar grátis           | `/auth/phone`                                         | HeroV2.tsx                        |
| Ir ao sistema (com sessão)       | `/admin`                                              | HeroV2.tsx (header e CTA)         |
| Começar 14 dias grátis           | `/auth/phone`                                         | FooterV2.tsx, CTABanner, etc.     |
| WhatsApp                         | `https://wa.me/{VITE_CONTACT_WHATSAPP}` (externo)     | FooterV2.tsx                       |
| Termos / Privacidade / Segurança  | `/legal/terms`, `/legal/privacy`, `/security`         | FooterV2.tsx                       |
| Estado do sistema (Suporte)      | `/status`                                             | FooterV2.tsx                       |
| Seletor de idioma (PT/EN/ES)      | Âncora na mesma página; locale por `?lang=pt|en|es`    | HeroV2.tsx                         |

**Regra de vendas:** A landing (**/landing-v2**, **/v2**) **nunca** redireciona automaticamente. Com sessão válida, o CTA é "Ir ao sistema" → `/admin`; o acesso ao sistema é **sempre por clique**, nunca por timeout ou redirect automático.

**Regra:** Nenhum novo botão na landing pode apontar para rota não listada em §1 ou aqui sem actualizar este contrato.

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

- **App.tsx:** Rotas listadas em §1 existem e não são removidas sem alterar este contrato. Landing canónica = `/landing-v2` e `/v2` (LandingV2Page).
- **LandingV2 (HeroV2, FooterV2, secções):** Links e botões respeitam o mapeamento §2. Blog em `/blog` e `/blog/tpv-restaurantes` (BlogTPVRestaurantesPage).
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
| **HeroV2.tsx**   | useAuth(); header e CTAs: com sessão → "Ir ao sistema" → `/admin`; sem sessão → "Entrar" / "Testar grátis" → `/auth/phone`. Nav: âncoras (#plataforma, #para-quem, #preco, #faq) e Blog → `/blog/tpv-restaurantes`. **Nenhum** setTimeout nem useEffect que navegue. |
| **FooterV2.tsx** | useAuth(); CTA principal: "Começar 14 dias grátis" → `/auth/phone`; link Blog → `/blog/tpv-restaurantes`; WhatsApp externo; Termos/Privacidade → `/legal/*`. Conforme sessão, CTAs podem reflectir "Ir ao sistema" → `/admin`. |

Nenhuma nova obrigação de código além do que já está em HeroV2 e FooterV2; alterações futuras (ex.: tenant/onboarding completo) devem respeitar as regras acima e actualizar esta tabela.

**Referência:** CORE_STATE (estado do núcleo); CoreFlow/FlowGate (decisão pós-auth). A landing não substitui o Core; **reflecte** estado quando o Core expõe (sessão).
