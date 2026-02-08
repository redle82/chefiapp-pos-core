# Rota — Presença Online (Web de Configuração + Público)

**Paths:** Configuração: `/config` (identidade, slug, secção “Presença Online” / QR); Público: `/public/:slug`  
**Tipo:** WEB CONFIG (config) + rota pública (menu/visibilidade)  
**Estado atual:** IMPLEMENTADO (config em Config; página pública PublicWebPage; sidebar “Presença Online” aponta para `/public/demo-restaurant` — em produção usar slug real).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** Visibilidade e SEO — o dono configura identidade e slug; o cliente acede ao menu e à presença do restaurante em `/public/:slug`. Interface pública ativa para pedidos, reservas futuras ou apenas informação.
- **Para quem é:** Dono na web (config); qualquer pessoa no browser (página pública).
- **Em que momento do ciclo de vida:** SETUP (definir slug), TRIAL e ACTIVE (página pública ativa com dados reais). SUSPENDED: política pode ocultar ou desativar página pública.

---

## 2. Rota & Acesso

- **Path config:** `/config` — secções Identidade e Localização (slug, QR para página pública). “Presença Online” no sidebar pode abrir `/public/:slug` (preview) ou secção em Config.
- **Path público:** `/public/:slug` — rota pública; não exige auth. CoreFlow: “Public Void Protocol” — ALLOW para `/public/*`.
- **Tipo:** WEB CONFIG para config; rota pública para uso do cliente.
- **Guard aplicado:** Config: CoreFlow ALLOW para hasOrg. Público: ALLOW sem auth.
- **Comportamento por SystemState (config):**
  - **SETUP:** ALLOW; configurar slug e ver preview quando existir.
  - **TRIAL / ACTIVE:** ALLOW; página pública ativa com menu e dados reais.
  - **SUSPENDED:** Conforme política (ex.: página pública em modo “indisponível” ou redirect).

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant (nome, slug, contacto), Menu/Items (para a página pública), eventualmente horários e localização.
- **Entidades escritas:** Na página pública: criação de Order se houver pedido web (origem WEB_PUBLIC ou equivalente). Config: atualização de Restaurant (slug, etc.) em Config.
- **Eventos gerados:** `ORDER_CREATED` (origin WEB_PUBLIC) se pedido pela web; não usar “demo” para pedidos.

---

## 4. Backend & Dados

- **Tabelas envolvidas:** `restaurants` (slug, nome, etc.), `menu_items` ou equivalente. Backend local: Docker Core / Supabase; página pública lê menu por slug. Estado vazio (config): “Configure o slug em Config → Identidade para ativar a página pública.”

---

## 5. UI / UX Esperada

- **Config (Dono):** Identidade e slug; secção “Presença Online” ou “QR para página pública” (PublicQRSection); link “Ver página pública” com slug real. Mensagens humanas; sem “demo”.
- **Público (Cliente):** Menu do restaurante, informação de contacto, eventualmente pedido ou reserva. Estado de erro: “Restaurante não encontrado.” ou “Página indisponível.”
- **CTAs (config):** “Ver página pública”, “Configurar slug”, “Gerar QR”.

---

## 6. Integração com Outras Rotas

- **De onde vem (config):** Dashboard → Config → Identidade/Localização; módulo “Presença Online” no sidebar (route atual no código: `/public/demo-restaurant` — em produção usar slug do restaurante).
- **Para onde vai:** QR Mesa (`/public/:slug/mesa/:number`), Reservas (se reservas na página pública), Billing (contexto subscrição não bloqueia presença).
- **Dependências:** Slug obrigatório para página pública; cardápio configurado para mostrar itens. Não bloquear Config por billing.

---

## 7. Regras de Negócio

- **Permitido:** Configurar slug; publicar página com menu e dados reais; cliente aceder sem auth.
- **Bloqueado:** Não bloquear Config por billing; não apresentar página pública como “demonstração” com dados fictícios (usar slug real e dados do restaurante).
- **Regra de ouro:** Presença online = visibilidade real do restaurante; trial = dados reais; SEO/visibilidade sem conceito “demo”.

---

## 8. Estado Atual

- **Estado:** IMPLEMENTADO — Config (Identidade, PublicQRSection); PublicWebPage (`/public/:slug`); sidebar “Presença Online” com route `/public/demo-restaurant` (substituir por slug dinâmico em produção).
- **Próximo passo técnico:** (1) Garantir que links “Presença Online” usam slug do restaurante em vez de `demo-restaurant` quando em produção; (2) Revisar FASE_4_EXTENSOES_FUTURAS para SEO e fidelização; (3) Alinhar mensagens de estado vazio com este doc.
