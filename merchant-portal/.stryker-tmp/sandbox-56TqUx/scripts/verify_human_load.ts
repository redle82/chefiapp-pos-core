// @ts-nocheck

import { calculateShiftLoad } from '../src/intelligence/nervous-system/ShiftEngine';

console.log('🧪 Verifying Human Load Logic...');

// 1. Healthy State (0.5 Load)
const healthy = calculateShiftLoad(1, 2);
console.log(`[Green] 1 Task / 2 Staff = ${healthy.loadIndex} (${healthy.status})`);

if (healthy.status !== 'green' || healthy.loadIndex !== 0.5) throw new Error('Healthy check failed');

// 2. Attention State (1.5 Load)
const attention = calculateShiftLoad(3, 2);
console.log(`[Yellow] 3 Tasks / 2 Staff = ${attention.loadIndex} (${attention.status})`);

if (attention.status !== 'yellow' || attention.loadIndex !== 1.5) throw new Error('Attention check failed');

// 3. Critical State (3.0 Load)
const critical = calculateShiftLoad(3, 1);
console.log(`[Red] 3 Tasks / 1 Staff = ${critical.loadIndex} (${critical.status})`);

if (critical.status !== 'red' || critical.loadIndex !== 3.0) throw new Error('Critical check failed');

// 4. Zero Staff Protection
const zero = calculateShiftLoad(5, 0);
console.log(`[Protection] 5 Tasks / 0 Staff = ${zero.loadIndex} (${zero.status}) [Staff normalized via logic]`);

if (zero.activeStaff !== 1) throw new Error('Zero staff protection failed');

console.log('✅ Human Load Logic Verified.');
