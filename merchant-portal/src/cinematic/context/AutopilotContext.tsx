import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TASK_LIBRARY, type TaskDef } from '../data/taskLibrary';
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage';

export type BusinessType = 'restaurant' | 'burger' | 'cafe' | 'bar' | 'pizza' | 'other' | null;

interface AutopilotState {
    businessType: BusinessType;
    setBusinessType: (type: BusinessType) => void;
    brandGroup: string | null;
    setBrandGroup: (brand: string) => void;
    teamSize: number;
    setTeamSize: (size: number) => void;
    tasksEnabled: boolean;
    setTasksEnabled: (enabled: boolean) => void;
    staffDistribution: {
        kitchen: number;
        bar: number;
        floor: number;
        [key: string]: number;
    };
    setStaffDistribution: (dist: any) => void;
    activeTasks: TaskDef[];
    generateTasks: () => void;
    importTasks: (tasks: TaskDef[]) => void;
}

const AutopilotContext = createContext<AutopilotState | undefined>(undefined);

export const AutopilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE ---
    const [businessType, setBusinessType] = useState<BusinessType>(() => {
        return (getTabIsolated('chefiapp_businessType') as BusinessType) || null;
    });

    const [brandGroup, setBrandGroup] = useState<string | null>(() => {
        return getTabIsolated('chefiapp_brandGroup') || null;
    });

    const [teamSize, setTeamSize] = useState<number>(() => {
        return parseInt(getTabIsolated('chefiapp_teamSize') || '1', 10);
    });

    const [tasksEnabled, setTasksEnabled] = useState<boolean>(() => {
        return getTabIsolated('chefiapp_tasksEnabled') === 'true';
    });

    const [staffDistribution, setStaffDistribution] = useState<any>(() => {
        const saved = getTabIsolated('chefiapp_staffDist');
        return saved ? JSON.parse(saved) : { kitchen: 0, bar: 0, floor: 0 };
    });

    const [activeTasks, setActiveTasks] = useState<TaskDef[]>(() => {
        const saved = getTabIsolated('chefiapp_activeTasks');
        return saved ? JSON.parse(saved) : [];
    });

    // --- PERSISTENCE EFFECT ---
    useEffect(() => {
        if (businessType) setTabIsolated('chefiapp_businessType', businessType);
        if (brandGroup) setTabIsolated('chefiapp_brandGroup', brandGroup);
        setTabIsolated('chefiapp_teamSize', teamSize.toString());
        setTabIsolated('chefiapp_tasksEnabled', String(tasksEnabled));
        setTabIsolated('chefiapp_staffDist', JSON.stringify(staffDistribution));
        setTabIsolated('chefiapp_activeTasks', JSON.stringify(activeTasks));
    }, [businessType, brandGroup, teamSize, tasksEnabled, staffDistribution, activeTasks]);

    // --- LOGIC ---
    const generateTasks = () => {
        if (!businessType) return;

        // Filter compatible tasks
        const filtered = TASK_LIBRARY.filter(task => {
            if (task.businessTypes !== 'all' && !task.businessTypes?.includes(businessType as any)) return false;
            // Add size logic later
            return true;
        });

        setActiveTasks(filtered);
    };

    const importTasks = (tasks: TaskDef[]) => {
        setActiveTasks(tasks);
    };

    return (
        <AutopilotContext.Provider value={{
            businessType,
            setBusinessType,
            brandGroup,
            setBrandGroup,
            teamSize,
            setTeamSize,
            tasksEnabled,
            setTasksEnabled,
            staffDistribution,
            setStaffDistribution,
            activeTasks,
            generateTasks,
            importTasks
        }}>
            {children}
        </AutopilotContext.Provider>
    );
};

export const useAutopilot = () => {
    const context = useContext(AutopilotContext);
    if (!context) {
        throw new Error('useAutopilot must be used within an AutopilotProvider');
    }
    return context;
};
