# Test Task Packs Level 1 - Relatório

**Data:** 2026-01-26 17:05:17  
**Status:** ❌ FALHOU

---

## 📊 Resumo

- **Testes Passados:** 9
- **Testes Falhados:** 1
- **Total de Tarefas Abertas:** 19
- **Tarefas Agendadas:** 19
- **Tarefas por Evento:** 

---

## ✅ Etapas Validadas

### 1. Migrations
- ✅ Migration create_task_packs aplicada
- ✅ Migration seed_task_packs aplicada
- ✅ RPC generate_scheduled_tasks criado
- ✅ RPC generate_tasks_from_orders atualizado

### 2. Seeds
- ✅ 4 packs criados (ops.core.v1, ops.kitchen.v1, ops.bar.v1, compliance.eu.generic.v1)
- ✅ 25 templates criados
- ✅ 4 packs ativados no restaurante piloto

### 3. Tarefas Agendadas
- ✅ 19 tarefas agendadas criadas

### 4. Tarefas por Eventos
- ✅ Tarefa ATRASO_ITEM criada para item atrasado

### 5. Validação Final
- ✅ 19 tarefas abertas no total

---

## 📋 Detalhes

### Packs Criados
```
compliance.eu.generic.v1|Compliance EU Genérico|1.0.0|EU|SOLO
ops.bar.v1|Operações Bar|1.0.0||SOLO
ops.core.v1|Operações Core|1.0.0||SOLO
ops.kitchen.v1|Operações Cozinha|1.0.0||SOLO
```

### Templates por Pack
```
compliance.eu.generic.v1|5
ops.bar.v1|5
ops.core.v1|10
ops.kitchen.v1|5
```

### Tarefas Criadas
```
ITEM_CRITICO|BAR|MEDIA|5
ITEM_CRITICO|KITCHEN|MEDIA|3
ITEM_CRITICO||MEDIA|5
ITEM_CRITICO|KITCHEN|CRITICA|3
ITEM_CRITICO|BAR|ALTA|1
ITEM_CRITICO|KITCHEN|ALTA|2
```

---

## 🎯 Conclusão

❌ **Alguns testes falharam.** Verificar logs para detalhes.

**Próximos passos:**
- Validar UI no KDSMinimal
- Validar UI no AppStaffMinimal
- Testar evidências (TEMP_LOG, PHOTO, TEXT)
- Expandir para outros países/regiões

