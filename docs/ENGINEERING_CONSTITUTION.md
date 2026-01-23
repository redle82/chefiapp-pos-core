# ENGINEERING CONSTITUTION

**Status:** ⚠️ DEPRECATED — Use versão global na raiz  
**Applicability:** Este documento foi consolidado

---

## 📚 VERSÃO ATUAL

**Use:** `ENGINEERING_CONSTITUTION.md` (na raiz do workspace)

Este documento mantém o conteúdo original, mas a versão oficial está na raiz.

---

## 🔗 DOCUMENTOS RELACIONADOS

- `ENGINEERING_CONSTITUTION.md` - **Constituição Global (USE ESTE)**
- `docs/PROJECT_ENGINEERING_RULES.md` - Regras específicas do ChefIApp
- `.cursor/ENGINEERING_CONSTITUTION_PROMPT.md` - Prompt base para Cursor

---

---

## 1. PRINCÍPIOS INEGOCIÁVEIS

1. **Verdade do Backend:** O Frontend nunca decide regras de negócio ou permissões. Ele apenas reflete o estado do servidor.
2. **Código Fantasma:** Código não commitado não existe. Não há "está funcionando na minha máquina".
3. **Teste é Vida:** Funcionalidade sem teste (manual ou auto) é um bug esperando para acontecer.
4. **Performance é Feature:** Um app lento é um app quebrado. Otimização não é luxo, é requisito.
5. **Higiene Radical:** Não deixe código comentado, arquivos mortos ou `console.log` esquecidos. Se não usa, delete (o git guarda o histórico).
6. **Simplicidade Brutal:** Se a solução é complexa para explicar, ela está errada.

---

## 2. REGRAS DE DESENVOLVIMENTO (DAY-TO-DAY)

### O Ciclo Atômico

Cada unidade de trabalho deve seguir estritamente:

1. **Pensar** (Planejar a mudança).
2. **Implementar** (Codificar).
3. **Verificar** (Build + Teste Local).
4. **Commitar** (Mensagem clara).

> ❌ **Proibido:** Trabalhar mais de 2 horas sem um commit.

### Padrão de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade.
- `fix:` Correção de bug.
- `refactor:` Mudança de código sem mudar comportamento.
- `docs:` Apenas documentação.
- `chore:` Configuração, build, limpeza.

### Banco de Dados

- **Schema Authority:** O banco de dados é a fonte da verdade.
- **Migrations:** Nunca altere o banco manualmente em produção. Sempre via migration versionada.
- **Segurança:** Row Level Security (RLS) deve estar ativo para todas as tabelas públicas.

---

## 3. HIGIENE DO REPOSITÓRIO

### Arquivos Mortos

- Se um arquivo não é importado por ninguém, ele deve ser deletado ou movido para `archive/`.
- Não comente blocos de código gigantes "para caso precise depois". Delete.

### Dependências

- Não adicione libs pesadas sem justificar.
- Rode `npm audit` regularmente.

---

## 4. REGRAS DE OPERAÇÃO (DEPLOY)

1. **Ambiente Limpo:** Deploy só acontece a partir de um branch limpo e atualizado (`develop` ou `main`).
2. **Configuração:** Segredos (.env) nunca são commitados.
3. **Verificação Pós-Deploy:** O deploy não acaba quando o comando termina. Acaba quando você verifica que o usuário consegue logar.

---

## 5. CULTURA DE ERRO

- **Errou? Assuma.** O erro técnico é aceitável. Esconder o erro é imperdoável.
- **Post-Mortem:** Se quebrou em produção, escreva o porquê e como evitar na próxima. Não busque culpados, busque correções de processo.

---

## 6. REGRA DE OURO

> "Deixe o código melhor do que você o encontrou."

Se você viu uma variável mal nomeada, renomeie. Se viu uma função duplicada, refatore. Pequenas ações diárias previnem grandes refatorações anuais.
