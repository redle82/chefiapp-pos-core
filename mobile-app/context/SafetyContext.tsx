import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppStaff } from './AppStaffContext';
import { supabase } from '@/services/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type ControlCategory = 'temperature' | 'hygiene' | 'maintenance' | 'safety';
export type ControlType = 'numeric' | 'boolean' | 'photo';
export type LogStatus = 'ok' | 'warning' | 'critical';

export interface ValidationRules {
    min?: number;
    max?: number;
    expected?: boolean;
    unit?: string;
}

// Orchestration Types
export type ShiftPhase =
    | 'opening'
    | 'pre_service'
    | 'service'
    | 'low_traffic'
    | 'mid_shift'
    | 'post_prep'
    | 'delivery_arrival'
    | 'closing'
    | 'post_service';

export type OperationalState = 'normal' | 'peak_rush' | 'emergency';
export type Blocker =
    | 'peak_hours'
    | 'peak_rush'
    | 'active_ticket'
    | 'service'
    | 'rush_mode'
    | 'none';

export interface OrchestrationConfig {
    validPhases: ShiftPhase[];
    blockedBy: Blocker[];
    priority: 'routine' | 'compliance' | 'mandatory';
    recurrence: 'daily' | 'start_of_shift' | 'end_of_shift' | 'weekly';
}

export interface SafetyControl {
    id: string;
    category: ControlCategory;
    target: string;
    type: ControlType;
    validationRules: ValidationRules;
    orchestration: OrchestrationConfig; // Replaces 'frequency'
    instructions: string;
}

export interface SafetyLog {
    id: string;
    controlId: string;
    value: number | boolean | string;
    status: LogStatus;
    timestamp: Date;
    userId: string;
    shiftId?: string;
}

interface SafetyContextData {
    controls: SafetyControl[];
    pendingChecks: SafetyControl[];
    submitLog: (controlId: string, value: number | boolean | string) => Promise<LogStatus>;
    getRecentLogs: (limit?: number) => SafetyLog[];
    currentPhase: ShiftPhase; // Exposed for UI
    isPeak: boolean; // Exposed for UI
}

const SafetyContext = createContext<SafetyContextData>({} as SafetyContextData);

export const useSafety = () => useContext(SafetyContext);

// ============================================================================
// MOCK ENGINE STATE
// ============================================================================
// In Phase 30, this comes from OrderContext velocity
const MOCK_PHASE: ShiftPhase = 'opening';
const MOCK_IS_PEAK = false;

