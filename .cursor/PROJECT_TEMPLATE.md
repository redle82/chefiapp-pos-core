# TEMPLATE DE PROJETO — ESTRUTURA PADRÃO

**Uso:** Copiar esta estrutura ao criar novo projeto  
**Objetivo:** Garantir organização consistente desde o início

---

## 📁 ESTRUTURA DE PASTAS

```
projeto/
├── .cursor/
│   └── ENGINEERING_CONSTITUTION_PROMPT.md (copiar do global)
├── archive/
│   ├── code/
│   ├── docs/
│   └── scripts/
├── docs/
│   ├── architecture/
│   │   └── DATABASE_AUTHORITY.md (se aplicável)
│   ├── audit/
│   └── PROJECT_ENGINEERING_RULES.md (regras específicas do projeto)
├── scripts/
│   └── (scripts oficiais)
└── README.md
```

---

## 📄 ARQUIVOS OBRIGATÓRIOS

### 1. `README.md`

**Conteúdo mínimo:**
- Nome do projeto
- Stack usada
- Como rodar localmente
- Link para `PROJECT_ENGINEERING_RULES.md`

### 2. `docs/PROJECT_ENGINEERING_RULES.md`

**Conteúdo:**
- Stack específica
- Onde ficam scripts oficiais
- Onde ficam docs
- Autoridades específicas (ex: `DATABASE_AUTHORITY.md`)
- Exceções à constituição global (se houver)

**❌ NÃO repetir regras globais**  
**✅ Só apontar referências e exceções**

### 3. `.cursor/ENGINEERING_CONSTITUTION_PROMPT.md`

**Ação:** Copiar de `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` (global)

---

## 🔧 CONFIGURAÇÕES PADRÃO

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/archive": false
  }
}
```

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Before Commit",
      "type": "shell",
      "command": "npm run lint && npm run typecheck",
      "problemMatcher": []
    }
  ]
}
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

---

## 📋 CHECKLIST DE CRIAÇÃO DE PROJETO

- [ ] Criar estrutura de pastas
- [ ] Copiar `~/.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` para `.cursor/` (opcional)
- [ ] Criar `docs/PROJECT_ENGINEERING_RULES.md` (referenciar `~/.cursor/ENGINEERING_CONSTITUTION.md`)
- [ ] Criar `README.md` básico
- [ ] Configurar `.vscode/` (se usar VS Code)
- [ ] Criar `archive/` com subpastas
- [ ] Configurar scripts básicos (lint, typecheck, test, build)

---

## 🎯 PRÓXIMOS PASSOS APÓS CRIAÇÃO

1. Definir stack e documentar em `PROJECT_ENGINEERING_RULES.md`
2. Criar scripts oficiais e documentar
3. Definir autoridades específicas (ex: banco, API, etc.)
4. Configurar CI/CD básico

---

**Este template garante que todo projeto nasce organizado.**
