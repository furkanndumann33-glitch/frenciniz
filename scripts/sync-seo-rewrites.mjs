import fs from "fs";
import path from "path";
import { LANDING_PAGES } from "../api/_lib/seo-landing.js";

const ROOT = process.cwd();
const VERCEL_PATH = path.join(ROOT, "vercel.json");

function isLandingRewrite(rewrite) {
  return String(rewrite?.destination || "").startsWith("/api/sitemap?type=landing&slug=");
}

const config = JSON.parse(fs.readFileSync(VERCEL_PATH, "utf8"));
const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
const baseRewrites = rewrites.filter(rewrite => !isLandingRewrite(rewrite));
const landingRewrites = LANDING_PAGES.map(page => ({
  source: `/${page.slug}`,
  destination: `/api/sitemap?type=landing&slug=${page.slug}`,
}));

const insertAfter = baseRewrites.findIndex(rewrite => rewrite.source === "/facebook-catalog-feed.csv");
const nextRewrites = insertAfter >= 0
  ? [
      ...baseRewrites.slice(0, insertAfter + 1),
      ...landingRewrites,
      ...baseRewrites.slice(insertAfter + 1),
    ]
  : [...landingRewrites, ...baseRewrites];

config.rewrites = nextRewrites;
fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Synced ${landingRewrites.length} SEO landing rewrites to vercel.json`);
