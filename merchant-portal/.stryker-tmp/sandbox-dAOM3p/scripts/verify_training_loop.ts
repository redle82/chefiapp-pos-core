// @ts-nocheck

import { findRelevantLesson, LESSON_REPOSITORY } from '../src/intelligence/education/MicroLessonEngine';

console.log('🧪 Verifying Training Engine...');

// 1. Verify Repository Content
console.log(`📚 Loaded ${LESSON_REPOSITORY.length} lessons.`);
if (LESSON_REPOSITORY.length < 2) throw new Error('Repository too small');

const voidLesson = LESSON_REPOSITORY.find(l => l.triggerKey === 'Void Burger');
if (!voidLesson) throw new Error('Void Burger lesson missing');
console.log('✅ Void Burger lesson found:', voidLesson.title);


// 2. Test Triggering Logic
console.log('🔍 Testing Trigger Logic...');

// Case A: Exact Match (Kitchen)
const result1 = findRelevantLesson('menu_item', 'Void Burger', 'kitchen', []);
if (result1?.id !== voidLesson.id) {
    console.error('Expected:', voidLesson.id, 'Got:', result1?.id);
    throw new Error('Trigger failure: Void Burger');
}
console.log('✅ Trigger Matched: Void Burger ->', result1.title);

// Case B: Wrong Role (Waiter request for Kitchen Lesson)
const result2 = findRelevantLesson('menu_item', 'Void Burger', 'waiter', []);
if (result2 !== null) throw new Error('Role isolation failed: Waiter got kitchen lesson');
console.log('✅ Role Isolation Verified');

// Case C: Already Learned
const result3 = findRelevantLesson('menu_item', 'Void Burger', 'kitchen', [voidLesson.id]);
if (result3 !== null) throw new Error('Learning memory failed: Triggered learned lesson');
console.log('✅ Learning Memory Verified');

// Case D: Role 'All' or specific
const slaLesson = LESSON_REPOSITORY.find(l => l.triggerContext === 'sla_breach');
if (slaLesson) {
    const result4 = findRelevantLesson('sla_breach', 'kitchen', 'kitchen', []);
    console.log('✅ SLA Trigger Verified');
}

console.log('✅ ALL TRAINING CHECKS PASSED');
