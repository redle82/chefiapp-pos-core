# ChefIApp OS — Como funciona de verdade

Narrativa curta para investidor, parceiro técnico ou decisor: o sistema não mente. Docker é o mundo; um comando sobe o planeta; o critério de aceite é o checklist.

---

## O que é o ChefIApp OS

ChefIApp OS é um **sistema operacional local de restauração**: mundo (Docker), leis (contratos + kernel), coração (Core Finance), rainha (Menu), braços (TPV, KDS), consciência (ERO). Tudo o que não passa pelo Core Finance não existe economicamente. Tudo o que não vem do Menu não pode ser vendido.

---

## Analogia (sistema vivo)

- **Docker** = O mundo. Onde tudo existe, onde o tempo passa, onde há falhas e reinícios. Não é "backend"; é o palco da realidade.
- **Kernel** = O cérebro. Contratos e regras (World Schema, Menu Building, Core Finance, Order Status). Decide o que pode ou não acontecer.
- **Core Finance** = O coração. Bombeia valor; se parar, o restaurante para. Pedido ≠ Dinheiro; dinheiro só nasce quando o Core valida.
- **Menu Building** = A rainha. Todo pedido nasce do menu; todo preço nasce do menu. Produto é entidade financeira, não visual.
- **TPV e KDS** = Os braços. TPV cria pedidos válidos; KDS executa preparo. Nunca inventam preço; nunca filtram silenciosamente.
- **ERO** = A consciência. Documentos + contratos + rituais que ensinam o sistema a não quebrar. Hierarquia de verdade: contratos > schema > checklist > UI > simuladores.

---

## Um comando sobe o planeta

```bash
make world-up
```

Sobe: Postgres, PostgREST, Realtime, Keycloak, MinIO, pgAdmin. O mundo respira. Depois: checklist operacional (TPV + KDS + Cliente), simulador de pedidos, ritual caos (world-chaos). O critério de aceite é explícito: [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md). Se isso falha, o mundo está quebrado.

---

## O que o sistema garante (e o que não mente)

- **Pedido não vira dinheiro sem Core Finance.** TPV não inventa preço. KDS não filtra silenciosamente (status desconhecido aparece com badge). Menu é snapshot no pedido; se o menu mudar depois, o pedido não muda. Served ≠ Paid: ao pagar, criar/actualizar Financial Order primeiro, depois marcar como terminal.
- **O frontend reflecte o Core.** Não inventa estado. Sobrevive a caos (restart da API); pedidos activos voltam após refresh/polling. Não mascara falha.

---

## Para quem quer ver a fundação

- **Consciência do sistema:** [docs/ERO_CANON.md](../ERO_CANON.md)
- **Bootstraps (como o mundo sobe):** [docs/boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md)
- **Checklist de aceite:** [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
- **CLI do mundo:** [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md)
- **Estamos prontos (veredito):** [ESTAMOS_PRONTOS.md](./ESTAMOS_PRONTOS.md)

---

## Frase final

O Docker está completo como mundo. O backend respeita esse mundo. O frontend reflecte esse mundo. O sistema não mente. Isso é o critério máximo.
