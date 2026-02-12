# Relatório — Validação fluxo completo E2E

**Data:** 2026-02-03
**Objetivo:** Validar fluxo Landing → Auth → Bootstrap → Config → Menu → TPV → Pedido → KDS → Fecho, sem alterar código.
**Condição:** Core Docker em execução local; sessão de teste com novo restaurante criado via "Simular Registo (Piloto)".

---

## Resumo executivo

- **Onde o fluxo foi claro:** Landing, Auth, Bootstrap, Config (identidade/localização/horários), Menu Builder, e a narrativa do dashboard (primeira venda em poucos passos, atalhos TPV/KDS/Cardápio).
- **Onde confundiu:** TPV "Abrir Turno" redirecionou para dashboard; com Core offline, TPV mostrou "Nenhum produto disponível" e não permitiu criar pedido — não foi possível fechar o ciclo Pedido → KDS → Fecho nesta sessão.
- **Comportamento como "OS de restaurante":** Sim, na parte configurável (identidade, localização, horários, menu, mapa do sistema no dashboard). A parte operacional (TPV → pedido → KDS → fecho) depende do Core online e de turno/caixa abertos; os guards aparecem e a mensagem de caixa fechado é explícita.

---

## Passo a passo observado

### 1. Landing (/)

- **OK.** Mensagem principal visível: "Primeira venda em menos de 5 minutos. Sala, cozinha e caixa a falar a mesma língua."
- CTAs presentes: "Testar 14 dias no meu restaurante" → `/auth`, "Ver o sistema a funcionar (3 min)" → `/trial-guide`, "Já tenho acesso" → `/auth`.

### 2. Auth (/auth)

- **OK.** Botão "Simular Registo (Piloto)" clicado; redirecionamento imediato para `/bootstrap` sem erro.
- Entrada sem mensagem de erro ou bloqueio inesperado.

### 3. Bootstrap (/bootstrap)

- **OK.** Formulário "Criar o teu restaurante": nome, tipo, país/moeda.
- Nome preenchido ("Validação E2E 2026"), "Criar e continuar" clicado.
- Redirecionamento automático: primeiro "Criando o teu restaurante...", depois `/onboarding/first-product` (Passo 2 de 2 — Primeiro produto).
- **Conclusão:** O sistema deixa claro o nascimento do restaurante e o passo seguinte (primeiro produto ou config).

### 4. Configuração mínima (/config/identity, /config/location, /config/schedule)

- **OK.** Identidade: nome, tipo, país (Portugal selecionado), fuso e moeda atualizaram conforme país.
- Localização: secção aberta (Endereço, Mesas & Zonas).
- Tempo: horários visíveis (Segunda a Sábado 09:00–22:00), turnos acessíveis.
- Banner em Config: "🟢 Menu publicado e disponível para venda" (após identidade preenchida; estado de publicação já satisfeito para este tenant).
- **Dashboard:** Progresso refletido: "✓ 1. Identidade", "✓ 2. Localização", "✓ 3. Horários"; "○ 4. Cardápio", "○ 5. Abrir TPV". Texto "🟢 Menu publicado e disponível para venda" no dashboard.

### 5. Menu Builder (/menu-builder)

- **OK.** Tela "Menu Builder — Contrato Operacional", "Aplicar preset", tipo de negócio (Café/Bar, Restaurante, etc.), "Criar Novo Item", lista "Itens do Menu (4)" com itens Café €2,50, 5 min.
- Banner "Menu publicado" já observado em Config/Dashboard; não foi necessário publicar de novo nesta sessão.
- **Conclusão:** Menu existe e está publicado; criação/edição e preset estão acessíveis.

### 6. TPV (/op/tpv)

- **Parcial.** TPV carregou com:
  - Mensagem de guard: **"Caixa Fechado: Para realizar vendas reais, você precisa abrir o turno no portal."**
  - Botão **"Abrir Turno"** visível.
  - "Ligação: Ativa" (frontend conectado).
  - **"Produtos Disponíveis: Nenhum produto disponível"** — produtos não carregados (Core estava offline na sessão).
  - Carrinho vazio; texto: "Adicione produtos do carrinho para criar um pedido."
