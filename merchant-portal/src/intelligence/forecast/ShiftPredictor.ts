
export interface ShiftPrediction {
    nextPeakTime: string | null; // HH:MM
    minutesToPeak: number | null;
    predictedIntensity: 'medium' | 'high' | 'chaos';
    message: string | null;
}

// Mock Historical Knowledge (In real app, this comes from DB analysis)
const KNOWN_PEAKS = [
    { time: '13:00', intensity: 'high' },
    { time: '20:30', intensity: 'chaos' }
];

export function getShiftPrediction(currentDate: Date): ShiftPrediction {
    const currentHour = currentDate.getHours();
    const currentMin = currentDate.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;

    let nextPeak = null;
    let minDiff = Infinity;

    for (const peak of KNOWN_PEAKS) {
        const [h, m] = peak.time.split(':').map(Number);
        const peakTotalMinutes = h * 60 + m;

        const diff = peakTotalMinutes - currentTotalMinutes;

        // Only look ahead up to 2 hours (120 mins)
        if (diff > 0 && diff <= 120 && diff < minDiff) {
            minDiff = diff;
            nextPeak = peak;
        }
    }

    if (nextPeak) {
        return {
            nextPeakTime: nextPeak.time,
            minutesToPeak: minDiff,
            predictedIntensity: nextPeak.intensity as any,
            message: `Pico previsto às ${nextPeak.time} (${minDiff} min)`
        };
    }

    return {
        nextPeakTime: null,
        minutesToPeak: null,
        predictedIntensity: 'medium',
        message: null
    };
}
