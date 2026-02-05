# ONBOARDING 5 MINUTOS — 9 Telas (Contrato)

**Propósito:** Contrato único do fluxo de onboarding em 9 telas (~5 minutos). Estados, rotas, copy por tela, regra TPV preview vs live e Ritual de Abertura. Substitui/estende o fluxo de 4 passos em [ONBOARDING_FLOW_CONTRACT.md](ONBOARDING_FLOW_CONTRACT.md).

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [ONBOARDING_FLOW_CONTRACT.md](ONBOARDING_FLOW_CONTRACT.md).

---

## Princípio-mãe (arquitectura)

**Onboarding ≠ Operação.** Onboarding cria o mundo. Operação só começa quando o mundo existe.

- Durante onboarding → TPV em **modo simulado (preview)**.
- TPV **real (live)** → só depois do "Ritual de Abertura" (turno aberto).
- **Regra técnica:** TPV live só quando `shift_status === open`; TPV preview sempre permitido no fluxo de onboarding.

---

## Promessa ao utilizador

*"Em menos de 5 minutos, o teu restaurante estará pronto para vender. Antes, isto levava dias."*

---

## Mapeamento oficial: 9 telas (Tela 0–8)

~30–40s por tela.

| Tela | Rota | Objetivo | Campos / Escolhas | CTA |
|------|------|----------|-------------------|-----|
| 0 Pré-Onboarding | `/onboarding/intro` | Apresentar a promessa e o que vai configurar | — | "Começar configuração" |
| 1 Identidade | `/onboarding/identity` ou `/bootstrap` | Nome, tipo, país+moeda | Nome restaurante, tipo, país, moeda | "Seguinte" |
| 2 Local & Contacto | `/onboarding/location` | Cidade, contacto, idioma | Cidade, email, telefone, idioma | "Seguinte" |
| 3 Como funciona o dia | `/onboarding/day-profile` | Perfil do dia a dia | Balcão/Mesas/Ambos; ticket €/€€/€€€; Dinheiro/Cartão/Ambos | "Seguinte" |
| 4 Turno & Caixa (conceitual) | `/onboarding/shift-setup` | Valor padrão sugerido para abertura de turnos | 0/50/100 € (persistido em storage); não abre turno | "Seguinte" |
| 5 Produtos | `/onboarding/products` | Primeiro produto ou exemplos | 1 produto rápido / Importar depois / Produtos de exemplo | "Seguinte" / "Continuar sem adicionar" |
| 6 Preview TPV | `/onboarding/tpv-preview` | TPV — Pré-visualização (espelho, não operacional) | Produtos exemplo ou reais; CTA "Simular venda" | "Continuar configuração" |
| 7 Plano & Trial | `/onboarding/plan-trial` | Trial ativo, limites | — | "Escolher plano depois" / "Ver planos" → "Seguinte" |
| 8 Ritual de Abertura | `/onboarding/ritual-open` | Conclusão; destravar TPV real | — | "Abrir turno agora" / "Ir para o painel" |

---

## Estados obrigatórios

| Estado | Descrição | Fonte |
|--------|-----------|--------|
| `onboarding_completed` | Restaurante pronto para operar (ritual concluído ou skip equivalente) | Core: `gm_restaurants.onboarding_completed_at` |
| `tpv_mode` | `preview` (durante onboarding, TPV simulado) \| `live` (após ritual, turno aberto) | Derivado: preview até ritual; live quando shift aberto |
| `shift_status` | `closed` \| `open` | Core: `gm_cash_registers` (caixa aberto para o restaurante) |

**Regra de ouro:** TPV live só com `shift_status === open`. TPV preview sempre permitido durante onboarding (telas 0–8).

---

## Copy por tela (fonte de verdade para UI)

### Tela 0 — Pré-Onboarding (`/onboarding/intro`)

- **Headline:** "Criar um restaurante costumava levar dias. Agora leva menos de 5 minutos."
- **Bullets:** Estrutura legal (nome, tipo, país); Moeda e idioma; Produtos e menu; Caixa e turno; TPV pronto para vender.
- **CTA:** "Começar configuração"

### Tela 1 — Identidade

- **Headline:** "Identidade do teu restaurante"
- **Campos:** Nome do restaurante, Tipo (Restaurante / Café / Bar / etc.), País, Moeda.
- **CTA:** "Seguinte"

### Tela 2 — Local & Contacto

- **Headline:** "Onde e como contactar"
- **Campos:** Cidade, Email, Telefone, Idioma.
- **CTA:** "Seguinte"

### Tela 3 — Como funciona o dia

- **Headline:** "Como funciona o teu dia a dia"
- **Escolhas:** Serviço: Balcão / Mesas / Ambos; Ticket médio: € / €€ / €€€; Método principal: Dinheiro / Cartão / Ambos.
- **CTA:** "Seguinte"

### Tela 4 — Turno & Caixa (conceitual)

