# Amazon PA API 5.0 - Setup Completo

## ✅ Implementação Completa

### 1. Dependências Instaladas

```bash
cd server
npm install @aws-sdk/signature-v4 @aws-crypto/sha256-js @aws-sdk/protocol-http @aws-sdk/types dotenv
```

### 2. Variáveis de Ambiente

Adicione ao `.env` do servidor:

```bash
# Amazon PA API Credentials
AMAZON_PA_API_ACCESS_KEY=your_access_key_here
AMAZON_PA_API_SECRET_KEY=your_secret_key_here
AMAZON_PA_API_PARTNER_TAG=your_associates_tag_here

# Database (já deve existir)
DATABASE_URL=postgresql://...
# ou
SUPABASE_DB_URL=postgresql://...
```

### 3. Schema Atualizado

O schema `050_amazon_tpv_store.sql` foi atualizado com:
- Colunas `host`, `region`, `marketplace` na tabela `country_market`
- Seed data com valores corretos para cada país

### 4. Cliente PA API Funcional

`server/amazon/pa-api-client.ts`:
- ✅ AWS Signature V4 implementado
- ✅ Métodos `searchItems()` e `getItems()` funcionais
- ✅ Tratamento de erros robusto
- ✅ Factory `createPaApiClient(countryCode)`

### 5. Worker de Refresh

`server/amazon/refresh-catalog.ts`:
- ✅ Usa cliente real (não mock)
- ✅ Busca produtos via `searchItems()`
- ✅ Calcula score e seleciona Top 5
- ✅ Gera 3 kits (Budget/Standard/Pro)
- ✅ Validação de env vars
- ✅ Logs claros de erro

### 6. CLI para Teste Manual

```bash
# Refresh todos os países
npm run refresh:amazon

# Refresh país específico
npx ts-node server/amazon/refresh-catalog-cli.ts ES
```

### 7. Cron Diário

Adicione ao crontab (Mac/Linux):

```bash
# Todo dia às 05:10
10 5 * * * cd /path/to/project && npm run refresh:amazon >> logs/amazon-refresh.log 2>&1
```

Ou configure no seu sistema de jobs (Supabase Edge Functions, Vercel Cron, etc.)

## Testes

```bash
# Testes unitários
npm test -- server/amazon/__tests__/score.test.ts
```

## Próximos Passos

1. **Configurar credenciais reais** da Amazon PA API
2. **Rodar migration** do schema atualizado
3. **Testar manualmente** com `npm run refresh:amazon ES`
4. **Configurar cron** para refresh diário
5. **Adicionar RLS policies** (se necessário)

## Troubleshooting

**Erro: "Missing credentials"**
- Verifique se as 3 env vars estão definidas

**Erro: "PA API Error: ..."**
- Verifique se as credenciais estão corretas
- Verifique se o Partner Tag está ativo
- Verifique rate limits da PA API

**Erro: "No categories found"**
- Rode a migration `050_amazon_tpv_store.sql`

**Erro de conexão com DB**
- Verifique `DATABASE_URL` ou `SUPABASE_DB_URL`

