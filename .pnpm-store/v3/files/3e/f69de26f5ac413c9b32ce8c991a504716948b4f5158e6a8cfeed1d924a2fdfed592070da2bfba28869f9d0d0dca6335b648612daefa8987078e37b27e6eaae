import { z } from 'zod';
/**
 * Pagination parameters shared across list endpoints
 */
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodString>;
    offset: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: string | undefined;
    offset?: string | undefined;
}, {
    limit?: string | undefined;
    offset?: string | undefined;
}>;
/**
 * Shared options for auth requests (extensible for future parameters)
 */
export declare const authOptionsSchema: z.ZodOptional<z.ZodObject<{
    emailRedirectTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    emailRedirectTo?: string | undefined;
}, {
    emailRedirectTo?: string | undefined;
}>>;
/**
 * POST /api/auth/users - Create user
 */
export declare const createUserRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodObject<{
        emailRedirectTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        emailRedirectTo?: string | undefined;
    }, {
        emailRedirectTo?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    options?: {
        emailRedirectTo?: string | undefined;
    } | undefined;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    options?: {
        emailRedirectTo?: string | undefined;
    } | undefined;
    name?: string | undefined;
}>;
/**
 * POST /api/auth/sessions - Create session
 */
export declare const createSessionRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
/**
 * POST /api/auth/admin/sessions - Create admin session
 */
export declare const createAdminSessionRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const exchangeAdminSessionRequestSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
/**
 * GET /api/auth/users - List users (query parameters)
 */
export declare const listUsersRequestSchema: z.ZodOptional<z.ZodObject<{
    limit: z.ZodOptional<z.ZodString>;
    offset: z.ZodOptional<z.ZodString>;
} & {
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: string | undefined;
    offset?: string | undefined;
    search?: string | undefined;
}, {
    limit?: string | undefined;
    offset?: string | undefined;
    search?: string | undefined;
}>>;
/**
 * DELETE /api/auth/users - Delete users (batch)
 */
export declare const deleteUsersRequestSchema: z.ZodObject<{
    userIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    userIds: string[];
}, {
    userIds: string[];
}>;
/**
 * PATCH /api/auth/profiles/current - Update current user's profile
 */
export declare const updateProfileRequestSchema: z.ZodObject<{
    profile: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    profile: Record<string, unknown>;
}, {
    profile: Record<string, unknown>;
}>;
/**
 * POST /api/auth/email/send-verification - Send verification email (code or link based on config)
 */
export declare const sendVerificationEmailRequestSchema: z.ZodObject<{
    email: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        emailRedirectTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        emailRedirectTo?: string | undefined;
    }, {
        emailRedirectTo?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    options?: {
        emailRedirectTo?: string | undefined;
    } | undefined;
}, {
    email: string;
    options?: {
        emailRedirectTo?: string | undefined;
    } | undefined;
}>;
/**
 * POST /api/auth/email/verify - Verify email with OTP
 * Uses verifyEmailMethod from auth config to determine verification type:
 * - 'code': expects email + 6-digit numeric code
 * - 'link': expects 64-char hex token only
 */
export declare const verifyEmailRequestSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    otp: string;
    email?: string | undefined;
}, {
    otp: string;
    email?: string | undefined;
}>, {
    otp: string;
    email?: string | undefined;
}, {
    otp: string;
    email?: string | undefined;
}>;
/**
 * POST /api/auth/email/send-reset-password - Send reset password email (code or link based on config)
 */
export declare const sendResetPasswordEmailRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
/**
 * POST /api/auth/email/exchange-reset-password-token - Exchange reset password code for reset token
 * Used in two-step password reset flow (code method only): exchange code for token, then reset password with token
 */
export declare const exchangeResetPasswordTokenRequestSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
}, {
    code: string;
    email: string;
}>;
/**
 * POST /api/auth/email/reset-password - Reset password with token
 * Token can be:
 * - Magic link token (from send-reset-password endpoint when method is 'link')
 * - Reset token (from exchange-reset-password-token endpoint after code verification)
 * Both use RESET_PASSWORD purpose and are verified the same way
 */
