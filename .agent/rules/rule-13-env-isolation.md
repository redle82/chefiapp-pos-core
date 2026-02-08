# LEI 13: Isolamento de Ambientes

## MOTIVO

Garantir que dados de producao nunca vazem para dev e que bugs de dev
nunca afetem producao.

## GATILHO

Ativado quando configurar variaveis de ambiente, conexoes de banco ou
deploy pipelines.

## REGRAS OBRIGATORIAS

1. **Banco separado por ambiente:** dev, staging e producao NUNCA
   compartilham o mesmo banco
2. **Prefixo de variaveis:** DEV*, STAGING*, PROD\_ para diferenciar
3. **Feature flags:** Codigo inacabado NUNCA vai direto para producao;
   use flags para controlar ativacao
4. **Sem URLs hardcoded:** Toda URL de servico externo vem de variavel
   de ambiente
5. **Seed protegido:** Scripts de seed so rodam se ENV != "production"

## EXEMPLO ERRADO

```python
# Hardcoded URL de producao no codigo de dev
DATABASE_URL = "postgresql://prod-user:prod-pass@prod-host:5432/prod-db"

# Seed sem protecao
async def seed_database():
    await db.execute("INSERT INTO products ...")
```

## EXEMPLO CORRETO

```python
# .env.development
DATABASE_URL=postgresql://dev:dev@localhost:5432/chefi_dev

# .env.staging
DATABASE_URL=postgresql://staging:staging@staging-rds:5432/chefi_staging

# .env.production
DATABASE_URL=postgresql://prod:${DB_PASS}@prod-rds:5432/chefi_prod

# config.py
import os

DATABASE_URL = os.environ["DATABASE_URL"]
ENV = os.environ.get("ENV", "development")

# seed.py
async def seed_database():
    if ENV == "production":
        raise RuntimeError("SEED BLOQUEADO EM PRODUCAO")
    await db.execute("INSERT INTO products ...")
```
