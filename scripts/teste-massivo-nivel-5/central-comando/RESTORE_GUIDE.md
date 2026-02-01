# 🔄 GUIA DE RESTAURAÇÃO - Central de Comando

Este guia permite restaurar o Central de Comando para o estado validado em caso de quebras.

---

## 🚨 RESTAURAÇÃO RÁPIDA (Emergência)

### 1. Parar processos corretamente
```bash
# Parar Central de Comando
pkill -f "tsx.*central-comando/index.ts"

# Liberar porta 4321
lsof -ti:4321 | xargs kill -9 2>/dev/null
```

### 2. Verificar arquivos críticos
```bash
cd /path/to/chefiapp-pos-core

# Verificar se arquivos existem
ls -la scripts/teste-massivo-nivel-5/central-comando/index.ts
ls -la scripts/teste-massivo-nivel-5/central-comando/test-progress.ts
ls -la scripts/teste-massivo-nivel-5/central-comando/ui/html.ts
```

### 3. Reiniciar Central
```bash
cd scripts/teste-massivo-nivel-5/central-comando
npx tsx index.ts
```

### 4. Verificar funcionamento
```bash
# Testar endpoint principal
curl http://localhost:4321/

# Testar SSE
curl http://localhost:4321/stream/test-progress | head -3
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Problema: Central não inicia

**Verificar:**
1. Porta 4321 está livre? `lsof -i:4321`
2. Dependências instaladas? `npm list tsx pg`
3. Docker está rodando? `docker ps`
4. Banco está acessível? `psql -h localhost -U chefiapp -d chefiapp_core -c "SELECT 1"`

**Solução:**
```bash
# Limpar porta
lsof -ti:4321 | xargs kill -9

# Reinstalar dependências (se necessário)
npm install

# Reiniciar
npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
```

### Problema: SSE não funciona

**Verificar:**
1. Modo é `laboratory` ou `operational`?
2. RBAC está bloqueando? (verificar tokens)
3. JavaScript está carregando? (F12 no browser)

**Solução:**
```bash
# Acessar em modo laboratory
open http://localhost:4321?mode=laboratory

# Verificar console do browser (F12)
# Deve aparecer: "[CENTRAL] Initializing SSE streams for mode: laboratory"
```

### Problema: Progresso não aparece

**Verificar:**
1. Teste está rodando? `ps aux | grep teste-massivo`
2. `progress.ndjson` existe? `ls test-results/NIVEL_5/*/progress.ndjson`
3. `getLatestRunId()` retorna algo? (ver logs do Central)

**Solução:**
```bash
# Verificar último run
find test-results/NIVEL_5 -name "progress.ndjson" -type f -mmin -10 | head -1

# Testar detecção manualmente
npx tsx -e "import { getLatestRunId } from './scripts/teste-massivo-nivel-5/central-comando/test-progress'; console.log(getLatestRunId());"
```

---

## 📋 CHECKLIST DE RESTAURAÇÃO COMPLETA

### Passo 1: Ambiente
- [ ] Docker Core rodando
- [ ] PostgreSQL acessível
- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)

### Passo 2: Arquivos
- [ ] `central-comando/index.ts` existe
- [ ] `central-comando/test-progress.ts` existe
- [ ] `central-comando/ui/html.ts` existe
- [ ] `central-comando/collectors/*.ts` existem
- [ ] `central-comando/views/index.ts` existe

### Passo 3: Configuração
- [ ] Porta 4321 livre
- [ ] Variáveis de ambiente (se RBAC habilitado)
- [ ] Diretório `test-results/NIVEL_5/` existe

### Passo 4: Inicialização
- [ ] Central inicia sem erros
- [ ] Logs mostram "CENTRAL DE COMANDO - ATIVO"
- [ ] `curl http://localhost:4321/` retorna HTML

### Passo 5: Funcionalidades
- [ ] Modo Laboratory carrega
- [ ] SSE test-progress conecta
- [ ] SSE docker-events conecta (se Docker rodando)
- [ ] Progresso aparece quando teste está rodando

---

## 🔧 RESTAURAÇÃO DE CÓDIGO (Git)

Se o código foi alterado incorretamente:

```bash
# Verificar mudanças
git diff scripts/teste-massivo-nivel-5/central-comando/

# Restaurar arquivo específico
git checkout HEAD -- scripts/teste-massivo-nivel-5/central-comando/index.ts

# OU restaurar tudo
git checkout HEAD -- scripts/teste-massivo-nivel-5/central-comando/
```

---

## 📦 BACKUP DE CONFIGURAÇÃO

Para fazer backup da configuração atual:

```bash
# Criar backup
tar -czf central-comando-backup-$(date +%Y%m%d).tar.gz \
  scripts/teste-massivo-nivel-5/central-comando/

# Restaurar backup
tar -xzf central-comando-backup-YYYYMMDD.tar.gz
```

---

## 🆘 CONTATO DE EMERGÊNCIA

Se nada funcionar:
1. Consultar `CONFIG_SNAPSHOT.md` para referência completa
2. Consultar `RULES.md` para regras críticas
3. Verificar logs do Central (console onde iniciou)
4. Verificar logs do teste (se aplicável)

---

**Última atualização:** 2026-01-27
