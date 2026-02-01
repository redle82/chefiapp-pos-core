# Manifesto da UI v2 - Adapter do Core Soberano

**Data:** 2026-01-25  
**Status:** Arquitetura Definida  
**Princípio:** UI como Adapter, não como Produto

---

## Princípio Fundamental

**A UI v2 é um ADAPTER do Core, não um produto em si.**

```
[ CORE SOBERANO ]  ← intocável
        ↑
        |
[ API / RPC / EVENTS ]
        ↑
        |
[ UI v2 - MINIMAL, FEIA SE PRECISAR ]
```

---

## O Que a UI v2 PODE Fazer

✅ **Refletir estado do Core**
- Mostrar o que o Core decidiu
- Exibir regras que estão ativas
- Indicar o que está bloqueado e por quê

✅ **Comunicar com clareza**
- Explicar por que uma ação foi bloqueada
- Apontar qual regra falta
- Indicar próxima ação necessária

✅ **Observabilidade humana**
- Mostrar "o que está errado agora"
- Mostrar "quem está atrasando"
- Mostrar "restaurante está saudável?"

✅ **Adapter de eventos**
- Escutar eventos do Core
- Projetar estado visualmente
- Não decidir, só mostrar

---

## O Que a UI v2 NÃO PODE Fazer

❌ **Decidir regras de negócio**
- Não valida regras
- Não "facilita" bypass
- Não suaviza erros

❌ **Esconder governança**
- Não passa pano
- Não mascara bloqueios
- Não permite contornar constraints

❌ **Ser produto antes de ser adapter**
- Não tenta agradar todo mundo
- Não adiciona features sem Core
- Não "melhora" regras

❌ **Carregar lógica de negócio**
- Não decide o que fazer
- Não assume intenção
- Não adivinha estado

---

## Arquitetura da UI v2

### Camadas

```
┌─────────────────────────────────────┐
│  UI v2 - Presentation Layer          │
│  - Componentes visuais              │
│  - Feedback humano                  │
│  - Observabilidade                  │
└─────────────────────────────────────┘
              ↑
              │ (chama)
              │
┌─────────────────────────────────────┐
│  Core Adapter Layer                 │
│  - RPC calls (create_order_atomic) │
│  - Event listeners (Realtime)       │
│  - State projection                 │
└─────────────────────────────────────┘
              ↑
              │ (escuta)
              │
┌─────────────────────────────────────┐
│  Core Soberano                      │
│  - Regras constitucionais           │
│  - Banco como juiz                  │
│  - Constraints ativas               │
└─────────────────────────────────────┘
```

---

## Fluxo Mínimo Real

### 1. Abrir Turno
- **UI:** Botão "Abrir Turno"
- **Adapter:** Chama RPC `start_turn`
- **Core:** Valida e cria sessão
- **UI:** Mostra estado (aberto/fechado/bloqueado)

### 2. Criar Pedido
- **UI:** Seleciona mesa, adiciona itens
- **Adapter:** Chama RPC `create_order_atomic`
- **Core:** Valida constraints, cria pedido
- **UI:** Mostra sucesso OU mostra erro claro

### 3. Bloquear se Regra Falhar
- **Core:** Retorna erro de constraint
- **Adapter:** Captura erro com código
- **UI:** Mostra mensagem clara:
  - "Esta mesa já tem pedido aberto"
  - "Feche o pedido #123 ou escolha outra mesa"

### 4. Fechar Pedido
- **UI:** Botão "Fechar Pedido"
- **Adapter:** Chama RPC de fechamento
- **Core:** Valida e fecha
- **UI:** Atualiza estado visual

### 5. Ver Erro Claramente
- **Core:** Retorna erro com código
- **Adapter:** Mapeia código para mensagem
- **UI:** Mostra:
  - O que aconteceu
  - Por que foi bloqueado
  - O que fazer agora

---

## UX de Fricção Consciente

**O Core incomoda de propósito. A UI não pode suavizar isso.**

### Exemplos Corretos

