#!/bin/bash

# 🚀 SETUP NEW PROJECT — ENGINEERING CONSTITUTION
# Uso: ./scripts/setup-new-project.sh [IDE] [project-path]
# IDE: cursor, vscode, antigravity

set -e

IDE=${1:-cursor}
PROJECT_PATH=${2:-.}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 SETUP NEW PROJECT — $IDE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_PATH"

# Criar estrutura básica
mkdir -p archive/{code,docs,scripts}
mkdir -p docs/architecture
mkdir -p scripts

# Copiar constituição base
if [ -f ~/.cursor/ENGINEERING_CONSTITUTION.md ]; then
    cp ~/.cursor/ENGINEERING_CONSTITUTION.md .
    echo "✅ Constituição copiada"
fi

# Setup específico por IDE
case $IDE in
    cursor)
        mkdir -p .cursor
        if [ -f ~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md ]; then
            cp ~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md .cursor/
            echo "✅ Prompt Cursor copiado"
        fi
        ;;
    vscode)
        mkdir -p .vscode
        if [ -f ~/.vscode/VSCODE_ENGINEERING_SETUP.md ]; then
            echo "📋 Copie configurações de ~/.vscode/VSCODE_ENGINEERING_SETUP.md para .vscode/"
        fi
        ;;
    antigravity)
        mkdir -p .antigravity
        if [ -f ~/.antigravity/ANTIGRAVITY_ENGINEERING_SETUP.md ]; then
            echo "📋 Configure auditoria baseado em ~/.antigravity/ANTIGRAVITY_ENGINEERING_SETUP.md"
        fi
        ;;
esac

# Criar PROJECT_ENGINEERING_RULES.md template
cat > docs/PROJECT_ENGINEERING_RULES.md << 'EOF'
# PROJETO — REGRAS DE ENGENHARIA

**Status:** ATIVO  
**Data:** $(date +%Y-%m-%d)  
**Projeto:** [NOME DO PROJETO]

> **Este documento declara como este projeto aplica a `ENGINEERING_CONSTITUTION.md` global.**

---

## 📚 CONSTITUIÇÃO GLOBAL

**Referência obrigatória:** `~/.cursor/ENGINEERING_CONSTITUTION.md` (ou `ENGINEERING_CONSTITUTION.md` se copiado)

Todas as regras da constituição global se aplicam. Este documento só declara **exceções e adaptações específicas**.

---

## 🛠️ STACK DO PROJETO

- [Definir stack aqui]

---

## 📁 ESTRUTURA DE PASTAS

- [Definir estrutura aqui]

---

## 🔐 AUTORIDADES DECLARADAS

- [Listar autoridades específicas, ex: DATABASE_AUTHORITY.md]

---

## 🤖 SCRIPTS OFICIAIS

- [Listar scripts oficiais]

---

## ⚠️ EXCEÇÕES À CONSTITUIÇÃO GLOBAL

- [Listar exceções, se houver]

---

**ÚLTIMA ATUALIZAÇÃO:** $(date +%Y-%m-%d)
EOF

echo "✅ PROJECT_ENGINEERING_RULES.md criado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP CONCLUÍDO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Próximos passos:"
echo "1. Editar docs/PROJECT_ENGINEERING_RULES.md"
echo "2. Configurar scripts básicos (lint, typecheck, test, build)"
echo "3. Configurar $IDE específico"
