// @ts-nocheck

import { calculatePressure } from '../src/intelligence/forecast/PressureForecast';
import { getShiftPrediction } from '../src/intelligence/forecast/ShiftPredictor';

console.log('🧪 Verifying Forecast Logic...');

// 1. Pressure Logic
console.log('📉 Testing Pressure Index...');

const lowPressure = calculatePressure(5, 2, 10); // 5 orders * 10 min = 50 min work / 2 staff = 25
// Index 25 -> Thresholds: <15 Calm, <30 Tension, >30 Peak
console.log(`Low: ${lowPressure.pressureIndex} (${lowPressure.status})`);
if (lowPressure.status !== 'tension') throw new Error('Low pressure check failed (Expected Tension 25)');

const highPressure = calculatePressure(10, 1, 10); // 100 min work / 1 staff = 100
console.log(`High: ${highPressure.pressureIndex} (${highPressure.status})`);
if (highPressure.status !== 'peak') throw new Error('High pressure check failed');


// 2. Prediction Logic
console.log('🔮 Testing Shift Predictor...');
// Mock Date: 12:30 (Near 13:00 Peak)
const mockDate = new Date();
mockDate.setHours(12, 30, 0, 0);

const prediction = getShiftPrediction(mockDate);
console.log(`Prediction at 12:30 -> ${prediction.message}`);

if (prediction.minutesToPeak !== 30) throw new Error('Prediction time diff failed');
if (prediction.predictedIntensity !== 'high') throw new Error('Prediction intensity failed');

console.log('✅ Forecast Logic Verified.');
