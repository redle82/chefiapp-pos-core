# Pitch — Por que ninguém consegue copiar o AppStaff

## Tese
Um OS humano-operacional com contratos soberanos, invariantes de justiça e conformidade legal acoplada ao núcleo. Não é um app de tarefas; é a governança do trabalho real.

## Problema
O mercado vende "coleções de features" (hubs). Em ambientes de pressão (restaurantes), isso falha: injustiça na carga, violações de turno, HACCP sem lastro, e promessas não cumpridas.

## Solução
- **AppStaff Core**: Ontologia (`Worker`, `Role`, `Shift`, `Task`, `TrainingUnit`, `ComplianceItem`).
- **Contratos soberanos**: Turno, Tarefa, Justiça Operacional, Conformidade.
- **Invariantes**: Sem sobreposição, descanso mínimo por país, dupla validação em tarefas críticas.
- **Event Log**: `ShiftStarted/Ended`, `TaskAssigned/Completed`, `ComplianceRecorded/Verified` (imutável).
- **Projeções**: `WorkerStatus`, `RiskDashboard`, `SkillMatrix` para operar e auditar.
- **Legal Engine**: Perfis por país (GDPR/LGPD, HACCP, descanso mínimo) integrados ao núcleo.
- **UI Única, Múltiplas Realidades**: Um app, papéis diferentes (Garçom, Gerente, Dono) ativam contratos distintos.

## Moat (barreiras de cópia)
- **Contratos + Invariantes**: Requerem redefinir ontologia e fluxo causal (não é pluginável).
- **Auditoria Imutável**: Event sourcing e trilhas de conformidade — elevado custo de replicação.
- **Conformidade por País**: Motor legal acoplado a decisões operacionais (descanso, consentimento, HACCP).
- **Justiça Operacional (PSY)**: Distribuição equânime e direito de apelo formalizados — quase inexistente no mercado.
- **Arquitetura Multi-Core**: Núcleos soberanos conectados por eventos; adapters não definem verdade.

## Provas (já entregues)
- Multi-core documentado: [ARCHITECTURE_MULTI_CORE.md](ARCHITECTURE_MULTI_CORE.md)
- Legal Engine: tipos, endpoints, perfis ([src/lib/legal-*/](../src/lib)) + migração ([supabase/migrations/003_legal_profiles.sql](../supabase/migrations/003_legal_profiles.sql))
- AppStaff Core TS: [appstaff-core/](../appstaff-core/)
- Visual Map: [:blueprint/06_APPSTAFF_VISUAL_MAP.md](06_APPSTAFF_VISUAL_MAP.md)

## Roadmap (4 marcos)
1. **MVP Operacional**: Turnos, tarefas, HACCP básico, perfis legais ES/PT/BR/FR.
2. **Justiça & Formação**: Matriz de skills, distribuição equânime, direito de apelo, trilha de formação.
3. **Escala & Auditoria**: Projeções avançadas, dashboards de risco, integração fiscal e auditorias externas.
4. **Inteligência Governada**: Recomendações de escala e tarefas com salvaguardas (não-decide, aconselha).

## Métricas de prova
- **Staff Onboarding Time**: < 30 min.
- **Violação de turno**: −80% (descanso mínimo enforced).
- **HACCP logs válidos**: 95%+ (com verificação).
- **Carga equânime**: desvio padrão por papel < X.
- **NPS staff**: +15 pts.
- **Incidentes**: −40% em 90 dias.

## GTM
- Pilotos com donos operadores (1–3 locais). Verticais: casual dining, dark kitchen.
- Preço por staff ativo + auditoria incluída. Vendas via eficiência operacional e risco reduzido.

## Riscos & Mitigações
- **Adoção**: Treinamento e UX dirigida por papel.
- **Conformidade**: Parceria com consultorias locais; perfis legais auditados.
- **Integrações**: Adapters burros; troca sem impacto no core.

## Slide ASCII
```
                  ┌───────────────────────────────┐
                  │        APPSTAFF CORE          │
                  │ Contratos • Eventos • Justiça │
                  └───────────┬───────────┬───────┘
                              │           │
                 ┌────────────▼───┐   ┌───▼──────────┐
                 │ Conformidade    │   │ Formação     │
                 │ HACCP + Legal   │   │ Skills       │
                 └─────────────────┘   └──────────────┘
                              │           │
                 ┌────────────▼───────────▼──────────┐
                 │   Event Log + Projeções            │
                 │ WorkerStatus • Risk • SkillMatrix  │
                 └────────────────────────────────────┘
             ▲                 ▲                   ▲
             │                 │                   │
        Adapters (IO)     Legal Engine         UI Única
```

## Talk Track (1 minuto)
"ChefIApp governa realidades, não plugins. AppStaff é um núcleo humano-operacional com justiça e conformidade como invariantes, não opções. Isso cria um fosso: para copiar, é preciso redefinir a ontologia, contratos, auditoria e leis por país. A maioria integra features; nós governamos trabalho real."
