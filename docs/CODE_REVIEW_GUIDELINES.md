# 👀 Code Review Guidelines - ChefIApp

**Diretrizes para revisão de código**

---

## 🎯 Objetivos

### Por Que Revisar?
- **Qualidade:** Garantir código de alta qualidade
- **Consistência:** Manter padrões do projeto
- **Segurança:** Prevenir vulnerabilidades
- **Aprendizado:** Compartilhar conhecimento
- **Bugs:** Encontrar problemas antes do deploy

---

## ✅ Checklist de Revisão

### Funcionalidade
- [ ] Código funciona como esperado?
- [ ] Testes passando?
- [ ] Sem regressões?
- [ ] Edge cases tratados?
- [ ] Error handling adequado?

### Código
- [ ] Segue convenções do projeto?
- [ ] Bem documentado?
- [ ] Sem código morto/comentado?
- [ ] Nomes descritivos?
- [ ] Funções pequenas e focadas?

### Performance
- [ ] Sem re-renders desnecessários?
- [ ] Memoização onde necessário?
- [ ] Lazy loading implementado?
- [ ] Queries otimizadas?
- [ ] Sem memory leaks?

### Segurança
- [ ] Inputs validados?
- [ ] Outputs sanitizados?
- [ ] Sem dados sensíveis expostos?
- [ ] Erros não expõem detalhes?
- [ ] Permissões corretas?

### Testes
- [ ] Testes escritos?
- [ ] Coverage adequado?
- [ ] Testes relevantes?
- [ ] Mocks corretos?

### Documentação
- [ ] README atualizado (se necessário)?
- [ ] Changelog atualizado?
- [ ] Comentários claros?
- [ ] API documentada?

---

## 🔍 Áreas de Foco

### 1. Componentes React

#### ✅ Bom
```typescript
// Props tipadas
interface Props {
  orderId: string;
  total: number;
  onSuccess?: () => void;
}

// Early returns
if (!order) return null;

// Memoização
const filtered = useMemo(() => {
  return items.filter(i => i.active);
}, [items]);
```

#### ❌ Evitar
```typescript
// Props sem tipo
function Component(props: any) { }

// Lógica complexa no render
return items.map(i => {
  // 50 linhas de lógica
});

// Sem memoização de cálculos pesados
const filtered = items.filter(/* cálculo pesado */);
```

---

### 2. Hooks

#### ✅ Bom
```typescript
// Cleanup adequado
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);

// Dependencies corretas
useEffect(() => {
  fetchData(id);
}, [id]);
```

#### ❌ Evitar
```typescript
// Sem cleanup
useEffect(() => {
  setInterval(() => {}, 1000);
  // Sem return cleanup
}, []);

// Dependencies faltando
useEffect(() => {
  fetchData(id);
}, []); // id não está nas deps
```

---

### 3. Performance

#### ✅ Bom
```typescript
// Timer condicional
useEffect(() => {
  if (!active) return;
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, [active]);

// Memoização
const expensive = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

#### ❌ Evitar
```typescript
// Timer sempre rodando
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []); // Sem condição

// Cálculo a cada render
const expensive = heavyCalculation(data); // Sem memo
```

---

### 4. Segurança

#### ✅ Bom
```typescript
// Validação
const validate = (input: string) => {
  if (!input || input.length > 100) return false;
  return /^[a-zA-Z0-9 ]+$/.test(input);
};

// Sanitização
const sanitize = (input: string) => {
  return input.trim().replace(/[<>]/g, '');
};
```

#### ❌ Evitar
```typescript
// Sem validação
const process = (input: string) => {
  // Usar input diretamente
};

// Logar dados sensíveis
console.log('Payment:', { cardNumber, cvv });
```

---

### 5. Error Handling

#### ✅ Bom
```typescript
// Try-catch adequado
try {
  await processPayment();
} catch (error) {
  logger.error('payment_error', { error, orderId });
  Alert.alert('Erro', 'Falha ao processar pagamento.');
  // Fallback
  await offlineFallback();
}
```

#### ❌ Evitar
```typescript
// Sem tratamento
await processPayment(); // Pode quebrar

// Expor detalhes
catch (error) {
  Alert.alert('Erro', error.message); // Pode expor SQL, paths
}
```

---

## 💬 Comentários de Revisão

### Tom
- **Respeitoso:** "Sugestão: considerar..."
- **Construtivo:** "Isso funciona, mas podemos melhorar..."
- **Específico:** "Esta linha pode causar..."

### Formato
```markdown
**Sugestão:**
Considerar usar `useMemo` aqui para evitar recálculo.

**Motivo:**
Este cálculo roda a cada render e pode ser pesado.

**Alternativa:**
```typescript
const result = useMemo(() => calculate(data), [data]);
```
```

---

## 🚫 O Que NÃO Fazer

### ❌ Revisão Negativa
- "Isso está errado"
- "Você deveria saber isso"
- "Isso não funciona" (sem explicar)

### ❌ Revisão Vaga
- "Melhorar isso"
- "Não gostei"
- "Pode ser melhor"

### ❌ Revisão Pessoal
- Críticas pessoais
- Comparações com outros
- Julgamentos de valor

---

## ✅ O Que Fazer

### ✅ Revisão Construtiva
- "Sugestão: podemos melhorar..."
- "Isso funciona, mas considere..."
- "Alternativa: podemos usar..."

### ✅ Revisão Específica
- Apontar linha exata
- Explicar motivo
- Oferecer alternativa

### ✅ Revisão Educativa
- Explicar por quê
- Compartilhar conhecimento
- Sugerir recursos

---

## 🔄 Processo

### 1. Criar PR
- Descrição clara
- Checklist preenchido
- Testes passando

### 2. Revisar
- Verificar checklist
- Testar localmente (se possível)
- Comentar construtivamente

### 3. Aprovar
- Todos os itens OK
- Sem blockers
- Aprovação de 2+ reviewers (se necessário)

### 4. Merge
- Aprovações recebidas
- CI passando
- Conflitos resolvidos

---

## 📊 Métricas

### Tempo de Revisão
- **Ideal:** < 24 horas
- **Aceitável:** < 48 horas
- **Crítico:** < 4 horas

### Taxa de Aprovação
- **Primeira tentativa:** > 70%
- **Após feedback:** > 90%

---

## 🎓 Aprendizado

### Para Revisores
- Aprender com código de outros
- Compartilhar conhecimento
- Manter padrões

### Para Autores
- Aprender com feedback
- Melhorar continuamente
- Aplicar em próximos PRs

---

## 📚 Recursos

- **Contributing:** `CONTRIBUTING.md`
- **Code Examples:** `docs/CODE_EXAMPLES.md`
- **Common Patterns:** `docs/COMMON_PATTERNS.md`
- **Security:** `docs/SECURITY_BEST_PRACTICES.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
