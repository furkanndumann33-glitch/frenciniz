import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const productsPath = path.join(root, "public", "data", "products.json");
const supplierPath = path.join(root, "tmp", "pdfs", "ekersan-catalog-products-in-stock-2026-07-19.json");
const outputDir = path.join(root, "public", "img", "supplier");
const reportPath = path.join(root, "pricing-research", "verified-supplier-image-sync-2026-07-19.json");

function hasRealImage(product) {
  const values = [product?.img, product?.img_lg, ...(Array.isArray(product?.images) ? product.images : [])]
    .filter(Boolean)
    .map(value => String(value).toLowerCase());
  return values.some(value =>
    !value.includes("placehold") &&
    !value.includes("missing-product") &&
    !value.includes("/logo") &&
    !value.includes("frenciniz-generated")
  );
}

function safeSku(value) {
  return String(value || "").trim().toUpperCase();
}

function safeFileName(value) {
  return String(value || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function verifiedImage(buffer, contentType) {
  const png = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const webp = buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return buffer.length >= 1024 && (png || jpeg || webp || String(contentType || "").startsWith("image/"));
}

const products = JSON.parse(await fs.readFile(productsPath, "utf8"));
const supplierSnapshot = JSON.parse(await fs.readFile(supplierPath, "utf8"));
const supplierProducts = Array.isArray(supplierSnapshot) ? supplierSnapshot : supplierSnapshot.products;
const supplierBySku = new Map(
  supplierProducts.filter(item => item?.in_stock).map(item => [safeSku(item.sku), item])
);

await fs.mkdir(outputDir, { recursive: true });
const updated = [];
const unavailable = [];

for (const product of products) {
  if (hasRealImage(product)) continue;
  const supplier = supplierBySku.get(safeSku(product.sku));
  const imageUrl = Array.isArray(supplier?.image_urls) ? supplier.image_urls.find(Boolean) : "";
  if (!imageUrl) {
    unavailable.push({
      id: product.id,
      sku: product.sku || "",
      supplierMatch: Boolean(supplier),
      reason: supplier ? "supplier_has_no_image" : "supplier_sku_not_found",
    });
    continue;
  }

  const response = await fetch(imageUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`Image download failed for ${product.sku}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!verifiedImage(buffer, response.headers.get("content-type"))) {
    throw new Error(`Downloaded file is not a verified image for ${product.sku}`);
  }

  const extension = imageUrl.toLowerCase().includes(".png") ? "png" : imageUrl.toLowerCase().match(/\.jpe?g(?:$|\?)/) ? "jpg" : "webp";
  const fileName = `${product.id}-${safeFileName(product.sku)}.${extension}`;
  const publicPath = `/img/supplier/${fileName}`;
  await fs.writeFile(path.join(outputDir, fileName), buffer);
  product.img = publicPath;
  product.img_lg = publicPath;
  product.images = [publicPath, ...(Array.isArray(product.images) ? product.images.filter(Boolean) : [])]
    .filter((value, index, values) => values.indexOf(value) === index);
  updated.push({
    id: product.id,
    sku: product.sku || "",
    publicPath,
    sourceUrl: imageUrl,
    bytes: buffer.length,
  });
}

await fs.writeFile(productsPath, `${JSON.stringify(products)}\n`, "utf8");
await fs.writeFile(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "authenticated stock-only supplier snapshot",
  containsPrices: false,
  updatedCount: updated.length,
  unavailableCount: unavailable.length,
  updated,
  unavailable,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ updatedCount: updated.length, unavailableCount: unavailable.length, reportPath }, null, 2));
