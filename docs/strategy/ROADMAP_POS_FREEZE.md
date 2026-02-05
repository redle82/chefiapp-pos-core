# Roadmap Pós-Freeze — O que está pronto, o que falta, o que vem a seguir

**Propósito:** Documento único que fixa o que está congelado como "pronto", os gaps conhecidos e as fases/trilhos pós-freeze. A decisão "o que fazer depois do freeze" fica explícita aqui.

**Relação com SCOPE_FREEZE:** [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) congela o escopo (o que não fazer agora). Este doc descreve o que está congelado como pronto, o que falta (gaps) e o que vem a seguir (fases e trilhos).

---

## 1. O que está pronto para freeze

Lista canónica do que está congelado e validado:

- **Core soberano** — Docker World, contratos, leis (EROS_CANON, bootstraps).
- **ORE e preflight** — Operacional Readiness; TPV/KDS desativados quando Core offline / não publicado / turno fechado; tooltips e Runbook.
- **System Tree em 5 blocos** — Começar, Operar, Equipe, Gestão, Crescimento (colapsado); hierarquia GloriaFood-like.
- **Fluxo mental correto** — Identidade → Config → Operar → Otimizar; progressive disclosure.
- **TPV/KDS funcionais em runtime** — Quando preflight ok, links activos; fluxo venda/cozinha operacional.
- **Contratos documentados** — Incl. [CORE_SYSTEM_TREE_CONTRACT.md](../architecture/CORE_SYSTEM_TREE_CONTRACT.md) v1.0 (árvore ASCII, regras por bloco).
- **Testes a passar** — Suite existente; checklist humano do System Tree executado e registado.

Checklist manual do System Tree: [CHECKLIST_SYSTEM_TREE_5_BLOCOS.md](./CHECKLIST_SYSTEM_TREE_5_BLOCOS.md).

---

## 2. Os 3 gaps (ainda não completos)

Três dores reais, bem delimitadas — não quebram o que existe; são o próximo bloco lógico.

### Gap A — Instalação de terminais ainda não é ritual completo

- **Hoje:** Existe a rota `/app/install`, o item "Instalar Terminais" no bloco Começar e o conceito.
- **Falta:** O ritual completo nos grandes é sempre: *"Este dispositivo agora é um TPV/KDS deste restaurante."*
- **O que falta tecnicamente:**
  - Identidade persistente do terminal (device_id).
  - Registo no Core (gm_terminals).
  - Associação explícita: `terminal_id → restaurant_id → role (TPV | KDS)`.
  - Heartbeat visível por terminal ("este TPV está online").

### Gap B — Banco de Pessoas (gm_staff) ainda não é first-class na UI

- **Hoje:** O Core tem gm_staff; a UI trata "Pessoas" como algo meio futuro.
- **Falta:** Ficar claro quem é gerente, quem é staff, quem pode abrir turno, quem aparece no AppStaff. Nos grandes, staff vem antes de vender (mesmo que seja "criar a si mesmo").

### Gap C — Restaurante ainda não "respira identidade" em todo o sistema

- **Hoje:** O restaurante existe no Core e está ativo.
- **Falta:** Na apresentação, o nome do restaurante não é objeto central — não aparece como entidade viva no topo, nos terminais, nos logs. Nos grandes é sempre: *"Estás a operar o Restaurante X."* Isto é camada de apresentação e identidade, não backend.

---

## 3. As 2 fases pós-freeze (ordem lógica)

Depois do freeze, o roadmap natural é:

### Fase Pós-Freeze 1 — Identidade Operacional

1. gm_staff como first-class na UI.
2. Restaurante como entidade visível (nome, contexto, header).
3. Papéis claros (owner / manager / staff).

### Fase Pós-Freeze 2 — Instalação Real de Terminais

1. Ritual de instalação TPV/KDS.
2. Registo de dispositivos no Core.
3. Heartbeat por terminal.
4. Visão "este TPV está online".

Isso transforma o ChefIApp de "sistema funcional" em plataforma operacional real.

---

## 4. Trilhos opcionais para o próximo movimento

Três opções; escolher **uma** para desenhar primeiro (sem implementar no freeze). A decisão de qual trilho executar primeiro fica registada aqui ou em [NEXT_ACTIONS.md](./NEXT_ACTIONS.md) quando for tomada.

| Trilho | Descrição |
|--------|-----------|
| **Trilho 1** | Desenhar o ritual de instalação de terminais (fluxo, contratos, UI mínima). |
| **Trilho 2** | Desenhar o modelo de Pessoas (gm_staff) como eixo central (roles, quem abre turno, AppStaff). |
| **Trilho 3** | Preparar o manifesto público "ChefIApp OS" (posicionamento, ossos vs músculo vs pele). |

---

## 5. Referências

- [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) — Escopo congelado; o que não fazer agora.
- [CORE_SYSTEM_TREE_CONTRACT.md](../architecture/CORE_SYSTEM_TREE_CONTRACT.md) — Árvore v1.0, 5 blocos, regras.
- [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](../architecture/CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) — Registo de terminais no Core.
- [CORE_APPSTAFF_IDENTITY_CONTRACT.md](../architecture/CORE_APPSTAFF_IDENTITY_CONTRACT.md) — Identidade e presença de staff; tarefas e KDS.

---

_Roadmap pós-freeze. O que está pronto está congelado; os gaps e fases definem o próximo movimento._
