# Auditoria: experiência de instalação macOS — ChefIApp Desktop

**Objetivo:** Garantir que o instalador `.dmg` tenha a experiência clássica do macOS (ícone, janela app + Applications, arrastar para Aplicativos, branding).

---

## 1. Configuração real do empacotamento macOS

### electron-builder.yml

- **buildResources:** `assets` (ícones e background do DMG).
- **mac.icon:** `assets/icon.png` — electron-builder aceita PNG ≥512×512 e gera `.icns` no build.
- **dmg.title:** `${productName} ${version}`.
- **dmg.icon:** `assets/icon.png`.
- **dmg.window:** `width: 540`, `height: 380` (janela clássica).
- **dmg.contents:**
  - Primeiro: app em `(130, 220)` (centro do ícone).
  - Segundo: link para `/Applications` em `(410, 220)` com `type: link`, `path: /Applications`.

### Scripts de ícones

- **prepare-icons** (package.json): `node scripts/build-icons.mjs`.
- **build-icons.mjs:** Lê `assets/icon.svg`, gera `assets/icon.png` (512×512) e `assets/dmg-background.png` (540×380) com sharp; o background é usado como fundo da janela do DMG.
- **dist:mac:** Executa `prepare-icons` antes de `electron-builder --mac`, garantindo ícone e background actualizados a partir do SVG.

### package.json (desktop-app)

- **dist:mac:** `npm run prepare-icons && npx electron-builder --mac`.
- Sem dependência local de `sharp`; usa o do workspace (raiz) via resolução do Node.

### Assets usados no build

| Asset            | Origem                    | Uso |
|------------------|---------------------------|-----|
| `assets/icon.svg` | Fonte de verdade (logo)   | Entrada do script de ícones. |
| `assets/icon.png` | Gerado por prepare-icons  | `mac.icon`, `dmg.icon`; electron-builder gera `.icns` a partir dele. |
| `assets/icon.icns`| Opcional (já existente)   | Se existir e config apontar para ele, é usado em vez de gerar a partir do PNG. |
| `assets/dmg-background.png` | Gerado por prepare-icons | Fundo da janela do DMG (540×380). |

---

## 2. Confirmação técnica

- **Fonte final do ícone macOS:** `assets/icon.png` (512×512), gerado a partir de `assets/icon.svg` por `prepare-icons`. O electron-builder usa esse PNG para o ícone da app e do DMG e, no build macOS, gera internamente o `.icns` a partir dele.
- **.icns gerado/consumido:** Sim. O electron-builder gera `.icns` a partir de `icon.png` durante o build; não é necessário ter `icon.icns` no repo para o instalador mostrar o logo. Se existir `icon.icns` em `assets/` e a config apontar para `.icns`, esse ficheiro é usado em vez da conversão PNG→icns.
- **DMG com layout visual configurado:** Sim. `dmg.window` (540×380) e `dmg.contents` (app em 130,220 e link Applications em 410,220) definem a janela e as posições. Com `dmg.background` apontando para `assets/dmg-background.png`, a janela usa esse fundo.
- **Janela do DMG com app + Applications:** Sim. O primeiro item de `contents` é o ícone da aplicação; o segundo é o link para `/Applications`. O utilizador arrasta o app para o ícone da pasta Aplicativos.
- **Finder com ícone correto:** O ícone da app no Finder vem do bundle macOS (definido por `mac.icon`). O ícone do volume DMG montado vem de `dmg.icon`. Ambos usam o mesmo asset (`icon.png` → conversão para icns no build).

---

## 3. Causas raiz e diferença face a PWA

### Por que o DMG não mostrava o fluxo clássico (arrastar para Applications)

- **Causa:** Configuração do DMG incompleta ou antiga: sem `dmg.window` e/ou sem `dmg.contents` com as duas posições (app + link para `/Applications`). Sem isso, o electron-builder pode gerar um DMG com janela genérica ou apenas com o app, sem o atalho para Aplicativos.
- **Correção:** Definir explicitamente `dmg.window` (540×380) e `dmg.contents` com ícone da app e link para `/Applications` (e, para aspecto final, `dmg.background`).

