# BETA DAILY LOG — Template
Date: YYYY-MM-DD (Dia #/7)
Operator: [Nome]
Shift: [Horário]

---

## 1) Daily Metrics

- **Receita Total**: € ______
- **Nº Pedidos**: ______
- **Ticket Médio**: € ______
- **Tempo Médio Preparo**: ______ min (estimado)
- **TruthBadge Status**: [ ] GHOST  [ ] LIVE

---

## 2) System Health Check

### Abertura (3 min)
- [ ] TPV carrega e ações funcionam
- [ ] AppStaff mostra turno ativo e tarefas
- [ ] Settings: sem alertas críticos
- [ ] TruthBadge = LIVE (se Ghost, corrigir setup)

### Fecho (4 min)
- [ ] Nenhum pedido fantasma pendente
- [ ] Métricas anotadas
- [ ] Incidentes registrados

---

## 3) Incidentes

### INCIDENTE #1
- **ID**: BETA-YYYYMMDD-001
- **Hora**: __:__
- **Página**: (TPV / AppStaff / Settings / Home / Analytics)
- **Tipo**: (Bug / UX confuso / Performance / Verdade / Acessibilidade)
- **O que aconteceu** (1 frase):
- **Impacto**: (baixo / médio / alto)
- **Reprodução** (passo a passo em 3 linhas):
  1. 
  2. 
  3. 
- **Evidência**: (print/link)
- **Ação imediata**: (o que você fez pra continuar)
- **Fix sugerido** (1 frase):
- **Prioridade**: [ ] P0 (Verdade) [ ] P1 (Blocker) [ ] P2 (Médio) [ ] P3 (Baixo)

---

### INCIDENTE #2
*(repetir template se necessário)*

---

## 4) Top 3 Fricções do Dia

1. **Fricção 1**: (descrição curta)
   - Impacto: (baixo/médio/alto)
   - Sugestão:

2. **Fricção 2**: (descrição curta)
   - Impacto: (baixo/médio/alto)
   - Sugestão:

3. **Fricção 3**: (descrição curta)
   - Impacto: (baixo/médio/alto)
   - Sugestão:

---

## 5) Notas Operacionais

(Observações gerais sobre o dia, comportamento da equipe, picos de stress, etc.)

---

## 6) Decisões Tomadas

- [ ] Nenhuma ação necessária
- [ ] Abrir incidente formal (ID: ______)
- [ ] Ajustar SOP (qual: ______)
- [ ] Escalar para correção imediata

---

## Regras de Preenchimento

1. **Verdade = P0**: Se UI mentiu ou permitiu algo que o Core não permite, é prioridade máxima.
2. **Incidentes em tempo real**: Não confiar na memória; anotar na hora.
3. **Fricções são diferentes de bugs**: Fricção = operador hesitou, bugs = sistema quebrou.
4. **Foco em ação**: Cada incidente deve ter "fix sugerido" (mesmo que seja "não corrigir agora").

---

## After Action (7º dia)

Ao final do 7º dia, consolidar:
- Top 10 fricções (rank por impacto × frequência)
- Top 5 incidentes (com evidências)
- Decisão: corrigir agora vs aceitar dívida consciente
- Preparar "Playwright Week" (automação pós-sinal)
