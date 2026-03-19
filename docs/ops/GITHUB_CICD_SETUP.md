# GitHub CI/CD Setup (Repositório Definitivo)

Este guia consolida os passos para ligar o projeto local ao repositório definitivo no GitHub e ativar os workflows de CI/CD.

## 1) Pré-requisitos

- Repositório GitHub criado na conta/organização definitiva.
- Acesso de escrita ao repositório.
- `origin` local apontando para o novo repo.
- GitHub Actions habilitado em `Settings > Actions > General`.

## 2) Workflows ativos no projeto

Em `.github/workflows`:

- `ci.yml` — validação principal (lint, tests, gates de soberania e conformidade).
- `deploy.yml` — pipeline de deploy por tag (`v*`).
- `contract-gate.yml`, `truth-gate.yml`, `ui-guardrails.yml`, `core-validation.yml`, etc.

## 3) Secrets obrigatórios/recomendados

Configurar em `Settings > Secrets and variables > Actions`:

### CI (`ci.yml`)

- `CORE_BILLING_AUDIT_DATABASE_URL` (opcional no CI, recomendado para auditoria completa de billing).

### Deploy (`deploy.yml`)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`

Observações:

- `GITHUB_TOKEN` é fornecido automaticamente pelo GitHub Actions.
- Sem os secrets de deploy, o workflow `deploy.yml` irá falhar nas fases correspondentes.

## 4) Primeiro push e disparo de CI

Na raiz do projeto:

```bash
git push -u origin main
```

Isso deve disparar `ChefIApp CI` (`ci.yml`) em `main`.

## 5) Validação local antes de subir

Executar:

```bash
npm run audit:release:portal
```

Esse comando valida web-e2e, typecheck, testes do `merchant-portal`, cobertura de `server/` e leis do sistema.

## 6) Primeiro deploy

O workflow `deploy.yml` dispara em push de tags no formato `v*`.

Exemplo:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 7) Troubleshooting rápido

- Erro de autenticação no push: revisar chave SSH/token e permissões da conta.
- CI não dispara: confirmar Actions habilitado e branch alvo (`main`/`develop` no `ci.yml`).
- Falha em `test:ci`: revisar scripts do `package.json` e alinhar com `ci.yml`.
- Falha de deploy na Vercel: validar `VERCEL_*` e associação correta do projeto.
