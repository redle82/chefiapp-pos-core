# Landing e deploy Vercel

**Contrato canónico:** [strategy/LANDING_CANON.md](strategy/LANDING_CANON.md).

A landing de marketing é a **LandingV2** no merchant-portal. Não existe projeto separado para a landing.

- **Deploy:** O mesmo build do merchant-portal (ver [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)) inclui a landing nas rotas `/landing-v2` e `/v2`.
- **Domínios:** Para chefiapp.com ou www.chefiapp.com, configurar o mesmo projeto/build do merchant-portal; a rota principal ou uma delas pode servir a landing (ex.: `/` ou `/landing-v2` conforme decisão de produto).
- **Analytics:** Variáveis `VITE_GA4_ID`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` no build do merchant-portal ativam GA4/PostHog na landing (componente `LandingAnalytics`).
