# CONFIG_RUNTIME_CONTRACT — Web de Configuração como Cérebro do Sistema

**Objetivo:** Definir o contrato vivo entre a Web de Configuração e os apps operacionais (TPV, Staff, KDS). A pergunta central não é "esta tela existe?", mas **"esta configuração governa o sistema inteiro?"**.

**Referências:** [CONFIG_WEB_UX.md](CONFIG_WEB_UX.md) (estrutura da config), [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md) (dispositivos), [MENU_BUILDING_CONTRACT_v1.md](MENU_BUILDING_CONTRACT_v1.md) (cardápio).

---

## 1. Princípio

- **Web de Configuração** = fonte de verdade para: produtos, localizações, dispositivos, impressoras, pessoas, turnos, pagamentos, publicação.
- **TPV, Staff App, KDS** = consumidores. Não configuram; só consomem e executam.
- **Regra:** Se desligar aqui → morre lá. O runtime obedece à config.

---

## 2. O que cada secção da Config governa e quem consome

### 2.1 Produtos (Cardápio / Menu Builder)

| O que governa                                                             | Onde está                                                                           | Quem consome                                                    | O que acontece ao mudar                                                                                                                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Produtos ativos/inativos, categorias, preços, impostos, tempos de preparo | Config: `/menu-builder` → **gm_products** (e categorias/menu items conforme schema) | TPV, Staff App (MiniTPV, listagens), KDS (se consumir cardápio) | Produto desativado (`available=false`) não deve aparecer no TPV nem no Staff. Categorias e preços refletidos de imediato (ou após refresh conforme implementação). |

**Fonte única:** Config Web (Menu Builder) escreve em gm_products; TPV e Staff **não** editam produto, só leem (`restaurant_id=eq.X&available=eq.true`). Na **criação de pedido**, o OrderWriter valida que cada product_id existe, pertence ao restaurant_id e está `available=true`; caso contrário, rejeita com erro controlado (Config governa leitura e escrita).

**Resultado esperado:** O TPV é um "player" de configuração, não um editor. Pedido não pode ser criado com produto desativado.

---

### 2.2 Dispositivos → Execução

| O que governa                                                                                                                                                                  | Onde está                                                                                                                                                                                                                                                | Quem consome                                                                                                        | O que acontece ao mudar                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quais dispositivos existem; tipo (`device_type`: TPV \| STAFF \| KDS); a que local pertencem (`location_id`, contrato alvo); estado de ativação (`status`: active \| disabled) | Config: `/app/install`; tabelas **gm_equipment**, **gm_terminals**; identidade local em **installedDeviceStorage** (`InstalledDevice` em `installedDeviceStorage.ts`). Contrato alvo: se for introduzido `gm_devices` ou equivalente, fica como destino. | TPV (páginas em `merchant-portal/src/pages/TPV`), Staff App (contextos em AppStaff), KDS (`KDSMinimal`, se existir) | `status = disabled` → app não inicia / entra em ecrã de bloqueio. Alterar `location_id` → dispositivo passa a operar apenas sobre dados dessa localização (contrato alvo). |

**Fonte única:** Web de Configuração (install + gestão de dispositivos) define quais dispositivos podem executar módulos operacionais. Apps (TPV/Staff/KDS) **não se auto-autorizam**; apenas validam contra o contrato de instalação.

**Contrato mínimo (fase atual):**

- App só executa se existir `InstalledDevice` compatível com o `restaurant_id` em runtime.
- Device Gate cruza identidade local (`device_id`) com fonte canónica (`gm_equipment`). Apenas dispositivos com `is_active=true` podem operar.
- Se não houver dispositivo instalado, não houver correspondência na Config ou dispositivo estiver desativado → bloquear execução com mensagem clara (`DeviceBlockedScreen`).

**Contrato alvo (fase seguinte):**

- `device_type` deve corresponder ao módulo em execução (ex.: TPV só com module_id=tpv).
- Dispositivo passa `location_id` ao runtime; app só lê/mostra dados da localização do dispositivo quando isolamento por localização estiver ativo.

**Resultado esperado:** Instalar TPV não é “abrir app”; é executar sob um dispositivo autorizado. Se desligar na Config → morre no runtime.

