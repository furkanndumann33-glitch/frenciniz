import fs from "fs";
import path from "path";
import { LANDING_PAGES } from "../api/_lib/seo-landing.js";

const ROOT = process.cwd();
const VERCEL_PATH = path.join(ROOT, "vercel.json");
const CATEGORIES_PATH = path.join(ROOT, "public/data/categories.json");

function isLandingRewrite(rewrite) {
  return String(rewrite?.destination || "").startsWith("/api/sitemap?type=landing&slug=");
}

function isCategoryRewrite(rewrite) {
  return String(rewrite?.destination || "").startsWith("/api/sitemap?type=category&slug=");
}

const config = JSON.parse(fs.readFileSync(VERCEL_PATH, "utf8"));
const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
const baseRewrites = rewrites.filter(rewrite => !isLandingRewrite(rewrite) && !isCategoryRewrite(rewrite));
const landingRewrites = LANDING_PAGES.map(page => ({
  source: `/${page.slug}`,
  destination: `/api/sitemap?type=landing&slug=${page.slug}`,
}));
const landingSources = new Set(landingRewrites.map(rewrite => rewrite.source));
const categoryRewrites = categories
  .filter(category => category?.id && category.id !== "all")
  .map(category => ({
    source: `/${category.id}`,
    destination: `/api/sitemap?type=category&slug=${category.id}`,
  }))
  .filter(rewrite => !landingSources.has(rewrite.source));

const insertAfter = baseRewrites.findIndex(rewrite => rewrite.source === "/facebook-catalog-feed.csv");
const nextRewrites = insertAfter >= 0
  ? [
      ...baseRewrites.slice(0, insertAfter + 1),
      ...landingRewrites,
      ...categoryRewrites,
      ...baseRewrites.slice(insertAfter + 1),
    ]
  : [...landingRewrites, ...categoryRewrites, ...baseRewrites];

config.rewrites = nextRewrites;
fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Synced ${landingRewrites.length} SEO landing rewrites and ${categoryRewrites.length} category rewrites to vercel.json`);
