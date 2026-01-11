import React, { useEffect } from 'react';
import { useStaff } from './context/StaffContext';
import { StaffLayout } from '../../ui/design-system/layouts/StaffLayout';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { useToast } from '../../ui/design-system';
import { ShiftForecastWidget } from '../../ui/design-system/ShiftForecastWidget';

export const WorkerTaskStream: React.FC = () => {
    // Destructure completeTask here
    const { tasks, startTask, completeTask, checkOut, activeWorkerId, activeRole, shiftMetrics, forecast } = useStaff();
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

            {/* EMPTY STATE */}
            {activeTasks.length === 0 && (
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
