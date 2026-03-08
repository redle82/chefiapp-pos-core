# Checklist QA de UX — Admin (pós-reestruturação)

**Uso:** Garantir que, após alterações à navegação e domínios do Admin, nenhuma funcionalidade fica escondida ou duplicada.

---

## Navegação

- [ ] Menu principal mostra: Início, Finanças, Operação, Clientes, Produto, Inteligência, Sistema (com subitens Configuração, Dispositivos, Módulos, Observabilidade).
- [ ] Em `/admin/config/*` a sidebar mostra secções: Identidade, Plano, Operação, Equipa, Infraestrutura, Canais e integrações (sem secção “Módulos” separada).
- [ ] “← Voltar ao menu” aparece em todas as páginas de Config e leva a `/admin/home`.
- [ ] Acesso a Módulos é apenas via Menu principal → Sistema → Módulos (/admin/modules).

## Domínios sem duplicação

- [ ] Delivery: uma única entrada em Config → Canais e integrações → Delivery (/admin/config/delivery). `/admin/config/integrations/delivery` redireciona para `/admin/config/delivery`.
- [ ] Assinatura/Plano: uma única entrada em Config → Plano → Assinatura (/admin/config/subscription).
- [ ] Integrações: uma entrada em Config → Canais e integrações → Integrações (/admin/config/integrations), com subpáginas (payments, whatsapp, webhooks, other).

## Idioma e glossário

- [ ] Todos os itens de menu e secções estão em português (PT).
- [ ] Termos alinhados ao [ADMIN_GLOSSARY.md](ADMIN_GLOSSARY.md): Assinatura, Plano, Configuração, Integrações, Operação, Equipa, Infraestrutura, Módulos, etc.
- [ ] Página de integrações (hub) usa título “Integrações”, não “Integraciones”.

## Modo configuração

- [ ] Ao sair de Config (Voltar ao menu ou Início), a sidebar volta a mostrar o menu principal.
- [ ] Nenhuma página de config exige conclusão de wizard para sair; o utilizador pode navegar livremente.

## Regressão

- [ ] Todas as rotas listadas em [ADMIN_NAVIGATION_MAP.md](ADMIN_NAVIGATION_MAP.md) continuam acessíveis (por menu ou redirect).
- [ ] Permissões por papel (owner, manager) continuam a ser aplicadas nas rotas de config.