**Device Gate obrigatório (1000-ready):** Em produção, quando `TERMINAL_INSTALLATION_TRACK` está ativo, TPV e KDS **não** entram sem passar no Device Gate (`useDeviceGate`). Bloqueio remoto: desativar equipamento na Config (`gm_equipment.is_active = false`) faz o Device Gate negar (DEVICE_DISABLED) e o ecrã de bloqueio (`DeviceBlockedScreen`) é mostrado. Bypass permitido apenas para desenvolvimento: `DEBUG_DIRECT_FLOW` ou trilho desligado (`TERMINAL_INSTALLATION_TRACK = false`).

---

### 2.2 Ubicaciones / Localização → Dispositivos e contexto

| O que governa                                                                              | Onde está                                                                                                                              | Quem consome                                                                                        | O que acontece ao mudar                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Locais operacionais (nome, morada, mesas, zonas); qual local está ativo para o dispositivo | Config: `/config/ubicaciones`, `/config/location`; dados em locations (store/schema) e, quando existir, **location_id** no dispositivo | Staff App (sessão com local ativo; mesas/pedidos por local), TPV/KDS (quando vinculados a um local) | Dispositivo só vê mesas, impressoras e pedidos da sua localização. Alterar ou desativar local afeta apenas esse local. |

**Contrato alvo:** Cada dispositivo nasce com `location_id` e `device_type` (TPV | KDS | Staff). Instalar TPV não é "abrir app" — é **vincular a um local**. (Estado atual: dispositivo tem `restaurant_id` e `module_id`; `location_id` pode ser evolução explícita.)

**Resultado esperado:** TPV só vê mesas da sua localização; Staff escolhe local na sessão; KDS só recebe pedidos do seu local.

---

### 2.3 Gestão de dispositivos (Instalar TPV/KDS) → Runtime real

| O que governa                                                                                            | Onde está                                                                                                  | Quem consome                             | O que acontece ao mudar                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quais dispositivos existem; estado ativo/inativo; vinculação a restaurante (e a local, quando aplicável) | Config: `/app/install`; **gm_equipment**, **gm_terminals** (heartbeat), **installedDeviceStorage** (local) | TPV, KDS, Dashboard (lista de terminais) | Dispositivo desativado ou não instalado → app não deve operar (ou mostra "Não instalado" / bloqueio). Plano limita número de dispositivos quando aplicável. |

**Fontes:** [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md) — ritual em `/app/install`; gm_equipment (lista); gm_terminals (heartbeat); getInstalledDevice() para identidade local.

**Resultado esperado:** Staff App / TPV só funcionam se dispositivo estiver ativo e associado ao restaurante (e, no contrato alvo, a uma localização). Se desligar aqui → morre lá.

---

### 2.4 Impressoras → Pedidos reais

| O que governa                                                          | Onde está                                                                                   | Quem consome                                                                             | O que acontece ao mudar                                                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Impressoras e rotas de impressão (por categoria, tipo de pedido, etc.) | Config: impressoras e rotas (ex.: store **impresoras**, **PrintRoute**: printerId, trigger) | Fluxo de pedido (TPV/KDS/backend): ao criar ou atualizar pedido, resolve rota via config | Impressora configurada aqui recebe apenas os pedidos que a rota definir. Nenhuma lógica hardcoded no TPV para "onde imprimir". |

**Resultado esperado:** Impressão é consequência da configuração, não do código.

---

### 2.5 Pessoas / Staff → App Staff

| O que governa                                       | Onde está                                                | Quem consome                       | O que acontece ao mudar                                                                        |
| --------------------------------------------------- | -------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Funcionários, papéis, turnos; quem pode fazer o quê | Config: `/config/people` (funcionários, papéis, escalas) | Staff App (papel, turno, fichagem) | Papéis e turnos configurados aqui aparecem no Staff. Fichagem e permissões respondem à config. |

**Resultado esperado:** Staff App não decide nada; só executa dentro do que está configurado.

---

### 2.6 Outras secções (resumo)

- **Pagamentos:** Métodos ativos na config → TPV só oferece esses métodos.
- **Horários / Tempo:** Serviços e horários → afetam disponibilidade, turnos e eventualmente visibilidade de produtos por período.
- **Publicação / Estado:** Restaurante publicado ou não → TPV/KDS/Staff podem verificar readiness antes de operar (conforme contratos de bootstrap/readiness).

---

## 3. Checklist de validação CONFIG → RUNTIME

Usar este checklist para validar que a config governa o runtime. Marcar com [ ] até estar verificado; depois [x].

### Produtos

