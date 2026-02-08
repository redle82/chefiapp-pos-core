# Teste Humano Supremo E2E — Prompt para o Antigravity (v1.1)

**Data:** 2026-02-01
**Uso:** Copiar e colar este documento na íntegra no antigravity para executar o Teste Humano Supremo completo.
**Regra:** Se houver "volta para landing", "tela vazia" ou "rota que não carrega" → FALHA imediata (não continuar).

**Contexto existente:** [VALIDACAO_TESTE_HUMANO_E2E.md](../VALIDACAO_TESTE_HUMANO_E2E.md) · [FASE_5_FASE_B_TESTE_HUMANO.md](../implementation/FASE_5_FASE_B_TESTE_HUMANO.md)

---

## Papel do agente

Tu és o Antigravity, atuando como humano real + QA sênior + operador de restaurante.

Age como:

- dono (setup)
- operador (TPV/KDS)
- auditor (veredito final)

**Proibição:** não assumes intenção do sistema. Só aceitas o que funciona no ecrã.

---

## Objetivo do teste (end-to-end real)

Executar o fluxo humano completo:

**Entrada → criar conta → criar restaurante → configurar → criar menu → ver billing (trial) → abrir turno → TPV desktop → KDS desktop → pedido real → ciclo fechado**

Sem demo fake. Sem bypass. Sem "modo dev".

---

## Ambiente

- **Frontend Web:** localhost:5175
- **Core backend:** Docker local (porta 3001)
- **Modo esperado:** TRIAL_REAL (14 dias)
- **Dispositivo:** Desktop (browser) apenas
- **Base de dados:** local (persistente)
- **Stripe:** não precisa cobrar (apenas abrir Billing e validar estado)

---

## Regras do teste (hard)

1. Não pular passos.
2. Não corrigir bugs — apenas reportar.
3. Se algo quebrar, para e registra (não "tenta contornar").
4. **Loop = falha:** se voltar para landing sem decisão explícita, falhou.
5. **Tela vazia = falha:** rota que carrega em branco é falha.
6. **"Funciona mais ou menos" = falha.**
7. Se aparecer opções "gerente/staff" na web de configuração, falha.
8. Se aparecer "demo/piloto" como modo principal, falha.
9. Se surgir mensagem técnica ("RPC", "schema", "endpoint", "token", "JSON") visível ao utilizador, falha.

---

## Pré-flight (antes de começar)

Antes de abrir `/`:

- Confirmar que localhost:5175 responde.
- Confirmar que Core (3001) está online.
- Se o browser mostrar "connection refused" / "vite server connection lost" → interromper e registrar.

Depois de entrar na área web (sidebar visível):

- Existe um indicador discreto de estado do sistema (badge na sidebar: 🟢 ativo / 🟡 instável / 🔴 offline). Não há telas técnicas intermediárias no fluxo.

---

## FASE 1 — Entrada e criação do restaurante (WEB)

### 1. Entrada (porta única)

- Acessar `/`
- Validar:
  - existe CTA claro "Criar restaurante / Começar"
  - não existe demo separado
  - não existe perfil gerente/staff
  - não existem duas landings diferentes (conteúdo/valor/preço divergente)

**Esperado:** CTA leva para auth/criação sem loops.

- **PASSA** se: 1 CTA principal e percurso é previsível
- **FALHA** se: cair em "modal" e voltar pro início sem sair do labirinto

### 2. Criar conta + restaurante (sem escapes)

- Criar conta (email fictício)
- Criar restaurante: nome, contacto, localização, horários

Validar:

- fluxo é linear
- não há bloqueio por billing
- não há erro crítico no console

- **PASSA** se: termina com restaurante criado e leva para área web
- **FALHA** se: volta pra landing ou não "sela" o restaurante

---

## FASE 2 — Web de configuração (WEB)

### 3. Configuração operacional (todas as rotas carregam)

Aceder à área de Configuração Operacional.

Validar estas telas/rotas (uma por uma):

- Menu Builder
- Tarefas
- Pessoas
- Presença Online
- Billing
- Compras
- Financeiro
- Reservas
- Multi-unidade
- QR Mesa
- Painel Pedidos Prontos

Para cada rota:

- carrega sem crash
- não retorna null
- não fica em branco
- mostra estado coerente (mesmo vazio)

