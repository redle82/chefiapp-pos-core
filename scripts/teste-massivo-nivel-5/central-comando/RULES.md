# 🎯 REGRAS DO CENTRAL DE COMANDO

## ⚠️ REGRAS CRÍTICAS (NUNCA VIOLAR)

### 1. **NUNCA usar `pkill` genérico**
- ❌ `pkill -f "tsx.*teste-massivo"` → mata processos incorretos
- ✅ Usar PIDs específicos ou scripts de gerenciamento dedicados
- ✅ Se precisar parar, usar Ctrl+C no processo específico

### 2. **Detecção de Run Ativo**
- O Central DEVE detectar o run mais recente automaticamente
- Se `runId` for `null`, o Central mostra "Nenhum teste ativo"
- O run é detectado pelo `mtime` do arquivo `progress.ndjson`
- Se o arquivo não existir ainda, aguardar até ser criado

### 3. **Atualização em Tempo Real**
- SSE (`/stream/test-progress`) atualiza a cada **1 segundo**
- HTML completo atualiza conforme o modo:
  - Laboratory: 1 segundo
  - Operational: 5 segundos
  - Executive: 15 segundos
  - Audit: sob demanda
- SSE e HTML refresh NÃO devem conflitar

### 4. **Ordem de Inicialização**
1. Docker Core deve estar rodando
2. Central de Comando inicia (porta 4321)
3. Teste Massivo inicia (cria `progress.ndjson`)
4. Central detecta automaticamente o novo run

### 5. **Flush de Progresso**
- O teste DEVE usar `fs.writeSync(1, ...)` para forçar flush
- Arquivo `progress.ndjson` DEVE ser escrito em tempo real
- Sem flush, o Central não vê atualizações

## 🔧 CORREÇÕES APLICADAS

### Problema: `runId` retornando `null`
**Causa**: Timing - `getLatestRunId()` chamado antes do arquivo existir
**Solução**: 
- Melhorar detecção para considerar arquivos recém-criados
- Adicionar fallback para runs em andamento
- Logs de debug para diagnóstico

### Problema: SSE não atualizando UI
**Causa**: JavaScript não estava processando eventos corretamente
**Solução**:
- Verificar se `EventSource` está conectado
- Garantir que `initTestProgressStream()` é chamado
- Adicionar tratamento de erro visível

## 📊 FLUXO DE DADOS

```
Teste Massivo
  ↓ (emitProgress)
progress.ndjson (escrito em tempo real)
  ↓ (getLatestRunId + getPhaseStatus)
Central de Comando
  ↓ (SSE /stream/test-progress)
Frontend (atualização em tempo real)
```

## 🚨 TROUBLESHOOTING

### Central não mostra progresso
1. Verificar se `progress.ndjson` existe: `ls -la test-results/NIVEL_5/*/progress.ndjson`
2. Verificar se run está ativo: `ps aux | grep teste-massivo`
3. Verificar SSE: `curl http://localhost:4321/stream/test-progress`
4. Verificar console do browser (F12) para erros JavaScript

### SSE não conecta
1. Verificar se Central está rodando: `curl http://localhost:4321/`
2. Verificar logs do Central (console onde iniciou)
3. Verificar se modo é `laboratory` ou `operational` (SSE só nesses modos)

### Progresso não atualiza
1. Verificar se `emitProgress` está sendo chamado no teste
2. Verificar se arquivo está sendo escrito: `tail -f test-results/NIVEL_5/*/progress.ndjson`
3. Verificar se `getLatestRunId()` retorna o run correto

## ✅ CHECKLIST ANTES DE REPORTAR PROBLEMA

- [ ] Docker Core está rodando?
- [ ] Central de Comando está rodando na porta 4321?
- [ ] Teste Massivo está rodando?
- [ ] Arquivo `progress.ndjson` existe e está sendo atualizado?
- [ ] SSE está conectado (verificar Network tab no browser)?
- [ ] Modo é `laboratory` ou `operational`?
- [ ] Console do browser não mostra erros?
