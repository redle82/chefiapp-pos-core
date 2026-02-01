# 🌳 CONFIG TREE GLOBAL
## Árvore de Configuração Persistente

**Objetivo:** Unificar todas as telas de configuração do sistema em uma árvore lateral persistente, semelhante ao GloriaFood e Shopify Settings.

**Status:** ✅ Implementado

---

## 🎯 PROBLEMA RESOLVIDO

### Antes
- Onboarding = árvore 🌳
- Operação = planeta 🌍
- Configurações = satélites 🛰️

**Resultado:** Sistema funcionava, mas não se apresentava como organismo único.

### Depois
- Onboarding = ritual obrigatório (linear)
- Config Tree = árvore permanente (editável)
- Operação = continuação natural

**Resultado:** Sistema vivo, conectado e defensável.

---

## 📋 ESTRUTURA IMPLEMENTADA

### Rota Principal
```
/config
```

### Seções da Árvore

```
CONFIGURAÇÃO
├── Identidade          → /config/identity
├── Localização         → /config/location
│   ├── Endereço        → /config/location/address
│   └── Mesas & Zonas   → /config/location/tables
├── Tempo               → /config/schedule
│   ├── Horários        → /config/schedule/hours
│   └── Turnos          → /manager/schedule (link externo)
├── Cardápio            → /menu-builder (link externo)
├── Estoque             → /inventory-stock (link externo)
│   ├── Ingredientes    → /inventory-stock
│   └── Alertas         → /inventory-stock?tab=alerts
├── Pessoas             → /config/people
│   ├── Funcionários    → /config/people/employees
│   ├── Papéis          → /config/people/roles
│   └── Escalas         → /manager/schedule (link externo)
├── Pagamentos          → /config/payments
├── Integrações         → /config/integrations
└── Estado              → /config/status
```

---

## 🏗️ ARQUITETURA

### Componentes Criados

1. **`ConfigSidebar.tsx`**
   - Sidebar fixa à esquerda
   - Navegação hierárquica
   - Suporte a sub-itens (children)
   - Memoização para performance

2. **`ConfigItem.tsx`**
   - Item individual da sidebar
   - Suporte a itens filhos (indentação)
   - Estados visuais (ativo/inativo)
   - Otimizado com React.memo

3. **`ConfigLayout.tsx`**
   - Layout principal com sidebar + conteúdo
   - Rotas aninhadas
   - Proteção `RequireOnboarding`

4. **Páginas de Configuração**
   - `ConfigIdentityPage.tsx`
   - `ConfigLocationPage.tsx`
   - `ConfigSchedulePage.tsx`
   - `ConfigPeoplePage.tsx`
   - `ConfigPaymentsPage.tsx`
   - `ConfigIntegrationsPage.tsx`
   - `ConfigStatusPage.tsx`

---

## 🔗 MAPEAMENTO DE ROTAS

### Reutilização de Telas Existentes

**Regra:** Não duplicar telas. Reutilizar componentes do onboarding.

| Seção Config | Rota Config | Componente Reutilizado |
|--------------|-------------|------------------------|
| Identidade | `/config/identity` | `IdentitySection` |
| Localização | `/config/location` | `LocationSection` |
| Tempo | `/config/schedule` | `ScheduleSection` |
| Pessoas | `/config/people` | `PeopleSection` |
| Pagamentos | `/config/payments` | `PaymentsSection` |
| Integrações | `/config/integrations` | `IntegrationsSection` |
| Estado | `/config/status` | `PublishSection` |

### Links Externos

Algumas seções apontam para rotas existentes (não duplicadas):

- **Cardápio** → `/menu-builder`
- **Estoque** → `/inventory-stock`
- **Turnos** → `/manager/schedule`

---

## 🔐 PROTEÇÃO

### RequireOnboarding

A rota `/config` é protegida por `RequireOnboarding`:

- ✅ Só acessível após publicação
- ✅ Redireciona para `/onboarding` se incompleto
- ✅ Mantém consistência operacional

---

## 🎨 UX/UI

### Design

- **Sidebar fixa:** 280px de largura
- **Conteúdo:** Margem esquerda de 280px
- **Hierarquia visual:** Sub-itens com indentação
- **Estados:** Ativo (azul), inativo (cinza)
- **Transições:** Suaves (0.2s ease)

### Inspiração

- GloriaFood (sidebar de configuração)
- Shopify Settings (hierarquia clara)
- GitHub Settings (navegação persistente)

---

## 📊 RELAÇÃO COM ONBOARDING

### Onboarding vs Config Tree

| Aspecto | Onboarding | Config Tree |
|---------|------------|-------------|
| **Propósito** | Criar restaurante | Manter restaurante |
| **Acesso** | Sempre acessível | Só após publicação |
| **Fluxo** | Linear (wizard) | Árvore (navegação livre) |
| **Status** | Mostra progresso | Sempre "completo" |
| **Contexto** | Setup inicial | Configuração permanente |

### Regra Simples

- **Durante onboarding** → só vê onboarding
- **Depois de publicar** → onboarding some, entra Config Tree

---

## ✅ GANHOS

### Para o Usuário
- ✅ Tudo faz sentido
- ✅ Nada "desaparece"
- ✅ Sabe onde mexer em tudo
- ✅ Hierarquia clara

### Para o Desenvolvedor
- ✅ Reutiliza 100% das telas
- ✅ Não quebra arquitetura
- ✅ Escala para hotel, franquia, multi-unidade
- ✅ Código limpo e organizado

### Para o Produto
- ✅ Sistema governado, não app de telas
- ✅ Categoria nova de produto
- ✅ Defensável e escalável

---

## 🚀 PRÓXIMOS PASSOS

### Melhorias Futuras

1. **Status Visual**
   - Mostrar status de cada seção (completo/incompleto)
   - Badges de alerta (ex: estoque baixo)

2. **Breadcrumbs**
   - Navegação contextual
   - Voltar para seção pai

3. **Busca**
   - Buscar configurações por nome
   - Atalhos de teclado

4. **Permissões**
   - Filtrar seções por papel (Employee, Manager, Owner)
   - Mostrar apenas o que o usuário pode editar

---

## 📝 FRASE-CHAVE

> "Onboarding cria o restaurante.
> Configuração mantém o restaurante vivo.
> Operação faz o restaurante respirar."

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Implementado e Funcional
