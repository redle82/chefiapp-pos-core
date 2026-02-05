# Rota — QR Mesa (Web de Configuração + Público)

**Paths:** Configuração: `/config` (secção “QR para página pública” / Localização); Público: `/public/:slug/mesa/:number`  
**Tipo:** WEB CONFIG (config) + rota pública (uso pelo cliente)  
**Estado atual:** UI PARCIAL (config em Config; público implementado em TablePage).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** O dono configura o slug e obtém QR por mesa; o cliente escaneia o QR e acede ao menu já associado à mesa (`/public/:slug/mesa/:number`), faz pedido com origem `QR_MESA`. Liga sala (mesa) ao pedido sem intervenção do garçom no momento do pedido.
- **Para quem é:** Dono na web (config); cliente no browser (página pública por mesa).
- **Em que momento do ciclo de vida:** Config usada em SETUP (definir slug), TRIAL e ACTIVE (gerar/ver QRs). Página pública usada sempre que o cliente escaneia (trial ou ativo = pedidos reais).

---

## 2. Rota & Acesso

- **Path config:** Acesso à configuração via `/config` → secção Localização → “QR para página pública” (PublicQRSection). Path exato da secção é o mesmo `/config` com subsecção.
- **Path público:** `/public/:slug/mesa/:number` — rota pública; não exige auth; guard público (Public Void Protocol em CoreFlow).
- **Tipo:** WEB CONFIG para config; rota pública para uso do cliente.
- **Guard aplicado:** Config: CoreFlow ALLOW para hasOrg. Público: ALLOW sem auth (CoreFlow permite `/public/*`).
- **Comportamento por SystemState (config):**
  - **SETUP:** ALLOW; mostrar “Complete a configuração do restaurante (Config → Identidade) para gerar QR codes.”
  - **TRIAL / ACTIVE:** ALLOW; gerar QR do menu geral e QR por mesa (ex.: mesa 1, 2, …).
  - **SUSPENDED:** ALLOW leitura; gerar QR conforme política (ex.: desativar novos pedidos por QR se conta suspensa).

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant (slug, nome), Menu/Items (para a página pública da mesa), Orders (criar pedido com `origin: QR_MESA`, `table_number`).
- **Entidades escritas:** Na página pública: criação de Order com origem QR_MESA e mesa; Core/OrderWriter suporta `table_id` e `table_number` (FASE 9).
- **Eventos gerados:** `ORDER_CREATED` (origin QR_MESA); não usar “demo” para pedidos.

---

## 4. Backend & Dados

- **Tabelas envolvidas:** `restaurants` (slug), `menu_items` ou equivalente, `orders` (com `origin`, `table_number`). RPC: ex. `create_order_atomic` com parâmetros de mesa.
- **Backend local:** Docker Core / Supabase local; página pública deve ler menu e escrever pedido no Core. Estado vazio: “Configure o slug em Config → Identidade para gerar QR.”
- **Estado vazio (config):** “Complete a configuração do restaurante (Config → Identidade) para gerar QR codes da página pública.” (texto alinhado com PublicQRSection.)

---

## 5. UI / UX Esperada

- **Config (Dono):** (1) Sem slug: mensagem acima; CTA “Ir a Config → Identidade”. (2) Com slug: mostrar QR do menu geral e “QR por mesa” (ex. mesa 1); botão “Ver QR mesa N”. Mensagens humanas; sem “demo”.
- **Público (Cliente):** Menu na mesa, carrinho, enviar pedido; confirmação “Pedido enviado para a cozinha.” Estado de erro: “Não foi possível enviar o pedido. Tente novamente.”
- **CTAs (config):** “Ver QR mesa 1”, “Imprimir”, “Configurar slug”.

---

## 6. Integração com Outras Rotas

- **De onde vem (config):** Dashboard → Config → Localização; ou módulo “QR Mesa” no sidebar.
- **Para onde vai:** Config (Identidade para slug), Presença Online (menu público), KDS/TPV (pedidos QR_MESA aparecem no fluxo operacional).
- **Dependências:** Slug obrigatório para gerar QR; cardápio configurado para a página pública mostrar itens. Não bloquear acesso à secção Config — mostrar estado vazio se faltar slug.

---

## 7. Regras de Negócio

- **Permitido:** Gerar QR por mesa; cliente fazer pedido com origem QR_MESA; pedidos reais em trial/active.
- **Bloqueado:** Não bloquear a secção Config por billing; não apresentar pedidos QR como “demonstração”.
- **Regra de ouro:** QR Mesa é canal real de pedidos; trial = pedidos reais do restaurante.

---

## 8. Estado Atual

- **Estado:** UI PARCIAL (config: PublicQRSection em ConfigLocationPage); público: TablePage implementado (`/public/:slug/mesa/:number`). Backend/Core para pedidos QR_MESA conforme OrderWriter.
- **Próximo passo técnico:** (1) Garantir que rotas `/config` e `/public/*` estão cobertas pelo CoreFlow; (2) Verificar que `create_order_atomic` aceita `origin` e `table_number`; (3) Revisar mensagens de estado vazio na PublicQRSection para alinhar com este doc.
