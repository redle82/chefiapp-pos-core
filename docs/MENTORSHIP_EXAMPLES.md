# 🧪 Exemplos de Mentoria Operacional IA

**Status:** 📋 **EXEMPLOS DEFINIDOS**  
**Objetivo:** Mostrar mentoria real em ação

---

## 🎯 TIPOS DE MENTORIA

### 1. Mentoria Preventiva
**Quando:** Antes do problema acontecer  
**Objetivo:** Evitar problema

### 2. Mentoria Corretiva
**Quando:** Após problema detectado  
**Objetivo:** Corrigir comportamento

### 3. Mentoria Educativa
**Quando:** Para ensinar padrões  
**Objetivo:** Educar sobre padrões

### 4. Mentoria Estratégica
**Quando:** Para decisões de longo prazo  
**Objetivo:** Orientar estratégia

---

## 👤 MENTORIA DO FUNCIONÁRIO

### Exemplo 1: Funcionário Tímido (Corretiva)

**Situação:**
- Funcionário não pede ajuda
- Erra por não perguntar
- Fica sobrecarregado
- Atrasou 3 pedidos hoje

**Dados do Sistema:**
```json
{
  "pattern": "not_asking_help",
  "frequency": 5,
  "impact": {
    "delayed_items": 8,
    "sla_violations": 3
  },
  "person": {
    "profile": "shy",
    "experience": "intermediate",
    "history": {
      "errors_by_not_asking": 12,
      "times_asked_help": 2
    }
  }
}
```

**Mentoria:**
> "Vejo que você prefere resolver sozinho, mas hoje isso causou 3 atrasos. É normal pedir ajuda — a equipe está aqui para isso. Na próxima vez, chama alguém antes de ficar sobrecarregado."

**Características:**
- ✅ Tom encorajador (não julgador)
- ✅ Específico (3 atrasos, não genérico)
- ✅ Ação clara (chamar ajuda antes)
- ✅ Privado (não público)

---

### Exemplo 2: Funcionário Arrogante (Corretiva)

**Situação:**
- Funcionário ignora processos
- Acha que sabe melhor
- Causa inconsistências
- 5 erros esta semana por não seguir processo

**Dados do Sistema:**
```json
{
  "pattern": "ignoring_processes",
  "frequency": 8,
  "impact": {
    "errors": 5,
    "inconsistencies": 3
  },
  "person": {
    "profile": "confident",
    "experience": "expert",
    "history": {
      "process_violations": 15,
      "errors_from_violations": 8
    }
  }
}
```

**Mentoria:**
> "Seu conhecimento é valioso, mas quando você pula processos, outros não conseguem seguir e isso causa inconsistências. Que tal compartilhar sua experiência dentro do processo? Assim todos aprendem."

**Características:**
- ✅ Reconhece expertise
- ✅ Foca em impacto no time
- ✅ Sugere canalizar conhecimento
- ✅ Não ataca, educa

---

### Exemplo 3: Funcionário Sobrecarregado (Preventiva)

**Situação:**
- Funcionário trabalhou 6 dias seguidos
- Fadiga acumulada
- Risco de erro aumentado
- Turno de pico chegando

**Dados do Sistema:**
```json
{
  "pattern": "fatigue_accumulation",
  "frequency": 1,
  "impact": {
    "risk_level": "high",
    "error_probability": 0.4
  },
  "person": {
    "profile": "hard_worker",
    "current_state": {
      "fatigue_level": 0.8,
      "days_worked": 6,
      "hours_this_week": 48
    }
  }
}
```

**Mentoria:**
> "Você trabalhou 6 dias seguidos e está chegando no turno de pico. Seu risco de erro está alto. Que tal descansar hoje e voltar amanhã? A equipe pode cobrir."

**Características:**
- ✅ Preventiva (antes do erro)
- ✅ Mostra dados (6 dias, risco alto)
- ✅ Sugere ação (descansar)
- ✅ Oferece apoio (equipe cobre)

---

## 👔 MENTORIA DO GERENTE

### Exemplo 1: Gerente Controlador (Educativa)

**Situação:**
- Gerente microgerencia tudo
- Equipe não tem autonomia
- Gargalos no gerente
- 8 decisões atrasadas esta semana

