import React, { useState } from 'react';
import { Step1_TheHook } from './Step1_TheHook';
import { Step2_TheBridge } from './Step2_TheBridge';
import { Step3_TheImport } from './Step3_TheImport';
import { Step4_TheReveal } from './Step4_TheReveal';
import './MigrationWizard.css';

export type MigrationStep = 'HOOK' | 'BRIDGE' | 'IMPORT' | 'REVEAL';

export const MigrationWizard: React.FC = () => {
    const [step, setStep] = useState<MigrationStep>('HOOK');
    const [migrationSource, setMigrationSource] = useState<'NONE' | 'GLORIAFOOD' | 'OTHER'>('NONE');

    const handleHookSelection = (source: 'NONE' | 'GLORIAFOOD' | 'OTHER') => {
        setMigrationSource(source);
        if (source === 'GLORIAFOOD') {
            setStep('BRIDGE');
        } else if (source === 'OTHER') {
            setStep('IMPORT');
        } else {
            // User selected "Starting Fresh" - logic to exit wizard or skip to standard setup
            console.log("User starting fresh, skip migration.");
            // For now, maybe just redirect or show a "Good Luck" message
            // navigate('/dashboard'); 
        }
    };

    const handleBridgeComplete = () => {
        setStep('IMPORT');
    };

    const handleImportComplete = () => {
        setStep('REVEAL');
    };

    return (
        <div className="migration-wizard-container">
            <div className="migration-progress">
                <div className={`progress-dot ${step === 'HOOK' ? 'active' : 'completed'}`} />
                <div className="progress-line" />
                <div className={`progress-dot ${step === 'BRIDGE' ? 'active' : step === 'HOOK' ? '' : 'completed'}`} />
                <div className="progress-line" />
                <div className={`progress-dot ${step === 'IMPORT' ? 'active' : (step === 'REVEAL' ? 'completed' : '')}`} />
                <div className="progress-line" />
                <div className={`progress-dot ${step === 'REVEAL' ? 'active' : ''}`} />
            </div>

            <div className="migration-content">
                {step === 'HOOK' && <Step1_TheHook onSelect={handleHookSelection} />}
                {step === 'BRIDGE' && <Step2_TheBridge onNext={handleBridgeComplete} />}
                {step === 'IMPORT' && <Step3_TheImport onNext={handleImportComplete} />}
                {step === 'REVEAL' && <Step4_TheReveal />}
            </div>
        </div>
    );
};
