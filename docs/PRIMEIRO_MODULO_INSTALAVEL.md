# 🚀 PRIMEIRO MÓDULO INSTALÁVEL
## Escolhendo o Módulo Exemplar

**Objetivo:** Implementar o primeiro módulo que demonstra completamente a capacidade de instalação viva do ChefIApp.

---

## 🎯 CRITÉRIOS DE ESCOLHA

### O módulo ideal deve:

1. ✅ **Ser central** — Impacto imediato e visível
2. ✅ **Ser independente** — Não quebra se não estiver instalado
3. ✅ **Ter valor claro** — Benefício óbvio para o usuário
4. ✅ **Ser demonstrável** — Fácil de mostrar a diferença
5. ✅ **Ter instalação rica** — Cria realidade operacional completa

---

## 📋 CANDIDATOS

### 1. TPV (Point of Sale) ⭐ RECOMENDADO

**Por quê:**
- ✅ Módulo central do sistema
- ✅ Impacto imediato e visível
- ✅ Demonstra instalação completa
- ✅ Cria realidade operacional rica

**O que acontece ao instalar:**
1. TPV aparece no dashboard
2. Permissões são criadas
3. Dados estruturais são gerados
4. Eventos começam a ser emitidos
5. Integrações são ativadas

**Desafio:**
- ⚠️ Módulo complexo
- ⚠️ Muitas dependências
- ⚠️ Requer cuidado na implementação

**Tempo estimado:** 3-4 semanas

---

### 2. Banco de Horas

**Por quê:**
- ✅ Módulo independente
- ✅ Fácil de demonstrar
- ✅ Valor claro (controle de horas)
- ✅ Não essencial para todos

**O que acontece ao instalar:**
1. Módulo aparece no Config Tree
2. Seção "Banco de Horas" no dashboard
3. Funcionalidades de registro ativadas
4. Relatórios disponíveis

**Desafio:**
- ⚠️ Menos impacto visual
- ⚠️ Pode parecer "feature comum"

**Tempo estimado:** 2-3 semanas

---

### 3. Reservas

**Por quê:**
- ✅ Módulo opcional perfeito
- ✅ Não essencial para todos
- ✅ Demonstra modularidade
- ✅ Valor claro (restaurantes com reservas)

**O que acontece ao instalar:**
1. Módulo aparece no Config Tree
2. Seção "Reservas" no dashboard
3. Calendário ativado
4. Notificações configuradas

**Desafio:**
- ⚠️ Não é central
- ⚠️ Pode não ser relevante para todos

**Tempo estimado:** 2-3 semanas

---

### 4. Compras Automáticas

**Por quê:**
- ✅ Módulo avançado
- ✅ Mostra automação
- ✅ Diferenciação clara
- ✅ Valor alto para restaurantes grandes

**O que acontece ao instalar:**
1. Módulo aparece no Config Tree
2. Seção "Compras" no dashboard
3. Alertas automáticos ativados
4. Lista de compras gerada automaticamente

**Desafio:**
- ⚠️ Requer estoque completo
- ⚠️ Complexidade alta
- ⚠️ Pode ser muito avançado para demo inicial

**Tempo estimado:** 3-4 semanas

---

## 🏆 RECOMENDAÇÃO

### TPV como Primeiro Módulo Instalável

**Por quê:**
1. **Centralidade** — É o coração do sistema
2. **Impacto** — Mudança visível imediata
3. **Demonstração** — Mostra todo o poder do installer
4. **Valor** — Benefício óbvio e imediato

**Estrutura de Instalação:**

```typescript
// Ao instalar TPV:
1. Criar registro em installed_modules
2. Ativar permissões no Core
3. Criar dados estruturais (caixas, operadores)
4. Adicionar ícone no dashboard
5. Habilitar eventos
6. Conectar ao Core
```

**Resultado:**
- ✅ Dashboard muda (TPV aparece)
- ✅ Funcionalidades ativadas
- ✅ Sistema operacional completo
- ✅ Demonstração matadora

---

## 📋 ESTRUTURA DE IMPLEMENTAÇÃO

### Fase 1: Registry de Módulos (1 semana)

**Arquivo:** `docker-core/schema/migrations/20260127_modules_registry.sql`

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
- `install_module(restaurant_id, module_id, config)`
- `uninstall_module(restaurant_id, module_id)`
- `get_installed_modules(restaurant_id)`
- `check_module_health(restaurant_id, module_id)`

---

### Fase 2: Installer de TPV (2 semanas)

**Arquivo:** `merchant-portal/src/core/modules/tpv/TPVInstaller.ts`

**Funcionalidades:**
- Instalação completa do TPV
- Criação de dados estruturais
- Ativação de permissões
- Conexão ao Core
- Materialização no dashboard

**Critério de Pronto:**
- ✅ TPV instalado via Config Tree
- ✅ Aparece no dashboard automaticamente
- ✅ Funcionalidades ativadas
- ✅ Eventos sendo emitidos
- ✅ Core conectado

---

### Fase 3: UI de Instalação (1 semana)

**Arquivo:** `merchant-portal/src/pages/Config/ConfigModulesPage.tsx`

**Funcionalidades:**
- Lista de módulos disponíveis
- Botão "Instalar" para cada módulo
- Status de instalação
- Configuração durante instalação

**Critério de Pronto:**
- ✅ Lista de módulos visível
- ✅ Instalação com 1 clique
- ✅ Feedback visual
- ✅ Status atualizado

---

## 🎯 RESULTADO ESPERADO

### Antes
- TPV sempre disponível (ou não)
- Dashboard fixo
- Sem controle de instalação

### Depois
- TPV instalável via Config Tree
- Dashboard dinâmico (TPV aparece quando instalado)
- Controle total de instalação
- Demonstração matadora do conceito

---

## ⏱️ ESTIMATIVA TOTAL

- **Fase 1 (Registry):** 1 semana
- **Fase 2 (Installer TPV):** 2 semanas
- **Fase 3 (UI):** 1 semana

**Total:** 4 semanas (1 mês)

---

## ✅ CRITÉRIO DE SUCESSO

**Módulo está completo quando:**
- ✅ Pode ser instalado via Config Tree
- ✅ Aparece no dashboard automaticamente
- ✅ Funcionalidades ativadas
- ✅ Demonstração clara do conceito
- ✅ Pronto para mostrar a investidores/parceiros

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Estratégia Definida — Pronto para Implementação
