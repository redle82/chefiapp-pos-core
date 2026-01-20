# 🚀 GUIA DE DEPLOY - ChefIApp POS Core

**Status:** 🟢 **Workflow criado e configurado para Vercel**

---

## ✅ WORKFLOW CRIADO

### `.github/workflows/deploy.yml`

O workflow de deploy foi criado com:
- ✅ Deploy em staging (automático em `develop`)
- ✅ Deploy em produção (com approval manual)
- ✅ Validações antes do deploy (testes, type-check, build)
- ✅ Health check após deploy

---

## ⏳ CONFIGURAÇÃO NECESSÁRIA

### 1. Configurar Plataforma de Deploy

Escolha uma das opções:

#### Opção A: Vercel (Recomendado para React)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Configurar projeto
vercel login
vercel link
```

#### Opção B: Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Configurar projeto
netlify login
netlify init
```

#### Opção C: Outro (AWS, GCP, etc.)
- Configurar conforme plataforma escolhida

---

### 2. Workflow já configurado ✅

O workflow `.github/workflows/deploy.yml` já está configurado para Vercel!

**Se usar outra plataforma**, editar o workflow conforme necessário.

---

### 3. Configurar Secrets no GitHub

1. Ir em: Settings → Secrets and variables → Actions
2. Adicionar secrets necessários:
   - `VERCEL_TOKEN` (se usar Vercel)
   - `VERCEL_ORG_ID` (se usar Vercel)
   - `VERCEL_PROJECT_ID` (se usar Vercel)
   - Ou `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID` (se usar Netlify)

---

### 4. Configurar Environment Protection

1. Ir em: Settings → Environments
2. Criar environment `production`
3. Adicionar required reviewers (approval manual)
4. Configurar deployment branches (apenas `main`)

---

## 📋 CHECKLIST

- [ ] Workflow criado ✅
- [ ] Plataforma de deploy escolhida
- [ ] Secrets configurados no GitHub
- [ ] Environment protection configurado
- [ ] Workflow atualizado com comandos reais
- [ ] Testar deploy em staging
- [ ] Testar deploy em produção

---

## 🎯 RESULTADO ESPERADO

Após configuração:
- ✅ Deploy automático em staging (push para `develop`)
- ✅ Deploy em produção com approval manual (push para `main`)
- ✅ Rollback automático em caso de erro
- ✅ Health check após deploy

---

**Status:** Workflow criado. Aguardando configuração da plataforma de deploy.