export declare const resetPasswordRequestSchema: z.ZodObject<{
    newPassword: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    otp: string;
    newPassword: string;
}, {
    otp: string;
    newPassword: string;
}>;
/**
 * Response for POST /api/auth/users
 * Includes optional redirectTo URL when user is successfully registered and email verification is not required
 * For mobile/desktop clients: refreshToken is returned in body instead of cookie
 */
export declare const createUserResponseSchema: z.ZodObject<{
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>>;
    accessToken: z.ZodNullable<z.ZodString>;
    requireEmailVerification: z.ZodOptional<z.ZodBoolean>;
    redirectTo: z.ZodOptional<z.ZodString>;
    csrfToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string | null;
    user?: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    } | undefined;
    requireEmailVerification?: boolean | undefined;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}, {
    accessToken: string | null;
    user?: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    } | undefined;
    requireEmailVerification?: boolean | undefined;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}>;
/**
 * Response for POST /api/auth/sessions
 * Includes user and access token, plus optional redirectTo URL for frontend navigation
 * For mobile/desktop clients: refreshToken is returned in body instead of cookie
 */
export declare const createSessionResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>;
    accessToken: z.ZodString;
    redirectTo: z.ZodOptional<z.ZodString>;
    csrfToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}>;
/**
 * Response for POST /api/auth/email/verify
 * Includes user and access token, plus optional redirectTo URL for frontend navigation
 * For mobile/desktop clients: refreshToken is returned in body instead of cookie
 */
export declare const verifyEmailResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>;
    accessToken: z.ZodString;
    redirectTo: z.ZodOptional<z.ZodString>;
    csrfToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}>;
/**
 * Response for POST /api/auth/refresh
 * Returns new access token after token refresh
 * For web clients: csrfToken is returned (refresh token is in cookie)
 * For mobile/desktop clients: refreshToken is returned in body
 */
export declare const refreshSessionResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>;
    csrfToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    csrfToken?: string | undefined;
    refreshToken?: string | undefined;
}, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
    accessToken: string;
    csrfToken?: string | undefined;
    refreshToken?: string | undefined;
}>;
/**
 * Response for POST /api/auth/email/exchange-reset-password-token
 * Returns reset token that can be used to reset password
 */
export declare const exchangeResetPasswordTokenResponseSchema: z.ZodObject<{
    token: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    expiresAt: string;
}, {
    token: string;
    expiresAt: string;
}>;
/**
 * Response for POST /api/auth/email/reset-password
 * Includes success message
 */
export declare const resetPasswordResponseSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
/**
 * Response for POST /api/auth/admin/sessions
 */
export declare const createAdminSessionResponseSchema: z.ZodObject<{
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>>;
    accessToken: z.ZodNullable<z.ZodString>;
    requireEmailVerification: z.ZodOptional<z.ZodBoolean>;
    redirectTo: z.ZodOptional<z.ZodString>;
    csrfToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string | null;
    user?: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    } | undefined;
    requireEmailVerification?: boolean | undefined;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}, {
    accessToken: string | null;
    user?: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    } | undefined;
    requireEmailVerification?: boolean | undefined;
    redirectTo?: string | undefined;
    csrfToken?: string | null | undefined;
    refreshToken?: string | undefined;
}>;
/**
 * Response for GET /api/auth/sessions/current
 */
export declare const getCurrentSessionResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
}, {
    user: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    };
}>;
/**
 * Response for GET /api/auth/profiles/:userId - Get user profile
 */
export declare const getProfileResponseSchema: z.ZodObject<{
    id: z.ZodString;
    profile: z.ZodNullable<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    profile: z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | null;
}, {
    id: string;
    profile: z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | null;
}>;
/**
 * Response for GET /api/auth/users
 */
