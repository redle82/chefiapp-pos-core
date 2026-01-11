# 🧠 GovernManage — Inteligência de Reviews e Gestão de Reputação

**Versão**: 1.0  
**Status**: MVP Implementado

---

## 📋 Visão Geral

O GovernManage é um módulo completo de inteligência de reviews que:
1. **Puxa reviews** de múltiplas fontes (Google, TripAdvisor, etc.)
2. **Quebra em temas + sentimento** + causa provável de perda de cliente
3. **Gera ações claras** para dono/gerente/equipe sem expor nome de garçom

**Mensagem central**: "Você já paga pelos seus clientes. Agora vai pagar pra entender por que eles vão embora?"

---

## 🏗️ Arquitetura

### Database Schema

- `govern_review_sources`: Configuração de fontes de reviews
- `govern_reviews`: Reviews raw + sanitizados
- `govern_review_entities_redacted`: Entidades detectadas (nomes de staff)
- `govern_review_topics`: Classificação de tópicos por review
- `govern_review_insights`: Insights agregados por janela de tempo
- `govern_review_actions`: Ações recomendadas

### Service Layer

- `google-reviews-sync.ts`: Sincronização de reviews do Google (stub pronto para API real)
- `nlp-pipeline.ts`: Pipeline NLP (topic classification, sentiment, NER)
- `insights-generator.ts`: Geração de insights agregados
- `actions-generator.ts`: Geração de ações recomendadas
- `worker.ts`: Worker/cron que executa o pipeline completo

### Frontend

- `/app/govern`: Dashboard principal (overview, alertas, ações)

---

## 🚀 Setup e Uso

### 1. Migration SQL

```bash
# Aplicar migration
psql $DATABASE_URL -f supabase/migrations/053_govern_manage.sql
```

### 2. Registrar Fonte de Reviews

```typescript
import { registerReviewSource } from './server/govern/google-reviews-sync';

await registerReviewSource(
  restaurantId,
  'google',
  'ChIJ...', // Google Place ID
  'Restaurante XYZ',
  { api_key: 'YOUR_GOOGLE_API_KEY' }
);
```

### 3. Executar Pipeline Manualmente

```bash
# Para um restaurante específico
npx ts-node server/govern/worker.ts <restaurant_id>

# Para todos os restaurantes
npx ts-node server/govern/worker.ts
```

### 4. Configurar Cron Job

```bash
# Executar diariamente às 5h
0 5 * * * cd /path/to/project && npx ts-node server/govern/worker.ts >> logs/govern.log 2>&1
```

---

## 📊 Pipeline de Processamento

### 1. Sync Reviews
- Busca reviews novos das fontes configuradas
- Salva raw + normaliza

### 2. NLP Pipeline
- **Topic Classification**: Identifica tópicos (price, cleanliness, service, food, ambience, wait_time, value)
- **Sentiment Analysis**: Calcula sentimento por tópico (-1 a +1)
- **NER**: Detecta nomes de staff e mascara

### 3. Insights Generation
- Agrega reviews por janela de tempo (diária, semanal, mensal)
- Calcula métricas (rating médio, distribuição, etc.)
- Identifica churn reasons
- Gera alertas (rating drop, negative spike, etc.)

### 4. Actions Generation
- Gera ações recomendadas baseadas em insights
- Prioriza por impacto (sentiment + volume)
- Linka com AppStaff (futuro)

---

## 🎯 Funcionalidades

### Anti-Doxxing Staff

- **Detecção automática** de nomes próprios em reviews
- **Mascaramento interno**: "Garçom [EQUIPE]" no lugar de nomes
- **Política + aviso** no pós-experiência (QR/página do cliente)
- **Resposta sugerida** para dono/gerente quando aparecer nome

### Análise de Preço

- **% de reviews mencionando preço**
- **Polaridade** do tema preço (positivo/neutro/negativo)
- **Razões do preço** (porção, qualidade, taxa, bebida, serviço)
- **Tendência** (últimos 7/30/90 dias)

### Churn Reasons

- **Top motivos de perda** (ex: "demora + prato frio")
- **Alertas**: pico de reviews negativos, queda de nota, tema recorrente
- **Plano de ação**: 3 recomendações por semana com "por quê" e "como corrigir"

---

## 🔌 API Endpoints

### GET /api/govern/insights
Retorna o insight mais recente para um restaurante.

**Query Params:**
- `restaurant_id` (required)

**Response:**
```json
{
  "id": "...",
  "overall_rating": 4.2,
  "total_reviews": 45,
  "positive_count": 30,
  "negative_count": 5,
  "churn_reasons_json": [...],
  "alerts_json": [...],
  "summary_md": "..."
}
```

### GET /api/govern/actions
Retorna ações recomendadas.

**Query Params:**
- `restaurant_id` (required)
- `status` (optional, default: "pending")

**Response:**
```json
{
  "actions": [
    {
      "id": "...",
      "action_title": "...",
      "priority": "high",
      "topic": "wait_time",
      "reason_text": "..."
    }
  ]
}
```

### POST /api/govern/actions/:id/complete
Marca uma ação como concluída.

### POST /api/govern/run
Executa o pipeline completo para um restaurante.

**Body:**
```json
{
  "restaurant_id": "..."
}
```

**Response:**
```json
{
  "synced": 10,
  "processed": 8,
  "insights": 1,
  "actions": 3
}
```

---

## 🧪 Testes

```bash
# Testes unitários (quando implementados)
npm test server/govern/__tests__/
```

---

## 📝 Próximos Passos

1. **Integração Google Places API real** (substituir stub)
2. **Integração com AppStaff** (criar tarefas automaticamente)
3. **Páginas adicionais**: `/app/govern/topics`, `/app/govern/reviews`
4. **Respostas sugeridas** para Google Reviews
5. **Dashboard de tendências** (gráficos de evolução)

---

## 🎯 ROI e Pitch

### Comparação com Analista Humano

- **Analista humano**: Caro, instável, não lê tudo, não organiza automaticamente
- **GovernManage**: Barato, constante, aprende, evita expor equipe

### Frase de Fechamento

> "Você já paga pelos seus clientes. Agora vai pagar pra entender por que eles vão embora?"

---

**ChefIApp — TPV simples. Sem comissões. Sem gestão.**

