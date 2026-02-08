# Configuração > Geral — Wireframe textual (v1)

**Referência:** análise Last.app Configuración → General. Contrato: [CONFIGURATION_MAP_V1.md](./CONFIGURATION_MAP_V1.md) secção 2.1.

**Regra de ouro:** Se algo muda várias vezes por dia, NÃO é Configuração. Se algo define “quem somos”, É Configuração. Esta tela não é para decidir nada; é para declarar verdades estáveis do negócio.

**Separação identidade / operação / contrato:** ver [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md).

---

## 1. Função real da tela

- **Pergunta que a tela responde:** “Como este restaurante existe no mundo?”
- **Não inclui:** métricas, gráficos, operações, decisões, estado do sistema, alertas, botões perigosos.
- **Só:** identidade operacional básica.

---

## 2. Estrutura visual

- **Layout:** 2 colunas de cards (grid responsivo; em mobile pode empilhar).
- **Cada card:** tema fechado, independente; nenhum card depende do outro; o utilizador pode ler em qualquer ordem.
- **Salvar:** local por card. Um botão “Guardar” por card; não há “Guardar tudo” global. Reduz medo de “quebrar algo”.
- **Sidebar:** só mapa (Configuración > General). Não compete com o centro; não colapsa, não pisca.

---

## 3. Blocos (cards) — nomes finais e campos

### Card 1 — Identidade do Restaurante

**O que comunica:** “Quem somos e onde nos encontrar.”

| Campo            | Tipo        | Obrigatório | Notas |
|------------------|-------------|-------------|--------|
| Nome comercial   | Texto       | Sim         | Nome público do restaurante. |
| Tipo             | Select      | Sim         | Restaurante, Bar, Hotel, Beach club, Café, Outro. |
| País             | Select      | Sim         | Fonte de presets (fuso, moeda, idioma) mas não bloqueia edição nos outros cards. |
| Telefone         | Tel + país  | Não         | “Se algo der errado, é aqui que falamos contigo.” |
| Email            | Email       | Não         | Contacto principal. |
| Endereço         | Texto       | Não         | Linha 1 (rua, número). |
| Cidade           | Texto       | Não         | |
| Código postal    | Texto       | Não         | |
| Estado/região     | Texto       | Não         | Opcional. |

**Entra aqui (migração):** nome, tipo, país hoje em `IdentitySection`; endereço, cidade, postal_code, state hoje em `LocationSection`. Telefone e email: adicionar se ainda não existirem no modelo.

**Sai daqui (não fica em Geral):** capacidade, zonas, mesas → ficam em **Ubicaciones** (Configuración > Ubicaciones). Fuso horário, moeda, idioma → Card 2.

**Botão:** “Guardar” só para este card.

---

### Card 2 — Idioma & Localização (operacional)

**O que comunica:** “Em que idioma e contexto de tempo/moeda opera o TPV nesta localização.”

| Campo            | Tipo        | Obrigatório | Notas |
|------------------|-------------|-------------|--------|
| Idioma do TPV    | Select      | Sim         | Idioma das pantallas do TPV **nesta localização**. Não é o idioma do admin. |
| Fuso horário     | Select      | Sim         | Ex.: Europe/Madrid, America/Sao_Paulo. |
| Moeda            | Select      | Sim         | EUR, BRL, USD, etc. |

**Entra aqui:** `locale`, `timezone`, `currency` hoje em `IdentitySection`. País pode sugerir presets mas o utilizador pode sobrescrever.

**Regra:** Escopo claro: “nesta localização”. Evita o bug mental “mudei o idioma e tudo quebrou”.

**Botão:** “Guardar” só para este card.

---

### Card 3 — Texto fiscal / recibo

**O que comunica:** “Texto opcional que aparece nos recibos (detalhes fiscais, agradecimento, política de devoluções).”

| Campo                  | Tipo        | Obrigatório | Notas |
|------------------------|-------------|-------------|--------|
| Informação adicional   | Textarea    | Não         | Livre. O dono sabe o que quer escrever. |

**Entra aqui:** novo. Não misturar com faturação nem com identidade. É um “escape hatch” elegante.

**Futuro (opcional):** preview simples do recibo com esse texto.

**Botão:** “Guardar” só para este card.

---

### Card 4 — Integrações básicas

**O que comunica:** “Ligações opcionais a serviços externos; benefício claro, sem pressão.”

| Campo            | Tipo        | Obrigatório | Notas |
|------------------|-------------|-------------|--------|
| Google Place     | Busca/input | Não         | “Adiciona o Google Place ID do teu restaurante para habilitar Google Reviews e mais.” Busca por nome ou morada; guardar Place ID. Claramente opcional. |

**Futuro:** WhatsApp, Instagram (quando houver contrato de produto).

**Botão:** “Guardar” só para este card.

---

## 4. O que entra / o que sai (resumo)

| Onde está hoje              | Para onde vai (Geral v1)        | Notas |
|-----------------------------|---------------------------------|--------|
| IdentitySection: name, type, country | Card 1 (Identidade)           | |
| IdentitySection: timezone, currency, locale | Card 2 (Idioma & Localização) | |
| LocationSection: address, city, postal_code, state | Card 1 (Identidade)           | Endereço como “onde estamos”. |
| LocationSection: capacity, zones     | **Não** em Geral → Ubicaciones | Mesas, capacidade, zonas ficam em Configuración > Ubicaciones. |
| —                            | Card 3 (Texto fiscal/recibo)   | Novo. |
| —                            | Card 4 (Google Place)          | Novo. |

---

## 5. O que NÃO está nesta tela

- KPIs, métricas, gráficos.
- Estado do sistema, alertas, “Requer atenção”.
- Ações críticas ou botões perigosos.
- Operação (turnos, TPV, fila).
- Decisões em tempo real.

Configuração ≠ Operação ≠ Dashboard.

---

## 6. Próximo passo (implementação)

1. **Antes de codar:** validar este wireframe com produto (nomes dos cards e campos finais).
2. **Implementação:**  
   - GeneralConfigPage: layout em 2 colunas; 4 cards; cada card com estado próprio e um “Guardar” local.  
   - Reutilizar ou extrair blocos de `IdentitySection` / `LocationSection` por card (sem misturar identidade com estado operacional na mesma secção).  
   - Ubicaciones continua com endereço de **mesas** (plano de mesas, horários, QR), ou mantém só plano de mesas/horários se o endereço “fiscal/contacto” ficar todo no Card 1.

Documento vivo; alterações por decisão de produto.
