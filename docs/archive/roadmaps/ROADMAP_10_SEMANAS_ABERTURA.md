# 🎯 ROADMAP 10 SEMANAS → ABERTURA (20 MAR)

**Status:** 9 Jan 2026 | Dias restantes: 71 | Semanas: 10

---

## 📋 ESTRATÉGIA GERAL

```
SEMANA 1-2: NOITE REAL + BUGS CRÍTICOS
        ↓
SEMANA 3-4: FEATURES VITAIS (Fiscal, Z, Estoque)
        ↓
SEMANA 5-6: FEATURES SECUNDÁRIAS (Reservas, Split)
        ↓
SEMANA 7-8: TREINAMENTO + TESTES STRESS
        ↓
SEMANA 9-10: BUFFER + CONTINGÊNCIA
```

---

# 🔥 SEMANA 1 (9-15 JAN) - NOITE REAL + DIAGNÓSTICO

## Objetivo
Descobrir TUDO que quebra quando restaurante funciona de verdade.

---

### **SEGUNDA, 9 JAN**

#### Manhã
- [ ] Checklist pré-live:
  - [ ] Migration 082 aplicada? `SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_one_open_order_per_table';`
  - [ ] Build passou? `npm run build` (deve sair em <5s)
  - [ ] TPV carrega em <3s
  - [ ] KDS carrega em <3s
  - [ ] Web Ordering carrega em <3s

#### Noite (Durante serviço)
- [ ] **Anotar com timestamps:**
  - Primeira ordem que entra (hora)
  - Primeira ordem no KDS (hora) → calcular lag
  - Problemas visuais/UI bugs
  - Mensagens de erro (capturar screenshot se possível)
  - Pagamentos falhados
  - Pedidos duplicados
  - Travamentos (tempo, tipo)

- [ ] **Não mexer em nada durante o serviço.** Se quebrar, desligue o sistema e use backup manual.

#### Depois do expediente
- [ ] Descrever em 1 arquivo: `NOITE_9_JAN_LOG.md`
  ```markdown
  # Noite 9 Jan - Log
  
  ## Timeline
  - 19:00 Primeiro pedido entra
  - 19:02 KDS não recebeu pedido (lag 2 min) ❌
  - 19:15 Pagamento recusado (erro: X) ❌
  
  ## Problemas
  1. **KDS lag**: Describe exactly what happened
  2. **Payment**: Describe exactly what happened
  
  ## Screenshots/Evidence
  - (imagem do erro aqui)
  ```

---

### **TERÇA, 10 JAN**

#### Manhã
- [ ] Leia o log que fez ontem
- [ ] Priorize: O que foi crítico vs. O que foi "nice to have"?
- [ ] Reportar ao Copilot:
  ```
  Problema 1: KDS lag 2 min
  Passo a passo para reproduzir: Entrar pedido no TPV → Não aparece no KDS por 2 min
  
  Problema 2: Payment recusado
  Mensagem de erro exata: [copiar do log]
  ```

#### Tarde
- [ ] Copilot entrega fixes
- [ ] Build passa? `npm run build`
- [ ] Deploy em produção (seu restaurante)

#### Noite (Teste validação)
- [ ] Rodar noite 2 com APENAS os fixes aplicados
- [ ] Se KDS lag era problema → verificar se resolveu
- [ ] Anotar se novos problemas apareceram

#### Depois
- [ ] Novo log: `NOITE_10_JAN_LOG.md`

---

### **QUARTA, 11 JAN**

#### Manhã
- [ ] Comparar noite 9 vs. noite 10:
  - [ ] Problema X foi resolvido? ✅ ou ❌
  - [ ] Novos problemas? (listar)

#### Tarde
- [ ] Se novos problemas: reportar novamente
- [ ] Se tudo ok: **MARCAR COMO VERDE** ✅

#### Noite
- [ ] Repouso (você merece, trabalhou 3 noites)

---

### **QUINTA, 12 JAN**

