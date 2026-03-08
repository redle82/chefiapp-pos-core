# AppStaff — Product Overview

> Documento canónico de referência sobre o que é o AppStaff, o seu papel no ecossistema ChefIApp e a sua arquitectura técnica.

**Última actualização:** 2026-03-06

---

## Em uma frase

O AppStaff é a app móvel operacional da ChefIApp para staff de restaurante — pensada para equipa de sala/operação — separada do admin web e do TPV desktop, e voltada para tarefas como acompanhamento operacional, alertas, turnos, acção rápida em contexto e consumo de dados do restaurante em mobilidade.

---

## Stack técnica

| Tecnologia              | Papel                                            |
| ----------------------- | ------------------------------------------------ |
| React Native 0.81       | Runtime mobile nativo                            |
| Expo                    | Build system, módulos nativos, OTA updates       |
| Expo Router             | Navegação file-based                             |
| TypeScript              | Tipagem estática                                 |
| React 19                | UI framework                                     |
| Sentry React Native     | Observabilidade mobile (crashes, erros, sessões) |
| AsyncStorage            | Persistência local                               |
| Expo SecureStore        | Armazenamento seguro (tokens, credenciais)       |
| Expo Notifications      | Push notifications                               |
| Expo Network            | Detecção de conectividade                        |
| React Navigation        | Navegação complementar                           |
| react-native-reanimated | Animações                                        |
| react-native-svg        | Gráficos vectoriais                              |
| react-native-webview    | Bridge para conteúdo web                         |
| expo-linear-gradient    | Gradientes nativos                               |

**Posicionamento:** Mobile-first, Expo/React Native, preparado para iOS/Android e com suporte web para desenvolvimento/fallback (`expo start --web`).

---

## Estrutura do ecossistema

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Admin Web          │  │  TPV/KDS Desktop     │  │   AppStaff Mobile    │
│   (merchant-portal)  │  │  (desktop-app)       │  │   (mobile-app)       │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ • Configuração       │  │ • Operação crítica   │  │ • Mobilidade equipa  │
│ • Catálogo / Menu    │  │ • Checkout / Terminal │  │ • Alertas / Tarefas  │
│ • Dashboards         │  │ • Ecrãs de cozinha   │  │ • Turnos / Shifts    │
│ • Gestão negócio     │  │ • Runtime device-only│  │ • Visão operacional  │
│ • Gestão dispositivos│  │                      │  │ • Acções rápidas     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                    ↓              ↓                        ↓
              ┌──────────────────────────────────────────────────┐
              │                    Core / API                     │
              └──────────────────────────────────────────────────┘
```

O AppStaff **não** é "uma página do admin". É uma superfície própria, separada da web administrativa.

---

## Arquitectura funcional

### 1. Camada de app mobile

- Navegação (Expo Router)
- Autenticação / contexto local
- Estado do utilizador / staff
- Telas operacionais
- Notificações e persistência

### 2. Camada de consumo de dados

- Ler estado do restaurante
- Consumir menu / produtos / categorias
- Mostrar tarefas / alertas / turnos
- Reflectir mudanças operacionais

### 3. Camada operacional

- Acções rápidas
- Leitura de contexto
- Microfluxos do staff
- Potencial ligação com TPV/KDS e operação em curso

---

## O que o AppStaff é

Uma **camada de mobilidade operacional** para a equipa do restaurante:

- Visão do estado operacional no bolso
- Alertas distribuídos
- Tarefas e checklists
- Turnos / shifts com check-in/out
- Acesso ao menu e contexto do restaurante
- Acções rápidas em operação
- Futuras captações em campo (ex: câmera para menu)

---

## O que o AppStaff NÃO é

- **Não** é o admin web encolhido
- **Não** é o TPV completo no telemóvel
- **Não** é apenas um viewer de dados
- **Não** deve virar um "saco de features móveis" sem papel claro

---

## Capacidades técnicas da plataforma

### Navegação

Expo Router → estrutura de telas baseada em rotas por directórios/páginas, compatível com mobile e web.

### Estado local

AsyncStorage + SecureStore → sessão, contexto local, dados de onboarding/login, preferências, cache operacional.

### Conectividade e dispositivo

expo-network, expo-device, expo-notifications, expo-secure-store → estado de rede, notificações, armazenamento seguro, adaptação ao dispositivo.

### Observabilidade

Sentry React Native → captura de erros, monitorização de falhas, rastreio de sessões e crashes.

### UI/Experiência

react-native-reanimated, expo-linear-gradient, react-native-svg → UI rica com animações e visual cuidado, não apenas telas utilitárias cruas.

---

## Fronteira de runtime

| Rota / Superfície                | Runtime autorizado                |
| -------------------------------- | --------------------------------- |
| `/app/staff/*`                   | AppStaff (mobile nativo, web dev) |
| `/admin/*`                       | Browser desktop/tablet            |
| `/op/tpv`, `/op/kds`, `/op/cash` | Desktop app (Electron)            |
| `/dashboard`                     | Browser desktop/tablet            |

- AppStaff **não expõe** superfícies TPV/KDS/Admin.
- Deep-links inválidos são negados, logados e redireccionados para AppStaff home.
- Defesa em profundidade: WebView (mobile-app) + shell routing (merchant-portal).

Ver [ADR-002](adr/ADR-002-appstaff-v1-v2-scope-and-surface-authority.md) para decisões de escopo V1/V2.

---

## Papel no produto (visão de futuro)

O AppStaff resolve potencialmente:

- Trabalho em movimento
- Gaps entre sala e operação
- Alertas distribuídos
- Onboarding da equipa
- Colecta em campo (ex: menu via câmera)
- Revisão contextual
- Suporte a fluxos que não cabem no admin desktop

---

## Documentação relacionada

| Documento                                                                                   | Conteúdo                                                    |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [:blueprint/05_APPSTAFF_CONTRACTS.md](../:blueprint/05_APPSTAFF_CONTRACTS.md)               | Contratos soberanos (Turno, Tarefa, Conformidade, Formação) |
| [:blueprint/06_APPSTAFF_VISUAL_MAP.md](../:blueprint/06_APPSTAFF_VISUAL_MAP.md)             | Mapa visual de telas/fluxos                                 |
| [adr/ADR-002](adr/ADR-002-appstaff-v1-v2-scope-and-surface-authority.md)                    | Decisões de escopo V1/V2 e autoridade de superfície         |
| [mobile-app/docs/APPSTAFF_CONTRACT_AUDIT.md](../mobile-app/docs/APPSTAFF_CONTRACT_AUDIT.md) | Auditoria de implementação dos contratos                    |
| [ops/APPSTAFF_OFFICIAL_GUARDRAILS.md](ops/APPSTAFF_OFFICIAL_GUARDRAILS.md)                  | Guardrails operacionais oficiais                            |
| [APPSTAFF_MOBILE_ONLY.md](APPSTAFF_MOBILE_ONLY.md)                                          | Política mobile-only                                        |
| [strategy/CHECKLIST_APPSTAFF.md](strategy/CHECKLIST_APPSTAFF.md)                            | Checklist de lançamento                                     |
