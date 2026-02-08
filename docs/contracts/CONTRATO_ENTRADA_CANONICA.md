# Contrato de Entrada Canónica (1 página)

**Frase de autoridade:** _"Um restaurante só tem uma porta principal. Todo o resto é porta de serviço."_

**Decisão selada:** ChefIApp é um **sistema operacional para restaurantes** (produto operacional premium). A entrada canónica conta essa história — sem exceções visíveis ao primeiro contacto.

---

## (A) Qual é a porta principal do sistema?

| Dimensão          | Resposta canónica                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **URL**           | `/` (e `/landing` como alias → redireciona para `/`)                                                                                 |
| **Conteúdo**      | Landing Operacional: Hero com logo central, "Sistema **OPERACIONAL** para Restaurantes", visão OS, TPV/cozinha/caixa no mesmo fluxo. |
| **Mensagem**      | "ChefIApp é um sistema operacional para restaurantes." — identidade clara, linguagem de operação.                                    |
| **Preço**         | **79 €/mês** — única fonte de verdade exibida ao visitante. (49 €/99 € não aparecem como oferta principal.)                          |
| **CTA principal** | "Começar agora" → `/auth`; "Ver o sistema a funcionar (3 min)" → `/demo-guiado` (entrada opcional ao fluxo; ao sair → `/auth`). "Já tenho acesso" → `/auth`. |

Quando alguém entra no ChefIApp pela primeira vez, **esta** é a história oficial que estamos a contar.

---

## (B) Quais são portas de serviço?

Tudo o que não é a landing canónica é **porta de serviço** — permitida, mas subordinada:

| Porta                           | Papel                                                 | Regra                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Modal / Entry card**          | ENTRY SHORTCUT — atalho para Demo (TPV overlay).      | Não é default de entrada. Rota interna (ex. `/app/demo-tpv`) se existir.                                                                |
| **Demo guiado**                 | Prova de fluxo (3 min); experiência do trial.         | Acessível a partir da landing; ao concluir → `/auth`. Pode ser "Primeiros 3 minutos do teu restaurante" após bootstrap (dados reais).   |
| **Auth**                        | Registo/login.                                        | Destino após "Começar agora" ou após demo guiado; nunca a primeira coisa como "porta principal".                                         |
| **Bootstrap**                   | Ritual obrigatório pós-auth (configurar restaurante). | Linear; sem fuga para dashboard até concluir.                                                                                           |
| **Deep links / rotas internas** | Acesso directo a módulos (TPV, KDS, etc.).            | Para utilizadores já no sistema; não competem com a porta principal.                                                                    |

---

## (C) Qual é a ordem permitida de passagem entre portas?

**Fluxo humano único (sem exceções):**

`/` (Landing) → "Começar agora" → `/auth` → `/bootstrap` (linear) → [Demo guiado com teu restaurante, opcional] → `/dashboard` / operação → Billing.

Alternativa: `/` → "Ver o sistema a funcionar (3 min)" → `/demo-guiado` → ao sair → `/auth` → `/bootstrap` → operação → Billing.

**Proibido:** Landing → Dashboard sem auth/bootstrap; Bootstrap → voltar à landing como fuga; qualquer rota que faça o utilizador sentir "estamos a dar voltas". Não existe "demo fake" como estado paralelo — demo guiado é parte do fluxo trial.

O sistema responde à pergunta: _"Quando alguém entra pela primeira vez, qual é a história oficial?"_ — **A landing operacional em `/`, com uma mensagem, um preço (79 €) e um fluxo único.**

---

**Regra de cumprimento:** Qualquer alteração a URL de entrada, conteúdo da primeira página, preço exibido ao visitante ou ordem de passagem entre portas deve respeitar este contrato. O código executa esta lei; não a inventa.