#### Dia inteiro
- [ ] **Não rodar sistema.** Deixar serviço manual/backup.
- [ ] **Você respira.** Vê o feedback com distância.
- [ ] Anotação rápida: "Sistema está pronto para abrir?" Sim/Não/Talvez?

---

### **SEXTA-SÁBADO, 13-14 JAN**

#### Sexta à noite + Sábado
- [ ] Rodar noite 3 (fim de semana = mais movimento esperado)
- [ ] **Mesmo protocolo:** Anotar, logar, reportar amanhã

#### Domingo 15
- [ ] Final do log
- [ ] **Reflexão:** Semana 1 foi ok?
  - Sim → Semana 2 foca em features vitais
  - Não → Semana 2 foca em mais diagnóstico

---

## 📊 CRITÉRIO SEMANA 1 "FEITO"

| Check | Status |
|-------|--------|
| 3 noites reais rodadas | [ ] |
| 0 travamentos críticos | [ ] |
| KDS recebe <30s | [ ] |
| Pagamentos funcionam 100% | [ ] |
| Sem pedidos duplicados | [ ] |
| Você consegue trabalhar normalmente | [ ] |

**Se tudo ✅:** Semana 2 = Features  
**Se algum ❌:** Semana 2 = Mais diagnóstico + fixes

---

---

# 📦 SEMANA 2 (16-22 JAN) - FIXES + PREPARAÇÃO

## Objetivo
Acabar com bugs pendentes. Começar planejamento de features vitais.

---

### **SEGUNDA-QUARTA, 16-18 JAN**

- [ ] **Manhã:** Listar todos os bugs encontrados semana 1
- [ ] **Tarde:** Priorizar por impacto:
  - 🔴 **Crítico** (sistema não funciona)
  - 🟡 **Alto** (afeta operação significantemente)
  - 🟢 **Baixo** (UI bug, incômodo, mas não quebra)

- [ ] Reportar críticos/altos ao Copilot
- [ ] Cada dia: Apply fix → Build → Testar em produção

### **QUINTA, 19 JAN**

- [ ] Check: Todos os bugs críticos/altos foram resolvidos?
- [ ] Se sim: Marcar semana 2 como ✅
- [ ] Se não: Estender sexta também

### **SEXTA-SÁBADO, 20-21 JAN**

- [ ] Noite 4 (validação de todos os fixes)
- [ ] Protocolo: Anotar, logar, reportar segunda

---

## 📊 CRITÉRIO SEMANA 2 "FEITO"

| Check | Status |
|-------|--------|
| Todos bugs críticos resolvidos | [ ] |
| Todos bugs altos resolvidos | [ ] |
| 4 noites reais sem problemas maiores | [ ] |
| Sistema está "entediante" (nada quebra) | [ ] |

---

---

# 🎁 SEMANA 3 (23-29 JAN) - FEATURE VITAL 1: IMPRESSORA FISCAL

## Objetivo
Emitir recibos legais (SAF-T preparado).

---

### **SEGUNDA, 23 JAN**

#### Tarde
- [ ] **Decisão:** Qual modelo de impressora?
  - Bematech? Sweda? Outra?
  - Você já tem a impressora?

- [ ] **Se não tem:** Comprar hoje (chega até quarta)

### **TERÇA-QUARTA, 24-25 JAN**

- [ ] Integração impressora:
  - [ ] Driver instalado no PC do TPV
  - [ ] Copilot cria função `printReceipt(order)`
  - [ ] Testa print simples (ex: "TESTE" + número ordem)

### **QUINTA-SEXTA, 26-27 JAN**

- [ ] Testar print com ordem de verdade
- [ ] Validar:
  - [ ] Recibo tem todos dados legais (cliente, itens, total)
  - [ ] Número sequencial correto
  - [ ] Data/hora correto

### **SÁBADO, 28 JAN**

- [ ] Noite 5 com impressora ativa
- [ ] Anotar: Print funcionou 100%? Ou teve falhas?

---

## 📊 CRITÉRIO SEMANA 3 "FEITO"

