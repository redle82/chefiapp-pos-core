/**
 * Mentorship Rule Definition
 * 
 * A "Mentorship Rule" is a deterministic logic unit that observes state and suggests action.
 * It is the building block of ChefIApp's Process Intelligence.
 */

export interface MentorshipRule {
    id: string;
    name: string;
    description: string;

    /**
     * The logic tier:
     * - 'structural': Basic math (e.g. table count vs staff).
     * - 'contextual': Environment aware (e.g. weather, time).
     * - 'learning': ML/Stats based (future).
     */
    tier: 'structural' | 'contextual' | 'learning';

    /**
     * Status of this rule in the current environment.
     */
    status: 'active' | 'experiment' | 'off';

    /**
     * The "Check" function. Returns a result if the rule triggers.
     */
    check: (context: any) => MentorshipResult | null;
}

export interface MentorshipResult {
    ruleId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    action?: () => void;
}
