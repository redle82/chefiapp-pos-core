# Deployment — ChefIApp

**Propósito:** Documento canónico único de **deploy** e **provisioning**. Consolida [DEPLOYMENT_GUIDE](../architecture/DEPLOYMENT_GUIDE.md), [deployment.md](../deployment.md) e [provisioning.md](./provisioning.md).  
**Público:** DevOps, engenharia.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)

---

## 1. Visão geral

| Componente | Porta (Dev) | Produção |
|------------|-------------|----------|
| Merchant Portal | 5175 | app.chefiapp.com (ex.: Vercel) |
| Core (Docker) | 3001 | api.chefiapp.com ou equivalente |
| Supabase | — | *.supabase.co |

---

## 2. Pré-requisitos

- Node.js 18+
- Supabase CLI (`npm i -g supabase`)
- Vercel CLI (`npm i -g vercel`) — se deploy frontend em Vercel
- Docker — se Core local

---

## 3. Desenvolvimento local

```bash
# Clone e instalação
git clone <repo>
cd chefiapp-pos-core/merchant-portal
npm install

# Ambiente
cp .env.example .env.local
# Editar .env.local com Supabase (e Core se Docker)

# Servidor de desenvolvimento
npm run dev
# Abrir http://localhost:5175
```

---

## 4. Deploy em produção (frontend — Vercel)

### Opção A: Apenas Merchant Portal

```bash
cd merchant-portal
npm run build
vercel --prod
```

### Opção B: Monorepo (recomendado)

1. Vercel Dashboard → Import repository
2. **Root Directory:** `merchant-portal`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Configurar variáveis de ambiente (ver secção 6)

### Variáveis de ambiente (frontend)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Chave anon Supabase | ✅ |
| `VITE_RUNTIME_MODE` | production / development | ✅ |
| `VITE_API_BASE` | Base da API (proxy fiscal / Core) | Conforme modo |
| `VITE_STRIPE_PUBLIC_KEY` | Chave pública Stripe | Se billing |

---

## 5. Base de dados e migrações

### Supabase

```bash
supabase login
supabase link --project-ref <your-project-id>
supabase db push
# Edge Functions (se aplicável)
supabase functions deploy stripe-payment
supabase functions deploy fiscal-retry-worker
```

### Docker Core

Migrations em `docker-core/schema/migrations/`; aplicar conforme guia do Core (PostgREST).

---

## 6. Provisioning de restaurantes

Provisioning **manual** (Fase 1); automatizado previsto para Fase 2.

### Pré-requisitos

- Supabase CLI instalado e projeto linkado
- Utilizador owner criado no Supabase Auth

### Comando

```bash
./scripts/provision-restaurant.sh "Nome do Restaurante" "owner@email.com"
```

O script:

1. Cria registo em `gm_restaurants` (slug gerado)
2. Associa utilizador como owner em `gm_restaurant_members`
3. Cria dados seed: mesas (1–12), categorias padrão (Entradas, Pratos, Bebidas, Sobremesas)

**Detalhe:** [provisioning.md](./provisioning.md).

---

## 7. Go-Live Checklist

Resumo; checklist completo em [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md). **Checklist obrigatório antes de cada deploy para produção:** [PRE_PROD_CHECKLIST.md](./PRE_PROD_CHECKLIST.md).

- [ ] Infra: Supabase (prod), RLS verificado, backup configurado, DNS
- [ ] Ambiente: `VITE_RUNTIME_MODE=production`, URLs de prod, service role onde aplicável
- [ ] Fiscal: credenciais por restaurante, primeira emissão testada
- [ ] Dados: pelo menos um restaurante, menu, operadores, mesas
- [ ] PWA: HTTPS, manifest e ícones, service worker

---

## 8. Rollback

1. Reverter deploy Vercel para versão anterior
2. Reverter migração (Supabase/Docker) se necessário — ver [rollback-procedure.md](./rollback-procedure.md)
3. Notificar equipa

**Detalhe:** [rollback-checklist.md](./rollback-checklist.md), [rollback-procedure.md](./rollback-procedure.md).

---

## 9. Referências

| Documento | Conteúdo |
|-----------|----------|
| [DEPLOYMENT_GUIDE](../architecture/DEPLOYMENT_GUIDE.md) | Guia detalhado (Vercel, env, migrations, monitoring) |
| [provisioning.md](./provisioning.md) | Provisioning manual de restaurantes |
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Checklist go-live |
| [rollback-procedure.md](./rollback-procedure.md) | Procedimento de rollback |
| [disaster-recovery.md](./disaster-recovery.md) | RTO/RPO e cenários de DR |
| [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) | Backup e restauro |

---

*Documento vivo. Alterações em pipeline de deploy ou provisioning devem ser reflectidas aqui.*
