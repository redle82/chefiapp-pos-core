# Contrato do Design System — Core

## Lei do sistema

**O Design System é um CONTRATO VISUAL E INTERACIONAL, transversal a todos os terminais do ChefIApp (Landing, Web Pública, Web Operacional, AppStaff, KDS, TPV). É subordinado ao Core e aos contratos arquiteturais. Core decide. Contratos autorizam. Design System revela.**

O Design System é um **detector de superfície**: onde há UI sem DS, há um problema arquitetural. Isso não significa que ele manda em tudo — ele revela o que é visível; Core e Contratos mandam no que é invisível e no que é permitido.

Este documento é contrato formal do Core. Complementa [CORE_DESIGN_IMPLEMENTATION_POLICY.md](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) e [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md). Princípios específicos do domínio Restaurant OS (dark default, estados universais, tap targets, tempo visível): [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md).

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 0. Regra de ouro

| Camada | Quem manda | Design System |
|--------|------------|---------------|
| **Invisível** | Core | — |
| **Permitido** | Contrato | — |
| **Visível** | Design System | Tokens, componentes, estados visuais |

**Operacional:** Se é invisível → Core. Se é permitido → Contrato. Se é visível → Design System.

Se uma dessas camadas falha, o sistema fica instável, mesmo que "funcione".

**Descoberta:** Se existe uma tela, botão ou estado que NÃO usa o Design System, está a denunciar algo: endpoint escondido, fluxo não contratado, exceção não documentada ou violação do Core. Por isso, em sistemas maduros, o Design System é usado como **scanner**, não apenas como biblioteca de UI. Explicações possíveis: (1) Bug, (2) Dívida técnica, (3) Endpoint não contratado, (4) Violação arquitetural. Não há quinta opção.

---

## 1. Autoridade

- O **Design System é subordinado ao Core.** Não é fonte de verdade de regras de negócio.
- **Shells do Core** (ex.: OperationalShell) têm **precedência absoluta** sobre layout estrutural (fundo, grid, página).
- O Design System **fornece** tokens, componentes e estados; **não define** quem pode clicar, quem pode ver, quando algo é permitido — isso é Contrato (RoleGate, FlowGate, AppStaff, KDS, TPV).

---

## 2. Onde o Design System DEVE tocar (obrigatório)

**Regra simples:** Se um humano vê, lê, toca ou clica → Design System aplica.

Isso inclui **100%** de:

- Landing page  
- Web pública (GloriaFood-like)  
- Web Operacional (Command Center)  
- AppStaff (iOS / Android)  
- KDS  
- TPV  
- Modais  
- Estados vazios  
- Erros  
- Loading  
- Offline  
- Avisos  
- Bloqueios  
- Confirmações  
- Botões "Instalar", "Abrir", "Executar", "Confirmar"  
- Botões, inputs, cards, listas, tabelas, ícones, badges  
- Status (ativo, bloqueado, atrasado, offline)  

**Todos os botões, todas as telas, todos os estados visuais.**

Se existe um botão sem DS: ou é **bug**, ou é **dívida**, ou é **endpoint não contratado**. Não há quarta hipótese.

---

## 3. Onde o Design System NÃO DEVE tocar (e isso é lei)

Aqui está o que diferencia sistemas tipo ServiceNow / Palantir de apps normais.

### 3.1 Core financeiro / Core lógico

O Design System **NUNCA** toca em:

- Cálculo de preços  
- Totais  
- Impostos  
- Regras fiscais  
- Fecho de caixa  
- Validações  
- Regras de desconto  
- SLA real  
- Estados internos do domínio  

✔️ Ele **representa** o estado.  
❌ Ele **não decide** o estado.

Exemplo correto: *"Pagamento recusado"* (visual).  
Exemplo errado: *"Pagamento recusado porque X + Y"* (isso é Core).

### 3.2 Autoridade e permissões

O Design System **não decide**:

- Quem pode clicar  
- Quem pode ver  
- Quem pode executar  
- Quando algo é permitido  

Isso é **RoleGate**, **FlowGate**, **Contratos de autoridade**. O DS **obedece**: mostra ou oculta conforme o Core manda.

### 3.3 Execução, runtime e infraestrutura

O Design System **não toca** em:

- Sync  
- Retry  
- Queue  
- Lock  
- Offline engine  
- Event sourcing  
- Webhooks  
- Jobs  
- Workers  

Ele **só mostra o reflexo**: "Sincronizando…", "Offline", "A aguardar confirmação", "Bloqueado".

### 3.4 Integrações externas puras

**Não toca em:** Lógica Stripe, impressoras (driver), hardware, APIs externas.  
✔️ **Toca nos estados visuais** dessas integrações (feedback ao utilizador).

