# QUALITY

## Baseline Atual

- Branches mínimo: `50%`
- Escopo: `merchant-portal`
- Enforcement: obrigatório em CI

## Comando Canónico

```bash
pnpm --filter merchant-portal exec vitest run --coverage
pnpm --filter merchant-portal run check:coverage:branches
```

Se o resultado de branches for `< 50%`, o CI falha automaticamente.

## Política de Subida

Subidas de baseline:

- Devem ser feitas por lotes temáticos
- Devem focar áreas de risco real, sem dispersão
- Devem ser acompanhadas por plano documentado

Regra:

> Nunca subir o baseline antes de consolidar estabilidade por pelo menos 1 sprint.

## Princípio

Coverage é ferramenta de confiabilidade, não métrica decorativa.
