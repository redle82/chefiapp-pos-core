// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MicroLesson } from './MicroLessonEngine';
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface TrainingContextType {
    activeLesson: MicroLesson | null;
    triggerLesson: (lesson: MicroLesson) => void;
    dismissLesson: () => void;
    completeLesson: () => void;
    learnedSkills: string[]; // IDs of completed lessons
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export const TrainingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeLesson, setActiveLesson] = useState<MicroLesson | null>(null);
    const [learnedSkills, setLearnedSkills] = useState<string[]>([]);

    // Persist learned skills (Mock persistence for now)
    useEffect(() => {
        const saved = getTabIsolated('staff_learned_skills');
        if (saved) setLearnedSkills(JSON.parse(saved));
    }, []);

    const triggerLesson = (lesson: MicroLesson) => {
        // Don't interrupt if already learning, unless urgent? For now, queueing not implemented.
        if (!activeLesson && !learnedSkills.includes(lesson.id)) {
            setActiveLesson(lesson);
        }
    };

    const dismissLesson = () => {
        setActiveLesson(null);
    };

    const completeLesson = () => {
        if (activeLesson) {
            const newSkills = [...learnedSkills, activeLesson.id];
            setLearnedSkills(newSkills);
            setTabIsolated('staff_learned_skills', JSON.stringify(newSkills));
            setActiveLesson(null);
        }
    };

    return (
        <TrainingContext.Provider value={{
            activeLesson,
            triggerLesson,
            dismissLesson,
            completeLesson,
            learnedSkills
        }}>
            {children}
        </TrainingContext.Provider>
    );
};

export const useTraining = () => {
    const context = useContext(TrainingContext);
    if (!context) throw new Error('useTraining must be used within TrainingProvider');
    return context;
};
