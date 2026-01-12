# P0 HARDENING - Error Re-throw Audit

**Data:** 18 Janeiro 2026  
**Prioridade:** P0 (Crítico)  
**Categoria:** Hardening / Arquitetura UI

---

## 🎯 PROBLEMA IDENTIFICADO

### Regra de Ouro Violada:
> **Se um componente trata o erro visualmente, ele NÃO deve relançar a exceção.**

---

## 📋 CASOS IDENTIFICADOS

### 1. ✅ **PaymentModal.tsx** (Linha 119) - **CRÍTICO**

**Código atual:**
```typescript
catch (err) {
    console.error('Payment failed:', err);
    setResult('error');
    setTimeout(() => {
        setResult(null);
    }, 3000);
    throw err; // ❌ PROBLEMA: Relança após tratamento visual
}
```

**Status:** 🟡 **P0 - Requer correção**

**Impacto:**
- Quebra teste (42/43 passando)
- Pode quebrar app em produção
- UX inconsistente

**Solução:**
```typescript
catch (err) {
    console.error('Payment failed:', err);
    setResult('error');
    setTimeout(() => {
        setResult(null);
    }, 3000);
    // ✅ CORRETO: Não relançar - erro já tratado visualmente
}
```

---

### 2. ⚠️ **TPV.tsx** (Linha 360) - **REVISAR**

**Código atual:**
```typescript
catch (err: any) {
    console.error('Payment failed:', err);
    const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: paymentModalOrderId
    });
    error(errorMsg); // Mostra toast de erro
    throw err; // ❌ PROBLEMA: Relança após mostrar erro ao usuário
}
```

**Status:** 🟡 **P1 - Requer revisão**

**Análise:**
- Mostra erro ao usuário via `error(errorMsg)` (toast)
- Depois relança o erro
- O erro é capturado pelo PaymentModal que também trata visualmente
- **Pode ser duplicação de tratamento**

**Solução sugerida:**
```typescript
catch (err: any) {
    console.error('Payment failed:', err);
    const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: paymentModalOrderId
    });
    error(errorMsg);
    // ✅ CORRETO: Não relançar - erro já mostrado ao usuário
    // O PaymentModal já trata visualmente via setResult('error')
}
```

---

### 3. ✅ **FiscalPrintButton.tsx** (Linhas 60, 68, 74) - **OK**

**Código:**
```typescript
if (!result) {
    throw new Error('Falha ao gerar documento fiscal');
}
// ...
if (!fiscalDoc) {
    throw new Error('Documento fiscal não encontrado');
}
// ...
if (!orderData) {
    throw new Error('Falha ao buscar dados do pedido');
}
```

**Status:** 🟢 **OK - Não requer correção**

**Análise:**
- Erros são lançados **antes** de qualquer tratamento visual
- São capturados no catch externo que faz `showError()`
- Não há tratamento visual antes do throw
- **Comportamento correto**

---

### 4. ✅ **Outros componentes** - **OK**

**CloseCashRegisterModal.tsx:**
```typescript
catch (err: any) {
    setError(err.message || 'Erro ao fechar caixa');
    // ✅ CORRETO: Não relança
}
```

**OpenCashRegisterModal.tsx:**
```typescript
catch (err: any) {
    console.error('[OpenCashRegisterModal] Error opening register:', err);
    setError(err.message || 'Erro ao abrir caixa');
    // ✅ CORRETO: Não relança
}
```

**IncomingRequests.tsx:**
```typescript
catch (err) {
    console.error('Accept Failed:', err);
    alert('Erro ao aceitar pedido.');
    // ✅ CORRETO: Não relança
}
```

**FiscalPrintButton.tsx (catch externo):**
```typescript
catch (err: any) {
    console.error('[FiscalPrintButton] Print failed:', err);
    showError(err.message || 'Erro ao imprimir recibo fiscal');
    // ✅ CORRETO: Não relança
}
```

---

## 📊 RESUMO

| Componente | Linha | Status | Prioridade | Ação |
|------------|-------|--------|------------|------|
| PaymentModal.tsx | 119 | 🟡 Problema | P0 | Remover `throw err;` |
| TPV.tsx | 360 | 🟡 Revisar | P1 | Remover `throw err;` (duplicação) |
| FiscalPrintButton.tsx | 60, 68, 74 | 🟢 OK | - | Nenhuma |
| Outros componentes | - | 🟢 OK | - | Nenhuma |

---

## 🎯 AÇÕES REQUERIDAS

### P0 - PaymentModal.tsx
- **Esforço:** 5 minutos
- **Risco:** Zero
- **Benefício:** Teste passa (43/43), app mais estável

### P1 - TPV.tsx
- **Esforço:** 5 minutos
- **Risco:** Zero
- **Benefício:** Evita duplicação de tratamento de erro

---

## ✅ CONCLUSÃO

**Total de problemas:** 2 (1 P0, 1 P1)

**Recomendação:**
1. Corrigir PaymentModal.tsx imediatamente (P0)
2. Revisar e corrigir TPV.tsx no próximo bloco (P1)

**Status geral:** 🟢 **Boa arquitetura de tratamento de erros, com 2 casos isolados para correção**

---

**Última atualização:** 18 Janeiro 2026