- **Headline:** "Turno e caixa"
- **Conteúdo:** Valor **padrão sugerido** para abertura de turnos (0 / 50 / 100 €). Será usado para pré-preencher no dia a dia e no ritual. Não abre turno aqui — só configuração.
- **Persistência:** Ao avançar, grava em storage `chefiapp_shift_default_opening_cents_${restaurantId}` (valor em cêntimos). Ver secção "Dinheiro (Tela 4 e Tela 8)" abaixo.
- **CTA:** "Seguinte"

### Tela 5 — Produtos

- **Headline:** "Primeiro produto (ou exemplos)"
- **Opções:** Criar 1 produto rápido; Importar depois; Produtos de exemplo.
- **CTA:** "Seguinte" / "Continuar sem adicionar"

### Tela 6 — Preview TPV

- **Headline:** "TPV — Pré-visualização"
- **Mensagem:** "Este é um exemplo. As vendas reais começam quando abrires o turno."
- **Conteúdo:** TPV em modo preview: produtos sempre visíveis (reais ou exemplo com moeda correcta); carrinho e CTA "Simular venda" (sem persistir). Sem mensagens técnicas (Core offline, Sem catálogo). Ver secção "TPV Preview" abaixo.
- **CTA:** "Continuar configuração"; link opcional: "Abrir turno quando estiver pronto" → ritual.

### Tela 7 — Plano & Trial

- **Headline:** "Trial ativo"
- **Conteúdo:** Trial ativo, limites; "Escolher plano depois" / "Ver planos".
- **CTA:** "Seguinte"

### Tela 8 — Ritual de Abertura

- **Headline:** "O teu restaurante está pronto."
- **Mensagem:** "Quando abrires o turno, as vendas serão reais."
- **Campo caixa:** Label "Quanto tens hoje no caixa? (€)". Valor **pré-preenchido** com o padrão da Tela 4 (storage); o utilizador pode alterar. Texto de ajuda: sugestão da configuração.
- **CTAs:** "Abrir turno agora" (abre turno no Core, `tpv_mode=live`, destrava TPV real) / "Ir para o painel" (dashboard sem abrir turno).

---

## Regras de navegação

- **Wizard linear:** Next/Back ou stepper; progresso "Passo X de 9".
- **Persistência:** Passo actual (e dados por passo) persistidos para retomada.
- **Backward compatibility:** Utilizadores a meio do fluxo antigo (bootstrap + first-product) devem ser redirecionados para o novo fluxo (Tela 0 ou Tela 1) ou concluídos por caminho de migração (ex.: `/bootstrap` → `/onboarding/identity`; `/onboarding/first-product` → `/onboarding/products`).

---

## Dinheiro (Tela 4 e Tela 8)

- **Regra-mãe:** Configuração define padrões. Operação executa decisões.
- **Tela 4:** Persiste apenas o **valor padrão sugerido** para abertura de turnos. Storage: `chefiapp_shift_default_opening_cents_${restaurantId}` (cêntimos). Módulo: `shiftDefaultsStorage` (`getDefaultOpeningCashCents` / `setDefaultOpeningCashCents`).
- **Tela 8:** Usa esse valor **apenas como pré-preenchimento** do campo "Quanto tens hoje no caixa? (€)". O utilizador pode alterar antes de abrir o turno. Nenhuma pergunta duplicada — a Tela 4 não pergunta "quanto tens hoje", só "qual o valor padrão sugerido".

---

## TPV Preview (espelho, não operacional)

- **Definição:** Preview = UI ilustrativa + interações simuladas; **sem** mensagens técnicas (Core offline, Sem catálogo); **sem** lógica de caixa nem confirmação real.
- **Comportamento:** Em `mode="preview"`, o TPV mostra sempre produtos (reais do Core ou lista de exemplo com moeda correcta). Carrinho e CTA "Simular venda" não chamam RPC; toast "Preview — pedido simulado". Banner "Caixa Fechado" e erros de rede não são exibidos em preview.

---

## TPV preview vs live (gate técnico)

- **Rota `/op/tpv` com `tpv_mode === 'preview'`:** Servir componente TPV em modo preview (sem abrir turno real, sem persistir vendas).
- **Rota `/op/tpv` com `tpv_mode === 'live'` e `shift_status === 'open'`:** TPV real.
- **Se `shift_status === 'closed'` e utilizador tenta TPV live:** Redirecionar para Ritual ou mostrar "Abrir turno" (nunca toast contraditório "já aberto").
- **Em preview:** Nunca tentar abrir turno real.

---

## Dados onboarding → TPV

Ao entrar no TPV (preview ou live), o sistema já sabe: restaurante (nome, tipo, moeda), método principal, mesas ou balcão. O TPV não pergunta nada que já foi configurado. Fonte: identidade/Core ou pilot mock; opcionalmente `chefiapp_onboarding_day_profile` em localStorage para perfil do dia.

---

## Referências cruzadas

- [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md) — Sequência canónica; este contrato alinha as 9 telas ao funil.
- [ONBOARDING_FLOW_CONTRACT.md](ONBOARDING_FLOW_CONTRACT.md) — Fluxo de 4 passos; este contrato substitui/estende para 9 telas.
