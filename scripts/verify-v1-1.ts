import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321', // Local Supabase default
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fallback to direct DB logic if Supabase client fails in this environment
async function simulateRuleEngine() {
    console.log('--- Rule Engine v1.1 Simulation ---');
    const restId = '22ca2fb6-d2eb-40e3-aba5-663398ab0b19';
    const now = new Date();

    // 1. Get Chaos Rule
    const { data: rules } = await supabase.from('rules').select('*').eq('id', 'rule_chaos_pattern_v1');
    if (!rules || rules.length === 0) {
        console.error('Rule not found!');
        return;
    }
    const rule = rules[0];
    console.log('Rule:', rule.name, 'Threshold:', rule.action_threshold);

    // 2. Count pulses
    const windowStart = new Date(now.getTime() - rule.trigger.window_minutes * 60000);
    const { count } = await supabase
        .from('empire_pulses')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restId)
        .eq('type', rule.trigger.pulse_type)
        .gte('created_at', windowStart.toISOString());

    console.log('Detected', count, 'pulses of type', rule.trigger.pulse_type);

    if (count >= rule.trigger.threshold_count) {
        console.log('TRIGGERED!');
        const confidence = rule.confidence_level || 1.0;
        const threshold = rule.action_threshold || 0.8;

        if (confidence >= threshold) {
            console.log('CONFIDENCE MET. EXECUTING ACTION...');
            // In reality, process_pulses does this. We verify it exists or simulate it.
            const { data: reco } = await supabase.from('empire_pulses').insert({
                restaurant_id: restId,
                type: 'SYSTEM_RECOVERY_MODE',
                payload: { cause_rule: rule.id, confidence }
            });
            console.log('Recovery pulse inserted.');
        }
    }
}

simulateRuleEngine();
