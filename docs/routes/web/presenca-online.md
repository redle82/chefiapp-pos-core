# Presença Online

## 1. Tipo de Rota
- Web de Configuração (config) + rota pública (menu/visibilidade)

## 2. Caminho(s)
- Config: `/config` (Identidade, Localização — slug, QR); Público: `/public/:slug`. Sidebar "Presença Online" pode abrir `/public/:slug` (preview) ou secção em Config; no código actual route é `/public/demo-restaurant` — em produção usar slug do restaurante.

## 3. Objetivo
Visibilidade e SEO: o dono configura identidade e slug; o cliente acede ao menu e à presença do restaurante em `/public/:slug`. Interface pública ativa para pedidos, reservas futuras ou apenas informação. Componentes: Config (Identidade, PublicQRSection), PublicWebPage.

## 4. Quem acessa
- Dono na web (config); qualquer pessoa no browser (página pública). Rota pública não exige auth.

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido em /config; configurar slug e ver preview quando existir |
| TRIAL | Permitido; página pública ativa com dados reais |
| ACTIVE | Permitido; idem |
| SUSPENDED | Conforme política (página pública "indisponível" ou redirect) |

> Nunca bloquear Config por billing. Página pública `/public/*` é ALLOW sem auth.

## 6. Conexão com o Core
- CoreFlow: `/config` em `isWebConfigPath` → ALLOW. `/public/*` → ALLOW (Public Void Protocol).
- Guards aplicáveis: não usar guards operacionais na config; público sem guard de auth.
- Nunca usar guards operacionais na config

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): `restaurants` (slug, nome, etc.), `menu_items` ou equivalente. Página pública lê menu por slug; criação de Order se houver pedido web (origem WEB_PUBLIC).
- Backend futuro: mesmo contrato; slug obrigatório para página pública.
- Pode operar sem backend real? Config SIM (estado vazio se sem slug). Público: "Restaurante não encontrado." se slug inválido ou sem dados.

## 8. Impacto Operacional
- **TPV:** Pedidos WEB_PUBLIC podem aparecer no TPV.
- **KDS:** Idem.
- **AppStaff:** Nenhum directo.
- **Relatórios:** Pedidos por origem web.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: Config (Identidade, PublicQRSection); PublicWebPage (`/public/:slug`). Sidebar "Presença Online" com route `/public/demo-restaurant` — substituir por slug dinâmico em produção.

## 10. Próximos Passos Técnicos
- [ ] Garantir que links "Presença Online" usam slug do restaurante em vez de `demo-restaurant` em produção.
- [ ] Revisar FASE_4_EXTENSOES_FUTURAS para SEO e fidelização.
