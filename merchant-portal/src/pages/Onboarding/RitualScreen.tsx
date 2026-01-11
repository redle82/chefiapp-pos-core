
import React from 'react';
import { OnboardingLayout } from '../../ui/design-system/layouts/OnboardingLayout';
import { useOnboarding } from './OnboardingState';

interface RitualAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

interface RitualScreenProps {
    id: string; // The step ID (e.g., 'identity', 'existence')
    title: string;
    subtitle: string;
    primaryAction?: RitualAction;
    secondaryAction?: RitualAction;
    children: React.ReactNode;
}

export const useStepConfig = (currentId: string) => {
    const steps = [
        { id: 'identity', label: 'Reconhecimento' },
        { id: 'existence', label: 'Realidade' },
        { id: 'authority', label: 'Soberania' },
        { id: 'topology', label: 'Pilar: Território' },
        { id: 'flow', label: 'Pilar: Ritmo' },
        { id: 'cash', label: 'Ritual: Caixa' },
        { id: 'team', label: 'Ritual: Equipe' },
        { id: 'consecration', label: 'Ativação Final' }
    ];

    return steps.map(s => ({
        ...s,
        isActive: s.id === currentId,
        isCompleted: false // Logic can be enhanced later reading from Draft?
    }));
};

export const RitualScreen: React.FC<RitualScreenProps> = ({
    id,
    title,
    subtitle,
    primaryAction,
    secondaryAction,
    children
}) => {
    const { entryContext } = useOnboarding();

    // Internal App context often implies a different flow or skips steps, 
    // but the Ritual Screen logic allows overriding if needed.
    // For now, we stick to the standard sequence.

    // FOE: 'invite' and 'foundation' are special states without the ritual sidebar
    const hideSteps = id === 'invite' || id === 'foundation' || entryContext === 'internal_app';
    const steps = hideSteps ? [] : useStepConfig(id);

    return (
        <OnboardingLayout
            title={title}
            subtitle={subtitle}
            steps={steps}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
        >
            {children}
        </OnboardingLayout>
    );
};
