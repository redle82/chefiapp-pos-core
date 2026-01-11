# BETA OPERATING PLAYBOOK — ChefIApp TPV + AppStaff (v1.0)
Date: 2025-12-24
Scope: 7-day controlled beta with 1–3 restaurants
Focus: TPV + AppStaff + Settings/Compliance + Ghost/Live Truth

---

## 0) Princípios Selados

1. **UI nunca antecipa o Core**: Nenhuma promessa em estado Ghost.
2. **Operação > Estética**: Beta mede fricção e verdade, não beleza.
3. **Erro humano é previsto**: Checklists curtos + ações reversíveis.
4. **Se falhar, falhe com dignidade**: Mensagem clara + próximo passo.

---

## 1) Escopo do Beta

### Objetivo do Beta (7 dias)
- Validar fluxo real: abrir → operar → fechar, com pedidos e equipe.
- Capturar 3 tipos de sinal:
  - **Operacional**: tempo de preparo, filas, picos.
  - **Humano**: confusões, cliques errados, "onde eu faço X?".
  - **Verdade**: UI prometeu algo que o Core não permite? (zero tolerância).

### Definição de Sucesso (sem romantismo)
- 5 dias seguidos com operação sem "travamentos mentais".
- **0 casos de "UI mentiu"**.
- Incidentes registrados em tempo real (não na memória).

---

## 2) Rotina Diária

### Abertura (3 min)
1. Ver estado: `TruthBadge = LIVE` (se estiver GHOST, parar e corrigir setup).
2. TPV: confirmar que lista carrega e ações de status funcionam.
3. AppStaff: confirmar turno ativo e tarefas visíveis.
4. Settings/Compliance: status ok (sem alertas críticos).

### Operação (durante o turno)
- Um "operador" responsável por:
  - Mover status dos pedidos.
  - Encerrar pagamentos.
  - Registrar incidentes.

### Fecho (4 min)
1. Conferir pedidos pendentes (não deixar "fantasmas").
2. Registrar 3 números: receita, nº pedidos, tempo médio preparo (mesmo que seja manual).
3. Logar incidentes + top 3 fricções do dia.

---

## 3) SOP — TPV (Ponto de Venda)

### Fluxo Padrão do Pedido
1. Novo → 2) Em preparo → 3) Pronto → 4) Servido → 5) Pago

### Regras do Operador
- **Nunca pular estados** (se precisar, registrar incidente "state jump needed").
- Se o pedido foi errado: registrar como incidente + "ação corretiva" (não apagar sem rastro no beta).

### Microcopy Operacional (curto)
- "Novo" = chegou agora
- "Preparo" = cozinha assumiu
- "Pronto" = pode sair
- "Servido" = mesa recebeu
- "Pago" = fechado

### Checklist TPV (1 min)
- [ ] Ações mudam status sem delay confuso
- [ ] Pagamento confirma com feedback (Toast/InlineAlert)
- [ ] Botões não estão pequenos demais no mobile (dedo real)

---

## 4) SOP — AppStaff (Equipe)

### O que o Beta Valida Aqui
- Tarefas são claras, executáveis, auditáveis.
- Manager vê riscos sem virar "painel de culpa".
- Owner vê saúde sem ruído.

### Regras
- **Worker**: só vê o que precisa fazer agora.
- **Manager**: vê bloqueios, riscos e pendências HACCP.
- **Owner**: vê "estado do sistema" + justiça (equidade) + conformidade.

### Checklist AppStaff (2 min)
- [ ] Worker entende "o que fazer agora" em 10 segundos
- [ ] Manager encontra pendências HACCP sem procurar demais
- [ ] Owner entende se está saudável ou perigoso sem interpretar gráfico

---

## 5) SOP — Settings & Compliance

### Objetivo
Evitar "gambiarra silenciosa" antes que vire cultura.

### Checklist Settings (2 min)
- [ ] Perfil do restaurante correto
- [ ] Perfil legal (país) coerente com operação
- [ ] HACCP: regras-chave visíveis e compreensíveis
- [ ] Certificados/logs: "pendente" sempre explícito (sem fingir ativo)

---

## 6) Incident Log (template)

Criar um log por dia. Formato simples:

```
INCIDENTE
- ID: BETA-YYYYMMDD-###
- Hora:
- Página: (TPV / AppStaff / Settings / Home / Analytics)
- Tipo: (Bug / UX confuso / Performance / Verdade / Acessibilidade)
- O que aconteceu (1 frase):
- Impacto: (baixo/médio/alto)
- Reprodução: (passo a passo em 3 linhas)
- Evidência: (print/link)
- Ação imediata: (o que você fez pra continuar)
- Fix sugerido: (1 frase)
```

**Regra**: Se for "Verdade", é P0.

---

## 7) Script de Onboarding (5 minutos) para o Piloto

1. "Aqui não é um app bonito — é um app honesto."
2. Mostrar `TruthBadge`: GHOST vs LIVE (o que muda).
3. TPV: mover 1 pedido do início ao fim.
4. AppStaff: marcar 1 tarefa + mostrar risco/HACCP.
5. Settings: onde configurar e onde NÃO mexer no meio do turno.
6. "Se algo parecer mentira, você grita. Esse é o teste."

---

## 8) Métricas Mínimas (sem depender de backend perfeito)

Por dia, anotar:
- Receita (€)
- Nº pedidos
- Ticket médio
- Tempo médio preparo (estimado ok)
- Top 3 fricções (texto)
- Incidentes (contagem + links)

---

## 9) After Action (fim do 7º dia)

- Top 10 fricções (rank)
- Top 5 incidentes (com evidências)
- Decisão: corrigir agora vs aceitar dívida
- Preparar "Playwright Week" (automação pós-sinal)

---

## Regras de Ouro (imutáveis)

1. **UI nunca antecipa o Core**: Se está em Ghost, não prometa operação.
2. **Incidentes de "Verdade" são P0**: Zero tolerância.
3. **Erro humano é previsto**: Checklists, feedback claro, ações reversíveis.
4. **Se falhar, falhe com dignidade**: Mensagem clara + próximo passo.

---

## Notas Finais

- Este playbook é operacional amanhã.
- Microcopy truth-first: sem promessas em Ghost.
- Após o beta: Playwright para blindar a verdade encontrada.
