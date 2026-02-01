# 🌳 DIFERENÇA: Config Tree vs System Tree
## Entendendo as Duas Árvores do ChefIApp

**Data:** 27/01/2026  
**Status:** ✅ **DOCUMENTADO**

---

## 🎯 VISÃO GERAL

O ChefIApp possui **duas árvores diferentes** com propósitos distintos:

1. **Config Tree** - Árvore de Configuração (Onboarding + Config permanente)
2. **System Tree** - Árvore do Sistema Operacional (Visualização completa)

---

## 📋 CONFIG TREE

### Onde está
- **Onboarding:** `/onboarding` (durante setup inicial)
- **Config Permanente:** `/config` (após publicação)

### Propósito
- **Configurar** o restaurante
- **Gerenciar** configurações permanentes
- **Instalar** módulos
- **Ajustar** parâmetros operacionais

### Estrutura
```
Configuração
├── Identidade
├── Localização
├── Tempo (Horários)
├── Cardápio
├── Estoque
├── Pessoas
├── Pagamentos
├── Integrações
├── Módulos
└── Estado
```

### Quando usar
- Durante onboarding (setup inicial)
- Para ajustar configurações
- Para instalar/desinstalar módulos
- Para gerenciar pessoas, horários, etc.

---

## 🌳 SYSTEM TREE

### Onde está
- **Rota:** `/system-tree`
- **Acesso:** Após publicação (RequireOnboarding)

### Propósito
- **Visualizar** o sistema operacional completo
- **Entender** o que está instalado
- **Ver** status de cada componente
- **Navegar** pela arquitetura do ROS

### Estrutura
```
Restaurant OS
├── Core Engines
│   ├── Event Engine
│   ├── SLA Engine
│   ├── Inventory Engine
│   └── ...
├── Domains
│   ├── Orders
│   ├── Menu
│   ├── People
│   └── ...
├── Installed Modules
│   ├── TPV
│   ├── KDS
│   └── ...
├── Configuration
│   ├── Identity
│   ├── Location
│   └── ...
├── Operation
│   ├── Tasks
│   ├── Alerts
│   └── ...
└── Roadmap
    ├── Missing Capabilities
    └── Optimization Opportunities
```

### Quando usar
- Para entender o sistema completo
- Para ver o que está instalado
- Para diagnosticar problemas
- Para planejar evolução

---

## 🔗 COMO ACESSAR

### Config Tree
1. **Durante Onboarding:** Automaticamente visível em `/onboarding`
2. **Após Publicação:** Acesse `/config` no menu

### System Tree
1. **Via URL:** Navegue para `/system-tree`
2. **Via Config Tree:** Agora há um link "System Tree" no final da Config Tree
3. **Requisito:** Restaurante deve estar publicado (RequireOnboarding)

---

## 🎨 DIFERENÇAS VISUAIS

### Config Tree
- **Estilo:** Limpo, executivo, similar ao GloriaFood
- **Cores:** Claras, profissionais
- **Foco:** Configuração prática

### System Tree
- **Estilo:** IDE-like, similar ao VS Code
- **Cores:** Escuras (#1e1e1e), monospace
- **Foco:** Visualização técnica

---

## 📝 RESUMO

| Aspecto | Config Tree | System Tree |
|---------|-------------|-------------|
| **Rota** | `/onboarding`, `/config` | `/system-tree` |
| **Propósito** | Configurar | Visualizar |
| **Quando** | Setup + Ajustes | Diagnóstico + Entendimento |
| **Estilo** | Executivo | Técnico/IDE |
| **Acesso** | Sempre | Após publicação |

---

## ✅ CONCLUSÃO

**Config Tree** = "Como configurar o restaurante"  
**System Tree** = "Como o sistema funciona internamente"

Ambas são importantes, mas servem propósitos diferentes!

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Documentação Completa
