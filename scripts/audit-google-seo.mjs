import fs from "fs";
import path from "path";
import {
  LANDING_PAGES,
  buildLandingSeoIndex,
  filterProductsForLanding,
} from "../api/_lib/seo-landing.js";
import { productSeoSlug, productSeoUrl } from "../shared/product-seo.js";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "pricing-research");
const SITE = "https://www.frenciniz.com";
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
const landingSeoIndex = buildLandingSeoIndex(products);
const landingSeoStats = [...landingSeoIndex.values()].reduce((acc, state) => {
  acc[state.reason] = (acc[state.reason] || 0) + 1;
  return acc;
}, {});

const landingRows = LANDING_PAGES.map(page => {
  const matched = filterProductsForLanding(products, page, 24);
  const seoState = landingSeoIndex.get(page.slug);
  return {
    slug: page.slug,
    heading: page.heading,
    title: page.title,
    description: page.description,
    priority: page.priority,
    indexable: Boolean(seoState?.indexable),
    exactProducts: seoState?.strictCount || 0,
    canonical: seoState?.canonical || `${SITE}/${page.slug}`,
    seoReason: seoState?.reason || "unknown",
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
    seoUrl: productSeoUrl("https://www.frenciniz.com", product),
  };
});

const staticPages = 11;
const indexableLandingPages = landingSeoStats.selected || 0;
const sitemapUrlEstimate = staticPages + indexableLandingPages + categoryPages + products.length;

const report = {
  generatedAt: new Date().toISOString(),
  site: "https://www.frenciniz.com",
  totals: {
    products: products.length,
    categories: categories.length,
    categoryPages,
    landingPagesGenerated: LANDING_PAGES.length,
    landingPagesIndexable: indexableLandingPages,
    landingPagesCanonicalized: landingSeoStats.duplicate || 0,
    landingPagesExcluded: landingSeoStats["insufficient-exact-products"] || 0,
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
    sitemap: "https://www.frenciniz.com/sitemap.xml",
    merchantFeed: "https://www.frenciniz.com/google-merchant-feed.xml",
    metaCatalogFeed: "https://www.frenciniz.com/meta-catalog-feed.csv",
    robots: "https://www.frenciniz.com/robots.txt",
    productSeoUrls: "pricing-research/google-seo-product-urls.csv",
  },
  highIntentLandingPages: landingRows
    .filter(row => row.indexable && (row.priority >= 0.84 || row.exactProducts >= 12))
    .slice(0, 40),
  landingPagesNeedingMoreSpecificProducts: landingRows
    .filter(row => !row.indexable)
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

const headers = ["slug", "heading", "title", "description", "priority", "indexable", "exactProducts", "canonical", "seoReason", "matchedProducts", "categories", "topProducts"];
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
  landingPagesGenerated: LANDING_PAGES.length,
  landingPagesIndexable: indexableLandingPages,
  sitemapUrlEstimate,
  productsWithImage,
  productsWithOem,
  report: "pricing-research/google-seo-readiness-report.json",
  csv: "pricing-research/google-seo-keyword-pages.csv",
  productUrls: "pricing-research/google-seo-product-urls.csv",
}, null, 2));
