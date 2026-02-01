# 🌳 SYSTEM TREE
## Visualização Completa do Sistema Operacional do Restaurante

**Rota:** `/system-tree`  
**Acesso:** Apenas Owners (protegido por `RequireOnboarding`)

---

## 🎯 OBJETIVO

Criar uma visualização única e centralizada da **ÁRVORE COMPLETA DO CHEFIAPP**, mostrando:

- ✅ O que o sistema É
- ✅ O que está INSTALADO
- ✅ O que está DISPONÍVEL
- ✅ O que está ATIVO
- ✅ O que está BLOQUEADO
- ✅ Relações entre tudo isso

**Essa árvore NÃO é só UI. Ela é um mapa do sistema operacional do restaurante.**

---

## 🏗️ ESTRUTURA DA ÁRVORE

```
ROOT
└── Restaurant OS
    ├── Core (sempre ativo)
    │   ├── Event Engine
    │   ├── Task Engine
    │   ├── SLA Engine
    │   ├── Inventory Engine
    │   ├── Permissions Engine
    │   └── Mentor IA (estado: dormindo / observando / ativo)
    │
    ├── Domains
    │   ├── Restaurant
    │   │   ├── Tables
    │   │   ├── Orders
    │   │   ├── KDS
    │   │   └── Menu
    │   ├── Hotel (locked)
    │   └── Delivery (locked)
    │
    ├── Installed Modules
    │   ├── TPV (installed | not installed)
    │   ├── KDS (installed | not installed)
    │   ├── Reservations
    │   ├── Bank of Hours
    │   ├── Purchases
    │   └── Stock Automation
    │
    ├── Configuration
    │   ├── Identity (complete | incomplete)
    │   ├── Location
    │   ├── Schedule
    │   ├── Menu
    │   ├── People
    │   ├── Payments
    │   └── Integrations
    │
    ├── Operation (somente se publicado)
    │   ├── Dashboard
    │   ├── Live Orders
    │   ├── KDS Live
    │   └── Alerts
    │
    ├── Permissions
    │   ├── Owner
    │   ├── Manager
    │   └── Employee
    │
    ├── Data & State
    │   ├── Restaurant Status (draft | active | paused)
    │   ├── Installed Capabilities
    │   ├── Health Score
    │   └── Last Events
    │
    └── Roadmap / Suggestions
        ├── Recommended Next Module
        ├── Missing Capabilities
        └── Optimization Opportunities
```

---

## 🎨 LAYOUT

### Estrutura

- **Sidebar esquerda:** Árvore expansível (320px, tema escuro, estilo IDE)
- **Painel direito:** Detalhes do nó selecionado (full-width)
- **Breadcrumb:** Caminho completo do nó selecionado

### Status Visuais

- **Verde (●):** Ativo, Instalado, Completo
- **Cinza (○):** Inativo, Não Instalado, Incompleto
- **Vermelho (🔒):** Bloqueado
- **Amarelo (💤):** Dormindo
- **Azul (👁️):** Observando

---

## 📋 FUNCIONALIDADE

### Cada Nó Mostra:

1. **Status visual** (cor e ícone)
2. **Clicável** (seleciona e expande)
3. **Painel direito com:**
   - Descrição do que é
   - Dependências
   - Se está ativo
   - Como instalar / completar
   - Eventos que produz
   - Dados que consome

---

## 🔐 REGRAS IMPORTANTES

- ✅ **NÃO inventar dados** — Tudo vem do estado real
- ✅ **NÃO misturar configuração com operação**
- ✅ **Árvore é de VISÃO e GOVERNANÇA**
- ✅ **Apenas Owners podem acessar**

---

## 📁 ARQUIVOS CRIADOS

1. **`context/SystemTreeContext.tsx`**
   - Contexto com estado da árvore
   - Funções de seleção e expansão
   - Build da árvore a partir do estado real

2. **`components/SystemTree/SystemTreeSidebar.tsx`**
   - Sidebar com árvore expansível
   - Tema escuro estilo IDE
   - Navegação hierárquica

3. **`components/SystemTree/SystemNodeDetails.tsx`**
   - Painel de detalhes do nó selecionado
   - Informações completas
   - Ações disponíveis

4. **`pages/SystemTree/SystemTreePage.tsx`**
   - Página principal
   - Layout completo
   - Breadcrumb

---

## ✅ CRITÉRIO DE SUCESSO

**Quando abrir `/system-tree`, deve conseguir responder:**

- ✅ O que meu sistema é?
- ✅ O que está instalado?
- ✅ O que falta?
- ✅ O que posso ativar agora?
- ✅ O que está bloqueado e por quê?
- ✅ Qual é o próximo passo lógico do sistema?

**Essa tela deve dar a sensação:**
> "Estou olhando o cérebro completo do meu restaurante."

---

## 🚀 PRÓXIMOS PASSOS

1. **Integrar com OnboardingContext**
   - Status real de configuração
   - Não usar mocks

2. **Integrar com módulos instalados**
   - Buscar do banco real
   - Status dinâmico

3. **Adicionar ações reais**
   - Botão "Instalar" funcional
   - Botão "Configurar" funcional

4. **Melhorar breadcrumb**
   - Caminho completo do nó selecionado
   - Navegação contextual

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ System Tree Implementada — Pronto para Teste
