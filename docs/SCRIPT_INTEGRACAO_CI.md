# 🔄 Integração do Script de Abertura de Telas no CI/CD

## 📋 Resumo

O script `scripts/open_screens.mjs` foi integrado como **check obrigatório** em Pull Requests.

**Objetivo:** Garantir que todas as rotas principais continuem funcionando após mudanças.

---

## 🎯 Workflow GitHub Actions

### Arquivo: `.github/workflows/check-screens.yml`

**Quando executa:**
- ✅ Em Pull Requests para `main` ou `develop`
- ✅ Manualmente via `workflow_dispatch`

**O que faz:**
1. Instala dependências
2. Instala Playwright browsers
3. Inicia servidor Vite
4. Executa `scripts/open_screens.mjs`
5. Faz upload de screenshots e relatório
6. Falha se houver erros (404, etc.)

---

## ✅ Critérios de Sucesso

### PR é aprovado se:
- ✅ Todas as 17 telas carregam com sucesso
- ✅ Nenhuma rota retorna 404
- ✅ Nenhum erro de JavaScript no console
- ✅ Screenshots gerados corretamente

### PR é rejeitado se:
- ❌ Qualquer rota retorna 404
- ❌ Qualquer rota retorna erro de servidor
- ❌ Script falha ao executar

---

## 📊 Artifacts Gerados

### Screenshots
- **Localização:** `artifacts/screenshots/`
- **Formato:** PNG, full-page
- **Retenção:** 7 dias
- **Uso:** Comparação visual, auditoria

### Relatório
- **Localização:** `artifacts/screens_report.md`
- **Conteúdo:** Lista de telas, status, erros
- **Retenção:** 7 dias
- **Uso:** Análise de regressões

---

## 🧪 Como Testar Localmente

### Executar script manualmente
```bash
# Garantir que servidor está rodando
cd merchant-portal && npm run dev

# Em outro terminal
node scripts/open_screens.mjs
```

### Verificar resultado
```bash
# Ver relatório
cat artifacts/screens_report.md

# Ver screenshots
open artifacts/screenshots/
```

---

## 🔧 Configuração

### Variáveis de Ambiente
- `CI=true` - Modo CI (headless, não mantém navegador aberto)

### Timeouts
- **Servidor:** 60 segundos para iniciar
- **Página:** 30 segundos para carregar

### Rotas Verificadas
- 6 rotas Employee
- 6 rotas Manager
- 5 rotas Owner
- **Total:** 17 rotas

---

## 📝 Exemplo de Saída

### Sucesso
```
✅ All screens loaded successfully
- Total: 17
- Success: 17
- Errors: 0
```

### Falha
```
❌ Some screens failed to load
- Total: 17
- Success: 15
- Errors: 2
  - /employee/profile: 404
  - /owner/config: 404
```

---

## 🚀 Próximos Passos

### Melhorias Futuras
- [ ] Comparação visual de screenshots (regressões)
- [ ] Teste de acessibilidade básica
- [ ] Teste de performance (tempo de carregamento)
- [ ] Notificação no Slack/Discord em caso de falha

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Integrado no CI/CD
