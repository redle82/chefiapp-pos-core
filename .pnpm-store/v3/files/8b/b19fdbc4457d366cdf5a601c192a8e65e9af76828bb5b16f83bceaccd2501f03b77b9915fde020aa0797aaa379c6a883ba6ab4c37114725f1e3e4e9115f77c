import { z } from 'zod';
export const appRouteChangeEventSchema = z.object({
    type: z.literal('APP_ROUTE_CHANGE'),
    path: z.string(),
});
export const authSuccessEventSchema = z.object({
    type: z.literal('AUTH_SUCCESS'),
});
export const authErrorEventSchema = z.object({
    type: z.literal('AUTH_ERROR'),
    message: z.string(),
});
export const mcpConnectionStatusEventSchema = z.object({
    type: z.literal('MCP_CONNECTION_STATUS'),
    connected: z.boolean(),
    toolName: z.string(),
    timestamp: z.union([z.number(), z.string()]),
});
export const showOnboardingOverlayEventSchema = z.object({
    type: z.literal('SHOW_ONBOARDING_OVERLAY'),
});
export const showSettingsOverlayEventSchema = z.object({
    type: z.literal('SHOW_SETTINGS_OVERLAY'),
});
export const onboardingSuccessSchema = z.object({
    type: z.literal('ONBOARDING_SUCCESS'),
});
export const navigateToUsageSchema = z.object({
    type: z.literal('NAVIGATE_TO_USAGE'),
});
export const showContactModalEventSchema = z.object({
    type: z.literal('SHOW_CONTACT_MODAL'),
});
export const showConnectOverlayEventSchema = z.object({
    type: z.literal('SHOW_CONNECT_OVERLAY'),
});
export const authorizationCodeEventSchema = z.object({
    type: z.literal('AUTHORIZATION_CODE'),
    code: z.string(),
});
export const routeChangeEventSchema = z.object({
    type: z.literal('ROUTE_CHANGE'),
    path: z.string(),
});
export const cloudEventSchema = z.discriminatedUnion('type', [
    appRouteChangeEventSchema,
    authSuccessEventSchema,
    authErrorEventSchema,
    mcpConnectionStatusEventSchema,
    showOnboardingOverlayEventSchema,
    showSettingsOverlayEventSchema,
    onboardingSuccessSchema,
    navigateToUsageSchema,
    showContactModalEventSchema,
    showConnectOverlayEventSchema,
    authorizationCodeEventSchema,
    routeChangeEventSchema,
]);
//# sourceMappingURL=cloud-events.schema.js.map