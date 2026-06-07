import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productSeoUrl } from "../shared/product-seo.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.frenciniz.com";
const OUT_DIR = path.join(ROOT, "pricing-research");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function hasRealImage(product) {
  const img = String(product?.img || "").toLowerCase();
  return !!img && !img.includes("placehold") && !img.includes("/logo") && !img.includes("logo.");
}

function topValues(values, limit = 8) {
  const counts = new Map();
  for (const raw of values.flat().filter(Boolean)) {
    const value = String(raw).trim();
    const lower = value.toLocaleLowerCase("tr-TR");
    if (!value || lower === "agir vasita" || lower === "ağır vasıta") continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function categoryPath(cat, categoryById) {
  if (!cat) return { category: "", group: "" };
  const parent = cat.parent ? categoryById.get(cat.parent) : null;
  return { category: cat.name || cat.id, group: parent?.name || (cat.isGroup ? cat.name : "") };
}

function groupProductIds(group, categories) {
  return new Set(categories.filter(c => c.parent === group.id).map(c => c.id));
}

function socialCaption(groupName, productCount, topCompat) {
  const compatText = topCompat.length ? topCompat.map(x => x.value).slice(0, 4).join(", ") : "kamyon, tir, otobus ve dorse";
  return [
    `${groupName} grubunda ${productCount} urun: OEM kodu, sase veya eski parca fotosu ile hizli uyumluluk teyidi.`,
    `Uyum odagi: ${compatText}.`,
    "WhatsApp: 0850 888 7881 | www.frenciniz.com",
    "#frenciniz #agirvasita #kamyon #tir #otobus #dorse #frenaksami",
  ].join("\n");
}

const products = readJson("public/data/products.json");
const categories = readJson("public/data/categories.json");
const categoryById = new Map(categories.map(c => [c.id, c]));
const groups = categories.filter(c => c.isGroup);

const missingImages = products.filter(p => !hasRealImage(p));
const withRealImages = products.filter(hasRealImage);
const inStock = products.filter(p => Number(p.stock || 0) > 0);
const missingSku = products.filter(p => !p.sku);
const missingOem = products.filter(p => !p.oem);
const missingDesc = products.filter(p => !p.desc || String(p.desc).trim().length < 60);
const missingPrice = products.filter(p => p.price == null || Number(p.price) <= 0);

const categoryOpportunities = groups.map(group => {
  const ids = groupProductIds(group, categories);
  const scoped = products.filter(p => ids.has(p.cat));
  const missing = scoped.filter(p => !hasRealImage(p));
  const stock = scoped.filter(p => Number(p.stock || 0) > 0);
  const topCompat = topValues(scoped.map(p => p.compat || []), 6);
  const topSkus = scoped
    .filter(p => Number(p.stock || 0) > 0)
    .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
    .slice(0, 8)
    .map(p => ({ id: p.id, sku: p.sku, name: p.name, stock: p.stock, price: p.price, url: productSeoUrl(SITE, p) }));
  return {
    id: group.id,
    name: group.name,
    productCount: scoped.length,
    inStockCount: stock.length,
    missingImageCount: missing.length,
    realImageRate: scoped.length ? Number(((scoped.length - missing.length) / scoped.length).toFixed(3)) : 0,
    topCompatibility: topCompat,
    topStockProducts: topSkus,
  };
}).sort((a, b) => b.productCount - a.productCount);

const report = {
  generatedAt: new Date().toISOString(),
  site: SITE,
  feedUrls: {
    googleMerchant: `${SITE}/google-merchant-feed.xml`,
    metaCatalog: `${SITE}/meta-catalog-feed.csv`,
    sitemap: `${SITE}/sitemap.xml`,
  },
  totals: {
    products: products.length,
    categories: categories.length,
    categoryGroups: groups.length,
    inStock: inStock.length,
    outOfStock: products.length - inStock.length,
    realImages: withRealImages.length,
    missingImages: missingImages.length,
    missingSku: missingSku.length,
    missingOem: missingOem.length,
    missingDescription: missingDesc.length,
    missingPrice: missingPrice.length,
    merchantRows: products.filter(p => p.id && p.name && p.price != null).length,
    metaRows: products.filter(p => p.id && p.name && p.price != null).length,
  },
  priorityActions: [
    "Google Merchant Center'da feed URL olarak https://www.frenciniz.com/google-merchant-feed.xml kullan.",
    "Meta katalogda feed URL olarak https://www.frenciniz.com/meta-catalog-feed.csv kullan.",
    "Eksik gorselli urunlerde once stoklu ve yuksek talep kategorileri tamamla: suspansiyon korugu, fren korugu, porya, fren pabucu, bijon.",
    "WhatsApp teklif akisinda musteriye OEM, sase ve eski parca fotosu istendigini soyle.",
    "Instagram/Facebook'ta tek reklam butcesi yoksa once organik story/post + WhatsApp mesaj kampanyasi yap.",
  ],
  categoryOpportunities,
  missingImageSample: missingImages.slice(0, 30).map(p => {
    const cat = categoryById.get(p.cat);
    const pathInfo = categoryPath(cat, categoryById);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: pathInfo.category,
      group: pathInfo.group,
      stock: p.stock,
      price: p.price,
      oem: p.oem,
      url: productSeoUrl(SITE, p),
    };
  }),
};

const missingRows = [
  ["id", "sku", "name", "category", "group", "stock", "price", "oem", "url", "next_action"],
  ...missingImages.map(p => {
    const cat = categoryById.get(p.cat);
    const pathInfo = categoryPath(cat, categoryById);
    return [
      p.id,
      p.sku,
      p.name,
      pathInfo.category,
      pathInfo.group,
      p.stock,
      p.price,
      p.oem,
      productSeoUrl(SITE, p),
      "Gercek urun fotosu veya kategoriye uygun AI urun gorseli hazirla",
    ];
  }),
].map(row => row.map(csvEscape).join(",")).join("\n");

const socialPlan = {
  generatedAt: report.generatedAt,
  postAssetsAlreadyAvailable: [
    "/social/frenciniz-12-kategori-post-1080.png",
    "/social/frenciniz-12-kategori-story-1080x1920.png",
    "/social/frenciniz-tum-kategoriler-post-1080.png",
    "/social/frenciniz-tum-kategoriler-story-1080x1920.png",
  ],
  categories: categoryOpportunities.map(group => ({
    id: group.id,
    name: group.name,
    productCount: group.productCount,
    recommendedFormat: "Story + kare post",
    caption: socialCaption(group.name, group.productCount, group.topCompatibility),
    storyText: `${group.name}: ${group.productCount} urun | OEM kodu ile hizli teklif | WhatsApp 0850 888 7881`,
  })),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "marketing-readiness-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "missing-product-images.csv"), missingRows, "utf8");
fs.writeFileSync(path.join(OUT_DIR, "social-post-plan-12-kategori.json"), JSON.stringify(socialPlan, null, 2), "utf8");

console.log(JSON.stringify({
  products: report.totals.products,
  merchantRows: report.totals.merchantRows,
  metaRows: report.totals.metaRows,
  missingImages: report.totals.missingImages,
  reports: [
    "pricing-research/marketing-readiness-report.json",
    "pricing-research/missing-product-images.csv",
    "pricing-research/social-post-plan-12-kategori.json",
  ],
}, null, 2));
