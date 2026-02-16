# Contrato — Separação total: App operacional vs Web de configuração

**Status:** OBRIGATÓRIO  
**Tipo:** Regra de navegação e identidade. O AppStaff (app operacional) e a Web de configuração (/admin/config) são contextos separados.  
**Subordinado a:** [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md), [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](APPSTAFF_APPROOT_SURFACE_CONTRACT.md).

---

## 1. Declaração

**Separação completa total:** Do aplicativo operacional (AppStaff, PWA, telemóvel) **não se acede** à web de configuração. A configuração é feita **apenas no computador**, no browser, na rota **/admin/config** (e subrotas).

- **App operacional:** `/app/staff/*` — launcher, modos (Operação, TPV, KDS, Turno, Equipa, Tarefas, Perfil). Sensação de app; foco em uso diário.
- **Web de configuração:** **/admin/config** (e `/admin/config/*`) — definição de restaurante, pessoas, horários, pagamentos, relatórios, catálogo. Uso em desktop. *(A rota legada /config foi eliminada; /config e /config/* redirecionam para /admin/config.)*

---

## 2. Regras obrigatórias

| Regra | Descrição |
|-------|-----------|
| **Sem links do app para config/admin** | Dentro do AppStaff não existem links nem navegação que levem a /admin/config ou /admin. |
| **Setup a partir do app** | Qualquer ação “configurar X” iniciada a partir do app (ex.: /app/setup/equipe, Centro de Ativação) **não** redireciona para /admin/config. Em vez disso, mostra a página **Configuração só no computador** (/app/staff/config-desktop-only) com instrução para abrir no PC. |
| **Configuração só no computador** | A página /app/staff/config-desktop-only é a única resposta no app a “ir para configuração”. Explica que a configuração está disponível apenas no browser no computador e indica o URL **/admin/config** (ou “o mesmo link no PC”). |
| **Sem iframes/config no shell** | O StaffAppShellLayout nunca embute nem renderiza rotas /admin/config ou /admin. |

---

## 3. Proibido

- Links no AppStaff (launcher, perfil, “Mais”, dashboards) para /admin/config ou /admin.
- Redirects de rotas /app/setup/* para /admin/config ou /admin/*.
- Abrir /admin/config ou /admin no mesmo tab/contexto do app sem sair explicitamente do app (o utilizador pode digitar o URL no browser e sair do app; isso é aceitável).

---

## 4. Rotas afetadas

- `/app/setup/equipe` → **não** redirecionar para /admin/config; redirecionar para /app/staff/config-desktop-only.
- `/app/setup/horarios` → **não** para /admin/config; para /app/staff/config-desktop-only.
- `/app/setup/pagamentos` → **não** para /admin/config; para /app/staff/config-desktop-only.
- `/app/setup/preferencias` → **não** para /admin/config; para /app/staff/config-desktop-only.
- Centro de Ativação: itens que hoje apontam para configuração (ex.: “Configurar impressora”) → apontar para /app/staff/config-desktop-only.

Rotas /app/setup/* que levam a **ferramentas operacionais** (menu-builder, operacao, op/tpv, op/kds, inventory-stock) **mantêm-se** como estão; não são “configuração” no sentido deste contrato.

---

## 5. Violação

Introduzir no AppStaff links ou redirects para /admin/config ou /admin, ou embutir a web de configuração no shell do app, é **violação de contrato**. Reverter ou ajustar para cumprir este documento. **Reativar a rota legada /config** (páginas em pages/Config/) é também violação; a web de configuração canónica é apenas /admin/config.

---

## 6. Referências

- Lei Final: [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md)
- AppRoot: [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](APPSTAFF_APPROOT_SURFACE_CONTRACT.md)
- Implementação: docs/implementation/APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md
