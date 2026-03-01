# Comando Único - Referência Rápida

**Objetivo:** Ver todo o sistema funcionando ao mesmo tempo, sem pensar.

---

## 🚀 Comando Principal

```bash
./scripts/visual-validation-orchestrator.sh
```

**O que faz:**
- ✅ Verifica e sobe Supabase local
- ✅ Garante restaurante piloto
- ✅ Inicia Merchant Portal (Web)
- ✅ Mostra URLs de acesso

**Resultado:**
- 📊 Dashboard: http://localhost:5175/app/dashboard
- 💰 TPV: http://localhost:5175/app/tpv
- 🍳 KDS: http://localhost:5175/app/kds/{restaurant_id}

---

## 📱 Mobile (Terminais Separados)

### iOS
```bash
cd mobile-app && npx expo run:ios
```

### Android
```bash
cd mobile-app && npx expo run:android
```

---

## 🎬 Modo Demo Automático

Cria pedidos automaticamente para demonstração:

```bash
./scripts/demo-mode-automatic.sh
```

**Opções:**
```bash
# Criar 20 pedidos com intervalo de 3 segundos
./scripts/demo-mode-automatic.sh --count=20 --interval=3

# Criar 5 pedidos com intervalo de 10 segundos
./scripts/demo-mode-automatic.sh --count=5 --interval=10
```

**O que faz:**
- ✅ Limpa pedidos abertos
- ✅ Cria N pedidos automaticamente
- ✅ Intervalo configurável entre pedidos
- ✅ Mostra sucesso/falha de cada pedido

**Use quando:**
- Quer ver o sistema "respirando" automaticamente
- Precisa demonstrar para alguém
- Quer testar carga visual

---

## 🧪 Teste Automatizado

Executa cenário único e valida:

```bash
./scripts/visual-validation-test.sh
```

**O que faz:**
- ✅ Cria 1 pedido via RPC
- ✅ Valida no banco
- ✅ Testa constraint (uma mesa = um pedido)
- ✅ Fornece instruções de validação visual

**Use quando:**
- Quer validar que tudo está funcionando
- Precisa testar regra constitucional
- Quer verificar conexão UI → Core

---

## 🎛️ Torre de Controle (Dashboard)

Após subir o sistema, acesse:

**URL:** http://localhost:5175/app/dashboard

**O que mostra:**
- 🎛️ **Control Tower Widget**: Status de todos os periféricos
  - TPV (Web) - Conectado/Desconectado
  - KDS (Web) - Conectado/Desconectado
  - Dashboard - Sempre conectado
  - Mobile iOS - Status (se detectado)
  - Mobile Android - Status (se detectado)
- 🚨 **Active Issues Widget**: Problemas ativos
  - Pedidos atrasados
  - Dispositivos offline
  - Estado geral do restaurante

**Use para:**
- Ver todos os periféricos de uma vez
- Identificar qual não está "escutando o Core"
- Monitorar estado do sistema em tempo real

---

## 📋 Fluxo Completo Recomendado

### 1. Preparar Ambiente
```bash
./scripts/visual-validation-orchestrator.sh
```

### 2. Abrir Navegador
Abra 3 abas:
- Dashboard: http://localhost:5175/app/dashboard
- TPV: http://localhost:5175/app/tpv
- KDS: http://localhost:5175/app/kds/{restaurant_id}

### 3. (Opcional) Modo Demo
```bash
./scripts/demo-mode-automatic.sh --count=10 --interval=5
```

### 4. Observar
- ✅ TPV mostra pedidos
- ✅ KDS recebe em tempo real
- ✅ Dashboard atualiza métricas
- ✅ Torre de Controle mostra status

---

## 🛑 Parar Tudo

```bash
# Parar Merchant Portal
kill $(cat /tmp/merchant-portal.pid)

# Parar Supabase (se necessário)
supabase stop
```

---

## ❓ Troubleshooting

### "Merchant Portal já está rodando"
```bash
# Matar processo na porta 5175
lsof -ti:5175 | xargs kill -9
```

### "Restaurante não encontrado"
```bash
npx ts-node scripts/setup-pilot-restaurant.ts
```

### "Supabase não está rodando"
```bash
supabase start
```

---

## 💡 Dicas

1. **Deixe todas as abas abertas lado a lado** para ver tudo simultaneamente
2. **Use o modo demo** para ver o sistema "respirando" automaticamente
3. **Monitore a Torre de Controle** para identificar periféricos desconectados
4. **Crie um pedido manualmente** no TPV e observe todos os pontos atualizarem

---

*"Um comando. Tudo sobe. Sistema respira. Você observa."*
