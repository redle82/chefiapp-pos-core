import React from 'react';
import { cn } from './tokens';
import './Stepper.css';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

/**
 * Stepper: Onboarding progress indicator
 * Shows current step and allows navigation (if onStepChange provided)
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  className,
}) => {
  return (
    <div className={cn('stepper', className)}>
      <div className="stepper__track">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = onStepChange !== undefined;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <button
                className={cn(
                  'stepper__step',
                  isActive ? 'stepper__step--active' : '',
                  isCompleted ? 'stepper__step--completed' : '',
                  isClickable ? 'stepper__step--clickable' : ''
                )}
                onClick={() => isClickable && onStepChange(index)}
                disabled={!isClickable}
              >
                <span className="stepper__number">
                  {isCompleted ? '✓' : index + 1}
                </span>
              </button>

              {/* Connection line (except for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'stepper__line',
                    isCompleted ? 'stepper__line--completed' : ''
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step labels (below line, visible on larger screens) */}
      <div className="stepper__labels">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'stepper__label',
              index === currentStep ? 'stepper__label--active' : ''
            )}
          >
            <div className="stepper__label-title">{step.label}</div>
            {step.description && (
              <div className="stepper__label-description">{step.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
