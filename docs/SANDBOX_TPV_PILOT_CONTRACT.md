# Contrato: Sandbox TPV em modo piloto

**Data:** 2026-01-28  
**Status:** Contrato + implementado (marcação no Core + aviso na UI).  
**Objetivo:** Definir o que significa "TPV em modo piloto" — ambiente de teste com pedidos reais, controlado.

---

## Estado atual

- **demo:** TPV e KDS bloqueados pelo ModeGate (fallback "indisponível no modo demo").
- **pilot / live:** TPVMinimal e KDSMinimal liberados; pedidos vão para o Core (gm_orders, etc.).

**Implementado (marcação no Core + UI):**
- Em `productMode="pilot"`, o TPVMinimal passa `origin: 'pilot'` ao criar pedido via RPC `create_order_atomic`; a coluna `gm_orders.origin` armazena o valor (já existia no schema).
- Aviso na UI: "Modo piloto — pedidos de teste (marcados no sistema)" exibido no topo do TPV quando em modo piloto.
- Contrato `OrderOrigin` inclui `'pilot'`; normalização em `OrderOrigin.ts`.
- Opções mesa piloto e teto de pedidos permanecem como extensão futura (não implementadas).

---

## Contrato para sandbox em piloto (futuro)

1. **Objetivo:** Em `productMode="pilot"`, o dono pode testar o TPV com dados reais, mas com proteções (ex.: mesa de teste, teto de pedidos, ou marcação explícita "piloto" nos pedidos).

2. **Opções (a definir):**
   - **Mesa piloto:** Restaurante tem uma "mesa 0" ou "Mesa Piloto" reservada; em pilot, o TPV só permite abrir pedidos nessa mesa (ou pedidos piloto ficam marcados no Core).
   - **Teto de pedidos:** Em pilot, limitar a N pedidos abertos por dia (configurável ou fixo).
   - **Marcação no Core:** Coluna ou flag em `gm_orders` (ex.: `origin = 'pilot'`) para filtrar relatórios e não misturar com operação ao vivo.

3. **UI:** Em pilot, o TPV pode exibir um aviso discreto ("Modo piloto — pedidos de teste") e, se houver mesa piloto, restringir a seleção de mesa ou marcar automaticamente.

4. **Backend:** Se houver mesa piloto ou teto, o Core (ou RPC) pode validar ao criar pedido (ex.: rejeitar se não for mesa piloto em pilot, ou se exceder teto).

---

## O que NÃO fazer

- Não bloquear o TPV em pilot (já está liberado pelo ModeGate).
- Não implementar sandbox sem definir uma das opções acima (evitar lógica pela metade).

---

## Referências

- [FASE_FECHADA_NEXT.md](FASE_FECHADA_NEXT.md) — Próximos passos.
- ModeGate: TPVMinimal e KDSMinimal com `allow={["pilot", "live"]}`.
