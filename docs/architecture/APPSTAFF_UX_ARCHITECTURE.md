# APPSTAFF UX ARCHITECTURE

> Documento de governança da arquitetura UX do AppStaff.
> Qualquer mudança estrutural deve ser validada contra estas regras.

---

## Princípio fundador

**O sistema organiza a mente do utilizador, não mostra botões.**

Cada papel vê apenas o que precisa para decidir e agir.
Nenhuma tela faz duas coisas ao mesmo tempo.

---

## Os 3 níveis de navegação

```
NÍVEL 1 — HOME (visão sistêmica)
  Pergunta: "Está tudo sob controle?"
  Mostra: semáforo global, exceções, resumos por setor
  NÃO faz: executar, listar, editar

NÍVEL 2 — DASHBOARD DE SETOR (saúde contextual)
  Pergunta: "Este setor está saudável hoje?"
  Mostra: status do setor, resumo do dia, histórico recente, exceções
  NÃO faz: CRUD, listas infinitas, gráficos complexos

NÍVEL 3 — FERRAMENTA (execução)
  Pergunta: "O que eu faço agora?"
  Mostra: a ferramenta em si (KDS, TPV, lista de tarefas, etc.)
  NÃO faz: resumir, contextualizar — isso é papel dos níveis acima
```

**Regra de ouro:** nunca pular do nível 1 direto para o nível 3.

---

## HOME ≠ DASHBOARD ≠ FERRAMENTA

| Conceito               | Papel                                         | Exemplo                                         |
| ---------------------- | --------------------------------------------- | ----------------------------------------------- |
| **HOME**               | Mapa vivo — responde "está sob controle?"     | OwnerHome, ManagerHome                          |
| **DASHBOARD DE SETOR** | Saúde de um setor — responde "está saudável?" | CleaningSectorDashboard, KitchenSectorDashboard |
| **FERRAMENTA**         | Execução pesada — responde "o que eu faço?"   | KDS, TPV, lista de tarefas                      |

Se algo **resume**, é HOME ou DASHBOARD.
Se algo **executa**, é FERRAMENTA.
Se algo faz os dois, está errado.

---

## Papel de cada perfil

### Dono (owner)

- **Home:** mapa sistêmico do restaurante (semáforo + 5 setores)
- **Verbo:** observar, intervir por exceção
- **NÃO deve:** operar ferramentas no dia-a-dia

### Gerente (manager)

- **Home:** saúde do turno (gargalos + equipe + alertas)
- **Verbo:** coordenar, resolver bloqueios
- **NÃO deve:** fazer trabalho operacional repetitivo

### Garçom (waiter)

- **Home:** grade de mesas + status rápido
- **Verbo:** servir, anotar, fechar
- **NÃO deve:** ver dashboards estratégicos

### Cozinha (kitchen)

- **Home:** KDS em foco total
- **Verbo:** produzir
- **NÃO deve:** navegar — a tela é a ferramenta

### Limpeza (cleaning)

- **Home:** lista de tarefas atribuídas
- **Verbo:** limpar, marcar como feito
- **NÃO deve:** ver métricas ou dashboards

### Trabalhador (worker)

- **Home:** lista de tarefas atribuídas
- **Verbo:** executar tarefas diversas
- **NÃO deve:** ver métricas ou dashboards

---

## Regra de não redundância

1. **Rodapé (bottom nav)** = acesso a ferramentas. Sempre visível.
2. **Menu "Mais"** = ferramentas secundárias. Sempre disponível.
3. **HOME** = leitura rápida. Nunca duplica o rodapé.
4. **Dashboard de Setor** = leitura profunda de um setor. Nunca duplica HOME.

Se um botão já existe no rodapé, **NÃO** aparece na HOME.
Se uma ferramenta já existe no "Mais", **NÃO** aparece no Dashboard de Setor.

---

## Estrutura dos Dashboards de Setor

Todos seguem a mesma estrutura fixa:

```
1. HEADER DO SETOR        — nome + subtítulo neutro
2. STATUS DO SETOR        — 1 semáforo (🟢/🟡/🔴), 1 frase
3. RESUMO DO DIA          — números simples, linguagem humana
4. SLOT LIVRE             — histórico recente, fila atual, etc.
5. EXCEÇÕES / ATENÇÃO     — só aparece se necessário
6. AÇÕES CONTEXTUAIS      — máx. 2 botões, só navegam
```

O que **NÃO** existe num Dashboard de Setor:

- ❌ Botões de executar tarefa
- ❌ CRUD
- ❌ Listas longas
- ❌ Gráficos complexos
- ❌ Configurações

---

## Semáforos — estados possíveis

Cada setor tem exatamente 3 estados:

| Estado  | Significado            | Cor         |
| ------- | ---------------------- | ----------- |
| Normal  | Tudo sob controle      | 🟢 Verde    |
| Atenção | Algo precisa de olho   | 🟡 Amarelo  |
| Crítico | Intervenção necessária | 🔴 Vermelho |

Critérios específicos por setor estão nos componentes.
Mudanças nos critérios devem ser validadas com dados reais.

---

## Dados — regra de honestidade

- **Dado real** → mostrar
- **Dado indisponível** → mostrar "—" (placeholder honesto)
- **Dado fabricado** → PROIBIDO

Dado falso em dashboard executivo destrói confiança.

---

## Proteção contra regressão

Antes de adicionar qualquer elemento novo, perguntar:

1. **Isto pertence a qual nível?** (HOME / DASHBOARD / FERRAMENTA)
2. **Já existe noutro lugar?** (rodapé, "Mais", outra tela)
3. **Responde a que pergunta?** (se não responde, não entra)
4. **O dono precisa disto?** (se não, talvez seja ferramenta)

Se a resposta não é clara, **não adicione**.

---

## Rotas

```
/app/staff/home                    → HOME por papel (AppStaffRoleHome)
/app/staff/home/owner              → OwnerHome
/app/staff/home/sector/operation   → OperationSectorDashboard
/app/staff/home/sector/tasks       → TasksSectorDashboard
/app/staff/home/sector/team        → TeamSectorDashboard
/app/staff/home/sector/kitchen     → KitchenSectorDashboard
/app/staff/home/sector/cleaning    → CleaningSectorDashboard
/app/staff/mode/operation          → Ferramenta: visão operacional
/app/staff/mode/tpv                → Ferramenta: TPV
/app/staff/mode/kds                → Ferramenta: KDS
/app/staff/mode/tasks              → Ferramenta: lista de tarefas
/app/staff/mode/team               → Ferramenta: equipe em turno
/app/staff/mode/alerts             → Ferramenta: exceções
```

---

## Histórico

- **2026-02-10** — Arquitectura de 3 níveis implementada (HOME → DASHBOARD DE SETOR → FERRAMENTA)
- **2026-02-10** — 5 Dashboards de Setor criados (Operação, Tarefas, Equipe, Cozinha, Limpeza)
- **2026-02-10** — OwnerHome transformada em mapa sistêmico com navegação contextual
- **2026-02-10** — Este documento criado como governança contra regressão
