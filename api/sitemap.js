// Dinamik sitemap.xml — KV'den ürünler, fallback static JSON
import fs from "fs";
import path from "path";
import { LANDING_PAGES, getLandingBySlug } from "./_lib/seo-landing.js";
import { renderLanding, renderLandingIndex } from "./_lib/landing-render.js";

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

async function loadProducts() {
  // 1) KV
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
  // 2) Static JSON
  try {
    const prodPath = path.join(process.cwd(), "public/data/products.json");
    const catPath = path.join(process.cwd(), "public/data/categories.json");
    const products = JSON.parse(fs.readFileSync(prodPath, "utf8"));
    const categories = JSON.parse(fs.readFileSync(catPath, "utf8"));
    return { products, categories };
  } catch (e) {
    return { products: [], categories: [] };
  }
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
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/eşdeğer parça. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}ECE R-90 sertifikalı, kamyon, tır, otobüs ve dorse için uyumlu fren aksamı. 3000₺ üzeri ücretsiz kargo, 12 taksit, 14 gün koşulsuz iade. Tel: 0545 608 7008 · WhatsApp: 0850 888 7881.`;
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
      `<g:link>${SITE}/urun/${xmlEscape(p.id)}</g:link>` +
      `<g:mobile_link>${SITE}/urun/${xmlEscape(p.id)}</g:mobile_link>` +
      `<g:canonical_link>${SITE}/urun/${xmlEscape(p.id)}</g:canonical_link>` +
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
<description>Kamyon, tır, otobüs ve dorse için ECE R-90 sertifikalı fren aksamı ve yedek parça. ${products.length} ürün.</description>
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
    const richDesc = `${productName} - ${catName} kategorisinde ${brand} marka orijinal/esdeger agir vasita fren parcasi. ${p.sku ? "Stok kodu: " + p.sku + ". " : ""}${p.oem ? "OEM: " + p.oem + ". " : ""}Kamyon, tir, otobus ve dorse icin uyumlu fren aksami. Ayni gun kargo, 12 taksit, 14 gun iade.`;
    const desc = merchantSafeProductText(p.desc || richDesc).slice(0, 5000);

    rows.push([
      p.id,
      title,
      desc,
      stock > 0 ? "in stock" : "out of stock",
      "new",
      `${price.toFixed(2)} TRY`,
      `${SITE}/urun/${p.id}`,
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
        `<loc>${SITE}/urun/${xmlEscape(p.id)}</loc>` +
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
