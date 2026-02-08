# Contrato de Comportamento TPV (Caixa) — Core

## Lei do sistema

**O TPV é o terminal de vendas e caixa. O Core manda (pedidos, totais, regras de desconto, fecho); o TPV mostra e executa acções permitidas. Não inventa preços nem regras de fecho.**

Este documento é contrato formal no Core. Complementa [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md) (instalação/hardware) e a topologia de execução.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel        | Responsabilidade                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**     | Fonte de verdade: produtos, preços, descontos permitidos, regras de fecho de mesa/conta. Valida e persiste pedidos e pagamentos.                                |
| **TPV (UI)** | Mostra mesas/pedidos/totais; cria/edita pedidos via Core; aplica descontos dentro dos limites que o Core expõe; não altera preços nem regras por conta própria. |

---

## 2. Pedidos e totais

- **Pedidos** são criados/alterados via Core (Kernel.execute ou API). O TPV envia acções; o Core valida e persiste.
- **Totais** (subtotal, desconto, total) são calculados pelo Core ou por regras expostas pelo Core. O TPV não recalcula margem nem preço base por conta própria.

---

## 3. Desconto e fecho

- **Desconto** só dentro do que o Core permitir (ex.: percentagem máxima por papel, tipo de desconto). O TPV expõe a acção; o Core valida.
- **Fecho** de mesa/conta é acção permitida conforme [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md) e papéis; o Core regista e aplica consequências.

---

## 4. Se falhar (rede, impressora, Core)

- Comportamento em falha segue [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) e [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md) quando aplicável.
- O TPV não inventa “venda local” sem passar pelo Core; em modo degradado, fila e sync são governados pelo Core.

---

## 5. Status

**FECHADO** para comportamento do terminal TPV: quem manda, quem obedece, pedidos/totais/desconto/fecho e falha. Implementação (TPVMinimal, MiniTPVMinimal) já existe; este contrato formaliza a lei.
