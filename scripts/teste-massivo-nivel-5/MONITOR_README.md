# 📊 Monitor em Tempo Real - Teste Massivo Nível 5

## 🎯 O que faz

Monitor visual em tempo real que mostra:

- ✅ **Barra de progresso** de cada fase
- ⏱️ **Tempo decorrido** desde o início
- 📊 **Estatísticas do banco de dados** (restaurantes, mesas, pedidos, etc.)
- 🔄 **Fase atual** em execução
- 📈 **Progresso geral** do teste

## 🚀 Como usar

### Opção 1: Executar o monitor separadamente

Em um terminal separado (enquanto o teste roda):

```bash
./scripts/teste-massivo-nivel-5/monitor.sh
```

### Opção 2: Executar diretamente

```bash
npx tsx scripts/teste-massivo-nivel-5/monitor-tempo-real.ts
```

## 📺 O que você verá

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          📊 MONITOR EM TEMPO REAL - TESTE MASSIVO NÍVEL 5                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

🔍 Run ID: abc123-def456-...
⏱️  Tempo decorrido: 1h 23m 45s
📈 Progresso geral: [████████████████████████████████████░░░░░░░░░░░░░░░░░░] 60%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FASES DO TESTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ FASE 0: Preflight                    [████████████████████] 11% (2s)
✅ FASE 1: Setup Massivo                 [████████████████████] 22% (5m 30s)
🔄 FASE 2: Pedidos Caos                  [████████████████████] 33% (executando...)
⏳ FASE 3: KDS Stress                    [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ FASE 4: Task Extreme                  [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ FASE 5: Estoque Cascata               [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ FASE 6: Multi-Dispositivo             [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ FASE 7: Time Warp                     [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ FASE 8: Relatório Final               [░░░░░░░░░░░░░░░░░░░░] 0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ESTATÍSTICAS DO BANCO DE DADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 Restaurantes: 1,000 / 1,000 [████████████████████████████████] 100%
🪑 Mesas:        18,500 / 27,850 [████████████████████████░░░░░░] 66%
📦 Pedidos:      250,000 / 500,000 [████████████████░░░░░░░░░░░░] 50%
👥 Pessoas:      8,500 / 12,000 [████████████████████████░░░░░░] 71%
✅ Tarefas:      45,230
📦 Estoque:      125,000

🔄 Fase atual: FASE 2: Pedidos Caos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Pressione Ctrl+C para sair
```

## 🔧 Requisitos

- Docker Core rodando (`chefiapp-core-postgres`)
- Teste em execução (ou já executado)

## 📝 Notas

- O monitor atualiza a cada **1 segundo**
- Funciona mesmo se o teste já terminou (mostra status final)
- Pressione **Ctrl+C** para sair
- Não interfere no teste em execução

## 🎨 Cores e ícones

- ✅ **Verde**: Fase completa
- 🔄 **Ciano**: Fase em execução
- ⏳ **Cinza**: Fase pendente
- ❌ **Vermelho**: Fase falhou
