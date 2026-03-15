# Diagnóstico de renderização — Admin TPV (3 telas)

## Marcadores visíveis no runtime (V2)

Para confirmar que o bundle em execução é o refatorado, cada uma das 3 páginas exibe:

| URL | Badge no topo | Labels em blocos |
|-----|----------------|------------------|
| `/admin/modules` | **MODULES_RUNTIME_V2** | **[CARD_TPV_V2]** junto ao card Software TPV |
| `/admin/devices` | **DEVICES_RUNTIME_V2** | **[BLOCO_TPV_HUB_V2]** na secção TPV; **[PAIRING_TPV_REDIRECT_V2]** no bloco de pareamento quando tipo = TPV |
| `/admin/devices/tpv` | **TPV_RUNTIME_V2** | **[FLUXO_TPV_MÃE_V2]** na linha do fluxo em passos |

**Se estes marcadores não aparecerem:** o browser está a servir um bundle antigo (cache ou servidor de dev a servir build antigo). Parar o dev server, limpar cache do browser para localhost, e voltar a subir `pnpm --filter merchant-portal run dev`.

**Origem da UI antiga:** No código atual não existe nenhum outro componente nem rota que desenhe "Descarregar software" ou o formulário "Gerar código" para TPV em `/admin/devices`. Esses elementos só podem aparecer se o JS em execução for uma versão antiga de `AdminDevicesPage` / `DesktopPairingSection` / `ModulesPage` (ex.: bundle em cache). O segundo botão no card TPV vinha de `modulesDefinitions` (secondaryAction) e de `ModuleCard` (showSecondary); a definição do módulo `tpv` já não tem `secondaryAction` e o `ModuleCard` força um único botão para `module.id === "tpv"`.

---

## Entrypoint e árvore de rotas no runtime

A aplicação web (browser) usa **um único** entrypoint e uma única árvore de rotas:

1. **Entrypoint:** `index.html` → `src/main_debug.tsx` (dev) ou bundle de build.
2. **App:** `src/App.tsx` monta `<Routes>{OperationalRoutesFragment}</Routes>`.
3. **Rotas admin:** Em `src/routes/OperationalRoutes.tsx`, dentro de `<Route path="/admin" element={<ElectronAdminGuard />}>` (linha ~1251), os filhos são rotas relativas:
   - `path="modules"` → **`/admin/modules`** → `<ManagementAdvisor><DashboardLayout>**<ModulesPage />**</DashboardLayout></ManagementAdvisor>`
   - `path="devices"` → **`/admin/devices`** → `<ManagementAdvisor><DashboardLayout>**<AdminDevicesPage />**</DashboardLayout></ManagementAdvisor>`
   - `path="devices/tpv"` → **`/admin/devices/tpv`** → `<ManagementAdvisor><DashboardLayout>**<AdminTPVTerminalsPage />**</DashboardLayout></ManagementAdvisor>`

**Nota:** `src/routes/modules/AdminRoutes.tsx` **não é usado** no runtime da app; só é referenciado em testes. O que realmente desenha as 3 páginas é `OperationalRoutes.tsx` e os componentes acima.

## Componentes que desenham cada tela

| URL | Componente que desenha a UI |
|-----|-----------------------------|
| `/admin/modules` | `ModulesPage` (`src/features/admin/modules/pages/ModulesPage.tsx`) → usa `ModuleCard` e `modulesDefinitions` |
| `/admin/devices` | `AdminDevicesPage` (`src/features/admin/devices/AdminDevicesPage.tsx`) |
| `/admin/devices/tpv` | `AdminTPVTerminalsPage` (`src/features/admin/devices/AdminTPVTerminalsPage.tsx`) |

## Por que a refatoração anterior pode não ter aparecido no runtime

- **Cache do navegador ou do Vite:** o bundle em memória ou em disco pode ser antigo; um hard refresh (Ctrl+Shift+R / Cmd+Shift+R) ou reinício do `pnpm run dev` pode continuar a servir código antigo se o cache não for limpo.
- **Build antigo:** se tiver corrido `pnpm run build` antes das alterações, a pasta `dist/` pode estar a ser servida (por exemplo por outro processo).
- **Código em disco diferente:** confirmar que os ficheiros abaixo estão guardados e que não há revert/merge que tenha trazido versões antigas.

Para garantir que é a versão nova que corre:

1. Parar o dev server (Ctrl+C).
2. Na raiz do repo: `pnpm --filter merchant-portal run dev`.
3. No browser: abrir as 3 URLs em abas novas ou hard refresh em cada uma.
4. Validar os atributos `data-*` do checklist abaixo; se não existirem, a UI antiga ainda está a ser servida.

## Alterações aplicadas (camada que realmente renderiza)

- **`modulesDefinitions.ts`:** módulo `tpv` sem `secondaryAction` (fonte de dados já não tem segundo botão).
- **`ModuleCard.tsx`:** para `module.id === "tpv"` força um único botão e label `modules.actionGoToTpv`; `data-chefiapp-tpv-single-cta="true"` no card do TPV.
- **`ModulesPage.tsx`:** (já estava) enriquecimento sem secundário para TPV e `primaryLabelOverride` "Ir para TPV".
- **`AdminDevicesPage.tsx`:** (já estava) bloco TPV só resumo + "Ir para TPV"; `data-chefiapp-devices-hub="v2"` no wrapper.
- **`AdminTPVTerminalsPage.tsx`:** (já estava) título "TPV — Tela oficial"; `data-chefiapp-tpv-mother="true"` no wrapper.
- **`DesktopPairingSection.tsx`:** (já estava) quando tipo é TPV mostra apenas link "Ir para página TPV" para `/admin/devices/tpv`.

## Checklist visual de validação (3 URLs)

Fazer em **http://localhost:5175** (ou a origem do portal em uso), após reiniciar o dev server e hard refresh.

### 1. `/admin/modules`

- [ ] O card **"Software TPV"** tem **um único botão** com o texto **"Ir para TPV"** (ou equivalente na língua ativa).
- [ ] **Não** aparecem dois botões ("Manage devices" / "Install device" ou "Gerir dispositivos" / "Instalar dispositivo").
- [ ] No DevTools (Elements): existe um `<section data-module-id="tpv" data-chefiapp-tpv-single-cta="true">`.
- [ ] Clicar no botão leva a `/admin/devices/tpv`.

### 2. `/admin/devices`

- [ ] Existe a secção **"TPV"** com texto do tipo “Toda a operação TPV… está numa única tela” e um único link **"Ir para TPV"**.
- [ ] **Não** existe secção **"Descarregar software"** com grelha de cartões (TPV/KDS/Staff “Em breve”).
- [ ] **Não** existe bloco **"Vincular dispositivo de escritório"** com formulário de “Gerar código” quando o tipo está em TPV (ou o bloco presente é só para KDS, com redirecionamento para TPV quando for TPV).
- [ ] No DevTools: existe um elemento com `data-chefiapp-devices-hub="v2"` (por exemplo no wrapper principal da página).

### 3. `/admin/devices/tpv`

- [ ] O título da página é **"TPV — Tela oficial"** (ou equivalente).
- [ ] Existe a linha de fluxo em passos (descarregar → instalar → abrir app → gerar código → ver lista).
- [ ] Existem secções: estado da release/download, “Gerar código”, “Abrir app TPV”, lista “TPVs registados”.
- [ ] No DevTools: existe um elemento com `data-chefiapp-tpv-mother="true"`.

Se **todos** os itens estiverem OK, a refatoração está a ser servida no runtime. Se algum falhar, verificar cache, processo de dev e que não há outro servidor a servir um build antigo.
