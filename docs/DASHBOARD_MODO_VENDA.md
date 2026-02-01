# Dashboard Modo Venda — Transformação UX

**Data:** 2026-01-28
**Objetivo:** Transformar Dashboard de "modo engenheiro" para "modo produto/venda"

---

## 🎯 Problema Identificado

### Antes (Modo Engenheiro)

- ❌ "🔒 Módulo não instalado" — comunica bloqueio/incompleto
- ❌ Cards acinzentados (opacity: 0.6) — parece quebrado
- ❌ Cor vermelha (#b00020) — alerta negativo
- ❌ Sensação: "Sistema incompleto / algo falta"

### Depois (Modo Produto)

- ✅ "✨ Disponível para ativação" — comunica oportunidade
- ✅ Cards com fundo suave (#f8f9ff) — parece disponível, não quebrado
- ✅ Cor azul (#667eea) — ação positiva
- ✅ Badge "✓ Ativo" para módulos instalados
- ✅ Sensação: "Sistema pronto — personalize conforme sua operação"

---

## ✅ Mudanças Implementadas

### 1. Copy Transformado

| Antes                      | Depois                                         |
| -------------------------- | ---------------------------------------------- |
| "🔒 Módulo não instalado"  | "✨ Disponível para ativação"                  |
| "módulo(s) instalado(s)"   | "módulo(s) ativo(s)"                           |
| "Dashboard do Restaurante" | "Seu Sistema Operacional"                      |
| "Escolha um sistema..."    | "Ative os módulos que sua operação precisa..." |

### 2. Visual Transformado

| Aspecto             | Antes              | Depois                   |
| ------------------- | ------------------ | ------------------------ |
| **Cor do badge**    | Vermelho (#b00020) | Azul (#667eea)           |
| **Opacidade**       | 0.6 (acinzentado)  | 1.0 (totalmente visível) |
| **Fundo do card**   | Branco (#fff)      | Azul suave (#f8f9ff)     |
| **Borda**           | Cinza (#e0e0e0)    | Azul claro (#e0e4ff)     |
| **Badge instalado** | Não existia        | "✓ Ativo" (verde)        |

### 3. Comportamento

- ✅ Módulos não instalados agora redirecionam para System Tree (onde podem ser ativados)
- ✅ Módulos instalados vão direto para a rota principal
- ✅ Hover mantém feedback visual positivo

---

### 4. Agrupamento em 3 Zonas Mentais (Produto)

O grid único foi promovido para 3 zonas claras, em linha com a pergunta mental do dono:

- **Zona 1 — Em uso hoje**
  - Cards: `Tarefas`, `System Tree`, `Configuração`, `Saúde`, `Alertas`
  - Mensagem: “O que já está funcionando na sua operação agora.”

- **Zona 2 — Pronto para ativar no piloto**
  - Cards: `TPV`, `KDS`, `Cardápio`
  - Badge: `🚀 Pronto para ativar no piloto`
  - Mensagem: “Núcleo da operação que podemos ligar no próximo passo de piloto.”

- **Zona 3 — Em evolução**
  - Cards: `Pessoas`, `Mentor IA`, `Compras`, `Financeiro`, `Reservas`, `Multi-Unidade`, `Presença Online`
  - Badge: `Em evolução — próximos ciclos`
  - Mensagem: “Para onde o sistema está indo (roadmap visível, sem prometer prazo).”

Copy do header do Dashboard:

> “Em cima, o que você usa hoje. No meio, o que podemos ativar no piloto. Embaixo, o que está em evolução.”

---

### 5. Card "Presença Online" (Página Web do Restaurante)

Foi criado um card explícito para a página pública do restaurante:

- **Nome:** `Presença Online`
- **Ícone:** `🌐`
- **Descrição:** `Página pública do restaurante (em evolução)`
- **Zona:** `Em evolução`
- **Status:** Comunica que é parte do roadmap, não algo “sumido” ou “esquecido”.

No System Tree, o módulo correspondente aparece como:

- **Label:** `Restaurant Web`
- **Tipo:** `module`
- **Descrição:** `Página pública do restaurante (menu, presença online, pedidos).`
- **Metadados:**
  - `publicInterface: true`
  - `dockerDemoRoute: "/public/:slug"` (mapeando a rota real já existente no Docker)

Isso fecha a narrativa:

- Dashboard mostra que existe um futuro módulo de presença pública.
- System Tree registra formalmente que há uma interface pública conectada ao domínio `Menu`.

---

## 📊 Comparação Visual

### Card Não Instalado

**Antes:**

```
┌─────────────────────┐
│ 🖥️                  │
│ TPV                 │
│ 🔒 Módulo não       │ ← Vermelho, opacidade 0.6
│    instalado        │
│ Ponto de venda      │
└─────────────────────┘
```

**Depois:**

```
┌─────────────────────┐ ← Borda azul clara
│ 🖥️                  │
│ TPV                 │
│ ✨ Disponível para  │ ← Azul, totalmente visível
│    ativação         │
│ Ponto de venda      │
└─────────────────────┘ ← Fundo azul suave
```

### Card Instalado

**Antes:**

```
┌─────────────────────┐
│ 🖥️                  │
│ TPV                 │
│ Ponto de venda      │
└─────────────────────┘
```

**Depois:**

```
┌─────────────────────┐
│ 🖥️                  │
│ TPV                 │
│ ✓ Ativo             │ ← Badge verde
│ Ponto de venda      │
└─────────────────────┘
```

---

## 🚀 Próximos Passos (Opcional)

### Curto Prazo (Sem Backend)

1. **Modal de Ativação** (UI only)

   - Ao clicar em módulo não instalado, mostrar modal:
     - "Ativar módulo TPV?"
     - "Este módulo permite..."
     - Botão "Ativar" (por enquanto só fecha modal)
   - **Impacto:** UX mais fluida, sem redirecionar para System Tree

2. **Badges Recomendados**

   - Adicionar badge "Recomendado" em módulos essenciais (TPV, Menu)
   - Adicionar badge "Novo" em módulos recentes
   - **Impacto:** Guia o usuário para módulos importantes

3. **Onboarding Visual**
   - Primeira vez: destacar módulos essenciais
   - Tooltip explicativo: "Comece ativando o TPV"
   - **Impacto:** Reduz fricção inicial

### Médio Prazo (Com Backend)

1. **Fluxo de Ativação Real**

   - Integrar com System Tree para ativação real
   - Feedback visual após ativação
   - **Impacto:** Funcionalidade completa

2. **Billing por Módulo**
   - Mostrar preço ao ativar módulo premium
   - "Ativar por R$ X/mês"
   - **Impacto:** Monetização clara

---

## 📝 Arquivos Modificados

- `merchant-portal/src/pages/Dashboard/DashboardPortal.tsx`
  - Copy transformado (4 mudanças)
  - Visual transformado (cores, opacidade, badges)
  - Comportamento ajustado (redirecionamento)

---

## ✅ Resultado

**Antes:** Dashboard comunicava "sistema incompleto"
**Depois:** Dashboard comunica "sistema pronto para personalizar"

**Nenhuma mudança no core** — apenas camada de apresentação/narrativa.

---

## 🎯 Critérios de Sucesso

- ✅ Usuário não sente que sistema está "quebrado"
- ✅ Módulos não instalados parecem "disponíveis", não "bloqueados"
- ✅ Copy comunica oportunidade, não limitação
- ✅ Visual é positivo e convidativo

---

**Última atualização:** 2026-01-28
**Status:** ✅ Implementado — Dashboard agora em modo venda
