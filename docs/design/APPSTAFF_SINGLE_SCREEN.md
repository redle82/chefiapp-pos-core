# 🎨 AppStaff - Tela Única Definitiva

**1 tela, 1 ação, 1 prioridade, zero configuração**

---

## 🎯 Premissa

**O AppStaff mostra APENAS UMA COISA POR VEZ.**

Se mostrar 2, falhou.

---

## 📱 Estrutura da Tela

### Layout Base

```
┌─────────────────────────────┐
│  [Status Bar]               │  ← Sistema (não controlamos)
├─────────────────────────────┤
│                             │
│      [ÍCONE]                │  ← Cor por tipo
│                             │
│      TÍTULO                 │  ← 2 palavras máximo
│                             │
│      MENSAGEM               │  ← 1 frase curta
│                             │
│  ┌───────────────────────┐  │
│  │   AÇÃO ÚNICA          │  │  ← 1 botão
│  └───────────────────────┘  │
│                             │
│  [Footer: Role + Tempo]     │  ← Info mínima
└─────────────────────────────┘
```

---

## 🔴 Estado: CRÍTICO

### Design

```
┌─────────────────────────────┐
│                             │
│         ⚠️                  │  ← Ícone vermelho
│                             │
│      Mesa 7                 │  ← Título (2 palavras)
│                             │
│   Quer pagar há 5+ min      │  ← Mensagem (1 frase)
│                             │
│  ┌───────────────────────┐  │
│  │   COBRAR              │  │  ← Botão vermelho
│  └───────────────────────┘  │
│                             │
│  🍽️ Garçom • 2h 15m        │  ← Footer
└─────────────────────────────┘
```

### Especificações

- **Cor de fundo:** #1a1a1a (escuro)
- **Cor do ícone:** #ff4444 (vermelho)
- **Cor do título:** #ffffff (branco)
- **Cor da mensagem:** #ff8888 (vermelho claro)
- **Cor do botão:** #ff4444 (vermelho)
- **Tamanho do ícone:** 64px
- **Tamanho do título:** 24px, bold
- **Tamanho da mensagem:** 16px, regular
- **Tamanho do botão:** 56px altura, full width - 32px

---

## 🟠 Estado: URGENTE

### Design

```
┌─────────────────────────────┐
│                             │
│         🍽️                  │  ← Ícone laranja
│                             │
│      Mesa 3                 │  ← Título (2 palavras)
│                             │
│   Item pronto               │  ← Mensagem (1 frase)
│                             │
│  ┌───────────────────────┐  │
│  │   ENTREGAR            │  │  ← Botão laranja
│  └───────────────────────┘  │
│                             │
│  🍽️ Garçom • 2h 15m        │  ← Footer
└─────────────────────────────┘
```

### Especificações

- **Cor de fundo:** #1a1a1a (escuro)
- **Cor do ícone:** #ff8800 (laranja)
- **Cor do título:** #ffffff (branco)
- **Cor da mensagem:** #ffaa44 (laranja claro)
- **Cor do botão:** #ff8800 (laranja)
- **Tamanho do ícone:** 64px
- **Tamanho do título:** 24px, bold
- **Tamanho da mensagem:** 16px, regular
- **Tamanho do botão:** 56px altura, full width - 32px

---

## 🟡 Estado: ATENÇÃO

### Design

```
┌─────────────────────────────┐
│                             │
│         👀                  │  ← Ícone amarelo
│                             │
│      Mesa 5                 │  ← Título (2 palavras)
│                             │
│   Verificar                 │  ← Mensagem (1 frase)
│                             │
│  ┌───────────────────────┐  │
│  │   VERIFICAR           │  │  ← Botão amarelo
│  └───────────────────────┘  │
│                             │
│  🍽️ Garçom • 2h 15m        │  ← Footer
└─────────────────────────────┘
```

### Especificações

- **Cor de fundo:** #1a1a1a (escuro)
- **Cor do ícone:** #ffcc00 (amarelo)
- **Cor do título:** #ffffff (branco)
- **Cor da mensagem:** #ffdd44 (amarelo claro)
- **Cor do botão:** #ffcc00 (amarelo)
- **Tamanho do ícone:** 64px
- **Tamanho do título:** 24px, bold
- **Tamanho da mensagem:** 16px, regular
- **Tamanho do botão:** 56px altura, full width - 32px

---

## 🔇 Estado: SILÊNCIO

### Design

```
┌─────────────────────────────┐
│                             │
│         ✅                  │  ← Ícone cinza
│                             │
│   Tudo em ordem             │  ← Título (2 palavras)
│                             │
│                             │  ← Sem mensagem
│                             │
│                             │  ← Sem botão
│                             │
│  🍽️ Garçom • 2h 15m        │  ← Footer
└─────────────────────────────┘
```

