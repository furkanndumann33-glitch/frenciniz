// Edge image proxy — wsrv.nl üzerinden resize, Vercel Edge CDN'de uzun cache.
// İlk istek wsrv.nl'e gider, sonraki istekler Vercel Edge'den anında.
//
// Query: ?url=ENCODED_S3_URL&w=300&q=50&fmt=webp|avif (auto)
//
// İhtiyacımız:
// - Hızlı cold start (Edge runtime)
// - Browser Accept'e göre AVIF/WebP
// - Cache-Control: 1y immutable (Vercel CDN agresif cache'ler)

export const config = {
  runtime: "edge",
};

const ALLOWED_HOSTS = [
  "s3-eu-west-1.amazonaws.com",
  "s3.eu-west-1.amazonaws.com",
  "wsrv.nl",
  "images.weserv.nl",
];

function isAllowed(urlStr) {
  try {
    const u = new URL(urlStr);
    return ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const src = searchParams.get("url");
    const w = Math.max(64, Math.min(1600, parseInt(searchParams.get("w") || "300", 10)));
    const q = Math.max(20, Math.min(90, parseInt(searchParams.get("q") || "55", 10)));

    if (!src || !isAllowed(src)) {
      return new Response("Invalid url", { status: 400 });
    }

    const accept = req.headers.get("accept") || "";
    // wsrv.nl af=1 zaten Accept'e göre format seçiyor ama biz output forcelayalım
    const wantsAvif = accept.includes("image/avif");
    const fmt = wantsAvif ? "avif" : "webp";

    const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${w}&q=${q}&output=${fmt}&maxage=1y&n=-1`;

    const upstream = await fetch(wsrvUrl, {
      // Vercel Edge fetch otomatik retry yapmıyor, biz timeout koyalım
      cf: { cacheTtl: 31536000, cacheEverything: true },
    });

    if (!upstream.ok) {
      // wsrv başarısızsa direkt source'a redirect
      return Response.redirect(src, 302);
    }

    const headers = new Headers();
    headers.set("Content-Type", `image/${fmt}`);
    // Hem browser hem Vercel Edge agresif cache: 1 yıl immutable
    headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable, stale-while-revalidate=2592000");
    headers.set("Vary", "Accept");
    headers.set("X-Image-Proxy", "frenciniz-edge");
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("Content-Length", cl);

    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
