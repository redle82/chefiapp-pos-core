# ❓ FAQ - Sistema Nervoso Operacional

**Perguntas frequentes consolidadas**

---

## 🎯 Sobre o Projeto

### O que é o Sistema Nervoso Operacional?
É a transformação do ChefIApp de um registrador de vendas em um sistema que **pensa, decide e guia** a operação do restaurante em tempo real.

**Filosofia:** *"Last.app organiza o restaurante. ChefIApp deve guiá-lo."*

### O que foi implementado?
4 funcionalidades principais em 30 dias:
1. **Fast Pay** - Pagamento em 2 toques (< 5s)
2. **Mapa Vivo** - Sensor operacional com timers e cores
3. **KDS Inteligente** - Menu adapta baseado na pressão da cozinha
4. **Reservas LITE** - Lista de espera digital

### Qual o status atual?
✅ **Pronto para Validação em Produção**

- Implementação: 100% completo
- Documentação: 24 documentos
- Validação: Script automatizado + checklist manual

---

## 🚀 Como Começar

### Sou desenvolvedor novo. Por onde começo?
1. Ler **[ONBOARDING.md](../ONBOARDING.md)** (15 minutos)
2. Executar `./scripts/validate-system.sh`
3. Rodar app localmente
4. Explorar código

### Sou executivo. O que preciso saber?
1. Ler **[docs/RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)** (5 minutos)
2. Ver **[docs/MANIFESTO_COMERCIAL.md](MANIFESTO_COMERCIAL.md)** (10 minutos)
3. Revisar **[docs/PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md)** (10 minutos)

### Sou usuário final. Como uso?
Ler **[docs/GUIA_RAPIDO_GARCOM.md](GUIA_RAPIDO_GARCOM.md)** (10 minutos)

---

## 💻 Técnico

### Como validar o sistema?
```bash
./scripts/validate-system.sh
```

### Como rodar localmente?
```bash
cd mobile-app
npm install
npm start
```

