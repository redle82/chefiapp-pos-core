# Onda 4 — Piloto P1 (alvos, abordagem, agendamento)

**→ Próxima ação:** Enviar proposta a 2 restaurantes (ex. Can Terra, La Brasa); ao confirmar, atualizar §9 (Estado → confirmada). Repetir até 5 confirmadas → P1 ativo.

**Data:** 2026-02-01
**Referências:** [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) (Bloco 1) · [TARGET_RESTAURANT_PROFILE.md](../TARGET_RESTAURANT_PROFILE.md)
**Objetivo:** Preencher itens 5–9 do checklist: ICP, lista de alvos, script de abordagem, checklist onboarding, agendamento de 5 instalações.

**Estado Passo 1:** 1.1 ICP — fechado (§5). 1.2 Lista 10 alvos — preenchida (§6). 1.3 Script — email + telefone + versão Ibiza (§7). 1.4 Agendar 5 instalações — tabela §9 pronta; plano semanal §10 (Dia 1–14) pronto. **Pendente:** confirmar 5 datas em §9 → P1 ativo.

**👉 Próximo passo (fazer agora):** Enviar proposta a 2 restaurantes (ex. Can Terra, La Brasa); quando confirmarem, atualizar §9 (Estado → confirmada) e repetir até 5 confirmadas. Depois executar §10 com datas reais.

**Progresso P1:**

- [x] §6 Lista 10 alvos preenchida
- [x] Fluxo criação restaurante (Bootstrap → Primeiro produto → Dashboard/TPV) validado em Docker+Pilot (browser + E2E smoke)
- [ ] §9 Agendar 5 instalações (5 datas confirmadas) → P1 ativo

---

## 5. ICP (Ideal Customer Profile) — Passo 1.1

**Doc canónico:** [TARGET_RESTAURANT_PROFILE.md](../TARGET_RESTAURANT_PROFILE.md) — perfil principal, o que valorizam, o que não são.

Preencher apenas (15–30 min). Nada técnico. Nada visionário. Realidade de restaurante.

**1 frase clara (para usar em abordagem):**

- Restaurante pequeno ou médio, dono ou gerente com operação real (sala, cozinha, caixa), que queira reduzir caos operacional e ter TPV + cozinha em tempo real.
- [ ] ICP frase final aprovada (editar acima se necessário).

**3 critérios obrigatórios (tem de cumprir os 3):**

1. 1 localização; dono ou gerente com poder de decisão.
2. TPV em uso ou a adoptar em breve.
3. Disponibilidade para 2 semanas de piloto com check-ins.

**2 critérios de exclusão (se cumprir, não é alvo):**

1. Grande rede com dezenas de localizações.
2. Só quer TPV básico sem ligação sala-cozinha.

- [ ] ICP final aprovado (1 frase + 3 obrigatórios + 2 exclusão).

---

## 6. Lista 10 alvos

**Critério aplicado:** 1 localização; dono acessível; operação real sala+cozinha; não gastro-corporate; não franquia.

| #   | Nome / restaurante     | Contacto (email ou tel.)                                      | Cidade/região      | Notas                                  |
| --- | ---------------------- | ------------------------------------------------------------- | ------------------ | -------------------------------------- |
| 1   | Sofia Gastrobar        | interno                                                       | Ibiza              | Caso de referência / dogfooding        |
| 2   | Can Terra              | [info@canterra.es](mailto:info@canterra.es)                   | Ibiza              | Restaurante local, fluxo constante     |
| 3   | La Brasa               | +34 971 31 23 84                                              | Ibiza (Ibiza Town) | Cozinha tradicional, alta rotatividade |
| 4   | Passion Café           | [info@passioncafeibiza.com](mailto:info@passioncafeibiza.com) | Ibiza              | Cadeia pequena, aberta a tecnologia    |
| 5   | Es Tap Nou             | +34 971 30 19 46                                              | Ibiza              | Bar/restaurante clássico               |
| 6   | Sa Vida Café           | Instagram DM                                                  | Santa Eulària      | Dono ativo nas redes                   |
| 7   | Restaurante Marvent    | [info@marvent.es](mailto:info@marvent.es)                     | Sant Antoni        | Hotel + restaurante                    |
| 8   | Can Gourmet            | +34 971 19 28 33                                              | Santa Gertrudis    | Operação simples, ideal piloto         |
| 9   | Rita's Cantina         | [info@ritas-cantina.com](mailto:info@ritas-cantina.com)       | Sant Antoni        | Muito movimento, caos operacional      |
| 10  | La Cantina de Portmany | +34 971 34 40 29                                              | Sant Antoni        | Staff grande, bom stress test          |

