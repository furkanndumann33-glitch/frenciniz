import fs from "fs";
import path from "path";
import {
  LANDING_PAGES,
  filterProductsForLanding,
} from "../api/_lib/seo-landing.js";
import { productSeoSlug, productSeoUrl } from "../shared/product-seo.js";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "pricing-research");
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/categories.json"), "utf8"));

function csv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function hasRealImage(product) {
  const img = String(product?.img || "").toLowerCase();
  return Boolean(img && !img.includes("placehold") && !img.includes("/logo") && !img.includes("logo."));
}

const categoryPages = categories.filter(category => category.id && category.id !== "all").length;
const productsWithImage = products.filter(hasRealImage).length;
const productsWithOem = products.filter(product => product.oem).length;
const productsWithDescription = products.filter(product => String(product.desc || "").trim().length >= 80).length;
const stockProducts = products.filter(product => Number(product.stock || 0) > 0).length;
const brandCounts = products.reduce((acc, product) => {
  if (product.brand) acc[product.brand] = (acc[product.brand] || 0) + 1;
  return acc;
}, {});
const brandFilterPages = Math.min(10, Object.keys(brandCounts).length);

const landingRows = LANDING_PAGES.map(page => {
  const matched = filterProductsForLanding(products, page, 24);
  return {
    slug: page.slug,
    heading: page.heading,
    title: page.title,
    description: page.description,
    priority: page.priority,
    matchedProducts: matched.length,
    categories: (page.cats || []).join("|"),
    topProducts: matched.slice(0, 5).map(product => `${product.id}:${product.name}`).join(" | "),
  };
});

const categoryById = new Map(categories.map(category => [category.id, category]));
const productRows = products.map(product => {
  const category = categoryById.get(product.cat);
  const group = category?.parent ? categoryById.get(category.parent) : null;
  return {
    id: product.id,
    slug: productSeoSlug(product),
    name: product.name,
    sku: product.sku,
    oem: product.oem,
    brand: product.brand || "Ekersan",
    category: category?.name || product.cat || "",
    group: group?.name || "",
    stock: product.stock,
    price: product.price,
    seoUrl: productSeoUrl("https://frenciniz.com", product),
  };
});

const staticPages = 11;
const vehicleFilterPages = 4;
const sitemapUrlEstimate = staticPages + LANDING_PAGES.length + categoryPages + brandFilterPages + vehicleFilterPages + products.length;

const report = {
  generatedAt: new Date().toISOString(),
  site: "https://frenciniz.com",
  totals: {
    products: products.length,
    categories: categories.length,
    categoryPages,
    landingPages: LANDING_PAGES.length,
    sitemapUrlEstimate,
  },
  productReadiness: {
    productsWithImage,
    productsWithOem,
    productsWithDescription,
    stockProducts,
    imageCoveragePercent: Number(((productsWithImage / products.length) * 100).toFixed(2)),
    oemCoveragePercent: Number(((productsWithOem / products.length) * 100).toFixed(2)),
    descriptionCoveragePercent: Number(((productsWithDescription / products.length) * 100).toFixed(2)),
  },
  seoAssets: {
    sitemap: "https://frenciniz.com/sitemap.xml",
    merchantFeed: "https://frenciniz.com/google-merchant-feed.xml",
    metaCatalogFeed: "https://frenciniz.com/meta-catalog-feed.csv",
    robots: "https://frenciniz.com/robots.txt",
    productSeoUrls: "pricing-research/google-seo-product-urls.csv",
  },
  highIntentLandingPages: landingRows
    .filter(row => row.priority >= 0.84 || row.matchedProducts >= 12)
    .slice(0, 40),
  landingPagesNeedingMoreSpecificProducts: landingRows
    .filter(row => row.matchedProducts < 6)
    .slice(0, 40),
  nextManualActions: [
    "Google Search Console'da sitemap.xml yeniden gönder.",
    "Search Console URL Denetimi ile ana sayfa ve en yüksek niyetli 10 landing sayfası için dizine ekleme iste.",
    "Merchant Center ürün feedi zaten temizse haftalık otomatik çekim açık kalsın.",
    "3-7 gün sonra Search Console Performans raporunda sorguları kontrol edip title/descriptionları kazanan sorgulara göre daralt.",
  ],
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "google-seo-readiness-report.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

const headers = ["slug", "heading", "title", "description", "priority", "matchedProducts", "categories", "topProducts"];
const lines = [
  headers.map(csv).join(","),
  ...landingRows.map(row => headers.map(header => csv(row[header])).join(",")),
];
fs.writeFileSync(path.join(OUT_DIR, "google-seo-keyword-pages.csv"), `${lines.join("\n")}\n`);

const productHeaders = ["id", "slug", "name", "sku", "oem", "brand", "category", "group", "stock", "price", "seoUrl"];
const productLines = [
  productHeaders.map(csv).join(","),
  ...productRows.map(row => productHeaders.map(header => csv(row[header])).join(",")),
];
fs.writeFileSync(path.join(OUT_DIR, "google-seo-product-urls.csv"), `${productLines.join("\n")}\n`);

console.log(JSON.stringify({
  products: products.length,
  landingPages: LANDING_PAGES.length,
  sitemapUrlEstimate,
  productsWithImage,
  productsWithOem,
  report: "pricing-research/google-seo-readiness-report.json",
  csv: "pricing-research/google-seo-keyword-pages.csv",
  productUrls: "pricing-research/google-seo-product-urls.csv",
}, null, 2));
