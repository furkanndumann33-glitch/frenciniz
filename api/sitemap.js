// Dinamik sitemap.xml — KV'den ürünler, fallback static JSON
import fs from "fs";
import path from "path";
import { LANDING_PAGES, getLandingBySlug } from "./_lib/seo-landing.js";
import { renderLanding, renderLandingIndex } from "./_lib/landing-render.js";
import {
  productIdFromRoute,
  productPrimaryCode,
  productSeoFaqItems,
  productSearchDescription,
  productSearchName,
  productSearchTitle,
  productSeoUrl,
} from "../shared/product-seo.js";

const SITE = "https://www.frenciniz.com";
const GOOGLE_MOTOR_VEHICLE_BRAKING_CATEGORY =
  "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Braking";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/urunler", priority: "0.9", changefreq: "daily" },
  { loc: "/brands", priority: "0.7", changefreq: "weekly" },
  { loc: "/about", priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.7", changefreq: "monthly" },
  { loc: "/faq", priority: "0.6", changefreq: "monthly" },
  { loc: "/shipping", priority: "0.5", changefreq: "monthly" },
  { loc: "/return-policy", priority: "0.5", changefreq: "monthly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/kvkk", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvEscape(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function merchantSafeProductText(value) {
  return String(value || "")
    .replace(/Kaliper\s+D(?:\u00fc|u)rb(?:\u00fc|u)n\s+Tak(?:\u0131|i)m(?:\u0131|i)/gi, "Kaliper Kilavuz Pim Takimi")
    .replace(/D(?:\u00fc|u)rb(?:\u00fc|u)n\s+Tak(?:\u0131|i)m(?:\u0131|i)/gi, "Kilavuz Pim Takimi");
}

function isRealProductImage(value) {
  const img = String(value || "").toLowerCase();
  return !!img && !img.includes("placehold") && !img.includes("missing-product") && !img.includes("/logo") && !img.includes("logo.");
}

function absoluteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function withUtm(url, params = {}) {
  try {
    const out = new URL(url, SITE);
    for (const [key, value] of Object.entries(params)) {
      if (value) out.searchParams.set(key, value);
    }
    return out.toString();
  } catch {
    return url;
  }
}

function compactText(value, max = 155) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function cleanSeoText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function shortCode(value, max = 38) {
  const first = productPrimaryCode({ oem: value }) || cleanSeoText(value)
    .split(/[,;/|]+|\s+-\s+/)
    .map(part => part.trim())
    .find(Boolean) || "";
  return first.slice(0, max);
}

function categoryNameForProduct(product, categories = []) {
  const sub = categories.find(c => c.id === product?.cat);
  return merchantSafeProductText(sub?.name || product?.cat || "Agir Vasita Fren Aksami");
}

function vehiclePhrase(product) {
  const values = [
    ...(Array.isArray(product?.compat) ? product.compat : []),
    ...(Array.isArray(product?.veh) ? product.veh : []),
  ].map(cleanSeoText).filter(Boolean);
  if (values.length) return values.slice(0, 5).join(", ");

  const text = cleanSeoText(product?.name).toLowerCase();
  const known = [
    "Mercedes", "Axor", "Actros", "Atego", "Arocs", "Travego", "Tourismo",
    "MAN", "TGA", "TGS", "TGX", "Volvo", "FH", "FM", "Scania", "DAF",
    "Ford Cargo", "F-Max", "Renault", "Premium", "Kerax", "Iveco",
    "BPW", "SAF", "Krone", "Kogel", "Schmitz", "Tirsan", "ROR", "Meritor",
  ].filter(term => text.includes(term.toLowerCase()));
  return [...new Set(known)].slice(0, 6).join(", ");
}

const SALES_PRIORITY_CATEGORIES = new Set([
  "fren-diski",
  "fren-diski-abs-li",
  "fren-kampanasi",
  "fren-balatasi",
  "disk-bijonu-civatasi",
  "bijon",
  "porya",
  "fren-korugu",
  "suspansiyon-korugu",
  "fren-pabucu",
  "fren-circiri",
  "otomatik-fren-circiri",
  "kaliper",
  "kaliper-tamir-takimi",
]);

function salesPriorityLabel(product) {
  const price = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  let score = 0;
  if (SALES_PRIORITY_CATEGORIES.has(product?.cat)) score += 4;
  if (isRealProductImage(product?.img)) score += 2;
  if (cleanSeoText(product?.oem)) score += 2;
  if (stock > 0) score += 1;
  if (stock >= 20) score += 1;
  if (price >= 400 && price <= 20000) score += 1;
  if (Array.isArray(product?.compat) && product.compat.some(value => !/agir vasita/i.test(cleanSeoText(value)))) score += 1;
  if (score >= 9) return "sales-priority-1";
  if (score >= 6) return "sales-priority-2";
  return "sales-priority-3";
}

function buildSeoProductTitle(product, categories = [], max = 74) {
  return productSearchTitle(product, categories, max);
}

function buildSeoProductDescription(product, categories = [], max = 5000) {
  const productName = productSearchName(product, categories, 140) || merchantSafeProductText(product?.name || "Agir vasita fren parcasi");
  const category = categoryNameForProduct(product, categories);
  const brand = merchantSafeProductText(product?.brand || "Ekersan");
  const sku = cleanSeoText(product?.sku);
  const oem = cleanSeoText(product?.oem);
  const vehicles = vehiclePhrase(product);
  const stock = Number(product?.stock || 0);
  const pieces = [
    productSearchDescription(product, categories, 260),
    `${productName}, ${category} kategorisinde ${brand} marka agir vasita fren parcasi.`,
    sku ? `Stok kodu: ${sku}.` : "",
    oem ? `OEM / muadil kod: ${oem}.` : "",
    vehicles ? `Uyumluluk adaylari: ${vehicles}.` : "",
    "Kamyon, tir, otobus ve dorse fren sistemleri icin OEM kodu, sase no veya eski parca fotografi ile uyumluluk teyidi yapilir.",
    stock > 0 ? `Stokta ${Math.floor(stock)} adet gorunuyor; fiyat ve kargo icin teklif alabilirsiniz.` : "Stok ve fiyat icin WhatsApp uzerinden teyit alabilirsiniz.",
    "Ayni gun kargo, 12 taksit ve 14 gun iade destegi vardir.",
  ];
  return compactText(pieces.filter(Boolean).join(" "), max);
}

function readIndexHtml() {
  for (const file of [path.join(process.cwd(), "dist/index.html"), path.join(process.cwd(), "index.html")]) {
    try { return fs.readFileSync(file, "utf8"); } catch {}
  }
  return "";
}

function productJsonLd(product, canonical, image, categories = []) {
  const price = Number(product.price || 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [image],
    description: compactText(product.desc || `${product.name} ağır vasıta fren aksamı ürünüdür.`, 500),
    sku: product.sku || String(product.id),
    mpn: product.oem || product.sku || String(product.id),
    brand: { "@type": "Brand", name: product.brand || "Ekersan" },
    category: categoryNameForProduct(product, categories),
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "TRY",
      price: price > 0 ? price.toFixed(2) : undefined,
      availability: Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

function replaceOrInject(html, pattern, replacement, before = "</head>") {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(before, `${replacement}\n${before}`);
}

function renderProductHtml(product) {
  const canonical = productSeoUrl(SITE, product);
  const title = compactText(`${product.name} | ${product.sku || product.oem || "Ağır Vasıta Fren Aksamı"} | Frenciniz`, 70);
  const description = compactText(
    product.desc ||
      `${product.name} için OEM/muadil uyumluluk teyidi, aynı gün kargo ve 12 taksit imkanı. Stok kodu: ${product.sku || product.id}.`,
    155
  );
  const image = absoluteUrl(product.img || (Array.isArray(product.images) && product.images[0]) || "/img/site/frenciniz-logo-real-og.jpg");
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(productJsonLd(product, canonical, image))}</script>`;
  let html = readIndexHtml();

  if (!html) {
    html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${xmlEscape(title)}</title><meta name="description" content="${xmlEscape(description)}"><link rel="canonical" href="${xmlEscape(canonical)}">${jsonLd}</head><body><h1>${xmlEscape(product.name)}</h1><p>${xmlEscape(description)}</p><a href="${xmlEscape(canonical)}">Ürünü aç</a></body></html>`;
    return html;
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  html = replaceOrInject(html, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${xmlEscape(canonical)}" />`);
  html = replaceOrInject(html, /<meta property="og:type" content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="product" />`);
  html = replaceOrInject(html, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${xmlEscape(title)}" />`);
  html = replaceOrInject(html, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${xmlEscape(image)}" />`);
  html = replaceOrInject(html, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${xmlEscape(canonical)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${xmlEscape(title)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${xmlEscape(image)}" />`);
  return html.replace("</head>", `${jsonLd}\n</head>`);
}

function productJsonLdSeo(product, canonical, image, categories = []) {
  const price = Number(product.price || 0);
  const seoName = productSearchName(product, categories, 140);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: seoName || product.name,
    image: [image],
    description: buildSeoProductDescription(product, categories, 500),
    sku: product.sku || String(product.id),
    mpn: product.oem || product.sku || String(product.id),
    productID: String(product.id || ""),
    url: canonical,
    brand: { "@type": "Brand", name: product.brand || "Ekersan" },
    category: categoryNameForProduct(product, categories),
    additionalProperty: [
      product.sku ? { "@type": "PropertyValue", name: "SKU", value: product.sku } : null,
      product.oem ? { "@type": "PropertyValue", name: "OEM / Muadil", value: product.oem } : null,
      vehiclePhrase(product) ? { "@type": "PropertyValue", name: "Uyumluluk Adaylari", value: vehiclePhrase(product) } : null,
    ].filter(Boolean),
    aggregateRating: Number(product.rating || 0) > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating || 4.7).toFixed(1),
      reviewCount: Math.max(1, Number(product.reviews || 1)),
      bestRating: "5",
      worstRating: "1",
    } : undefined,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "TRY",
      price: price > 0 ? price.toFixed(2) : undefined,
      priceValidUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Frenciniz", url: SITE },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: price >= 3000 ? "0.00" : "150.00",
          currency: "TRY",
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };
}

function productFaqJsonLd(product, categories = []) {
  const faqItems = productSeoFaqItems(product, categories);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function productBreadcrumbJsonLd(product, canonical, categories = []) {
  const sub = categories.find(category => category.id === product?.cat);
  const group = sub?.parent ? categories.find(category => category.id === sub.parent) : null;
  const items = [
    { name: "Frenciniz", item: SITE },
    group ? { name: group.name, item: `${SITE}/${group.id}` } : null,
    sub ? { name: sub.name, item: `${SITE}/${sub.id}` } : null,
    { name: productSearchName(product, categories, 140) || product?.name || "Urun", item: canonical },
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function productNoScriptHtml(product, categories = [], canonical = "") {
  const seoName = productSearchName(product, categories, 140) || product?.name || "Frenciniz urunu";
  const category = categoryNameForProduct(product, categories);
  const description = buildSeoProductDescription(product, categories, 700);
  const vehicles = vehiclePhrase(product);
  const price = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  return `
  <noscript>
    <main>
      <article itemscope itemtype="https://schema.org/Product">
        <h1 itemprop="name">${xmlEscape(seoName)}</h1>
        <p itemprop="description">${xmlEscape(description)}</p>
        <ul>
          <li>Kategori: ${xmlEscape(category)}</li>
          ${product?.sku ? `<li>SKU / stok kodu: ${xmlEscape(product.sku)}</li>` : ""}
          ${product?.oem ? `<li>OEM / muadil kod: ${xmlEscape(product.oem)}</li>` : ""}
          ${vehicles ? `<li>Uyumluluk adaylari: ${xmlEscape(vehicles)}</li>` : ""}
          <li>Stok: ${stock > 0 ? `${Math.floor(stock)} adet` : "stok teyidi gerekli"}</li>
          ${price > 0 ? `<li>Fiyat: ${xmlEscape(price.toFixed(2))} TRY</li>` : ""}
        </ul>
        <p>Kesin uyumluluk icin OEM kodu, sase no veya eski parca fotografi ile Frenciniz WhatsApp hattindan teyit alin.</p>
        <a href="${xmlEscape(canonical)}">Urun sayfasini ac</a>
      </article>
    </main>
  </noscript>`;
}

function renderSeoProductHtml(product, categories = []) {
  const canonical = productSeoUrl(SITE, product);
  const title = buildSeoProductTitle(product, categories);
  const description = buildSeoProductDescription(product, categories, 165);
  const image = absoluteUrl(product.img || (Array.isArray(product.images) && product.images[0]) || "/img/site/frenciniz-logo-real-og.jpg");
  const seoName = productSearchName(product, categories, 140) || product.name;
  const longDescription = buildSeoProductDescription(product, categories, 5000);
  const keywords = [
    seoName,
    product?.sku,
    product?.oem,
    categoryNameForProduct(product, categories),
    vehiclePhrase(product),
    "agir vasita fren parcasi",
    "OEM ile uyumluluk",
    "Frenciniz",
  ].filter(Boolean).join(", ");
  const jsonLd = [
    productJsonLdSeo(product, canonical, image, categories),
    productFaqJsonLd(product, categories),
    productBreadcrumbJsonLd(product, canonical, categories),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description: longDescription,
      url: canonical,
      primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : undefined,
      mainEntity: { "@id": `${canonical}#product` },
      isPartOf: { "@type": "WebSite", name: "Frenciniz", url: SITE },
    },
  ].map(item => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n");
  const noScript = productNoScriptHtml(product, categories, canonical);
  let html = readIndexHtml();

  if (!html) {
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${xmlEscape(title)}</title><meta name="description" content="${xmlEscape(description)}"><meta name="keywords" content="${xmlEscape(keywords)}"><link rel="canonical" href="${xmlEscape(canonical)}">${jsonLd}</head><body><h1>${xmlEscape(seoName)}</h1><p>${xmlEscape(description)}</p><a href="${xmlEscape(canonical)}">Urunu ac</a>${noScript}</body></html>`;
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  html = replaceOrInject(html, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<meta name="keywords" content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${xmlEscape(keywords)}" />`);
  html = replaceOrInject(html, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${xmlEscape(canonical)}" />`);
  if (image) {
    html = replaceOrInject(html, /<link rel="preload" as="image" href="[^"]*"\s*\/?>/i, `<link rel="preload" as="image" href="${xmlEscape(image)}" />`);
  }
  html = replaceOrInject(html, /<meta property="og:type" content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="product" />`);
  html = replaceOrInject(html, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${xmlEscape(title)}" />`);
  html = replaceOrInject(html, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${xmlEscape(image)}" />`);
  html = replaceOrInject(html, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${xmlEscape(canonical)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${xmlEscape(title)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${xmlEscape(description)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${xmlEscape(image)}" />`);
  return html.replace("</head>", `${jsonLd}\n</head>`).replace("</body>", `${noScript}\n</body>`);
}

function categoryIdsForSeo(category, categories = []) {
  if (!category) return [];
  if (!category.isGroup) return [category.id];
  const childIds = categories
    .filter(item => item.parent === category.id)
    .map(item => item.id)
    .filter(Boolean);
  return [category.id, ...childIds];
}

function categorySeoProducts(category, products = [], categories = []) {
  const ids = new Set(categoryIdsForSeo(category, categories));
  return products
    .filter(product => ids.has(product.cat))
    .sort((a, b) => {
      const aScore = (salesPriorityLabel(a) === "sales-priority-1" ? 3 : salesPriorityLabel(a) === "sales-priority-2" ? 2 : 1) + (Number(a.stock || 0) > 0 ? 1 : 0);
      const bScore = (salesPriorityLabel(b) === "sales-priority-1" ? 3 : salesPriorityLabel(b) === "sales-priority-2" ? 2 : 1) + (Number(b.stock || 0) > 0 ? 1 : 0);
      return bScore - aScore || Number(b.stock || 0) - Number(a.stock || 0);
    });
}

function categoryWhatsAppUrl(category, count) {
  const text = [
    "Merhaba Frenciniz, kategori sayfasindan geldim.",
    `Kategori: ${category?.name || category?.id || "Fren aksami"}`,
    `Ilgili urun sayisi: ${count || 0}`,
    "OEM / parca kodu:",
    "Arac marka-model:",
    "Sase no:",
    "Eski parca fotografi gonderebilirim.",
  ].join("\n");
  return `https://wa.me/908508887881?text=${encodeURIComponent(text)}`;
}

function renderCategoryProductCard(product, categories = []) {
  const href = productSeoUrl(SITE, product);
  const img = absoluteUrl(product.img || (Array.isArray(product.images) && product.images[0]) || "/img/site/missing-product.webp");
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);
  return `
    <article class="product-card">
      <a class="image" href="${xmlEscape(href)}"><img src="${xmlEscape(img)}" alt="${xmlEscape(product.name)}" loading="lazy" decoding="async"></a>
      <div class="body">
        <a class="title" href="${xmlEscape(href)}">${xmlEscape(product.name)}</a>
        <div class="meta">${xmlEscape(product.brand || "Ekersan")} · ${xmlEscape(product.sku || product.id || "")}</div>
        ${product.oem ? `<div class="muted">OEM: ${xmlEscape(String(product.oem).slice(0, 96))}</div>` : ""}
        <div class="row"><strong>${price ? `${price.toLocaleString("tr-TR")} TL` : "Fiyat sorunuz"}</strong><span>${stock > 0 ? `Stokta ${Math.floor(stock)}` : "Stok sorunuz"}</span></div>
        <a class="mini" href="${xmlEscape(href)}">Urunu incele</a>
      </div>
    </article>`;
}

function renderSeoCategoryHtml(category, products = [], categories = []) {
  const matched = categorySeoProducts(category, products, categories);
  const canonical = `${SITE}/${category.id}`;
  const cleanName = merchantSafeProductText(category.name || category.id || "Fren Aksami");
  const parent = category.parent ? categories.find(item => item.id === category.parent) : null;
  const title = compactText(`${cleanName} Fiyatlari ve Stok | Agir Vasita Yedek Parca | Frenciniz`, 72);
  const description = compactText(`${cleanName} kategorisinde ${matched.length} agir vasita fren parcasi. Kamyon, tir, otobus ve dorse icin OEM kodu, sase veya eski parca fotografi ile uyumluluk teyidi, WhatsApp hizli teklif ve kargo.`, 165);
  const firstImage = absoluteUrl((matched.find(item => isRealProductImage(item.img)) || matched[0] || {}).img || "/img/site/frenciniz-logo-real-og.jpg");
  const itemList = matched.slice(0, 24).map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: productSeoUrl(SITE, product),
    name: product.name,
  }));
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${cleanName} | Frenciniz`,
      description,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "Frenciniz", url: SITE },
      mainEntity: { "@type": "ItemList", itemListElement: itemList },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Frenciniz", item: SITE },
        ...(parent ? [{ "@type": "ListItem", position: 2, name: parent.name, item: `${SITE}/${parent.id}` }] : []),
        { "@type": "ListItem", position: parent ? 3 : 2, name: cleanName, item: canonical },
      ],
    },
  ];
  const wa = categoryWhatsAppUrl(category, matched.length);
  const related = categories
    .filter(item => item.id !== "all" && item.id !== category.id && (item.parent === category.parent || item.parent === category.id || item.id === category.parent))
    .slice(0, 12)
    .map(item => `<a href="${SITE}/${xmlEscape(item.id)}">${xmlEscape(item.name)}</a>`)
    .join("");

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${xmlEscape(title)}</title>
  <meta name="description" content="${xmlEscape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${xmlEscape(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Frenciniz">
  <meta property="og:title" content="${xmlEscape(title)}">
  <meta property="og:description" content="${xmlEscape(description)}">
  <meta property="og:image" content="${xmlEscape(firstImage)}">
  <meta property="og:url" content="${xmlEscape(canonical)}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script>
    (function () {
      function post(url, payload) {
        try {
          var body = JSON.stringify(payload);
          if (navigator.sendBeacon) {
            var blob = new Blob([body], { type: 'application/json' });
            if (navigator.sendBeacon(url, blob)) return;
          }
          fetch(url, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:body, keepalive:true }).catch(function(){});
        } catch (e) {}
      }
      post('/api/auth/track', { path: window.location.pathname || '/', search: window.location.search || '', ref: document.referrer || '' });
      document.addEventListener('click', function(event) {
        var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link) return;
        var href = link.getAttribute('href') || '';
        var kind = href.indexOf('tel:') === 0 ? 'phone' : (href.indexOf('wa.me') !== -1 || href.toLowerCase().indexOf('whatsapp') !== -1 ? 'whatsapp' : '');
        if (!kind) return;
        post('/api/auth/lead', { type: kind, source: link.dataset.leadSource || 'category_seo', href: href, path: window.location.pathname || '/', ref: document.referrer || '', category: '${xmlEscape(category.id)}' });
      }, true);
    })();
  </script>
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#172033;background:#f6f8fb;line-height:1.55;padding-bottom:76px}a{color:inherit}.top{background:#080d17;color:#fff}.bar{max-width:1220px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{text-decoration:none;font-size:24px;font-weight:950;color:#fff}.brand span{color:#ff6000}.contact{display:flex;gap:10px;flex-wrap:wrap}.contact a{color:#fff;text-decoration:none;font-size:14px;font-weight:800}.hero{background:#111827;color:#fff;border-bottom:4px solid #ff6000}.hero-inner{max-width:1220px;margin:0 auto;padding:42px 20px;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:26px;align-items:center}.eyebrow{color:#facc15;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.05em}h1{font-size:42px;line-height:1.08;margin:8px 0 12px;letter-spacing:0}.lead{font-size:18px;color:#d1d5db;max-width:780px;margin:0 0 18px}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border-radius:8px;background:#25D366;color:#062813;text-decoration:none;font-weight:950}.trust{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:16px}.trust strong{display:block;font-size:28px;color:#facc15}.wrap{max-width:1220px;margin:0 auto;padding:28px 20px 44px}.head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:16px}h2{font-size:26px;margin:0}.muted{color:#64748b;font-size:13px}.products{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.product-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;min-height:100%;box-shadow:0 10px 26px rgba(15,23,42,.05)}.image{height:176px;display:flex;align-items:center;justify-content:center;background:#f8fafc}.image img{max-width:100%;max-height:100%;object-fit:contain}.body{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}.title{font-size:14px;font-weight:900;text-decoration:none;color:#111827;min-height:42px}.meta{font-size:12px;color:#475569}.row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:8px}.row strong{color:#ff6000}.row span{font-size:12px;color:#087f3d;font-weight:800}.mini{display:block;text-align:center;margin-top:8px;border-radius:6px;padding:8px;background:#111827;color:#fff;text-decoration:none;font-size:13px;font-weight:900}.info{display:grid;grid-template-columns:2fr 1fr;gap:18px;margin-top:28px}.panel{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:18px}.links{display:flex;flex-wrap:wrap;gap:8px}.links a{padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;font-size:13px;background:#f8fafc}.sticky{position:fixed;left:0;right:0;bottom:0;background:#111;color:#fff;border-top:3px solid #ff6000;z-index:30}.sticky-inner{max-width:1220px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}.sticky a{background:#25D366;color:#062813;text-decoration:none;font-weight:950;padding:10px 14px;border-radius:7px}.footer{padding:22px;text-align:center;color:#64748b;font-size:13px}@media(max-width:900px){.hero-inner{grid-template-columns:1fr}h1{font-size:31px}.products{grid-template-columns:repeat(2,minmax(0,1fr))}.info{grid-template-columns:1fr}}@media(max-width:560px){body{padding-bottom:112px}.bar{align-items:flex-start;flex-direction:column}.products{grid-template-columns:1fr}.head{align-items:flex-start;flex-direction:column}.sticky-inner{align-items:stretch;flex-direction:column}.sticky a{text-align:center}}
  </style>
</head>
<body>
  <header class="top"><div class="bar"><a class="brand" href="${SITE}">FRENCINIZ<span>.com</span></a><div class="contact"><a href="tel:+905456087008">0545 608 7008</a><a href="https://wa.me/908508887881">WhatsApp</a></div></div></header>
  <section class="hero"><div class="hero-inner"><div><div class="eyebrow">Stoklu kategori · OEM kodu ile teyit</div><h1>${xmlEscape(cleanName)} Fiyatlari ve Stok</h1><p class="lead">${xmlEscape(description)} Yanlis parca riskini azaltmak icin OEM kodu, sase no veya eski parca fotografi ile teyit alin.</p><a class="cta" href="${xmlEscape(wa)}" data-lead-source="category_hero">WhatsApp'tan teklif al</a></div><div class="trust"><strong>${matched.length}</strong><div>ilgili urun ve muadil secenek</div><p class="muted" style="color:#cbd5e1">14:00'a kadar stoklu urunde hizli kargo, 3000 TL uzeri standart kargo ucretsiz.</p></div></div></section>
  <main class="wrap"><div class="head"><div><h2>${xmlEscape(cleanName)} Urunleri</h2><div class="muted">Fiyat, stok ve uyumluluk icin urunu acin veya WhatsApp'tan kod gonderin.</div></div><a class="cta" href="${xmlEscape(wa)}" data-lead-source="category_top">Kod gonder, teklif al</a></div><section class="products">${matched.slice(0, 36).map(product => renderCategoryProductCard(product, categories)).join("\n")}</section><section class="info"><div class="panel"><h2>${xmlEscape(cleanName)} secimi</h2><p>${xmlEscape(cleanName)} alirken OEM/parca kodu, olcu, dingil/aks tipi ve arac modeli birlikte kontrol edilmelidir. Frenciniz ekibi kamyon, tir, otobus ve dorse fren sistemleri icin uyumluluk teyidi yapar.</p><p>Eski parcadaki kodu veya fotografi WhatsApp hattina gondererek stok, fiyat ve kargo bilgisini hizli alabilirsiniz.</p></div><aside class="panel"><h2>Yakin kategoriler</h2><div class="links">${related}</div></aside></section></main>
  <div class="sticky"><div class="sticky-inner"><div><strong>${xmlEscape(cleanName)} icin hizli teklif</strong><div style="font-size:13px;color:#cbd5e1">OEM kodu veya eski parca fotosu ile teyit.</div></div><a href="${xmlEscape(wa)}" data-lead-source="category_sticky">WhatsApp Teklif</a></div></div>
  <footer class="footer">Frenciniz · Dumanlar Ticaret · Isparta · info@frenciniz.com</footer>
</body>
</html>`;
}

async function loadProducts() {
  // 1) Static JSON from the deployed build. This keeps public feeds aligned
  // with the reviewed product SEO data even if KV still has an older sync.
  try {
    const prodPath = path.join(process.cwd(), "public/data/products.json");
    const catPath = path.join(process.cwd(), "public/data/categories.json");
    const products = JSON.parse(fs.readFileSync(prodPath, "utf8"));
    const categories = JSON.parse(fs.readFileSync(catPath, "utf8"));
    if (Array.isArray(products) && products.length > 0) {
      return { products, categories: Array.isArray(categories) ? categories : [] };
    }
  } catch (e) {
    // Static yoksa KV'ye dus.
  }

  // 2) KV fallback
  try {
    const { kv } = await import("@vercel/kv");
    const prods = await kv.get("products");
    const cats = await kv.get("categories");
    if (Array.isArray(prods) && prods.length > 0) {
      return { products: prods, categories: Array.isArray(cats) ? cats : [] };
    }
  } catch (e) {
    // KV yoksa devam
  }
  return { products: [], categories: [] };
}

// ===== GOOGLE MERCHANT CENTER XML FEED =====
// Format: https://support.google.com/merchants/answer/7052112
// Bu feed Google Shopping'de ÜCRETSİZ ürün listelemeleri sağlar (organic placements).
function buildMerchantFeed(products, categories) {
  const today = new Date().toISOString();
  const items = [];

  for (const p of products) {
    if (!p.id || !p.name || p.price == null) continue;
    const sub = categories.find(c => c.id === p.cat);
    const catName = merchantSafeProductText(sub ? sub.name : "Fren Aksamı");
    const grp = sub?.parent ? categories.find(c => c.id === sub.parent) : null;
    const fullCat = grp ? `${grp.name} > ${catName}` : catName;
    const productName = merchantSafeProductText(productSearchName(p, categories, 150) || p.name);
    const productDesc = merchantSafeProductText(p.desc || "");

    const hasImg = isRealProductImage(p.img);
    const rawImg = hasImg ? String(p.img) : "/img/site/missing-product.webp";
    const imgUrl = absoluteUrl(rawImg);

    const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
    const condition = "new";
    const brand = p.brand || "Ekersan";
    const mpn = p.oem || p.sku || p.id;
    const gtin = p.gtin || "";
    const hasIdentifier = Boolean(gtin || (brand && mpn));
    const price = Number(p.price || 0);
    const stock = Number(p.stock || 0);
    const titleParts = [productName, shortCode(p.oem), p.sku, catName, brand]
      .filter(Boolean)
      .filter((value, index, arr) => arr.findIndex(v => String(v).toLowerCase() === String(value).toLowerCase()) === index);
    const merchantTitle = titleParts.join(" - ").slice(0, 150);
    const priceTier = price >= 5000 ? "5000tl-ustu" : price >= 3000 ? "3000-5000tl" : price >= 1000 ? "1000-3000tl" : "1000tl-alti";
    const stockTier = stock >= 100 ? "yuksek-stok" : stock >= 20 ? "orta-stok" : stock > 0 ? "dusuk-stok" : "stok-yok";
    const imageTier = hasImg ? "gorselli-urun" : "gorsel-hazirlaniyor";
    const vehicleLabel = Array.isArray(p.veh) && p.veh.length ? p.veh.slice(0, 2).join("-") : "agir-vasita";
    const categoryLabel = grp?.id || p.cat || "fren-aksami";
    const salesPriority = salesPriorityLabel(p);
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/eşdeğer parça. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}Kamyon, tır, otobüs ve dorse fren sistemleri için OEM/şase ile uyumluluk teyidi yapılır. 3000₺ üzeri ücretsiz kargo, 12 taksit, 14 gün koşulsuz iade. Tel: 0545 608 7008 · WhatsApp: 0850 888 7881.`;
    const baseDesc = productDesc && productDesc.length > productName.length + 10 ? productDesc : richDesc;
    const desc = baseDesc.slice(0, 5000);
    const merchantDesc = buildSeoProductDescription(p, categories, 5000);
    const cleanLink = productSeoUrl(SITE, p);
    const merchantLink = withUtm(cleanLink, {
      utm_source: "google",
      utm_medium: "merchant_free",
      utm_campaign: "merchant_feed",
      utm_content: p.cat || "product",
    });
    const additionalImages = Array.isArray(p.images)
      ? p.images
          .filter(Boolean)
          .filter(isRealProductImage)
          .slice(0, 5)
          .map(absoluteUrl)
      : [];

    items.push(
      `<item>` +
      `<g:id>${xmlEscape(p.id)}</g:id>` +
      `<g:title>${xmlEscape(merchantTitle)}</g:title>` +
      `<g:description>${xmlEscape(merchantDesc || desc)}</g:description>` +
      `<g:link>${xmlEscape(merchantLink)}</g:link>` +
      `<g:mobile_link>${xmlEscape(merchantLink)}</g:mobile_link>` +
      `<g:canonical_link>${xmlEscape(cleanLink)}</g:canonical_link>` +
      `<g:image_link>${xmlEscape(imgUrl)}</g:image_link>` +
      additionalImages.map(img => `<g:additional_image_link>${xmlEscape(img)}</g:additional_image_link>`).join("") +
      `<g:availability>${availability}</g:availability>` +
      `<g:price>${price.toFixed(2)} TRY</g:price>` +
      `<g:brand>${xmlEscape(brand)}</g:brand>` +
      `<g:condition>${condition}</g:condition>` +
      (mpn ? `<g:mpn>${xmlEscape(mpn)}</g:mpn>` : "") +
      (gtin ? `<g:gtin>${xmlEscape(gtin)}</g:gtin>` : "") +
      `<g:identifier_exists>${hasIdentifier ? "yes" : "no"}</g:identifier_exists>` +
      `<g:adult>no</g:adult>` +
      `<g:product_type>${xmlEscape(fullCat)}</g:product_type>` +
      `<g:google_product_category>${xmlEscape(GOOGLE_MOTOR_VEHICLE_BRAKING_CATEGORY)}</g:google_product_category>` +
      `<g:custom_label_0>${xmlEscape(categoryLabel)}</g:custom_label_0>` +
      `<g:custom_label_1>${xmlEscape(stockTier)}</g:custom_label_1>` +
      `<g:custom_label_2>${xmlEscape(priceTier)}</g:custom_label_2>` +
      `<g:custom_label_3>${xmlEscape(imageTier)}</g:custom_label_3>` +
      `<g:custom_label_4>${xmlEscape(salesPriority)}</g:custom_label_4>` +
      `<g:shipping><g:country>TR</g:country><g:service>Standard</g:service><g:price>${price >= 3000 ? "0.00" : "150.00"} TRY</g:price></g:shipping>` +
      `</item>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Frenciniz - Ağır Vasıta Fren Aksamı</title>
<link>${SITE}</link>
<description>Kamyon, tır, otobüs ve dorse için ağır vasıta fren aksamı ve yedek parça. OEM/şase ile uyumluluk teyidi, ${products.length} ürün.</description>
<lastBuildDate>${today}</lastBuildDate>
${items.join("\n")}
</channel>
</rss>`;
}

function buildMetaCatalogFeed(products, categories) {
  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "mpn",
    "inventory",
    "google_product_category",
    "product_type",
    "custom_label_0",
    "custom_label_1",
    "custom_label_2",
    "custom_label_3",
    "custom_label_4",
  ];
  const rows = [headers.map(csvEscape).join(",")];

  for (const p of products) {
    if (!p.id || !p.name || p.price == null) continue;
    const sub = categories.find(c => c.id === p.cat);
    const catName = merchantSafeProductText(sub ? sub.name : "Fren Aksami");
    const grp = sub?.parent ? categories.find(c => c.id === sub.parent) : null;
    const fullCat = grp ? `${grp.name} > ${catName}` : catName;
    const productName = merchantSafeProductText(productSearchName(p, categories, 150) || p.name);
    const price = Number(p.price || 0);
    const stock = Number(p.stock || 0);
    const hasImg = isRealProductImage(p.img);
    const rawImg = hasImg ? String(p.img) : "/img/site/missing-product.webp";
    const imgUrl = absoluteUrl(rawImg);
    const brand = p.brand || "Ekersan";
    const mpn = p.oem || p.sku || p.id;
    const priceTier = price >= 5000 ? "5000tl-ustu" : price >= 3000 ? "3000-5000tl" : price >= 1000 ? "1000-3000tl" : "1000tl-alti";
    const stockTier = stock >= 100 ? "yuksek-stok" : stock >= 20 ? "orta-stok" : stock > 0 ? "dusuk-stok" : "stok-yok";
    const imageTier = hasImg ? "gorselli-urun" : "gorsel-hazirlaniyor";
    const vehicleLabel = Array.isArray(p.veh) && p.veh.length ? p.veh.slice(0, 2).join("-") : "agir-vasita";
    const categoryLabel = grp?.id || p.cat || "fren-aksami";
    const salesPriority = salesPriorityLabel(p);
    const title = [productName, shortCode(p.oem), p.sku, catName, brand].filter(Boolean).join(" - ").slice(0, 200);
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/esdeger agir vasita fren parcasi. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}Kamyon, tir, otobus ve dorse fren sistemleri icin OEM/sase ile uyumluluk teyidi yapilir. Ayni gun kargo, 12 taksit, 14 gun iade.`;
    const desc = buildSeoProductDescription(p, categories, 5000);
    const metaLink = withUtm(productSeoUrl(SITE, p), {
      utm_source: "meta",
      utm_medium: "catalog",
      utm_campaign: "meta_catalog",
      utm_content: p.cat || "product",
    });

    rows.push([
      p.id,
      title,
      desc,
      stock > 0 ? "in stock" : "out of stock",
      "new",
      `${price.toFixed(2)} TRY`,
      metaLink,
      imgUrl,
      brand,
      mpn,
      Math.max(0, Math.floor(stock)),
      GOOGLE_MOTOR_VEHICLE_BRAKING_CATEGORY,
      fullCat,
      categoryLabel,
      stockTier,
      priceTier,
      imageTier,
      salesPriority,
    ].map(csvEscape).join(","));
  }

  return rows.join("\n");
}

export default async function handler(req, res) {
  try {
    const { products, categories } = await loadProducts();
    const url = req.url || "";
    const parsedUrl = new URL(url || "/", SITE);
    const type = String(req.query?.type || parsedUrl.searchParams.get("type") || "");

    if (type === "landing") {
      const slug = String(req.query?.slug || parsedUrl.searchParams.get("slug") || "").replace(/^\/+|\/+$/g, "");

      if (!slug) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(renderLandingIndex());
      }

      const page = getLandingBySlug(slug);
      if (!page) return res.status(404).send("Landing page not found");

      const html = renderLanding(page, products, categories);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).send(html);
    }

    if (type === "category") {
      const slug = String(req.query?.slug || parsedUrl.searchParams.get("slug") || "").replace(/^\/+|\/+$/g, "");
      const category = categories.find(item => item.id === slug);
      if (!category || category.id === "all") return res.status(404).send("Category not found");

      const html = renderSeoCategoryHtml(category, products, categories);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).send(html);
    }

    if (type === "product") {
      const route = String(req.query?.route || parsedUrl.searchParams.get("route") || "");
      const id = productIdFromRoute(route);
      const product = products.find(p => String(p.id) === String(id));
      if (!product) return res.status(404).send("Product not found");

      const html = renderSeoProductHtml(product, categories);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).send(html);
    }

    const isMetaCatalogFeed = url.includes("type=meta") || url.includes("meta-catalog-feed") || url.includes("facebook-catalog-feed");
    if (isMetaCatalogFeed) {
      const csv = buildMetaCatalogFeed(products, categories);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).send(csv);
    }

    // Merchant Center feed mi yoksa standart sitemap mi?
    const isMerchantFeed = url.includes("type=merchant") || url.includes("merchant-feed");
    if (isMerchantFeed) {
      const xml = buildMerchantFeed(products, categories);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).send(xml);
    }

    const today = new Date().toISOString().slice(0, 10);

    const urls = [];

    // Statik sayfalar
    for (const p of STATIC_PAGES) {
      urls.push(`<url><loc>${SITE}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`);
    }

    // Satış niyetli SEO landing sayfaları (araç + parça + OEM aramaları)
    for (const page of LANDING_PAGES) {
      urls.push(`<url><loc>${SITE}/${xmlEscape(page.slug)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${page.priority || "0.8"}</priority></url>`);
    }

    // Kategoriler (hem alt-kategori hem grup ana sayfası — grup sayfaları da listeleme yapıyor)
    for (const c of categories) {
      if (!c.id || c.id === "all") continue;
      const priority = c.isGroup ? "0.85" : "0.8";
      urls.push(`<url><loc>${SITE}/${xmlEscape(c.id)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`);
    }

    // Marka filtreli sayfalar (en çok görülen 10 marka)
    const brandCounts = {};
    for (const p of products) { if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; }
    const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
    for (const b of topBrands) {
      urls.push(`<url><loc>${SITE}/?brand=${encodeURIComponent(b)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }

    // Araç tipi filtreli sayfalar
    for (const v of ["kamyon", "tir", "otobus", "dorse"]) {
      urls.push(`<url><loc>${SITE}/?veh=${v}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>`);
    }

    // Ürünler
    for (const p of products) {
      if (!p.id) continue;
      const hasImg = isRealProductImage(p.img);
      // Image URL absolute olmalı (sitemap protokolü gereği) — relative ise SITE prefix ekle
      let imgUrl = null;
      if (hasImg) {
        const raw = String(p.img);
        imgUrl = absoluteUrl(raw);
      }
      urls.push(
        `<url>` +
        `<loc>${xmlEscape(productSeoUrl(SITE, p))}</loc>` +
        `<lastmod>${today}</lastmod>` +
        `<changefreq>weekly</changefreq>` +
        `<priority>0.7</priority>` +
        (imgUrl ? `<image:image><image:loc>${xmlEscape(imgUrl)}</image:loc><image:title>${xmlEscape(productSearchName(p, categories, 140) || p.name)}</image:title></image:image>` : "") +
        `</url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url></urlset>`);
  }
}