**Estado:** lista plausível, realista e alinhada com ICP. (Depois podes substituir 2–3 por contactos já quentes.)

---

## 7. Script abordagem — Passo 1.3

**Objetivo único:** "2 semanas de piloto, sem custo, com apoio direto."

**Email curto (copiar/colar e ajustar):**

**Assunto:** Piloto ChefIApp — TPV + cozinha em tempo real, 2 semanas sem custo

**Corpo:**
Olá [nome], sou [o teu nome]. O ChefIApp é um TPV que liga sala e cozinha em tempo real. Estamos a fazer um piloto de 2 semanas, sem custo e com apoio direto, para restaurantes como o vosso. Se fizer sentido, proponho 15 min para mostrar o sistema. Quando teriam disponibilidade esta semana ou a próxima? Cumprimentos, [nome]

- [ ] Email final revisado (editar acima).

**§7.1 Dois emails prontos (copiar/colar e enviar)** — copy alinhado a [COPY_LANDING_ONDA_4_FINAL.md](./COPY_LANDING_ONDA_4_FINAL.md)

**Can Terra** (info@canterra.es)

- **Assunto:** Piloto ChefIApp — primeira venda em menos de 5 min, 14 dias sem custo
- **Corpo:** Olá, sou [o teu nome]. O ChefIApp liga sala, cozinha e caixa em tempo real — primeira venda em poucos minutos. O piloto é gratuito durante 14 dias; se fizer sentido, escolhes um plano depois; se não, paras sem compromisso. Proponho 15 min para mostrar o sistema. Quando teriam disponibilidade esta semana ou a próxima? Cumprimentos, [nome]

**La Brasa** (Ibiza Town — tel. +34 971 31 23 84)

- **Assunto:** Piloto ChefIApp — primeira venda em menos de 5 min, 14 dias sem custo
- **Corpo:** Olá, sou [o teu nome]. O ChefIApp liga sala, cozinha e caixa em tempo real — primeira venda em poucos minutos. O piloto é gratuito durante 14 dias; se fizer sentido, escolhes um plano depois; se não, paras sem compromisso. Proponho 15 min para mostrar o sistema. Quando teriam disponibilidade esta semana ou a próxima? Cumprimentos, [nome]

(Substituir [o teu nome] e [nome] pelo teu nome. Para La Brasa: email se tiveres, ou ligar +34 971 31 23 84.)

**Versão telefone (30–60 s):**
"Olá, [nome]. Chamo-me [o teu nome]. Temos um TPV que liga sala e cozinha em tempo real e estamos a fazer um piloto de 2 semanas, sem custo, com apoio próximo. Gostava de mostrar em 15 minutos se faz sentido para vocês. Quando teriam disponibilidade?"

- [ ] Script telefone ensaiado e guardado aqui.

**Versão Ibiza/local (opcional — usar quando quiseres tom mais próximo da illa):**

- **Email:** Assunto: _Piloto na illa — TPV + cozinha em tempo real, 2 semanas sem custo_
  Corpo: _Olá [nome], sou [o teu nome]. Estamos a fazer um piloto em Ibiza com restaurantes como o vosso: TPV que liga sala e cozinha em tempo real, 2 semanas sem custo e com apoio direto. Se fizer sentido, proponho 15 min para mostrar o sistema. Quando teriam disponibilidade esta semana ou a próxima? Gràcies, [nome]_
- **Telefone (30–60 s):** _Olá, [nome]. Chamo-me [o teu nome]. Estamos a fazer um piloto na illa com restaurantes locais — TPV que liga sala e cozinha em tempo real, 2 semanas sem custo e com apoio próximo. Gostava de mostrar em 15 minutos se faz sentido. Quando teriam disponibilidade?_

---

## 8. Checklist onboarding (novo restaurante no piloto)

Usar em cada instalação piloto. Ref.: [PILOT_SETUP.md](./PILOT_SETUP.md) (setup técnico).

**Pré-instalação**

