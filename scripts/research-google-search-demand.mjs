import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "pricing-research");
const ENDPOINT = "https://suggestqueries.google.com/complete/search";

const SEEDS = [
  "ağır vasıta fren",
  "kamyon fren",
  "tır fren",
  "dorse fren",
  "fren diski",
  "fren kampanası",
  "fren balatası",
  "fren körüğü",
  "fren cırcırı",
  "kaliper tamir takımı",
  "süspansiyon körüğü",
  "ABS sensörü",
  "EBS modülatör",
  "Mercedes Axor fren",
  "Mercedes Actros fren",
  "MAN TGA fren",
  "Ford Cargo fren",
  "Scania fren",
  "Volvo FH fren",
  "BPW dorse",
  "SAF dorse",
  "Knorr kaliper",
  "Wabco EBS",
];

const COMMERCIAL_TERMS = [
  "fiyat",
  "fiyatı",
  "fiyatları",
  "satın",
  "stok",
  "yedek parça",
  "disk",
  "balata",
  "kampana",
  "körük",
  "cırcır",
  "kaliper",
  "sensör",
  "modülatör",
  "bijon",
  "porya",
];

const EXCLUDED_TERMS = [
  "iş ilan",
  "usta",
  "servis",
  "test cihazı",
  "bisiklet",
  "tofaş",
  "broadway",
  "r9",
  "cg ",
];

function normalize(value) {
  return String(value || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function csv(value) {
  return `"${String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;
}

async function fetchSuggestions(seed) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("client", "firefox");
  url.searchParams.set("hl", "tr");
  url.searchParams.set("gl", "tr");
  url.searchParams.set("q", seed);
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 FrencinizSEOResearch/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const payload = await response.json();
  return Array.isArray(payload?.[1]) ? payload[1].map(String) : [];
}

async function suggestionsFor(seed) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fetchSuggestions(seed);
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, attempt * 400));
    }
  }
  throw lastError;
}

const raw = [];
for (const seed of SEEDS) {
  try {
    raw.push({ seed, suggestions: await suggestionsFor(seed), error: "" });
  } catch (error) {
    raw.push({ seed, suggestions: [], error: String(error?.message || error) });
  }
}

const demand = new Map();
for (const row of raw) {
  row.suggestions.forEach((suggestion, index) => {
    const key = normalize(suggestion);
    if (!key || EXCLUDED_TERMS.some(term => key.includes(normalize(term)))) return;
    if (!COMMERCIAL_TERMS.some(term => key.includes(normalize(term)))) return;
    const current = demand.get(key) || {
      query: suggestion,
      score: 0,
      seedCount: 0,
      seeds: [],
      bestPosition: 99,
    };
    current.score += Math.max(1, 10 - index);
    current.bestPosition = Math.min(current.bestPosition, index + 1);
    if (!current.seeds.includes(row.seed)) {
      current.seeds.push(row.seed);
      current.seedCount += 1;
      current.score += 5;
    }
    demand.set(key, current);
  });
}

const opportunities = [...demand.values()]
  .sort((a, b) => b.score - a.score || b.seedCount - a.seedCount || a.bestPosition - b.bestPosition);

const generatedAt = new Date().toISOString();
const report = {
  generatedAt,
  market: "TR",
  source: ENDPOINT,
  methodology: "Google autocomplete demand signal; exact monthly search volume değildir.",
  seedCount: SEEDS.length,
  successfulSeeds: raw.filter(row => !row.error).length,
  opportunityCount: opportunities.length,
  topOpportunities: opportunities.slice(0, 100),
  raw,
};

const date = generatedAt.slice(0, 10);
const jsonName = `google-autocomplete-demand-${date}.json`;
const csvName = `google-autocomplete-demand-${date}.csv`;
const csvRows = [
  ["rank", "query", "score", "seed_count", "best_position", "seeds"].map(csv).join(","),
  ...opportunities.map((row, index) => [
    index + 1,
    row.query,
    row.score,
    row.seedCount,
    row.bestPosition,
    row.seeds.join(" | "),
  ].map(csv).join(",")),
];

await fs.mkdir(OUT_DIR, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(OUT_DIR, jsonName), `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(OUT_DIR, csvName), `${csvRows.join("\n")}\n`, "utf8"),
]);

console.log(JSON.stringify({
  generatedAt,
  successfulSeeds: report.successfulSeeds,
  opportunityCount: report.opportunityCount,
  json: `pricing-research/${jsonName}`,
  csv: `pricing-research/${csvName}`,
  top: opportunities.slice(0, 15).map(row => row.query),
}, null, 2));
