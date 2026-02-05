# AppStaff (visão web informativa)

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono) — vista informativa, não o app operacional.

## 2. Caminho(s)
- Dashboard com módulo "AppStaff" activo (conteúdo renderizado no DashboardPortal quando o utilizador selecciona AppStaff no sidebar). Não é uma rota independente tipo `/app/staff`; é conteúdo do `/dashboard` com `activeModule === "appstaff"`. Opcionalmente link para página que explica "AppStaff — disponível apenas no app mobile".

## 3. Objetivo
Visão web informativa: explicar ao dono que o terminal de staff (garçom/cozinha) corre no iOS e Android — tarefas, mini KDS, mini TPV, check-in e comunicação operacional. O dono não opera o App Staff na web; a web mostra mensagem e comandos de desenvolvimento (ex.: npm run ios no projecto mobile-app, npm run android). Não é rota de operação.

## 4. Quem acessa
- Dono (hasOrganization === true); visualiza informação e links para o app mobile.
- Nunca staff (staff usa o app no telemóvel).
- Nunca TPV/KDS (TPV/KDS são rotas operacionais separadas).

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; mostrar mensagem informativa |
| TRIAL | Permitido; idem |
| ACTIVE | Permitido; idem |
| SUSPENDED | Permitido (read-only) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `/dashboard` em `isWebConfigPath` → ALLOW. Conteúdo AppStaff é um módulo dentro do DashboardPortal; não tem path próprio.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Nenhuma fonte de dados obrigatória para a vista informativa; pode mostrar estado "Pessoas criadas" (config/people) ou link para Config. Backend futuro: nenhum contrato específico para esta vista.
- Pode operar sem backend real? SIM (conteúdo estático informativo).

## 8. Impacto Operacional
- **TPV:** Nenhum; App Staff no telemóvel pode enviar pedidos que aparecem no TPV.
- **KDS:** Nenhum; mini KDS no app é operação no telemóvel.
- **AppStaff:** Esta rota é apenas informação sobre o App Staff; não altera o app.
- **Relatórios:** Nenhum.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: DashboardPortal renderiza secção "AppStaff - disponível apenas no app mobile" com botão "Voltar ao Portal" e comandos npm run ios/android. Módulo listado no sidebar em "EM USO HOJE".

## 10. Próximos Passos Técnicos
- [ ] Manter mensagem alinhada com CONTRATO_OWNER_ONLY_WEB (web é do dono; operação staff é no app).
- [ ] Se no futuro existir rota dedicada `/app/staff` ou `/dashboard?module=appstaff`, documentar path aqui.
