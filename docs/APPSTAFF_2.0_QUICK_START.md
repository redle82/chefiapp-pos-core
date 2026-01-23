# ⚡ AppStaff 2.0 - Quick Start

**Guia rápido para começar a usar/testar o AppStaff 2.0**

---

## 🚀 Em 5 Minutos

### 1. Entender o Conceito (30 segundos)

> **"O AppStaff mostra APENAS UMA COISA POR VEZ."**

- Não há listas
- Não há menus
- Não há configurações
- Apenas 1 ação por vez

---

### 2. Ver o Código (1 minuto)

**Arquivos principais:**
```
mobile-app/
├── services/NowEngine.ts          # Motor de decisão
├── hooks/useNowEngine.ts           # Hook React
├── components/NowActionCard.tsx    # UI única
└── app/(tabs)/staff.tsx            # Tela principal
```

**Como funciona:**
1. `NowEngine` observa contexto
2. Calcula prioridade única
3. Emite 1 ação
4. `NowActionCard` mostra a ação

---

### 3. Testar Localmente (2 minutos)

```bash
# 1. Executar app
npm start

# 2. Abrir tela Staff
# 3. Iniciar turno
# 4. Criar pedido no TPV (outra aba)
# 5. Ver ação aparecer no AppStaff
```

**O que você deve ver:**
- Ação aparece automaticamente
- 1 ícone, 2 palavras, 1 frase, 1 botão
- Cores por prioridade (vermelho/laranja/amarelo/cinza)

---

### 4. Completar Ação (1 minuto)

```bash
# 1. Tocar no botão da ação
# 2. Se for pagamento: QuickPayModal abre
# 3. Se for entrega: Item marca como entregue
# 4. Próxima ação aparece automaticamente
```

**O que você deve ver:**
- Ação desaparece
- Próxima ação aparece (se houver)
- Ou "Tudo em ordem" (se não houver)

---

### 5. Entender Prioridades (30 segundos)

**Hierarquia:**
1. 🔴 **CRÍTICO** - Ação imediata (ex: cliente reclamando)
2. 🟠 **URGENTE** - Ação rápida (ex: mesa quer pagar há 2-5min)
3. 🟡 **ATENÇÃO** - Ação normal (ex: mesa ocupada há 15-30min)
4. ⚪ **SILÊNCIO** - Tudo em ordem

---

## 📋 Checklist Rápido

### Antes de Testar
- [ ] App executando
- [ ] Turno iniciado
- [ ] TPV aberto (para criar pedidos)
- [ ] KDS aberto (para marcar itens prontos)

### Durante Teste
- [ ] Ação aparece quando deveria
- [ ] Priorização está correta
- [ ] Completar ação funciona
- [ ] Próxima ação aparece
- [ ] Filtros por role funcionam

### Após Teste
- [ ] Documentar problemas encontrados
- [ ] Validar métricas
- [ ] Coletar feedback

---

## 🎯 Cenários de Teste

### Cenário 1: Pagamento

```
1. TPV: Criar pedido
2. TPV: Marcar como "pronto para pagar"
3. AppStaff: Ver ação "Mesa X - Quer pagar"
4. AppStaff: Tocar "COBRAR"
5. QuickPayModal: Selecionar método e confirmar
6. AppStaff: Ver próxima ação (ou "Tudo em ordem")
```

**Validação:**
- ✅ Ação aparece em < 1 segundo
- ✅ Priorização correta (urgente se 2-5min, crítico se 5+min)
- ✅ Pagamento processa
- ✅ Próxima ação aparece

---

### Cenário 2: Entrega

```
1. TPV: Criar pedido
2. KDS: Marcar item como "pronto"
3. AppStaff: Ver ação "Mesa X - Item pronto"
4. AppStaff: Tocar "ENTREGAR"
5. AppStaff: Ver próxima ação (ou "Tudo em ordem")
```

**Validação:**
- ✅ Ação aparece em < 1 segundo
- ✅ Priorização correta (urgente se 1-3min, crítico se 3+min)
- ✅ Item marca como entregue
- ✅ Próxima ação aparece

---

### Cenário 3: Filtros por Role

```
1. Mudar role para 'waiter'
2. Verificar que apenas ações de garçom aparecem
3. Mudar role para 'cook'
4. Verificar que apenas ações de cozinheiro aparecem
```

**Validação:**
- ✅ Garçom não vê ações de cozinheiro
- ✅ Cozinheiro não vê ações de garçom
- ✅ Gerente vê todas as ações críticas/urgentes

---

## 🐛 Problemas Comuns

### Ação Não Aparece

**Possíveis causas:**
1. Turno não iniciado
2. Role não permite ver ação
3. Ação já foi completada recentemente
4. Contexto não atualizado

**Solução:**
- Verificar turno
- Verificar role
- Aguardar 60s (tracking TTL)
- Verificar logs do NowEngine

---

### Ação Duplicada

**Possíveis causas:**
1. Realtime disparou múltiplas vezes
2. Tracking não funcionou

**Solução:**
- Verificar tracking (deve prevenir)
- Verificar logs
- Reportar bug se persistir

---

### Performance Lenta

**Possíveis causas:**
1. Muitas recalculations
2. Queries lentas
3. Realtime sobrecarregado

**Solução:**
- Verificar debounce (deve ser 1s)
- Verificar queries do Supabase
- Verificar conexão realtime

---

## 📊 Métricas Rápidas

### O Que Medir

**Funcionais:**
- Tempo para aparecer ação: < 1 segundo
- Taxa de conclusão: > 90%
- Satisfação: > 4/5

**Técnicas:**
- Recalculations/min: < 3
- Taxa de erro: < 1%
- Uptime: > 99%

---

## 🔗 Links Úteis

### Documentação
- **README:** [`APPSTAFF_2.0_README.md`](./APPSTAFF_2.0_README.md)
- **Status:** [`APPSTAFF_2.0_STATUS_FINAL.md`](./APPSTAFF_2.0_STATUS_FINAL.md)
- **Checklist:** [`APPSTAFF_2.0_PRE_LAUNCH_CHECKLIST.md`](./APPSTAFF_2.0_PRE_LAUNCH_CHECKLIST.md)

### Código
- **NowEngine:** `mobile-app/services/NowEngine.ts`
- **Hook:** `mobile-app/hooks/useNowEngine.ts`
- **UI:** `mobile-app/components/NowActionCard.tsx`

---

## ✅ Pronto para Testar

**Siga os cenários acima e valide que tudo funciona.**

**Problemas?** Ver seção "Problemas Comuns" ou documentar para correção.

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Pronto para Uso
