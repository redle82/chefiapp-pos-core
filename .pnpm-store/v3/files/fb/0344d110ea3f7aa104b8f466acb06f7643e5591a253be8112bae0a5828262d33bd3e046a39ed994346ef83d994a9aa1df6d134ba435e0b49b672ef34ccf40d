import { z } from 'zod';
export declare const projectSettingsSchema: z.ZodObject<{
    buildCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    outputDirectory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    installCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    devCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rootDirectory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    buildCommand?: string | null | undefined;
    outputDirectory?: string | null | undefined;
    installCommand?: string | null | undefined;
    devCommand?: string | null | undefined;
    rootDirectory?: string | null | undefined;
}, {
    buildCommand?: string | null | undefined;
    outputDirectory?: string | null | undefined;
    installCommand?: string | null | undefined;
    devCommand?: string | null | undefined;
    rootDirectory?: string | null | undefined;
}>;
export declare const envVarSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    key: string;
}, {
    value: string;
    key: string;
}>;
/**
 * Response from creating a deployment - includes presigned upload info
 */
export declare const createDeploymentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    uploadUrl: z.ZodString;
    uploadFields: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    uploadUrl: string;
    uploadFields: Record<string, string>;
}, {
    id: string;
    uploadUrl: string;
    uploadFields: Record<string, string>;
}>;
/**
 * Request to start a deployment (step 2)
 * Triggers upload to Vercel and creates the actual deployment
 */
export declare const startDeploymentRequestSchema: z.ZodObject<{
    projectSettings: z.ZodOptional<z.ZodObject<{
        buildCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        outputDirectory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        installCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        devCommand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        rootDirectory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        buildCommand?: string | null | undefined;
        outputDirectory?: string | null | undefined;
        installCommand?: string | null | undefined;
        devCommand?: string | null | undefined;
        rootDirectory?: string | null | undefined;
    }, {
        buildCommand?: string | null | undefined;
        outputDirectory?: string | null | undefined;
        installCommand?: string | null | undefined;
        devCommand?: string | null | undefined;
        rootDirectory?: string | null | undefined;
    }>>;
    envVars: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        key: string;
    }, {
        value: string;
        key: string;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    projectSettings?: {
        buildCommand?: string | null | undefined;
        outputDirectory?: string | null | undefined;
        installCommand?: string | null | undefined;
        devCommand?: string | null | undefined;
        rootDirectory?: string | null | undefined;
    } | undefined;
    envVars?: {
        value: string;
        key: string;
    }[] | undefined;
    meta?: Record<string, string> | undefined;
}, {
    projectSettings?: {
        buildCommand?: string | null | undefined;
        outputDirectory?: string | null | undefined;
        installCommand?: string | null | undefined;
        devCommand?: string | null | undefined;
        rootDirectory?: string | null | undefined;
    } | undefined;
    envVars?: {
        value: string;
        key: string;
    }[] | undefined;
    meta?: Record<string, string> | undefined;
}>;
/**
 * Response from starting a deployment
 */
export declare const startDeploymentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    providerDeploymentId: z.ZodNullable<z.ZodString>;
    provider: z.ZodString;
    status: z.ZodEnum<["WAITING", "UPLOADING", "QUEUED", "BUILDING", "READY", "ERROR", "CANCELED"]>;
    url: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
    provider: string;
    id: string;
    createdAt: string;
    url: string | null;
    metadata: Record<string, unknown> | null;
    updatedAt: string;
    providerDeploymentId: string | null;
}, {
    status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
    provider: string;
    id: string;
    createdAt: string;
    url: string | null;
    metadata: Record<string, unknown> | null;
    updatedAt: string;
    providerDeploymentId: string | null;
}>;
export declare const listDeploymentsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        providerDeploymentId: z.ZodNullable<z.ZodString>;
        provider: z.ZodString;
        status: z.ZodEnum<["WAITING", "UPLOADING", "QUEUED", "BUILDING", "READY", "ERROR", "CANCELED"]>;
        url: z.ZodNullable<z.ZodString>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
        provider: string;
        id: string;
        createdAt: string;
        url: string | null;
        metadata: Record<string, unknown> | null;
        updatedAt: string;
        providerDeploymentId: string | null;
    }, {
        status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
        provider: string;
        id: string;
        createdAt: string;
        url: string | null;
        metadata: Record<string, unknown> | null;
        updatedAt: string;
        providerDeploymentId: string | null;
    }>, "many">;
    pagination: z.ZodObject<{
        limit: z.ZodNumber;
        offset: z.ZodNumber;
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
        status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
        provider: string;
        id: string;
        createdAt: string;
        url: string | null;
        metadata: Record<string, unknown> | null;
        updatedAt: string;
        providerDeploymentId: string | null;
    }[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}, {
    data: {
        status: "WAITING" | "UPLOADING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
        provider: string;
        id: string;
        createdAt: string;
        url: string | null;
        metadata: Record<string, unknown> | null;
        updatedAt: string;
        providerDeploymentId: string | null;
    }[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type EnvVar = z.infer<typeof envVarSchema>;
export type CreateDeploymentResponse = z.infer<typeof createDeploymentResponseSchema>;
export type StartDeploymentRequest = z.infer<typeof startDeploymentRequestSchema>;
export type StartDeploymentResponse = z.infer<typeof startDeploymentResponseSchema>;
export type ListDeploymentsResponse = z.infer<typeof listDeploymentsResponseSchema>;
//# sourceMappingURL=deployments-api.schema.d.ts.map