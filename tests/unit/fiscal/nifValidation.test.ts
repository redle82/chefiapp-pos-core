function validateNIFPure(nif: string): { isValid: boolean; error?: string } {
  const clean = nif.replace(/[\s\-\.]/g, "");
  if (!/^\d{9}$/.test(clean)) return { isValid: false, error: "NIF deve ter 9 digitos" };
  if (!["1", "2", "3", "5", "6", "7", "8", "9"].includes(clean[0]))
    return { isValid: false, error: "Primeiro digito invalido" };
  const weights = [9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += parseInt(clean[i], 10) * weights[i];
  const remainder = sum % 11;
  const expected = remainder < 2 ? 0 : 11 - remainder;
  const actual = parseInt(clean[8], 10);
  if (actual !== expected) return { isValid: false, error: "Check digit invalido" };
  return { isValid: true };
}

describe("NIF Validation (mod-11 algorithm)", () => {
  it("should validate a known valid NIF (pessoa coletiva)", () => {
    expect(validateNIFPure("509746012").isValid).toBe(true);
  });

  it("should validate NIF starting with 1 (pessoa singular)", () => {
    expect(validateNIFPure("196211247").isValid).toBe(true);
  });

  it("should reject NIF with wrong check digit", () => {
    const result = validateNIFPure("123456780");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Check digit");
  });

  it("should reject NIF starting with 0 or 4", () => {
    expect(validateNIFPure("012345678").isValid).toBe(false);
    expect(validateNIFPure("412345678").isValid).toBe(false);
  });

  it("should reject NIF with less than 9 digits", () => {
    expect(validateNIFPure("12345678").isValid).toBe(false);
  });

  it("should reject NIF with more than 9 digits", () => {
    expect(validateNIFPure("1234567890").isValid).toBe(false);
  });

  it("should handle NIF with formatting (dots/dashes/spaces)", () => {
    expect(validateNIFPure("509 746 012").isValid).toBe(true);
    expect(validateNIFPure("509-746-012").isValid).toBe(true);
    expect(validateNIFPure("509.746.012").isValid).toBe(true);
  });

  it("should reject non-numeric input", () => {
    expect(validateNIFPure("abcdefghi").isValid).toBe(false);
  });
});
