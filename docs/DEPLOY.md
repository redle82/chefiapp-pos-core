# Deploy estável — ChefIApp (Sistema Operacional para Restaurantes)

**Objetivo:** Build (Vite) + backend Core deployados de forma estável para que o "ícone no desktop" (PWA) aponte sempre para a versão correta.

---

## 1. Pré-requisitos

- Node.js 18+
- Variáveis de ambiente configuradas (ver `merchant-portal/.env.example` ou documentação do Core)
- Domínio em HTTPS (recomendado para PWA "Instalar app")

---

## 2. Build do Merchant Portal (frontend)

```bash
cd merchant-portal
npm ci
npm run build
```

Saída: `merchant-portal/dist/` (estático, servível por qualquer servidor HTTP).

**Preview local:**

```bash
npm run preview
```

---

## 3. Deploy do frontend

- **Vercel / Netlify:** conectar o repositório à pasta `merchant-portal`, com build command `npm run build` e publish directory `dist`.
- **Docker:** construir imagem que sirva `dist` com nginx (ex.: `nginx:alpine` + copiar `dist` para `/usr/share/nginx/html`).
- **Servidor próprio:** fazer upload de `dist/` para o diretório web (ex.: `/var/www/chefiapp`) e configurar HTTPS (Let's Encrypt).

Garantir que:

- A aplicação seja servida em **HTTPS**.
- O domínio (ex.: `app.chefiapp.com`) esteja configurado para o PWA "Adicionar ao ecrã".

---

## 4. Backend Core (Docker / PostgREST)

Se o backend for o **Docker Core** (PostgREST + PostgreSQL):

- Subir os containers conforme documentação em `docker-core/` ou `docker-tests/`.
- Expor a API do Core na URL configurada em `VITE_CORE_URL` (ou equivalente) no frontend.
- Aplicar migrations antes de ir para produção.

---

## 5. Variáveis de ambiente (exemplo)

No deploy do **merchant-portal**, definir pelo menos:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (se usar Supabase cloud)
- Ou `VITE_CORE_URL` (se usar apenas Docker Core)
- `VITE_STRIPE_PK` (se usar pagamentos Stripe)

---

## 6. Checklist pós-deploy

- [ ] Acesso a `https://<seu-dominio>/` carrega a Landing.
- [ ] Acesso a `https://<seu-dominio>/dashboard` (após login/onboarding) mostra o Dashboard.
- [ ] PWA: "Adicionar ao ecrã" / "Instalar ChefIApp" funciona no browser.
- [ ] TPV, KDS e App Staff abrem a partir do Dashboard.
- [ ] Redirect pós-checkout Stripe vai para `/billing/success`.

---

## 7. Referências

- [LANCAMENTO_SISTEMA_OPERACIONAL_RESTAURANTES.md](LANCAMENTO_SISTEMA_OPERACIONAL_RESTAURANTES.md) — plano de lançamento e fases
- [docs/ops/GO_LIVE_CHECKLIST.md](ops/GO_LIVE_CHECKLIST.md) — checklist operacional go-live
- [SUPABASE_EM_MODO_DOCKER.md](SUPABASE_EM_MODO_DOCKER.md) — uso do Core em modo Docker
