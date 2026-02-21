/**
 * TaskMentor - Ligação Task ↔ Mentoria IA
 * 
 * IA observa tarefas, identifica padrões e sugere otimizações
 */
// @ts-nocheck


import { taskAnalytics } from './TaskAnalytics';
import { taskFiltering } from './TaskFiltering';
import type { Task } from './TaskFiltering';

export interface TaskSuggestion {
  type: 'optimization' | 'alert' | 'recommendation';
  priority: 'low' | 'normal' | 'high' | 'critical';
  title: string;
  description: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class TaskMentor {
  /**
   * Analisar tarefas e gerar sugestões
   */
  async analyzeAndSuggest(restaurantId: string): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = [];

    // 1. Analisar padrões
    const analytics = await taskAnalytics.analyze(restaurantId);

    // 2. Identificar problemas
    if (analytics.overdueTasks > 0) {
      suggestions.push({
        type: 'alert',
        priority: analytics.overdueTasks > 5 ? 'critical' : 'high',
        title: `${analytics.overdueTasks} tarefas atrasadas`,
        description: `Você tem ${analytics.overdueTasks} tarefas atrasadas. Considere revisar a carga de trabalho ou ajustar prazos.`,
        action: 'Ver tarefas atrasadas',
        metadata: { overdueCount: analytics.overdueTasks },
      });
    }

    // 3. Identificar top delayers
    if (analytics.topDelayers.length > 0) {
      const topDelayer = analytics.topDelayers[0];
      if (topDelayer.delayCount > 3) {
        suggestions.push({
          type: 'recommendation',
          priority: 'high',
          title: `Funcionário com muitos atrasos: ${topDelayer.employeeName}`,
          description: `${topDelayer.employeeName} tem ${topDelayer.delayCount} tarefas atrasadas. Considere oferecer suporte ou revisar atribuições.`,
          action: 'Ver histórico do funcionário',
          metadata: { employeeId: topDelayer.employeeId },
        });
      }
    }

    // 4. Identificar tarefas ignoradas
    if (analytics.ignoredTasks.length > 0) {
      const ignoredTask = analytics.ignoredTasks[0];
      suggestions.push({
        type: 'alert',
        priority: 'high',
        title: `Tarefa frequentemente ignorada: ${ignoredTask.title}`,
        description: `Esta tarefa foi ignorada ${ignoredTask.ignoredCount} vezes. Considere revisar sua importância ou frequência.`,
        action: 'Revisar tarefa',
        metadata: { taskId: ignoredTask.taskId },
      });
    }

    // 5. Otimizações por categoria
    for (const [category, perf] of Object.entries(analytics.performanceByCategory)) {
      if (perf.completed > 0 && perf.averageDelay > 30) {
        suggestions.push({
          type: 'optimization',
          priority: 'normal',
          title: `Categoria "${category}" com atrasos médios`,
          description: `Tarefas da categoria "${category}" têm atraso médio de ${Math.round(perf.averageDelay)} minutos. Considere ajustar prazos ou recursos.`,
          metadata: { category, averageDelay: perf.averageDelay },
        });
      }
    }

    // 6. Taxa de conclusão baixa
    if (analytics.completionRate < 70 && analytics.totalTasks > 10) {
      suggestions.push({
        type: 'alert',
        priority: 'high',
        title: 'Taxa de conclusão baixa',
        description: `Apenas ${Math.round(analytics.completionRate)}% das tarefas estão sendo concluídas. Isso pode indicar sobrecarga ou prazos irrealistas.`,
        action: 'Revisar sistema de tarefas',
        metadata: { completionRate: analytics.completionRate },
      });
    }

    return suggestions;
  }

  /**
   * Observar tarefa específica e sugerir
   */
  async observeTask(task: Task): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = [];
    const now = new Date();
    const dueAt = new Date(task.dueAt);
    const minutesUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60);

    // Tarefa crítica próxima do prazo
    if (task.priority === 'critical' && minutesUntilDue > 0 && minutesUntilDue < 30) {
      suggestions.push({
        type: 'alert',
        priority: 'critical',
        title: `Tarefa crítica próxima do prazo: ${task.title}`,
        description: `Esta tarefa crítica vence em ${Math.round(minutesUntilDue)} minutos. Priorize sua conclusão.`,
        action: 'Ver tarefa',
        metadata: { taskId: task.id },
      });
    }

    // Tarefa atrasada
    if (minutesUntilDue < 0 && task.status !== 'completed') {
      suggestions.push({
        type: 'alert',
        priority: 'high',
        title: `Tarefa atrasada: ${task.title}`,
        description: `Esta tarefa está atrasada há ${Math.round(Math.abs(minutesUntilDue))} minutos.`,
        action: 'Ver tarefa',
        metadata: { taskId: task.id, delayMinutes: Math.abs(minutesUntilDue) },
      });
    }

    return suggestions;
  }

  /**
   * Sugerir otimizações baseadas em padrões
   */
  async suggestOptimizations(restaurantId: string): Promise<TaskSuggestion[]> {
    const analytics = await taskAnalytics.analyze(restaurantId);
    const suggestions: TaskSuggestion[] = [];

    // Sugerir ajuste de prazos se muitos atrasos
    if (analytics.averageCompletionTime > 60) {
      suggestions.push({
        type: 'optimization',
        priority: 'normal',
        title: 'Ajustar prazos de tarefas',
        description: `O tempo médio de conclusão é ${Math.round(analytics.averageCompletionTime)} minutos além do prazo. Considere aumentar os prazos em 30-50%.`,
        action: 'Revisar prazos',
      });
    }

    // Sugerir redistribuição se muitos atrasos de um funcionário
    if (analytics.topDelayers.length > 0) {
      const topDelayer = analytics.topDelayers[0];
      if (topDelayer.delayCount > analytics.totalTasks * 0.2) {
        suggestions.push({
          type: 'optimization',
          priority: 'high',
          title: 'Redistribuir tarefas',
          description: `${topDelayer.employeeName} está sobrecarregado. Considere redistribuir algumas tarefas para outros funcionários.`,
          action: 'Revisar atribuições',
          metadata: { employeeId: topDelayer.employeeId },
        });
      }
    }

    return suggestions;
  }
}

export const taskMentor = new TaskMentor();