**Quando constraint bloqueia:**
```
❌ ERRADO: "Ops, algo deu errado. Tente novamente."
✅ CERTO: "Esta mesa já possui um pedido aberto (#123). 
          Feche ou pague o pedido #123 antes de criar um novo, 
          ou escolha outra mesa."
```

**Quando regra falta:**
```
❌ ERRADO: "Não foi possível completar a ação."
✅ CERTO: "Não é possível fechar o caixa: 
          Existem 3 pedidos em aberto. 
          Finalize ou cancele-os primeiro."
```

**Quando tarefa bloqueia:**
```
❌ ERRADO: "Ação não permitida no momento."
✅ CERTO: "Não é possível iniciar turno: 
          Tarefa 'Configurar mesas' não foi concluída. 
          Complete a tarefa nas configurações primeiro."
```

---

## Componentes Mínimos Necessários

### 1. TPV Mínimo
- Selecionar mesa
- Adicionar itens
- Criar pedido (via RPC)
- Ver feedback claro quando bloqueado
- Ver pedidos ativos

### 2. KDS Mínimo
- Ver pedidos novos (Realtime)
- Avançar status (preparando → pronto)
- Ver feedback quando offline
- Sincronizar após reconexão

### 3. Painel de Estado (Observabilidade Humana)
- "O que está errado agora?" (pedidos bloqueados, erros)
- "Quem está atrasando?" (pedidos em preparo há muito tempo)
- "Restaurante está saudável?" (status geral)

---

## Estado da UI Atual (Legacy)

**Marcação Oficial:**
```
LEGACY_UI_DO_NOT_EXTEND
```

**Regras:**
- ✅ Parar de adicionar features
- ✅ Só corrigir bugs críticos
- ✅ Usar apenas como referência visual
- ❌ NÃO evoluir conceitualmente
- ❌ NÃO refatorar agressivamente

**Motivo:**
- Nasceu antes do Core estar soberano
- Carrega decisões implícitas
- Tem lógica misturada
- Serve hipóteses antigas
- Semanticamente incompatível com Core atual

---

## Próximos Passos

### Fase 1: Estrutura Base
- [ ] Criar package/app `core-adapter-ui` ou `ui-v2`
- [ ] Definir arquitetura de camadas
- [ ] Criar Core Adapter Layer

### Fase 2: Componentes Mínimos
- [ ] TPV mínimo (1 fluxo completo)
- [ ] KDS mínimo (receber pedidos)
- [ ] Painel de estado (observabilidade)

### Fase 3: Validação
- [ ] Testar com piloto de 7 dias
- [ ] Coletar feedback humano
- [ ] Ajustar clareza (sem mudar regras)

### Fase 4: Decisão
- [ ] Manter UI v2
- [ ] Evoluir UI v2
- [ ] Ou refazer de novo (se necessário)

---

## Princípios de Design

### 1. Clareza sobre Estética
- Feia mas clara > Bonita mas confusa
- Mensagem direta > Animação
- Explicação > Suavização

### 2. Fricção Consciente
- Não esconder bloqueios
- Não permitir bypass
- Explicar por quê

### 3. Estado como Fonte de Verdade
- UI reflete Core
- Não assume estado
- Sempre valida visualmente

### 4. Feedback Humano
- Mensagens claras
- Ações sugeridas
- Contexto completo

---

## Não Fazer

- ❌ Não adicionar features novas
- ❌ Não refatorar Core
- ❌ Não "otimizar" performance
- ❌ Não tentar agradar todo mundo
- ❌ Não fazer UI complexa
- ❌ Não mudar regras constitucionais
- ❌ Não contornar constraints
- ❌ Não remendar UI antiga

---

## Conclusão

**A UI v2 é um adapter consciente do Core soberano.**

Ela não decide, não valida, não facilita.
Ela reflete, comunica e observa.

**Feia se precisar, mas honesta sempre.**

---

*"UI como adapter, não como produto. Core como lei, UI como espelho."*
