# 🔐 Chave do Sentry Implementada

**Data:** 22 de fevereiro de 2026
**Status:** ✅ Configuração Completa

---

## 📦 O que foi criado

### 1. **Arquivo de Configuração de Produção**

📄 `merchant-portal/.env.production`

```env
# Token do Sentry já configurado
VITE_SENTRY_AUTH_TOKEN=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
VITE_SENTRY_ORG=chefiapp
VITE_SENTRY_PROJECT=merchant-portal
```

**⚠️ IMPORTANTE:** Este arquivo NÃO está no git (.gitignore)

### 2. **Scripts Automatizados**

#### 🚀 Setup Rápido

```bash
bash scripts/monitoring/sentry-quick-setup.sh
```

Mostra status da configuração e próximos passos.

#### 🔧 Configuração Completa no Vercel

```bash
bash scripts/monitoring/configure-sentry-env.sh
```

Configura todas as variáveis de ambiente no Vercel automaticamente.

#### 📊 Configurar Alertas

```bash
bash scripts/monitoring/configure-sentry-alerts.sh
```

Cria regras de alerta para monitoramento de produção.

---

## 🎯 Próximos Passos

### Passo 1: Obter o DSN do Sentry

1. Acesse: https://sentry.io/
2. Navegue para: **Settings** → **Projects** → **chefiapp/merchant-portal** → **Client Keys (DSN)**
3. Copie o DSN (formato: `https://[key]@[org].ingest.sentry.io/[project-id]`)

### Passo 2: Atualizar o DSN no .env.production

Edite `merchant-portal/.env.production`:

```env
VITE_SENTRY_DSN=https://[seu-dsn-aqui]@chefiapp.ingest.sentry.io/[project-id]
```

### Passo 3: Configurar Vercel

```bash
cd merchant-portal
bash ../scripts/monitoring/configure-sentry-env.sh
```

Este script irá:

- ✅ Verificar autenticação do Vercel
- ✅ Configurar variáveis de ambiente automaticamente
- ✅ Atualizar backup do .env.production
- ✅ Verificar configuração

### Passo 4: Deploy

```bash
cd merchant-portal
vercel --prod
```

---

## 📊 Monitoramento

Após o deploy, acesse:

- **Dashboard Sentry:** https://sentry.io/organizations/chefiapp/projects/merchant-portal/
- **Issues:** https://sentry.io/organizations/chefiapp/issues/
- **Performance:** https://sentry.io/organizations/chefiapp/performance/

---

## 🔑 Variáveis Configuradas

| Variável                 | Valor             | Status         |
| ------------------------ | ----------------- | -------------- |
| `VITE_SENTRY_AUTH_TOKEN` | `sntryu_8f1...`   | ✅ Configurado |
| `VITE_SENTRY_ORG`        | `chefiapp`        | ✅ Configurado |
| `VITE_SENTRY_PROJECT`    | `merchant-portal` | ✅ Configurado |
| `VITE_SENTRY_DSN`        | _Pendente_        | ⏳ Aguardando  |

---

## 🛡️ Segurança

- ✅ Token armazenado localmente em `.env.production` (gitignored)
- ✅ Scripts criados para automação sem expor credenciais
- ✅ Vercel gerencia variáveis de ambiente de forma segura
- ✅ Sourcemaps enviados automaticamente no build

---

## 🆘 Troubleshooting

### Erro: "Sentry not receiving errors"

```bash
# Verificar variáveis no Vercel
cd merchant-portal
vercel env ls production | grep SENTRY

# Verificar .env.production local
grep SENTRY .env.production
```

### Erro: "Sourcemaps not uploaded"

```bash
# Verificar token de autenticação
echo $VITE_SENTRY_AUTH_TOKEN

# Rebuild com sourcemaps
pnpm run build
```

### Erro: "Invalid DSN"

- Formato correto: `https://[key]@[org].ingest.sentry.io/[project-id]`
- Obter em: https://sentry.io/settings/[org]/projects/[project]/keys/

---

## 📚 Documentação Adicional

- [Setup Completo](../docs/ops/MONITORING_DASHBOARD_SETUP.md)
- [Plano de Rollout](../docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md)
- [Observability Setup](../docs/ops/OBSERVABILITY_SETUP.md)
- [Quick Reference](../docs/ops/ROLLOUT_QUICK_REFERENCE.md)

---

## ✅ Checklist de Produção

- [x] Token do Sentry configurado
- [x] Scripts de automação criados
- [x] Arquivo .env.production criado
- [ ] DSN do Sentry obtido e configurado
- [ ] Variáveis configuradas no Vercel
- [ ] Deploy em produção
- [ ] Verificar erros no dashboard Sentry
- [ ] Configurar alertas de monitoramento

---

**🎉 Configuração da chave do Sentry implementada com sucesso!**

Para continuar, execute:

```bash
bash scripts/monitoring/sentry-quick-setup.sh
```
