import fs from "node:fs";
import path from "node:path";

const MIN_BRANCH_PCT = Number(process.env.BRANCH_COVERAGE_MIN || "50");
const coverageCandidates = [
  path.resolve(
    process.cwd(),
    "merchant-portal",
    "coverage",
    "coverage-final.json",
  ),
  path.resolve(process.cwd(), "coverage", "coverage-final.json"),
];
const coveragePath = coverageCandidates.find((candidate) =>
  fs.existsSync(candidate),
);

function fail(message, code = 1) {
  console.error(`\n❌ ${message}`);
  process.exit(code);
}

if (!coveragePath) {
  fail(
    `Coverage artifact not found. Expected one of: ${coverageCandidates.join(
      " | ",
    )}. Run \`pnpm --filter merchant-portal exec vitest run --coverage\` first.`,
  );
}

const cov = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
let covered = 0;
let total = 0;

for (const fileData of Object.values(cov)) {
  const branches =
    (fileData && typeof fileData === "object" ? fileData.b : null) || {};
  for (const arr of Object.values(branches)) {
    if (!Array.isArray(arr)) continue;
    total += arr.length;
    covered += arr.filter((hits) => Number(hits) > 0).length;
  }
}

if (total === 0) {
  fail(
    "No branch data found in coverage-final.json. Ensure Vitest coverage is configured correctly.",
  );
}

const pct = (covered * 100) / total;
const pctFixed = pct.toFixed(2);

console.log(
  `\n📊 Branch coverage (canonical full run): ${covered}/${total} = ${pctFixed}%`,
);
console.log(`🎯 Required minimum: ${MIN_BRANCH_PCT.toFixed(2)}%`);

if (pct < MIN_BRANCH_PCT) {
  fail(
    `Branch coverage gate failed: ${pctFixed}% < ${MIN_BRANCH_PCT.toFixed(
      2,
    )}%. ` +
      `Increase test coverage or adjust non-critical scope before merge.`,
  );
}

console.log("✅ Branch coverage gate passed.");
