# Bootstrap — Índice

Este diretório define os **rituais de inicialização** do projeto. Existem bootstraps diferentes conforme o âmbito: operacional (Restaurant OS) e informativo (página web pública).

---

## Regra-mãe

**Todo sistema que pode operar em estados diferentes precisa de bootstrap.** A diferença é quem decide o quê e até onde vai.

**Separação crítica:**

- **Restaurant OS** (TPV, KDS, Menu Builder): bootstrap **operacional soberano** — decide Core, dados, pode vender/cozinhar/publicar.
- **Página web do restaurante** (restaurant.com, QR, campanhas): bootstrap **informativo/comercial** — decide existe?, visível?, aberto?, módulos públicos, modo de pedido.

Eles **nunca se misturam.** A web pública não desbloqueia operação real.

---

## Documentos

### Bootstraps canónicos

- **RESTAURANT_BOOTSTRAP_CONTRACT.md** — contrato do bootstrap operacional (Restaurant OS); origem da verdade para TPV/KDS/Menu Builder.
- **PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md** — contrato do bootstrap da página web pública (visitante; existe?, aberto?, módulos, orderMode).

### Prontidão operacional (ORE)

**Regra:** ORE = cérebro; Manual = execução; UI executa. O ORE decide; o Manual explica o como; a UI segue a directiva.

- **OPERATIONAL_READINESS_ENGINE.md** — ORE (cérebro): autoridade única que decide se uma superfície pode operar, com base em estados canónicos e fontes de verdade. Contém superfícies governadas, BlockingReason, fontes de verdade, regras determinísticas, matriz superfície×motivo→uiDirective, invariantes. Spec técnica completa em `docs/architecture/OPERATIONAL_READINESS_ENGINE.md`.
- **OPERATIONAL_READINESS_MANUAL.md** — Manual de Instruções Operacionais: como executar as decisões do ORE (mapeamento ORE→UI, fluxos passo a passo, responsabilidades, troubleshooting). Obedece ao ORE; não define estados nem regras de prontidão.
- **ORE_SYSTEM_TREE_MAP.md** — System Tree anotado: sensores → ORE → UI. Mapa mental para onboarding e anti-regressão; sidebar reflete ORE, ORE não organiza sidebar.

### Mapa e referências

- **BOOTSTRAP_MAP.md** — mapa completo de todos os bootstraps do projeto (OS, Web pública, Onboarding, Sessão, Ambiente, Módulos de risco, Integrações, Jobs, Scripts).
- **BOOTSTRAP_AUDIT.md** — auditoria do código vs contratos (Restaurant OS: alinhado / em falta; página web pública: gap e próximos passos).
- **RESTAURANT_LIFECYCLE_CONTRACT.md** — transições após bootstrap (em [docs/contracts/](../contracts/RESTAURANT_LIFECYCLE_CONTRACT.md)).
- **STATUS_CONTRACT.md** — semântica de estados operacionais (em [docs/contracts/](../contracts/STATUS_CONTRACT.md)).

---

## Regra de ouro (Restaurant OS)

**Nenhuma tela pode inferir estado. Toda UI consome o Bootstrap State.**

(Na página web pública, a mesma ideia aplica-se ao `PublicRestaurantBootstrapState`.)
