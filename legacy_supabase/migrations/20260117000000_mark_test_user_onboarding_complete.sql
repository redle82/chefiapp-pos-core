-- Migration: Mark Test User Onboarding as Complete
-- Purpose: Allow TestSprite tests to bypass onboarding flow
-- Date: 2026-01-17

-- Find the restaurant for the test user (contact@goldmonkey.studio)
-- and mark onboarding as complete

DO $$
DECLARE
    test_user_id UUID;
    test_restaurant_id UUID;
BEGIN
    -- Find test user by email
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'contact@goldmonkey.studio'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found. Skipping onboarding completion.';
        RETURN;
    END IF;

    -- Find restaurant for test user
    SELECT restaurant_id INTO test_restaurant_id
    FROM gm_restaurant_members
    WHERE user_id = test_user_id
    LIMIT 1;

    IF test_restaurant_id IS NULL THEN
        RAISE NOTICE 'No restaurant found for test user. Skipping onboarding completion.';
        RETURN;
    END IF;

    -- Mark onboarding as complete
    UPDATE gm_restaurants
    SET 
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        wizard_completed_at = COALESCE(wizard_completed_at, NOW()),
        setup_status = COALESCE(setup_status::text, 'advanced_done')::text,
        status = COALESCE(status, 'active')
    WHERE id = test_restaurant_id;

    RAISE NOTICE 'Onboarding marked as complete for test user restaurant: %', test_restaurant_id;
END $$;
