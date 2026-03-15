import { z } from 'zod';
export const storageFileSchema = z.object({
    key: z.string(),
    bucket: z.string(),
    size: z.number(),
    mimeType: z.string().optional(),
    uploadedAt: z.string(),
    url: z.string(),
});
export const storageBucketSchema = z.object({
    name: z.string(),
    public: z.boolean(),
    createdAt: z.string(),
});
//# sourceMappingURL=storage.schema.js.map