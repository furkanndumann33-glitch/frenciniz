// Dinamik sitemap.xml — KV'den ürünler, fallback static JSON
import fs from "fs";
import path from "path";
import { LANDING_PAGES, getLandingBySlug } from "./_lib/seo-landing.js";
import { renderLanding, renderLandingIndex } from "./_lib/landing-render.js";
import { productIdFromRoute, productSeoUrl } from "../shared/product-seo.js";

const SITE = "https://frenciniz.com";

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
  return !!img && !img.includes("placehold") && !img.includes("/logo") && !img.includes("logo.");
}

function absoluteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function compactText(value, max = 155) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function readIndexHtml() {
  for (const file of [path.join(process.cwd(), "dist/index.html"), path.join(process.cwd(), "index.html")]) {
    try { return fs.readFileSync(file, "utf8"); } catch {}
  }
  return "";
}

function productJsonLd(product, canonical, image) {
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
    const productName = merchantSafeProductText(p.name);
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
    const titleParts = [productName, p.sku, brand, catName]
      .filter(Boolean)
      .filter((value, index, arr) => arr.findIndex(v => String(v).toLowerCase() === String(value).toLowerCase()) === index);
    const merchantTitle = titleParts.join(" - ").slice(0, 150);
    const priceTier = price >= 5000 ? "5000tl-ustu" : price >= 3000 ? "3000-5000tl" : price >= 1000 ? "1000-3000tl" : "1000tl-alti";
    const stockTier = stock >= 100 ? "yuksek-stok" : stock >= 20 ? "orta-stok" : stock > 0 ? "dusuk-stok" : "stok-yok";
    const imageTier = hasImg ? "gorselli-urun" : "gorsel-hazirlaniyor";
    const vehicleLabel = Array.isArray(p.veh) && p.veh.length ? p.veh.slice(0, 2).join("-") : "agir-vasita";
    const categoryLabel = grp?.id || p.cat || "fren-aksami";
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/eşdeğer parça. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}Kamyon, tır, otobüs ve dorse fren sistemleri için OEM/şase ile uyumluluk teyidi yapılır. 3000₺ üzeri ücretsiz kargo, 12 taksit, 14 gün koşulsuz iade. Tel: 0545 608 7008 · WhatsApp: 0850 888 7881.`;
    const baseDesc = productDesc && productDesc.length > productName.length + 10 ? productDesc : richDesc;
    const desc = baseDesc.slice(0, 5000);
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
      `<g:description>${xmlEscape(desc)}</g:description>` +
      `<g:link>${xmlEscape(productSeoUrl(SITE, p))}</g:link>` +
      `<g:mobile_link>${xmlEscape(productSeoUrl(SITE, p))}</g:mobile_link>` +
      `<g:canonical_link>${xmlEscape(productSeoUrl(SITE, p))}</g:canonical_link>` +
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
      `<g:google_product_category>Vehicles &amp; Parts &gt; Vehicle Parts &amp; Accessories &gt; Motor Vehicle Parts &gt; Motor Vehicle Brake Parts</g:google_product_category>` +
      `<g:custom_label_0>${xmlEscape(categoryLabel)}</g:custom_label_0>` +
      `<g:custom_label_1>${xmlEscape(stockTier)}</g:custom_label_1>` +
      `<g:custom_label_2>${xmlEscape(priceTier)}</g:custom_label_2>` +
      `<g:custom_label_3>${xmlEscape(imageTier)}</g:custom_label_3>` +
      `<g:custom_label_4>${xmlEscape(vehicleLabel)}</g:custom_label_4>` +
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
    const productName = merchantSafeProductText(p.name);
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
    const title = [productName, p.sku, brand].filter(Boolean).join(" - ").slice(0, 200);
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/esdeger agir vasita fren parcasi. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}Kamyon, tir, otobus ve dorse fren sistemleri icin OEM/sase ile uyumluluk teyidi yapilir. Ayni gun kargo, 12 taksit, 14 gun iade.`;
    const desc = merchantSafeProductText(p.desc || richDesc).slice(0, 5000);

    rows.push([
      p.id,
      title,
      desc,
      stock > 0 ? "in stock" : "out of stock",
      "new",
      `${price.toFixed(2)} TRY`,
      productSeoUrl(SITE, p),
      imgUrl,
      brand,
      mpn,
      Math.max(0, Math.floor(stock)),
      "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Brake Parts",
      fullCat,
      categoryLabel,
      stockTier,
      priceTier,
      imageTier,
      vehicleLabel,
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

    if (type === "product") {
      const route = String(req.query?.route || parsedUrl.searchParams.get("route") || "");
      const id = productIdFromRoute(route);
      const product = products.find(p => String(p.id) === String(id));
      if (!product) return res.status(404).send("Product not found");

      const html = renderProductHtml(product);
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
        (imgUrl ? `<image:image><image:loc>${xmlEscape(imgUrl)}</image:loc><image:title>${xmlEscape(p.name)}</image:title></image:image>` : "") +
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
