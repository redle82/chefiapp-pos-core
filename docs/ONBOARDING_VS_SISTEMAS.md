# 🎯 ONBOARDING VS SISTEMAS DO CHEFIAPP
## Onde Está Cada Coisa

**Data:** 27/01/2026  
**Status:** ✅ **DOCUMENTAÇÃO CRIADA**

---

## 🔍 ENTENDENDO A DIFERENÇA

### Onboarding (`/onboarding`)
**Propósito:** Configuração inicial do restaurante  
**Quando usar:** Primeira vez configurando o restaurante  
**O que faz:**
- Define identidade (nome, tipo, país)
- Configura localização (endereço, mesas)
- Define horários de funcionamento
- Cria cardápio inicial
- Configura estoque
- Cadastra pessoas (gerente, funcionários)
- Configura pagamentos
- Configura integrações
- **Publica o restaurante**

**⚠️ IMPORTANTE:** O onboarding NÃO contém o TPV nem os outros sistemas. Ele apenas configura a base.

---

## 🧩 ONDE ESTÃO OS SISTEMAS

### 1. TPV (Point of Sale)
- **Rota:** `/tpv`
- **O que é:** Terminal de ponto de venda
- **Acesso:** Disponível mesmo durante onboarding (para testes)
- **Instalação:** Via `/config/modules` (após publicação)

### 2. Task System (Sistema de Tarefas)
- **Rota:** `/tasks`
- **O que é:** Gerenciamento de tarefas recorrentes e automáticas
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 3. People System (Pessoas)
- **Rota:** `/people`
- **O que é:** Gestão de funcionários, perfis operacionais, tempo
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 4. Health System (Saúde)
- **Rota:** `/health`
- **O que é:** Monitoramento de saúde operacional, humana e financeira
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 5. Alerts System (Alertas)
- **Rota:** `/alerts`
- **O que é:** Sistema de alertas críticos e silenciosos
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 6. Mentor IA (Mentoria)
- **Rota:** `/mentor`
- **O que é:** IA mentora com sugestões e recomendações
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 7. Purchases (Compras)
- **Rota:** `/purchases`
- **O que é:** Gestão de fornecedores, pedidos de compra, sugestões automáticas
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 8. Financial (Financeiro)
- **Rota:** `/financial`
- **O que é:** Fluxo de caixa, margens, custos, previsões
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 9. Reservations (Reservas)
- **Rota:** `/reservations`
- **O que é:** Sistema de reservas online e internas
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 10. Groups (Multi-Unidade)
- **Rota:** `/groups`
- **O que é:** Gestão de grupos de restaurantes, benchmarks
- **Acesso:** Requer publicação (`RequireOnboarding`)

### 11. System Tree (Árvore do Sistema)
- **Rota:** `/system-tree`
- **O que é:** Visualização completa do sistema operacional
- **Acesso:** Disponível (pode ter dados limitados sem publicação)

### 12. Config Tree (Árvore de Configuração)
- **Rota:** `/config`
- **O que é:** Configuração permanente do sistema
- **Acesso:** Requer publicação (`RequireOnboarding`)

---

## 🚀 COMO ACESSAR

### Durante o Onboarding
Na página de **Publicação** (`/onboarding?section=publish`), há uma seção **"🧩 Acesso aos Sistemas do ChefIApp"** com botões para todos os sistemas.

### Após Publicação
Todos os sistemas ficam acessíveis via:
- Menu principal (se existir)
- URLs diretas (`/tpv`, `/tasks`, etc.)
- System Tree (`/system-tree`)
- Config Tree (`/config`)

---

## 📋 RESUMO VISUAL

```
ONBOARDING (/onboarding)
├── Identidade
├── Localização
├── Horários
├── Cardápio
├── Estoque
├── Pessoas
├── Pagamentos
├── Integrações
└── Publicação
    └── [Links para todos os sistemas]

SISTEMAS (após publicação)
├── TPV (/tpv)
├── Tasks (/tasks)
├── People (/people)
├── Health (/health)
├── Alerts (/alerts)
├── Mentor (/mentor)
├── Purchases (/purchases)
├── Financial (/financial)
├── Reservations (/reservations)
├── Groups (/groups)
├── System Tree (/system-tree)
└── Config Tree (/config)
```

---

## ⚠️ IMPORTANTE

- **Onboarding** = Configuração inicial
- **Sistemas** = Operação e gestão
- **Config Tree** = Configuração permanente
- **System Tree** = Visualização do sistema completo

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Documentação Completa
