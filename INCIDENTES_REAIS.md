# 🚨 INCIDENTES REAIS — Primeira Semana

**Data Início:** 2026-01-24  
**Status:** 📝 **REGISTRO ATIVO**

---

## 📊 RESUMO

- **Total de Incidentes:** 1
- **CRITICAL:** 1
- **HIGH:** 0
- **MEDIUM:** 0
- **LOW:** 0

---

# INCIDENT #001

**Data/Hora:** 2026-01-24 14:30:00  
**Severidade:** 🔴 **CRITICAL**  
**Tipo:** JavaScript Error  
**Status:** ✅ **RESOLVIDO**

## Descrição

Erro `ReferenceError: email is not defined` ao tentar fazer login no modo de desenvolvimento. O erro ocorre no bloco `catch` quando tenta registrar o log de erro, mas a variável `email` está fora do escopo.

## Contexto

- **Rota:** `/auth`
- **Ação:** Clicar em "⚡ Entrar (Dev Mode)"
- **Arquivo:** `merchant-portal/src/pages/AuthPage.tsx`
- **Linha:** 174
- **Teste:** E2E Humano - Fase 1: Bootstrap e Onboarding

## Evidências

### Console Error
```
ReferenceError: email is not defined
    at onClick (http://localhost:5173/src/pages/AuthPage.tsx:190:68)
```

### Código Problemático
```typescript
try {
    const email = (document.getElementById('dev-email') as HTMLInputElement).value;
    // ... código ...
} catch (err: any) {
    Logger.error('Auth: Dev login exception', err as Error, { email }); // ❌ email não está no escopo
}
```

## Impacto

- **Usuários afetados:** Todos que tentam fazer login via Dev Mode
- **Ações afetadas:** Login completamente bloqueado
- **Tempo de indisponibilidade:** Detectado durante teste E2E

## Ação Tomada

1. **Detecção:** Durante teste E2E humano (Antigráfico)
2. **Análise:** Variável `email` declarada dentro do `try`, inacessível no `catch`
3. **Correção:** Movida declaração de `email` para fora do `try`, usando `let email = '';`

## Resolução

**Arquivo corrigido:** `merchant-portal/src/pages/AuthPage.tsx`

**Mudança aplicada:**
```typescript
let email = '';
try {
    email = (document.getElementById('dev-email') as HTMLInputElement).value;
    // ... resto do código ...
} catch (err: any) {
    Logger.error('Auth: Dev login exception', err as Error, { email: email || 'unknown' });
    // ... resto do código ...
}
```

**Tempo para resolução:** < 5 minutos

## Prevenção

- ✅ Variáveis usadas em `catch` devem ser declaradas fora do `try`
- ✅ Adicionar validação de escopo no linter
- ✅ Teste E2E cobre este fluxo

---

**Última atualização:** 2026-01-24 14:35:00
