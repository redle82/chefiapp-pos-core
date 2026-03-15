import { z } from 'zod';
export declare const storageFileSchema: z.ZodObject<{
    key: z.ZodString;
    bucket: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodOptional<z.ZodString>;
    uploadedAt: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    key: string;
    bucket: string;
    size: number;
    uploadedAt: string;
    mimeType?: string | undefined;
}, {
    url: string;
    key: string;
    bucket: string;
    size: number;
    uploadedAt: string;
    mimeType?: string | undefined;
}>;
export declare const storageBucketSchema: z.ZodObject<{
    name: z.ZodString;
    public: z.ZodBoolean;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    name: string;
    public: boolean;
}, {
    createdAt: string;
    name: string;
    public: boolean;
}>;
export type StorageFileSchema = z.infer<typeof storageFileSchema>;
export type StorageBucketSchema = z.infer<typeof storageBucketSchema>;
//# sourceMappingURL=storage.schema.d.ts.map