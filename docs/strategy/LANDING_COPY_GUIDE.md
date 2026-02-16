# Guia de copy — Landing (conversão)

Princípios para manter a copy da landing orientada a conversão, sem overpromise.

**Voz:** Toda a copy de marketing segue o guia [MARKETING_SILICON_VALLEY_VOICE.md](MARKETING_SILICON_VALLEY_VOICE.md) — estilo Silicon Valley, nível CEO: visão primeiro, frases curtas, anti–status quo, confiança sem arrogância.

---

## Regra de ouro

**Nunca explicar a ferramenta. Sempre explicar o esforço que ela elimina.**

- Errado: "Mini-TPV para staff com acesso rápido."
- Certo: "O pedido nasce onde o cliente está—sem voltas ao balcão, sem papel, sem erros de memória."

---

## Secção Features: "O que evita"

Título da secção: **"O que o ChefIApp™ OS evita"** (ou equivalente por idioma).

Cada item deve:

1. **Título:** o que deixa de acontecer (ex.: "Sem pedidos perdidos nem mesas esquecidas").
2. **Body:** consequência positiva em uma frase (ex.: "O pedido vai da mesa à cozinha num passo. A mesma verdade para sala, bar e cozinha—sem idas e voltas, sem papel.").

Evitar:

- Listas genéricas de features.
- Jargão técnico sem benefício claro.
- Promessas que o produto ainda não entrega (ver [COMMERCIAL_CLAIMS_GUARDRAILS.md](COMMERCIAL_CLAIMS_GUARDRAILS.md)).

---

## Hero e CTAs

- **Subtítulo:** outcome em poucas palavras (ex.: "Um sistema. Menos caos. Controlo em tempo real da sala, cozinha e equipa.").
- **CTA principal:** curto e sem fricção (ex.: "Começar grátis" em vez de "Começar Teste Grátis").
- **CTA secundário:** acção clara (ex.: "Ver como funciona").

---

## Onde vive a copy

- **Landing (marketing):** `merchant-portal/src/pages/LandingV2/` — secções em `sections/` (HeroV2, ToolsAvoidV2, PricingV2, etc.). Copy traduzível em `i18n/landingV2Copy.ts`.
- Contrato canónico: [LANDING_CANON.md](LANDING_CANON.md) — uma única landing, LandingV2 no merchant-portal.
- Alinhamento entre landing pública e LandingV2 (termos-chave, promessa, fluxo): [MARKETING_PAGES_ALIGNMENT.md](MARKETING_PAGES_ALIGNMENT.md).

---

## Referências

- [MARKETING_SILICON_VALLEY_VOICE.md](MARKETING_SILICON_VALLEY_VOICE.md) — voz de marketing (CEO, Silicon Valley).
- [COMMERCIAL_CLAIMS_GUARDRAILS.md](COMMERCIAL_CLAIMS_GUARDRAILS.md) — o que podemos e não podemos prometer.
- [FUNIL_PRIMEIRA_VENDA_LANDING_TPV.md](FUNIL_PRIMEIRA_VENDA_LANDING_TPV.md) — fluxo landing → demo → primeira venda.