| Check | Status |
|-------|--------|
| Impressora conectada e funcionando | [ ] |
| Recibos saem com dados legais | [ ] |
| Numeração sequencial funciona | [ ] |
| Noite 5 sem problemas de print | [ ] |

---

---

# 📊 SEMANA 4 (30 JAN - 5 FEV) - FEATURE VITAL 2: RELATÓRIO Z (FECHAR CAIXA)

## Objetivo
Você consegue fechar caixa ao final do dia com dados corretos.

---

### **SEGUNDA, 30 JAN**

- [ ] Copilot cria tela "Fechar Caixa":
  - [ ] Total de vendas do dia
  - [ ] Total pago à vista
  - [ ] Total pago cartão
  - [ ] Total pago pix
  - [ ] Desconto aplicado
  - [ ] Número sequencial (Z001, Z002...)

### **TERÇA-QUARTA, 31 JAN - 1 FEV**

- [ ] Integração com DB:
  - [ ] Query que soma pedidos do dia
  - [ ] Query que soma pagamentos por tipo
  - [ ] Validar: Soma total = Vendas no dia?

### **QUINTA, 2 FEV**

- [ ] Testes:
  - [ ] Fazer 10 pedidos teste → Fechar caixa → Números batem?
  - [ ] Fazer pagamentos mistos → Caixa valida cada um?

### **SEXTA-SÁBADO, 3-4 FEV**

- [ ] Noite 6 com Z ativo
- [ ] No final: Você fecha caixa e números fazem sentido?

---

## 📊 CRITÉRIO SEMANA 4 "FEITO"

| Check | Status |
|-------|--------|
| Tela Z aparece ao final do dia | [ ] |
| Números conferem com vendas | [ ] |
| Histórico de Zs salvo | [ ] |
| Noite 6 rodou sem problemas | [ ] |

---

---

# 📦 SEMANA 5 (6-12 FEV) - FEATURE VITAL 3: GESTOR ESTOQUE

## Objetivo
Você sabe quando está perto de acabar algo.

---

### **SEGUNDA, 6 FEV**

- [ ] Listar: Quais ingredientes precisa controlar?
  - Ex: Carne, Frango, Peixe, Alface, Tomate...
  - Quantas unidades tem de cada?

- [ ] Copilot cria estrutura:
  - [ ] Tabela `ingredients` (nome, estoque_atual, estoque_minimo)
  - [ ] Tela de atualizar estoque

### **TERÇA-QUARTA, 7-8 FEV**

- [ ] Cada pedido reduz estoque:
  - [ ] Hambúrguer com carne → reduz "Carne" em 200g
  - [ ] Salada → reduz "Alface" em 50g
  - [ ] Etc.

- [ ] Alerta se ingrediente <mínimo:
  - [ ] Banner vermelho no TPV: "ALFACE ACABANDO"

### **QUINTA, 9 FEV**

- [ ] Testes:
  - [ ] Fazer pedidos que usam ingredientes
  - [ ] Estoque reduz automaticamente?
  - [ ] Alerta aparece no limite?

### **SÁBADO, 11 FEV**

- [ ] Noite 7 com estoque ativo

---

## 📊 CRITÉRIO SEMANA 5 "FEITO"

| Check | Status |
|-------|--------|
| Ingredientes cadastrados | [ ] |
| Estoque reduz com pedidos | [ ] |
| Alerta funciona | [ ] |
| Você consegue atualizar estoque manualmente | [ ] |

---

---

# 🎟️ SEMANA 6 (13-19 FEV) - FEATURES SECUNDÁRIAS: RESERVAS + SPLIT

## Objetivo
Se necessário para seu restaurante.

---

### **SEGUNDA-QUARTA, 13-15 FEV**

**Se você aceita reservas:**
- [ ] Tela de reserva (nome, hora, pessoas, telefone)
- [ ] Integração no sistema (bloqueia mesa naquele horário)
- [ ] Notificação quando cliente chega

**Se você faz split de conta:**
- [ ] Tela "Dividir conta" (2x, 3x, custom)
- [ ] Cada pessoa paga sua parte
- [ ] Recibos separados

