// intelligence/index.ts — Barrel export para módulo de IA / Motor Cognitivo (Onda 6)

export { MentorEngine } from "./MentorEngine";
export type { MentorshipEvent, MentorshipMessage } from "./MentorEngine";

export { ContextAnalyzer } from "./ContextAnalyzer";
export type {
  EnvironmentState,
  MentorContext,
  OperatorProfile,
} from "./ContextAnalyzer";

export { TimingEngine } from "./TimingEngine";
export type { TimingConfig, TimingDecision } from "./TimingEngine";

export { FeedbackLoop } from "./FeedbackLoop";
export type { FeedbackEntry, FeedbackStats } from "./FeedbackLoop";

export { useMentorshipMessages } from "./useMentorshipMessages";