### Onde está a documentação técnica?
- **Implementação:** [docs/EXECUCAO_30_DIAS.md](EXECUCAO_30_DIAS.md)
- **Arquitetura:** [docs/ARQUITETURA_VISUAL.md](ARQUITETURA_VISUAL.md)
- **Setup:** [docs/SETUP_DEPLOY.md](SETUP_DEPLOY.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Como fazer deploy?
Seguir **[docs/SETUP_DEPLOY.md](SETUP_DEPLOY.md)**

---

## 📊 Métricas e KPIs

### Quais são os KPIs principais?
1. Tempo médio de pagamento - Meta: < 5s
2. Taxa de conversão de reservas - Meta: +15%
3. Redução de mesas > 30min - Meta: -40%
4. Vendas de bebidas durante pico - Meta: +25%

**Ver detalhes:** [docs/METRICAS_KPIS.md](METRICAS_KPIS.md)

### Como coletar métricas?
Implementar tracking de eventos conforme [docs/METRICAS_KPIS.md](METRICAS_KPIS.md)

---

## 🐛 Problemas

### Fast Pay não funciona
Ver **[docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Seção "Fast Pay"

### Timer não atualiza
Ver **[docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Seção "Mapa Vivo"

### Menu não esconde pratos lentos
Ver **[docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Seção "KDS Inteligente"

### Lista de espera sumiu
Ver **[docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Seção "Reservas LITE"

---

## 🚀 Lançamento

### Quando vamos lançar?
Seguir **[docs/PLANO_ROLLOUT.md](PLANO_ROLLOUT.md)**:
- Semana 1-2: Beta fechado (3-5 restaurantes)
- Semana 3-4: Rollout gradual (20 restaurantes)
- Semana 5+: Expansão completa

### O que preciso antes do go-live?
Seguir **[docs/GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md)**

### Como comunicar o lançamento?
Usar templates de **[docs/COMUNICACAO_STAKEHOLDERS.md](COMUNICACAO_STAKEHOLDERS.md)**

---

## 🔄 Melhorias

### Quais são os próximos passos?
Ver **[docs/PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md)**

### Quais quick wins posso fazer?
Ver **[docs/QUICK_WINS.md](QUICK_WINS.md)** - 8 melhorias identificadas

### Como priorizar melhorias?
1. Baseado em dados (métricas)
2. Baseado em feedback (usuários)
3. Baseado em impacto/esforço (quick wins)

---

## 📚 Documentação

### Onde está toda a documentação?
- **Índice completo:** [docs/INDICE_COMPLETO.md](INDICE_COMPLETO.md)
- **README principal:** [docs/README.md](README.md)
- **Porta de entrada:** [INICIO_AQUI.md](../INICIO_AQUI.md)

### Quantos documentos existem?
**24 documentos** cobrindo:
- Técnica (implementação, arquitetura, setup)
- Comercial (manifesto, rollout, comunicação)
- Usuário (guia do garçom)
- Operacional (métricas, manutenção, go-live)
- Transição (handoff, quick wins, retrospectiva)

### Como navegar pela documentação?
Ver **[docs/GUIA_NAVEGACAO.md](GUIA_NAVEGACAO.md)** (próximo documento)

---

## 🎯 Estratégia

### Qual a diferenciação?
**"Last.app organiza. ChefIApp guia."**

- Sistema nervoso operacional (pensa, decide, guia)
- Tempo real (não batch)
- Contexto (não apenas dados)
- Simplicidade (não complexidade)

### Qual o ROI esperado?
- Receita adicional: €500-1000/mês por restaurante
- ROI positivo: < 30 dias
- Mais mesas/noite: +2-3 mesas

**Ver:** [docs/MANIFESTO_COMERCIAL.md](MANIFESTO_COMERCIAL.md)

---

## 🔧 Manutenção

### Como manter o sistema?
Seguir **[docs/MANUTENCAO_CONTINUA.md](MANUTENCAO_CONTINUA.md)**

### Com que frequência atualizar?
- **Diária:** Verificar logs e métricas (5 min)
- **Semanal:** Revisar performance (30 min)
- **Mensal:** Atualizar dependências (2 horas)

---

## 👥 Equipe

### Como fazer handoff?
Ler **[docs/HANDOFF_EQUIPE.md](HANDOFF_EQUIPE.md)**

### Como onboardar novos devs?
Ler **[ONBOARDING.md](../ONBOARDING.md)**

### Como comunicar progresso?
Usar templates de **[docs/COMUNICACAO_STAKEHOLDERS.md](COMUNICACAO_STAKEHOLDERS.md)**

---

## 📞 Suporte

### Onde buscar ajuda?
1. **Troubleshooting:** [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Onboarding:** [ONBOARDING.md](../ONBOARDING.md)
3. **Handoff:** [docs/HANDOFF_EQUIPE.md](HANDOFF_EQUIPE.md)

### Como reportar bugs?
1. Verificar se já está em [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Se não, criar issue no GitHub
3. Usar template de [docs/GITHUB_ISSUES.md](GITHUB_ISSUES.md)

---

## 🎓 Aprendizado

### O que aprendemos?
Ver **[docs/RETROSPECTIVA.md](RETROSPECTIVA.md)**

### O que funcionou bem?
- Foco em operação, não em features
- Simplicidade > complexidade
- Documentação desde o início
- Validação contínua

### O que melhorar?
- Testes automatizados desde o início
- Métricas desde o início
- Feedback de usuários reais mais cedo

---

## 🔗 Links Rápidos

- **Início:** [INICIO_AQUI.md](../INICIO_AQUI.md)
- **Projeto Completo:** [PROJETO_COMPLETO.md](../PROJETO_COMPLETO.md)
- **Onboarding:** [ONBOARDING.md](../ONBOARDING.md)
- **Validação:** [docs/VALIDACAO_RAPIDA.md](VALIDACAO_RAPIDA.md)
- **Go-Live:** [docs/GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md)

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
