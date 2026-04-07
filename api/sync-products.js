// Ekersan B2B API'den ürünleri otomatik senkronize eder
// Vercel Cron ile günde 2 kez çalışır (08:00 ve 14:00)

import { kv } from "@vercel/kv";

const EKERSAN_API = "https://bayi.ekersan.com/api/tr/v1";
const EKERSAN_USER = process.env.EKERSAN_USERNAME || "DUMANLAR";
const EKERSAN_PASS = process.env.EKERSAN_PASSWORD || "320043";

async function ekersanLogin() {
  const res = await fetch(`${EKERSAN_API}/data/b2b_signin.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ username: EKERSAN_USER, password: EKERSAN_PASS }),
  });
  const cookies = res.headers.getSetCookie?.() || [];
  const cookieStr = cookies.map(c => c.split(";")[0]).join("; ");
  const data = await res.json();
  return { csrf: data.csrf, cookies: cookieStr };
}

async function fetchAllProducts(auth) {
  const allProducts = [];
  const allIncluded = [];

  for (let page = 1; page <= 200; page++) {
    const res = await fetch(
      `${EKERSAN_API}/data/b2b/products.json?page=${page}`,
      {
        headers: {
          "Accept": "application/json",
          "X-CSRF-TOKEN": auth.csrf,
          "Cookie": auth.cookies,
        },
      }
    );
    const data = await res.json();

    if (data.error) break;

    const products = data.products?.data || [];
    const included = data.products?.included || [];

    if (products.length === 0) break;

    allProducts.push(...products);
    allIncluded.push(...included);

    if (products.length < 20) break;
  }

  return { products: allProducts, included: allIncluded };
}

function processProducts(raw) {
  const { products, included } = raw;

  // Build units lookup
  const unitsMap = {};
  for (const inc of included) {
    if (inc.type === "unit") {
      unitsMap[String(inc.id)] = inc.attributes || {};
    }
  }

  const final = [];
  const catsSet = new Set();
  let pid = 1;

  for (const p of products) {
    const a = p.attributes || {};

    // Sadece stokta olanlar
    if (!a.b2b_in_stock) continue;

    // Fiyat bul
    const unitIds = (p.relationships?.units?.data || []).map(u => String(u.id));
    let price = 0;
    for (const uid of unitIds) {
      const u = unitsMap[uid] || {};
      if (u.b2b_price) { price = u.b2b_price; break; }
    }
    if (price <= 0) continue;

    const cat = (a.field10 || "").trim() || "Diğer";
    catsSet.add(cat);

    final.push({
      id: pid++,
      name: a.name || "",
      sku: a.sku || "",
      price: Math.round(price * 100) / 100,
      old: null,
      vat_rate: a.vat_rate || 0,
      stock: Math.floor(a.b2b_stock_qty || 0),
      oem: a.field1 || "",
      cat,
      brand: "Ekersan",
      rating: 4.5,
      reviews: 0,
      img: "https://placehold.co/400x400/1c1c1c/b0b0b0?text=" + encodeURIComponent(a.sku || "URUN"),
      desc: a.name || "",
      specs: {},
      compat: [],
      veh: ["kamyon", "tir"],
    });
  }

  // Kategoriler
  const cats = [{ id: "all", name: "Tüm Ürünler" }];
  for (const c of [...catsSet].sort()) {
    cats.push({
      id: c.toLowerCase().replace(/\s+/g, "-").replace(/[()\/]/g, ""),
      name: c,
    });
  }

  return { products: final, categories: cats };
}

export default async function handler(req, res) {
  // Cron auth kontrolü
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "frenciniz-cron-2026"}`) {
    // Manuel tetikleme için admin secret de kabul et
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("[sync] Ekersan login...");
    const auth = await ekersanLogin();

    console.log("[sync] Fetching products...");
    const raw = await fetchAllProducts(auth);
    console.log(`[sync] Raw: ${raw.products.length} products, ${raw.included.length} included`);

    const { products, categories } = processProducts(raw);
    console.log(`[sync] Processed: ${products.length} in-stock products, ${categories.length} categories`);

    // KV'ye kaydet
    await kv.set("products", JSON.stringify(products));
    await kv.set("categories", JSON.stringify(categories));
    await kv.set("sync:last", new Date().toISOString());
    await kv.set("sync:stats", JSON.stringify({
      total: raw.products.length,
      inStock: products.length,
      categories: categories.length - 1,
      time: new Date().toISOString(),
    }));

    return res.status(200).json({
      ok: true,
      total: raw.products.length,
      inStock: products.length,
      categories: categories.length - 1,
      syncTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync] Error:", err);
    return res.status(500).json({ error: "Sync failed", message: err.message });
  }
}
