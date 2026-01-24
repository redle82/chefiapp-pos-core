# 🌙 NOITE 9 JAN - CHECKLIST OPERACIONAL

**Data:** 9 Jan 2026 | **Hora início:** _____ | **Hora fim:** _____

---

## ✅ PRÉ-NOITE (Antes de abrir)

- [ ] Build passou? `npm run build` (deve sair em <5s)
- [ ] TPV carrega? Abre em <3s?
- [ ] KDS carrega? Abre em <3s?
- [ ] Web Ordering carrega? Abre em <3s?
- [ ] Impressora conectada (se tiver)?
- [ ] Internet estável?

**Se algo falhar aqui → NÃO ABRE. Reporta amanhã.**

---

## 📊 DURANTE A NOITE (Anotar com timestamps)

### Primeira ordem
- [ ] Hora que entra no TPV: _____
- [ ] Hora que aparece no KDS: _____
- [ ] **LAG = diferença** (deve ser <30s)

---

### Cada hora, anotar:
| Hora | Pedidos OK | Problemas | Notas |
|------|-----------|-----------|-------|
| 19:00-20:00 | ___ | | |
| 20:00-21:00 | ___ | | |
| 21:00-22:00 | ___ | | |
| 22:00-23:00 | ___ | | |
| 23:00-00:00 | ___ | | |

---

## 🔴 PROCURE ESPECIFICAMENTE POR:

### 1. **LAG DO KDS**
- Pedido entra no TPV
- Demora quanto tempo para aparecer no KDS?
- **Normal:** <30s
- **Problema:** >2min

### 2. **PEDIDOS DUPLICADOS**
- Mesmo pedido aparece 2x no KDS?
- **Anotar:** Qual pedido? Hora?

### 3. **PAGAMENTO FALHANDO**
- Cliente paga, cartão recusado?
- **Anotar:** Mensagem de erro exata (capturar print se possível)

### 4. **TRAVAMENTO**
- Sistema fica lento/parado?
- **Anotar:** Hora, quanto tempo, o que estava acontecendo?

### 5. **ERROS VISUAIS**
- Botão fora do lugar?
- Texto cortado?
- UI estranha?

### 6. **PEDIDOS NÃO FECHAR**
- Você marca como pronto no KDS
- Pedido desaparece do TPV? (deve desaparecer)
- **Se não desaparecer:** BUG

---

## 🚨 SE QUEBRAR DURANTE A NOITE

**Opção 1: Conseguir continuar?**
- Feche pedido de outro jeito (anote como)
- Continue operando
- Reporte amanhã

**Opção 2: Não conseguir continuar?**
- Desligue o sistema
- Use backup manual (papel/caneta ou app anterior)
- Reporte exatamente o que aconteceu

---

## 📝 PROBLEMAS ENCONTRADOS

### Problema 1
```
O quê aconteceu: ___________________________
Quando: ___________________________
Como reproduzir: ___________________________
Impacto: [ ] Crítico [ ] Alto [ ] Baixo
```

### Problema 2
```
O quê aconteceu: ___________________________
Quando: ___________________________
Como reproduzir: ___________________________
Impacto: [ ] Crítico [ ] Alto [ ] Baixo
```

### Problema 3
```
O quê aconteceu: ___________________________
Quando: ___________________________
Como reproduzir: ___________________________
Impacto: [ ] Crítico [ ] Alto [ ] Baixo
```

---

## 📸 EVIDÊNCIA

Se conseguir, tire screenshot de:
- [ ] Erro no TPV (qual botão clicou?)
- [ ] Erro no KDS (que ordem não chegou?)
- [ ] Mensagem de erro (print exato)
- [ ] Qualquer coisa estranha

---

## ✨ FINAL DA NOITE

- [ ] Total de pedidos que entraram: _____
- [ ] Sem problemas? [ ] Sim [ ] Não
- [ ] Sistema funcionou bem? [ ] Sim [ ] Não [ ] Mais ou menos
- [ ] Você conseguiria abrir assim amanhã? [ ] Sim [ ] Não

---

## 📤 AMANHÃ (10 JAN) DE MANHÃ

1. Tire **foto desse checklist preenchido**
2. Envie para o Copilot (descreva os problemas)
3. Copilot fixa até à noite
4. Você testa noite 2

---

**Boa sorte! Você consegue. 💪**