### Especificações

- **Cor de fundo:** #1a1a1a (escuro)
- **Cor do ícone:** #888888 (cinza)
- **Cor do título:** #888888 (cinza)
- **Sem mensagem**
- **Sem botão**
- **Tamanho do ícone:** 64px
- **Tamanho do título:** 20px, regular

---

## 🎨 Componentes Visuais

### Ícones por Tipo de Ação

```typescript
const ACTION_ICONS = {
  'collect_payment': '💰',
  'deliver': '🍽️',
  'check': '👀',
  'resolve': '⚠️',
  'acknowledge': '📋',
  'check_kitchen': '⏱️',
  'prioritize_drinks': '🔥',
  'routine_clean': '🧹',
  'resolve_error': '⚠️',
  'silent': '✅'
};
```

### Cores por Prioridade

```typescript
const PRIORITY_COLORS = {
  'critical': {
    icon: '#ff4444',
    title: '#ffffff',
    message: '#ff8888',
    button: '#ff4444',
    background: '#1a1a1a'
  },
  'urgent': {
    icon: '#ff8800',
    title: '#ffffff',
    message: '#ffaa44',
    button: '#ff8800',
    background: '#1a1a1a'
  },
  'attention': {
    icon: '#ffcc00',
    title: '#ffffff',
    message: '#ffdd44',
    button: '#ffcc00',
    background: '#1a1a1a'
  },
  'silent': {
    icon: '#888888',
    title: '#888888',
    message: null,
    button: null,
    background: '#1a1a1a'
  }
};
```

---

## 📐 Especificações Técnicas

### Dimensões

- **Largura:** 100% da tela (com padding de 16px)
- **Altura:** 100% da tela (SafeArea)
- **Padding:** 32px (todos os lados)
- **Espaçamento entre elementos:** 24px

### Tipografia

- **Título:**
  - Font: System (SF Pro / Roboto)
  - Size: 24px
  - Weight: Bold
  - Color: #ffffff (ou cor por prioridade)
  - Line height: 32px
  - Max lines: 2
  - Text align: center

- **Mensagem:**
  - Font: System (SF Pro / Roboto)
  - Size: 16px
  - Weight: Regular
  - Color: Cor por prioridade (clara)
  - Line height: 24px
  - Max lines: 2
  - Text align: center

- **Botão:**
  - Font: System (SF Pro / Roboto)
  - Size: 18px
  - Weight: Bold
  - Color: #ffffff
  - Text transform: uppercase
  - Letter spacing: 1px

### Botão Único

- **Altura:** 56px
- **Largura:** 100% - 32px (padding)
- **Border radius:** 12px
- **Cor:** Cor por prioridade
- **Texto:** Branco, uppercase, bold
- **Haptic feedback:** Sim (ao tocar)
- **Estado pressed:** Opacidade 0.8

### Footer

- **Altura:** 48px
- **Padding:** 16px horizontal
- **Background:** Transparente
- **Conteúdo:**
  - Emoji do role (🍽️, 👨‍🍳, 🍹, etc.)
  - Nome do role (Garçom, Cozinheiro, Barman)
  - Duração do turno (2h 15m)
- **Font:** 14px, regular, #666666

---

## 🔄 Transições

### Entre Estados

```typescript
// Transição suave entre ações
const transition = {
  duration: 300,
  easing: 'ease-in-out'
};

// Fade out ação antiga
fadeOut(oldAction, 300);

// Fade in ação nova
fadeIn(newAction, 300);
```

### Feedback Visual

```typescript
// Ao tocar botão
onPress(() => {
  // 1. Haptic feedback
  HapticFeedback.success();
  
  // 2. Animação de press
  animateButtonPress();
  
  // 3. Marcar ação como completa
  markActionCompleted(actionId);
  
  // 4. Aguardar próxima ação
  showLoadingState();
});
```

---

## 📱 Implementação React Native

### Componente Base

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNowEngine } from '@/hooks/useNowEngine';
import { HapticFeedback } from '@/services/haptics';

