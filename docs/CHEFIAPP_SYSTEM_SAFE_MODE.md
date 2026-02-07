# PROMPT CANÓNICO — CHEFIAPP SYSTEM SAFE MODE

Documento para colar em qualquer IA (Cursor, ChatGPT, Claude, Copilot, etc.) ao iniciar uma tarefa no projeto ChefIApp.

---

Você está a trabalhar no projeto ChefIApp, um sistema operacional para restaurantes com arquitetura viva, contratos explícitos e doutrina imutável.

## 0. REGRA DE OURO (NÃO NEGOCIÁVEL)

👉 Nunca altere arquitetura, rotas, entrypoints, shells, gates ou providers sem autorização explícita.
👉 Nunca crie V1/V2/V3 paralelos do mesmo app.
👉 Nunca introduza onboarding em wizard, dashboards web disfarçados de app ou dependência obrigatória de backend para operar.

Se uma ideia violar isso, recuse e explique porquê.

## 1. ARQUITETURA EXISTENTE (FONTE DE VERDADE)

Antes de sugerir qualquer código, assuma como verdade absoluta:

### AppStaff

- App único, com camadas por papel (owner / manager / staff / kitchen / cleaning).
- Papel vem da sessão/contrato, nunca da URL.
- Entry real: App.tsx → AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas
- Launcher real: AppStaffHome.tsx (tiles, sensação de app, sem dashboard).

### Shell

- Shell manda na altura e no scroll.
- Um único scroll: content scroller do StaffAppShellLayout.
- Top Bar e Bottom Nav fixos.
- Páginas filhas não usam 100vh, minHeight: 100vh nem overflow: auto no root.

## 2. LEI FINAL DE UI (OBRIGATÓRIO LER)

Antes de propor UI ou layout, você DEVE obedecer a:

- docs/architecture/APPSTAFF_VISUAL_CANON.md (Lei Final)
- Contratos subordinados:
  - APPSTAFF_APPROOT_SURFACE_CONTRACT.md
  - APPSTAFF_HOME_LAUNCHER_CONTRACT.md
  - MENU_VISUAL_RUNTIME_CONTRACT.md (para menu)

👉 Em caso de conflito entre código, sugestão e Canon: o Canon vence.

## 3. O QUE ESTE DOCUMENTO DE MAPA FAZ (E O QUE NÃO FAZ)

Use como apoio:

- docs/audit/AUDITORIA_MAPA_ALINHAMENTO_2026-02-07.md

Ele serve para:

- alinhamento semântico
- onboarding
- revisão visual
- comunicação com IA

Ele NÃO:

- define rotas
- cria entrypoints
- muda providers
- substitui contratos técnicos

Nunca use o mapa para refatorar arquitetura.

## 4. COMO RESPONDER (FORMATO ESPERADO)

Sempre que fores responder ou propor algo:

1. **Diz onde isso vive:** Ficheiro(s) exatos; Rota(s) envolvidas (se houver).
2. **Diz o que NÃO vais tocar:** Rotas; Shell; Gates; Providers; Contratos.
3. **Diz por que isto não quebra o Canon:** Referência direta a secção do Canon ou contrato.
4. **Propõe mudança mínima:** Sem reestruturação global; Sem duplicação; Sem abstração desnecessária.

Se não conseguires cumprir os 4 pontos → não implementar.

## 5. PROIBIÇÕES EXPLÍCITAS

Você NÃO PODE:

**Reintroduzir:**

- banners explicativos
- textos do tipo "toque aqui para…"
- grids administrativos
- layouts de portal web no AppStaff

**Criar:**

- "novo app" para cada papel
- onboarding em passos
- múltiplos scrolls

**Decidir:**

- papel por URL
- execução a partir do dashboard
- bloqueio operacional por backend

## 6. SE ESTIVER EM DÚVIDA

Se houver incerteza:

- Pare
- Faça uma pergunta
- Ou proponha uma auditoria, não código

Exemplo correto: "Antes de sugerir código, isto parece tocar no Canon §3 (Shell manda no scroll). Confirmas se posso mexer apenas em AppStaffHome?"

## 7. FRASE-LEI (GUARDAR)

Arquitetura manda.
Contratos protegem.
O Canon governa.
A IA obedece.
