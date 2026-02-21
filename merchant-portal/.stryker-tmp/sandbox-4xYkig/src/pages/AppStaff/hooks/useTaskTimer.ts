/**
 * P3-4: Task Timer Hook
 * 
 * Timer visual para tarefas em progresso
 */

import { useState, useEffect, useRef } from 'react';

export interface TaskTimerState {
    elapsedSeconds: number;
    isRunning: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
    formattedTime: string;
}

export function useTaskTimer(initialSeconds: number = 0): TaskTimerState {
    const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const start = () => setIsRunning(true);
    const stop = () => setIsRunning(false);
    const reset = () => {
        setElapsedSeconds(0);
        setIsRunning(false);
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        elapsedSeconds,
        isRunning,
        start,
        stop,
        reset,
        formattedTime: formatTime(elapsedSeconds),
    };
}
