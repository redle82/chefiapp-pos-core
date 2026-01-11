# AppStaff — Mapa Visual (Core + Dinâmica)

Objetivo: uma visão única (slide-ready) da arquitetura do AppStaff como OS humano-operacional: contratos, eventos, justiça e conformidade.

## Visão Geral (ASCII)

```
                         ┌───────────────────────────────┐
                         │          CONTEXTOS            │
                         │  Cargo • Turno • Local • Psy  │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         APPSTAFF CORE (SOBERANO)                          │
│ Ontologia • Contratos • Eventos • Invariantes • Projeções                 │
├───────────┬───────────────┬────────────────┬──────────────────────────────┤
│ Contratos │   Justiça     │  Conformidade │   Formação (Training)        │
│ (Turno,   │ Operacional   │ (HACCP, Legal)│ (Units, Progressão)          │
│ Tarefa)   │ Carga Equânime│ Perfis País   │ Matriz de Skills             │
├───────────▼───────────────▼────────────────▼──────────────────────────────┤
│                 EVENT LOG (imutável)  +  PROJEÇÕES OPERACIONAIS           │
│   ShiftStarted/Ended • TaskAssigned/Completed • ComplianceRecorded/…      │
│   Projeções: WorkerStatus • RiskDashboard • SkillMatrix                   │
└───────────────────────────────────────────────────────────────────────────┘
            ▲                             ▲                       ▲
            │                             │                       │
   ┌────────┴──────┐               ┌──────┴────────┐       ┌──────┴────────┐
   │ ADAPTERS (IO) │               │ LEGAL ENGINE  │       │ WEB/PWA (UI)  │
   │ Marketplaces   │               │ Perfis País   │       │ Um app,       │
   │ WhatsApp/Email │               │ Regras Labor  │       │ múltiplas     │
   │ Notificações   │               │ Consentimento │       │ realidades     │
   └───────────────┘               └───────────────┘       └───────────────┘
```

## Dinâmica (não lógica)
- Event-driven, contextual, temporal e justa.
- `ShiftStarted` ativa autoridade → desbloqueia tarefas do cargo.
- Tarefas críticas exigem dupla validação e geram sinais de risco.
- Conformidade (HACCP/Legal) é registrada e verificada; projeções mostram risco.

## Contratos (exemplos)
- Turno: sem sobreposição; descanso mínimo via perfil legal; autoridade temporal.
- Tarefa: dono, contexto, criticidade; tarefa crítica não pode ser ignorada.
- Justiça: distribuição equânime, histórico imutável, direito de apelo.

## Integração Legal
- `LegalProfile.iso` guia descanso, consentimento de foto, HACCP obrigatório.
- Logs: `haccp_logs`, `employee_certifications`, `compliance_audits`.

## UI Única, Múltiplas Realidades
- Mesmo app (Web/PWA/Store); muda o papel, mudam contratos ativos.
- Garçom vê tarefas operacionais; Gerente vê pessoas+risco; Dono vê sistema.

## Projeções Essenciais
- `WorkerStatus`: em_turno | fora_de_turno | em_risco | em_formacao.
- `RiskDashboard`: severidade e contagem de violações ativas.
- `SkillMatrix`: competências e certificações por cargo.

## Frases-Chave
- Integrações trazem sinais. Contratos criam promessas. Cores sustentam realidades.
- LastApp conecta ferramentas. ChefIApp governa realidades.
