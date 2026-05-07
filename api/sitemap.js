// Dinamik sitemap.xml — KV'den ürünler, fallback static JSON
import fs from "fs";
import path from "path";

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
    const catName = sub ? sub.name : "Fren Aksamı";
    const grp = sub?.parent ? categories.find(c => c.id === sub.parent) : null;
    const fullCat = grp ? `${grp.name} > ${catName}` : catName;

    const hasImg = p.img && !String(p.img).includes("placehold");
    const rawImg = hasImg ? String(p.img) : "/logo.png";
    const imgUrl = rawImg.startsWith("http") ? rawImg : `${SITE}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;

    const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
    const condition = "new";
    const brand = p.brand || "Ekersan";
    const mpn = p.oem || p.sku || p.id;
    const gtin = p.gtin || "";
    const desc = (p.desc || `${p.name} - ${catName} kategorisinde ${brand} marka. Stok: ${p.sku || "-"}. ECE R-90 sertifikalı, kamyon/tır/otobüs/dorse uyumlu fren aksamı. Aynı gün kargo, 12 taksit, 14 gün iade hakkı. Tel: 0545 608 7008.`).slice(0, 5000);

    items.push(
      `<item>` +
      `<g:id>${xmlEscape(p.id)}</g:id>` +
      `<g:title>${xmlEscape(p.name).slice(0, 150)}</g:title>` +
      `<g:description>${xmlEscape(desc)}</g:description>` +
      `<g:link>${SITE}/urun/${xmlEscape(p.id)}</g:link>` +
      `<g:image_link>${xmlEscape(imgUrl)}</g:image_link>` +
      `<g:availability>${availability}</g:availability>` +
      `<g:price>${p.price}.00 TRY</g:price>` +
      `<g:brand>${xmlEscape(brand)}</g:brand>` +
      `<g:condition>${condition}</g:condition>` +
      (mpn ? `<g:mpn>${xmlEscape(mpn)}</g:mpn>` : "") +
      (gtin ? `<g:gtin>${xmlEscape(gtin)}</g:gtin>` : "") +
      (p.sku ? `<g:identifier_exists>${gtin ? "yes" : "no"}</g:identifier_exists>` : "<g:identifier_exists>no</g:identifier_exists>") +
      `<g:product_type>${xmlEscape(fullCat)}</g:product_type>` +
      `<g:google_product_category>Vehicles &amp; Parts &gt; Vehicle Parts &amp; Accessories &gt; Motor Vehicle Parts &gt; Motor Vehicle Brake Parts</g:google_product_category>` +
      `<g:shipping><g:country>TR</g:country><g:service>Standard</g:service><g:price>${p.price >= 3000 ? "0.00" : "150.00"} TRY</g:price></g:shipping>` +
      `<g:tax><g:country>TR</g:country><g:rate>20</g:rate><g:tax_ship>yes</g:tax_ship></g:tax>` +
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

export default async function handler(req, res) {
  try {
    const { products, categories } = await loadProducts();

    // Merchant Center feed mi yoksa standart sitemap mi?
    const url = req.url || "";
    const isMerchantFeed = url.includes("type=merchant") || url.includes("merchant-feed");
    if (isMerchantFeed) {
      const xml = buildMerchantFeed(products, categories);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).send(xml);
    }

    const today = new Date().toISOString().slice(0, 10);

    const urls = [];

    // Statik sayfalar
    for (const p of STATIC_PAGES) {
      urls.push(`<url><loc>${SITE}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`);
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
      const hasImg = p.img && !String(p.img).includes("placehold");
      // Image URL absolute olmalı (sitemap protokolü gereği) — relative ise SITE prefix ekle
      let imgUrl = null;
      if (hasImg) {
        const raw = String(p.img);
        imgUrl = raw.startsWith("http") ? raw : `${SITE}${raw.startsWith("/") ? "" : "/"}${raw}`;
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
