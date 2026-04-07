import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  try {
    const type = req.query.type || "products";

    if (type === "categories") {
      const cats = await kv.get("categories");
      if (cats) {
        return res.status(200).json(typeof cats === "string" ? JSON.parse(cats) : cats);
      }
    } else if (type === "stats") {
      const stats = await kv.get("sync:stats");
      const last = await kv.get("sync:last");
      return res.status(200).json({ stats: stats ? (typeof stats === "string" ? JSON.parse(stats) : stats) : null, lastSync: last });
    } else {
      const products = await kv.get("products");
      if (products) {
        return res.status(200).json(typeof products === "string" ? JSON.parse(products) : products);
      }
    }

    // Fallback: static JSON dosyalarından oku
    return res.status(404).json({ error: "No data in KV. Run /api/sync-products first." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
