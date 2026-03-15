import { z } from 'zod';
export declare const appRouteChangeEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"APP_ROUTE_CHANGE">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "APP_ROUTE_CHANGE";
}, {
    path: string;
    type: "APP_ROUTE_CHANGE";
}>;
export declare const authSuccessEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"AUTH_SUCCESS">;
}, "strip", z.ZodTypeAny, {
    type: "AUTH_SUCCESS";
}, {
    type: "AUTH_SUCCESS";
}>;
export declare const authErrorEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"AUTH_ERROR">;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "AUTH_ERROR";
}, {
    message: string;
    type: "AUTH_ERROR";
}>;
export declare const mcpConnectionStatusEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"MCP_CONNECTION_STATUS">;
    connected: z.ZodBoolean;
    toolName: z.ZodString;
    timestamp: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    type: "MCP_CONNECTION_STATUS";
    connected: boolean;
    toolName: string;
    timestamp: string | number;
}, {
    type: "MCP_CONNECTION_STATUS";
    connected: boolean;
    toolName: string;
    timestamp: string | number;
}>;
export declare const showOnboardingOverlayEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"SHOW_ONBOARDING_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_ONBOARDING_OVERLAY";
}, {
    type: "SHOW_ONBOARDING_OVERLAY";
}>;
export declare const showSettingsOverlayEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"SHOW_SETTINGS_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_SETTINGS_OVERLAY";
}, {
    type: "SHOW_SETTINGS_OVERLAY";
}>;
export declare const onboardingSuccessSchema: z.ZodObject<{
    type: z.ZodLiteral<"ONBOARDING_SUCCESS">;
}, "strip", z.ZodTypeAny, {
    type: "ONBOARDING_SUCCESS";
}, {
    type: "ONBOARDING_SUCCESS";
}>;
export declare const navigateToUsageSchema: z.ZodObject<{
    type: z.ZodLiteral<"NAVIGATE_TO_USAGE">;
}, "strip", z.ZodTypeAny, {
    type: "NAVIGATE_TO_USAGE";
}, {
    type: "NAVIGATE_TO_USAGE";
}>;
export declare const showContactModalEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"SHOW_CONTACT_MODAL">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_CONTACT_MODAL";
}, {
    type: "SHOW_CONTACT_MODAL";
}>;
export declare const showConnectOverlayEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"SHOW_CONNECT_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_CONNECT_OVERLAY";
}, {
    type: "SHOW_CONNECT_OVERLAY";
}>;
export declare const authorizationCodeEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"AUTHORIZATION_CODE">;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "AUTHORIZATION_CODE";
}, {
    code: string;
    type: "AUTHORIZATION_CODE";
}>;
export declare const routeChangeEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"ROUTE_CHANGE">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "ROUTE_CHANGE";
}, {
    path: string;
    type: "ROUTE_CHANGE";
}>;
export declare const cloudEventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"APP_ROUTE_CHANGE">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "APP_ROUTE_CHANGE";
}, {
    path: string;
    type: "APP_ROUTE_CHANGE";
}>, z.ZodObject<{
    type: z.ZodLiteral<"AUTH_SUCCESS">;
}, "strip", z.ZodTypeAny, {
    type: "AUTH_SUCCESS";
}, {
    type: "AUTH_SUCCESS";
}>, z.ZodObject<{
    type: z.ZodLiteral<"AUTH_ERROR">;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "AUTH_ERROR";
}, {
    message: string;
    type: "AUTH_ERROR";
}>, z.ZodObject<{
    type: z.ZodLiteral<"MCP_CONNECTION_STATUS">;
    connected: z.ZodBoolean;
    toolName: z.ZodString;
    timestamp: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    type: "MCP_CONNECTION_STATUS";
    connected: boolean;
    toolName: string;
    timestamp: string | number;
}, {
    type: "MCP_CONNECTION_STATUS";
    connected: boolean;
    toolName: string;
    timestamp: string | number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"SHOW_ONBOARDING_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_ONBOARDING_OVERLAY";
}, {
    type: "SHOW_ONBOARDING_OVERLAY";
}>, z.ZodObject<{
    type: z.ZodLiteral<"SHOW_SETTINGS_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_SETTINGS_OVERLAY";
}, {
    type: "SHOW_SETTINGS_OVERLAY";
}>, z.ZodObject<{
    type: z.ZodLiteral<"ONBOARDING_SUCCESS">;
}, "strip", z.ZodTypeAny, {
    type: "ONBOARDING_SUCCESS";
}, {
    type: "ONBOARDING_SUCCESS";
}>, z.ZodObject<{
    type: z.ZodLiteral<"NAVIGATE_TO_USAGE">;
}, "strip", z.ZodTypeAny, {
    type: "NAVIGATE_TO_USAGE";
}, {
    type: "NAVIGATE_TO_USAGE";
}>, z.ZodObject<{
    type: z.ZodLiteral<"SHOW_CONTACT_MODAL">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_CONTACT_MODAL";
}, {
    type: "SHOW_CONTACT_MODAL";
}>, z.ZodObject<{
    type: z.ZodLiteral<"SHOW_CONNECT_OVERLAY">;
}, "strip", z.ZodTypeAny, {
    type: "SHOW_CONNECT_OVERLAY";
}, {
    type: "SHOW_CONNECT_OVERLAY";
}>, z.ZodObject<{
    type: z.ZodLiteral<"AUTHORIZATION_CODE">;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "AUTHORIZATION_CODE";
}, {
    code: string;
    type: "AUTHORIZATION_CODE";
}>, z.ZodObject<{
    type: z.ZodLiteral<"ROUTE_CHANGE">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "ROUTE_CHANGE";
}, {
    path: string;
    type: "ROUTE_CHANGE";
}>]>;
export type AppRouteChangeEvent = z.infer<typeof appRouteChangeEventSchema>;
export type AuthSuccessEvent = z.infer<typeof authSuccessEventSchema>;
export type AuthErrorEvent = z.infer<typeof authErrorEventSchema>;
export type McpConnectionStatusEvent = z.infer<typeof mcpConnectionStatusEventSchema>;
export type CloudEvent = z.infer<typeof cloudEventSchema>;
export type ShowOnboardingOverlayEvent = z.infer<typeof showOnboardingOverlayEventSchema>;
export type ShowSettingsOverlayEvent = z.infer<typeof showSettingsOverlayEventSchema>;
export type ShowContactModalEvent = z.infer<typeof showContactModalEventSchema>;
export type ShowConnectOverlayEvent = z.infer<typeof showConnectOverlayEventSchema>;
export type AuthorizationCodeEvent = z.infer<typeof authorizationCodeEventSchema>;
export type RouteChangeEvent = z.infer<typeof routeChangeEventSchema>;
//# sourceMappingURL=cloud-events.schema.d.ts.map