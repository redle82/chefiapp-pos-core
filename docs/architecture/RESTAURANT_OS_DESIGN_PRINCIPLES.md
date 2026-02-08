# Restaurant OS Design Principles (2026)

**Propósito:** Princípios obrigatórios do Design System ChefIApp para ambientes de restaurante — ergonomia cognitiva, expectativas do setor e operação sob stress. Subordinado a [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md).

**Lei:** O Design System é um contrato visual e interacional. Estes princípios **estendem** o contrato com regras específicas do domínio Restaurant OS. Core decide. Contratos autorizam. Design System revela.

---

## 1. Design DNA do setor (por que isto importa)

Garçons, cozinheiros, gerentes e donos já vêm com expectativas pré-instaladas de décadas de uso de POS físicos, sistemas de cozinha, caixas registradoras, dashboards industriais e software de hotelaria. Quem ignora esse "design system invisível" perde adoção, gera erro humano e parece amador — mesmo com motor bom.

Chamamos a isso **Restaurant OS Design DNA**. Os princípios abaixo materializam esse DNA em tokens e regras aplicáveis.

---

## 2. Obrigatórios em 2026 (ergonomia cognitiva)

### 2.1 Dark mode por defeito

Não é estética. É fisiologia.

| Motivo | Razão |
|--------|--------|
| Turnos longos | Reduz fadiga ocular |
| Ambientes escuros | Bar, discoteca, cozinha — menos reflexo |
| Foco | Fundo escuro + texto claro = mais concentração |

**Regra:** Fundo escuro, texto claro, cores saturadas **apenas** para estados importantes (warning, critical, success). Light mode = exceção, nunca default.

---

### 2.2 Sistema universal de estados (sem legenda)

O utilizador não pode ter que pensar. Estados devem ser instintivos e **idênticos** em todos os terminais.

| Estado | Cor / Significado | Uso |
|--------|-------------------|-----|
| Normal | Neutro | Tudo ok |
| Atenção | Amarelo | Algo está a atrasar |
| Crítico | Vermelho | Ação imediata |
| Sucesso | Verde | Concluído |
| Offline | Cinza/azul | Sem conexão |
| Bloqueado | Cinza escuro | Não permitido |

Aplicar em: AppStaff, KDS, TPV, Web, Alertas, Tarefas, Billing. **Sem variação criativa.**

---

### 2.3 Tempo sempre visível quando importa

Em restaurante, tempo é a moeda principal.

O Design System **obriga** a:

- Mostrar tempo decorrido
- Mostrar SLA restante
- Mostrar atraso claramente
- Usar contadores visuais (não só números)

Exemplos: *Pedido: 12:34 desde criado* | *Tarefa: –3 min atrasada* | *Turno: 2h 17m*.

**Regra:** Tempo escondido = sistema burro. Componentes time-first (elapsed, SLA, delay) são parte do DS.

---

### 2.4 Tudo é "tapável", nada é decorativo

Garçom não lê, reage.

| Regra | Valor |
|-------|--------|
| Cards clicáveis | Parecem clicáveis (bordas/sombras claras) |
| Área mínima de toque | 44–48 px |
| Nada pequeno ou delicado | Legibilidade e precisão com dedo/pressa |
| Texto vs ação | Se parece texto → não pode ser ação. Se é ação → tem que parecer ação. |

---

### 2.5 Hierarquia de informação brutal

O olho tem que saber em **1 segundo**:

1. O que é mais importante  
2. O que vem depois  
3. O que pode esperar  

O DS impõe: **um estado dominante**, **um foco por tela**, **zero competição visual**.

Por terminal:

- **KDS** → atraso domina  
- **TPV** → total domina  
- **AppStaff** → próxima tarefa domina  
- **Web** → estado do sistema domina  

---

### 2.6 Silêncio visual é feature

Restaurante já é barulho. O DS **evita**:

- Animações inúteis  
- Popups constantes  
- Notificações repetidas  
- Mostrar erro de forma repetida (mostrar uma vez, não gritar)  

**Regra:** *Se tudo é urgente, nada é urgente.* Motion: mínimo; apenas feedback essencial.

---

### 2.7 Componentes previsíveis

Usuários esperam: Lista = lista, Card = card, Botão primário = ação principal, Botão secundário = opção segura, Modal = decisão importante.

Inventar padrão aqui quebra confiança. Sem criatividade na escolha de padrões de componentes.

---

### 2.8 Grid estável, sem surpresas

Layout que "dança" mata produtividade.

Obrigatório: colunas fixas, alturas previsíveis, listas que não pulam, sem reflow agressivo.

---

### 2.9 Pensado para dedo sujo, pressa e stress

O DS assume:

- Toque impreciso  
- Pressa  
- Mão molhada  
- Luz ruim  
- Stress  

Implicações: espaçamento maior, confirmações claras, undo quando possível, feedback imediato. Tipografia e contraste para leitura à distância (KDS, TPV).

---

## 3. Por que isto corresponde aos modelos mentais do garçom

- **Expectativas do setor:** POS, KDS e caixas já estabeleceram fundo escuro, estados por cor e foco em tempo. Alinhar a isso reduz carga cognitiva.  
- **Reação > leitura:** Botões grandes e estados por cor permitem decisão rápida sem ler texto.  
- **Um foco por tela:** Garçom e cozinha precisam de uma única prioridade visível; hierarquia brutal reflete isso.  
- **Silêncio:** Menos alertas = mais credibilidade quando algo é realmente crítico.  
- **Toque e ambiente:** Alvos grandes e contraste alto compensam pressa, luz variável e mãos ocupadas.

Competidores do setor (Toast, Lightspeed, Square, LastApp e afins) convergem para os mesmos princípios em ambientes operacionais: dark-first em cozinha/TPV, estados por cor, tempo visível, alvos grandes. Referência apenas ao nível de princípio — não à cópia de UI. O Restaurant OS Design Principles explicita e unifica isso no ChefIApp.

---

## 4. Nível seguinte (2026+): diferenciais

Estes não são obrigatórios mínimos; são evolução possível do DS:

- **Design orientado a pressão:** UI adapta-se à pressão operacional (mais contraste quando atraso cresce, menos informação quando stress sobe, foco automático no crítico).  
- **Design consciente de papel:** Mesma tela, ênfase diferente por papel (garçom → execução; gerente → fluxo; dono → saúde). Não é feature nova, é ênfase visual.  
- **Design como sensor:** Se uma tela foge do DS (cores/espaçamentos próprios), pode indicar endpoint escondido, fluxo não contratado ou violação de arquitetura. O DS vira ferramenta de auditoria.

---

## 5. Referências

- [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) — Contrato formal do DS.  
- [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) — Shell, painéis, contexto.  
- Pacote **core-design-system** — Tokens (cores, estados, tipografia, spacing, motion, tap targets).