export declare const listUsersResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profile: z.ZodNullable<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }, {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }>, "many">;
    pagination: z.ZodObject<{
        offset: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        limit: number;
        offset: number;
    }, {
        total: number;
        limit: number;
        offset: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}, {
    data: {
        id: string;
        createdAt: string;
        metadata: Record<string, unknown> | null;
        email: string;
        emailVerified: boolean;
        updatedAt: string;
        profile: z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            avatar_url: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough"> | null;
        providers?: string[] | undefined;
    }[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}>;
/**
 * Response for DELETE /api/auth/users
 */
export declare const deleteUsersResponseSchema: z.ZodObject<{
    message: z.ZodString;
    deletedCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    message: string;
    deletedCount: number;
}, {
    message: string;
    deletedCount: number;
}>;
/**
 * Response for GET /api/auth/v1/google-auth and GET /api/auth/v1/github-auth
 */
export declare const getOauthUrlResponseSchema: z.ZodObject<{
    authUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    authUrl: string;
}, {
    authUrl: string;
}>;
/**
 * POST /api/auth/oauth/configs - Create OAuth configuration
 */
export declare const createOAuthConfigRequestSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    provider: z.ZodEnum<["google", "github", "discord", "linkedin", "facebook", "instagram", "tiktok", "apple", "x", "spotify", "microsoft"]>;
    clientId: z.ZodOptional<z.ZodString>;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    redirectUri: z.ZodOptional<z.ZodString>;
    useSharedKey: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "id" | "createdAt" | "updatedAt"> & {
    clientSecret: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
    useSharedKey: boolean;
    redirectUri?: string | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    clientSecret?: string | undefined;
}, {
    provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
    useSharedKey: boolean;
    redirectUri?: string | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    clientSecret?: string | undefined;
}>;
/**
 * PUT /api/auth/oauth/configs/:provider - Update OAuth configuration
 */
export declare const updateOAuthConfigRequestSchema: z.ZodObject<{
    redirectUri: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    clientId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scopes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    useSharedKey: z.ZodOptional<z.ZodBoolean>;
    clientSecret: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    redirectUri?: string | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    useSharedKey?: boolean | undefined;
    clientSecret?: string | undefined;
}, {
    redirectUri?: string | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    useSharedKey?: boolean | undefined;
    clientSecret?: string | undefined;
}>;
/**
 * GET /api/auth/oauth/:provider - Initialize OAuth flow
 * Query params for PKCE flow as per RFC 7636
 * Note: code_challenge uses snake_case as per OAuth 2.0 PKCE specification
 */
export declare const oAuthInitRequestSchema: z.ZodObject<{
    redirect_uri: z.ZodOptional<z.ZodString>;
    code_challenge: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code_challenge: string;
    redirect_uri?: string | undefined;
}, {
    code_challenge: string;
    redirect_uri?: string | undefined;
}>;
/**
 * POST /api/auth/oauth/exchange - Exchange OAuth code for tokens
 * Used in PKCE flow to exchange an authorization code for tokens
 * Note: code_verifier uses snake_case as per OAuth 2.0 PKCE specification (RFC 7636)
 */
export declare const oAuthCodeExchangeRequestSchema: z.ZodObject<{
    code: z.ZodString;
    code_verifier: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    code_verifier: string;
}, {
    code: string;
    code_verifier: string;
}>;
/**
 * Response for GET /api/auth/oauth/configs
 */
export declare const listOAuthConfigsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        provider: z.ZodEnum<["google", "github", "discord", "linkedin", "facebook", "instagram", "tiktok", "apple", "x", "spotify", "microsoft"]>;
        clientId: z.ZodOptional<z.ZodString>;
        scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        redirectUri: z.ZodOptional<z.ZodString>;
        useSharedKey: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
        id: string;
        createdAt: string;
        updatedAt: string;
        useSharedKey: boolean;
        redirectUri?: string | undefined;
        clientId?: string | undefined;
        scopes?: string[] | undefined;
    }, {
        provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
        id: string;
        createdAt: string;
        updatedAt: string;
        useSharedKey: boolean;
        redirectUri?: string | undefined;
        clientId?: string | undefined;
        scopes?: string[] | undefined;
    }>, "many">;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    data: {
        provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
        id: string;
        createdAt: string;
        updatedAt: string;
        useSharedKey: boolean;
        redirectUri?: string | undefined;
        clientId?: string | undefined;
        scopes?: string[] | undefined;
    }[];
    count: number;
}, {
    data: {
        provider: "google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft";
        id: string;
        createdAt: string;
        updatedAt: string;
        useSharedKey: boolean;
        redirectUri?: string | undefined;
        clientId?: string | undefined;
        scopes?: string[] | undefined;
    }[];
    count: number;
}>;
/**
 * PUT /api/auth/config - Update authentication configuration
 */
