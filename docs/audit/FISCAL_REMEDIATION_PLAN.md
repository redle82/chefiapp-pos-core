# Plano de Remediação Fiscal — Portugal (ATCUD + SAF-T)

**Data:** 24 Fevereiro 2026
**Status:** Crítico — Bloqueador para Certificação Legal
**Prioridade:** P0 (Máxima)

---

## 1. Sumário Executivo

O sistema ChefIApp POS-CORE não está legalmente em conformidade com a legislação fiscal portuguesa. A implementação do ATCUD é incompleta (falta validação com AT), e o SAF-T não cumpre as especificações da Autoridade Tributária. **Esta é a razão número 1 pela qual o sistema não pode ser colocado em produção em Portugal.**

---

## 2. Problemas Identificados

### 2.1 ATCUD (Ambiente de Trabalho Certificado Universal Digital)

**Situação Atual:**

- Ficheiro: `fiscal-modules/pt/saft/saftUtils.ts`
- Implementação: `buildAtcud() = ${series}-${formatSequence(sequence)}`
- Problema: Gerado **localmente sem validação com a AT**

**Requisito Legal:**
Segundo Portaria nº 292/2011, o ATCUD é emitido pela Autoridade Tributária e deve ser:

1. Um código único de validação
2. Registado junto da AT para a série/TPV utilizado
3. Válido apenas para o restaurante/empresa específico

**Impacto:**

- Qualquer documento com ATCUD genérico **será rejeitado pela AT**
- Não permite certificação fiscal
- Constitui documentação inválida para auditorias

### 2.2 SAF-T (Standard Audit File for Tax)

**Situação Atual:**

- Ficheiro: `fiscal-modules/pt/saft/saftXml.ts`
- Problemas:
  - Valores hardcoded (`SoftwareCertificateNumber: 0`)
  - Estrutura simplicista (faltam elementos obrigatórios)
  - Sem assinatura digital qualificada
  - Header e footer incorretos

**Especificação:**

- Versão obrigatória: SAF-T 1.04_01 (português)
- Elementos obrigatórios:
  - `AuditFileVersion` = "1.04_01"
  - `SoftwareCompany`
  - `SoftwareProductCode` e `SoftwareProductVersion`
  - `AuditFileCounterpart` com assinatura qualificada
  - `SourceDocuments` com hash chain
  - Validação de integridade (SHA-256)

**Impacto:**

- SAF-T gerado será rejeitado na submissão
- Impossível validar integridade dos documentos
- Sem conformidade com padrões internacionais

### 2.3 Falta de Integração com AT

**Situação Atual:**

- Nenhuma chamada a web service da AT para:
  - Registo de série/TPV
  - Obtenção de ATCUD

**Ficheiros Associados:**

- `fiscal-modules/pt/atQrUrl.ts` — Apenas gera URL para QR, não comunica com AT

---

## 3. Especificações Legais Relevantes

| Norma                       | Descrição                                   | Impacto     |
| --------------------------- | ------------------------------------------- | ----------- |
| Portaria nº 292/2011        | ATCUD e certificação de TPV                 | **Crítico** |
| SAF-T 1.04_01 (PT)          | Formato e conteúdo do ficheiro de auditoria | **Crítico** |
| Lei nº 16/2010 (IVA)        | Requisitos de documentação fiscal           | **Alto**    |
| Resolução da AT nº 123/2015 | Assinatura qualificada de documentos        | **Crítico** |

---

## 4. Plano de Remediação — Fases

### **Fase 1: Implementação de ATCUD Válido (Semana 1-2)**

#### Objectivo

Implementar comunicação com serviço AT para obtenção e validação de ATCUD.

#### Acções

1. **Criar módulo de integração com AT:**

   - Ficheiro: `fiscal-modules/pt/atIntegration/atWebServiceClient.ts`
   - Responsabilidades:
     - Autenticação OAuth2 com Autoridade Tributária
     - Registo de série de documentos
     - Obtenção de ATCUD válido
     - Validação de ATCUD

2. **Update a lógica de ATCUD:**

   - Ficheiro: `fiscal-modules/pt/saft/saftUtils.ts`
   - Refactorizar `buildAtcud()` para:
     - Chamar `atWebServiceClient.getValidAtcud(serie, nif)`
     - Cachear resultado (válido por 24h)
     - Falhar com erro se AT não responder