### **QUINTA-SÁBADO, 16-18 FEV**

- [ ] Testar com ordem real
- [ ] Noite 8 com features ativas

---

## 📊 CRITÉRIO SEMANA 6 "FEITO"

| Check | Status |
|-------|--------|
| Reservas (se aplicável) funcionam | [ ] |
| Split (se aplicável) funciona | [ ] |

---

---

# 👥 SEMANA 7 (20-26 FEV) - TREINAMENTO + DOCUMENTAÇÃO

## Objetivo
Sua equipe consegue usar o sistema sem você.

---

### **SEGUNDA-TERÇA, 20-21 FEV**

- [ ] **Documentação por papel:**

  **Para garçons:**
  - [ ] Como tomar pedido no TPV
  - [ ] Como chamar cozinha (KDS)
  - [ ] Fotos/prints de cada tela

  **Para cozinha:**
  - [ ] Como usar KDS
  - [ ] Símbolos = o quê?
  - [ ] Como avisar que pedido está pronto

  **Para caixa:**
  - [ ] Como fechar pedido
  - [ ] Como imprimir recibo
  - [ ] Como fechar caixa (Z)

- [ ] **Vídeos:** Você grava 3-5 vídeos curtos (1-2 min cada) mostrando

### **QUARTA-QUINTA, 22-23 FEV**

- [ ] **Treinamento ao vivo:**
  - [ ] Cada pessoa da equipe usa o sistema
  - [ ] Você assiste, anotando dúvidas
  - [ ] Volta para corrigir UI/documentação se preciso

### **SEXTA, 24 FEV**

- [ ] Perguntas finais
- [ ] Mock noite (simular serviço com equipe)

### **SÁBADO, 25 FEV**

- [ ] Noite 9: Equipe usa sistema de verdade
- [ ] Você observa (sem mexer)
- [ ] Anotar: Alguém ficou perdido?

---

## 📊 CRITÉRIO SEMANA 7 "FEITO"

| Check | Status |
|-------|--------|
| Documentação escrita | [ ] |
| Vídeos gravados | [ ] |
| Equipe fez treinamento | [ ] |
| Mock noite correu bem | [ ] |
| Noite 9 equipe usou sem problema | [ ] |

---

---

# 🔨 SEMANA 8 (27 FEV - 5 MAR) - TESTES STRESS + CONTINGÊNCIA

## Objetivo
Sistema aguenta noite cheia. Você tem plano B.

---

### **SEGUNDA-TERÇA, 27-28 FEV**

- [ ] **Stress test manual:**
  - [ ] Você + equipe criam 100 pedidos rápido
  - [ ] Sistema trava? Lag?
  - [ ] Anotar limite (quantos pedidos/min aguenta)

- [ ] **Plano B:**
  - [ ] Se internet cair: TPV continua funcionando offline?
  - [ ] Se servidor cair: Você consegue fechar caixa manualmente?
  - [ ] Documento: "PLANO B - PROCEDIMENTO MANUAL"

### **QUARTA-QUINTA, 1-2 MAR**

- [ ] Testar plano B de verdade:
  - [ ] Desligar internet → TPV continua?
  - [ ] Desligar servidor → Consegue voltar?

- [ ] Copilot melhora se necessário

### **SEXTA-SÁBADO, 3-4 MAR**

- [ ] Noite 10: Stress test real (chamar amigos para pedir)

---

## 📊 CRITÉRIO SEMANA 8 "FEITO"

| Check | Status |
|-------|--------|
| Sistema aguenta 50+ pedidos simultâneos | [ ] |
| Plano B documentado | [ ] |
| Plano B testado | [ ] |
| Noite 10 funcionou bem | [ ] |

---

---

# 🎯 SEMANA 9 (6-12 MAR) - VALIDAÇÃO FINAL + MELHORIAS MENORES

## Objetivo
Tudo pronto para abertura. Últimos ajustes.

---

### **SEGUNDA-QUINTA, 6-9 MAR**

