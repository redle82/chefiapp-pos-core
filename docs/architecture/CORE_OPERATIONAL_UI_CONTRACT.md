# Contrato de UI Operacional (OUC) — Core

## Lei do sistema

**Se você é uma tela do ChefIApp OS, você obedece estas regras.**

Este documento é contrato formal no Core. Não é sugestão. Telas que violam o contrato escapam do OS e quebram a experiência operacional.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Contexto operacional é obrigatório

Toda tela **não pode existir sozinha**. Ela sempre vive dentro do OS.

- O **OperationalShell** (ou o Dashboard que o usa) injeta o contexto.
- Se uma tela não recebe contexto operacional → não deve decidir fundo, layout ou modo sozinha; o Shell decide.

**Contrato (conceitual):**

```ts
interface OperationalContext {
  activeModule: string;
  systemMode: "demo" | "pilot" | "live";
  role: "owner" | "manager" | "staff";
  uiDensity?: "compact" | "standard";
  restaurantId: string | null;
}
```

- Telas que rodam **dentro** do Dashboard/Shell consomem este contexto (via React Context ou props).
- Telas que rodam **fora** (rotas públicas, landing) estão explicitamente fora do OUC.

---

## 2. Layout é imposto pelo Core, não escolhido pela tela

- **O Shell decide:** fundo, padding, grid, contraste, modo (dark).
- **A tela entrega:** apenas conteúdo (listas, formulários, ações). Nunca estrutura de página (body background, max-width do mundo, container global).

**Regra:** Nenhuma tela define `backgroundColor` ou `minHeight: "100vh"` no seu root como se fosse “a página”. O Shell já é a página.

**Correto:**

```tsx
<OperationalShell>
  <MenuBuilderPanel />
</OperationalShell>
```

O Shell aplica VPC (fundo `#0a0a0a`, superfície `#141414`, tipografia Inter, spacing). O MenuBuilderPanel só entrega o conteúdo do menu.

**Errado:** MenuBuilderPanel definir seu próprio `<div style={{ backgroundColor: "#f9fafb", padding: "24px", maxWidth: "1200px" }}>` como root.

---

## 3. Nenhuma tela pode exigir “selecionar algo para ver”

- O **estado principal** deve aparecer por defeito.
- Nada de ecrã vazio à espera de “escolher um módulo” ou “abrir X” para ver algo útil.

**Regra:** Se o utilizador precisa clicar / selecionar / abrir para ver o estado principal, o sistema está exploratório, não operacional. No OS, o estado dominante é visível por padrão (ex.: lista de tarefas, menu ativo, pedidos do dia).

- **Exceção:** fluxos de configuração inicial (onboarding) onde o passo é “escolher uma opção”. Mesmo aí, o contexto (modo, restaurante) deve vir do Shell.

---

## 4. Design system = hierarquia obrigatória, não só tokens

- Não basta ter cores e fontes (VPC). É preciso **hierarquia visual obrigatória**:
  - “Primeira coisa que o olho vê” (estado dominante).
  - “Estado dominante” (ex.: lista de tarefas, linha do dia, pedidos ativos).

**Regra:** O contrato exige que cada painel tenha um **estado dominante** visível sem clique. Tokens (VPC) são aplicados pelo Shell; hierarquia é desenhada no conteúdo do painel (título claro, lista/estado em cima, ações secundárias abaixo).

---

## 5. Navegação ≠ operação

- **Sidebar/árvore:** muda `activeModule` (contexto). Não navega para outra rota.
- **Painel central:** mostra o conteúdo do módulo ativo. Tudo na mesma rota (ex.: `/dashboard`).
- **Sem:** “Abrir X”, “Ir para módulo”, botões que disparam `navigate()` para “a página do módulo”. O módulo já está no painel.

---

## 6. Onde o contrato se aplica

| Área                                              | OUC aplica? | Nota                                             |
| ------------------------------------------------- | ----------- | ------------------------------------------------ |
| Dashboard + painéis (tasks, TPV, KDS, menu, etc.) | Sim         | Tudo dentro de OperationalShell / DashboardShell |
| Rotas públicas (landing, `/public/:slug`)         | Não         | Fora do OS operacional                           |
| Onboarding                                        | Parcial     | Pode ter layout próprio; ao sair, entra no Shell |
| Config (dentro do dashboard)                      | Sim         | Painel recebe contexto, não define fundo         |

---

## 7. Violações comuns e correção

### 7.1 Menu Builder (exemplo)

