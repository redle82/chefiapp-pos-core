# LOGO IDENTITY CONTRACT

> **Regra canónica:** Só existe UM logo ChefIApp. É o chapéu de chef geométrico dourado.

---

## Ficheiros de Logo — Fonte de Verdade

| Ficheiro                  | Localização               | Uso                                                                                         |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `Logo chefiapp os.png`    | `merchant-portal/public/` | **Master** — 1024×1024, fundo escuro, sem alpha. PWA icons, Open Graph, favicons.           |
| `logo-chefiapp-clean.png` | `merchant-portal/public/` | **UI** — 1024×1024, fundo transparente (alpha). Componentes React, telas de login, landing. |

### Como gerar `logo-chefiapp-clean.png`

```bash
node scripts/fix-logo-bg.cjs
```

O script lê `Logo chefiapp os.png`, remove o fundo escuro (mantém apenas os pixels dourados) e grava `logo-chefiapp-clean.png`.

---

## Onde cada variante é usada

### `logo-chefiapp-clean.png` (transparente) — UI components

- `OSSignature.tsx` — wordmark ChefIApp™ OS (header, footer)
- `AppStaffLanding.tsx` — tela de login do staff
- `AuthPage.tsx` — tela de autenticação
- `PhoneLoginPage.tsx` — login por telefone
- `VerifyCodePage.tsx` — verificação de código SMS
- `Hero.tsx` — hero section da landing page
- `Testimonial.tsx` — secção de testemunhos
- `ProductFirstLandingPage.tsx` — landing page de produto

### `Logo chefiapp os.png` (com fundo) — PWA & metadata

- `manifest.json` — PWA icon 192×192 + 512×512
- `manifest.webmanifest` — PWA icon 192×192 + 512×512
- `vite.config.ts` — VitePWA plugin icons

---

## Regras Anti-Regressão

1. **NUNCA usar `Logo Chefiapp.png` ou `Logo Chefiapp Transparent.png`** — são versões antigas com fundo cinza/xadrez.
2. **NUNCA criar um logo novo** (SVG, emoji, etc.) — usar SEMPRE o `Logo chefiapp os.png` como master.
3. **Em UI React:** usar `/logo-chefiapp-clean.png` (transparente).
4. **Em PWA/metadata:** usar `/Logo chefiapp os.png` (com fundo escuro, melhor para ícones).
5. **Se o logo master mudar:** atualizar `Logo chefiapp os.png` e re-executar `node scripts/fix-logo-bg.cjs`.
6. **Procurar regressões:** `grep -r "Logo Chefiapp.png" merchant-portal/src/` deve retornar ZERO resultados.

---

## Design do Logo

- **Forma:** Chapéu de chef geométrico/wireframe com nós de circuito
- **Cor:** Dourado (#C9A227 / amber) sobre fundo escuro ou transparente
- **Estilo:** Linhas douradas minimalistas, sem preenchimento sólido
- **Formato:** PNG 1024×1024

---

**Última atualização:** 2026-02-18
**Responsável:** Goldmonkey
