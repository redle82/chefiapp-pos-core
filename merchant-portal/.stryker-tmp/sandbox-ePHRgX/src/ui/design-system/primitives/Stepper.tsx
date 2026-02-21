// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { Text } from './Text';

interface Step {
    id: string;
    label: string;
    isCompleted: boolean;
    isActive: boolean;
}

interface StepperProps {
    steps: Step[];
}

export const Stepper: React.FC<StepperProps> = ({ steps }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginBottom: 32 }}>
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
                        {/* Step Circle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            opacity: step.isActive ? 1 : step.isCompleted ? 0.8 : 0.4
                        }}>
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: radius.full,
                                backgroundColor: step.isActive ? colors.palette.amber[500] :
                                    step.isCompleted ? colors.palette.amber[500] :
                                        colors.surface.layer2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${step.isActive ? colors.palette.amber[500] : colors.border.subtle}`,
                                color: colors.text.inverse
                            }}>
                                <Text size="xs" weight="bold" style={{ color: 'inherit' }}>
                                    {step.isCompleted ? '✓' : (index + 1).toString()}
                                </Text>
                            </div>
                            <Text
                                size="sm"
                                weight={step.isActive ? "bold" : "regular"}
                                color={step.isActive ? "primary" : "tertiary"}
                                style={{ whiteSpace: 'nowrap', display: window.innerWidth < 640 ? 'none' : 'block' }} // Hide label on mobile
                            >
                                {step.label}
                            </Text>
                        </div>

                        {/* Connector Line */}
                        {!isLast && (
                            <div style={{
                                height: 1,
                                flex: 1,
                                margin: '0 12px',
                                backgroundColor: step.isCompleted ? colors.palette.amber[500] : colors.border.subtle,
                                opacity: step.isCompleted ? 0.5 : 0.2
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