**Dados do Sistema:**
```json
{
  "pattern": "micromanagement",
  "frequency": 15,
  "impact": {
    "bottlenecks_at_manager": 8,
    "team_autonomy_low": true,
    "delayed_decisions": 5
  },
  "person": {
    "profile": "controlling",
    "role": "manager",
    "history": {
      "delegations": 2,
      "direct_interventions": 45
    }
  }
}
```

**Mentoria:**
> "Você está resolvendo tudo, mas isso cria dependência e gargalos. Quando você delega, a equipe aprende e você ganha tempo para o que realmente importa. Que tal começar delegando tarefas rotineiras?"

**Características:**
- ✅ Não ataca, educa
- ✅ Mostra benefício para o gerente
- ✅ Sugere pequenos passos
- ✅ Foco em resultado, não em culpa

---

### Exemplo 2: Gerente Ausente (Estratégica)

**Situação:**
- Gerente não está presente
- Problemas se acumulam
- Decisões tardias
- 12 problemas não resolvidos

**Dados do Sistema:**
```json
{
  "pattern": "absent_manager",
  "frequency": 10,
  "impact": {
    "unresolved_problems": 12,
    "delayed_decisions": 8,
    "team_morale": "low"
  },
  "person": {
    "profile": "absent",
    "role": "manager",
    "history": {
      "presence_hours_this_week": 5,
      "problems_escalated": 15
    }
  }
}
```

**Mentoria:**
> "Problemas pequenos estão virando grandes porque não foram resolvidos a tempo. Uma presença de 1h por dia pode evitar crises. Que tal agendar 1h fixa por dia para resolver problemas?"

**Características:**
- ✅ Não julga ausência
- ✅ Mostra custo da ausência
- ✅ Sugere compromisso mínimo
- ✅ Foco em resultado

---

### Exemplo 3: Gerente Culpando Funcionários (Corretiva)

**Situação:**
- 12 SLAs violados hoje
- Gerente culpa funcionários
- Mas 9 ocorreram com staff insuficiente

**Dados do Sistema:**
```json
{
  "pattern": "blaming_employees",
  "frequency": 3,
  "impact": {
    "sla_violations": 12,
    "staff_insufficient": 9,
    "team_morale": "low"
  },
  "person": {
    "profile": "blaming",
    "role": "manager"
  }
}
```

**Mentoria:**
> "Você teve 12 SLAs violados hoje, mas 9 deles ocorreram quando havia 30% menos staff que o necessário. O problema não é desempenho individual, é escala inadequada. Vamos ajustar a escala primeiro?"

**Características:**
- ✅ Traduz números em causa
- ✅ Separa problema estrutural de individual
- ✅ Ensina a ler o próprio negócio
- ✅ Mentoria de liderança, não relatório

---

## 🏠 MENTORIA DO DONO

### Exemplo 1: Dono Investindo em Marketing (Estratégica)

**Situação:**
- Dono investe em marketing
- Mas restaurante continua com problemas
- Fluxo de cozinha ruim
- Reservas mal distribuídas

**Dados do Sistema:**
```json
{
  "pattern": "wrong_priority",
  "frequency": 1,
  "impact": {
    "marketing_investment": 5000,
    "operational_problems": {
      "kitchen_flow": "bad",
      "reservation_distribution": "uneven",
      "customer_satisfaction": "low"
    }
  },
  "person": {
    "profile": "reactive",
    "role": "owner"
  }
}
```

**Mentoria:**
> "Seu problema não é marketing. É fluxo de cozinha + reservas mal distribuídas. Resolva isso primeiro, depois invista em marketing. Marketing sem operação sólida só aumenta frustração."

**Características:**
- ✅ Foco estratégico
- ✅ Priorização clara
- ✅ Educação, não só informação
- ✅ Previne decisões erradas

---

### Exemplo 2: Dono Ausente (Estratégica)

**Situação:**
- Dono não está presente
- Problemas se acumulam
- Decisões tardias
- Equipe desmotivada

**Dados do Sistema:**
```json
{
  "pattern": "absent_owner",
  "frequency": 5,
  "impact": {
    "unresolved_problems": 20,
    "team_morale": "very_low",
    "customer_satisfaction": "decreasing"
  },
  "person": {
    "profile": "absent",
    "role": "owner",
    "history": {
      "presence_hours_this_month": 10,
      "problems_escalated": 25
    }
  }
}
```