- [ ] **Visão geral:**
  - [ ] Listar todos os bugs encontrados até agora: resolvido? ✅ ou ainda ❌
  - [ ] Listar todas as features: funcionam 100%?
  - [ ] Você consegue operar sistema sozinho sem travamentos?

- [ ] **Melhorias menores:**
  - [ ] UI bugs (botão fora do lugar, texto cortado)
  - [ ] Labels confusos
  - [ ] Cores que não funcionam bem

- [ ] Cada melhoria: Copilot → Build → Deploy

### **SEXTA-SÁBADO, 10-11 MAR**

- [ ] Noite 11: Tudo funcionando normalmente?

---

## 📊 CRITÉRIO SEMANA 9 "FEITO"

| Check | Status |
|-------|--------|
| Bugs pendentes: 0 críticos | [ ] |
| UI bugs: resolvidos | [ ] |
| Noite 11 sem problemas | [ ] |

---

---

# 🚀 SEMANA 10 (13-20 MAR) - FINAL COUNTDOWN

## Objetivo
Sistema está 100% pronto. Você está 100% confiante.

---

### **SEGUNDA-QUARTA, 13-15 MAR**

- [ ] **Últimas validações:**
  - [ ] Impressora? ✅
  - [ ] Relatório Z? ✅
  - [ ] Estoque? ✅
  - [ ] Backups funcionando? ✅
  - [ ] Equipe sabe usar? ✅

- [ ] **Documentação:**
  - [ ] Cada função do sistema tem guia?
  - [ ] Você tem lista de "o que fazer se X quebrar"?

### **QUINTA-SEXTA, 16-17 MAR**

- [ ] **Antigo(a) noite 12:** Tudo normal
- [ ] Última chance de encontrar bugs

### **SÁBADO-DOMINGO, 18-19 MAR**

- [ ] Repouso. Você merece.
- [ ] Revisar mentalmente: Sistema está ok?

### **SEGUNDA, 20 MAR**

- [ ] 🎉 **ABERTURA OFICIAL**

---

## 📊 CRITÉRIO SEMANA 10 "FEITO"

| Check | Status |
|-------|--------|
| Sistema está pronto | [ ] |
| Equipe está preparada | [ ] |
| Documentação completa | [ ] |
| Plano B documentado e testado | [ ] |
| Você confia no sistema | [ ] |

---

---

## 📈 RESUMO VISUAL

```
JAN               FEV               MAR
9-15  16-22      23-29 30-5   6-12 13-19  20-26
[S1]  [S2]       [S3]  [S4]   [S5] [S6]   [S7]   [S8]   [S9]   [S10]  [🎉]
Bugs  Fix-up     Print Z      Estoque  Treino  Stress  Final  Pronto  ABRIR
```

---

## 🔄 PROCESSO SEMANAL (Padrão)

```
SEGUNDA   → Diagnóstico/Planejamento
TERÇA     → Implementação
QUARTA    → Testes
QUINTA    → Validação
SEXTA     → Deploy produção
SÁBADO    → Noite real (observação)
DOMINGO   → Análise + descanso
```

---

## ✅ COMO USAR ESTE DOCUMENTO

1. **Cada semana:** Abra a seção e marque [ ] conforme avança
2. **Cada dia:** Copie o que precisa fazer para sua agenda
3. **Problemas encontrados:** Novo arquivo `NOITE_X_JAN_LOG.md`
4. **Dúvidas:** Pergunte ao Copilot, não improvise

---

## 🚨 REGRA OURO

**Se encontrar bug que quebra operação:**
- Para a noite
- Documente exatamente o que aconteceu
- Reporte segundo de manhã (Copilot fixa até à noite)

**Se encontrar UI bug (incômodo, não quebra):**
- Continue operando
- Anote
- Fixa próxima semana

---

## 📞 DÚVIDAS SOBRE ROADMAP?

- Cada semana tem critério claro de "feito"
- Cada tarefa é atômica (1 pessoa, 1 coisa, ~4h)
- Se algo tomar mais tempo, estender para semana seguinte
- Se algo terminar mais cedo, começa feature próxima semana

**Você pronto para começar?**
