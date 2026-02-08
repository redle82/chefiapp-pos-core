# PROMPT CANÓNICO — Finalização do AppStaff (execução real)

**Uso:** Copiar/colar no Cursor para a IA **verificar → corrigir → provar no navegador**. Documento executável; não interpretar, executar.

---

## Missão

Fazer o AppStaff funcionar como um aplicativo operacional real: entrada simples e previsível, troca clara de perfis (dono, gerente, garçom, cozinha, limpeza), zero bloqueios invisíveis de Gate, navegação funcional entre modos, aparência de app (não de site), funcionamento comprovado no browser e em PWA standalone.

**Proibido:** Refatorar arquitetura; criar contratos novos; alterar Canon visual; "melhorar UX" sem pedido; introduzir features novas. Corrigir apenas execução, gates, estado e entrega.

---

## Contexto obrigatório

- AppStaff é um produto (terminal humano do ChefIApp OS), não uma página web.
- Vive em `/app/staff/*` dentro do merchant-portal (piloto).
- "Cara de app" = Shell + Launcher + Modos, não CSS isolado.
- "App real" só acontece quando aberto como PWA standalone.
- Se não entra → problema de Gate / estado / dados, não UX.

---

## FASE 1 — Diagnóstico real

### 1.1 StaffAppGate

**Ordem real de bloqueio:** 1) restaurant/location 2) contract 3) worker (gm_restaurant_people / gm_staff).

**Exigir:** Logs temporários (consola + debug visual quando `?debug=1`) com:

- hasRestaurant  
- hasLocation  
- hasContract  
- hasWorker  
- workerId  
- workerRole  
- source (dev | manual | qr)

**Ficheiro:** [merchant-portal/src/pages/AppStaff/routing/StaffAppGate.tsx](merchant-portal/src/pages/AppStaff/routing/StaffAppGate.tsx)

**Critério de aceite:** Todo o bloqueio renderiza uma view explícita (NoLocationsView, LocationSelectView, AppStaffLanding, WorkerCheckInView). Nenhum gate pode falhar em silêncio, redirecionar sem explicar ou deixar o utilizador preso.

**BUG CRÍTICO se:** Gate falha silenciosamente, redireciona sem explicar ou deixa o utilizador preso.

### 1.2 Dados reais

**Validar via readers ou queries:**

- Existe 1 restaurante ativo.
- Existem pessoas com roles: owner, manager, waiter, kitchen, cleaning (idealmente 5; mínimo 1 por role utilizada).
- Cada pessoa: role válido, ligada ao restaurante, selecionável por id ou staff_code.

**Ficheiros:** [merchant-portal/src/core-boundary/readers/RestaurantPeopleReader.ts](merchant-portal/src/core-boundary/readers/RestaurantPeopleReader.ts), seeds em [docker-core/schema/migrations/](docker-core/schema/migrations/).

**Critério de aceite:** Se faltar dado, mostrar fallback operacional (ex.: Staff Switcher em modo debug), nunca tela vazia nem erro técnico exposto.

**BUG se:** Bloqueio com tela vazia; sem fallback operacional.

---

## FASE 2 — Entrada simples

**Staff Switcher DEV/DEMO (obrigatório).** Controlado por `isDebugMode()` ou `?debug=1`.

**Local permitido:** [merchant-portal/src/pages/AppStaff/AppStaffLanding.tsx](merchant-portal/src/pages/AppStaff/AppStaffLanding.tsx) ou [merchant-portal/src/pages/AppStaff/WorkerCheckInView.tsx](merchant-portal/src/pages/AppStaff/WorkerCheckInView.tsx).

**Renderizar bloco claro:**

- Título: "Entrar como:"
- Botões: Dono, Gerente, Garçom, Cozinha, Limpeza (com emojis: 👑 🧠 🍽️ 🔥 🧹).

