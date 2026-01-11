/**
 * Route Catalog
 * Defines all testable routes grouped by "Bucket".
 */

export const ROUTE_BUCKETS = {
    SMOKE: [
        '/start/cinematic/1',
        '/app/bootstrap',
        '/terms',
        '/privacy',
    ],
    AUTH: [
        '/app/creating',
        '/app/auth',
        '/app/preview',
    ],
    CORE: [
        '/app/tpv',
        '/app/kds',
        '/app/staff',
        '/app/inventory',
        '/app/tpv-ready',
    ],
    PERIPHERAL: [
        '/start/cinematic/logo',
        '/start/cinematic/type',
        '/start/cinematic/team',
        '/start/cinematic/tasks-intro',
        '/start/cinematic/staff-dist',
        '/start/cinematic/3',
        '/start/cinematic/4',
        '/start/cinematic/6',
        '/start/cinematic/summary',
        '/app/setup/identity',
        '/app/setup/menu',
        '/app/setup/payments',
        '/app/setup/design',
        '/app/setup/staff',
        '/app/setup/publish',
        '/app/purchasing',
        '/app/leaks',
        '/app/audit',
        '/menu/test-restaurant',
    ]
};

export const ALL_ROUTES = [
    ...ROUTE_BUCKETS.SMOKE,
    ...ROUTE_BUCKETS.AUTH,
    ...ROUTE_BUCKETS.CORE,
    ...ROUTE_BUCKETS.PERIPHERAL
];
