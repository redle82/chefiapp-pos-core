import { z } from 'zod';
export declare const uploadFunctionRequestSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "active"]>>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    status: "draft" | "active";
    name: string;
    slug?: string | undefined;
    description?: string | undefined;
}, {
    code: string;
    name: string;
    status?: "draft" | "active" | undefined;
    slug?: string | undefined;
    description?: string | undefined;
}>;
export declare const updateFunctionRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active"]>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    status?: "draft" | "active" | undefined;
    name?: string | undefined;
    description?: string | undefined;
}, {
    code?: string | undefined;
    status?: "draft" | "active" | undefined;
    name?: string | undefined;
    description?: string | undefined;
}>;
export declare const listFunctionsResponseSchema: z.ZodObject<{
    functions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        code: z.ZodString;
        status: z.ZodEnum<["draft", "active", "error"]>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deployedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        status: "error" | "draft" | "active";
        id: string;
        createdAt: string;
        name: string;
        updatedAt: string;
        slug: string;
        description: string | null;
        deployedAt: string | null;
    }, {
        code: string;
        status: "error" | "draft" | "active";
        id: string;
        createdAt: string;
        name: string;
        updatedAt: string;
        slug: string;
        description: string | null;
        deployedAt: string | null;
    }>, "many">;
    runtime: z.ZodObject<{
        status: z.ZodEnum<["running", "unavailable"]>;
    }, "strip", z.ZodTypeAny, {
        status: "running" | "unavailable";
    }, {
        status: "running" | "unavailable";
    }>;
}, "strip", z.ZodTypeAny, {
    functions: {
        code: string;
        status: "error" | "draft" | "active";
        id: string;
        createdAt: string;
        name: string;
        updatedAt: string;
        slug: string;
        description: string | null;
        deployedAt: string | null;
    }[];
    runtime: {
        status: "running" | "unavailable";
    };
}, {
    functions: {
        code: string;
        status: "error" | "draft" | "active";
        id: string;
        createdAt: string;
        name: string;
        updatedAt: string;
        slug: string;
        description: string | null;
        deployedAt: string | null;
    }[];
    runtime: {
        status: "running" | "unavailable";
    };
}>;
export type UploadFunctionRequest = z.infer<typeof uploadFunctionRequestSchema>;
export type UpdateFunctionRequest = z.infer<typeof updateFunctionRequestSchema>;
export type ListFunctionsResponse = z.infer<typeof listFunctionsResponseSchema>;
//# sourceMappingURL=functions-api.schema.d.ts.map