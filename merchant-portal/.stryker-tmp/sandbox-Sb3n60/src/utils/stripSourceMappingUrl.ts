const SOURCE_MAPPING_URL_REGEX = /\/\/[#@]\s*sourceMappingURL=[^\n]*/g;
const SOURCE_MAPPING_CSS_REGEX = /\/\*[#@]\s*sourceMappingURL=[^*]*\*\//g;

export function stripSourceMappingUrl(code: string): string {
  if (!code.includes("sourceMappingURL")) return code;

  return code
    .replace(SOURCE_MAPPING_URL_REGEX, "")
    .replace(SOURCE_MAPPING_CSS_REGEX, "");
}
