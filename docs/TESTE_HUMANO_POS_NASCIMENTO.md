# 🧍‍♂️ TESTE HUMANO PÓS-NASCIMENTO
## Validar o Ritual de Nascimento do Restaurante

**Objetivo:** Simular uma pessoa real criando um restaurante do zero no ChefIApp, validando se o wizard é utilizável, compreensível e gera vida real.

**Critério:** "Se eu abrisse um restaurante amanhã e só tivesse isso, eu conseguiria criar e ativar sozinho?"

---

## 🎯 CONTEXTO DO TESTE

### O que foi implementado
- ✅ Wizard de 7 fases (ou FASE A: 3 fases mínimas)
- ✅ Criação de restaurante completa
- ✅ Ativação com primeiro pedido
- ✅ KDS conectado
- ✅ Dashboard com dados reais

### O que vamos testar
- Usabilidade do wizard
- Clareza das instruções
- Geração de vida real (pedido aparece no KDS)
- Experiência pós-ativação

---

## 🧍‍♂️ PERFIL DO TESTADOR

**Simular:** Dono de restaurante real, primeira vez usando o sistema.

**Características:**
- Não é técnico
- Quer criar restaurante rápido
- Não quer ler manual
- Quer ver resultado imediato

---

## 📋 CENÁRIO DE TESTE

### Restaurante de Teste
- **Nome:** "Sofia Gastrobar Ibiza"
- **Tipo:** Bar
- **País:** Spain
- **Endereço:** Calle des caló, 109, Sant Josep de sa Talaia
- **Mesas:** 5 mesas (2 de 2 pessoas, 2 de 4 pessoas, 1 de 6 pessoas)

---

## 🔄 FLUXO DE TESTE (PASSO A PASSO)

### FASE 1: IDENTIDADE

**Ação:**
1. Acessar `/onboarding`
2. Preencher formulário:
   - Nome: "Sofia Gastrobar Ibiza"
   - Tipo: Bar
   - País: Spain
   - Fuso horário: Europe/Madrid
   - Moeda: EUR (€)
   - Idioma: Português (PT)
3. Clicar "Próximo"

**Avaliar:**
- [ ] Formulário é claro?
- [ ] Campos são intuitivos?
- [ ] Validações funcionam?
- [ ] Mensagens de erro são claras?
- [ ] Botão "Próximo" está visível?

**Onde pode travar:**
- ❓ Não sabe o que é "fuso horário"
- ❓ Não sabe qual moeda usar
- ❓ Tipo de estabelecimento não tem a opção que quer

**Onde deve sentir confiança:**
- ✅ Progresso visível [1/7]
- ✅ Campos obrigatórios marcados
- ✅ Botão "Cancelar" disponível

---

### FASE 2: EXISTÊNCIA FÍSICA

**Ação:**
1. Preencher endereço:
   - Endereço: "Calle des caló, 109"
   - Cidade: "Sant Josep de sa Talaia"
   - CEP: "07829"
   - Estado: "Balears"
2. Definir capacidade: 20 pessoas
3. Ver mesas geradas automaticamente
4. Selecionar zonas: Bar, Salão
5. Clicar "Próximo"

**Avaliar:**
- [ ] Endereço é fácil de preencher?
- [ ] Mapa aparece? (se implementado)
- [ ] Capacidade é clara?
- [ ] Mesas geradas fazem sentido?
- [ ] Posso editar mesas? (se necessário)
- [ ] Zonas são claras?

**Onde pode travar:**
- ❓ Não sabe quantas pessoas cabem
- ❓ Não entende o que são "zonas"
- ❓ Mesas geradas não fazem sentido
- ❓ Quer adicionar mais mesas manualmente

**Onde deve sentir confiança:**
- ✅ Mesas geradas automaticamente (não precisa pensar)
- ✅ Pode editar se quiser
- ✅ Progresso [2/7] visível

---

### FASE 7: ATIVAÇÃO (Se FASE A)

**Ação:**
1. Ver resumo:
   - Restaurante: "Sofia Gastrobar Ibiza"
   - Mesas: 5
   - Zonas: 2
2. Ler "O que acontece ao ativar"
3. Clicar "ATIVAR RESTAURANTE 🚀"
4. Ver loading
5. Ser redirecionado para `/owner/vision`

**Avaliar:**
- [ ] Resumo está correto?
- [ ] "O que acontece" é claro?
- [ ] Botão de ativar é visível e claro?
- [ ] Loading aparece?
- [ ] Redirecionamento funciona?

**Onde pode travar:**
- ❓ Não entende o que vai acontecer
- ❓ Tem medo de ativar (não pode desfazer?)
- ❓ Não sabe para onde vai depois

**Onde deve sentir confiança:**
- ✅ Resumo mostra tudo que será criado
- ✅ Botão grande e claro
- ✅ Feedback imediato (loading)

