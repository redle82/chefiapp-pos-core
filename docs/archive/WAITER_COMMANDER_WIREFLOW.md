# Comandeiro do Garçom — Wireflow V1

**Princípio**: 1 dedo, 1 ação, zero pensamento.

---

## 🗺️ TELA 1: Home — Mapa da Área

### Layout
```
┌─────────────────────────────────────┐
│  [← Voltar]  Área 1          [⚙️]   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
│  │ M1  │  │ M2  │  │ M3  │  │ M4  ││
│  │ 🟢  │  │ 🔴  │  │ 🟡  │  │ 🟢  ││
│  │Livre│  │Cham.│  │Conta│  │Livre││
│  └─────┘  └─────┘  └─────┘  └─────┘│
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
│  │ M5  │  │ M6  │  │ M7  │  │ M8  ││
│  │ 🔴  │  │ 🟢  │  │ 🟢  │  │ 🟢  ││
│  │Ocup.│  │Livre│  │Livre│  │Livre││
│  └─────┘  └─────┘  └─────┘  └─────┘│
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
│  │ M9  │  │ M10 │  │ M11 │  │ M12 ││
│  │ 🟢  │  │ 🟡  │  │ 🟢  │  │ 🟢  ││
│  │Livre│  │Coz. │  │Livre│  │Livre││
│  └─────┘  └─────┘  └─────┘  └─────┘│
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Grid**: 3x4 ou 4x3 (12 mesas padrão)
- **Cada mesa**: Botão mínimo 80x80px (touch target 44x44px mínimo, mas preferir 80px)
- **Status visual**:
  - 🟢 Livre (verde claro)
  - 🔴 Ocupada (vermelho suave)
  - 🟡 Chamando (amarelo piscante)
  - 🟠 Conta (laranja)
  - 🔵 Cozinha pronta (azul)
  - ⚪ Limpeza (cinza)
- **Barra inferior fixa**: 5 ícones grandes (60x60px cada, espaçamento 16px)

### Ações
- **Toque na mesa**: Abre Tela 2 (Painel da Mesa)
- **Toque longo**: Menu rápido (Transferir, Chamar ajuda, Status manual)

---

## 🪑 TELA 2: Painel da Mesa

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Mesa 7  [18 min]      [⚙️]   │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │   [+ ADICIONAR ITENS]         │ │ ← Botão rei (principal)
│  └───────────────────────────────┘ │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ ENVIAR   │  │  CONTA   │        │
│  │ COZINHA  │  │          │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ PAGAR    │  │  AJUDA   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ────────────────────────────────  │
│  COMANDA:                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Pizza Margherita        [−] 1 │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ Água                  [−] 2  │ │
│  └───────────────────────────────┘ │
│                                     │
│  Total: R$ 45,00                   │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Topo**: Nome da mesa + timer + ações rápidas
- **Botão rei**: "+ ADICIONAR ITENS" (80% largura, altura 80px)
- **Ações secundárias**: Grid 2x2 (cada botão 45% largura, altura 60px)
- **Lista de itens**: Cards grandes (altura 64px), botões +/- laterais (44x44px)

### Ações
- **"+ ADICIONAR ITENS"**: Abre Tela 3 (Cardápio)
- **"ENVIAR COZINHA"**: Envia comanda para cozinha
- **"CONTA"**: Gera conta e notifica
- **"PAGAR"**: Registra pagamento
- **"AJUDA"**: Cria chamado de ajuda

---

## 📋 TELA 3: Cardápio (Adicionar Itens)

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Adicionar Itens               │
├─────────────────────────────────────┤
│ [FAVORITOS] [TAPAS] [DRINKS] [PRATOS]│ ← Tabs grandes
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Pizza Margherita    R$ 25,00  │ │ ← Toque = +1
│  └───────────────────────────────┘ │ ← Longo = mods
│  ┌───────────────────────────────┐ │
│  │ Água                  R$ 3,00 │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ Refrigerante          R$ 5,00 │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [3 itens]  R$ 33,00  [OK]    │ │ ← Barra fixa
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Tabs**: Altura 56px, fonte 16px bold
- **Cards de item**: Altura 80px, toque = adiciona 1, longo = modificações
- **Barra inferior**: Contador + total + botão OK (altura 64px)

### Ações
- **Toque no item**: Adiciona 1 unidade
- **Toque longo**: Abre modal de modificações (ponto, sem gelo, etc.)
- **"OK"**: Volta para Tela 2 com itens adicionados

---

## 🔔 TELA 4: Chamados (Fila)

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Chamados (3)                  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔴 URGENTE                     │ │
│  │ Mesa 2 — 3 chamados            │ │
│  │ [18 min atrás]  [ATENDER]      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🟠 Mesa 5 — Conta solicitada  │ │
│  │ [5 min atrás]  [ATENDER]       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔵 Mesa 8 — Ajuda              │ │
│  │ [2 min atrás]  [ATENDER]       │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Deduplicação**: 3 chamados da mesma mesa = 1 card "URGENTE"
- **Ordenação**: Por prioridade (P0 > P1 > P2 > P3) + tempo
- **Cards**: Altura 80px, botão "ATENDER" (44x44px mínimo)

---

## 📋 TELA 5: Pedidos (Cozinha)

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Pedidos                       │
├─────────────────────────────────────┤
│ [PENDENTES] [PRONTOS]               │ ← Tabs
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Mesa 7 — Pizza + Água          │ │
│  │ [15 min]  [ENVIAR COZINHA]     │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔵 Mesa 10 — Pronto!           │ │
│  │ [MARCAR ENTREGUE]              │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Tab "PENDENTES"**: Comandas não enviadas
- **Tab "PRONTOS"**: Cozinha marcou como pronto
- **Ações**: Enviar cozinha, Marcar entregue

---

## 💬 TELA 6: Chat Interno

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Chat                          │
├─────────────────────────────────────┤
│ [#sala] [#cozinha] [#bar] [#gerência]│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Mensagens rápidas]            │ │
│  │ [Preciso ajuda Mesa X]          │ │
│  │ [Pedido atrasando]              │ │
│  │ [Cozinha pronta?]               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ João: Transferi Mesa 5 pra você│ │
│  │ [há 2 min]                      │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

### Elementos
- **Canais**: Tabs grandes (altura 56px)
- **Mensagens rápidas**: Botões one-tap no topo
- **Chat**: Mensagens com timestamp

---

## 👤 TELA 7: Perfil Mínimo

### Layout
```
┌─────────────────────────────────────┐
│  [←]  Perfil                        │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [Foto]  João Silva            │ │
│  │  Garçom • Área 1              │ │
│  │  Turno: 18h-23h               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Gerente: Maria (11) 99999    │ │
│  │  [WhatsApp] [Ligar]           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [Sair]                       │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🗺️] [🔔] [📋] [💬] [👤]            │
└─────────────────────────────────────┘
```

---

## 📐 ESPECIFICAÇÃO UI "ONE-FINGER"

### Touch Targets
- **Mínimo absoluto**: 44x44px (Apple HIG, Material Design)
- **Recomendado**: 60x60px (confortável)
- **Botões principais**: 80x80px (botão rei)
- **Espaçamento entre targets**: 8px mínimo, 16px recomendado

### Barra Inferior Fixa
- **Altura total**: 80px
- **Ícones**: 60x60px cada
- **Espaçamento**: 16px entre ícones
- **Background**: Semi-transparente (rgba(0,0,0,0.8))
- **Posição**: `position: fixed; bottom: 0;`

### Hierarquia de Ações
1. **Botão rei** (1 por tela): 80% largura, altura 80px, cor primária
2. **Ações secundárias**: Grid 2x2, cada 45% largura, altura 60px
3. **Ações terciárias**: Lista vertical, altura 64px

### Feedback
- **Vibração**: 50ms em ações críticas (iOS: `HapticFeedback.impact()`, Android: `Vibration.vibrate(50)`)
- **Som**: Beep curto (200ms, 800Hz) em alertas P0/P1
- **Visual**: Flash sutil (opacity 0.5 → 1 → 0.5 em 200ms)

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO

1. ✅ Wireflow e especificação
2. ⏳ Tipos e enums (TableStatus, eventos)
3. ⏳ FloorMap (grid de mesas)
4. ⏳ TablePanel (tela da mesa)
5. ⏳ Barra inferior fixa
6. ⏳ Rota /app/waiter
7. ⏳ Hooks de deduplicação

---

**ChefIApp — O dedo manda, o cérebro agradece.**

