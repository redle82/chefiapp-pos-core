# 🏗️ Arquitetura Visual - Sistema Nervoso Operacional

**Diagramas e fluxos do sistema**

---

## 🧠 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CHEFIAPP POS                              │
│              Sistema Nervoso Operacional                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   FAST PAY   │   │  MAPA VIVO   │   │ KDS INTELIG. │
│  (2 toques)  │   │  (Sensor)    │   │  (Adapta)    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ RESERVAS LITE│
                    │  (Lista)     │
                    └──────────────┘
```

---

## 💰 Fluxo: Fast Pay

```
┌─────────┐
│  Garçom │
│  toca   │
│  mesa   │
└────┬────┘
     │
     ▼
┌──────────────┐
│ BottomSheet  │
│ "Cobrar Tudo"│
└────┬─────────┘
     │
     ▼
┌──────────────┐      ┌──────────────┐
│ FastPayButton│ ────▶│ Confirmação  │
│ (1º toque)   │      │ (2º toque)   │
└────┬─────────┘      └────┬─────────┘
     │                     │
     │                     ▼
     │            ┌──────────────┐
     │            │ quickPay()   │
     │            │ (processa)   │
     │            └────┬─────────┘
     │                 │
     │                 ▼
     │            ┌──────────────┐
     │            │ updateStatus │
     │            │ ('paid')     │
     │            └────┬─────────┘
     │                 │
     └─────────────────┘
              │
              ▼
     ┌──────────────┐
     │ Mesa Fechada │
     │ (< 5s total) │
     └──────────────┘
```

---

## 🗺️ Fluxo: Mapa Vivo

```
┌──────────────┐
│   Pedidos    │
│  (Context)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  TableCard   │
│  (por mesa)  │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Timer      │  │   Cores      │
│ (1s update)  │  │ (Urgência)   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 ├─── Verde (< 15min)
       │                 ├─── Amarelo (15-30min)
       │                 └─── Vermelho (> 30min)
       │
       ▼
┌──────────────┐
│   Ícones     │
│ (Contextuais)│
└──────┬───────┘
       │
       ├─── 💰 "Quer pagar" (delivered)
       └─── 🍷 "Esperando bebida" (drink preparing)
```

---

## 🍽️ Fluxo: KDS Inteligente

```
┌──────────────┐
│   Pedidos    │
│  (preparing) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│useKitchen    │
│Pressure()    │
└──────┬───────┘
       │
       ├─── Conta pedidos
       ├─── Detecta saturação
       └─── Calcula pressão
       │
       ▼
┌──────────────┐
│   Pressure   │
│  (low/med/hi)│
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Banner     │  │   Menu       │
│ (Indicator)  │  │  (Filtro)    │
└──────────────┘  └──────┬───────┘
                         │
                         ├─── Se high: esconde pratos lentos
                         └─── Prioriza bebidas
```

---

## 📋 Fluxo: Reservas LITE

```
┌──────────────┐
│   Garçom     │
│  adiciona    │
│  cliente     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ WaitlistBoard│
│  (Modal)     │
└──────┬───────┘
       │
       ├─── Nome + Hora
       │
       ▼
┌──────────────┐
│ Persistence  │
│  (Save)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AsyncStorage │
│  (Local)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Atribuir    │
│   Mesa       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ setActive    │
│ Table()      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Mesa Ativa   │
│ (Pronta)     │
└──────────────┘
```

---

## 🔄 Fluxo Completo: Cliente Chega até Pagar

```
1. CLIENTE CHEGA
   │
   ▼
2. Adicionar à Lista de Espera
   │
   ▼
3. Mesa Fica Livre → Atribuir Mesa
   │
   ▼
4. Garçom Abre Mesa → Fazer Pedido
   │
   ▼
5. Pedido Vai para Cozinha
   │
   ├─── Se cozinha saturada:
   │    └─── Menu esconde pratos lentos
   │
   ▼
6. Cozinha Prepara → Status "ready"
   │
   ▼
7. Garçom Entrega → Status "delivered"
   │
   ├─── Mapa mostra ícone 💰 "quer pagar"
   │
   ▼
8. Cliente Quer Pagar
   │
   ▼
9. Garçom Toca Mesa → "Cobrar Tudo"
   │
   ▼
10. 2 Toques → Pagamento Processado (< 5s)
    │
    ▼
11. Mesa Fecha Automaticamente
    │
    ▼
12. Mesa Livre (Pronta para próximo)
```

---

## 🧩 Componentes e Dependências

```
┌─────────────────────────────────────────┐
│           OrderContext                  │
│  (Estado global de pedidos)            │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Tables │ │ Orders │ │  Menu  │
│ Screen │ │ Screen │ │ Screen │
└────────┘ └────────┘ └────────┘
    │          │          │
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│FastPay │ │FastPay │ │Kitchen │
│Button  │ │Button  │ │Pressure│
└────────┘ └────────┘ └────────┘
```

---

## 📊 Estados do Sistema

### Estado: Normal
```
Cozinha: Low (< 5 pedidos)
Menu: Todos os pratos visíveis
Mapa: Maioria verde
Ação: Operação normal
```

### Estado: Atenção
```
Cozinha: Medium (5-10 pedidos)
Menu: Todos os pratos visíveis
Mapa: Algumas mesas amarelas
Ação: Monitorar, priorizar urgências
```

### Estado: Crítico
```
Cozinha: High (> 10 pedidos)
Menu: Apenas bebidas e rápidos
Mapa: Muitas mesas vermelhas
Ação: Priorizar bebidas, acelerar pagamentos
```

---

## 🔌 Integrações

```
┌──────────────┐
│   ChefIApp   │
└──────┬───────┘
       │
       ├─── Supabase (Database + Realtime)
       │    ├─── Pedidos
       │    ├─── Mesas
       │    └─── Pagamentos
       │
       ├─── AsyncStorage (Local)
       │    ├─── Lista de Espera
       │    └─── Cache
       │
       └─── PrinterService (Hardware)
            ├─── Tickets
            └─── Receipts
```

---

## 🎯 Decisões em Tempo Real

```
┌──────────────┐
│   Evento     │
│  (Pedido)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Sistema     │
│  Analisa     │
└──────┬───────┘
       │
       ├─── Quantos pedidos preparando?
       ├─── Quanto tempo na mesa?
       ├─── Qual status do pedido?
       │
       ▼
┌──────────────┐
│  Decisão     │
│  Automática  │
└──────┬───────┘
       │
       ├─── Esconder pratos lentos?
       ├─── Mostrar urgência no mapa?
       ├─── Priorizar bebidas?
       │
       ▼
┌──────────────┐
│   Ação       │
│  (Guia)      │
└──────────────┘
```

---

## 📱 Telas e Navegação

```
┌─────────────────┐
│   Tab Bar       │
├─────────────────┤
│ 🍽️ Menu        │ ← KDS influencia aqui
│ 🗺️ Mesas        │ ← Mapa vivo aqui
│ 📋 Pedidos      │ ← Fast pay aqui
│ 👨‍🍳 Cozinha     │
│ ⚙️ Config       │
└─────────────────┘
```

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