---

### PÓS-ATIVAÇÃO: VERIFICAR VIDA

**Ação:**
1. Ver dashboard (`/owner/vision`)
2. Verificar:
   - Restaurante aparece?
   - Primeiro pedido aparece?
   - KPIs mostram dados reais?
3. Navegar para KDS (`/employee/operation/kitchen`)
4. Verificar:
   - Pedido aparece no KDS?
   - Tempo está correto?
   - Status está correto?

**Avaliar:**
- [ ] Dashboard mostra dados reais? (não placeholders)
- [ ] Primeiro pedido está visível?
- [ ] KDS mostra pedido em tempo real?
- [ ] Tempo decorrido está correto?
- [ ] Sistema parece "vivo"?

**Onde pode travar:**
- ❓ Dashboard ainda mostra placeholders
- ❓ Primeiro pedido não aparece
- ❓ KDS está vazio
- ❓ Não sabe o que fazer agora

**Onde deve sentir confiança:**
- ✅ Dashboard mostra dados reais
- ✅ Primeiro pedido visível
- ✅ KDS mostra pedido automaticamente
- ✅ Sistema está "vivo"

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Usabilidade do Wizard
- [ ] Posso completar em menos de 5 minutos?
- [ ] Todas as instruções são claras?
- [ ] Validações funcionam corretamente?
- [ ] Posso voltar e corrigir erros?
- [ ] Progresso é visível?

### Geração de Vida Real
- [ ] Após ativar, restaurante está no banco?
- [ ] Primeiro pedido foi criado?
- [ ] Pedido aparece no KDS?
- [ ] Dashboard mostra dados reais?
- [ ] Zero placeholders visíveis?

### Experiência Pós-Ativação
- [ ] Dashboard é útil?
- [ ] KDS mostra pedido corretamente?
- [ ] Posso navegar entre telas?
- [ ] Sistema parece operacional?

---

## 🚨 PROBLEMAS CRÍTICOS (Bloqueadores)

### Se wizard não funciona
- ❌ Não consigo criar restaurante
- ❌ Validações bloqueiam sem motivo
- ❌ Dados não persistem

### Se vida não é gerada
- ❌ Após ativar, nada acontece
- ❌ Primeiro pedido não aparece
- ❌ KDS está vazio
- ❌ Dashboard ainda mostra placeholders

### Se experiência é confusa
- ❌ Não sei o que fazer depois de ativar
- ❌ Telas não fazem sentido
- ❌ Navegação é confusa

---

## ✅ CRITÉRIO DE SUCESSO

**Wizard está pronto quando:**
- ✅ Posso criar restaurante em 5 minutos sem ajuda
- ✅ Após ativar, vejo primeiro pedido no KDS
- ✅ Dashboard mostra dados reais
- ✅ Sistema parece "vivo" e operacional
- ✅ Zero placeholders visíveis
- ✅ Experiência é clara e confiante

---

## 📝 RELATÓRIO DE TESTE

### Após executar o teste, documentar:

1. **Tempo total:** Quantos minutos levou?
2. **Travamentos:** Onde travou? Por quê?
3. **Confusões:** O que não ficou claro?
4. **Confiança:** Onde sentiu confiança?
5. **Vida real:** Pedido apareceu no KDS?
6. **Dados reais:** Dashboard mostra dados reais?

### Exemplo de Relatório:

```
TESTE HUMANO PÓS-NASCIMENTO
Data: 26/01/2026
Testador: Simulação (Dono de restaurante)

TEMPO TOTAL: 4 minutos

TRAVAMENTOS:
- Nenhum

CONFUSÕES:
- "Fuso horário" não é claro para não-técnicos
- Sugestão: "Horário do seu país" ou explicar melhor

CONFIANÇA:
- Mesas geradas automaticamente (não precisa pensar)
- Resumo antes de ativar (sabe o que vai acontecer)
- Primeiro pedido aparece imediatamente no KDS

VIDA REAL:
✅ Pedido apareceu no KDS em 2 segundos
✅ Dashboard mostra: 1 restaurante, 1 pedido, 0 SLAs
✅ Zero placeholders visíveis

VEREDITO:
✅ Wizard está pronto para uso real
✅ Sistema gera vida corretamente
✅ Experiência é clara e confiante
```

---

## 🎯 PRÓXIMO PASSO APÓS TESTE

### Se teste passa:
- ✅ Wizard está pronto
- ✅ Avançar para FASE B (fechar ciclo)
- ✅ Depois: FASE C (inteligência)

### Se teste falha:
- 🔧 Corrigir problemas críticos
- 🔧 Melhorar instruções
- 🔧 Adicionar feedback visual
- 🔧 Re-testar até passar

---

**Documento criado em:** 26/01/2026  
**Status:** ✅ Pronto para uso após FASE A
