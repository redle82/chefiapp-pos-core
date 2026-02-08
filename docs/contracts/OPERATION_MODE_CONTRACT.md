# Contrato Modo de Operação (Passo 3 do Onboarding)

**Propósito:** Passo 3 do wizard. O utilizador escolhe como quer prosseguir; o sistema adapta a UI em função desta escolha (modo rápido vs configurar melhor).

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md).

---

## Estado antes

- Restaurant criado, menu mínimo válido.
- Modo de operação ainda não definido no fluxo de onboarding.

---

## Opções

- **Quero vender agora** — modo rápido: ir direto para o ritual da primeira venda (Passo 4).
- **Quero configurar melhor antes** — mais tempo no Dashboard/Config antes da primeira venda; o sistema não força o ritual imediato.

---

## Estado após

- Modo definido.
- UI adapta (ex.: CTA principal para TPV vs Config conforme a escolha).
- Pronto para Passo 4 (primeira venda) quando o utilizador avançar.

---

## Regra

O sistema regista a escolha e não bloqueia nenhum caminho; apenas orienta o próximo passo de forma coerente com a escolha.

---

## Próximo contrato

[FIRST_SALE_RITUAL.md](FIRST_SALE_RITUAL.md) — Passo 4: primeira venda (ritual).