- **Ação:** Clicado "Abrir Turno". Resultado: navegação para `/dashboard` (não permaneceu no TPV nem abriu caixa no contexto observado).
- **Guards observados:**
  - **Caixa/turno:** Bloqueio explícito com mensagem clara (GuardMessages: caixa fechado / abrir turno).
  - **Produtos:** Lista vazia quando Core offline — impede adicionar item e, portanto, **o pedido não nasce** (pedido nasce ao adicionar primeiro item; sem produtos não há esse momento).
- **Conclusão:** Sem Core online, o fluxo TPV → criar pedido → enviar à cozinha não pôde ser validado. Com Core online, seria necessário: desbloquear TPV (lock screen), iniciar turno, abrir caixa, depois criar pedido (mesa/balcão) e adicionar item.

### 7. Enviar à cozinha / 8. KDS / 9. Voltar TPV (fecho)

- **Não executado** nesta sessão: sem pedido criado no TPV (Core offline, sem produtos), não houve pedido para enviar à cozinha, nem para marcar pronto no KDS, nem para servir/pagar no TPV.
- Com Core online e um pedido criado, o fluxo esperado seria: TPV → Preparar/Enviar à cozinha → KDS mostra pedido → Marcar item pronto → TPV mostra READY → Servir/Pagar → Fecho.

---

## Guards identificados

| Onde      | Guard                      | Comportamento observado                                                            |
| --------- | -------------------------- | ---------------------------------------------------------------------------------- |
| TPV       | Caixa fechado / turno      | Mensagem clara; botão "Abrir Turno"; sem caixa não há venda.                       |
| TPV       | Produtos (Core)            | "Nenhum produto disponível" quando Core offline — impede criar pedido.             |
| TPV       | Ações pay/prepare (Core)   | Não testado; documentação indica bloqueio quando Core indisponível (exceto trial). |
| Bootstrap | Nenhum bloqueio inesperado | Fluxo segue para primeiro produto/config.                                          |
| Config    | Nenhum bloqueio inesperado | Identidade, localização, horários acessíveis.                                      |

Nenhum erro silencioso foi observado; as mensagens de bloqueio (caixa/turno) são explícitas.

---

## Critérios de sucesso (checklist)

- [x] Nenhum erro silencioso observado.
- [x] Guards bloqueiam com mensagem clara onde esperado (caixa fechado no TPV).
- [ ] Pedido nasce no TPV — **não validado** (Core offline, sem produtos).
- [ ] KDS apenas executa, não cria pedidos — **não validado** (sem pedido).
- [x] Core é autoridade em estados visíveis (dashboard mostra Core offline; TPV reflete indisponibilidade de produtos).
- [x] Fluxo configurável (Landing → Auth → Bootstrap → Config → Menu) pode ser explicado em < 5 minutos; fluxo operacional (TPV → KDS → Fecho) depende de Core online e fica claro na documentação (FLOW_TPV_ORDER_KDS, GuardMessages).

---

## Recomendações

1. **Validar fluxo completo com Core online:** Subir Docker Core, garantir tenant com menu publicado e produtos no Core, depois repetir: TPV → Abrir turno → Abrir caixa → Criar pedido (mesa/balcão) → Adicionar item → Enviar à cozinha → KDS (ver pedido, marcar pronto) → TPV (servir/pagar, fechar).
2. **Comportamento de "Abrir Turno":** Confirmar se "Abrir Turno" deve abrir modal no TPV ou redirecionar; se for modal, verificar por que nesta sessão houve redirecionamento para dashboard (ex.: falha de start_turn por Core offline).
3. **Mensagens quando Core offline:** Manter "Nenhum produto disponível" e estado "Core offline" no dashboard como está — deixam claro que a operação depende do Core.

---

## Frase de fecho

O sistema comporta-se como OS de restaurante na configuração (identidade, localização, horários, menu) e na narrativa do dashboard. A parte operacional (TPV → Pedido → KDS → Fecho) está condicionada ao Core online e aos guards de caixa/turno; onde foi possível observar, os bloqueios são explícitos e alinhados com GuardMessages. A validação ponta a ponta do ciclo de pedido fica completa quando o Core estiver online e um turno/caixa forem abertos no TPV.
