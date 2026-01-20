# 🚀 Onboarding para Desenvolvedores Externos

**Bem-vindo ao ChefIApp POS Core!** Este guia te ajudará a começar rapidamente.

---

## 📋 Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- Git
- Conta Supabase (para desenvolvimento)

---

## 🛠️ Setup Inicial

### 1. Clone o Repositório

```bash
git clone https://github.com/goldmonkey/chefiapp-pos-core.git
cd chefiapp-pos-core
```

### 2. Instale Dependências

```bash
npm install
```

### 3. Configure Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:
- `DATABASE_URL`: URL do PostgreSQL
- `SUPABASE_URL`: URL do Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase

### 4. Execute Migrations

```bash
npm run migrate
```

### 5. Inicie o Servidor

```bash
# Backend
npm run dev:server

# Frontend (em outro terminal)
npm run dev:portal
```

---

## 📚 Estrutura do Projeto

```
chefiapp-pos-core/
├── merchant-portal/     # Frontend (React/Vite)
│   ├── src/
│   │   ├── pages/      # Páginas
│   │   ├── core/       # Lógica core
│   │   └── ui/         # Componentes UI
│   └── package.json
├── server/              # Backend (Node.js)
│   ├── web-module-api-server.ts
│   └── ...
├── supabase/            # Migrations
│   └── migrations/
├── tests/               # Testes
└── docs/                # Documentação
```

---

## 🧭 Conceitos Fundamentais

### Truth First

O sistema segue o princípio **"Truth First"**:
- A UI é uma **consequência** da verdade (DB)
- Nunca antecipe, nunca minta
- Estado flui de `Core` → `UI`

### Canon (6 Immutable Laws)

O sistema AppStaff segue 6 leis imutáveis:
1. **Tool Sovereignty**: Ferramenta > Tarefa
2. **Reflex**: Sistema > Humano
3. **Temporal Memory**: Inatividade ≠ Zero
4. **Cognitive Isolation**: Cada papel vê apenas seu mundo
5. **Non-Blocking**: Informação orbita trabalho
6. **Progressive Externalization**: Trabalho migra para especialistas

---

## 🔑 Pontos de Entrada

### Frontend

- **Entry Point:** `merchant-portal/src/App.tsx`
- **Routing:** React Router DOM
- **State:** React Context + Hooks
- **Styling:** Tailwind CSS

### Backend

- **Entry Point:** `server/web-module-api-server.ts`
- **Database:** PostgreSQL via Supabase
- **API:** REST endpoints

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- orders.test.ts

# Coverage
npm test -- --coverage
```

### Escrever Testes

Veja exemplos em:
- `tests/unit/` - Testes unitários
- `tests/integration/` - Testes de integração
- `tests/playwright/` - Testes E2E

---

## 📖 Documentação Adicional

- **[README.md](../README.md)** - Visão geral
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Guia de contribuição
- **[API.md](../API.md)** - Documentação de APIs
- **[SYSTEM_TRUTH_CODEX.md](../SYSTEM_TRUTH_CODEX.md)** - Doutrina Truth First
- **[CANON.md](../CANON.md)** - 6 Immutable Laws

---

## 🐛 Debugging

### Frontend

1. Abra DevTools (F12)
2. Veja console para logs
3. Use React DevTools para inspecionar estado

### Backend

1. Logs no console do servidor
2. Verifique `app_logs` no Supabase
3. Use `structuredLogger` para logs estruturados

---

## ❓ Dúvidas Comuns

### "Como adiciono uma nova feature?"

1. Crie uma branch: `git checkout -b feature/nome`
2. Desenvolva seguindo padrões
3. Adicione testes
4. Crie PR

### "Onde encontro exemplos?"

- Veja código existente em `merchant-portal/src/pages/`
- Consulte testes em `tests/`
- Veja documentação em `docs/`

### "Como reporto um bug?"

1. Abra uma issue no GitHub
2. Use o template "Bug Report"
3. Inclua passos para reproduzir

---

## 🎯 Próximos Passos

1. ✅ Setup completo
2. ✅ Leia [CONTRIBUTING.md](../CONTRIBUTING.md)
3. ✅ Explore o código
4. ✅ Execute testes
5. ✅ Faça sua primeira contribuição!

---

**Bem-vindo à equipe! 🎉**
