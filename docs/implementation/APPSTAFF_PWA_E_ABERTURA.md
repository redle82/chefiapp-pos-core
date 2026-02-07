# AppStaff — PWA e abertura como aplicativo

O AppStaff só atinge a sensação de "app" quando é aberto **sem o contexto do browser** (sem barra de URL, abas ou botão de atualizar). Este documento descreve como instalar e abrir em modo aplicativo.

---

## Modo correto: sem barra de URL

- **Modo correto** = o utilizador não vê barra de endereço, abas nem controlos do browser.
- Isso acontece quando a aplicação é aberta como **PWA instalado** ou em **Chrome App Mode**.

---

## 1. Instalar como PWA (recomendado)

1. Abrir o merchant-portal no Chrome (ex.: `http://localhost:5175/app/staff/home` ou o URL de produção).
2. Na barra de endereço ou no menu do Chrome, usar **"Instalar aplicativo"** / **"Adicionar ao ecrã"** / **"Install"**.
3. Confirmar a instalação.
4. Abrir a aplicação **pelo ícone** no ecrã inicial ou na lista de aplicações.

Resultado: a aplicação abre em `display: standalone` (definido em `manifest.json` e no VitePWA). Não há barra de URL nem abas.

---

## 2. Chrome App Mode (desenvolvimento/teste)

Para simular o modo app sem instalar o PWA:

```bash
chrome --app=http://localhost:5175/app/staff/home
```

(Substituir a porta ou o host conforme o ambiente.)

O Chrome abre uma janela sem barra de endereço nem abas, apenas o conteúdo da URL.

---

## 3. Configuração técnica

- **manifest.json** (`merchant-portal/public/manifest.json`): `display: "standalone"`, `start_url: "/app/staff/home"`, `background_color` e `theme_color` alinhados ao fundo do app.
- **VitePWA** (`merchant-portal/vite.config.ts`): manifest alinhado (theme_color, background_color, start_url, ícones).
- O Shell (StaffAppShellLayout) deteta `display-mode: standalone` e, quando **não** está em standalone, pode mostrar um aviso para "Adicionar ao ecrã".

---

## Referências

- Contrato de superfície: `docs/architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md`
- Checklist "app ou não app": `docs/implementation/APPSTAFF_CHECKLIST_APP_OU_NAO.md`
