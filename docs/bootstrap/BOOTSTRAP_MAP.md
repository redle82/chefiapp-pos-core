# Mapa de Bootstraps do Projeto

**Regra-mãe:** Todo sistema que pode operar em estados diferentes precisa de bootstrap. A diferença é quem decide o quê e até onde vai.

---

## Separação crítica: OS vs Web Pública

|                      | Web Pública             | Restaurant OS |
| -------------------- | ----------------------- | ------------- |
| **Quem**             | Visitante               | Operador      |
| **Tipo**             | Informativo / comercial | Operacional   |
| **Escreve Core?**    | Não                     | Sim           |
| **Risco financeiro** | Não                     | Sim           |
| **Bootstrap**        | Leve                    | Soberano      |

**Regra de segurança:** Nenhuma decisão operacional pode ser tomada na página web pública. Toda operação real passa pelo Restaurant OS bootstrap.

---

## 1. Restaurant OS (núcleo operacional) — OBRIGATÓRIO / SOBERANO

**Onde:** TPV, KDS, Menu Builder, Backoffice

|                  |                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Tipo**         | Bootstrap Operacional Soberano                                                                      |
| **Decide**       | Restaurante ativo; Core online/offline; dados válidos; pode vender?; pode cozinhar?; pode publicar? |
| **Estado**       | `RestaurantBootstrapState`                                                                          |
| **Início**       | `RestaurantRuntimeContext.init()`                                                                   |
| **Fim**          | Entrega do estado via Provider                                                                      |
| **Consequência** | Sem bootstrap → sistema não pode operar                                                             |

**Contrato:** [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md)

---

## 2. Página Web Pública do Restaurante — OBRIGATÓRIO

**Onde:** restaurant.com, QR público, landing local

|                  |                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Tipo**         | Bootstrap Público / Informativo                                                                                    |
| **Decide**       | Restaurante existe?; está visível?; está aberto?; que módulos públicos estão ativos?                               |
| **Estado**       | `PublicRestaurantBootstrapState`                                                                                   |
| **Início**       | Primeiro contacto com identificador público (slug, restaurant_id, domínio) — ex.: `PublicRestaurantContext.init()` |
| **Fim**          | Página passa a renderizar conteúdo estável                                                                         |
| **Consequência** | Sem bootstrap → risco de mostrar dados errados ou restaurante inexistente                                          |

**Contrato:** [PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md](PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md)

---

## 3. Onboarding / Instalação do Restaurante — OBRIGATÓRIO

**Onde:** Primeiro uso, novo restaurante

|            |                                                                                     |
| ---------- | ----------------------------------------------------------------------------------- |
| **Tipo**   | Bootstrap de Criação                                                                |
| **Decide** | Restaurante já existe?; precisa ser criado?; em que ambiente?; Core já está ligado? |
| **Estado** | `RestaurantOnboardingState`                                                         |
| **Nota**   | É um bootstrap que gera outro bootstrap                                             |

---

## 4. Sessão do Utilizador (Operador / Dono / Staff) — OBRIGATÓRIO

**Onde:** Login, sessão, QR interno

|            |                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------- |
| **Tipo**   | Bootstrap de Identidade                                                                   |
| **Decide** | Quem é o utilizador?; qual o role?; que áreas pode ver?                                   |
| **Estado** | `UserSessionBootstrapState`                                                               |
| **Regra**  | Não confundir “quem pode” com “o que pode operar” (isso vem do bootstrap do restaurante). |

---

## 5. Ambiente de Execução (Dev / Prod / Local) — OBRIGATÓRIO

**Onde:** Web, Desktop, Docker, Offline

|            |                                                       |
| ---------- | ----------------------------------------------------- |
| **Tipo**   | Bootstrap de Ambiente                                 |
| **Decide** | URLs; portas; flags permitidas; logging               |
| **Estado** | `EnvironmentBootstrapState`                           |
| **Nota**   | Este bootstrap nunca toca UI; governa infraestrutura. |

---

## 6. Módulos com risco real — OBRIGATÓRIO

**Onde:** Billing, Pagamentos, Publicação, Reset Core

|             |                                                                    |
| ----------- | ------------------------------------------------------------------ |
| **Tipo**    | Bootstrap de Segurança                                             |
| **Decide**  | Pode executar?; está em modo real ou simulado?; exige confirmação? |
| **Exemplo** | `BillingBootstrapState`                                            |

---

## 7. Integrações Externas — OBRIGATÓRIO

**Onde:** SumUp, WhatsApp, Delivery, API externa

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| **Tipo**   | Bootstrap de Integração                                     |
| **Decide** | Integração ativa?; credenciais válidas?; pode enviar dados? |

---

## 8. Jobs / Workers / Agentes — OBRIGATÓRIO

**Onde:** Night jobs, sync, IA, automações

|            |                                                  |
| ---------- | ------------------------------------------------ |
| **Tipo**   | Bootstrap de Execução Autónoma                   |
| **Decide** | Restaurante alvo; permissão; ambiente; segurança |

---

## 9. Scripts críticos (CLI, reset, publish) — OBRIGATÓRIO

**Onde:** Terminal, automações

|            |                                         |
| ---------- | --------------------------------------- |
| **Tipo**   | Bootstrap de Execução Crítica           |
| **Decide** | Contexto; dry-run ou real; locks ativos |

---

## 10. O que NÃO precisa de bootstrap

- Componentes visuais puros
- Modais, cards, animações
- Hooks utilitários, funções helper

**Regra:** Esses consomem bootstrap, não criam.

---

## Mapa visual (mental)

```
[ Ambiente ]
     ↓
[ Restaurante ]
     ↓
[ Sessão ]
     ↓
[ Módulo ]
     ↓
[ Operação ]
```

Se um nível não sabe quem é → precisa de bootstrap.

---

## Regra final

Se algo pode causar confusão, erro financeiro, dado inválido ou bloqueio operacional e precisa decidir antes de agir → precisa de bootstrap.
