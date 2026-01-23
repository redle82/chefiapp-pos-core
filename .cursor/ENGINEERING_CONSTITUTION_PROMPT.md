# ENGINEERING CONSTITUTION — CURSOR PROMPT BASE

**Status:** ⚠️ REFERÊNCIA — Use versão global  
**Localização Global:** `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md`

**Uso:** Adicionar como contexto permanente no Cursor  
**Objetivo:** Garantir que todas as interações sigam a constituição de engenharia

---

## 📚 VERSÃO OFICIAL

**Use:** `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` (global)

Este arquivo é apenas uma referência local. A versão oficial está em `~/.cursor/`.

---

## 🛑 REGRAS OBRIGATÓRIAS (SEMPRE APLICAR)

### Antes de Qualquer Ação

1. **Sempre exigir commit após ação lógica relevante**
   - Bug fix → commit
   - Refactor → commit
   - Feature mínima → commit
   - Config crítica → commit

2. **Sempre pedir testes antes de considerar "pronto"**
   - App abre?
   - Feature funciona?
   - Não quebrou nada?

3. **Sempre sugerir script ao invés de processo manual**
   - Se existe script, usar script
   - Se não existe, considerar criar

4. **Sempre perguntar "isso quebra performance?"**
   - Antes de adicionar dependência pesada
   - Antes de loop complexo
   - Antes de query sem índice

5. **Sempre respeitar autoridade declarada**
   - Se existe `DATABASE_AUTHORITY.md` → seguir
   - Se existe `*_AUTHORITY.md` → seguir
   - Não sugerir violar autoridade sem motivo explícito

### Durante Implementação

6. **Sempre seguir ciclo obrigatório:**
   - Pensar → Implementar → Testar → Validar → Commit → Documentar

7. **Sempre verificar se código morto deve ir para `archive/`**
   - Não deletar sem arquivar primeiro
   - Não tocar em legado sem motivo

8. **Sempre considerar higiene do repositório**
   - Documento obsoleto → `archive/docs/`
   - Script one-shot → `archive/scripts/`

### Após Implementação

9. **Sempre atualizar documentação se impacta arquitetura**
   - Atualizar índices
   - Atualizar "fonte da verdade" se necessário

10. **Sempre verificar checklist antes de commit:**
    - Código funciona?
    - Testei?
    - Typecheck passa?
    - Lint passa?

---

## 🚫 NUNCA FAZER

- ❌ Sugerir trabalhar >2h sem commit
- ❌ Sugerir "depois eu testo"
- ❌ Sugerir deletar código sem arquivar
- ❌ Sugerir violar autoridade declarada
- ❌ Sugerir processo manual se existe script
- ❌ Sugerir atalho que quebra performance

---

## ✅ SEMPRE SUGERIR

- ✅ Commit após ação relevante
- ✅ Teste antes de considerar pronto
- ✅ Script ao invés de manual
- ✅ Arquivo ao invés de deletar
- ✅ Documentar mudanças arquiteturais
- ✅ Verificar checklist antes de commit

---

## 🎯 CONTEXTO DO PROJETO

**Se o projeto tem:**
- `DATABASE_AUTHORITY.md` → Respeitar regras do banco
- `PROJECT_ENGINEERING_RULES.md` → Seguir regras específicas
- Scripts oficiais → Usar scripts oficiais

**Se o projeto não tem:**
- Aplicar constituição global
- Sugerir criar regras específicas se necessário

---

## 📋 EXEMPLOS DE APLICAÇÃO

### Exemplo 1: Bug Fix

**Ação:**
1. Identificar bug
2. Corrigir código
3. Testar localmente
4. Rodar typecheck/lint
5. **Commit com mensagem:** `fix: descrição do bug`
6. Verificar se precisa documentar

### Exemplo 2: Nova Feature

**Ação:**
1. Pensar (1-5 min): o que, onde, impacto
2. Implementar
3. Testar localmente
4. Validar (typecheck, lint, build)
5. **Commit com mensagem:** `feat: descrição da feature`
6. Documentar se impacta arquitetura

### Exemplo 3: Refactor

**Ação:**
1. Identificar código a refatorar
2. Refatorar mantendo funcionalidade
3. Testar que não quebrou nada
4. Validar
5. **Commit com mensagem:** `refactor: descrição do refactor`
6. Documentar se mudou arquitetura

---

**Este prompt deve ser aplicado em TODAS as interações de desenvolvimento.**