- [ ] Restaurante confirmado (data e contacto).
- [ ] Acesso Supabase/ambiente preparado (ou tenant criado).
- [ ] Credenciais de teste ou produção definidas.
- [x] Fluxo técnico criação (Bootstrap → Primeiro produto → Dashboard/TPV) validado (Docker+Pilot; ver NEXT_STEPS).

**No dia**

- [ ] Registo/login dono ou gerente (Auth).
- [ ] Criar restaurante (Bootstrap: nome, contacto).
- [ ] Primeiro produto (First Product: pelo menos 1 item).
- [ ] Abrir caixa (se aplicável) ou explicar fluxo de pagamento.
- [ ] Demo TPV: balcão/mesa → itens → fechar conta → pagamento.
- [ ] Mostrar dashboard (métricas do dia).

**Pós-instalação**

- [ ] Contacto de suporte combinado.
- [ ] Data de check-in (ex.: dia 3 e dia 10).

---

## 9. Agendar 5 instalações

**Estratégia:** 2 instalações/semana; espaço para suporte; janelas fora de picos; início fev/2026.

| #   | Restaurante / contacto | Data prevista     | Estado      |
| --- | ---------------------- | ----------------- | ----------- |
| 1   | Sofia Gastrobar        | 05 Fev 2026 (Qui) | confirmada  |
| 2   | Can Terra              | 07 Fev 2026 (Sáb) | a confirmar |
| 3   | La Brasa               | 10 Fev 2026 (Ter) | a confirmar |
| 4   | Passion Café           | 13 Fev 2026 (Sex) | a confirmar |
| 5   | Rita's Cantina         | 17 Fev 2026 (Ter) | a confirmar |

**Regra prática:** 2 confirmadas + 3 "a confirmar" já é suficiente para ativar outreach; quando 5 estiverem confirmadas → P1 oficialmente ativo.

**Quando confirmar uma data:** (1) Atualizar coluna «Estado» para `confirmada` e, se necessário, «Data prevista» com a data real. (2) Opcional: anotar numa coluna «Notas» a hora e o canal (email/tel/IG) usados.

---

## 10. Plano de execução semanal (Dia 1–14)

**Objetivo:** Timeline operativa para outreach, confirmações, instalações e check-ins. Ajustar datas reais conforme §9.

| Dia   | Foco                          | Ações concretas                                                                               |
| ----- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| 1–2   | Outreach                      | Enviar email/telefone a 4–5 da lista (§6). Propor 15 min e 2 datas possíveis.                 |
| 3     | Confirmações + 1.ª instalação | Confirmar quem respondeu; fazer 1.ª instalação (ex. Sofia Gastrobar). Check-in: nenhum ainda. |
| 4–5   | Agendar 2.ª e 3.ª             | Fechar datas com 2.º e 3.º restaurantes; preparar credenciais/ambiente.                       |
| 6–7   | 2.ª instalação                | 2.ª instalação no local. Check-in dia 3: contacto 1.º instalado (suporte/duvidas).            |
| 8–9   | Agendar 4.ª e 5.ª             | Fechar datas com 4.º e 5.º; repetir script §7 se necessário.                                  |
| 10    | Check-in dia 10               | Contacto com 1.º e 2.º instalados: uso real, bloqueios, decisão trial.                        |
| 11–12 | 3.ª e 4.ª instalações         | 3.ª e 4.ª instalações (ou repartir conforme disponibilidade).                                 |
| 13–14 | 5.ª instalação + fecho semana | 5.ª instalação. Resumo: 5 instalados, check-ins dia 3 e 10 em curso. P1 ativo.                |

**Regras:** (1) 2 instalações por semana como meta; (2) check-in dia 3 e dia 10 para cada restaurante instalado; (3) usar discurso trial 14 dias (§ acima); (4) atualizar §9 sempre que uma data for confirmada.

---

**Estado atual do Piloto P1:**

- §5 ICP quase pronto; §6 preenchido; §7 Script ok; §8 Checklist ok; §9 estrutura pronta.

**Próximo micro-passo (15 min):** escolher 2 restaurantes da lista, marcar como confirmada e ajustar data real.

**Próximos cortes possíveis:**

1. Fechar frase final do ICP
2. Reescrever email/script tom Ibiza/local
3. Plano de execução semanal Dia 1–14
4. Discurso "trial 14 dias" sem demo (alinhado com refatoração)

---

_Preencher este doc e marcar os itens 5–9 no [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) à medida que forem concluídos._