3. **Testes unitários:**
   - Mock do serviço AT
   - Casos: sucesso, erro de autenticação, serie já registada, etc.

#### Dependências

- Credenciais de acesso ao serviço AT (fornecidas pelo cliente)
- Documentação da API da AT (contactar AT)

---

### **Fase 2: Implementação Completa de SAF-T 1.04_01 (Semana 2-3)**

#### Objectivo

Gerar SAF-T conforme especificação legal.

#### Acções

1. **Refactorizar gerador de SAF-T:**

   - Ficheiro: `fiscal-modules/pt/saft/saftXml.ts`
   - Incluir:
     - Header completo (versão, empresa, soft)
     - DocumentTotals com cálculos corretos
     - Hash chain para integridade
     - Footer com assinatura

2. **Implementar assinatura digital qualificada:**

   - Ficheiro: `fiscal-modules/pt/saft/saftSigner.ts`
   - Usar certificado qualificado (fornecido pelo cliente)
   - Algoritmo: SHA-256 + RSA

3. **Validação antes de escrita:**
   - Verificar estrutura XML
   - Calcular e validar hashes
   - Testar contra schema oficial SAF-T

#### Dependências

- Certificado qualificado no servidor
- Acesso à biblioteca de assinatura (ex: OpenSSL com suporte a smartcard)

---

### **Fase 3: Testes Integrados e Validação (Semana 3-4)**

#### Objectivo

Validar conformidade com regulações antes de go-live.

#### Acções

1. **Suite de testes:**

   - `fiscal-modules/pt/tests/atcud.integration.test.ts`
   - `fiscal-modules/pt/tests/saft.validation.test.ts`
   - Cobertura: fluxo completo ATCUD + SAF-T

2. **Validação cruzada:**

   - Submeter SAF-T de teste para validação online (if available)
   - Verificar rejeição de documentos com ATCUD inválido
   - Validar assinatura de terceiro

3. **Documentação:**
   - Runbook de operação
   - Procedimento de rollback
   - Escalação para AT em caso de erro

---

## 5. Recursos Necessários

| Recurso                 | Responsável        | Prazo           |
| ----------------------- | ------------------ | --------------- |
| Credenciais AT (OAuth2) | Cliente/Compliance | Antes de Fase 1 |
| Certificado qualificado | Cliente            | Antes de Fase 2 |
| Documentação API AT     | Contactar AT       | Antes de Fase 1 |
| Review legal            | Consultor fiscal   | Após Fase 3     |

---

## 6. Critérios de Aceitação (DoD)

- [ ] ATCUD é obtido via AT, não gerado localmente
- [ ] SAF-T gerado segue especificação 1.04_01
- [ ] SAF-T é assinado com certificado qualificado
- [ ] Todos os testes integrados passam
- [ ] Documentação de operação completa
- [ ] Review legal positiva

---

## 7. Riscos e Mitigações

| Risco                              | Probabilidade | Impacto | Mitigação                                          |
| ---------------------------------- | ------------- | ------- | -------------------------------------------------- |
| AT API indisponível                | Média         | Alto    | Implementar retry com backoff exponencial; alertas |
| Certificado qualificado expirado   | Baixa         | Crítico | Monitorizar data de expiração; alertas com 30 dias |
| Incompatibilidade com versão SAF-T | Baixa         | Alto    | Validação contra schema; testes com amostra real   |

---

## 8. Próximos Passos Imediatos

1. **Esta semana (24-28 fev):**

   - [ ] Contactar AT para obter documentação técnica de integração
   - [ ] Obter credenciais de teste
   - [ ] Rever certificados qualificados existentes no cliente

2. **Semana que vem (03-07 mar):**

   - [ ] Iniciar implementação de `atIntegration` (Fase 1)
   - [ ] Setup ambiente de teste com credenciais de teste da AT

3. **Estimativa total:** 3-4 semanas em tempo de desenvolvimento (com suporte paralelo do cliente)

---

**Aprovado por:** [Pendente]
**Data de revisão:** 01 Março 2026