**Mentoria:**
> "Problemas estão se acumulando e a equipe está desmotivada. Sua presença, mesmo que mínima (2h por semana), faz diferença. Que tal agendar 2h fixas por semana para resolver problemas e motivar a equipe?"

**Características:**
- ✅ Não julga ausência
- ✅ Mostra impacto (equipe desmotivada)
- ✅ Sugere compromisso mínimo
- ✅ Foco em resultado

---

### Exemplo 3: Dono Reativo (Educativa)

**Situação:**
- Dono reage a problemas
- Não previne
- Muda coisa errada
- Problemas recorrentes

**Dados do Sistema:**
```json
{
  "pattern": "reactive_management",
  "frequency": 8,
  "impact": {
    "recurring_problems": 5,
    "wrong_changes": 3,
    "wasted_resources": 2000
  },
  "person": {
    "profile": "reactive",
    "role": "owner"
  }
}
```

**Mentoria:**
> "Você está reagindo a problemas, mas eles continuam voltando. Isso indica que você está mudando a coisa errada. Vamos identificar a causa raiz primeiro? O sistema pode ajudar a encontrar padrões."

**Características:**
- ✅ Educa sobre causa raiz
- ✅ Mostra padrão (problemas recorrentes)
- ✅ Oferece ajuda (sistema)
- ✅ Foco em prevenção

---

## 🏢 MENTORIA DO RESTAURANTE

### Exemplo 1: Restaurante Sazonal (Preventiva)

**Situação:**
- Restaurante tem alta e baixa temporada
- Staff não se adapta
- Problemas recorrentes na alta temporada

**Dados do Sistema:**
```json
{
  "pattern": "seasonal_problems",
  "frequency": 3,
  "impact": {
    "high_season_problems": {
      "sla_violations": 25,
      "staff_insufficient": true,
      "customer_satisfaction": "low"
    }
  },
  "restaurant": {
    "type": "seasonal",
    "history": {
      "high_season_problems": 3,
      "same_problems": true
    }
  }
}
```

**Mentoria:**
> "Você sempre tem problemas na alta temporada porque não ajusta staff. Vamos planejar a próxima temporada com base no que aprendemos? O sistema pode ajudar a prever demanda e staff necessário."

**Características:**
- ✅ Reconhece padrão sazonal
- ✅ Sugere planejamento
- ✅ Usa dados históricos
- ✅ Prevenção futura

---

### Exemplo 2: Restaurante com Gargalo Invisível (Educativa)

**Situação:**
- "Sempre atrasamos quando pedem muito X, mas ninguém sabe por quê"
- Padrão detectado pelo sistema
- Causa identificada

**Dados do Sistema:**
```json
{
  "pattern": "invisible_bottleneck",
  "frequency": 12,
  "impact": {
    "delayed_items": 45,
    "sla_violations": 8
  },
  "cause": {
    "item": "X",
    "reason": "Estação Y não tem capacidade para item X em volume",
    "solution": "Adicionar capacidade ou limitar disponibilidade"
  }
}
```

**Mentoria:**
> "Você sempre atrasa quando pedem muito X porque a estação Y não tem capacidade para isso em volume. Duas opções: adicionar capacidade na estação Y ou limitar disponibilidade de X em horários de pico."

**Características:**
- ✅ Detecta padrão invisível
- ✅ Identifica causa
- ✅ Oferece soluções
- ✅ Educa sobre o problema

---

## 🎯 CARACTERÍSTICAS COMUNS

### Todas as Mentorias Têm

1. **Baseada em Dados Reais**
   - Não suposições
   - Dados do Core
   - Métricas derivadas

2. **Contextual**
   - Entende situação
   - Conhece pessoa
   - Adapta tom

3. **Ação Clara**
   - O que fazer
   - Por que fazer
   - Como fazer

4. **Respeitosa**
   - Não julga
   - Não culpa
   - Foca em aprendizado

5. **No Momento Certo**
   - Não durante estresse
   - Não constantemente
   - Quando importa

---

## 📊 MÉTRICAS DE SUCESSO

### Para Funcionário
- Taxa de melhoria após mentoria
- Redução de erros
- Aumento de autonomia

### Para Gerente
- Taxa de delegação
- Redução de gargalos
- Melhoria de liderança

### Para Dono
- Taxa de decisões corretas
- Redução de problemas recorrentes
- Melhoria estratégica

---

**Última atualização:** 2026-01-27
