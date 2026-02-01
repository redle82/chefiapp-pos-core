# SUPREME HUMAN E2E TEST — Saturday Night Chaos

**Propósito:** Ensaio geral do mundo real. Simulação humana completa (não automatizada) de um restaurante em hora de ponta ao Sábado. Antigravity = equipa humana simulada; comportamento de pessoas cansadas sob pressão.

**Referências:** [CLOSED_PILOT_CONTRACT.md](../architecture/CLOSED_PILOT_CONTRACT.md), [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md), [CORE_FAILURE_MODEL.md](../architecture/CORE_FAILURE_MODEL.md).

**Uso:** Executor humano (ou equipa) segue as fases e regras abaixo; preenche o relatório no fim. Não optimizar, não simplificar, não assumir que funciona.

---

## Role

Tu és **Antigravity**, a actuar como equipa completa de simulação humana dentro de um restaurante real em hora de ponta ao Sábado.

- Não optimizes, não simplifiques, não assumas que as coisas funcionam.
- Comporta-te como humanos cansados sob pressão.

---

## Context

| Item                       | Valor                            |
| -------------------------- | -------------------------------- |
| Sistema em teste           | ChefIApp POS OS                  |
| Autoridade de arquitectura | Docker Financial Core (soberano) |
| Terminais                  | Todos ligados ao mesmo Core      |

**Terminais activos:**

- Command Center (Web)
- TPV (Desktop)
- KDS (ecrã cozinha)
- AppStaff (simuladores Android + iOS)
- Web Pública (QR / mesas)

**Janela de tempo simulada:** 20:00 → 23:00

---

## Roles a simular (TODOS obrigatórios)

1. **Owner**
2. **Manager**
3. **Waiter A** (experiente)
4. **Waiter B** (novo, lento, comete erros)
5. **Kitchen Staff**
6. **Cleaner / Support**
7. **Random Customer** (QR / Web)
8. **Impatient Customer**
9. **System Observer** (logs + métricas)

---

## Fases do cenário

### PHASE 1 — Abertura do restaurante (20:00)

- Owner cria um novo restaurante
- Configura: Menu, Mesas, Um método de pagamento
- Manager faz login
- Dispositivos AppStaff ligam (Android + iOS)
- KDS é ligado
- TPV é aberto

**Verificar:**

- Todos os terminais mostram o mesmo restaurante
- Core é a única autoridade (sem verdade local)

---

### PHASE 2 — Pedidos de todo o lado (20:30)

**Em simultâneo:**

- Waiter A cria pedidos a partir do AppStaff (mini TPV)
- Waiter B cria pedidos mas: cancela um, edita outro
- Cliente faz pedido via QR / Web
- Manager cria um pedido no TPV
- Owner observa no Command Center

**Verificar:**

- Todos os pedidos aparecem no KDS
- Mudanças de estado propagam correctamente
- Sem pedidos duplicados
- Sem totais em falta
- Sem desync UI vs verdade do Core

---

### PHASE 3 — Pressão na cozinha (21:00)

- Cozinha marca pedidos como: Started, Delayed, Ready
- Um pedido é intencionalmente ignorado durante vários minutos
- Ecrã KDS permanece ligado continuamente

**Verificar:**

- KDS não congela
- Pedidos não desaparecem
- Estado reflectido em: AppStaff, TPV, Command Center

---

### PHASE 4 — Tarefas e caos humano (21:30)

- Manager cria tarefas: Limpar mesa, Encher frigorífico, Tirar lixo
- Tarefas aparecem em: AppStaff (Waiter / Cleaner)
- Waiter A completa tarefas
- Waiter B esquece uma tarefa
- Cleaner completa tarefa atrasada

**Verificar:**

- Estado das tarefas actualiza correctamente
- Nenhum role faz o que não deve
- Tarefas NÃO interferem com pedidos ou pagamentos

---

### PHASE 5 — Pico de carga (22:00)

- Rajada de pedidos: TPV, AppStaff, Web QR
- Simular: rede lenta num AppStaff; KDS continua online
- Observar métricas Docker: CPU, Memória, Erros

**Verificar:**

- Core não cai
- Pedidos permanecem consistentes
- Terminais atrasados recuperam sem corrupção

---

### PHASE 6 — Fecho (23:00)

- Manager deixa de aceitar pedidos
- Cozinha termina os restantes
- Owner revê: Pedidos, Totais, Conclusão de tarefas
- Sem edições manuais na DB
- Sem reinícios

**Verificar:**

- Totais financeiros fazem sentido
- Sem pedidos em falta
- Sem dados fantasmas

---

## Regras estritas

- Age como humanos reais, não como testadores
- Clica em botões errados às vezes
- Espera, hesita, esquece
- NÃO corrigas coisas a menos que o sistema te obrigue
- Se algo parecer confuso, regista — não racionalizes

---

## Relatório (preencher após o teste)

### 1. O que partiu

_(Lista: funcionalidades que falharam, erros bloqueantes, dados incorrectos)_

-
-

### 2. O que quase partiu

_(Lista: lentidão, erros recuperáveis, comportamentos estranhos)_

-
-

### 3. O que aguentou a pressão

_(Lista: fluxos que se mantiveram estáveis)_

-
-

### 4. Onde os humanos se confundiram

_(Lista: UI confusa, mensagens pouco claras, passos em falta)_

-
-

### 5. Momentos em que a verdade do Core pareceu ameaçada

_(Lista: desync, totais errados, estado inconsistente entre terminais)_

-
-

### 6. Veredito final

Assinalar um:

- [ ] **❌ Not usable** — Não utilizável
- [ ] **⚠️ Usable with stress** — Utilizável com stress (reservas)
- [ ] **✅ Ready for real restaurant pilot** — Pronto para piloto real

### 7. Resposta obrigatória

**“Se isto fosse o meu restaurante num Sábado à noite, confiaria neste sistema com o meu dinheiro e a minha equipa?”**

_(Resposta curta: Sim / Não / Só se …)_

---

_Fim do prompt. Executar o teste em ambiente real (localhost:5173 + Docker Core); preencher o relatório com honestidade._
