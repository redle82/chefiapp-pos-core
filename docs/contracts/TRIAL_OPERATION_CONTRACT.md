# Contrato Trial Operation (Vida do Trial)

**Propósito:** Pós-primeira venda. O cliente opera no Dashboard: criar mais produtos, configurar equipa, ligar KDS, testar relatórios. Nada bloqueia; apenas avisos suaves de dias restantes no trial.

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [CONTRATO_TRIAL_REAL.md](CONTRATO_TRIAL_REAL.md), [RESTAURANT_LIFECYCLE_CONTRACT.md](RESTAURANT_LIFECYCLE_CONTRACT.md).

---

## Estado antes

- Primeira venda feita (ritual concluído).
- Trial ativo, Restaurant operacional.

---

## O que o cliente pode fazer

- Criar mais produtos e categorias.
- Configurar equipa e turnos.
- Ligar KDS e outros módulos.
- Testar relatórios e fechos de caixa.
- Usar TPV e operação normal.

---

## Regras

- **Nada bloqueia** a operação durante o trial (TPV, KDS, Dashboard acessíveis conforme RESTAURANT_LIFECYCLE e CONTRATO_TRIAL_REAL).
- **Avisos suaves:** "Faltam X dias para terminar o trial" — informativos, não agressivos.
- SystemState permanece **TRIAL** até conversão ou fim do período.

---

## Estado após (quando o trial termina)

- Transição para [TRIAL_TO_PAID_CONTRACT.md](TRIAL_TO_PAID_CONTRACT.md): escolher plano, modo leitura ou exportar dados.

---

## Próximo contrato

[TRIAL_TO_PAID_CONTRACT.md](TRIAL_TO_PAID_CONTRACT.md) — Fim do trial: conversão (escolher plano, modo leitura, exportar).
