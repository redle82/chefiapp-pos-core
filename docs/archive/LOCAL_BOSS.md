# Local Boss — Módulo de Análise de Reviews

**Versão**: 1.0  
**Status**: Implementado (Demo Mode)

---

## 🎯 Objetivo

O Local Boss é um módulo que:
- Coleta e analisa reviews do Google e outras fontes
- Gera insights e recomendações automáticas
- Protege a privacidade da equipe removendo nomes de funcionários

---

## 📊 Estrutura de Dados

### Tabelas

1. **`local_boss_review_sources`**
   - Configuração de fontes de reviews (Google, Yelp, etc.)
   - Armazena `place_id`, `last_sync_at`, `settings`

2. **`local_boss_reviews`**
   - Reviews com duas versões de texto:
     - `text_raw`: Original (privado, contém nomes)
     - `text_safe`: Sanitizado (público, nomes removidos)
   - Campos: `rating`, `author`, `source`, `published_at`

3. **`local_boss_insights`**
   - Insights gerados por período
   - `score`: 0-100 baseado em análise
   - `themes`: Top temas detectados
   - `recommendations`: Ações sugeridas

4. **`local_boss_learning`**
   - Sinais de aprendizado (detecção de padrões)
   - Ex: `staff_name_detected`, `recurring_complaint`

---

## 🔒 Proteção de Privacidade

### Sanitização de Texto

A função `sanitizeReviewText()` remove nomes de funcionários usando:

1. **Lista de Staff**: Nomes da tabela `restaurant_members`
2. **Padrões de Detecção**:
   - "garçom João", "waiter Maria"
   - "o João me atendeu"
   - Palavras capitalizadas que correspondem a nomes de staff
3. **Substituição**: Nomes são substituídos por `[EQUIPE]`

### Armazenamento

- **`text_raw`**: Armazenado de forma segura (não exibido publicamente)
- **`text_safe`**: Versão sanitizada (usada na UI)

---

## 🚀 API Endpoints

### POST `/api/local-boss/ingest`

Ingere reviews (demo ou real).

**Request:**
```json
{
  "restaurant_id": "uuid",
  "reviews": [
    {
      "source": "google",
      "review_id": "unique-id",
      "rating": 5,
      "author": "Cliente",
      "text": "Texto do review...",
      "published_at": "2025-01-02T10:00:00Z",
      "language": "pt"
    }
  ]
}
```

**Response:**
```json
{
  "ingested": 3,
  "errors": 0
}
```

### POST `/api/local-boss/run`

Gera insights a partir dos reviews.

**Request:**
```json
{
  "restaurant_id": "uuid",
  "period_days": 30
}
```

**Response:**
```json
{
  "score": 75.5,
  "themes": [
    {
      "theme": "tempo",
      "count": 5,
      "sentiment": "negative"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Reduzir tempo de entrega",
      "reason": "5 comentários mencionam tempo negativamente"
    }
  ]
}
```

### GET `/api/local-boss/insights`

Retorna o último insight gerado.

**Query Params:**
- `restaurant_id`: UUID do restaurante

**Response:**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "period_start": "2025-12-03T00:00:00Z",
  "period_end": "2026-01-02T00:00:00Z",
  "score": 75.5,
  "themes": [...],
  "recommendations": [...]
}
```

---

## 🎨 Interface (Merchant Portal)

### Página: `/app/local-boss`

**Funcionalidades:**
- **Score Card**: Exibe score 0-100 com cores (verde/amarelo/vermelho)
- **Top Temas**: Lista temas mais mencionados
- **Ações Sugeridas**: Recomendações priorizadas
- **Lista de Reviews**: Reviews sanitizados (sempre `text_safe`)
- **Botões de Ação**:
  - "Ingerir Reviews Demo"
  - "Rodar Local Boss (Demo)"

**Proteção Visual:**
- Banner informando que nomes são removidos automaticamente
- Apenas `text_safe` é exibido (nunca `text_raw`)

---

## 🧪 Demo Mode

O módulo funciona em **Demo Mode** sem integração real com Google:

1. Use "Ingerir Reviews Demo" para adicionar reviews de exemplo
2. Use "Rodar Local Boss" para gerar insights
3. Todos os dados são armazenados normalmente no banco

**Para produção:**
- Implementar integração com Google Places API
- Adicionar sincronização automática
- Configurar webhooks para novos reviews

---

## 🔧 Configuração

### Variáveis de Ambiente

Nenhuma variável específica necessária (usa `DATABASE_URL` do servidor).

### Permissões RLS

- **SELECT**: Membros do restaurante podem ver reviews/insights
- **INSERT/UPDATE**: Apenas owners/managers podem gerenciar

---

## 📈 Métricas e Aprendizado

### Sinais de Aprendizado

O sistema registra automaticamente:
- `staff_name_detected`: Quando um nome de funcionário é detectado
- `recurring_complaint`: Padrões de reclamações recorrentes
- `positive_pattern`: Padrões positivos para reforçar

### Score Calculation

- Base: Média ponderada de ratings (0-100)
- Penalização: -2 pontos por menção negativa em temas críticos
- Temas analisados: tempo, atendimento, comida, preço, limpeza

---

## 🚧 Próximos Passos (v2)

1. **Integração Real com Google**
   - Google Places API
   - Sincronização automática
   - Webhooks

2. **IA Avançada**
   - NER melhorado (spaCy, etc.)
   - Análise de sentimento mais sofisticada
   - Geração de respostas automáticas

3. **Múltiplas Fontes**
   - Yelp
   - TripAdvisor
   - Facebook Reviews

4. **Alertas e Notificações**
   - Alertas para reviews negativos
   - Sugestões de resposta prontas
   - Dashboard de tendências

---

**ChefIApp — TPV simples. Sem comissões. Sem gestão.**

