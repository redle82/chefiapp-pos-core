# ✅ AppStaff — Checklist de Demonstração

**Versão**: 1.0  
**Uso**: QA Humano, Vendas, Onboarding

---

## Pré-Demonstração

- [ ] Servidor rodando (porta 4320)
- [ ] Frontend rodando (merchant-portal)
- [ ] Banco de dados configurado
- [ ] 15 sessões de browser preparadas
- [ ] Ambiente de teste isolado

---

## FASE 1: Restaurante Vazio

### Validações

- [ ] Cada funcionário (exceto owner) tem pelo menos 1 tarefa
- [ ] Tarefas são relevantes para cada role
- [ ] Sistema não mostra tela vazia
- [ ] Tarefas de rotina aparecem automaticamente

### Pontos de Atenção

- [ ] Garçom: tarefas relacionadas a mesas/atendimento
- [ ] Cozinha: tarefas relacionadas a preparação/estoque
- [ ] Bar: tarefas relacionadas a bebidas
- [ ] Limpeza: tarefas relacionadas a limpeza/turnover

---

## FASE 2: Pedidos Web

### Validações

- [ ] Cozinha recebe tarefas automaticamente
- [ ] Bar recebe tarefas (se houver bebidas)
- [ ] Runner recebe tarefa de apoio
- [ ] Garçom NÃO recebe tarefas de pedido web

### Pontos de Atenção

- [ ] Tarefas aparecem sem refresh manual
- [ ] Não há duplicação de tarefas
- [ ] Owner Dashboard atualiza vendas

---

## FASE 3: Pedidos QR

### Validações

- [ ] Garçom responsável recebe tarefa para mesa correta
- [ ] Cozinha recebe tarefas normalmente
- [ ] Bar recebe tarefas (se houver bebidas)
- [ ] Sistema não duplica tarefas

### Pontos de Atenção

- [ ] Mesa 3 → Garçom A
- [ ] Mesa 7 → Garçom B
- [ ] Status do pedido evolui em tempo real

---

## FASE 4: Pedido Manual

### Validações

- [ ] Pedido entra como "pedido assistido"
- [ ] Cozinha e bar recebem tarefas
- [ ] Nenhum conflito com pedidos web/QR
- [ ] Garçom não recebe tarefa redundante

### Pontos de Atenção

- [ ] Múltiplos canais funcionam simultaneamente
- [ ] Sem duplicação
- [ ] Sem confusão

---

## FASE 5: Pagamento

### Validações

- [ ] Garçom recebe tarefa: "Finalizar mesa"
- [ ] Limpeza recebe tarefa automática: "Limpar Mesa X"
- [ ] Sistema libera mesa
- [ ] Owner Dashboard atualiza faturamento
- [ ] AppStaff remove tarefas concluídas

### Pontos de Atenção

- [ ] Cadeia de ações automática
- [ ] Sem intervenção manual
- [ ] Mesa liberada corretamente

---

## FASE 6: Múltiplos Chamados

### Validações

- [ ] Apenas uma tarefa ativa (sem spam)
- [ ] Sistema registra múltiplos sinais
- [ ] Garçom vê urgência aumentada
- [ ] Gerente pode ver alerta de pressão
- [ ] AppStaff mantém calma operacional

### Pontos de Atenção

- [ ] Deduplicação funciona
- [ ] Urgência é comunicada
- [ ] Trabalho permanece organizado

---

## Validações Finais

### Sistema Nunca Fica Vazio

- [ ] Todos os funcionários (exceto owner) têm tarefas
- [ ] Sistema continua vivo mesmo sem clientes
- [ ] Não há tela vazia

### Tarefas Relevantes por Role

- [ ] Cozinha: preparação, pedidos, estoque
- [ ] Bar: bebidas, preparação
- [ ] Garçom: mesas, atendimento
- [ ] Limpeza: limpeza, turnover

### Sem Duplicação

- [ ] Múltiplos chamados não criam múltiplas tarefas
- [ ] Sistema deduplica automaticamente
- [ ] Não há spam

### Reação em Tempo Real

- [ ] Tarefas aparecem automaticamente
- [ ] Sem refresh manual
- [ ] Sem intervenção

---

## Resultado Esperado

✅ **Sensação geral**: "O restaurante está se movendo sozinho"

✅ **Sistema funciona como sistema nervoso operacional**

✅ **Pessoas trabalham. Sistema gerencia.**

---

## Notas para Demonstração

### Pontos Fortes a Destacar

1. **Sistema nunca fica vazio** — Resolve problema psicológico
2. **Múltiplos canais** — Web, QR, manual funcionam juntos
3. **Sem duplicação** — Sistema deduplica automaticamente
4. **Reação em tempo real** — Tarefas aparecem automaticamente
5. **Calma operacional** — Pressão não vira caos

### Objeções Comuns

**"E se não houver tarefas?"**  
→ Sistema gera tarefas de rotina automaticamente

**"E se houver spam?"**  
→ Sistema deduplica múltiplos chamados

**"E se a pessoa errada receber a tarefa?"**  
→ Sistema conhece estrutura da equipe

**"E se precisar de gestão manual?"**  
→ Sistema gerencia automaticamente

---

## Métricas de Sucesso

- ✅ 15 funcionários conectados simultaneamente
- ✅ 0 telas vazias
- ✅ 100% de tarefas relevantes por role
- ✅ 0 duplicações
- ✅ Reação em tempo real (< 2s)

---

**ChefIApp — TPV simples. Sem comissões. Sem gestão.**

