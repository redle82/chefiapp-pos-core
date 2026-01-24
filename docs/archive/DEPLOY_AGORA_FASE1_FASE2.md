# 🚀 DEPLOY AGORA: FASES 1 e 2 (Guia Rápido)

Este guia cobre o deploy crítico de **Segurança (RLS)**, **Integridade (Race Conditions)** e **Fiscal (Event Store)**.

**Tempo Estimado:** 30 minutos
**Data:** 16 Janeiro 2026

---

## 📋 1. Checklist de Pré-Check (5 min)

- [ ] Acesso ao Supabase Dashboard (Projeto: `qonfbtwsxeggxbkhqnxl`)
- [ ] Código consolidade (`DEPLOY_MIGRATIONS_FASE1_FASE2.sql`) em mãos
- [ ] Nenhuma transação financeira ativa no momento do deploy

---

## 🛠️ 2. Execução do Deploy (15 min)

### Passo Único: Executar Script Consolidado

1. Abra o [Supabase SQL Editor](https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new).
2. Cole o conteúdo de `DEPLOY_MIGRATIONS_FASE1_FASE2.sql`.
3. Clique em **RUN**.

> **Nota:** O script é idempotente. Se alguma parte já foi aplicada (ex: RLS), ele não quebrará.

---

## ✅ 3. Validação (5 min)

1. Apague o editor anterior.
2. Cole o conteúdo de `VALIDAR_DEPLOY.sql`.
3. Execute.

**Critérios de Sucesso:**
- [ ] RLS Policies: **✅ OK** (20+)
- [ ] RLS Enabled Tables: **✅ OK** (5)
- [ ] Unique Indexes: **✅ OK** (2+)
- [ ] Fiscal Table: **✅ OK** (Existe)

---

## 🚀 4. Deploy Frontend (20 min)

Se houver alterações no Frontend (Merchant Portal):

```bash
# Terminal local
npm run build
# Deploy via sua plataforma (Vercel/Netlify)
# ex: vercel --prod
```

---

## 🆘 Troubleshooting

- **Erro `permission denied for schema auth`**: O script consolidado usa `public.user_restaurant_ids` para evitar isso. Se ocorrer, verifique se está rodando o script correto.
- **Erro `relation already exists`**: Ignore se o script continuar (if not exists).
- **Dados inconsistentes?**: Pare e conserte manualmente via Dashboard.

---

**FIM DO PROCESSO**
