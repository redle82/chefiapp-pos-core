/**
 * Unit tests for server/minioStorage — Onda 1.
 */

const sendMock = jest.fn().mockResolvedValue({});

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(function (this: { send: jest.Mock }) {
    this.send = sendMock;
  }),
  PutObjectCommand: jest.fn((args: unknown) => args),
}));

import { uploadProductImage } from "../../../server/minioStorage";

describe("minioStorage", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("sends PutObjectCommand with correct Bucket, Key, Body, ContentType", async () => {
    const body = Buffer.from("image-data");
    const url = await uploadProductImage({
      restaurantId: "res-1",
      productId: "prod-99",
      body,
      contentType: "image/webp",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];
    expect(cmd).toMatchObject({
      Bucket: "chefiapp-products",
      Key: "res-1/products/prod-99.webp",
      Body: body,
      ContentType: "image/webp",
    });
    expect(url).toContain("chefiapp-products");
    expect(url).toContain("res-1/products/prod-99.webp");
  });

  it("returns URL with public base and bucket path", async () => {
    const url = await uploadProductImage({
      restaurantId: "r",
      productId: "p",
      body: Buffer.from("x"),
      contentType: "image/webp",
    });

    expect(typeof url).toBe("string");
    expect(url).toMatch(/\/chefiapp-products\/r\/products\/p\.webp$/);
  });

  it("uses MINIO_PUBLIC_BASE when provided and normalizes trailing slash", async () => {
    const prevPublicBase = process.env.MINIO_PUBLIC_BASE;
    const prevBucket = process.env.MINIO_BUCKET;

    process.env.MINIO_PUBLIC_BASE = "https://cdn.example.com/";
    process.env.MINIO_BUCKET = "custom-bucket";

    jest.resetModules();
    const { uploadProductImage: uploadWithEnv } = await import(
      "../../../server/minioStorage"
    );

    const url = await uploadWithEnv({
      restaurantId: "r2",
      productId: "p2",
      body: Buffer.from("y"),
      contentType: "image/webp",
    });

    expect(url).toBe(
      "https://cdn.example.com/custom-bucket/r2/products/p2.webp",
    );

    if (prevPublicBase === undefined) delete process.env.MINIO_PUBLIC_BASE;
    else process.env.MINIO_PUBLIC_BASE = prevPublicBase;
    if (prevBucket === undefined) delete process.env.MINIO_BUCKET;
    else process.env.MINIO_BUCKET = prevBucket;
  });
});
