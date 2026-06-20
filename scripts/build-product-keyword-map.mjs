import fs from "fs";
import path from "path";
import {
  productPrimaryCode,
  productSearchDescription,
  productSearchName,
  productSearchTitle,
  productSeoUrl,
} from "../shared/product-seo.js";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "pricing-research");
const SITE = "https://www.frenciniz.com";

const products = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/categories.json"), "utf8"));

function csv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryName(product) {
  return categories.find(category => category.id === product.cat)?.name || product.cat || "Fren Aksami";
}

function firstVehicle(product) {
  const values = [
    ...(Array.isArray(product.compat) ? product.compat : []),
    ...(Array.isArray(product.veh) ? product.veh : []),
  ].map(value => String(value || "").trim()).filter(Boolean);
  return values.find(value => !/^ağır vasıta$/i.test(value)) || values[0] || "";
}

function unique(list) {
  const seen = new Set();
  const out = [];
  for (const value of list.map(v => String(v || "").replace(/\s+/g, " ").trim()).filter(Boolean)) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function keywordSet(product) {
  const seoName = productSearchName(product, categories, 140);
  const code = productPrimaryCode(product);
  const vehicle = firstVehicle(product);
  const category = categoryName(product);
  const sku = product.sku || "";
  return unique([
    seoName,
    vehicle && category ? `${vehicle} ${category}` : "",
    vehicle && code ? `${vehicle} ${code}` : "",
    code && category ? `${code} ${category}` : "",
    sku && category ? `${sku} ${category}` : "",
    product.name,
  ]).slice(0, 8);
}

const rows = products.map(product => {
  const keywords = keywordSet(product);
  return {
    id: product.id,
    category: categoryName(product),
    sku: product.sku || "",
    oem: product.oem || "",
    old_name: product.name || "",
    seo_name: productSearchName(product, categories, 140),
    seo_title: productSearchTitle(product, categories, 74),
    seo_description: productSearchDescription(product, categories, 165),
    primary_query: keywords[0] || "",
    secondary_queries: keywords.slice(1).join(" | "),
    url: productSeoUrl(SITE, product),
    stock: product.stock || 0,
    price: product.price || 0,
  };
});

const headers = [
  "id",
  "category",
  "sku",
  "oem",
  "old_name",
  "seo_name",
  "seo_title",
  "seo_description",
  "primary_query",
  "secondary_queries",
  "url",
  "stock",
  "price",
];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "google-product-keyword-map.csv"),
  `${headers.map(csv).join(",")}\n${rows.map(row => headers.map(header => csv(row[header])).join(",")).join("\n")}\n`
);

const categorySummary = Object.values(rows.reduce((acc, row) => {
  const key = row.category || "Fren Aksami";
  acc[key] ||= { category: key, products: 0, stockProducts: 0, sampleQueries: [] };
  acc[key].products += 1;
  if (Number(row.stock || 0) > 0) acc[key].stockProducts += 1;
  if (acc[key].sampleQueries.length < 5) acc[key].sampleQueries.push(row.primary_query);
  return acc;
}, {})).sort((a, b) => b.products - a.products);

const report = {
  generatedAt: new Date().toISOString(),
  products: rows.length,
  output: "pricing-research/google-product-keyword-map.csv",
  priorityOutput: "pricing-research/google-first-page-priority-urls.csv",
  adsOutput: "pricing-research/google-ads-product-exact-keywords.csv",
  titleRule: "parca + arac/model + OEM/SKU/olcu + Frenciniz",
  searchPatterns: [
    "arac model + parca: Axor 1840 fren balatasi",
    "OEM/WVA + parca: 29246 fren balatasi",
    "dingil/dorse + parca + olcu: BPW Tirsan 18 cm dorse fren kampanasi",
    "stok kodu + parca: ESD 010 27 fren diski",
    "marka seri + parca: Scania G420 fren diski",
  ],
  categorySummary: categorySummary.slice(0, 30),
};

fs.writeFileSync(
  path.join(OUT_DIR, "google-product-keyword-map-report.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

const highIntentCategories = new Set([
  "Fren Diski",
  "ABS'li Fren Diski",
  "Fren Kampanasi",
  "Fren Balatasi",
  "Fren Pabucu",
  "Fren Korugu",
  "Suspansiyon Korugu",
  "Otomatik Fren Circiri",
  "Mekanik Fren Circiri",
  "Fren Circiri",
  "Bijon",
  "Disk Bijonu Civatasi",
  "Porya",
  "Kaliper",
  "Kaliper Tamir Takimi",
]);

function priorityScore(row) {
  let score = 0;
  if (highIntentCategories.has(row.category)) score += 40;
  if (Number(row.stock || 0) > 0) score += 25;
  if (Number(row.stock || 0) >= 20) score += 10;
  if (String(row.oem || "").trim()) score += 20;
  if (String(row.sku || "").trim()) score += 8;
  if (Number(row.price || 0) >= 500 && Number(row.price || 0) <= 20000) score += 5;
  return score;
}

const priorityRows = rows
  .map(row => ({ ...row, score: priorityScore(row) }))
  .sort((a, b) => b.score - a.score || Number(b.stock || 0) - Number(a.stock || 0))
  .slice(0, 200);

const priorityHeaders = [
  "score",
  "id",
  "category",
  "primary_query",
  "secondary_queries",
  "url",
  "stock",
  "price",
];

fs.writeFileSync(
  path.join(OUT_DIR, "google-first-page-priority-urls.csv"),
  `${priorityHeaders.map(csv).join(",")}\n${priorityRows.map(row => priorityHeaders.map(header => csv(row[header])).join(",")).join("\n")}\n`
);

const adsHeaders = [
  "campaign",
  "ad_group",
  "match_type",
  "keyword",
  "final_url",
  "product_id",
  "category",
  "stock",
  "price",
];

const adsRows = [];
for (const row of priorityRows) {
  const queries = unique([
    row.primary_query,
    ...String(row.secondary_queries || "").split("|").map(part => part.trim()),
  ]).slice(0, 3);

  for (const keyword of queries) {
    adsRows.push({
      campaign: "Frenciniz Urun Arama - Exact",
      ad_group: row.category,
      match_type: "Exact",
      keyword,
      final_url: row.url,
      product_id: row.id,
      category: row.category,
      stock: row.stock,
      price: row.price,
    });
  }
}

fs.writeFileSync(
  path.join(OUT_DIR, "google-ads-product-exact-keywords.csv"),
  `${adsHeaders.map(csv).join(",")}\n${adsRows.map(row => adsHeaders.map(header => csv(row[header])).join(",")).join("\n")}\n`
);

console.log(JSON.stringify({
  products: rows.length,
  csv: "pricing-research/google-product-keyword-map.csv",
  report: "pricing-research/google-product-keyword-map-report.json",
  priorityUrls: "pricing-research/google-first-page-priority-urls.csv",
  adsKeywords: "pricing-research/google-ads-product-exact-keywords.csv",
  priorityCount: priorityRows.length,
  adsKeywordCount: adsRows.length,
  examples: rows.slice(0, 5).map(row => ({
    id: row.id,
    primary_query: row.primary_query,
    url: row.url,
  })),
}, null, 2));
