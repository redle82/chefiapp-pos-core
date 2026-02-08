# Plano final — Execução cirúrgica até terminar

**Verdade central:** Não precisamos mais pensar arquitetura, explicar o sistema ou criar documentos novos. Fechar lacunas entre o que o sistema já é e o que ainda não entrega perfeitamente. Polimento + conclusão funcional.

---

## Regras absolutas

- **Nada de:** refactor, nova arquitetura, novo documento de design.
- **Só:** uso real → anotar fricções → corrigir só isso.
- **Nova ideia = v2;** não entra agora.

---

## Frente 1 — AppStaff (acabar o que já existe)

**Objetivo:** O AppStaff parece, reage e funciona como app nativo operacional, sem ruído.

### A. Launcher (/app/staff/home)

| Item | Critério |
| --- | --- |
| Tiles → modos | Todos os tiles levam a modos realmente utilizáveis. Nenhum modo leva a “quase pronto”. |
| Estados visuais | ● ! ✓ batem com dados reais (não mock). |
| Texto | Nenhum texto explicativo voltou. |

### B. Modos

| Modo | Critério de pronto |
| --- | --- |
| **TPV** | Fluxo completo: pedido → pagamento → sucesso. Nenhum placeholder visual. |
| **KDS** | Estados claros (novo / em preparo / pronto). Atualização em tempo real visível. |
| **Turno** | Abrir / fechar turno sem erro. |
| **Tarefas** | Lista funcional: criar, concluir, atrasar. |
| **Alerts** | Alertas reais ou nenhum (não “fake alerts”). |

**Regra:** Se um modo não está realmente utilizável → não entra no launcher (ocultar ou desativar tile).

---

## Frente 2 — Menu digital (onde ainda dói)

**Objetivo:** Menu emocional, visual e óbvio — não “configuração web”.

| Falta | Ação |
| --- | --- |
| Wave | Perfeita: sem recorte errado, sem borda branca. |
| Header fixo | Logo + selos + alergénios impecáveis. |
| Cards | Micro-vídeo real (loop curto, suave) onde aplicável. |
| Ao clicar no prato | Imagem/vídeo grande, descrição limpa, alergénios claros. |
| Recomendações | Visuais: TripAdvisor, chef pick, popular. |

**Critério de pronto:** Mostrar a alguém sem explicar; se disser “isso parece premium” → passou.

---

## Frente 3 — Dados reais (parar de trabalhar no vazio)

**Objetivo:** O sistema precisa ter vida. Nada de telas vazias sem contexto.

### Seed mínimo obrigatório

- Restaurante (ex.: Sofia Gastrobar — nome ou piloto com seed completo).
- Localização (já existe default em `locationsStore`: Sofia Gastrobar Ibiza).
- 2–3 pessoas em `gm_restaurant_people` (check-in AppStaff).
- 1 turno (caixa aberto / shift_logs conforme contrato).
- 3–5 tarefas em `gm_tasks` (status OPEN).
- 5–8 pratos com media no catálogo (`gm_catalog_items` com `image_url`).

### Estados vazios

- Ou bloqueios claros (ex.: “Configure pessoas em Config → Pessoas”).
- Ou mensagens operacionais curtas.
- Nunca confusos.

**Regra:** Um app operacional não vive de empty states.

**Artefacto:** `docker-core/schema/migrations/20260207_seed_sofia_gastrobar.sql` — seed mínimo para uso real (people, tasks, pratos). Aplicar após migrações e `seeds_dev.sql`.

---

## Frente 4 — Fechamento (decidir que acabou)

**Objetivo:** Declarar “isto está pronto”.

### 1. Lista única: KNOWN LIMITATIONS

- Documento ou secção com coisas que conscientemente ficaram para depois (v2).
- Qualquer nova ideia = v2, não entra agora.

### 2. Checklist GO-LIVE

- [ ] App abre.
- [ ] AppStaff funciona (entrada, launcher, pelo menos 1 modo utilizável).
- [ ] Menu encanta (wave, header, pratos com media).

### 3. Congelar mudanças estruturais

- A partir do GO-LIVE: só bugfix e polish visual.
- Nova funcionalidade = v2.

---

## Próximas 72 horas (ordem exata)

1. Escolher 1 restaurante fictício: **Sofia Gastrobar** (nome no seed/localStorage).
2. Popular dados reais (aplicar seed mínimo: people, tasks, pratos).
3. Entrar no AppStaff como operador (localização + pessoa + contrato).
4. Usar o sistema como se estivesse a trabalhar.
5. Anotar apenas fricções reais.
6. Corrigir só isso.

Nada de refactor, nova arquitetura ou novo documento. Só uso real → correção.

---

## Referências (sem criar novos)

- Arquitetura e AppStaff: `docs/architecture/ARQUITETURA_E_APPSTAFF_COMPLETO.md`
- Canon visual AppStaff: `docs/architecture/APPSTAFF_VISUAL_CANON.md`
- Menu: `docs/architecture/MENU_VISUAL_RUNTIME_CONTRACT.md`, `MENU_HEADER_WAVE_CONTRACT.md`
- Seed dev: `docker-core/schema/seeds_dev.sql`
- Seed Sofia Gastrobar: `docker-core/schema/migrations/20260207_seed_sofia_gastrobar.sql`
