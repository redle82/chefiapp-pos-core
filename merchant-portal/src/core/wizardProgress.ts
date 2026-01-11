/**
 * Wizard Progress Helper
 * 
 * Persists wizard progress to Supabase and marks completion
 * when the publish step is completed.
 */

import { supabase } from './supabase';

export type WizardStep = 'identity' | 'menu' | 'payments' | 'design' | 'publish';

export interface WizardStepData {
  completed: boolean;
  completed_at?: string;
  data?: Record<string, any>;
}

/**
 * Update wizard progress for a specific step
 */
export async function updateWizardProgress(
  restaurantId: string,
  step: WizardStep,
  data?: Record<string, any>
): Promise<void> {
  try {
    // Call Supabase function to update progress
    const { error } = await supabase.rpc('update_wizard_progress', {
      p_restaurant_id: restaurantId,
      p_step: step,
      p_data: data ? data : null
    });

    if (error) {
      console.error('[WizardProgress] Error updating progress:', error);
      throw error;
    }

    console.log(`[WizardProgress] Step "${step}" marked as complete for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('[WizardProgress] Failed to update progress:', error);
    // Don't throw - allow wizard to continue even if progress tracking fails
  }
}

/**
 * Mark wizard as completely finished
 */
export async function markWizardComplete(restaurantId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('mark_wizard_complete', {
      p_restaurant_id: restaurantId
    });

    if (error) {
      console.error('[WizardProgress] Error marking wizard complete:', error);
      throw error;
    }

    console.log(`[WizardProgress] Wizard marked as complete for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('[WizardProgress] Failed to mark wizard complete:', error);
    // Don't throw - allow publish to continue even if tracking fails
  }
}

/**
 * Get wizard progress from database
 */
export async function getWizardProgress(restaurantId: string): Promise<{
  wizard_completed_at: string | null;
  setup_status: 'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done';
  wizard_progress: Record<string, WizardStepData>;
} | null> {
  try {
    const { data, error } = await supabase
      .from('gm_restaurants')
      .select('wizard_completed_at, setup_status, wizard_progress')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('[WizardProgress] Error fetching progress:', error);
      return null;
    }

    return {
      wizard_completed_at: data.wizard_completed_at,
      setup_status: data.setup_status || 'not_started',
      wizard_progress: (data.wizard_progress as Record<string, WizardStepData>) || {}
    };
  } catch (error) {
    console.error('[WizardProgress] Failed to fetch progress:', error);
    return null;
  }
}

