export function extractInstallToken(rawInput: string): string {
  const value = rawInput.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token")?.trim();
    if (token) return token;
  } catch {
    // Not a valid URL, continue with fallback parsing.
  }

  const tokenMatch = value.match(/[?&]token=([^&#\s]+)/i);
  if (tokenMatch?.[1]) {
    try {
      return decodeURIComponent(tokenMatch[1]).trim();
    } catch {
      return tokenMatch[1].trim();
    }
  }

  return value;
}
