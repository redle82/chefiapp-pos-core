# Modelo de Dispositivos e Terminais

## Visão geral

- **Admin Web (merchant-portal)**: camada de gestão acessível pelo navegador.
- **Apps operacionais**: TPV, KDS e AppStaff funcionam sempre como aplicações instaladas (Electron/desktop ou mobile), nunca como páginas web abertas diretamente no browser.
- **Terminais (gm_terminals)**: representam cada dispositivo físico ou instância de app ligada a um restaurante.

## Papéis

- **Admin Web**:
  - Configuração de restaurante, catálogo, reservas, relatórios.
  - Gestão de dispositivos e terminais (inventário e provisionamento).
- **ChefApp TPV (desktop)**:
  - Execução de vendas, caixa, mesas e integrações fiscais.
  - Integração com impressoras, gaveta de dinheiro, rede local e modo offline.
- **ChefApp KDS (desktop)**:
  - Tela de cozinha/bar ligada ao TPV, mostra tickets e estado de preparo.
- **ChefApp Staff (mobile/desktop)**:
  - Turnos, tarefas, fichagem e operação de sala/equipas.

## Fluxos de provisionamento

### 1. Provisionamento genérico (Admin → Dispositivos)

- Rota: `/admin/devices`.
- Responsabilidades:
  - Gerar QR de instalação (token de curta duração em `gm_device_install_tokens`).
  - Listar todos os terminais registados (`gm_terminals`) com tipo, estado e última atividade.
  - Comunicar claramente que TPV, KDS e AppStaff funcionam como **apps instaladas**.

### 2. Gestão de TPVs do restaurante

- Rota: `/admin/devices/tpv`.
- Origem principal de navegação:
  - Módulo **Software TPV** no Hub de Módulos com CTA **“Gerir dispositivos”** que aponta para `/admin/devices/tpv`.
- Responsabilidades:
  - Mostrar lista de TPVs registados (tipo = `TPV` em `gm_terminals`).
  - Permitir criar um novo terminal TPV:
    - Gerar código curto de emparelhamento (`create_device_pairing_code`).
    - Exibir instruções: abrir o app TPV no desktop e introduzir o código.
  - Não abrir o TPV no browser; apenas preparar o terminal.

### 3. KDS ligado ao TPV

- Princípios:
  - KDS **não** nasce como módulo independente na Admin.
  - KDS é configurado a partir do contexto do TPV (no próprio app TPV).
- Fluxo recomendado:
  - Dentro do app TPV:
    - Ir a **Configurações → KDS / Displays**.
    - Criar “KDS Cozinha”, “KDS Bar” e gerar códigos de vinculação para cada tela.
  - O Admin pode, no futuro, apenas listar estes displays na tabela de dispositivos (tipo = `KDS`), mas a criação e uso são sempre feitos a partir do TPV.

### 4. AppStaff e dispositivos de equipa

- Módulo **AppStaff**:
  - Tratado como app operacional instalável, não como página web.
  - CTA no Hub de Módulos: **“Gerir dispositivos”** → leva o utilizador à página de Dispositivos, filtrando ou enfatizando terminais do tipo `APPSTAFF`.
- Fluxo recomendado:
  - Admin gera QR/código para AppStaff.
  - Funcionário instala o app móvel e faz scan do QR para se ligar ao restaurante.

## Regras arquiteturais

1. **TPV, KDS e AppStaff nunca “abrem” no navegador** a partir da Admin.
   - Os CTAs apontam para:
     - Gestão de terminais (ex.: `/admin/devices/tpv`).
     - Download/instalação das apps dedicadas.
2. **A página de Dispositivos é centro de provisionamento e inventário**, não um launcher de apps.
   - Provisionar = gerar QR/código + ver dispositivos registados.
   - Apps operacionais são abertas apenas nos seus próprios clientes instalados.
3. **KDS é extensão do TPV**, não módulo solto:
   - Criação/ativação de KDS nasce do app TPV.
4. **Terminais são a unidade técnica de ligação**:
   - Cada app instalada que fala com o Core é representada por uma linha em `gm_terminals`.
   - Provisionamento sempre passa por `gm_device_install_tokens` / códigos de emparelhamento.

## Navegação canónica

- **Módulos → Software TPV → Gerir dispositivos** → `/admin/devices/tpv`.
- **Módulos → AppStaff → Gerir dispositivos** → `/admin/devices`.
- **Menu lateral → Governar → Dispositivos** → `/admin/devices`.

