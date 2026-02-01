# Status da UI Atual - Legacy Transitória

**Data:** 2026-01-25  
**Status:** LEGACY_UI_DO_NOT_EXTEND  
**Decisão:** Congelar, não refatorar

---

## Marcação Oficial

```
LEGACY_UI_DO_NOT_EXTEND
```

**Esta UI não será mais evoluída conceitualmente.**

---

## Por Que Foi Congelada

### Contexto Histórico

A UI atual:
- ✅ Nasceu antes do Core estar soberano
- ✅ Carregava decisões implícitas
- ✅ Tinha lógica misturada
- ✅ Servia hipóteses antigas
- ✅ Tentava ser "produto" antes de existir constituição

### Incompatibilidade Semântica

Depois de:
- Hard-blocking
- SLA real
- Governança
- Offline-first verdadeiro
- Constraints ativas

👉 A UI atual ficou **semanticamente incompatível**, não "mal programada".

**O problema é conceitual, não técnico.**

---

## Regras para UI Legacy

### ✅ Pode Fazer

- Corrigir bugs críticos (crashes, erros de runtime)
- Ajustar mensagens de erro para clareza
- Melhorar feedback visual (sem mudar lógica)
- Usar como referência visual para UI v2

### ❌ NÃO Pode Fazer

- Adicionar features novas
- Refatorar agressivamente
- Evoluir conceitualmente
- Tentar "salvar" a UI antiga
- Adicionar lógica de negócio
- Mudar arquitetura

---

## O Que Fazer com a UI Legacy

### 1. Usar como Referência Visual
- Ver como componentes eram estruturados
- Entender fluxos antigos
- Copiar estilos visuais (se útil)

### 2. Documentar Decisões Antigas
- Por que foi feito assim?
- Quais premissas estavam erradas?
- O que não funcionou?

### 3. Extrair Conhecimento
- Quais componentes eram úteis?
- Quais padrões funcionaram?
- O que deve ser mantido na v2?

### 4. Não Remendar
- Não tentar "consertar" semanticamente
- Não adicionar features
- Não refatorar agressivamente

---

## Arquivos Legacy

### Localização
```
merchant-portal/src/pages/TPV/        # TPV legacy
merchant-portal/src/pages/Dashboard/  # Dashboard legacy
merchant-portal/src/pages/Settings/   # Settings legacy
```

### Status
- ✅ Funcional para referência
- ✅ Pode ser usado para testes
- ❌ Não deve ser estendido
- ❌ Não deve ser refatorado

---

## Migração para UI v2

### Estratégia

1. **Criar UI v2 em paralelo**
   - Novo package/app
   - Componentes mínimos
   - Arquitetura correta

2. **Testar UI v2 com piloto**
   - 7 dias de uso real
   - Coletar feedback
   - Validar arquitetura

3. **Decidir após validação**
   - Manter v2
   - Evoluir v2
   - Ou refazer

4. **Deprecar UI legacy**
   - Após v2 validada
   - Migração gradual
   - Remoção final

---

## Lições Aprendidas

### O Que Funcionou
- Componentes visuais básicos
- Estrutura de pastas
- Alguns padrões de UX

### O Que Não Funcionou
- Lógica de negócio na UI
- Validações duplicadas
- Assumir estado
- Esconder erros

### O Que Deve Ser Mantido na v2
- Componentes visuais básicos (se úteis)
- Padrões de UX que funcionaram
- Estrutura de pastas (adaptada)

### O Que NÃO Deve Ser Mantido na v2
- Lógica de negócio
- Validações duplicadas
- Assumir estado
- Esconder erros

---

## Conclusão

**A UI legacy foi congelada porque crescemos além dela.**

Não é falha, é maturidade.

Agora é hora de:
- ✅ Parar de remendar
- ✅ Assumir a maturidade do Core
- ✅ Dar ao Core uma interface à altura

**UI v2 será feia se precisar, mas honesta sempre.**

---

*"Congelar legacy não é fracasso. É reconhecimento de maturidade arquitetural."*
