# APPSTAFF — VISUAL CANON (Lei Final)

**Status:** CONGELADO  
**Âmbito:** AppStaff (Launcher + Modos)  
**Objetivo:** Garantir que o AppStaff parece um app à primeira vista — não um painel, não um site, não um dashboard.

**Precedência:** Este documento tem precedência sobre preferência pessoal, estilo de framework e sugestões de UI genéricas. Os contratos [APPSTAFF_LAUNCHER_CONTRACT.md](APPSTAFF_LAUNCHER_CONTRACT.md), [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](APPSTAFF_HOME_LAUNCHER_CONTRACT.md) e [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](APPSTAFF_APPROOT_SURFACE_CONTRACT.md) são subordinados a este Canon.

---

## 0. Frase-Lei

Se o AppStaff não impõe presença imediata como ferramenta ativa, está em violação de produto.

---

## 1. Princípio-Mãe

AppStaff é um AMBIENTE OPERACIONAL, não uma interface administrativa.

Tudo deriva daqui:

- Menos texto
- Menos explicação
- Mais espaço
- Mais gesto
- Mais silêncio visual

---

## 2. Estrutura Sagrada (não negociar)

### 2.1 Shell

- O Shell manda em altura e scroll.
- `height: 100dvh` (fallback 100vh), `overflow: hidden`.
- Um único content scroller (área central).
- Top Bar e Bottom Nav fixos.

Nenhuma página filha define 100vh, minHeight: 100vh ou overflow: auto no root.

---

## 3. Top Bar — Presença, não status

Deve parecer:

"Estou dentro do AppStaff agora."

**Regras**

- Informação mínima e sintética:
  - Nome do app
  - Local ativo
  - Estado curto (OK / TURNO ATIVO / —)
- Sem frases.
- Sem explicações.
- Peso visual suficiente para ancorar o ecrã.

**Proibido**

- Banners
- Frases técnicas
- Mensagens de onboarding
- Texto de sistema

---

## 4. Home (Launcher) = AppRootSurface

**Função**

Escolher um modo é entrar noutro espaço.

**Forma**

- Apenas tiles.
- Grid simples (2 colunas em mobile/tablet).
- Espaço respirável.
- Nada de secções, nada de títulos.

**Conteúdo**

- 1 palavra por tile (Pedidos, Cozinha, Tarefas, Turno, Alertas, Operação).
- Estados visuais (● ! ✓), nunca texto longo.

**Hierarquia**

- Primário: maior, mais peso, primeiro.
- Secundários: normais.
- Contextuais: ligeiramente mais suaves.

---

## 5. Micro-gesto obrigatório

**Toque**

- `scale(0.98)` no :active.
- Sensação de botão físico.

**Transição de modo**

- Entrada com movimento leve + fade.
- Sensação de troca de ambiente, não navegação web.

---

## 6. Modos (/mode/*) — Regra de Ouro

Todos os modos devem parecer:

Uma ferramenta em foco total.

**Regras globais**

- Sem layout de dashboard web.
- Sem grids administrativos densos.
- Sem fundo branco de portal.
- Sem headers duplicados.

**Full-screen operacionais (TPV, KDS)**

- Zero padding no Shell.
- Nenhum scroll interno duplicado.
- Tela limpa, funcional, direta.

**Modos de gestão (Turno, Alertas, Operação)**

- Bloco central.
- 1–2 ações no máximo.
- Leitura instantânea.

---

## 7. Texto: o que fica e o que morre

**Fica**

- Palavras únicas
- Estados curtos
- Labels essenciais

**Morre**

- "Fluxo operacional"
- "Modos do AppStaff"
- "Toque num modo para abrir"
- Qualquer frase explicativa

Se precisa ser explicado, não é app.

---

## 8. Cor e fundo

- Fundo escuro contínuo.
- Sem cartões brancos flutuantes.
- Contraste suficiente para leitura rápida.
- Cores servem estados, não decoração.

---

## 9. O que caracteriza regressão

É regressão se aparecer:

- Sensação de site
- Sensação de painel
- Sensação de configuração
- Texto demais
- Scroll duplo
- Layout "corporativo"

---

## 10. Lei de Execução

Código que viole este Canon deve ser rejeitado, mesmo que funcione.

Este documento tem precedência sobre:

- Preferência pessoal
- Estilo de framework
- Sugestões de UI genéricas

---

## 11. Encerramento

O AppStaff não é bonito por ser decorado.  
Ele é bonito porque impõe silêncio, foco e decisão.

Este Canon fecha a identidade visual do AppStaff.

— Lei do Produto
