# Primeiros 3 minutos do teu restaurante — Demo Guiado (v2)

Documento de referência para a experiência guiada de 3 minutos. **v2:** Demo guiado é experiência do trial real; não existe "modo demo" paralelo. Pode ser mostrado com dados reais do restaurante recém-criado ou com seed inicial ("Criámos um restaurante de exemplo para começares. Podes apagar tudo depois.").

---

## Posicionamento

- **Antes (v1):** Demo com sistema 100% fake; estado DEMO_FINISHED; fluxo paralelo.
- **Agora (v2):** "Primeiros 3 minutos do teu restaurante" — experiência inicial do trial, com dados reais (ou seed). Ao sair, redireciona para `/auth` (se visitante) ou para dashboard/TPV (se já tem restaurante). Sem flag nem estado especial.

---

## CTA de entrada

- **Texto:** "Ver o sistema a funcionar (3 min)"
- **Destino:** `/demo-guiado` (rota pública). Ao concluir → `/auth` para criar restaurante.

---

## Ecrãs (fluxo de 4 passos)

1. **Pedido de exemplo** — Narrativa: "Este é um pedido de exemplo." (ou com dados do restaurante se pós-bootstrap.) CTA: "Enviar para a cozinha".
2. **KDS** — Narrativa: "Na cozinha, o pedido aparece assim." CTA: "Marcar como pronto".
3. **Caixa** — Narrativa: "O pedido chega ao caixa automaticamente." CTA: "Ver impacto no relatório".
4. **Fecho** — Narrativa: "Isto foi uma simulação. No sistema real, é igual — mas com dinheiro. Foi assim que um pedido atravessa o restaurante — sem fricção." CTA: "Criar o meu restaurante" (ou "Usar no meu restaurante") → `/auth`.

---

## Interstitial (pós-demo)

- **Copy:** "Agora imagina isto com os teus pratos e preços." + CTA "Criar o meu restaurante" → `/auth`.
- **Sem** setDemoFinishedFlag nem estado DEMO_FINISHED; fluxo único.

---

## Regras

- **Sem rotas livres no primeiro contacto:** o utilizador segue os 4 passos; depois pode ir para `/auth` ou dashboard conforme contexto.
- **Dados:** pré-encenados (Mesa 4, 2 cervejas, 1 prato) em rota pública; ou dados reais do restaurante se demo for mostrado após bootstrap (experiência "Primeiros 3 minutos do teu restaurante").
- **Copy de proteção (seed):** "Criámos um restaurante de exemplo para começares. Podes apagar tudo depois."

---

## Referências

- [CONTRATO_VIDA_RESTAURANTE.md](../contracts/CONTRATO_VIDA_RESTAURANTE.md) (v2, sem DEMO_GUIDED/DEMO_FINISHED)
- [CONTRATO_ENTRADA_CANONICA.md](../contracts/CONTRATO_ENTRADA_CANONICA.md)
