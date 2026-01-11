import React, { useEffect } from 'react';
import { useStaff } from './context/StaffContext';
import { StaffLayout } from '../../ui/design-system/layouts/StaffLayout';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { useToast } from '../../ui/design-system';
import { ShiftForecastWidget } from '../../ui/design-system/ShiftForecastWidget';
import { useTableAlerts } from './hooks/useTableAlerts';
import { useTraining } from '../../intelligence/education/TrainingContext';
import { useContextualSuggestions } from './hooks/useContextualSuggestions';

export const WorkerTaskStream: React.FC = () => {
    // Destructure completeTask here
    const { tasks, startTask, completeTask, checkOut, activeWorkerId, activeRole, shiftMetrics, forecast } = useStaff();
    const { alerts } = useTableAlerts(); // FASE 2: Alertas automáticos
    const { suggestions } = useContextualSuggestions(); // FASE 2: Sugestões contextuais
    const { activeLesson, completeLesson, dismissLesson } = useTraining();
    const { success } = useToast();

    // Listen for task completion events (dopamine feedback)
    useEffect(() => {
        const handleTaskComplete = (e: CustomEvent<{ message: string; taskTitle?: string }>) => {
            success(e.detail.message);
        };

        window.addEventListener('staff-task-complete', handleTaskComplete as EventListener);
        return () => window.removeEventListener('staff-task-complete', handleTaskComplete as EventListener);
    }, [success]);

    // Filter tasks relevant to view
    const activeTasks = tasks.filter(t => t.status !== 'done');

    return (
        <StaffLayout
            title="Minhas Tarefas"
            userName={activeWorkerId || 'Staff'}
            role={activeRole}
            status="active"
            actions={
                <Button
                    tone="destructive"
                    variant="outline"
                    fullWidth
                    onClick={checkOut}
                >
                    Encerrar Turno
                </Button>
            }
        >
            {/* SHIFT HEALTH - PHASE B - Always visible */}
            <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <ShiftHealthWidget metrics={shiftMetrics} />
                </div>
                {/* FORECAST - PHASE D */}
                <div style={{ flex: 1 }}>
                    <ShiftForecastWidget pressure={forecast.pressure} prediction={forecast.prediction} />
                </div>
            </div>

            {/* TRAINING CARD - PHASE C - Contextual */}
            {activeLesson && (
                <LessonCard
                    lesson={activeLesson}
                    onComplete={completeLesson}
                    onDismiss={dismissLesson}
                />
            )}

            {/* FASE 2: ALERTAS DE MESAS */}
            {alerts.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107' }}>
                    <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>⚠️ Alertas de Mesas</Text>
                    {alerts.map(alert => (
                        <div key={alert.tableId} style={{ marginBottom: 4 }}>
                            <Text size="xs" color={alert.severity === 'error' ? 'error' : 'warning'}>
                                {alert.message}
                            </Text>
                        </div>
                    ))}
                </div>
            )}

            {/* FASE 2: SUGESTÕES CONTEXTUAIS */}
            {suggestions.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#e3f2fd', borderRadius: 8, border: '1px solid #2196f3' }}>
                    <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>💡 Sugestões</Text>
                    {suggestions.slice(0, 3).map(suggestion => (
                        <div key={suggestion.id} style={{ marginBottom: 8, padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                                <Text size="sm">{suggestion.icon || '💡'}</Text>
                                <div style={{ flex: 1 }}>
                                    <Text size="sm" weight="bold">{suggestion.title}</Text>
                                    <Text size="xs" color="tertiary" style={{ marginTop: 4, display: 'block' }}>
                                        {suggestion.description}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {activeTasks.length === 0 && alerts.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                    <Text size="xl">✅</Text>
                    <Text size="md" weight="bold" color="primary" style={{ marginTop: 12 }}>Tudo em dia</Text>
                    <Text size="xs" color="tertiary">Aguardando novas atribuições...</Text>
                </div>
            )}

            {/* TASK LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        taskId={task.id}
                        title={task.title}
                        description={task.description}
                        status={task.status === 'focused' ? 'in-progress' : 'pending'}
                        priority={task.priority}
                        assignedAt={new Date(task.createdAt)}
                        onAction={(action) => {
                            if (action === 'start') startTask(task.id);
                            if (action === 'complete') completeTask(task.id);
                        }}
                    />
                ))}
            </div>
        </StaffLayout>
    );
};
