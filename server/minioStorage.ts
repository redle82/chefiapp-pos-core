import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.MINIO_SECRET_KEY || "minioadmin123";
const bucket = process.env.MINIO_BUCKET || "chefiapp-products";
const publicBase = (process.env.MINIO_PUBLIC_BASE || endpoint).replace(
  /\/$/,
  "",
);

const s3 = new S3Client({
  region: "us-east-1",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

export async function uploadProductImage(params: {
  restaurantId: string;
  productId: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const key = `${params.restaurantId}/products/${params.productId}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return `${publicBase}/${bucket}/${key}`;
}