export function AppStaffScreen() {
  const { nowAction, completeAction } = useNowEngine();
  const { roleConfig, shiftStart } = useAppStaff();
  
  const formatDuration = (startTime: number) => {
    const mins = Math.floor((Date.now() - startTime) / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };
  
  const handleAction = () => {
    HapticFeedback.success();
    completeAction(nowAction.id);
  };
  
  // Estado silencioso
  if (!nowAction || nowAction.type === 'silent') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.icon, styles.silentIcon]}>✅</Text>
          <Text style={[styles.title, styles.silentTitle]}>Tudo em ordem</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
          </Text>
        </View>
      </View>
    );
  }
  
  // Estado com ação
  const colors = PRIORITY_COLORS[nowAction.type];
  const icon = ACTION_ICONS[nowAction.action] || '⚠️';
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.icon, { color: colors.icon }]}>{icon}</Text>
        <Text style={[styles.title, { color: colors.title }]}>
          {nowAction.title}
        </Text>
        {nowAction.message && (
          <Text style={[styles.message, { color: colors.message }]}>
            {nowAction.message}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.button }]}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {getActionLabel(nowAction.action)}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
        </Text>
      </View>
    </View>
  );
}

function getActionLabel(action: string): string {
  const labels = {
    'collect_payment': 'COBRAR',
    'deliver': 'ENTREGAR',
    'check': 'VERIFICAR',
    'resolve': 'RESOLVER',
    'acknowledge': 'CONFIRMAR',
    'check_kitchen': 'VERIFICAR',
    'prioritize_drinks': 'PRIORIZAR',
    'routine_clean': 'FAZER',
    'resolve_error': 'RESOLVER'
  };
  return labels[action] || 'FAZER';
}
```

### Estilos

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 32,
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    fontSize: 64,
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '100%'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: '100%'
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  footer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  footerText: {
    fontSize: 14,
    color: '#666666'
  },
  silentIcon: {
    color: '#888888'
  },
  silentTitle: {
    color: '#888888',
    fontSize: 20,
    fontWeight: 'normal'
  }
});
```

---

## ✅ Critérios de Sucesso

### Funcionário Novo Entende em 3 Segundos

- ✅ Tela mostra 1 coisa
- ✅ Título claro (2 palavras)
- ✅ Botão único
- ✅ Sem leitura longa
- ✅ Visual, não textual

### Funcionário Velho Não Rejeita

- ✅ Não pede configuração
- ✅ Não pede aprendizado
- ✅ Apenas mostra ação
- ✅ Funciona offline
- ✅ Simples como walkie-talkie

### Gerente Grita Menos

- ✅ Sistema guia funcionário
- ✅ Prioridades são claras
- ✅ Ações críticas aparecem primeiro
- ✅ Não há ruído

### Restaurante Sente Falta se Remover

- ✅ Sistema é essencial
- ✅ Substitui WhatsApp
- ✅ Substitui gritos
- ✅ Melhora operação

---

## 🎯 Regras de UI

### 1. Máximo 2 Palavras no Título

- ✅ "Mesa 7"
- ✅ "Cozinha"
- ✅ "Tudo em ordem"
- ❌ "Mesa 7 quer pagar"
- ❌ "Item da mesa 3 está pronto"

### 2. Máximo 1 Frase na Mensagem

- ✅ "Quer pagar há 5+ min"
- ✅ "Item pronto"
- ✅ "Verificar"
- ❌ "Mesa 7 quer pagar há mais de 5 minutos e precisa de atenção imediata"

### 3. 1 Botão Único

- ✅ Sempre 1 botão
- ✅ Sempre mesmo tamanho
- ✅ Sempre mesma posição
- ❌ Múltiplos botões
- ❌ Botões condicionais

### 4. Sem Scroll

- ✅ Tudo cabe na tela
- ✅ Sem lista
- ✅ Sem scroll
- ❌ Lista de ações
- ❌ Scroll de tarefas

### 5. Sem Configuração

- ✅ Zero configuração
- ✅ Zero escolhas
- ✅ Zero personalização
- ❌ Escolher prioridade
- ❌ Configurar notificações

---

## 🔄 Estados de Transição

### Loading (Aguardando Próxima Ação)

```
┌─────────────────────────────┐
│                             │
│         ⏳                  │  ← Ícone loading
│                             │
│   Processando...            │  ← Mensagem
│                             │
│                             │  ← Sem botão
│                             │
│  🍽️ Garçom • 2h 15m        │  ← Footer
└─────────────────────────────┘
```

**Quando aparece:**
- Após completar ação
- Aguardando próxima ação do NOW ENGINE
- Máximo 2 segundos

---

## 🎨 Acessibilidade

### Contraste

- **Título:** Contraste mínimo 4.5:1
- **Mensagem:** Contraste mínimo 4.5:1
- **Botão:** Contraste mínimo 4.5:1

### Tamanho de Toque

- **Botão:** Mínimo 44x44px (iOS) / 48x48px (Android)
- **Área de toque:** 56px altura (acima do mínimo)

### Leitura de Tela

- **Título:** Acessível via screen reader
- **Mensagem:** Acessível via screen reader
- **Botão:** Label claro ("COBRAR", "ENTREGAR", etc.)

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Design Definido
