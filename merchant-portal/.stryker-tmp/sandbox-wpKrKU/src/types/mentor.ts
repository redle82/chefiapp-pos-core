/**
 * Mentor Types - Operational Mentorship IA
 */

export type MentorshipType = 'preventive' | 'corrective' | 'educational' | 'strategic';

export type MentorshipTone = 'encouraging' | 'direct' | 'supportive' | 'educational';

export interface MentorshipMessage {
  id: string;
  person_id: string;
  person_role: 'employee' | 'manager' | 'owner';
  type: MentorshipType;
  tone: MentorshipTone;
  content: {
    title: string;
    message: string;
    action: {
      what: string;
      why: string;
      how: string;
    };
  };
  context: {
    pattern: string;
    frequency: number;
    impact: {
      sla_violations?: number;
      delayed_items?: number;
      cost?: number;
    };
  };
  format: 'text' | 'structured' | 'interactive';
  privacy: 'private' | 'team' | 'public';
  delivered_at?: string;
  read_at?: string;
  feedback?: 'helpful' | 'not_helpful' | 'irrelevant';
  created_at: string;
}

export interface MentorshipFeedback {
  message_id: string;
  person_id: string;
  response: {
    read: boolean;
    action_taken: boolean;
    helpful: 'yes' | 'no' | 'neutral';
    feedback_text?: string;
  };
  outcome: {
    pattern_improved: boolean;
    improvement_rate: number; // 0-1
    time_to_improve?: number; // dias
  };
}
