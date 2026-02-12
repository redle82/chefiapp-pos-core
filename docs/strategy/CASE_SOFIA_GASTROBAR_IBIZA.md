# Caso de sucesso — Sofia Gastrobar Ibiza × ChefIApp™ OS

> Documento interno de produto/comercial. Não é press‑release; é base factual para pitch, deck e conversa com donos de restaurante/hotel.

---

## 1. Contexto do cliente

- **Nome**: Sofia Gastrobar Ibiza Sunset Lounge  
- **Localização**: Calle des Caló, 109, 07829 Sant Josep de sa Talaia, Ibiza, Espanha  
- **Tipo de operação**: gastrobar + sunset lounge à beira‑mar, com foco em:
  - serviço de sala intenso ao pôr‑do‑sol
  - mistura de pizza, saladas, hambúrgueres e comida brasileira
  - take‑away e delivery com zonas e mínimos por encomenda
- **Perfil de cliente**:
  - turistas e residentes, com forte sazonalidade (época alta vs baixa)
  - equipas rotativas e, muitas vezes, multilingues

### Ponto de partida operacional

Antes de ChefIApp™ OS, o cenário típico incluía:

- TPV usado sobretudo como **caixa/faturação**, não como cérebro operacional  
- comunicação **ad‑hoc** entre sala e cozinha (voz, papel, memória)  
- pouca visibilidade sobre:
  - tempo médio entre pedido e saída de prato
  - impacto real do delivery/ take‑away em picos de serviço
  - margem por canal (sala, bar, delivery)

Não havia “catástrofe”; havia **sangramento silencioso** — exatamente o tipo de operação que a narrativa de Money Leaks da landing descreve.

---

## 2. Problemas identificados (vazamentos)

Na leitura conjunta com o operador surgiram, em linguagem simples, três vazamentos principais:

1. **Atrasos invisíveis em picos de sunset**
   - quando a esplanada enchia, a cozinha perdia a prioridade real
   - mensagens contraditórias (“este prato já saiu?”, “esta mesa já pediu?”)

2. **Sala, cozinha e caixa sem a mesma visão**
   - o que constava no TPV não era o que a equipa sentia em tempo real
   - correções de pedido feitas “de memória” ou à caneta

3. **Delivery e take‑away sem controlo fino**
   - impacto do delivery nos picos de sala pouco claro
   - difícil responder a perguntas simples como “vale a pena esta zona a este preço?”.

Em termos da doutrina de produto, isto encaixa diretamente nos leaks já mapeados:

- tempo de espera não medido
- retrabalho de pedidos
- falta de visão consolidada por canal.

---

## 3. Solução aplicada — ChefIApp™ OS em operação real

O piloto não foi “demo de software”; foi **serviço real** com o ChefIApp™ OS ligado.

Componentes chave activados:

1. **Menu Builder**
   - estruturação de categorias e produtos alinhada ao que o staff já dizia (“o que mais sai”)
   - margens básicas e modificadores preparados para pizza, hambúrgueres e pratos de cozinha

2. **TPV operacional**
   - cada pedido lançado já nasce ligado ao menu vivo
   - sem gambiarras de “produto genérico” ou escrita manual

3. **KDS / Cozinha**
   - priorização automática por tempo e tipo de prato
   - visibilidade simples para a equipa de cozinha: o que vem a seguir, o que está atrasado

4. **Dashboard ao vivo**
   - métricas de turno (pedidos, ticket médio, tempo médio de saída)
   - visão unificada de sala + delivery/take‑away

5. **Configuração de staff e turnos**
   - mapeamento mínimo de papéis (sala, bar, cozinha)
   - foco em “quem está de turno” mais do que em complexo controlo de ponto

O objetivo não foi substituir tudo de uma vez, mas **colocar um cérebro operacional em cima da realidade que já existia**.

---

## 4. Execução da primeira venda (ligação com o playbook)

O caso seguiu o ritual de primeira venda descrito em `SIMULACAO_PRIMEIRA_VENDA.md`:

1. **Pitch curto (sistema operacional)**  
   Em vez de vender “mais um TPV”, a conversa foi sobre ligar sala, cozinha e caixa em tempo real, especialmente em época alta.

2. **Demonstração executável**  
   - criar ou usar um produto real do cardápio
   - lançar um pedido no TPV
   - ver o pedido aparecer na cozinha (KDS)
   - acompanhar a saída no dashboard de turno

3. **Piloto sem risco**  
   - focado em serviço real, não em slide
   - sem compromisso para além do período acordado

Este fluxo é importante porque mostra que o case não dependeu de “cliente especial”: ele segue o mesmo ritual que queremos repetir noutros restaurantes/hotéis.

---

## 5. Resultados observados (qualitativos e métricas de referência)

### 5.1. Sinais qualitativos

Relatos recolhidos (traduções livres, não para uso em marketing literal):

- “A cozinha deixou de gritar o tempo todo quando enche.”  
- “Fica mais fácil explicar à equipa nova o que está a acontecer.”  
- “Consigo ver no fim da noite o que mais pesou: sala ou delivery.”

Ou seja, houve **redução de fricção humana** e aumento de confiança na informação.

### 5.2. Métricas de referência

Sem publicar números sensíveis, o padrão observado foi:

- **redução do tempo médio entre pedido e saída** em picos de sunset  
- **menos correções manuais de pedido** (erros de item ou de mesa)  
- **melhor visão de mix sala vs delivery**, com impacto direto na decisão sobre zonas e mínimos de entrega.

Para uso interno, estes indicadores podem ser ligados à observabilidade mínima:

- logs de criação de pedidos por canal  
- tempo entre `create_order` e marcação de `ready/out` na cozinha  
- comparação de ticket médio e volume por canal/turno.

---

## 6. Como usar este caso na venda

### 6.1. Em conversa com outros restaurantes

Ângulo de narrativa:

- “Em Ibiza, numa casa com forte pico de sunset, o ChefIApp™ OS foi usado para reduzir atrasos e dar visibilidade real ao dono — sem trocar de TPV fiscal de um dia para o outro.”

Pontos a sublinhar:

1. **Contexto real** (pico, sazonalidade, equipa rotativa)  
2. **Problema concreto** (atrasos, falta de visão de canais)  
3. **Solução operacional** (menu, TPV, KDS, dashboard)  
4. **Resultados** (menos ruído, mais controlo, base de decisão).

### 6.2. Em hotelaria e grupos

Tradução direta para hotel:

- sunset lounge, bar de piscina, rooftop ou lobby bar vivem dinâmica muito semelhante  
- o mesmo cérebro operacional pode ligar:
  - restaurante principal
  - bar
  - room service

Frase de ponte:

> “O que usamos num gastrobar em Ibiza para controlar o pico de sunset é o mesmo tipo de sistema que pode ligar bar, restaurante e room service num hotel.”

---

## 7. Próximos passos sobre este case

- **Consolidar números internos**  
  - guardar snapshots de métricas antes/depois (interno, não para publicação imediata)
  - alinhar quais indicadores podem ser usados externamente (intervalos, não valores exatos)

- **Versão visual**  
  - criar 1 slide ou 1 página visual com:
    - contexto (foto do local, mapa simples)
    - 3 bullets de problema
    - 3 bullets de solução
    - 3 bullets de resultado
  - encaixar na narrativa da landing e do deck principal.

- **Reutilização na landing / pitch**  
  - usar o nome “Sofia Gastrobar Ibiza” de forma discreta e respeitosa
  - manter este documento como fonte de verdade para qualquer texto futuro sobre o case.

