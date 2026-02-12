# Roteiro Supremo — Core ON

**Objetivo:** Provar que o sistema opera de ponta a ponta, sem dúvida mental.

---

## O que mudou (pós-correção Preflight/TPV)

- **Antes:** Core offline parecia bug, loop ou caos.
- **Agora:** Core offline é estado operacional explícito, com causa + ação.
- **Preflight:** Uma única fonte de verdade (Dashboard e TPV falam a mesma língua).
- **Dashboard e TPV:** CTAs corretos; sem redirect à toa; sem fingir catálogo vazio.

O sistema não estava desorganizado — estava honesto mas ainda não pedagógico. Agora é os dois: bloqueia quando deve, explica porquê, aponta o próximo passo.

---

## Estado atual do sistema

| Onde          | Comportamento                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard** | Mostra "Operação Bloqueada" → Core offline; CTA "Ver instruções" (Runbook); não convida a "Abrir TPV" quando não faz sentido.  |
| **TPV**       | Não redireciona à toa; não finge catálogo vazio; diz "Core offline. Inicie o Core para operar."; permanece estável, sem loops. |
| **Core**      | Continua soberano; nada mockado; nada falsificado para "parecer funcionar".                                                    |

---

## Pré-condições

- Docker Core ON (health OK).
- Merchant-portal a correr.
- Navegador limpo (aba anónima ajuda).
- Nenhum restaurante ativo anterior (ou criar um novo).

---

## FASE A — Setup mínimo (1–5)

**1. Subir o Core**
`docker compose -f docker-compose.core.yml up -d` (em `docker-core`).
✔️ Health do Core = UP; PostgREST responde; dashboard mostra Core online.

**2. Abrir Landing**
URL `/`. ✔️ CTA "Testar / Trial", "Ver sistema a funcionar"; nada estranho.

**3. Auth**
Ir para `/auth` → "Simular Registo (Piloto)". ✔️ Redireciona para `/bootstrap`.

**4. Bootstrap**
Criar restaurante (nome, tipo). ✔️ Redireciona para onboarding/config.

**5. Configuração mínima**
Identidade (nome, país, fuso), localização, horários. ✔️ Dashboard mostra Identidade ✓, Localização ✓, Horários ✓; Core ONLINE.

---

## FASE B — Cardápio e prontidão (6–7)

**6. Menu Builder**
Ir para `/menu-builder`. ✔️ Itens existem; menu PUBLICADO; banner verde (menu disponível).

**7. Dashboard — Preflight**
Voltar ao `/dashboard`. ✔️ Operação não bloqueada; "Abrir TPV" habilitado; nenhum blocker.

---

## FASE C — TPV: nascimento do pedido (8–10)

**8. Abrir TPV**
Ir para `/op/tpv`. Se lock: desbloquear. ✔️ TPV carrega com produtos visíveis.

**9. Abrir Turno / Caixa**
Clicar "Abrir Turno". ✔️ Turno aberto; caixa aberta; sem redirect estranho.

**10. Criar pedido**
Selecionar mesa ou balcão; adicionar 1 item. ✔️ Pedido NASCE (OPEN); carrinho vira pedido ativo.

---

## FASE D — Cozinha (11–12)

**11. Enviar à cozinha**
No TPV: "Preparar / Enviar à cozinha". ✔️ Pedido → IN_PREP; sem erro de Core.

**12. KDS**
Abrir `/op/kds`. ✔️ Pedido visível; "Marcar item pronto" → item READY.

---

## FASE E — Fecho e pagamento (13–15)

**13. Voltar ao TPV**
✔️ Pedido aparece como READY; estado sincronizado TPV ↔ KDS.

**14. Servir / Pagar**
No TPV: Servir → Pagar. ✔️ Fluxo de pagamento executa; fiscal/fila OK.

**15. Fecho**
✔️ Pedido → CLOSED; caixa/turno continuam abertos; ciclo completo sem erro.

---

## Critério final de sucesso

O teste **PASSA** se:

- O pedido nasce no TPV.
- A cozinha nunca cria pedidos, só executa.
- Estados fluem: **OPEN → IN_PREP → READY → CLOSED**.
- Core é autoridade em tudo (ordens, itens, status).
- Nenhum redirect parece bug; nenhuma tela parece "quebrada".

Se isso passa, o sistema **está operacional**. Não é trial. Não é conceito. É OS de restaurante.
