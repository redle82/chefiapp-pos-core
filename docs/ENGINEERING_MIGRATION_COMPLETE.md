# ✅ MIGRAÇÃO PARA LOCALIZAÇÃO GLOBAL — COMPLETA

**Data:** 2026-01-23  
**Status:** 🟢 Migração Concluída

---

## 📍 LOCALIZAÇÃO ATUAL

### Arquivos Globais (Reutilizáveis)

**Localização:** `~/.cursor/`

- ✅ `ENGINEERING_CONSTITUTION.md` - Constituição global
- ✅ `ENGINEERING_CONSTITUTION_PROMPT.md` - Prompt para Cursor
- ✅ `PROJECT_TEMPLATE.md` - Template de projeto
- ✅ `README_ENGINEERING.md` - Guia de uso

### Arquivos do Projeto (Específicos)

**Localização:** `chefiapp-pos-core/`

- ✅ `docs/PROJECT_ENGINEERING_RULES.md` - Regras específicas do ChefIApp
- ⚠️ `ENGINEERING_CONSTITUTION.md` - Referência local (aponta para global)
- ⚠️ `.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` - Referência local (aponta para global)

---

## 🎯 COMO USAR AGORA

### Para Este Projeto (ChefIApp)

**Referenciar:**
- Constituição: `~/.cursor/ENGINEERING_CONSTITUTION.md`
- Regras específicas: `docs/PROJECT_ENGINEERING_RULES.md`

### Para Novos Projetos

1. **Copiar constituição (opcional):**
   ```bash
   cp ~/.cursor/ENGINEERING_CONSTITUTION.md /novo/projeto/
   ```

2. **Criar regras específicas:**
   - Criar `docs/PROJECT_ENGINEERING_RULES.md`
   - Referenciar `~/.cursor/ENGINEERING_CONSTITUTION.md`

3. **Copiar prompt (opcional):**
   ```bash
   cp ~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md /novo/projeto/.cursor/
   ```

### Para Cursor

**Adicionar como contexto permanente:**
- `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md`

---

## ✅ STATUS

- ✅ Arquivos copiados para `~/.cursor/`
- ✅ Referências atualizadas no projeto
- ✅ Documentação criada
- ✅ Estrutura pronta para reutilização

---

**MIGRAÇÃO COMPLETA:** 2026-01-23