**Comportamento de cada botão:** Selecionar perfil (pessoa real do seed quando existir), definir activeWorker, permitir entrar no launcher sem QR/código/contrato. Referência de implementação: `devQuickCheckIn(role)` em [merchant-portal/src/pages/AppStaff/context/StaffContext.tsx](merchant-portal/src/pages/AppStaff/context/StaffContext.tsx).

**Critério de aceite:** Sistema testável sem dados de produção. Sem isto o sistema não é testável.

---

## FASE 3 — Navegação real

**Verificar:**

- `/app/staff/home` → entra direto no Launcher (grid de tiles).
- Tiles: TPV → TPV real; KDS → KDS real; Turno → Turno; Tarefas → Tarefas; Exceções → Exceções.

**Ficheiros:** [merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts](merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts), rotas em [merchant-portal/src/App.tsx](merchant-portal/src/App.tsx).

**BUG se:** Volta para home sem motivo; não renderiza nada; quebra layout; perde Shell. Problema = rota, guard ou Shell, não UI.

---

## FASE 4 — App de verdade (entrega)

### 4A PWA

**Verificar:**

- [merchant-portal/public/manifest.json](merchant-portal/public/manifest.json): `display: "standalone"`, `start_url: "/app/staff/home"`.
- [merchant-portal/vite.config.ts](merchant-portal/vite.config.ts): plugin PWA ativo (VitePWA).

**Teste obrigatório:** Abrir no Chrome → "Instalar app" (ou equivalente) → abrir pelo ícone. Se ainda aparece barra de URL, o problema não é CSS; é modo de abertura incorreto.

### 4B Shell (sensação nativa, sem refactor)

**Verificar em** [merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx](merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx):

- `height: 100dvh` (e minHeight 100vh onde aplicável).
- `overflow: hidden` no container principal.
- Um único scroll (área central).
- Sem containers de landing (margens excessivas, centralização tipo site).
- Sem texto explicativo longo.

Se parece "site" → herança indevida de layout.

---

## FASE 5 — Teste final

**Executar exactamente este roteiro:**

1. Abrir `/app/staff/home` (com `?debug=1` para Staff Switcher).
2. Entrar como Gerente.
3. Abrir: TPV, KDS, Tarefas.
4. Voltar ao Launcher.
5. Trocar para Garçom (recarregar ou check-out e entrar de novo).
6. Abrir TPV novamente.
7. Instalar como PWA (Chrome: instalar app).
8. Abrir pelo ícone.
9. Repetir passos 2–6 na janela PWA.

**Critério de aceite:** Tudo funciona sem reload estranho, sem telas vazias, sem perder estado.

**Roteiro detalhado e tabela de verificação:** [APPSTAFF_TESTE_FINAL_ROTEIRO.md](APPSTAFF_TESTE_FINAL_ROTEIRO.md).

---

## FASE 6 — Relatório final

Entregar apenas (template a preencher):

1. **O que estava a bloquear** — (ex.: gate contract sem fallback, dados em falta sem mensagem).
2. **O que foi corrigido** — (ex.: logs no Gate, Staff Switcher com emojis, fallback quando sem pessoas).
3. **Como entrar em cada perfil** — (ex.: URL com `?debug=1`, bloco "Entrar como:", clicar Dono/Gerente/Garçom/Cozinha/Limpeza).
4. **Confirmação visual do AppStaff funcional** — (ex.: launcher visível, tiles a abrir modos, PWA sem barra de URL).
5. **O que fica para v2** — (ex.: QR real, segurança em produção, Expo / app nativo).

---

## Proibido

- Refazer arquitetura.
- Criar contratos novos.
- Alterar Canon visual.
- "Melhorar UX" sem pedido.
- Introduzir features novas.

---

## Regra de ouro

- Se não dá para entrar → não é um app.
- Se não dá para trocar de papel → não é um sistema operacional.

---

## Referência

Roteiro detalhado e tabela de verificação para FASE 5: [APPSTAFF_TESTE_FINAL_ROTEIRO.md](APPSTAFF_TESTE_FINAL_ROTEIRO.md).
