-- ==========================================
-- ONBOARDING AUDIT RADAR
-- Purpose: Monitor the "Birth" funnel and detect failures.
-- ==========================================
-- TOP 100 LATEST EVENTS (Timeline view)
SELECT id,
    user_id,
    restaurant_id,
    event_type,
    payload,
    created_at
FROM public.onboarding_events
ORDER BY created_at DESC
LIMIT 100;
-- FAILURE DETECTOR (Filters for MISSING or FAIL events)
SELECT event_type,
    count(*),
    max(created_at) as last_occurrence
FROM public.onboarding_events
WHERE event_type LIKE '%FAIL%'
    OR event_type LIKE '%MISSING%'
    OR event_type = 'NO_TENANT_FOUND'
GROUP BY event_type
ORDER BY last_occurrence DESC;
-- USER FUNNEL ANALYSIS (Step sequence for a specific user)
-- Usage: Replace 'USER_ID_HERE' with a real UUID
/*
 SELECT 
 event_type,
 created_at,
 payload
 FROM public.onboarding_events
 WHERE user_id = 'USER_ID_HERE'
 ORDER BY created_at ASC;
 */