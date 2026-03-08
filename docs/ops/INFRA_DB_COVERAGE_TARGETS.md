# Infra + DB coverage targets

Cobertura dos caminhos **infra** e **db** do merchant-portal como KPI de risco real (não sensação visual). **Meta:** branches ≥ 60%. **Target inicial (baseline):** 29% — o gate usa 29% por defeito para não bloquear CI; aumentar com `INFRA_DB_COVERAGE_TARGET=60` à medida que mais testes forem adicionados.

**Referência:** [INFRA_DB_COVERAGE_MAP.md](../audit/INFRA_DB_COVERAGE_MAP.md) (irrelevantes vs perigosos).

## Paths incluídos no gate

- `merchant-portal/src/infra/`
- `merchant-portal/src/core/infra/`
- `merchant-portal/src/core/db/`

## Como verificar

1. Gerar cobertura no merchant-portal (Vitest com Istanbul):

   ```bash
   pnpm -w merchant-portal run test:coverage
   ```

   A cobertura é escrita em `merchant-portal/coverage/` (incluindo `coverage-final.json`).

2. Verificar o gate (a partir da raiz do repo):

   ```bash
   npx ts-node scripts/check-infra-db-coverage.ts
   ```

   O script lê `merchant-portal/coverage/coverage-final.json`, filtra entradas pelos paths acima, calcula % branches (e lines) e sai com código 1 se estiver abaixo do target.

3. Em um único comando (raiz):

   ```bash
   npm run test:infra-db-coverage
   ```

   Equivalente a `pnpm -w merchant-portal run test:coverage` seguido de `check-infra-db-coverage`.

## Target

Configurável via variável de ambiente `INFRA_DB_COVERAGE_TARGET` (percentagem, inteiro). Valor por defeito: **29** (baseline); meta de produção **60**.

Exemplo para exigir 70%:

```bash
INFRA_DB_COVERAGE_TARGET=70 pnpm -w merchant-portal run test:coverage && npx ts-node scripts/check-infra-db-coverage.ts
```

Se a cobertura for gerada noutro diretório (ex.: CI):

```bash
COVERAGE_DIR=/path/to/merchant-portal/coverage npx ts-node scripts/check-infra-db-coverage.ts
```

## CI

Gate adicional (não substitui o gate do server):

```bash
pnpm -w merchant-portal run test:coverage
npx ts-node scripts/check-infra-db-coverage.ts
```

Ou, a partir da raiz:

```bash
npm run test:infra-db-coverage
```

O gate do server (84% em `server/`) continua a ser obrigatório; este gate aplica-se apenas aos paths infra + db do merchant-portal.

## Relação com SERVER_COVERAGE_TARGETS

- **Server:** medido por Jest (`server/**`); target 84% branches; script `check-server-coverage.ts`.
- **Infra + DB:** medido por Vitest (merchant-portal) nos paths infra/db; target 60% branches; script `check-infra-db-coverage.ts`.

Os dois gates são independentes e podem correr em paralelo ou em sequência.
