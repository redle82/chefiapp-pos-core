# 📦 Release Notes Template

**Template para notas de release**

---

## 🎯 Estrutura

```markdown
# ChefIApp vX.Y.Z

**Data:** YYYY-MM-DD  
**Tipo:** Major | Minor | Patch

---

## 🎉 Novidades

### Feature Principal
- Descrição da feature principal

### Outras Features
- Feature 1
- Feature 2

---

## 🐛 Correções

- Correção 1
- Correção 2

---

## 🔧 Melhorias

- Melhoria 1
- Melhoria 2

---

## 📚 Documentação

- Documento atualizado 1
- Documento atualizado 2

---

## 🔄 Migração

### Breaking Changes
- Mudança 1 (se houver)
- Mudança 2 (se houver)

### Guia de Migração
Ver: [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)

---

## 📊 Métricas

- Performance: X% melhoria
- Cobertura de testes: X%
- Bugs corrigidos: X

---

## 🙏 Agradecimentos

- Contribuidor 1
- Contribuidor 2

---

## 📥 Download

- **iOS:** [Link]
- **Android:** [Link]

---

## 📞 Suporte

- **Issues:** [GitHub Issues]
- **Email:** support@chefiapp.com
```

---

## 📝 Exemplo Completo

```markdown
# ChefIApp v1.0.0 - Sistema Nervoso Operacional

**Data:** 2026-01-24  
**Tipo:** Major

---

## 🎉 Novidades

### Fast Pay
- Pagamento em 2 toques
- Auto-seleção de método de pagamento
- Tempo médio < 5 segundos

### Mapa Vivo
- Timer por mesa em tempo real
- Cores de urgência (verde → amarelo → vermelho)
- Ícones contextuais ("quer pagar", "esperando bebida")

### KDS Inteligente
- Menu adapta à pressão da cozinha
- Filtragem automática de pratos lentos
- Indicador visual de pressão

### Reservas LITE
- Lista de espera digital
- Persistência local
- Conversão automática para mesa

---

## 🐛 Correções

- Corrigido bug no timer do mapa vivo
- Corrigido problema de persistência da waitlist
- Corrigido cálculo de urgência

---

## 🔧 Melhorias

- Otimizado performance do timer (60-80% menos re-renders)
- Melhorado feedback haptic
- Adicionado validação de caixa fechado

---

## 📚 Documentação

- Criado guia completo de desenvolvimento
- Adicionado API Reference
- Atualizado Quick Reference

---

## 🔄 Migração

### Breaking Changes
- `QuickPayModal` substituído por `FastPayButton`
- `TableCard` agora requer prop `order`

### Guia de Migração
Ver: [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)

---

## 📊 Métricas

- Performance: 60% melhoria em re-renders
- Cobertura de testes: 75%
- Bugs corrigidos: 12

---

## 🙏 Agradecimentos

- Equipe de desenvolvimento
- Testadores beta

---

## 📥 Download

- **iOS:** [App Store]
- **Android:** [Google Play]

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/.../issues)
- **Email:** support@chefiapp.com
```

---

## 🎨 Tipos de Release

### Major (X.0.0)
- Breaking changes
- Novas features principais
- Mudanças arquiteturais

### Minor (0.X.0)
- Novas features (sem breaking)
- Melhorias significativas
- Novos componentes/hooks

### Patch (0.0.X)
- Bugfixes
- Correções de segurança
- Melhorias pequenas

---

## ✅ Checklist de Release

### Antes de Publicar
- [ ] Todos os testes passando
- [ ] Changelog atualizado
- [ ] Version bump correto
- [ ] Release notes escritas
- [ ] Breaking changes documentados
- [ ] Guia de migração (se necessário)
- [ ] Tag criada
- [ ] Build testado
- [ ] Documentação atualizada

### Após Publicar
- [ ] Release notes publicadas
- [ ] Comunicação enviada
- [ ] Monitoramento ativado
- [ ] Feedback coletado

---

## 📚 Recursos

- **Changelog:** `CHANGELOG.md`
- **Migration Guide:** `docs/MIGRATION_GUIDE.md`
- **Contributing:** `CONTRIBUTING.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
