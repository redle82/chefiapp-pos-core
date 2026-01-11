# UX Systems Deep Audit — ChefIApp (Truth-First)

## Executive Verdict
- Status: MISLEADING (Truth gaps restantes)
- Confidence: 7.0 / 10
- “Eu confiaria num jantar lotado?”: Ainda não
- Ambiente: health do backend não confirmado (porta 4320 sem resposta visível), front não ativo em 5173/5174/5175 no momento desta auditoria estática.

## P0 Truth Violations
Nenhuma P0 aberta após correções.

### P0 resolvida: TPV em memória sem disclosure
- Antes: [merchant-portal/src/pages/TPV/TPV.tsx#L103-L137](merchant-portal/src/pages/TPV/TPV.tsx#L103-L137) mutava pedidos localmente sem backend nem aviso.
- Correção: TPV agora explicita modo demo/offline, bloqueia ações quando não há backend UP ou quando dados são mock, desabilita onAction e CTA “+ Novo” nesses casos; banner avisa “dados locais, ações não persistem no core”.

## Hidden UX Risks
- Home: claim de “tempo real” foi substituída por aviso de “dados demo (mock)” ([merchant-portal/src/pages/Home/Home.tsx#L228-L232](merchant-portal/src/pages/Home/Home.tsx#L228-L232)).
- Ainda monitorar timers nos fluxos Start (Bootstrap/Creating/Publish) para garantir que navegações só ocorram após sucesso confirmado.

## Design System Weaknesses
- Uso de `.btn`/`.card` e cores inline fora dos tokens em páginas críticas (ex.: [merchant-portal/src/pages/SetupLayout.tsx#L101-L115](merchant-portal/src/pages/SetupLayout.tsx#L101-L115), [merchant-portal/src/pages/PreviewPage.tsx#L47-L66](merchant-portal/src/pages/PreviewPage.tsx), [merchant-portal/src/pages/TPVReadyPage.tsx](merchant-portal/src/pages/TPVReadyPage.tsx)). Mantém-se como risco estrutural para sinalização consistente.

## Microcopy Forensics
- “Dados em tempo real” ([merchant-portal/src/pages/Home/Home.tsx#L228-L232](merchant-portal/src/pages/Home/Home.tsx#L228-L232)) — sem garantia de feed real.
- Banners/claims de prontidão em Publish/TPVReady devem sempre depender de health + gates; manter copy alinhada a prova real.

## Recommendations
### Phase 0 (must-fix)
1) TPV: manter bloqueio/aviso de demo enquanto não houver integração real; próximo passo é conectar mutações a backend e implementar fila/offline.
2) Microcopy de dados: já marcado como demo; manter até integrar feed real.
3) Revisar timers de navegação nos fluxos Start para só navegar após sucesso confirmado.

### Phase 3.1 (post-beta)
- Migrar `.btn`/`.card` inline para componentes/tokens DS; centralizar cores de estados (ok/warn/error/down).
- Badge global de health no AppShell propagado para todas as páginas/CTAs.

### Phase 3.2 (compliance/scale)
- ARIA/aria-live para estados de health/bloqueio; prefers-reduced-motion em loaders; touch targets herdando tokens.
- Offline queue segura para TPV/Publish/Payments com reconciliação e marcadores de inconsistência.

## Final Statement
Does this UI ever lie to the human, even politely? Ainda sim: o TPV mostra progresso operacional sem confirmação do core, e métricas “tempo real” não são garantidas.
