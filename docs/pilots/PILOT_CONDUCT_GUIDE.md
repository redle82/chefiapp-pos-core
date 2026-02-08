# Guia de Condução do Piloto - 7 Dias

**Data:** 2026-01-25  
**Status:** Sistema pronto para piloto real

---

## 🎯 Objetivo do Piloto

**Não é teste. Não é demo. É uso real.**

Validar que o sistema governa pessoas reais, não apenas código.

---

## ✅ Estado Atual do Sistema

### O que está funcionando:
- ✅ Core governa (constraints ativas)
- ✅ UI obedece (RPC `create_order_atomic`)
- ✅ Constraints falam (mensagens claras)
- ✅ Erros educam (sugestões automáticas)
- ✅ Estado é visível (dashboard de observabilidade)
- ✅ Nada crítico depende de "achismo"

### O que foi construído:
- Interface de governança, não UI bonita
- Sistema que explica por que bloqueia
- Sistema que sugere o que fazer
- Sistema que mostra o que está errado agora
- Sistema que revela quem está atrasando
- Sistema que indica saúde operacional

---

## ⚠️ REGRAS DE OURO (Durante os 7 Dias)

### ❌ NÃO FAZER:
- ❌ Não melhorar UI
- ❌ Não "polir" UX
- ❌ Não ajustar mensagens
- ❌ Não mexer no schema
- ❌ Não refatorar nada
- ❌ Não "consertar" problemas aparentes

### ✅ FAZER:
- ✅ Observar
- ✅ Registrar
- ✅ Resistir à tentação de "consertar"

---

## 📝 O Que Registrar

### Diariamente (em `PILOT_7DAYS_LOG.md`):

1. **Onde bloqueou**
   - Qual ação foi bloqueada
   - Qual constraint foi violada
   - Em que contexto (mesa, pedido, operador)

2. **Se o erro foi entendido**
   - Usuário entendeu a mensagem? Sim/Não
   - Usuário soube o que fazer? Sim/Não
   - Usuário pediu ajuda? Sim/Não

3. **Se a sugestão ajudou**
   - Sugestão foi útil? Sim/Não
   - Usuário seguiu a sugestão? Sim/Não

4. **Se alguém ficou travado**
   - Quantas vezes alguém ficou sem saber o que fazer
   - Quanto tempo levou para resolver
   - Como foi resolvido

5. **Se alguém tentou burlar**
   - Tentativas de contornar constraints
   - Tentativas de "jeitinho"
   - Reações quando bloqueado

6. **Se o dashboard ajudou ou confundiu**
   - Gerente usou o dashboard? Sim/Não
   - Dashboard foi útil? Sim/Não
   - O que estava confuso?

---

## 🧠 Como Saber Se o Piloto Foi Um Sucesso

### ❌ NÃO é sucesso:
- "Ninguém reclamou"
- "Foi suave"
- "Ninguém percebeu"

### ✅ É sucesso:
- ✅ O sistema incomodou
- ✅ O sistema bloqueou
- ✅ O sistema forçou decisão
- ✅ O sistema revelou falhas humanas
- ✅ O sistema se manteve íntegro

**Se isso acontecer → vitória total.**

---

## 🗓️ Checklist Pré-Piloto

### Ambiente
- [ ] Supabase local rodando
- [ ] Migrations aplicadas
- [ ] Restaurante piloto configurado
- [ ] Mesas criadas
- [ ] Cardápio completo
- [ ] Staff básico criado

### Dispositivos
- [ ] TPV instalado (tablet/computador)
- [ ] KDS instalado (tablet/TV)
- [ ] Conexão testada (TPV cria → KDS recebe)

### Treinamento
- [ ] Gerente treinado (dashboard, caixa)
- [ ] Garçons treinados (criar pedidos, entender erros)
- [ ] Cozinha treinada (KDS, avançar status)

### Documentação
- [ ] `PILOT_7DAYS_LOG.md` preparado
- [ ] `PILOT_ANALYSIS.md` preparado
- [ ] Este guia lido e entendido

---

## 📊 Métricas a Coletar

### Quantitativas:
- Total de pedidos criados
- Total de pedidos bloqueados
- Taxa de bloqueio (%)
- Total de erros técnicos
- Total de confusões de UX
- Tempo médio para resolver bloqueios

### Qualitativas:
- Feedback do gerente
- Feedback dos garçons
- Feedback da cozinha
- Reações a mensagens de erro
- Reações a bloqueios
- Uso do dashboard

---

## 🧭 O Que Vem Depois (Só Depois dos 7 Dias)

Somente após os 7 dias você decide:
- Ajustar mensagens
- Ajustar UX
- Ajustar fluxo
- Ajustar adapters
- Ajustar setup

**E você não vai "inventar" nada.**
**Você vai responder ao que aconteceu de verdade.**

---

## 💬 Suporte Durante o Piloto

### Se algo quebrar tecnicamente:
- Registrar o erro
- Documentar o contexto
- **NÃO consertar durante o piloto**
- Aguardar análise final

### Se alguém reclamar:
- Registrar a reclamação
- Documentar o contexto
- **NÃO ajustar durante o piloto**
- Aguardar análise final

### Se alguém tentar burlar:
- Registrar a tentativa
- Documentar o método
- **NÃO flexibilizar durante o piloto**
- Aguardar análise final

---

## 🎯 Conclusão

**O sistema precisa viver fora da cabeça do desenvolvedor.**

O Core já provou que funciona.
Agora ele precisa provar que governa pessoas reais.

👉 Execute o piloto.
👉 Não mexa em nada.
👉 Registre tudo.

**Quando o Dia 1 terminar, interprete os primeiros sinais — sem romantizar, sem hype, só leitura fria da realidade.**

---

*"O sistema está tecnicamente completo e humanamente observável. Isso é o limiar entre engine e produto operacional."*
