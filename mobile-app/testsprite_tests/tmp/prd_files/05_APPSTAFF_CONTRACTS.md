# AppStaff Core — Mapa de Contratos

Objetivo: definir os contratos soberanos do AppStaff (OS de trabalho humano) sem confundir com features ou integrações. Foco em realidade operacional, justiça e conformidade.

## Ontologia (Realidade)
- **Worker**: pessoa identificável que executa trabalho.
- **Role**: função/cargo (Garçom, Cozinha, Gerente).
- **Shift**: janela de trabalho com início/fim e contexto (local, estação).
- **Task**: unidade de trabalho adjudicada (servir mesa, fechar caixa, checklist HACCP).
- **ComplianceItem**: obrigação verificável (HACCP, EPI, formação obrigatória).
- **TrainingUnit**: peça de formação (curso, microlearning, avaliação).

## Contratos (Promessas verificáveis)
- **Contrato de Turno**
  - `startShift(workerId, roleId, at)` → Emite `ShiftStarted`.
  - `endShift(shiftId, at)` → Emite `ShiftEnded`.
  - Invariantes:
    - Um `Worker` não pode ter dois `Shift` ativos simultaneamente no mesmo núcleo.
    - Respeitar descanso mínimo entre `Shift` conforme perfil legal.

- **Contrato de Tarefa**
  - `assignTask(workerId, taskSpec)` → Emite `TaskAssigned`.
  - `completeTask(taskId, outcome)` → Emite `TaskCompleted`.
  - Invariantes:
    - Tarefa deve pertencer ao contexto do `Shift` ou ter justificativa fora de turno.
    - Tarefas de risco exigem dupla validação.

- **Contrato de Conformidade (Compliance)**
  - `recordCompliance(itemId, data)` → Emite `ComplianceRecorded`.
  - `verifyCompliance(itemId)` → Emite `ComplianceVerified`.
  - Invariantes:
    - Registros HACCP imutáveis, com carimbo de tempo e ator.
    - Certificações com validade e vínculo a `Worker`.

- **Contrato de Formação (Training)**
  - `enroll(workerId, unitId)` → Emite `TrainingEnrolled`.
  - `complete(workerId, unitId)` → Emite `TrainingCompleted`.
  - Invariantes:
    - Progressão de cargo depende de formação concluída e avaliação.

## Eventos (Linha do Tempo)
- `ShiftStarted`, `ShiftEnded`
- `TaskAssigned`, `TaskCompleted`, `TaskRejected`
- `ComplianceRecorded`, `ComplianceVerified`, `ComplianceViolation`
- `TrainingEnrolled`, `TrainingCompleted`

Eventos são imutáveis e formam a verdade operacional do AppStaff.

## Estados Derivados (Projeções)
- **WorkerStatus**: `em_turno | fora_de_turno | em_risco | em_formacao`.
- **RiskDashboard**: contagem e severidade de violações ativas.
- **SkillMatrix**: mapa de competências e certificações por cargo.

## Integração Legal (perfis por país)
- Validação de jornada, descanso e consentimento de dados via Legal Adaptation Engine.
- Tarefas HACCP e certificações obrigatórias conforme `LegalProfile.iso`.
- Armazenamento em `haccp_logs`, `employee_certifications` e auditoria de conformidade.

## Justiça Operacional (Psicológico)
- **Contrato de Justiça** (meta-contrato):
  - Transparência: motivo de atribuição e avaliação de tarefa visível.
  - Proporcionalidade: carga equilibrada por `Role` e senioridade.
  - Apelo: trabalhador pode contestar avaliação → `TaskAppealFiled`.

## Fronteiras e Não-Core
- Marketplaces, mensageria e notificações são adaptadores (sensores/atuadores), não definem realidade.
- AppStaff Core não depende de SDKs de terceiros para verdade; apenas consome sinais.

## API de Alto Nível (exemplo)
- `AppStaff.startShift({ workerId, roleId, at })`
- `AppStaff.assignTask({ workerId, taskSpec })`
- `AppStaff.recordCompliance({ itemId, data, by })`
- `AppStaff.enrollTraining({ workerId, unitId })`

## Mapa de Responsabilidade
- Core AppStaff: contratos, eventos, invariantes, justiça, conformidade.
- Adaptadores: coleta de pedidos, chat, notificações, biometria.
- Core Restaurante: TPV, fidelização, menu, preços, clientes.
- Núcleo de Inteligência (futuro): recomendações, previsões, otimização de escala.

## ASCII (Página Única)

```
        ┌──────────────────────────────────┐
        │          APPSTAFF CORE           │
        │ Contratos • Eventos • Justiça    │
        └───────────┬───────────┬─────────┘
                    │           │
        ┌───────────▼───┐   ┌───▼──────────┐
        │  Compliance    │   │  Formação    │
        │ HACCP + Legal  │   │ Skills + Cert│
        └───────────────┘   └──────────────┘
                    │           │
        ┌───────────▼───────────▼──────────┐
        │         Projeções Operacionais    │
        │ Status • Risco • Matriz Skills    │
        └───────────────────────────────────┘
```
