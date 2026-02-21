/**
 * lint-staged: run ESLint only on staged files inside merchant-portal,
 * from merchant-portal dir, so we never pass billing-core/root files and get config errors.
 */
const path = require("path");

function lintMerchantPortal(filenames) {
  const root = path.resolve(__dirname);
  const mpDir = path.join(root, "merchant-portal");
  const inMp = filenames.filter((f) => {
    const abs = path.isAbsolute(f) ? f : path.join(root, f);
    return abs.startsWith(mpDir + path.sep) || abs === mpDir;
  });
  if (inMp.length === 0) return "true";
  const relative = inMp.map((f) => {
    const abs = path.isAbsolute(f) ? f : path.join(root, f);
    return path.relative(mpDir, abs);
  });
  return `cd merchant-portal && npx eslint --max-warnings 9999 --no-warn-ignored ${relative.map((f) => `"${f}"`).join(" ")}`;
}

module.exports = {
  "*.{js,jsx,ts,tsx}": (filenames) => lintMerchantPortal(filenames),
  "*.{json,md}": "node -e \"process.exit(0)\"",
};
