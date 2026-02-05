# FASE C — Local Human Safe Mode

Antes de Supabase, Stripe ou clientes: garantir que um humano não-dev nunca vê erro técnico, nunca fica com botões mortos e nunca é bloqueado no Ecrã Zero. É uma **camada de tradução humana**, não um refactor de arquitectura.

**Na sequência:** FASE B FALHOU (impossibilidade operacional) → FASE C (este doc) → repetir FASE B → depois Supabase / Stripe / cliente pagante.

---

## Contrato "Local Human Safe Mode" (4 regras)

1. **Nunca mostrar erro técnico ao utilizador** — Zero "Core indisponível", zero Docker, zero CLI na UI humana. Só linguagem de produto: "Estamos a preparar o sistema", "Modo demonstração", "A ligação está a ser preparada."

2. **Botões nunca ficam mortos** — Se Core OFF, modo simulado local automático; acções têm sempre um caminho (ex.: "Continuar em modo demonstração"). Nenhum botão que não responda ou exija conhecimento técnico.

3. **Zero CLI para humano** — Terminal e scripts são só para dev. Na UI, só linguagem de produto. Ajuda técnica (ex.: "Como iniciar o servidor local") fica atrás de link discreto "Sou desenvolvedor".

4. **Ecrã Zero / Dashboard nunca bloqueiam** — Há sempre um caminho seguro: dashboard com dados demo/seed. Mesmo em rota de reset ou erro, o utilizador tem CTA para "Continuar em modo demonstração".

---

## Checklist de implementação

- [x] CoreUnavailableBanner: mensagem humana ("Estamos a preparar o sistema..."); sem "Core", "Docker" nem comandos; link "Sou desenvolvedor" opcional para /help/start-local.
- [x] CoreResetPage: quando Core em baixo, cópia humana ("A ligação ao servidor está a ser preparada."); CTA "Continuar em modo demonstração" → /dashboard.
- [x] Nenhum outro ecrã expõe "Core indisponível" ou bloqueia sem CTA humano (KDSMinimal e outros: mensagem humana ou modo demo).
- [x] INDEX e FASE_5_FASE_B_RESULTADO: FASE C referida como passo obrigatório antes de Supabase/cliente.

---

## Referência: grandes players

Toast, Square, Shopify POS: quando o backend falha ou está offline, a UI entra em **modo degradado** — "Estamos a reconectar", "Modo offline", "Pode continuar a usar em modo local". Nunca mostram erro de infraestrutura (Docker, servidor, CLI) ao utilizador final. O ChefiApp alinha-se a este padrão com a FASE C (Local Human Safe Mode).

---

## Resultado esperado

- **Contrato** documentado e checklist verificável.
- **UI humana:** zero "Core indisponível" / Docker / CLI visíveis; cópia do tipo "Estamos a preparar o sistema" + "Continuar em modo demonstração" onde há risco de bloqueio.
- **Ecrã Zero / Dashboard:** sempre acessíveis com modo demo quando Core está em baixo; nenhum beco sem saída.
- **Depois da FASE C:** repetir FASE B (Teste Humano); em seguida Supabase e cliente pagante fazem sentido.

Escopo: doc + cópia + CTA na CoreResetPage + ajuste do banner. Sem mudar lógica de rede nem arquitectura.
