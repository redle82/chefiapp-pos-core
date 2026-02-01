# 🚀 ROADMAP — EVOLUÇÃO DO CONFIG TREE
## De Configuração para Instalação de Sistema Vivo

**Objetivo:** Transformar o Config Tree em um installer de sistema completo, com IA mentora e evolução guiada.

---

## 📋 FASE 1: VISIBILIDADE DE MÓDULOS (2-3 semanas)

### 1.1 Seção "Módulos Instalados"

**Arquivo:** `merchant-portal/src/pages/Config/ConfigModulesPage.tsx`

**Funcionalidades:**
- Lista de módulos ativos
- Status de cada módulo (ativo, inativo, erro)
- Dependências visíveis
- Ações rápidas (ativar/desativar)

**Dados necessários:**
- Registry de módulos no Core
- Status de instalação
- Dependências entre módulos

**Critério de Pronto:**
- ✅ Lista todos os módulos instalados
- ✅ Mostra status visual
- ✅ Permite ativar/desativar
- ✅ Mostra dependências

---

### 1.2 Registry de Módulos no Core

**Arquivo:** `docker-core/schema/migrations/20260127_modules_registry.sql`

**Estrutura:**
```sql
CREATE TABLE installed_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant(id),
  module_id VARCHAR NOT NULL,
  module_name VARCHAR NOT NULL,
  version VARCHAR,
  installed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active',
  config JSONB,
  dependencies TEXT[],
  UNIQUE(restaurant_id, module_id)
);
```

**RPCs:**
- `install_module(restaurant_id, module_id)`
- `uninstall_module(restaurant_id, module_id)`
- `get_installed_modules(restaurant_id)`
- `check_module_dependencies(restaurant_id, module_id)`

---

## 📋 FASE 2: SUGESTÕES DE MÓDULOS (3-4 semanas)

### 2.1 Seção "Sugestões de Módulos"

**Arquivo:** `merchant-portal/src/pages/Config/ConfigSuggestionsPage.tsx`

**Funcionalidades:**
- IA analisa uso atual
- Sugere módulos relevantes
- Mostra benefícios potenciais
- Comparação "antes/depois"

**Lógica de Sugestão:**
- Volume de pedidos → sugere relatórios avançados
- Múltiplos funcionários → sugere escalas
- Estoque complexo → sugere alertas automáticos
- Múltiplas mesas → sugere reservas

**Critério de Pronto:**
- ✅ Analisa dados do restaurante
- ✅ Gera sugestões relevantes
- ✅ Mostra benefícios claros
- ✅ Permite instalação com 1 clique

---

### 2.2 Engine de Análise

**Arquivo:** `merchant-portal/src/core/intelligence/ModuleSuggestionEngine.ts`

**Algoritmo:**
1. Coleta métricas do restaurante
2. Compara com padrões conhecidos
3. Identifica gaps de funcionalidade
4. Gera sugestões priorizadas
5. Calcula benefícios estimados

**Métricas analisadas:**
- Volume de pedidos
- Número de funcionários
- Complexidade de estoque
- Número de mesas
- Frequência de uso de features

---

## 📋 FASE 3: SAÚDE DO SISTEMA (2-3 semanas)

### 3.1 Seção "Saúde do Sistema"

**Arquivo:** `merchant-portal/src/pages/Config/ConfigHealthPage.tsx`

**Funcionalidades:**
- Status geral do sistema
- Alertas de configuração
- Métricas de uso
- Recomendações de otimização

**Indicadores:**
- ✅ Configuração completa
- ⚠️ Configuração incompleta
- ❌ Erros de configuração
- 📊 Métricas de uso
- 🔔 Alertas importantes

**Critério de Pronto:**
- ✅ Dashboard de saúde visual
- ✅ Alertas em tempo real
- ✅ Métricas de uso
- ✅ Recomendações acionáveis

---

### 3.2 Health Check Engine

**Arquivo:** `merchant-portal/src/core/health/SystemHealthEngine.ts`

**Verificações:**
- Configuração mínima completa
- Módulos instalados funcionando
- Dependências satisfeitas
- Performance aceitável
- Dados consistentes

**Alertas:**
- Configuração incompleta
- Módulos com erro
- Dependências faltando
- Performance degradada
- Dados inconsistentes

---

## 📋 FASE 4: EVOLUÇÃO GUIADA (4-5 semanas)

### 4.1 Seção "Próxima Evolução"

**Arquivo:** `merchant-portal/src/pages/Config/ConfigEvolutionPage.tsx`

**Funcionalidades:**
- Roadmap personalizado
- Próximos passos sugeridos
- Evolução guiada passo a passo
- Progresso visual

**Roadmap:**
- Fase atual do restaurante
- Próximas fases sugeridas
- Passos para evoluir
- Benefícios de cada fase

**Critério de Pronto:**
- ✅ Roadmap personalizado
- ✅ Próximos passos claros
- ✅ Evolução guiada
- ✅ Progresso visual

---

### 4.2 Evolution Engine

**Arquivo:** `merchant-portal/src/core/intelligence/EvolutionEngine.ts`

**Lógica:**
1. Identifica fase atual
2. Analisa maturidade
3. Sugere próxima fase
4. Cria roadmap personalizado
5. Guia evolução passo a passo

**Fases:**
- **Iniciante:** Setup básico, TPV simples
- **Intermediário:** KDS, Relatórios, Escalas
- **Avançado:** IA, Automação, Multi-unidade
- **Enterprise:** Franquia, Orquestração, Analytics

---

## 🎯 ESTRUTURA DE MÓDULOS

### Módulos Base (Sempre Instalados)
- ✅ Identidade
- ✅ Localização
- ✅ Horários
- ✅ Cardápio
- ✅ Estoque
- ✅ Pessoas
- ✅ Pagamentos

### Módulos Opcionais (Instaláveis)
- 🔌 TPV Avançado
- 🍳 KDS Inteligente
- 📊 Relatórios Avançados
- 📅 Reservas
- 👥 Escalas
- 🤖 IA Mentora
- 🏢 Multi-unidade
- 📱 Delivery
- 💰 Financeiro
- 📈 Analytics

---

## 📊 RESULTADO ESPERADO

### Antes
- Config Tree = configuração estática
- Dashboard fixo
- Sem visibilidade de módulos
- Sem sugestões

### Depois
- Config Tree = installer de sistema vivo
- Dashboard dinâmico
- Visibilidade completa
- Sugestões inteligentes
- Evolução guiada

---

## ⏱️ ESTIMATIVA TOTAL

- **Fase 1:** 2-3 semanas
- **Fase 2:** 3-4 semanas
- **Fase 3:** 2-3 semanas
- **Fase 4:** 4-5 semanas

**Total:** 11-15 semanas (3-4 meses)

---

## ✅ CRITÉRIO DE SUCESSO

**Sistema está completo quando:**
- ✅ Usuário vê todos os módulos instalados
- ✅ Recebe sugestões relevantes automaticamente
- ✅ Monitora saúde do sistema em tempo real
- ✅ Segue roadmap personalizado de evolução
- ✅ Sistema se adapta ao crescimento do restaurante

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Roadmap Definido — Pronto para Execução
