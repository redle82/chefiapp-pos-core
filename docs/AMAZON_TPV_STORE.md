# Loja TPV (Amazon) - Documentação

## Visão Geral

Módulo de monetização via Amazon Associates + Product Advertising API (PA API 5.0) para venda de kits de equipamentos TPV.

## Arquitetura

### 1. Schema de Dados

**Tabelas:**
- `country_market`: Mercados Amazon (US, ES, PT, FR, DE, IT, UK)
- `category`: Categorias de produtos (MiniPC, Monitor, TouchMonitor, etc.)
- `candidate_product`: Produtos cacheados da PA API (expira em 24h)
- `kit_bundle`: Kits pré-configurados (Budget/Standard/Pro)
- `click_event`: Tracking de cliques em links afiliados

**Regras:**
- Preços expiram após 24h (`expires_at`)
- Se preço expirar, não exibir até refresh
- Score calculado: `(rating * reviews_weight) + prime_bonus`

### 2. Backend

**Serviços:**
- `server/amazon/pa-api-client.ts`: Cliente PA API 5.0
- `server/amazon/refresh-catalog.ts`: Worker/cron para refresh diário

**Worker `refreshAmazonCatalog`:**
1. Para cada categoria em cada país:
   - Busca Top 20 produtos via `SearchItems`
   - Calcula score e seleciona Top 5
   - Upsert em `candidate_product`
2. Gera 3 kits (Budget/Standard/Pro) com Top 1 de cada categoria requerida
3. Atualiza `expires_at` para 24h no futuro

**Guard de Preço:**
- Se `expires_at < now()`, `total_price_cents = NULL`
- Frontend mostra "Ver preços na Amazon" se preço expirado

### 3. Frontend

**Página:** `/app/store/tpv-kits`

**Features:**
- Selector de País
- Filtro por Tier (Budget/Standard/Pro)
- Cards de kits com:
  - Lista de itens
  - Preço total (ou "Preço indisponível")
  - Botões "Comprar Kit na Amazon" / "Ver [Item]"
- Tracking automático de cliques via `click_event`

**UDS Compliance:**
- Usa `Card`, `Text`, `Button` do UDS
- Tokens de cores e spacing
- Layout responsivo

### 4. Tracking

**Click Events:**
- Registrado em `click_event` antes de abrir link Amazon
- Campos: `tenant_id`, `user_id`, `country_code`, `asin`, `kit_tier`, `source`

## Configuração

### Variáveis de Ambiente

```bash
AMAZON_PA_API_ACCESS_KEY=your_access_key
AMAZON_PA_API_SECRET_KEY=your_secret_key
AMAZON_ASSOCIATES_TAG=your_associates_tag
```

### Cron Job

Configure para rodar diariamente:

```typescript
// Exemplo: server/cron/amazon-refresh.ts
import { runRefreshCatalogCron } from '../amazon/refresh-catalog';

// Rodar às 02:00 UTC diariamente
export async function amazonRefreshCron() {
    await runRefreshCatalogCron();
}
```

## Testes

**Unitários:**
- `server/amazon/__tests__/score.test.ts`: Testa cálculo de score e parsing de preços

**E2E:**
- `merchant-portal/src/pages/Store/__tests__/TPVKitsPage.e2e.test.tsx`: Testa carregamento, filtros, cliques

## Próximos Passos

1. **Implementar AWS Signature V4** no `pa-api-client.ts` (atualmente skeleton)
2. **Configurar cron** no servidor para refresh diário
3. **Adicionar RLS policies** no Supabase para segurança
4. **Dashboard de analytics** para visualizar `click_event`
5. **A/B testing** de diferentes kits/configurações

## Notas Importantes

- **Não usar scraping**: Tudo via PA API oficial
- **Cache de 24h**: Respeitar limites da PA API
- **Preços expirados**: Não exibir até refresh
- **UDS obrigatório**: Toda UI deve usar componentes do design system

