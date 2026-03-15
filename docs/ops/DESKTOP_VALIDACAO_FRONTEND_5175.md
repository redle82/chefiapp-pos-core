# Validação: desktop a carregar frontend actualizado (porta 5175)

Checklist mínimo para provar que o desktop em dev está a usar o frontend com ElectronAdminGuard e instrumentação, e não um servidor antigo na 5175.

---

## Pré-requisito: porta 5175 livre

- [ ] Executar `pnpm -w run kill:5175` (ou `lsof -ti:5175 | xargs kill -9`).
- [ ] Confirmar que `pnpm --filter merchant-portal run dev` **inicia sem** "Port 5175 is already in use".

---

## Passos de validação

### 1. Subir o frontend actualizado

```bash
pnpm --filter merchant-portal run dev
```

- [ ] O Vite arranca e mostra "ready" / local em `http://localhost:5175`.
- [ ] A 5175 pertence **apenas** a este processo (não há outro Vite antigo).

### 2. Abrir ou recarregar o desktop

- [ ] Abrir o app desktop (Electron) ou recarregar a janela (Cmd+R / Ctrl+R) para forçar novo carregamento do frontend.
- [ ] No **terminal onde o Electron corre**, verificar o log `[boot] frontend loaded` com `url: http://localhost:5175/...` e `useDevServer: true`.

### 3. Provar no renderer que o bundle é o actual

- [ ] Na janela do desktop, abrir **DevTools** (consola do renderer).
- [ ] Executar na consola: `__CHEFIAPP_FRONTEND_BUILD`
- [ ] **Resultado esperado:** objeto com `guardInstrumented: true`, `guardVersion: 2`, `loadedAt: "<ISO>"`.
- [ ] Se for `undefined` → o desktop continua a carregar frontend antigo; repetir kill 5175, reiniciar merchant-portal e recarregar o desktop.

### 4. Testar acesso a “Página web do restaurante”

- [ ] No desktop, navegar para a rota que mostra “Página web do restaurante” (ex.: via sidebar Admin / Ajustes do Núcleo, ou URL/hash `#/admin/config/website`).
- [ ] **Resultado esperado com frontend actualizado:** aparece o ecrã do **ElectronAdminGuard** (“As configurações de administração não estão disponíveis…”, botão “Fechar janela”) e **não** a página “Página web do restaurante”.
- [ ] Na consola do renderer deve aparecer `[CHEFIAPP_DEBUG] ElectronAdminGuard montado` com `blockAdmin: true`.

---

## Resumo para reporte

Após executar o checklist, indicar:

1. **5175 antiga foi substituída?** (sim/não — dev server reiniciou sem erro de porta)
2. **Desktop a carregar frontend actualizado?** (sim se `__CHEFIAPP_FRONTEND_BUILD` existe com `guardInstrumented: true`, `guardVersion: 2`)
3. **Valor observado de `__CHEFIAPP_FRONTEND_BUILD`:** (colar o objeto ou `undefined`)
4. **Resultado ao abrir “Página web do restaurante”:** (ecrã do guard bloqueado **ou** página Admin ainda visível)

Ref.: [DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md](./DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md) §1.3.
