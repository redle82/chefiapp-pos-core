// This is the SINGLE SOURCE OF TRUTH for the Onboarding Logic.
// Nothing exists outside this map.

export const OnboardingScenes = {
    // Scene 1: O Gancho (The Hook)
    // Context: Introduces the brand, sets the tone.
    hook: {
        id: 'scene_hook',
        requires: [], // No dependencies, entry point
        produces: [], // Just engagement
        route: '/start/cinematic/1',
    },

    // Scene 2: Identidade (Identity)
    // Context: Who are you? Name, Slug, Logo.
    identity: {
        id: 'scene_identity',
        requires: [],
        produces: ['identityProfile', 'countryContext'],
        route: '/start/cinematic/2',
        // Adapts: IdentityPage.tsx, SlugPage.tsx
    },

    // Scene 3: Tipo de Negócio (Business Type)
    // Context: What do you do? Restaurant, Bar, Cafe?
    businessType: {
        id: 'scene_business_type',
        requires: ['countryContext'],
        produces: ['businessType'], // 'restaurant' | 'bar' | 'cafe'
        route: '/start/cinematic/type',
    },

    // Scene 4: Equipa (Team)
    // Context: Who works here? Staff size, roles.
    team: {
        id: 'scene_team',
        requires: ['businessType'], // Type might influence default roles
        produces: ['staffProfile'], // presets of workers/roles
        route: '/start/cinematic/team',
    },

    // Scene 4: Menu Builder (Menu)
    // Context: What do you sell?
    menu: {
        id: 'scene_menu',
        requires: ['businessType', 'countryContext'],
        produces: ['menuProfile'], // cuisine, beverages, structure
        route: '/start/cinematic/4',
    },

    // Scene 6: Payments (Tasks -> Payments)
    // Context: How do you operate?
    tasks: {
        id: 'scene_payments',
        requires: ['staffProfile'],
        produces: ['paymentProfile'], // stripe, demo
        route: '/start/cinematic/6',
    },

    // Scene 7: Contrato Soberano (Summary)
    // Context: Final Review and Genesis.
    summary: {
        id: 'scene_summary',
        requires: ['identityProfile', 'menuProfile', 'staffProfile'],
        produces: ['InitialOperationalContract'],
        route: '/start/cinematic/summary',
    },
} as const;

export type SceneKey = keyof typeof OnboardingScenes;
