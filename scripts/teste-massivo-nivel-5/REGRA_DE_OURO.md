# Regra de Ouro — Teste Massivo Nível 5

**Durante o teste:**

## ❌ NÃO FAZER

- ❌ Não corrigir nada durante o teste
- ❌ Não "interpretar enquanto roda"
- ❌ Não ajustar parâmetros
- ❌ Não modificar código
- ❌ Não adicionar features
- ❌ Não melhorar UI
- ❌ Não otimizar performance

## ✅ FAZER

- ✅ Só coletar dados
- ✅ Só observar comportamento
- ✅ Só medir métricas
- ✅ Só documentar o que acontece

---

## 🎯 Objetivo

**Descobrir onde o motor começa a dobrar, ranger ou revelar potenciais ocultos.**

**Não é sobre:**
- Testar se funciona (já sabemos que funciona)
- Validar features (já foram validadas)

**É sobre:**
- Descobrir limites reais
- Revelar potenciais ocultos
- Definir o que a UI PRECISA ser

---

## 📊 Depois do Teste

**Congelar o motor:**
- ❌ Não mexer em Task Engine
- ❌ Não mexer em Core
- ❌ Não mexer em regras

**Ler os relatórios:**
1. `MAPA_POTENCIAL.md`
2. `MAPA_RISCO.md`
3. `LISTA_UI_CRITICA.md`
4. `LISTA_UI_RUIDO.md`

**Decidir:**
- Qual é a menor UI possível que respeita tudo que o sistema já faz bem?

---

**Conclusão:** Motor congelado. UI nasce dos dados. Pronto para descobrir.
