# ✅ ENGINEERING SETUP — TODOS OS IDEs

**Data:** 2026-01-23  
**Status:** 🟢 Setup Completo para Cursor, VS Code e Antigravity

---

## 📍 LOCALIZAÇÃO DOS ARQUIVOS

### Cursor

**Localização:** `~/.cursor/`

- ✅ `ENGINEERING_CONSTITUTION.md` - Constituição global
- ✅ `ENGINEERING_CONSTITUTION_PROMPT.md` - Prompt base
- ✅ `PROJECT_TEMPLATE.md` - Template de projeto
- ✅ `README_ENGINEERING.md` - Guia de uso

### VS Code

**Localização:** `~/.vscode/`

- ✅ `ENGINEERING_CONSTITUTION.md` - Constituição global
- ✅ `VSCODE_ENGINEERING_SETUP.md` - Configurações (settings, tasks, extensions)
- ✅ `PROJECT_TEMPLATE.md` - Template de projeto

### Antigravity

**Localização:** `~/.antigravity/`

- ✅ `ENGINEERING_CONSTITUTION.md` - Constituição global
- ✅ `ANTIGRAVITY_ENGINEERING_SETUP.md` - Configurações de auditoria
- ✅ `PROJECT_TEMPLATE.md` - Template de projeto

---

## 🚀 COMO USAR

### Para Novos Projetos

**Opção 1: Script Automatizado (Recomendado)**

```bash
# Cursor
./scripts/setup-new-project.sh cursor /caminho/do/novo/projeto

# VS Code
./scripts/setup-new-project.sh vscode /caminho/do/novo/projeto

# Antigravity
./scripts/setup-new-project.sh antigravity /caminho/do/novo/projeto
```

**Opção 2: Manual**

1. **Copiar constituição:**
   ```bash
   cp ~/.cursor/ENGINEERING_CONSTITUTION.md /novo/projeto/
   ```

2. **Configurar IDE específico:**
   - **Cursor:** Copiar `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` para `.cursor/`
   - **VS Code:** Copiar configurações de `~/.vscode/VSCODE_ENGINEERING_SETUP.md` para `.vscode/`
   - **Antigravity:** Configurar auditoria baseado em `~/.antigravity/ANTIGRAVITY_ENGINEERING_SETUP.md`

3. **Criar regras específicas:**
   - Criar `docs/PROJECT_ENGINEERING_RULES.md`
   - Apenas exceções/adaptações, não repetir regras globais

---

## 🔧 CONFIGURAÇÃO POR IDE

### Cursor

**Adicionar como contexto permanente:**
- `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md`

**Como fazer:**
1. Cursor Settings → Context
2. Adicionar `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md`

### VS Code

**Configurar:**
1. Copiar `.vscode/settings.json` de `~/.vscode/VSCODE_ENGINEERING_SETUP.md`
2. Copiar `.vscode/tasks.json` de `~/.vscode/VSCODE_ENGINEERING_SETUP.md`
3. Copiar `.vscode/extensions.json` de `~/.vscode/VSCODE_ENGINEERING_SETUP.md`
4. Instalar extensões recomendadas

### Antigravity

**Usar para:**
- Auditoria de commits
- Detecção de violações
- Avaliação de riscos

**Não usar para:**
- Desenvolvimento diário
- Edição de código

---

## ✅ STATUS

- ✅ Cursor: Configurado
- ✅ VS Code: Configurado
- ✅ Antigravity: Configurado
- ✅ Script de setup: Criado

---

**SETUP COMPLETO:** 2026-01-23
