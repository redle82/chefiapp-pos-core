#!/usr/bin/env node
import { performance } from "node:perf_hooks";

const base = process.env.BENCH_BASE_URL || "http://localhost:5175";
const core = process.env.BENCH_CORE_URL || "http://localhost:3001";

const targets = [
  { name: "landing", url: `${base}/landing` },
  { name: "features", url: `${base}/features` },
  { name: "compare", url: `${base}/compare` },
  { name: "core-health", url: `${core}/rest/v1/` },
];

async function measure(url) {
  const start = performance.now();
  try {
    const response = await fetch(url, { method: "GET" });
    const ms = performance.now() - start;
    return {
      ok: response.ok,
      status: response.status,
      ms: Number(ms.toFixed(1)),
    };
  } catch (error) {
    const ms = performance.now() - start;
    return {
      ok: false,
      status: 0,
      ms: Number(ms.toFixed(1)),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const results = [];
for (const target of targets) {
  const samples = [];
  for (let i = 0; i < 3; i += 1) {
    samples.push(await measure(target.url));
  }

  const successful = samples.filter(
    (sample) => sample.ok || sample.status === 401,
  );
  const avgMs = successful.length
    ? Number(
        (
          successful.reduce((acc, sample) => acc + sample.ms, 0) /
          successful.length
        ).toFixed(1),
      )
    : null;

  results.push({
    target: target.name,
    url: target.url,
    samples,
    avgMs,
    pass: successful.length === samples.length,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  base,
  core,
  allPass: results.every((row) => row.pass),
  results,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.allPass) {
  process.exitCode = 1;
}
