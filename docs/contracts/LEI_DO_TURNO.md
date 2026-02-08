# Lei do Turno

Contrato de estado operacional: quem manda no conceito de “turno aberto” e como todas as superfícies o observam.

**Referência:** Diagnóstico pós–Teste Humano Supremo (Profundo v2.5 e Sistémico v3.0).
**Objetivo:** Uma única verdade para “turno”; zero contradição entre TPV, KDS e Dashboard.

---

## Princípio

O turno não é um efeito colateral do TPV.
O turno é um **facto sistémico**: criado explicitamente, observado por todas as superfícies, partilhado em memória comum.

---

## Regras (Lei do Turno)

1. **Existência única**
   Existe no sistema **um único Turno Ativo por restaurante** (por contexto de tempo). Não há “turno do TPV” e “turno do KDS” — há um turno.

2. **Criação explícita**
   O turno é **criado explicitamente** por uma pessoa num ponto operacional (ex.: ação “Abrir turno” no TPV ou no App Staff; ver [CONTRATO_DO_TURNO.md](./CONTRATO_DO_TURNO.md)). Não é inferido apenas pelo primeiro pedido; é aberto antes.

3. **Enquanto o turno estiver ativo**

   - **TPV** pode criar pedidos.
   - **KDS** deve exibir a fila de pedidos e permitir transições de estado (preparar → pronto).
   - **Dashboard** deve mostrar métricas do dia (pedidos hoje, receita, turnos ativos) e histórico por turno.

4. **Integridade**
   Se **existe pelo menos um pedido** criado no contexto desse restaurante/dia, o turno **não pode ser considerado fechado** até encerramento explícito. Ou seja: “Se há pedido, o turno existe.”

5. **Fonte única de verdade**
   O estado “turno aberto” vive numa **única fonte** (Core ou contexto global partilhado). TPV, KDS e Dashboard **leem** esse estado; não o recalculam nem inferem sozinhos.

---

## O que isto proíbe

- Que o Dashboard diga “O turno ainda não está aberto” quando o TPV já criou pedidos no mesmo contexto.
- Que o KDS exija “Abrir turno no TPV” quando o turno já está aberto noutra superfície.
- Que cada superfície mantenha o seu próprio “estado de turno” sem partilha.

---

## O que isto exige

- **Uma** entidade ou contrato “Turno Ativo” (por restaurante).
- Todas as superfícies críticas (TPV, KDS, Dashboard) **consultam** essa fonte após navegação ou refresh.
- Abertura e fecho de turno são **eventos** que atualizam essa fonte; o resto reage.

---

## Veredito de conformidade

O sistema está em conformidade com a Lei do Turno quando:

- Um operador abre o turno no TPV (ou Dashboard) e, sem nova ação, o KDS e o Dashboard refletem “turno aberto” e mostram fila/métricas coerentes.
- Não aparecem mensagens contraditórias (“turno fechado” numa superfície e “pedido criado” noutra no mesmo contexto).

---

_Documento canónico. Base para correção cirúrgica do estado de turno (sem debate subjetivo)._
