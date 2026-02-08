# Known Limitations e checklist GO-LIVE

**Objetivo:** Lista única do que ficou conscientemente para depois (v2) e checklist para declarar "isto está pronto". Ref.: [PLANO_FINAL_EXECUCAO.md](PLANO_FINAL_EXECUCAO.md) Frente 4.

---

## 1. Known Limitations (ficaram para v2)

- **Alertas (Exceções):** Modo Exceções pode mostrar lista vazia até alertas reais estarem ligados ao Core. Não mostrar "fake alerts"; estado vazio = "Nenhum alerta ativo".
- **Menu digital — micro-vídeo nos cards:** Cards usam imagem (image_url); vídeo (mediaPreview) opcional. Vídeos reais em loop nos cards = v2.
- **Turno:** Abrir/fechar turno depende de gm_cash_registers / shift_logs; fluxo completo de encerramento declarado = v2 se ainda não estiver fechado.
- **TPV/KDS:** Fluxo pedido → pagamento → sucesso e estados KDS (novo / em preparo / pronto) dependem de dados Core e realtime; polish fino = v2.
- **Recomendações no menu:** Secção "Recomendações" usa badges (chef, mais_pedido, novidade); ordenação/prioridade por dados analíticos = v2.
- **Billing/Stripe:** Fluxo de pagamento real e bloqueio por plano = já documentado noutros checklists; fora do âmbito do plano final de polish.

Qualquer nova funcionalidade ou refactor estrutural = v2; não entra no scope "terminado".

---

## 2. Checklist GO-LIVE

- [ ] **App abre** — Bootstrap/FlowGate deixa entrar; sem ecrã branco indefinido.
- [ ] **AppStaff funciona** — Entrada em /app/staff; gates (localização, contrato, pessoa) resolvem ou mostram mensagem clara; launcher mostra tiles; pelo menos um modo (ex.: Operação, Tarefas) utilizável.
- [ ] **Menu encanta** — Rota /menu-v2; wave sem borda branca; header com logo/selos; pratos com imagem; detalhe do prato (imagem, descrição, alergénios); secção Recomendações quando há badges.

---

## 3. Congelar mudanças estruturais

A partir do momento em que o checklist GO-LIVE estiver assinalado:

- **Permitido:** bugfix, polish visual, mensagens de empty state, correções de copy.
- **Não permitido:** nova arquitetura, novos documentos de design, refactor de rotas/shell, novas funcionalidades (estas = v2).

---

*Última atualização: 2026-02-07. Plano: [PLANO_FINAL_EXECUCAO.md](PLANO_FINAL_EXECUCAO.md).*
