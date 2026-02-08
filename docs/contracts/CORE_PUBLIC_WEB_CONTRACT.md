# Contrato Web Pública (GloriaFood Mode) — Core

## Lei do sistema

**A Web Pública é o terminal de venda no navegador. O Core manda (menu, preços, pedidos, estado). A Web Pública mostra e envia comandos permitidos. Sem login, sem dashboard, sem lógica interna.**

Este documento é contrato formal do Core. O terminal **Web Pública** obedece a este contrato e a nenhum outro papel.

---

## 1. Responsabilidades EXCLUSIVAS

| Responsabilidade | Permitido |
| -----------------| --------- |
| Página pública do restaurante | ✅ |
| Menu digital público | ✅ |
| Pedido online (checkout) | ✅ |
| Pagamento online (opcional) | ✅ |
| Página por mesa via QR | ✅ |
| Status do pedido (somente leitura) | ✅ |
| SEO, páginas indexáveis | ✅ |
| Contato (WhatsApp / Email) | ✅ |
| FAQ simples | ✅ |

---

## 2. Rotas (exemplo)

- `/public/:restaurant` — Página/menu do restaurante
- `/public/:restaurant/menu` — Menu digital
- `/public/:restaurant/table/:id` — Mesa via QR
- `/public/:restaurant/order/:id` — Status do pedido (somente leitura)

O Core (ou o merchant-portal que expõe estas rotas) **não** deve expor links para rotas internas (dashboard, KDS, TPV, staff, config) a partir da Web Pública.

---

## 3. O que a Web Pública NÃO faz

| Proibido | Motivo |
| -------- | ------ |
| Login de funcionário | Terminal de cliente, não de staff |
| Acesso a dashboard | Terminal de venda, não de gestão |
| Tarefas / checklist | Não é AppStaff |
| Staff / equipa | Não é AppStaff |
| Métricas internas | Não é backoffice |
| KDS (gestão de cozinha) | KDS é terminal instalado |
| TPV (caixa) | TPV é terminal instalado |
| Configuração de menu/preços | Core/backoffice |

---

## 4. Contrato com o Core

- **Lê:** Menu, produtos, preços, restaurante (slug), estado do pedido (por ID).
- **Envia:** Criação de pedido (itens, mesa, contacto), pagamento (se permitido pelo Core).
- **Não acede:** Event store interno, finanças, staff, sessões de caixa, configuração.

---

## 5. Regras absolutas

- Sem sobreposição com AppStaff, KDS ou TPV.
- Se uma funcionalidade **vende** no browser → Web Pública.
- Se uma funcionalidade **trabalha** (staff) → AppStaff.
- Se uma funcionalidade **executa** cozinha/caixa → KDS/TPV.

---

## 6. Status

**FECHADO** para o terminal Web Pública (GloriaFood Mode). Implementação: `merchant-portal` rotas `/public/:slug`, `PublicWebPage`, `TablePage`, `CustomerOrderStatusView`. Nenhuma rota pública deve linkar para `/dashboard`, `/tpv`, `/kds-minimal`, `/garcom`, `/config`, etc.
