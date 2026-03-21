# GitHub — repositório, CI e higiene

Guia curto para manter o GitHub alinhado com o monorepo ChefIApp: workflows, secrets, proteção de branches e contribuição.

## Onde vive o CI

- Workflows: `.github/workflows/` (entrada principal: **ChefIApp CI** — `ci.yml`).
- **Não** alterar rotas da app, shell AppStaff ou gates de produto neste doc; isto é apenas automação e política de repo.

## Triggers (resumo)

- `pull_request` e `push` em `main` e `develop`.
- `workflow_dispatch` no CI para análise de flakiness (Playwright) e diagnóstico Jest opcional.

## Secrets (GitHub → Settings → Secrets)

| Secret | Uso |
|--------|-----|
| `CORE_BILLING_AUDIT_DATABASE_URL` | Opcional. Se definido, o job `validate` corre `npm run audit:billing-core`. |

Outros workflows podem documentar secrets próprios nos comentários YAML correspondentes.

## Branch protection (UI do GitHub)

Recomendado em `main` (ajustar ao teu processo):

1. **Require a pull request before merging**
2. **Require status checks to pass** — incluir jobs estáveis do `ChefIApp CI` (ex.: *Validate Code Quality*, *E2E Suite* quando aplicável).
3. **Require branches to be up to date** (opcional, reduz merges que quebram CI).
4. **Do not allow bypassing** para roles que não devem contornar gates.

Isto não é versionado no Git; replica nas org/repo settings.

## O que já está no repo

- **CODEOWNERS** — `.github/CODEOWNERS` (rever handles se mudares de organização).
- **PR template** — `.github/pull_request_template.md` (Truth Codex checklist).
- **Dependabot** — `.github/dependabot.yml` (npm + GitHub Actions, semanal).
- **Issue templates** — `.github/ISSUE_TEMPLATE/` (bug + feature + links úteis).
- **Segurança** — `SECURITY.md` (política de reporte); detalhe em `docs/security.md`.

## Badges no README

O README pode incluir o badge do workflow principal. Se o repositório for um fork ou mudar de `owner/name`, atualiza o URL:

```markdown
[![ChefIApp CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

## Issues e roadmap

- Guia de uso de issues: [`docs/GITHUB_ISSUES.md`](../GITHUB_ISSUES.md)
- Deploy e ambientes: [`docs/SETUP_DEPLOY.md`](../SETUP_DEPLOY.md)

## Forks

Se criares um fork, atualiza os URLs em `.github/ISSUE_TEMPLATE/config.yml` (`contact_links`) para apontar para o teu `OWNER/REPO` (ou remove links que não façam sentido).