**Violação:** Define fundo claro (`#f9fafb`), container (`maxWidth: "1200px"`), padding e bordas no root. Parece “página solta”, não painel do OS.

**Correção:** Extrair apenas o conteúdo (formulário + lista de itens) para um **MenuBuilderPanel**. O Shell (ou o Dashboard) aplica fundo, padding e grid. O painel não define `backgroundColor` nem `minHeight: "100vh"` no root.

**Ficheiro a ajustar:** `merchant-portal/src/pages/MenuBuilder/MenuBuilderMinimal.tsx` — remover do root do componente: `backgroundColor: "#f9fafb"`, `padding`/`maxWidth` que definem “a página”. Quando renderizado dentro do Dashboard, o root deve ser neutro (ex.: fragment ou `div` sem fundo) para o Shell impor o VPC.

### 7.2 Tarefas / TPV / KDS

**Violação:** Cada um pode ter seu próprio `minHeight: "100vh"` e fundo, competindo com o Shell.

**Correção:** Quando renderizados **dentro** do Dashboard, recebem o fundo e a área de scroll do Shell. O root do painel deve ser neutro (ex.: `flex: 1`, `minHeight: 0`, `overflow: auto`) ou apenas fragmento de conteúdo.

### 7.3 “Tela vazia até selecionar”

**Violação:** Painel central que mostra “Selecione um módulo” como estado inicial.

**Correção:** Ter um estado dominante por defeito (ex.: primeiro módulo da árvore, ou “Tarefas” com lista). O contrato exige “estado principal visível por padrão”; o texto de instrução pode existir mas não como único conteúdo.

---

## 8. Enforcement: Shell + PanelRoot + data-chefiapp-os

### 8.1 Shell marca “Inside OS”

O **OperationalShell** marca a árvore DOM para deteção e CSS condicional:

- **Atributo:** `data-chefiapp-os="true"` no root do Shell.
- **Classe:** `chefiapp-os` (permite regras de lint/grep e CSS quando `[data-chefiapp-os]` ou `.chefiapp-os`).

Assim qualquer painel pode aplicar estilos condicionais quando estiver no OS, e o Core pode criar regras de lint que falham se um painel definir `minHeight: 100vh` ou `maxWidth` no root.

### 8.2 PanelRoot obrigatório

Todo o conteúdo de painel dentro do OS deve usar **PanelRoot** como wrapper do conteúdo:

- **Componente:** `merchant-portal/src/core/operational/PanelRoot.tsx`
- **Regra:** O root do painel NUNCA define:
  - `minHeight: 100vh`
  - `backgroundColor` (de página)
  - `maxWidth` (container global)
- **PanelRoot** aplica apenas padding e spacing consistentes; fundo e layout vêm do Shell.
- **Uso:** `<PanelRoot><Conteúdo do painel /></PanelRoot>`.

### 8.3 Implementação no Core

- **Contexto:** `merchant-portal/src/core/operational/OperationalContext.tsx` — tipo `OperationalContextValue`, provider e `useOperationalContext()`.
- **Shell:** `merchant-portal/src/core/operational/OperationalShell.tsx` — aplica VPC, injeta contexto, marca `data-chefiapp-os="true"` e classe `chefiapp-os`; com `fill` aplica `minHeight: 0` e `overflow: auto` para scroll sem 100vh.
- **PanelRoot:** `merchant-portal/src/core/operational/PanelRoot.tsx` — wrapper obrigatório para painéis; sem fundo/maxWidth/minHeight:100vh.
- **Uso:** O `DashboardPortal` envolve o `<main>` em `<OperationalShell context={...} fill>`. Os painéis usam `<PanelRoot>` e o núcleo de conteúdo (ex.: `MenuBuilderPanel` → `PanelRoot` + `MenuBuilderCore`). Para rotas standalone (ex.: `/menu-builder`) usa-se a “Page” (container próprio); dentro do Dashboard usa-se sempre a “Panel”.

---

## 9. Resumo

1. **Contexto operacional** é obrigatório para telas do OS (via Shell/Context).
2. **Layout** (fundo, grid, dark) é do Shell; telas só entregam conteúdo.
3. **Estado principal** visível por padrão; nenhuma tela exige “selecionar para ver”.
4. **Hierarquia visual** obrigatória (estado dominante + tokens VPC).
5. **Navegação ≠ operação:** sidebar muda contexto; painel mostra o módulo na mesma rota.

Design sem contrato vira decoração. Sistema operacional sem contrato vira site. Este documento é a lei visual do Core.
