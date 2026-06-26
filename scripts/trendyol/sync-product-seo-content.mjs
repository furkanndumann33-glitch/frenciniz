import fs from "node:fs/promises";
import path from "node:path";
import {
  barcodeFor,
  cleanText,
  fetchTrendyolProducts,
  publicTrendyolConfig,
  trendyolRequest,
} from "../../api/_lib/trendyol.js";

const defaultCatalogPath = "C:/Users/tarka/frenciniz/public/data/products.json";
const defaultOutDir = "C:/Users/tarka/frenciniz/outputs/trendyol-integration/seo-content-sync";

function parseArgs(argv) {
  const args = {
    catalog: defaultCatalogPath,
    outDir: defaultOutDir,
    live: false,
    limit: 0,
    chunkSize: 1000,
    updateAllMatched: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--catalog") args.catalog = argv[++index];
    else if (arg === "--out-dir") args.outDir = argv[++index];
    else if (arg === "--limit") args.limit = Number(argv[++index]);
    else if (arg === "--chunk-size") args.chunkSize = Number(argv[++index]);
    else if (arg === "--only-different") args.updateAllMatched = false;
    else if (arg === "--live") args.live = true;
  }
  args.limit = Math.max(0, Number(args.limit) || 0);
  args.chunkSize = Math.min(1000, Math.max(1, Number(args.chunkSize) || 1000));
  return args;
}

function key(value) {
  return String(value || "").trim().toLocaleUpperCase("tr-TR");
}

function norm(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLocaleUpperCase("tr-TR");
}

function chunkItems(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function targetContent(product) {
  return {
    title: cleanText(product.name || product.title || product.sku || product.stockCode, 100),
    description: cleanText(product.desc || product.description || product.name || "", 30000),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(args.outDir, { recursive: true });

  const productsRaw = JSON.parse(await fs.readFile(args.catalog, "utf8"));
  const products = Array.isArray(productsRaw) ? productsRaw : (productsRaw.products || []);
  const byBarcode = new Map();
  const bySku = new Map();

  products.forEach((product, index) => {
    const { barcode } = barcodeFor(product, index);
    const row = {
      product,
      barcode,
      sku: cleanText(product.sku || product.stockCode || ""),
      ...targetContent(product),
    };
    if (row.barcode) byBarcode.set(key(row.barcode), row);
    if (row.sku) bySku.set(key(row.sku), row);
  });

  const approved = await fetchTrendyolProducts("approved", { maxPages: 50, size: 100 });
  const rows = [];
  const payloadItems = [];

  for (const item of approved.items) {
    const variant = Array.isArray(item.variants) && item.variants.length ? item.variants[0] : item;
    const barcode = cleanText(variant?.barcode || item.barcode || "", 80);
    const stockCode = cleanText(variant?.stockCode || item.stockCode || item.productMainId || "", 100);
    const match = byBarcode.get(key(barcode)) || bySku.get(key(stockCode)) || bySku.get(key(item.productMainId));
    if (!match) {
      rows.push({
        status: "unmatched",
        contentId: item.contentId,
        barcode,
        stockCode,
        productMainId: item.productMainId,
        trendyolTitle: item.title,
      });
      continue;
    }

    const currentTitle = cleanText(item.title, 150);
    const currentDescription = cleanText(item.description || item.descriptionText || "", 30000);
    const titleSame = norm(currentTitle) === norm(match.title);
    const descriptionSame = currentDescription ? norm(currentDescription) === norm(match.description) : false;
    const shouldUpdate = args.updateAllMatched || !titleSame || !descriptionSame;

    rows.push({
      status: shouldUpdate ? "update" : "same",
      contentId: item.contentId,
      barcode,
      stockCode,
      sku: match.sku,
      productMainId: item.productMainId,
      trendyolTitle: currentTitle,
      targetTitle: match.title,
      titleSame,
      descriptionKnown: Boolean(currentDescription),
      descriptionSame,
    });

    if (shouldUpdate && item.contentId && match.title && match.description) {
      payloadItems.push({
        contentId: item.contentId,
        title: match.title,
        description: match.description,
      });
      if (args.limit && payloadItems.length >= args.limit) break;
    }
  }

  const chunks = chunkItems(payloadItems, args.chunkSize);
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: args.live ? "live" : "dry-run",
    catalog: args.catalog,
    approvedTotal: approved.summary.totalElements,
    approvedFetched: approved.items.length,
    matchedCount: rows.filter((row) => row.status !== "unmatched").length,
    unmatchedCount: rows.filter((row) => row.status === "unmatched").length,
    updateItemCount: payloadItems.length,
    chunkCount: chunks.length,
    updateAllMatched: args.updateAllMatched,
    sample: rows.filter((row) => row.status === "update").slice(0, 30),
  };

  await fs.writeFile(path.join(args.outDir, "seo-content-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await fs.writeFile(path.join(args.outDir, "seo-content-payload.json"), JSON.stringify({ ...summary, items: payloadItems }, null, 2), "utf8");
  await fs.writeFile(path.join(args.outDir, "seo-content-rows.json"), JSON.stringify(rows, null, 2), "utf8");

  if (!args.live) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const { supplierId } = publicTrendyolConfig();
  const responses = [];
  for (const [index, chunk] of chunks.entries()) {
    const response = await trendyolRequest(`/integration/product/sellers/${supplierId}/products/content-bulk-update`, {
      method: "POST",
      body: { items: chunk },
    });
    responses.push({
      chunk: index + 1,
      itemCount: chunk.length,
      batchRequestId: response.batchRequestId || response.data?.batchRequestId || "",
      response,
    });
  }

  const liveResult = { ...summary, responses };
  await fs.writeFile(path.join(args.outDir, "seo-content-live-latest.json"), JSON.stringify(liveResult, null, 2), "utf8");
  console.log(JSON.stringify(liveResult, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    error: error.message,
    status: error.status,
    body: error.body,
  }, null, 2));
  process.exit(1);
});
