# Demo Script 5 Minutos — ChefIApp POS Core

**Data:** 2026-01-28
**Status:** ✅ PRONTO
**Duração:** 5 minutos
**Objetivo:** Mostrar o diferencial técnico e arquitetural

---

## 🎯 Estrutura (5 min)

1. **System Tree** (1.5 min) — Mapa vivo do sistema
2. **Dashboard** (1 min) — Portal de módulos
3. **TPV v2** (1.5 min) — Novo POS PURE DOCKER
4. **Tasks** (1 min) — Sistema nervoso automático

---

## 1. System Tree — Mapa Vivo (1.5 min)

### O Que Dizer

**"ChefIApp não é só um POS. É um sistema operacional modular. A System Tree é o mapa vivo que mostra o que está instalado, bloqueado ou não disponível."**

### O Que Mostrar

1. **Abrir System Tree**

   - URL: `http://localhost:5175/system-tree`
   - Mostrar árvore visual completa

2. **Explicar Nós**

   - **Verde (instalado):** Módulo ativo e funcionando
   - **Amarelo (bloqueado):** Módulo disponível mas não instalado
   - **Cinza (não disponível):** Módulo não habilitado para este restaurante

3. **Mostrar Exemplo**

   - Clicar em um módulo instalado (ex: `module-tpv`)
   - Mostrar detalhes: status, versão, dependências
   - Explicar: "Sistema governa explicitamente o que está ativo"

4. **Diferencial**
   - "Outros sistemas escondem o que não está disponível"
   - "ChefIApp expõe tudo: você vê o que tem, o que pode ter, e o que não pode ter"

### Pontos-Chave

- ✅ System Tree = mapa vivo do sistema
- ✅ Governança explícita (instalado/bloqueado/não disponível)
- ✅ Diferencial arquitetural único

---

## 2. Dashboard — Portal de Módulos (1 min)

### O Que Dizer

**"O Dashboard é o ponto de entrada. Cada card é um módulo governado pela System Tree."**

### O Que Mostrar

1. **Abrir Dashboard**

   - URL: `http://localhost:5175/dashboard`
   - Mostrar cards de módulos

2. **Mostrar Cards**

   - **Verde:** Módulo instalado e ativo
   - **🔒 Bloqueado:** Módulo não instalado (clica → vai para System Tree)

3. **Explicar Governança**
   - "Cada card verifica na System Tree se está instalado"
   - "Não instalado? Mostra bloqueado e direciona para System Tree"
   - "Instalado? Abre o módulo normalmente"

### Pontos-Chave

- ✅ Dashboard = portal de módulos governados
- ✅ Cards refletem estado da System Tree
- ✅ Navegação clara (instalado vs bloqueado)

---

## 3. TPV v2 — Novo POS PURE DOCKER (1.5 min)

### O Que Dizer

**"TPV v2 é o novo ponto de venda. Está em PURE DOCKER — totalmente desacoplado de cloud no runtime."**

### O Que Mostrar

1. **Abrir TPV v2**

   - URL: `http://localhost:5175/tpv`
   - Mostrar interface minimalista

2. **Explicar PURE DOCKER**

   - "App layer roda sem Supabase no runtime"
   - "Usa adapters `[CORE TODO]` que preservam contratos"
   - "UI funciona normalmente, mas não persiste ainda"

3. **Mostrar Funcionalidade**

   - Criar pedido rápido
   - Adicionar itens
   - Mostrar que UI responde normalmente
   - Explicar: "Contratos preservados, pronto para implementação real"

4. **Diferencial Técnico**
   - "Separação clara: app layer vs core soberano"
   - "App layer pode rodar standalone"
   - "Core financeiro permanece protegido"

### Pontos-Chave

- ✅ TPV v2 = PURE DOCKER (sem Supabase no runtime)
- ✅ Contratos preservados (UI funcional)
- ✅ Arquitetura limpa (app vs core)

---

## 4. Tasks — Sistema Nervoso Automático (1 min)

### O Que Dizer

**"Task Engine é o sistema nervoso. Tarefas nascem automaticamente de eventos operacionais."**

### O Que Mostrar

1. **Abrir Tasks**

   - URL: `http://localhost:5175/tasks`
   - Mostrar lista de tarefas

2. **Explicar Geração Automática**

   - "Tarefas não são criadas manualmente"
   - "Nascem de eventos: atraso de item, estoque baixo, etc."
   - Mostrar tipos: `ATRASO_ITEM`, `ESTOQUE_CRITICO`

3. **Mostrar Contexto**

   - Selecionar uma tarefa
   - Mostrar contexto completo: item, tempo, mesa, pedido
   - Explicar: "Sistema detecta problema automaticamente"

4. **Fechamento Automático**
   - "Tarefas se fecham sozinhas quando problema é resolvido"
   - "Item fica pronto → tarefa de atraso fecha"
   - "Estoque reposto → tarefa de estoque fecha"

### Pontos-Chave

- ✅ Tasks automáticas (não manuais)
- ✅ Contexto completo (item, tempo, mesa)
- ✅ Fechamento automático
- ✅ Diferencial único (sistema nervoso)

---

## 🎯 Fechamento (30 seg)

### Resumir

**"Você viu 4 coisas:"**

1. **System Tree** — Mapa vivo, governança explícita
2. **Dashboard** — Portal de módulos governados
3. **TPV v2** — PURE DOCKER, arquitetura limpa
4. **Tasks** — Sistema nervoso automático

**Valor técnico:**

- Arquitetura modular governada
- App layer desacoplada (PURE DOCKER)
- Sistema nervoso automático (único no mercado)

**Próximos passos:**

- Demo completa (30 min) → ver `DEMO_SCRIPT_V1.md`
- Testes massivos → `npm run test:massive`
- Documentação técnica → `docs/DOC_INDEX.md`

---

## ✅ Checklist Pré-Demo

- [ ] Sistema rodando (`npm run dev` em `merchant-portal`)
- [ ] Navegador aberto em `http://localhost:5175`
- [ ] System Tree acessível (`/system-tree`)
- [ ] Dashboard acessível (`/dashboard`)
- [ ] TPV v2 acessível (`/tpv`)
- [ ] Tasks acessível (`/tasks`)

---

## 🎯 Perguntas Frequentes (Durante Demo)

### "E persistência real?"

**Resposta:** "App layer está em PURE DOCKER (demo). Core financeiro permanece protegido. Implementação real vem quando validarmos arquitetura."

### "E integrações?"

**Resposta:** "Sistema é modular. Cada módulo pode ser integrado independentemente. System Tree governa o que está disponível."

### "Por que PURE DOCKER?"

**Resposta:** "Separação clara: app layer pode rodar standalone, core financeiro permanece protegido. Arquitetura limpa para escalar."

---

**Conclusão:** Demo de 5 minutos focada em diferencial técnico e arquitetural. Mostra System Tree, Dashboard, TPV v2 e Tasks como prova de conceito de sistema operacional modular.