export declare const updateAuthConfigRequestSchema: z.ZodObject<{
    requireEmailVerification: z.ZodOptional<z.ZodBoolean>;
    passwordMinLength: z.ZodOptional<z.ZodNumber>;
    requireNumber: z.ZodOptional<z.ZodBoolean>;
    requireLowercase: z.ZodOptional<z.ZodBoolean>;
    requireUppercase: z.ZodOptional<z.ZodBoolean>;
    requireSpecialChar: z.ZodOptional<z.ZodBoolean>;
    verifyEmailMethod: z.ZodOptional<z.ZodEnum<["code", "link"]>>;
    resetPasswordMethod: z.ZodOptional<z.ZodEnum<["code", "link"]>>;
    signInRedirectTo: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">, z.ZodNull]>>, string | null | undefined, string | null | undefined>>;
}, "strip", z.ZodTypeAny, {
    requireEmailVerification?: boolean | undefined;
    passwordMinLength?: number | undefined;
    requireNumber?: boolean | undefined;
    requireLowercase?: boolean | undefined;
    requireUppercase?: boolean | undefined;
    requireSpecialChar?: boolean | undefined;
    verifyEmailMethod?: "code" | "link" | undefined;
    resetPasswordMethod?: "code" | "link" | undefined;
    signInRedirectTo?: string | null | undefined;
}, {
    requireEmailVerification?: boolean | undefined;
    passwordMinLength?: number | undefined;
    requireNumber?: boolean | undefined;
    requireLowercase?: boolean | undefined;
    requireUppercase?: boolean | undefined;
    requireSpecialChar?: boolean | undefined;
    verifyEmailMethod?: "code" | "link" | undefined;
    resetPasswordMethod?: "code" | "link" | undefined;
    signInRedirectTo?: string | null | undefined;
}>;
/**
 * Response for GET /api/auth/config
 */
export declare const getAuthConfigResponseSchema: z.ZodObject<{
    id: z.ZodString;
    requireEmailVerification: z.ZodBoolean;
    passwordMinLength: z.ZodNumber;
    requireNumber: z.ZodBoolean;
    requireLowercase: z.ZodBoolean;
    requireUppercase: z.ZodBoolean;
    requireSpecialChar: z.ZodBoolean;
    verifyEmailMethod: z.ZodEnum<["code", "link"]>;
    resetPasswordMethod: z.ZodEnum<["code", "link"]>;
    signInRedirectTo: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">, z.ZodNull]>>, string | null | undefined, string | null | undefined>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    requireEmailVerification: boolean;
    passwordMinLength: number;
    requireNumber: boolean;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireSpecialChar: boolean;
    verifyEmailMethod: "code" | "link";
    resetPasswordMethod: "code" | "link";
    signInRedirectTo?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    requireEmailVerification: boolean;
    passwordMinLength: number;
    requireNumber: boolean;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireSpecialChar: boolean;
    verifyEmailMethod: "code" | "link";
    resetPasswordMethod: "code" | "link";
    signInRedirectTo?: string | null | undefined;
}>;
/**
 * Response for GET /api/auth/public-config - Unified public auth configuration endpoint
 * Combines OAuth providers and email auth configuration
 */