// ============================================================================
// MOCK DATA (Structure Updated)
// ============================================================================
const MOCK_CONTROLS: SafetyControl[] = [
    // ❄️ 1. Cold Chain
    {
        id: 'C01', category: 'temperature', target: 'Congelador Principal', type: 'numeric',
        validationRules: { max: -18, unit: 'C' },
        orchestration: { validPhases: ['opening', 'closing'], blockedBy: ['peak_hours'], priority: 'mandatory', recurrence: 'daily' },
        instructions: 'Ideal ≤ -18°C. Verifique termostato.',
    },
    {
        id: 'C02', category: 'temperature', target: 'Congelador Secundário', type: 'numeric',
        validationRules: { max: -18, unit: 'C' },
        orchestration: { validPhases: ['opening'], blockedBy: ['peak_hours'], priority: 'routine', recurrence: 'daily' },
        instructions: 'Ideal ≤ -18°C.',
    },
    {
        id: 'C03', category: 'temperature', target: 'Geladeira Carnes', type: 'numeric',
        validationRules: { max: 4, unit: 'C' },
        orchestration: { validPhases: ['opening', 'pre_service'], blockedBy: ['peak_hours'], priority: 'mandatory', recurrence: 'daily' },
        instructions: 'Critico: Máx 4°C.',
    },
    {
        id: 'C04', category: 'temperature', target: 'Geladeira Peixes', type: 'numeric',
        validationRules: { max: 2, unit: 'C' },
        orchestration: { validPhases: ['opening', 'pre_service'], blockedBy: ['peak_hours'], priority: 'mandatory', recurrence: 'daily' },
        instructions: 'Critico: Máx 2°C. Gelo suficiente?',
    },
    {
        id: 'C05', category: 'temperature', target: 'Geladeira Laticínios', type: 'numeric',
        validationRules: { max: 8, unit: 'C' },
        orchestration: { validPhases: ['opening'], blockedBy: ['peak_hours'], priority: 'routine', recurrence: 'daily' },
        instructions: 'Máx 8°C.',
    },
    {
        id: 'C06', category: 'temperature', target: 'Bancada Fria (Mise)', type: 'numeric',
        validationRules: { max: 8, unit: 'C' },
        orchestration: { validPhases: ['pre_service'], blockedBy: ['active_ticket'], priority: 'mandatory', recurrence: 'start_of_shift' },
        instructions: 'Verifique antes de abastecer.',
    },
    {
        id: 'C07', category: 'temperature', target: 'Vitrine Expositora', type: 'numeric',
        validationRules: { max: 6, unit: 'C' },
        orchestration: { validPhases: ['opening', 'pre_service'], blockedBy: ['peak_hours'], priority: 'compliance', recurrence: 'daily' },
        instructions: 'Máx 6°C.',
    },

    // 🔥 2. Hot Chain
    {
        id: 'H01', category: 'temperature', target: 'Banho-Maria', type: 'numeric',
        validationRules: { min: 65, unit: 'C' },
        orchestration: { validPhases: ['pre_service'], blockedBy: ['peak_rush'], priority: 'mandatory', recurrence: 'start_of_shift' },
        instructions: 'Água deve estar acima de 65°C.',
    },
    {
        id: 'H05', category: 'maintenance', target: 'Óleo Fritura', type: 'photo', // Using photo for MVP/Polar strip
        validationRules: { expected: true },
        orchestration: { validPhases: ['opening'], blockedBy: ['service'], priority: 'compliance', recurrence: 'daily' },
        instructions: 'O óleo está escuro ou fumegando? (Troca se > 25% TPM)',
    },

    // 🧼 3. Hygiene & Sanitation
    {
        id: 'S01', category: 'hygiene', target: 'Bancadas', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['opening'], blockedBy: ['active_ticket'], priority: 'mandatory', recurrence: 'start_of_shift' },
        instructions: 'Limpass e sanitizadas com álcool 70%?',
    },
    {
        id: 'S02', category: 'hygiene', target: 'Tábuas e Facas', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['opening'], blockedBy: ['active_ticket'], priority: 'mandatory', recurrence: 'start_of_shift' },
        instructions: 'Utensílios em bom estado e limpos?',
    },
    {
        id: 'S04', category: 'hygiene', target: 'Lixeiras', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['closing'], blockedBy: ['none'], priority: 'routine', recurrence: 'end_of_shift' },
        instructions: 'Lixo retirado e lixeiras lavadas?',
    },
    {
        id: 'S07', category: 'hygiene', target: 'Pia de Mãos', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['opening', 'pre_service'], blockedBy: ['none'], priority: 'compliance', recurrence: 'start_of_shift' },
        instructions: 'Tem sabonete e papel toalha?',
    },

    // 📦 4. Traceability
    {
        id: 'T01', category: 'safety', target: 'Validades (Etiquetas)', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['closing'], blockedBy: ['none'], priority: 'compliance', recurrence: 'daily' },
        instructions: 'Todos produtos abertos estão etiquetados?',
    },
    {
        id: 'T02', category: 'safety', target: 'Loteamento Produção', type: 'boolean',
        validationRules: { expected: true },
        orchestration: { validPhases: ['post_service'], blockedBy: ['service'], priority: 'routine', recurrence: 'daily' },
        instructions: 'Mise-en-place etiquetado com data de hoje?',
    }
];

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeRole, shiftId } = useAppStaff();
    const [controls, setControls] = useState<SafetyControl[]>(MOCK_CONTROLS);
    const [logs, setLogs] = useState<SafetyLog[]>([]);

    // Engine State
    const [currentPhase, setCurrentPhase] = useState<ShiftPhase>(MOCK_PHASE);
    const [isPeak, setIsPeak] = useState<boolean>(MOCK_IS_PEAK);

    // Filter Logic (The Engine)
    const pendingChecks = controls.filter(c => {
        // 1. Phase Check
        if (!c.orchestration.validPhases.includes(currentPhase)) return false;

        // 2. Blocker Check
        if (isPeak && c.orchestration.blockedBy.includes('peak_hours')) return false;

        // 3. Done Check (Mock)
        const isDone = logs.some(l => l.controlId === c.id); // Simple check for now
        return !isDone;
    });

    const submitLog = async (controlId: string, value: number | boolean | string) => {
        const control = controls.find(c => c.id === controlId);
        if (!control) throw new Error('Control not found');

        let status: LogStatus = 'ok';
        if (control.type === 'numeric') {
            const num = Number(value);
            if (control.validationRules.max !== undefined && num > control.validationRules.max) status = 'warning';
            if (control.validationRules.min !== undefined && num < control.validationRules.min) status = 'warning';
        } else if (control.type === 'boolean') {
            if (value !== control.validationRules.expected) status = 'critical';
        }

        const newLog: SafetyLog = {
            id: Math.random().toString(36).substr(2, 9),
            controlId,
            value,
            status,
            timestamp: new Date(),
            userId: 'current-user',
            shiftId: shiftId || undefined
        };

        setLogs(prev => [newLog, ...prev]);
        return status;
    };

    const getRecentLogs = (limit = 10) => {
        return logs.slice(0, limit);
    };

    return (
        <SafetyContext.Provider value={{
            controls,
            pendingChecks,
            submitLog,
            getRecentLogs,
            currentPhase,
            isPeak
        }}>
            {children}
        </SafetyContext.Provider>
    );
};
