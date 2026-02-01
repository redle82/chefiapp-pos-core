# 📑 ÍNDICE - Central de Comando ChefIApp

**Guia rápido de navegação da documentação**

---

## 🚀 INÍCIO RÁPIDO

1. **Primeira vez?** → Leia `README.md`
2. **Problema?** → Consulte `RESTORE_GUIDE.md`
3. **Mudanças?** → Consulte `CONFIG_SNAPSHOT.md` primeiro

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

### 1. `README.md` - Documentação Geral
- **Quando usar:** Primeira vez, visão geral
- **Conteúdo:**
  - Início rápido
  - Modos de visualização
  - Camadas monitoradas
  - Estrutura de arquivos

### 2. `CONFIG_SNAPSHOT.md` - Snapshot Completo
- **Quando usar:** Antes de fazer mudanças, referência técnica
- **Conteúdo:**
  - Estrutura completa de arquivos
  - Configurações críticas (portas, timeouts)
  - RBAC e modos de visualização
  - Fluxo de dados
  - Regras críticas (nunca violar)
  - Troubleshooting completo

### 3. `RESTORE_GUIDE.md` - Guia de Restauração
- **Quando usar:** Problemas, emergências, quebras
- **Conteúdo:**
  - Restauração rápida (emergência)
  - Diagnóstico de problemas comuns
  - Checklist de restauração completa
  - Backup e restauração via Git

### 4. `RULES.md` - Regras Operacionais
- **Quando usar:** Operação diária, evitar erros
- **Conteúdo:**
  - Regras críticas (nunca violar)
  - Fluxo de dados
  - Troubleshooting
  - Checklist antes de reportar problema

### 5. `VERSIONS.md` - Versões e Dependências
- **Quando usar:** Setup inicial, atualizações, compatibilidade
- **Conteúdo:**
  - Dependências Node.js
  - Dependências Docker
  - Dependências PostgreSQL
  - Navegadores suportados
  - Compatibilidade e alertas

---

## 🎯 FLUXO DE USO RECOMENDADO

### Cenário 1: Primeira Vez
```
README.md → start.sh → Testar → RULES.md
```

### Cenário 2: Problema/Quebra
```
RESTORE_GUIDE.md → Diagnóstico → Solução → CONFIG_SNAPSHOT.md (verificar)
```

### Cenário 3: Fazer Mudanças
```
CONFIG_SNAPSHOT.md → Entender estrutura → Fazer mudanças → Testar → Atualizar docs
```

### Cenário 4: Setup em Nova Máquina
```
VERSIONS.md → Instalar dependências → README.md → Testar
```

---

## 🔍 BUSCA RÁPIDA

### "Como iniciar?"
→ `README.md` (seção "Início Rápido")

### "Porta não funciona"
→ `RESTORE_GUIDE.md` (seção "Problema: Central não inicia")

### "SSE não conecta"
→ `RESTORE_GUIDE.md` (seção "Problema: SSE não funciona")

### "Progresso não aparece"
→ `RESTORE_GUIDE.md` (seção "Problema: Progresso não aparece")

### "Onde está a configuração da porta?"
→ `CONFIG_SNAPSHOT.md` (seção "Configurações Críticas")

### "Quais são as regras que não posso violar?"
→ `RULES.md` (seção "Regras Críticas")

### "Quais dependências preciso?"
→ `VERSIONS.md` (todas as seções)

### "Como restaurar código quebrado?"
→ `RESTORE_GUIDE.md` (seção "Restauração de Código")

---

## 📋 CHECKLIST DE MANUTENÇÃO

Antes de fazer mudanças:
- [ ] Ler `CONFIG_SNAPSHOT.md` completamente
- [ ] Verificar `RULES.md` para regras críticas
- [ ] Consultar `VERSIONS.md` para compatibilidade

Após fazer mudanças:
- [ ] Testar todos os modos
- [ ] Testar SSE
- [ ] Atualizar documentação relevante
- [ ] Verificar que não quebra regras críticas

---

## 🆘 EMERGÊNCIA

**Se nada funcionar:**
1. `RESTORE_GUIDE.md` → "Restauração Rápida"
2. `CONFIG_SNAPSHOT.md` → "Troubleshooting"
3. Verificar logs do Central (console)

---

**Última atualização:** 2026-01-27
