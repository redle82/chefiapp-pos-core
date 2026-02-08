/**
 * MentorContext - Contexto de Mentoria IA
 * 
 * Gerencia quando a IA fala, por que fala, para quem, e com que tom
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mentorEngine, type MentorSuggestion, type MentorRecommendation, type MentorConfig } from '../core/mentor/MentorEngine';

interface MentorContextValue {
  suggestions: MentorSuggestion[];
  recommendations: MentorRecommendation[];
  config: MentorConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
  acknowledgeSuggestion: (suggestionId: string) => Promise<void>;
  applySuggestion: (suggestionId: string) => Promise<void>;
  dismissSuggestion: (suggestionId: string, reason?: string) => Promise<void>;
  acceptRecommendation: (recommendationId: string) => Promise<void>;
  rejectRecommendation: (recommendationId: string, reason?: string) => Promise<void>;
  analyzeSystem: () => Promise<void>;
}

const MentorContext = createContext<MentorContextValue | undefined>(undefined);

interface Props {
  children: ReactNode;
  restaurantId: string;
}

export function MentorProvider({ children, restaurantId }: Props) {
  const [suggestions, setSuggestions] = useState<MentorSuggestion[]>([]);
  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
  const [config, setConfig] = useState<MentorConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sugs, recs, cfg] = await Promise.all([
        mentorEngine.listSuggestions(restaurantId, { status: ['pending', 'acknowledged'] }),
        mentorEngine.listRecommendations(restaurantId, { status: ['pending'] }),
        mentorEngine.getConfig(restaurantId),
      ]);

      setSuggestions(sugs);
      setRecommendations(recs);
      setConfig(cfg);

      // Criar config padrão se não existir
      if (!cfg) {
        await mentorEngine.upsertConfig({ restaurantId });
        const newConfig = await mentorEngine.getConfig(restaurantId);
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error loading mentor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const refresh = async () => {
    setLoading(true);
    await loadData();
  };

  const acknowledgeSuggestion = async (suggestionId: string) => {
    try {
      await mentorEngine.updateSuggestionStatus(suggestionId, 'acknowledged');
      await refresh();
    } catch (error) {
      console.error('Error acknowledging suggestion:', error);
      throw error;
    }
  };

  const applySuggestion = async (suggestionId: string) => {
    try {
      await mentorEngine.updateSuggestionStatus(suggestionId, 'applied');
      await refresh();
    } catch (error) {
      console.error('Error applying suggestion:', error);
      throw error;
    }
  };

  const dismissSuggestion = async (suggestionId: string, reason?: string) => {
    try {
      await mentorEngine.updateSuggestionStatus(suggestionId, 'dismissed', undefined, reason);
      await refresh();
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      throw error;
    }
  };

  const acceptRecommendation = async (recommendationId: string) => {
    try {
      await mentorEngine.updateRecommendationStatus(recommendationId, 'accepted');
      await refresh();
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      throw error;
    }
  };

  const rejectRecommendation = async (recommendationId: string, reason?: string) => {
    try {
      await mentorEngine.updateRecommendationStatus(recommendationId, 'rejected', undefined, reason);
      await refresh();
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
      throw error;
    }
  };

  const analyzeSystem = async () => {
    try {
      await mentorEngine.analyzeAndSuggest(restaurantId);
      await refresh();
    } catch (error) {
      console.error('Error analyzing system:', error);
      throw error;
    }
  };

  return (
    <MentorContext.Provider
      value={{
        suggestions,
        recommendations,
        config,
        loading,
        refresh,
        acknowledgeSuggestion,
        applySuggestion,
        dismissSuggestion,
        acceptRecommendation,
        rejectRecommendation,
        analyzeSystem,
      }}
    >
      {children}
    </MentorContext.Provider>
  );
}

export function useMentor() {
  const context = useContext(MentorContext);
  if (context === undefined) {
    throw new Error('useMentor must be used within a MentorProvider');
  }
  return context;
}
