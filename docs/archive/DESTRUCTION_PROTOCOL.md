# 🔥 PROTOCOLO DE DESTRUIÇÃO

**Status:** `ACTIVE`  
**Data de Ativação:** 2026-01-08  
**Autoridade:** Sistema Core

---

## 🎯 REGRA DE OURO

**Toda vez que algo novo é criado, algo velho DEVE morrer.**

**Se um arquivo novo substitui um antigo, o antigo é deletado na mesma sessão.**

**Sem exceção.**

---

## 📐 PROCESSO DE DESTRUIÇÃO

### Passo 1: Identificar Substituição

Quando criar um arquivo novo que substitui um antigo:

1. ✅ Identificar arquivo antigo
2. ✅ Confirmar que novo arquivo funciona
3. ✅ Mover antigo para `_graveyard/`
4. ✅ Atualizar imports
5. ✅ Rodar validador

### Passo 2: Transição (7 dias)

Arquivos em `_graveyard/` ficam 7 dias para:
- Verificar se nada quebrou
- Garantir que novo arquivo funciona
- Confirmar que não há referências

### Passo 3: Destruição Final

Após 7 dias:
```bash
rm -rf _graveyard/
```

---

## 🚨 VALIDAÇÃO OBRIGATÓRIA

**Antes de cada build:**
```bash
npm run validate:constitution
```

**Se falhar:** Build bloqueado.

---

## 📋 CHECKLIST DE DESTRUIÇÃO

Antes de deletar um arquivo:

- [ ] Novo arquivo funciona
- [ ] Imports atualizados
- [ ] Nenhuma referência ao antigo
- [ ] Validador passa
- [ ] Build funciona

---

## 🔥 ARQUIVOS PROIBIDOS (Build Falha)

Lista completa em: `SYSTEM_CONSTITUTION.md`

**Regra:** Se arquivo proibido existe, build falha.

---

## 🧹 LIMPEZA PERIÓDICA

**A cada 7 dias:**
1. Verificar `_graveyard/`
2. Confirmar que nada quebrou
3. Deletar pasta inteira

---

**Este protocolo é executivo. Não é opcional.**
