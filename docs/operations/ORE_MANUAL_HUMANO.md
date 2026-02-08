# ORE Manual Humano — Pedagogia do sistema

> **Propósito:** Documento de pedagogia para humanos (onboarding, piloto, uso em stress). Explica o sistema pelos **estados reais** (MenuState, ORE, o que cada superfície mostra quando). **O manual não cria regras nem substitui contratos** — explica o que acontece quando os contratos dizem X.
>
> **Refs:** [ORE_ORGANISM_AND_MENU.md](../architecture/ORE_ORGANISM_AND_MENU.md), [OPERATIONAL_READINESS_ENGINE.md](../architecture/OPERATIONAL_READINESS_ENGINE.md) (spec técnica), [MENU_OPERATIONAL_STATE.md](../architecture/MENU_OPERATIONAL_STATE.md).

---

## 1. O que é o ORE?

O **ORE** (Operational Readiness Engine) é o "cérebro" que decide se uma superfície (TPV, KDS, QR/Web, etc.) pode operar neste momento.

- **O ORE não conhece** itens de menu, preços, produtos nem stock. Conhece apenas **símbolos de estado**, por exemplo:
  - MenuState = LIVE / INCOMPLETE / VALID_UNPUBLISHED / EMPTY
  - Core online ou offline
  - Turno aberto ou fechado
- **Com isso decide:**
  - Pode operar?
  - Bloqueia?
  - Redireciona?
  - Que mensagem humana mostrar?

Quando o TPV ou o KDS estão bloqueados, é o ORE a dizer "ainda não" e a escolher a mensagem que vês no ecrã (em linguagem humana, não técnica).

---

## 2. Estados do menu (MenuState)

O menu não é só uma lista — é um **estado operacional** do restaurante. Existem quatro estados; o sistema mostra-te em qual estás (Dashboard, Config, Sidebar) e bloqueia ou libera conforme o estado.

| Estado                | O que significa (para ti)                                                           | O que vês no Dashboard / Sidebar                                                            | TPV / KDS / QR                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **EMPTY**             | Ainda não há itens no menu válidos; não podes vender.                               | "Adicione itens ao menu para poder publicar e vender."                                      | Bloqueados. Mensagem: "O menu ainda está vazio. Crie itens no Menu Builder e publique o menu para começar a vender." |
| **INCOMPLETE**        | Há itens no menu, mas falta completar identidade, localização, horários ou pessoas. | "Menu em edição. Complete identidade, localização, horários e pessoas para poder publicar." | Bloqueados. Mensagem: "O menu ainda não está pronto para venda. Complete o setup no Dashboard e publique o menu."    |
| **VALID_UNPUBLISHED** | Menu e setup estão completos; ainda não clicaste em Publicar.                       | "Menu pronto, mas ainda não publicado."                                                     | Bloqueados. Mensagem: "O menu ainda não foi publicado. Publique o menu no Dashboard para começar a vender."          |
| **LIVE**              | Menu publicado; podes vender no TPV e o cardápio público está disponível.           | "Menu publicado e disponível para venda."                                                   | TPV e KDS abertos; QR/Web mostra cardápio.                                                                           |

**QR/Web (quando o menu não está LIVE):** O visitante vê: "O cardápio ainda não está disponível. Volte em breve."

---

## 3. Quando o TPV e o KDS estão bloqueados

O TPV e o KDS só ficam disponíveis quando:

1. O menu está **publicado** (estado LIVE).
2. (Quando aplicável) O turno está aberto e o Core está online.

Se o menu não estiver LIVE, ao abrires o TPV ou o KDS vês um ecrã de bloqueio com uma mensagem humana (uma das frases da tabela acima), não códigos nem stack traces. A mensagem diz-te exactamente o que falta: criar itens, completar o setup ou publicar o menu.

---

## 4. Quando o QR/Web mostra o cardápio

A página web pública do restaurante (cardápio para clientes) **só mostra o cardápio** quando o restaurante está publicado (status activo). Se ainda não publicaste, o visitante vê "O cardápio ainda não está disponível. Volte em breve."

---

## 5. Bootstrap e "Publicar menu"

- **Bootstrap** é o ritual de criação do primeiro restaurante: cria a entidade (restaurante), liga contratos mínimos e prepara o runtime. **Não** cria o menu completo nem publica. Só garante que o organismo existe.
- **Publicar menu** é um passo **consciente** que dás depois de:
  - Teres itens no menu (com preço).
  - Teres completado identidade, localização, horários e pessoas no setup.

Quando tudo está completo, o Dashboard mostra "Menu pronto, mas ainda não publicado." e podes clicar em Publicar. A partir daí o estado passa a LIVE e o TPV, KDS e QR/Web ficam operacionais (respeitando turno e Core quando aplicável).

---

## 6. Regra sobre este manual

- **O manual não cria regras** — não altera o comportamento do sistema.
- **O manual não substitui contratos** — os contratos técnicos (MENU_OPERATIONAL_STATE, ORE_ORGANISM_AND_MENU, etc.) são a lei; este doc explica em linguagem humana o que acontece quando essa lei está em vigor.
- Serve para: onboarding, treino, TRIAL e uso em stress, alinhamento de expectativas e redução de erro humano.

---

## Referências

- [ORE_ORGANISM_AND_MENU.md](../architecture/ORE_ORGANISM_AND_MENU.md) — Modelo organismo; diagrama; handshake ORE ↔ Menu.
- [OPERATIONAL_READINESS_ENGINE.md](../architecture/OPERATIONAL_READINESS_ENGINE.md) — Spec técnica (BlockingReason, Surface, UiDirective, matriz, consumo pelo código).
- [MENU_OPERATIONAL_STATE.md](../architecture/MENU_OPERATIONAL_STATE.md) — Estados, transições, mensagens exactas por estado.
- [MENU_CORE_CONTRACT.md](../architecture/MENU_CORE_CONTRACT.md) — Contrato arterial do menu.
