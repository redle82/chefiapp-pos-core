# Contrato congelado — AppStaffHome como AppRootSurface

**Status:** CONGELADO (anti-regressão)
**Tipo:** Lei de identidade do ecrã `/app/staff/home`. Regras que não podem ser revertidas sem violação de contrato.
**Subordinado a (Lei Final):** [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md). Em caso de conflito, o Canon tem precedência.
**Subordinado a:** [APPSTAFF_LAUNCHER_CONTRACT.md](APPSTAFF_LAUNCHER_CONTRACT.md), [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](APPSTAFF_HOME_LAUNCHER_CONTRACT.md).

**Enforcement:** AppStaffHome é **AppRootSurface**. Nunca volta a ser dashboard. Alterações que reintroduzam banners, textos explicativos ou scroll global são **violação de contrato** — não regredir.

---

## 1. Declaração

**AppStaffHome é AppRootSurface.**

Sensação: "app instalado", não "site de gestão". O ecrã é superfície raiz do app; modos são tiles de app; leitura instantânea; scroll só no conteúdo.

---

## 2. Proibido

| Prática                                  | Exemplo (não reintroduzir)                                              |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Banners informativos no topo do launcher | "Fluxo operacional", "AppStaff Launcher", barra verde/vermelha          |
| Textos explicativos                      | "Modos do AppStaff", "Toque num modo para abrir", "Fluxo saudável"      |
| Scroll global da página                  | Scroll da página inteira; scroll deve ser apenas na área de conteúdo    |
| Grid administrativo de peso igual        | Todos os cards com o mesmo tamanho/contraste sem hierarquia             |
| Semântica de portal/site                 | Layout de dashboard, painel de controlo, "posso fechar e voltar depois" |

---

## 3. Obrigatório

| Prática                           | Descrição                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Modos como tiles de app           | Cada bloco = modo de sistema (TPV, KDS, Turno, etc.), não "link" ou "card genérico"    |
| Leitura instantânea               | Símbolos (●, !), palavras únicas; sem frases explicativas                              |
| Scroll apenas na área de conteúdo | Shell fixo (top bar + bottom nav); scroll só no corpo do launcher                      |
| Layout app-first                  | Respiro, foco, maxWidth controlado (ex.: 420px); comportamento mobile mesmo no desktop |
| Hierarquia visual                 | 1 modo primário, 1–2 secundários, resto contextual (contraste, tamanho, posição)       |

---

## 4. Violação

Alterações que reintroduzam **dashboard**, **banners**, **texto explicativo** ou **scroll global** no ecrã `/app/staff/home` são **violação de contrato** — não melhorias visuais. Reverter ou ajustar para cumprir este documento.

_O problema não é o visual em si. O problema é o ecrã não assumir autoridade de app. Um app não pede atenção; toma atenção e impõe contexto._

---

## 5. Visual Canon — Forma canónica do AppStaff

_Forma completa e Lei de Execução: ver [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md) (Lei Final)._

**Status:** CONTRATUAL · **Tipo:** Anti-regressão visual e estrutural · **Escopo:** AppStaff (Launcher + Shell + modos)

O AppStaff DEVE apresentar-se visualmente e estruturalmente como um **aplicativo instalado**. Esta forma não é tema, não é skin, não é opcional. Se o AppStaff não "parece um app" à primeira vista, está em violação de contrato.

### 5.1 Estrutura obrigatória (inalterável)

**Shell (container do app):**

- **Top Bar fixa** — Sempre visível. Mostra apenas: nome do app (CHEFIAPP), restaurante/local ativo, estado sintético (ex.: "TURNO ATIVO", "OK", "!"). Nunca contém textos explicativos, banners ou mensagens longas.
- **Área central rolável** — ÚNICO local onde existe scroll. `overflow: auto`. Top bar e bottom nav nunca rolam. Todo o conteúdo de páginas (/home, /mode/\*) vive aqui.
- **Bottom Navigation fixa** — Ícones + labels curtos. Sempre presente. Nunca duplicada dentro das páginas.

**Regra absoluta:** Se existir mais de um scroll visível, o contrato foi quebrado.

### 5.2 AppStaffHome (Launcher) — forma obrigatória

O ecrã `/app/staff/home` é o AppRootSurface.

**O que o launcher É:** Grelha de modos, como ecrã inicial de app; foco em ação imediata; leitura em menos de 1 segundo.

**O que o launcher NÃO É (proibido):** Dashboard; portal administrativo; página de configuração; página explicativa; tela de onboarding; grid de métricas.

### 5.3 Tiles / Modos (contrato visual)

Cada modo (TPV, KDS, Tarefas, Turno, etc.) DEVE ser representado como: tile clicável; ícone grande; label curta (1 palavra); estado visual imediato (● ativo, ! atenção, opacidade reduzida = indisponível). Sem textos longos. Sem labels técnicas ("FULL SCREEN", "PRONTO", etc.).

**Hierarquia obrigatória:** Primário = modo dominante do momento; secundários = modos críticos de suporte (Turno, Operação); contextuais = restantes. A ordem visual DEVE respeitar esta hierarquia.

### 5.4 Estética mínima obrigatória

Fundo escuro contínuo (sem "blocos brancos" de site). Cartões com cantos arredondados, sombras suaves, espaçamento generoso. Tipografia curta e directa; sem textos de instrução. Se a tela "parece uma página web", está errada.

### 5.5 Modos internos (/app/staff/mode/\*)

Cada modo herda o Shell e não redefine layout global.

- Nenhum modo cria o seu próprio header global.
- Nenhum modo cria scroll próprio fora da área central.
- Nenhum modo replica bottom navigation.
- Nenhum modo usa layout de dashboard web.

**Intenção por modo:** TPV/KDS = tela operacional full-focus, zero distrações. Tarefas = lista clara, ação imediata. Turno/Operação/Alertas = painel único, informação sintética, 1–2 ações no máximo.

### 5.6 Anti-regressão (lei de proteção)

É expressamente proibido: reintroduzir banners "Fluxo operacional"; reintroduzir textos explicativos ("Toque para abrir", "Modo pronto"); transformar o launcher em dashboard; adicionar onboarding visual ao AppStaffHome; alterar o layout para "portal" ou "admin". Qualquer PR que viole este contrato DEVE ser rejeitado.

### 5.7 Frase-lei

_O AppStaff não explica. O AppStaff executa. Se parece um site, falhou._