- **PASSA** se: nenhuma rota vazia
- **FALHA** se: rota em branco / 404 silencioso / loop

### 4. Criar menu (1 produto real)

- Criar 1 produto real: nome, preço, estação (cozinha), tempo de preparo

Validar:

- item aparece no menu
- item persiste ao recarregar
- Unexpected token `<` = falha crítica

- **PASSA** se: produto salvo e visível
- **FALHA** se: erro de parsing, save não persiste, tela quebra, ou se o produto exigir mais de 3 passos não óbvios para ser criado

---

## FASE 3 — Billing (WEB)

### 5. Billing (trial real)

- Aceder a Billing
- Verificar:
  - estado = TRIAL ATIVO (14 dias)
  - existe CTA de planos
  - não bloqueia operação (TPV/KDS)

Regra: não pagar nada.

- **PASSA** se: billing existe e estado faz sentido
- **FALHA** se: billing não acessível / não aparece / redireciona errado

---

## FASE 4 — Operação no Desktop (TPV + KDS)

### 6. Abrir turno (TPV)

- Aceder ao TPV
- Validar:

  - exige abrir turno
  - "Abrir Turno" funciona

- **PASSA** se: turno abre sem erro
- **FALHA** se: trava, fica vazio, ou exige "setup técnico"

### 7. Fazer pedido (TPV)

- Criar pedido: balcão ou mesa
- Adicionar o produto criado
- Confirmar pedido

- **PASSA** se: pedido existe e segue fluxo
- **FALHA** se: API quebra / dados vazios / pedido some

### 8. KDS (cozinha)

- Aceder ao KDS
- Validar:

  - pedido aparece automaticamente
  - estado "em preparação"
  - marcar como pronto

- **PASSA** se: muda estado e reflete no sistema
- **FALHA** se: pedido não aparece / não sincroniza / erro

### 9. Retorno ao TPV (ciclo fechado)

- Voltar ao TPV
- Ver pedido finalizado / pronto
- Validar ciclo fechado

- **PASSA** se: pedido fechou o circuito
- **FALHA** se: "perdi o pedido" ou "não sei o que aconteceu"

---

## FASE 5 — Auditoria final (veredito)

### 10. Verificações finais

- Dashboard atualiza (mínimo: pedidos / estado)
- Nenhum erro crítico persistente no console
- Nenhuma rota essencial inacessível

---

## Entregáveis do Antigravity (obrigatório)

### 1. Status geral

- PASSOU
- PASSOU COM FALHAS
- FALHOU

### 2. Tabela de resultados

| Fase | Passo | Resultado | Observações |
| ---- | ----- | --------- | ----------- |
| 1    | 1     |           |             |
| 1    | 2     |           |             |
| 2    | 3     |           |             |
| 2    | 4     |           |             |
| 3    | 5     |           |             |
| 4    | 6     |           |             |
| 4    | 7     |           |             |
| 4    | 8     |           |             |
| 4    | 9     |           |             |
| 5    | 10    |           |             |

### 3. Lista de falhas (cada uma com)

- rota
- ação
- erro observado
- impacto: bloqueia operação / degrada UX / cosmético
- "o humano faria o quê agora?"

### 4. Veredito humano final

**"Como dono de restaurante, eu conseguiria vender com isto hoje?"**

Sim / Não — por quê.

### 5. (Opcional) Evidência visual

Anexar 3 screenshots:

1. Menu com produto criado
2. Pedido no TPV
3. Pedido no KDS

_(Ajuda quando fores mostrar a terceiros.)_

---

## Critério de sucesso absoluto

O teste só passa se um humano conseguir:

**criar restaurante → criar 1 produto → abrir turno → fazer pedido → ver no KDS → fechar o ciclo**

sem intervenção técnica e sem loops.

---

## Quando o antigravity terminar

Não corrigir nada ainda. Primeiro: ler o relatório como investidor/dono.

Próximos cortes possíveis:

1. Plano de correção 72h
2. Teste Humano Supremo v2 (AppStaff incluído)
3. DoR (Definition of Ready para venda)

---

## O que fazer agora

- Substituir o documento atual por esta v1.1 (regras "Loop = falha" e "Tela vazia = falha").
- Rodar o antigravity de novo com este critério duro.

Se quiseres, podes pedir um template de relatório do antigravity (1 página) já pronto para colar depois do teste, com scoring e prioridade automática.
