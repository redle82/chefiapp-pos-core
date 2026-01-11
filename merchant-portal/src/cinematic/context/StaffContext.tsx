import React, { createContext, useContext, useState, type ReactNode } from 'react';
// import { TASK_LIBRARY, type TaskDef } from '../data/taskLibrary';

// --- Types ---
export type WorkerRole = 'manager' | 'worker' | 'owner';

export interface Worker {
    id: string;
    name: string;
    pin: string;
    role: WorkerRole;
    isClockedIn: boolean;
}

export interface Shift {
    id: string;
    workerId: string;
    workerName: string;
    startTime: Date;
    endTime?: Date;
    activeTasks: string[]; // Task IDs
    riskLevel: 'low' | 'medium' | 'high';
}

interface StaffState {
    workers: Worker[];
    activeShifts: Shift[];
    currentUser: Worker | null;

    // Actions
    login: (pin: string) => boolean;
    logout: () => void;
    clockIn: () => void;
    clockOut: () => void;
    assignTask: (taskId: string) => void;
    assignTaskToRole: (roleId: string, taskId: string) => void;
    completeTask: (taskId: string) => void;
    resolveRisk: (shiftId: string) => void;

    // Computed
    managerStats: {
        activeWorkers: number;
        totalRisks: number;
        complianceAlerts: number;
    };
    ownerStats: {
        totalStaff: number;
        shiftsToday: number;
        complianceScore: number;
        systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    };
    initializeFromContract: (contract: any) => void;
}

// --- Mock Data ---
const MOCK_WORKERS: Worker[] = [
    { id: 'w1', name: 'João Silva', pin: '1234', role: 'worker', isClockedIn: false },
    { id: 'w2', name: 'Maria Santos', pin: '1111', role: 'manager', isClockedIn: true },
    { id: 'w3', name: 'Carlos Dono', pin: '9999', role: 'owner', isClockedIn: true },
    { id: 'w4', name: 'Pedro Costa', pin: '2222', role: 'worker', isClockedIn: false },
    { id: 'w5', name: 'Ana Oliveira', pin: '3333', role: 'worker', isClockedIn: false },
];

const StaffContext = createContext<StaffState | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [workers, setWorkers] = useState<Worker[]>(MOCK_WORKERS);
    const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
    const [currentUser, setCurrentUser] = useState<Worker | null>(null);

    // Computed Stats
    const activeWorkersCount = workers.filter(w => w.isClockedIn).length;
    const highRiskShifts = activeShifts.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium').length;

    // Simple logic for Owner Stats
    const totalStaff = workers.length;
    const shiftsToday = activeShifts.length;

    // Derived Health
    const systemHealth = highRiskShifts > 2 ? 'warning' : 'good';

    const managerStats = {
        activeWorkers: activeWorkersCount,
        totalRisks: highRiskShifts,
        complianceAlerts: 0
    };

    const ownerStats = {
        totalStaff,
        shiftsToday,
        complianceScore: 98,
        systemHealth: systemHealth as 'excellent' | 'good' | 'warning' | 'critical'
    };

    // State
    // const [assignedTasks, setAssignedTasks] = useState<Record<string, TaskDef[]>>({});

    const assignTaskToRole = (roleId: string, taskId: string) => {
        // Find task definition
        console.log("Assigning", taskId, "to", roleId);
    };

     
    // const removeTask = (roleId: string, taskId: string) => {};

    const login = (pin: string) => {
        const user = workers.find(w => w.pin === pin);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const clockIn = () => {
        if (!currentUser) return;
        if (currentUser.isClockedIn) return;

        const newShift: Shift = {
            id: `shift-${Date.now()}`,
            workerId: currentUser.id,
            workerName: currentUser.name,
            startTime: new Date(),
            activeTasks: [],
            riskLevel: 'low'
        };

        setActiveShifts(prev => [...prev, newShift]);

        setWorkers(prev => prev.map(w => w.id === currentUser.id ? { ...w, isClockedIn: true } : w));
        setCurrentUser(prev => prev ? { ...prev, isClockedIn: true } : null);
    };

    const clockOut = () => {
        if (!currentUser) return;

        setActiveShifts(prev => prev.map(s =>
            s.workerId === currentUser.id && !s.endTime
                ? { ...s, endTime: new Date() }
                : s
        ));

        setWorkers(prev => prev.map(w => w.id === currentUser.id ? { ...w, isClockedIn: false } : w));
        setCurrentUser(prev => prev ? { ...prev, isClockedIn: false } : null);
    };

     
     
    const assignTask = (taskId: string) => {
        // Logic to assign task to current shift
        console.log("Assigning task", taskId);
    };

     
    const completeTask = (taskId: string) => {
        // Logic to mark task complete
        console.log("Completing task", taskId);
    };

    const resolveRisk = (shiftId: string) => {
        setActiveShifts(prev => prev.map(s =>
            s.id === shiftId ? { ...s, riskLevel: 'low' } : s
        ));
    };

    // --- Bootstrap ---
    const initializeFromContract = (contract: any) => {
        const staff = contract.staffProfile;

        console.log("StaffCore: Bootstrapping from Contract", staff);

        // Example: Generate placeholder workers if empty
        if (workers.length <= 5) {
            // Logic to create slots based on staff.distribution
        }
    };

    return (
        <StaffContext.Provider value={{
            workers,
            activeShifts,
            currentUser,
            login,
            logout,
            clockIn,
            clockOut,
            assignTask,
            assignTaskToRole,
            completeTask,
            resolveRisk,
            managerStats,
            ownerStats,
            initializeFromContract
        }}>
            {children}
        </StaffContext.Provider>
    );
};

export const useStaff = () => {
    const context = useContext(StaffContext);
    if (!context) {
        throw new Error('useStaff must be used within a StaffProvider');
    }
    return context;
};