- [x] Produto desativado na config não aparece no TPV. _(Verificado: TPVMinimal, TPV full via useDynamicMenu, RestaurantReader.readProducts, DynamicMenuService.getDynamicMenu/getStaticMenu e MiniTPVMinimal usam `restaurant_id=eq.X` e `available=eq.true`; ritual manual em secção 7.)_
- [x] Produto ativado na config aparece no Staff App (onde aplicável). _(Mesmo filtro em MiniTPVMinimal.)_
- [x] Pedido não pode ser criado com produto desativado. _(OrderWriter valida existência, restaurant_id e available=eq.true antes de create_order_atomic.)_
- [ ] Categorias e preços no TPV refletem a config (gm_products / menu).

### Localização / Ubicaciones

- [ ] TPV só vê mesas da sua localização (quando location_id estiver em uso).
- [ ] Staff App usa lista de locais da config e limita ações ao local ativo.

### Dispositivos

- [ ] Dispositivo ativo inicia TPV (Device Gate permite).
- [ ] Dispositivo inativo ou inexistente bloqueia TPV com mensagem clara.
- [ ] Dispositivo passa `location_id` para o runtime (contrato alvo).
- [ ] App só lê/mostra dados da localização do dispositivo (quando isolamento por localização estiver ativo).

### Impressoras

- [ ] Impressora configurada na config recebe apenas os pedidos definidos pela rota (categoria/tipo).
- [ ] Nenhuma decisão de "onde imprimir" hardcoded no TPV.

### Pessoas / Turnos

- [ ] Papéis configurados na config existem e são respeitados no Staff App.
- [ ] Turnos configurados aparecem e a fichagem responde à config.

---

## 4. O que este contrato NÃO cobre

- **Auth:** Não define login, sessão nem RLS; isso fica noutros contratos.
- **RLS:** Não altera políticas de linha; apenas afirma que a config é a fonte de verdade para dados que o runtime consome.
- **UI:** Não redesenha telas nem refatora a sidebar da config; isso está em CONFIG_WEB_UX.

---

## 5. Ficheiros e pontos de consumo relevantes

| Domínio      | Config (fonte)                                                                            | Runtime (consumo)                                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produtos     | Menu Builder → gm_products                                                                | TPVMinimal, MiniTPVMinimal, RestaurantReader.readProducts, DynamicMenuService (leitura: available=eq.true); OrderWriter.createOrder (escrita: valida available=eq.true antes de create_order_atomic) |
| Dispositivos | `/app/install`, gm_equipment, gm_terminals, **installedDeviceStorage** (identidade local) | **installedDeviceStorage.ts** (identidade local), **useTerminals.ts** (lista gm_equipment + heartbeats), **TPV.tsx** e wrapper operacional do TPV (Device Gate), futuros gates em Staff/KDS          |
| Localização  | Ubicaciones, Config Location, locations store                                             | StaffContext (getActiveLocations, staff_location_id), ShoppingListMinimal (location_id)                                                                                                              |
| Impressoras  | impresoras store, PrintRoute                                                              | catalogApi (printerId), FiscalPrinter; rotas a ligar ao fluxo de pedido                                                                                                                              |
| Pessoas      | Config People, RestaurantPeopleSection                                                    | Staff App (papel, turno, contratos de sessão)                                                                                                                                                        |

---

## 6. Próximos passos sugeridos

1. **Validar um eixo por vez:** Por exemplo Produtos → TPV (produto desativado não aparece); depois Dispositivos → runtime; depois Impressoras → pedidos.
2. **Preencher o checklist** à medida que cada item for verificado no código ou em teste.
3. **Evoluir o contrato** quando location_id em dispositivos ou rotas de impressão no fluxo de pedido forem implementados ou alterados.

---

## 7. Ritual manual — Produtos → TPV (validação imediata)

Para validar que a Config governa o cardápio no TPV e no Staff:

1. Ir a **Config → Cardápio** (Menu Builder) e **desativar** um produto (available=false).
2. Abrir o **TPV** (e, se aplicável, Staff com MiniTPV) e fazer **refresh** (F5 ou recarregar).
3. **Verificar:** o produto desativado **não aparece** na lista de produtos.
4. Voltar a **Config → Cardápio**, **reativar** o produto e fazer refresh no TPV: o produto **volta a aparecer**.

Se o produto não sumir no passo 3, o contrato está quebrado (verificar que todos os consumidores usam `available=eq.true` e `restaurant_id=eq.X`).

---

Última atualização: Contrato Config Runtime; Web de Configuração como cérebro do sistema; TPV, Staff, KDS como consumidores. Checklist Produtos (desativado/ativado) verificado; ritual manual secção 7.