export declare const getPublicAuthConfigResponseSchema: z.ZodObject<{
    requireEmailVerification: z.ZodBoolean;
    passwordMinLength: z.ZodNumber;
    requireNumber: z.ZodBoolean;
    requireLowercase: z.ZodBoolean;
    requireUppercase: z.ZodBoolean;
    requireSpecialChar: z.ZodBoolean;
    verifyEmailMethod: z.ZodEnum<["code", "link"]>;
    resetPasswordMethod: z.ZodEnum<["code", "link"]>;
    oAuthProviders: z.ZodArray<z.ZodEnum<["google", "github", "discord", "linkedin", "facebook", "instagram", "tiktok", "apple", "x", "spotify", "microsoft"]>, "many">;
}, "strip", z.ZodTypeAny, {
    requireEmailVerification: boolean;
    passwordMinLength: number;
    requireNumber: boolean;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireSpecialChar: boolean;
    verifyEmailMethod: "code" | "link";
    resetPasswordMethod: "code" | "link";
    oAuthProviders: ("google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft")[];
}, {
    requireEmailVerification: boolean;
    passwordMinLength: number;
    requireNumber: boolean;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireSpecialChar: boolean;
    verifyEmailMethod: "code" | "link";
    resetPasswordMethod: "code" | "link";
    oAuthProviders: ("google" | "github" | "discord" | "linkedin" | "facebook" | "instagram" | "tiktok" | "apple" | "x" | "spotify" | "microsoft")[];
}>;
/**
 * Standard error response format for auth endpoints
 */
export declare const authErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    statusCode: z.ZodNumber;
    nextActions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    error: string;
    statusCode: number;
    nextActions?: string | undefined;
}, {
    message: string;
    error: string;
    statusCode: number;
    nextActions?: string | undefined;
}>;
export type AuthOptions = z.infer<typeof authOptionsSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type CreateAdminSessionRequest = z.infer<typeof createAdminSessionRequestSchema>;
export type ListUsersRequest = z.infer<typeof listUsersRequestSchema>;
export type DeleteUsersRequest = z.infer<typeof deleteUsersRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type CreateOAuthConfigRequest = z.infer<typeof createOAuthConfigRequestSchema>;
export type UpdateOAuthConfigRequest = z.infer<typeof updateOAuthConfigRequestSchema>;
export type OAuthInitRequest = z.infer<typeof oAuthInitRequestSchema>;
export type OAuthCodeExchangeRequest = z.infer<typeof oAuthCodeExchangeRequestSchema>;
export type UpdateAuthConfigRequest = z.infer<typeof updateAuthConfigRequestSchema>;
export type SendVerificationEmailRequest = z.infer<typeof sendVerificationEmailRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type SendResetPasswordEmailRequest = z.infer<typeof sendResetPasswordEmailRequestSchema>;
export type ExchangeResetPasswordTokenRequest = z.infer<typeof exchangeResetPasswordTokenRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;
export type ExchangeResetPasswordTokenResponse = z.infer<typeof exchangeResetPasswordTokenResponseSchema>;
export type RefreshSessionResponse = z.infer<typeof refreshSessionResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
export type CreateAdminSessionResponse = z.infer<typeof createAdminSessionResponseSchema>;
export type GetCurrentSessionResponse = z.infer<typeof getCurrentSessionResponseSchema>;
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
export type DeleteUsersResponse = z.infer<typeof deleteUsersResponseSchema>;
export type GetOauthUrlResponse = z.infer<typeof getOauthUrlResponseSchema>;
export type ListOAuthConfigsResponse = z.infer<typeof listOAuthConfigsResponseSchema>;
export type GetAuthConfigResponse = z.infer<typeof getAuthConfigResponseSchema>;
export type GetPublicAuthConfigResponse = z.infer<typeof getPublicAuthConfigResponseSchema>;
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;
//# sourceMappingURL=auth-api.schema.d.ts.map