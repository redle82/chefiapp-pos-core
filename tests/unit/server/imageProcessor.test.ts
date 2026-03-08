/**
 * Unit tests for server/imageProcessor — Onda 1.
 */

jest.mock("sharp", () => {
  const chain = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("webp-output")),
  };
  return {
    __esModule: true,
    default: jest.fn(() => chain),
  };
});

import sharp from "sharp";
import { processProductImage } from "../../../server/imageProcessor";

const mockSharp = sharp as unknown as jest.Mock;

describe("imageProcessor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls sharp with buffer and returns processed buffer", async () => {
    const input = Buffer.from("fake-image-bytes");
    const result = await processProductImage(input);

    expect(mockSharp).toHaveBeenCalledWith(input);
    const instance = mockSharp();
    expect(instance.resize).toHaveBeenCalledWith(600, 600, {
      fit: "cover",
      position: "center",
    });
    expect(instance.webp).toHaveBeenCalledWith({ quality: 82 });
    expect(instance.toBuffer).toHaveBeenCalled();
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe("webp-output");
  });

  it("returns buffer from sharp toBuffer()", async () => {
    const customOut = Buffer.from("custom");
    mockSharp().toBuffer.mockResolvedValueOnce(customOut);

    const result = await processProductImage(Buffer.from("x"));

    expect(result).toBe(customOut);
  });
});
