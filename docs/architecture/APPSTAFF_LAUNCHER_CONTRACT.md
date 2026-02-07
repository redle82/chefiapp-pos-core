# Contrato fundacional — AppStaff Launcher (experiência executável)

**Lei Final (identidade visual):** [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md). Este contrato não substitui o Canon; em caso de conflito, o Canon prevalece.

**Status:** CONTRATUAL FUNDACIONAL  
**Tipo:** Lei de identidade do ecrã `/app/staff/home`. Acima de detalhes de UI; qualquer alteração ao launcher deve obedecer a este contrato.  
**URL canónico (dev):** `http://localhost:5175/app/staff/home` — este é o caminho correcto do launcher; não usar outro port nem outra rota.  
**Violação:** Qualquer decisão que faça este ecrã parecer web, SaaS, admin ou dashboard é **errada**.  
**Detalhe:** Anti-patterns, hierarquia visual e sensação de dispositivo: [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](APPSTAFF_HOME_LAUNCHER_CONTRACT.md).

---

## CONTEXTO ABSOLUTO (ler com atenção)

O ecrã `/app/staff/home` **NÃO É** uma página web.  
**NÃO É** um dashboard.  
**NÃO É** uma área de configuração.  
**NÃO É** um painel administrativo.

**É** um app operacional.  
**É** um launcher de modos.  
**É** um sistema de controlo em tempo real.

Qualquer decisão que faça este ecrã parecer web, SaaS, admin ou dashboard é **errada**.

---

## CONTRATO DE IDENTIDADE

1. Esta tela é o **"Home Screen"** de um sistema operacional.
2. O utilizador **NÃO explora** — ele **OPERA**.
3. O sistema **CONVOCA** ações, não oferece opções.
4. O layout deve **impor** foco, hierarquia e contexto.
5. Deve parecer **impossível** "não fazer nada" nesta tela.

---

## REGRAS NÃO NEGOCIÁVEIS

- **Full-screen real** (sem scroll da página).
- **Scroll apenas interno** (dentro da área de conteúdo).
- **Bottom navigation fixa e dominante** (Início, Operação, TPV, Mais).
- **Top bar como BARRA DE ESTADO**, não banner informativo (nome do restaurante, estado do turno, estado operacional).
- **Um modo pode dominar o ecrã** (maior, centro de gravidade).
- **Outros modos são subordinados** (comprimidos, não iguais).
- **Nada pode parecer "card genérico"** (são estados do sistema).
- **Nada pode parecer "configuração"** (é operação).

---

## O QUE ELIMINAR

- Layout tipo dashboard.
- Grid neutro de cards (todos com o mesmo peso visual).
- Espaçamento "bonito" de SaaS.
- Simetria decorativa.
- Linguagem visual de painel admin.

---

## O QUE CONSTRUIR

Recriar `/app/staff/home` como **um launcher operacional de modos**:

- TPV  
- Tarefas  
- KDS  
- Turno  
- Exceções  
- (e outros modos do sistema)

Cada modo é:

- Um **estado** do sistema.
- Um **contexto** de operação.
- Um espaço **full-screen** quando ativo.

---

## LAYOUT BASE (OBRIGATÓRIO)

1. **Container root** ocupa 100% da viewport (height: 100%, overflow: hidden onde aplicável).
2. **Fundo contínuo** (sem "ilhas" de cor ou secções que quebrem a imersão).
3. **Top bar fixa** com: nome do restaurante, estado do turno, estado operacional (cockpit, não banner).
4. **Área central** com hierarquia de modos: modo ativo **maior e dominante**; outros **comprimidos** (não grid neutro).
5. **Bottom navigation fixa**: Início, Operação, TPV, Mais (sempre visível, ícones grandes, estado ativo claro).

---

## FRASE DE VALIDAÇÃO

Antes de aceitar qualquer alteração ao launcher, perguntar:

**"ISTO PARECE UM APP NATIVO DE OPERAÇÃO OU UMA PÁGINA WEB BONITA?"**

Se parecer **web** → **rejeitar**.

---

## Declaração

Este contrato é a **lei de identidade** do ecrã `/app/staff/home`. Não adaptar, não suavizar, não negociar. Um app não pede atenção; **toma atenção e impõe contexto**.