### Por que o logo não aparecia no instalador

- **Causa:** (1) `mac.icon`/`dmg.icon` apontavam para `assets/icon.icns` sem o ficheiro existir ou actualizado; ou (2) o build era feito sem correr `prepare-icons`, logo sem `icon.png` actualizado a partir do `icon.svg`; ou (3) o `buildResources`/path dos ícones estava incorrecto e o builder não encontrava o asset.
- **Correção:** Fonte de verdade = `icon.svg`. O script `prepare-icons` gera `icon.png` antes de cada `dist:mac`. A config usa `icon.png`; o electron-builder gera e consome o `.icns` no build macOS. Assim o logo aparece no DMG e na app instalada.

### Electron e comportamento nativo

- **Suporte nativo:** Sim. O electron-builder (empacotador usado pelo Electron) suporta nativamente ícones macOS (PNG→icns), DMG com janela, posições de ícones e link para `/Applications`. Não é necessário tooling extra para essa experiência.
- **Diferença face a PWA:** Uma PWA é uma web app (icone no ecrã principal, pode ter “instalar” no browser); não gera um `.dmg` nem um bundle `.app` macOS. O ChefIApp Desktop é uma app Electron empacotada: gera `.app` e `.dmg` com ícone nativo, janela de instalação e fluxo “arrastar para Aplicativos”, idêntico a outras apps macOS.

---

## 4. Patch mínimo aplicado

- **Ícone:** Manter `icon.svg` como fonte; `prepare-icons` gera `icon.png`; electron-builder usa `icon.png` para app e DMG e gera `.icns` no build.
- **DMG:** Manter `dmg.window` (540×380) e `dmg.contents` (app + link Applications). Adicionar geração de `dmg-background.png` (540×380) em `build-icons.mjs` e `dmg.background: assets/dmg-background.png` em `electron-builder.yml` para a janela do DMG ter fundo definido.
- **Build:** Garantir que `dist:mac` (e o build completo via `build-electron.mjs`) executam sempre `prepare-icons` antes do electron-builder.

---

## 5. UX final do instalador no macOS

1. **Ficheiro:** Utilizador abre `ChefIApp Desktop-0.1.0-arm64.dmg` (ou x64).
2. **Montagem:** O macOS monta o volume e abre uma janela do Finder.
3. **Janela do DMG:**
   - Tamanho 540×380.
   - Fundo: imagem definida (ex.: `dmg-background.png`).
   - À esquerda: ícone da aplicação **ChefIApp Desktop** (logo do `icon.svg`/`icon.png`).
   - À direita: ícone da pasta **Aplicativos** (link para `/Applications`).
4. **Acção:** O utilizador arrasta o ícone da app para o ícone de Aplicativos (fluxo clássico “drag to Applications”).
5. **Ícones:** Tanto o ícone do volume DMG como o ícone da app na janela e, depois de instalar, o ícone da app em Aplicativos e no Dock, usam o logo definido em `icon.svg`/`icon.png` (e o .icns gerado no build).
6. **Sem ambiguidade:** Um único instalador, um único fluxo (arrastar para Aplicativos), branding consistente em DMG e app.

---

## Ficheiros alterados (patch mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| `desktop-app/scripts/build-icons.mjs` | Gerar também `assets/dmg-background.png` (540×380) para fundo da janela do DMG. |
| `desktop-app/electron-builder.yml` | Adicionar `dmg.background: assets/dmg-background.png`. |
| `docs/ops/DMG_MACOS_INSTALADOR_AUDITORIA.md` | Este documento (auditoria e confirmação). |

Nenhuma alteração a rotas, shells ou contratos da aplicação; apenas empacotamento e assets do instalador macOS.
