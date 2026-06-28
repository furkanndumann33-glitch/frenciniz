import fs from "fs";
import path from "path";

const SITE = "https://www.frenciniz.com";
const ROOT = process.cwd();
const KEY_PATH = path.join(ROOT, "public", "indexnow-key.txt");
const PRIORITY_CSV = path.join(ROOT, "pricing-research", "search-console-indexing-priority.csv");
const OUT_PATH = path.join(ROOT, "pricing-research", "indexnow-submit-report.json");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function readPriorityUrls(limit = 180) {
  const text = fs.readFileSync(PRIORITY_CSV, "utf8").trim();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const urlIndex = headers.indexOf("url");
  if (urlIndex < 0) throw new Error("url column missing in priority csv");
  const urls = [];
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const url = cells[urlIndex];
    if (url && url.startsWith(SITE) && !urls.includes(url)) urls.push(url);
    if (urls.length >= limit) break;
  }
  return urls;
}

async function submitIndexNow(urls) {
  const key = fs.readFileSync(KEY_PATH, "utf8").trim();
  const payload = {
    host: "www.frenciniz.com",
    key,
    keyLocation: `${SITE}/indexnow-key.txt`,
    urlList: urls,
  };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  return {
    status: response.status,
    ok: response.ok,
    body: body.slice(0, 1000),
  };
}

const urls = readPriorityUrls(Number(process.argv[2] || 180));
const result = await submitIndexNow(urls);
const report = {
  submittedAt: new Date().toISOString(),
  engine: "IndexNow",
  keyLocation: `${SITE}/indexnow-key.txt`,
  urlCount: urls.length,
  result,
  sampleUrls: urls.slice(0, 12),
};

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