### 3.5 Exceções legítimas (poucas e claras)

Há apenas **3** lugares onde é OK o Design System não tocar:

| Exceção | Exemplo |
|---------|---------|
| **Core invisível por definição** | Kernel, EventStore, Contracts, Migrations, Domain logic. Não há UI → DS não entra. |
| **Infraestrutura pura** | CRON, Workers, Edge functions internas, Backups. Sem humano → sem DS. |
| **APIs headless** | Integrações B2B, exportações, webhooks. Se não há tela, não há DS. |

### 3.6 Resposta directa

**"Em que partes o Design System não deveria tocar?"**

Resposta curta e correta: **Core financeiro**, **Core lógico**, **Autoridade**, **Runtime**, **Infraestrutura**, **Integrações puras sem UI**. Em todo o resto, se não tocar, é **bug** ou **falta de contrato**.

---

## 4. Tokens globais (imutáveis)

O pacote **core-design-system** (ou equivalente) é a fonte única de tokens. Nenhum terminal define cores globais ou escalas fora do DS.

| Categoria | Conteúdo |
|-----------|----------|
| **Cores** | background, surface, accent, warning, error, success, texto (primary, secondary, muted), bordas |
| **Tipografia** | Família, pesos, escalas (base, large, small, caption) |
| **Espaçamento** | Base grid (ex.: 4px), escala (xs, sm, md, lg, xl) |
| **Radius** | border-radius (sm, md, lg, full) |
| **Elevação** | Sombras (nenhuma, baixa, média, alta) |
| **Estados interativos** | hover, focus, disabled, loading (apenas visuais) |

---

## 5. Estados operacionais obrigatórios

Todo terminal que mostra estado deve usar os mesmos nomes visuais (o Core pode expor o valor; o DS define a aparência):

| Estado | Uso |
|--------|-----|
| **Normal** | Fluxo habitual |
| **Loading** | Carregando dados ou ação em curso |
| **Blocked** | Bloqueado (ex.: sem permissão, recurso indisponível) |
| **Warning** | Atenção (ex.: atraso, pendência) |
| **Critical** | Erro crítico, acção imediata |
| **Offline** | Sem ligação; fila local |

---

## 6. Hierarquia visual

- **Estado dominante** sempre visível (primeira coisa que o olho vê).  
- **Informação secundária** nunca compete com o dominante.  
- **Silêncio visual** é permitido (espaço em branco, ausência de ruído).

A hierarquia é desenhada nos painéis; os tokens e componentes do DS permitem cumpri-la, não a inventam sozinhos.

---

## 7. Aplicação por terminal

| Terminal | Regra |
|----------|--------|
| **Landing** | Aplicar DS: tipografia, botões, cores, espaçamento. Não aplicar Shell operacional. Obedecer CORE_LANDING_ROUTES_CONTRACT. |
| **Web Pública** | Aplicar DS. UX simples, sem ruído. Estados claros (aberto/fechado, pedido enviado). |
| **Web Operacional (Command Center)** | Tudo dentro de OperationalShell (Core). Painéis usam **apenas** componentes do DS. Nenhuma cor/layout definido localmente. |
| **AppStaff (Expo)** | Mapear tokens Web → Native. Componentes nativos com tokens do Core. UX focada em execução rápida. |
| **KDS** | Design funcional: alto contraste, tipografia grande, estados claros (atraso, pronto, bloqueado). Zero customização fora do DS. |
| **TPV** | Design limpo, fluxo rápido, erros explícitos. Impressão consistente com DS. |

---

## 8. Enforcement

- **Nenhum componente** pode usar cor hardcoded, font-size arbitrário ou definir layout global (fundo da página, minHeight 100vh do mundo).  
- **Lint/check (soft enforcement):** Avisar (ou falhar no CI) para cores fora de tokens, font-size arbitrário, padding mágico, background em root. Ver [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) — mecanismo B.  
- **Design System Coverage Map:** Ficheiro [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md) — tabela **Área/Tela | Terminal | Usa DS? | O que falta | Tipo**. Se não usa DS → tem que estar na tabela explicado. Tudo que for "não" ou "parcial" vira **ticket de arquitetura**. Loop completo: [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md).

---

## 9. Referências

- [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) — Shell, PanelRoot, contexto.  
- [CORE_DESIGN_IMPLEMENTATION_POLICY.md](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) — DS como implementação subordinada.  
- [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) — Onde a lei do DS está no código.  
- [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md) — Tabela de cobertura (tela/componente → usa DS?).  
- [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) — Mecanismos A (Coverage Map), B (build/CI), C (autoridade).  
- [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md) — Prompt para auditoria e unificação total.  
- Pacote **core-design-system** (tokens, typography, spacing) — fonte única de tokens para Web e Mobile.
