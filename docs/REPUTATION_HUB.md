# ⭐ ReputationHub — Gestão Completa de Reputação

**Versão**: 1.0 MVP  
**Status**: Em Implementação  
**Inspiração**: [Local Boss](https://localboss.app/en)

---

## 🎯 Visão Geral

O ReputationHub é um módulo completo de gestão de reputação online, inspirado nas funcionalidades do Local Boss, mas com identidade própria e integrado ao ecossistema ChefIApp.

### Funcionalidades Principais

1. **Gerenciamento de Múltiplas Localizações**
   - Administração centralizada de todas as unidades
   - Monitoramento de rating e reviews por localização
   - Evolução de rating ao longo do tempo

2. **Análises Detalhadas**
   - Classificação real por localização
   - Evolução temporal (gráficos)
   - Cálculo de avaliações necessárias para próxima classificação
   - Monitoramento de avaliações não respondidas

3. **Respostas a Avaliações**
   - Templates personalizados (formal, casual, friendly, professional)
   - Respostas geradas por IA
   - Ajuste de tom
   - Histórico de respostas

4. **Compartilhamento e Solicitação de Avaliações**
   - Códigos QR personalizados
   - Links diretos para página de avaliação do Google
   - Compartilhamento de avaliações positivas nas redes sociais
   - Campanhas de solicitação de avaliações

---

## 🏗️ Arquitetura

### Database Schema

- `reputation_hub_locations`: Múltiplas localizações
- `reputation_hub_response_templates`: Templates de resposta
- `reputation_hub_responses`: Respostas enviadas
- `reputation_hub_qr_codes`: QR codes para solicitar reviews
- `reputation_hub_campaigns`: Campanhas de avaliações
- `reputation_hub_rating_history`: Evolução de rating
- `reputation_hub_unanswered`: Tracking de avaliações não respondidas
- `reputation_hub_social_shares`: Compartilhamento social

### Service Layer

- `multi-location-manager.ts`: Gestão de múltiplas localizações
- `response-generator.ts`: Geração de respostas (templates + IA)
- `qr-generator.ts`: Geração de QR codes e campanhas
- `sync-manager.ts`: Sincronização e tracking

### Frontend

- `/app/reputation-hub`: Dashboard principal

---

## 🔄 Integração com Módulos Existentes

### GovernManage / Local Boss
- ReputationHub usa reviews do GovernManage/Local Boss
- Responde a reviews já analisados
- Tracking de avaliações não respondidas

### TPV
- QR codes podem ser exibidos no TPV
- Campanhas podem ser vinculadas a mesas

### AppStaff
- Alertas de avaliações não respondidas podem gerar tarefas
- Reviews negativos podem acionar AppStaff

---

## 📊 Funcionalidades Detalhadas

### 1. Multi-Location Management

- Adicionar múltiplas localizações
- Sincronizar reviews de cada localização
- Dashboard unificado
- Alertas por localização

### 2. Response Templates

- Criar templates personalizados
- Categorias: positive, negative, neutral, apology, thank_you
- Tons: formal, casual, friendly, professional
- Variáveis: {customer_name}, {issue}, etc.

### 3. AI Response Generation

- Geração automática de respostas
- Baseada em rating e conteúdo
- Ajuste de tom
- Personalização antes de enviar

### 4. QR Codes & Campaigns

- Gerar QR codes personalizados
- Links diretos para Google Review
- Campanhas com metas de rating
- Tracking de uso

### 5. Unanswered Reviews Tracking

- Detecção automática de avaliações não respondidas
- Priorização (urgent, high, medium, low)
- Alertas por dias sem resposta
- Reminders automáticos

---

## 🚀 API Endpoints

### GET /api/reputation-hub/locations
Lista todas as localizações de um restaurante.

### GET /api/reputation-hub/unanswered
Lista avaliações não respondidas com prioridade.

### GET /api/reputation-hub/campaigns
Lista campanhas ativas de solicitação de avaliações.

---

## 💡 Diferenciais vs Local Boss

- **Integração Total**: ReputationHub + GovernManage + TPV + AppStaff + Reservas
- **Sistema Nervoso**: AppStaff reage a reviews negativos
- **Sem Comissões**: Canais próprios
- **Inteligência Avançada**: Análise de sentimento + respostas IA

---

## 🎯 Próximos Passos

1. ✅ Schema SQL criado
2. ✅ Service layer básico
3. ✅ UI Dashboard
4. ⏳ Integração Google Places API real
5. ⏳ Geração de respostas IA real (OpenAI/Claude)
6. ⏳ QR codes funcionais
7. ⏳ Compartilhamento social

---

**Mensagem**: "Reputação sob controle. Múltiplas localizações. Respostas inteligentes. Campanhas que funcionam."

