# Deploy Vercel — Área de Marketing (landing Next.js)

Este documento descreve o deploy da **landing de marketing** (app Next.js em `landing/`) como **projeto Vercel separado** do produto. Separação de domínios:

| Destino   | Domínios                    | Projeto Vercel                          |
| --------- | --------------------------- | --------------------------------------- |
| Marketing | chefiapp.com, www.chefiapp.com | Este projeto (Root Directory = `landing`) |
| Produto   | app.chefiapp.com            | Outro projeto (merchant-portal / raiz)  |

**Regra de ouro:** A landing não serve o app; o app não serve a landing.

---

## Configuração do projeto na Vercel

1. **New Project** → repositório `chefiapp-pos-core`.
2. **Root Directory:** `landing` (obrigatório).
3. **Framework:** Next.js (detectado automaticamente).
4. **Build Command:** `next build` (default).
5. **Output:** `.next` (default Next.js).
6. **Variável de ambiente (Production):**
   - `NEXT_PUBLIC_APP_URL` = `https://app.chefiapp.com`  
   Para o CTA da landing (“Começar” / “Get started”) abrir o app operacional. Não colocar aqui chaves do Core nem do merchant-portal.

7. **Deploy:** push para a branch ligada; a Vercel faz deploy automático.

---

## Rotas e i18n

- `/` → inglês (comportamento por pathname).
- `/pt` → português.
- `/es` → espanhol.

Rotas geradas estaticamente com `generateStaticParams` para `en`, `pt`, `es`. O `useTranslation` em `landing/lib/useTranslation.ts` infere o locale pelo primeiro segmento do pathname.

---

## Checklist pós-deploy

- [ ] Homepage carrega em `/` e, se existir, `/en`.
- [ ] `/pt` e `/es` carregam e mostram conteúdo no idioma correto.
- [ ] `<html lang>` correto por página (via layout e componente LangAndAlternates).
- [ ] `alternates.languages` (hreflang) presentes no HTML gerado.
- [ ] CTA “Começar” / equivalente abre `https://app.chefiapp.com/auth/phone`.
- [ ] (Opcional) Lighthouse ≥ 90.

---

## Referência

- **Código:** `landing/` (Next.js App Router).
- **README da landing:** [../landing/README.md](../landing/README.md).
- **Deploy do produto (merchant-portal):** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
