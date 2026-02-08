# 🎯 Central de Comando do ChefIApp

**Sistema Nervoso Visível do Restaurant Operating System**

O Central de Comando é o monitor supremo que integra todas as camadas de monitoramento do ChefIApp em uma interface unificada.

## 🚀 Início Rápido

```bash
./scripts/teste-massivo-nivel-5/central-comando/start.sh
```

Ou diretamente:

```bash
npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
```

Acesse: **http://localhost:4321**

## 📊 Modos de Visualização

### 🧪 Modo Laboratório
- **URL**: `http://localhost:4321?mode=laboratory`
- **Atualização**: 1 segundo
- **Foco**: Testes massivos, progresso granular, diagnóstico técnico
- **Uso**: Engenheiros, QA, DevOps

### 🧠 Modo Operacional
- **URL**: `http://localhost:4321?mode=operational`
- **Atualização**: 5 segundos
- **Foco**: Saúde do sistema, alertas, ação imediata
- **Uso**: SRE, DevOps, Suporte Técnico

### 👔 Modo Executivo
- **URL**: `http://localhost:4321?mode=executive`
- **Atualização**: 15 segundos
- **Foco**: SLA global, restaurantes em risco, métricas de negócio
- **Uso**: C-Level, Account Managers, Clientes Enterprise

### ⚖️ Modo Auditoria
- **URL**: `http://localhost:4321?mode=audit`
- **Atualização**: Sob demanda
- **Foco**: Cadeia de eventos, provas de execução, compliance
- **Uso**: Auditores, Compliance, Legal

## 🔹 Camadas Monitoradas

1. **Infraestrutura (Docker/Host)**
   - Containers, CPU, RAM, IO, Network
   - Healthchecks, restart loops

2. **Banco de Dados (Postgres)**
   - TPS, locks, slow queries
   - Event store, integridade

3. **Event System**
   - Taxa de eventos, tipos
   - Eventos bloqueantes, processamento

4. **Task Engine**
   - Tasks criadas/resolvidas
   - SLA, hard-blocks

5. **Operação (Restaurantes)**
   - Status, pedidos, KDS, estoque

6. **Usuários & Dispositivos**
   - Usuários ativos, dispositivos
   - Concorrência

## 📁 Estrutura

```
central-comando/
├── index.ts                 # Servidor principal
├── collectors/              # Coletores de métricas
│   ├── infrastructure.ts    # Docker/Host
│   ├── database.ts          # Postgres
│   ├── events.ts            # Event System
│   ├── tasks.ts             # Task Engine
│   ├── operation.ts         # Restaurantes
│   └── users.ts             # Usuários/Dispositivos
├── views/                   # Sistema de visões
│   └── index.ts             # Configurações de modos
├── ui/                      # Interface
│   └── html.ts              # Gerador de HTML
└── test-progress.ts         # Progresso de testes
```

## 🎯 Características

- ✅ **6 Camadas de Monitoramento** completas
- ✅ **4 Modos de Visualização** (Laboratório, Operacional, Executivo, Auditoria)
- ✅ **Alertas em Tempo Real** (Críticos, Avisos, Info)
- ✅ **Progresso Granular** de testes
- ✅ **Métricas Agregadas** por restaurante/região
- ✅ **Interface Moderna** e responsiva

## 🔧 API

### Endpoint de Métricas

```bash
curl http://localhost:4321/api/metrics?mode=operational
```

Retorna JSON com todas as métricas coletadas.

## 📝 Notas

- O monitor coleta métricas em tempo real de todas as camadas
- Alertas são gerados automaticamente baseados em thresholds
- Cada modo mostra apenas as métricas relevantes
- Atualização automática configurável por modo

## 🚨 Troubleshooting

**Porta 4321 em uso:**
```bash
pkill -f "central-comando"
pkill -f "monitor-web"
```

**Erro de conexão com banco:**
- Verifique se Docker Core está rodando
- Verifique variáveis de ambiente de conexão

**Métricas não aparecem:**
- Verifique logs do servidor
- Algumas métricas requerem permissões específicas (Docker stats)

---

**Versão:** 1.0  
**Status:** ✅ Implementado e Funcional
