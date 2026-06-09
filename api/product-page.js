import fs from "fs";
import path from "path";
import { productIdFromRoute, productSeoUrl } from "../shared/product-seo.js";

const SITE = "https://frenciniz.com";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return `${SITE}/img/site/frenciniz-logo-real-og.jpg`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function readJson(file) {
  try {
    const fullPath = path.join(process.cwd(), file);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return [];
  }
}

function readIndexHtml() {
  const candidates = [
    path.join(process.cwd(), "dist/index.html"),
    path.join(process.cwd(), "index.html"),
  ];
  for (const file of candidates) {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {}
  }
  return "";
}

function compactText(value, max = 155) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function fallbackHtml(product, canonical, title, description, image) {
  const price = Number(product.price || 0);
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <script type="application/ld+json">${JSON.stringify(productJsonLd(product, canonical, image))}</script>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f4f7fb;color:#202226}.wrap{max-width:960px;margin:0 auto;padding:28px 18px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:22px;display:grid;grid-template-columns:minmax(0,360px) 1fr;gap:24px}.card img{width:100%;height:auto;border-radius:8px;background:#f3f4f6}h1{font-size:28px;line-height:1.2;margin:0 0 10px}.price{font-size:24px;font-weight:800;color:#ff6000;margin:14px 0}.btn{display:inline-flex;align-items:center;justify-content:center;margin-top:16px;padding:13px 18px;border-radius:7px;background:#ff6000;color:#fff;text-decoration:none;font-weight:800}@media(max-width:720px){.card{grid-template-columns:1fr}h1{font-size:22px}}</style>
</head>
<body>
  <main class="wrap">
    <article class="card">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}">
      <div>
        <h1>${escapeHtml(product.name)}</h1>
        <p><strong>Stok kodu:</strong> ${escapeHtml(product.sku || product.id)}</p>
        <p><strong>OEM / Muadil:</strong> ${escapeHtml(product.oem || "Şase ile teyit edilir")}</p>
        <p>${escapeHtml(description)}</p>
        <div class="price">${price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        <a class="btn" href="${escapeHtml(canonical)}">Ürünü sitede aç</a>
      </div>
    </article>
  </main>
</body>
</html>`;
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

function renderProductSpaHtml(product) {
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
  if (!html) return fallbackHtml(product, canonical, title, description, image);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceOrInject(html, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceOrInject(html, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  html = replaceOrInject(html, /<meta property="og:type" content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="product" />`);
  html = replaceOrInject(html, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceOrInject(html, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceOrInject(html, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = replaceOrInject(html, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = replaceOrInject(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  html = html.replace("</head>", `${jsonLd}\n</head>`);
  return html;
}

export default async function handler(req, res) {
  const route = req.query.route || req.query.id || "";
  const id = productIdFromRoute(route);
  const products = readJson("public/data/products.json");
  const product = products.find(p => String(p.id) === String(id));

  if (!product) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><head><title>Ürün bulunamadı - Frenciniz</title></head><body>Ürün bulunamadı.</body></html>");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(renderProductSpaHtml(product));
}
