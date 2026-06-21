import { requireAdmin, logActivity } from "./_lib/auth.js";
import {
  buildProductV2Payload,
  buildStockPricePayload,
  categoryCandidates,
  categoryRoots,
  chunkItems,
  compareFrencinizToTrendyol,
  fetchTrendyolProducts,
  flattenCategories,
  publicTrendyolConfig,
  readFrencinizProducts,
  readTrendyolSettings,
  trendyolRequest,
  writeTrendyolSettings,
} from "./_lib/trendyol.js";

const DEFAULT_TRACKING_BATCH_IDS = [
  "8c8d7592-3781-48ab-acf1-1a253c6cdcde-1782653143",
  "c0e93b0d-eeae-47d2-8699-c77e0a77ea13-1782653197",
  "ffce56da-4d45-419a-b52a-b2eb7622ab35-1782653236",
  "a3c38624-6d80-457f-8adf-931db916adac-1782653236",
  "28aa052d-dc04-4217-9abb-e844db430a0f-1782653531",
  "0914c149-8e5e-4fb8-a024-d4059d909666-1782653868",
];

const DEFAULT_TRACKING_BARCODES = [
  "FRN000003ESC79458",
  "FRN000006ESD13009",
  "FRN000451FT344022",
  "ESB869100238",
  "3195284100021",
];

function sendError(res, error) {
  const status = error.status || 500;
  const message = error.body?.message || error.body?.exception || error.message || "Islem tamamlanamadi";
  return res.status(status).json({ error: message, status });
}

async function brandSearch() {
  try {
    const matches = await trendyolRequest("/integration/product/brands/by-name", { query: { name: "Ekersan" } });
    return Array.isArray(matches) ? matches.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function listFromInput(value, fallback) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function compactFailureReasons(items = []) {
  const groups = new Map();
  for (const item of items) {
    for (const reason of item.failureReasons || []) {
      const current = groups.get(reason) || { reason, count: 0 };
      current.count += 1;
      groups.set(reason, current);
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count).slice(0, 5);
}

function summarizeBatch(data, batchRequestId) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const successVisibleCount = items.filter((item) => item.status === "SUCCESS").length;
  const failedVisibleCount = items.filter((item) => item.status === "FAILED").length;
  const itemCount = Number(data?.itemCount ?? items.length);
  const failedItemCount = Number(data?.failedItemCount ?? failedVisibleCount);
  return {
    batchRequestId,
    status: data?.status || "-",
    itemCount,
    successCount: Math.max(0, itemCount - failedItemCount),
    failedItemCount,
    visibleItemCount: items.length,
    successVisibleCount,
    failedVisibleCount,
    failureReasons: compactFailureReasons(items),
  };
}

function summarizeProductStatus(barcode, data) {
  const approved = data?.approved ?? data?.isApproved ?? data?.product?.approved ?? false;
  return {
    barcode,
    ok: true,
    approved: Boolean(approved),
    status: data?.status || data?.productStatus || data?.state || (approved ? "approved" : "pending"),
    title: data?.title || data?.name || data?.productName || "",
    stockCode: data?.stockCode || data?.stockCodeList?.[0] || "",
    contentId: data?.contentId || data?.id || data?.productContentId || "",
    listingId: data?.listingId || data?.listing?.id || "",
  };
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const action = String(req.query.action || "").toLowerCase();

  try {
    if (action === "status") {
      const config = publicTrendyolConfig();
      const products = await readFrencinizProducts();
      let categoryRootCount = 0;
      let authOk = false;
      let authError = "";
      if (config.hasCredentials) {
        try {
          const cats = await trendyolRequest("/integration/product/product-categories");
          categoryRootCount = categoryRoots(cats).length;
          authOk = true;
        } catch (error) {
          authError = error.body?.message || error.body?.exception || error.message;
        }
      }
      return res.status(200).json({
        success: true,
        config,
        authOk,
        authError,
        categoryRootCount,
        brandMatches: await brandSearch(),
        productCount: products.length,
      });
    }

    if (action === "settings") {
      if (req.method === "GET") return res.status(200).json({ settings: await readTrendyolSettings() });
      if (req.method === "POST") {
        const next = await writeTrendyolSettings(req.body || {});
        await logActivity("trendyol.settings", { by: admin.userId });
        return res.status(200).json({ success: true, settings: next });
      }
    }

    if (action === "preview-stock-price") {
      const settings = { ...(await readTrendyolSettings()), ...(req.body?.settings || {}) };
      const products = await readFrencinizProducts();
      const payload = buildStockPricePayload(products, settings, { limit: req.body?.limit });
      return res.status(200).json({ success: true, ...payload });
    }

    if (action === "live-stock-price") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST gerekli" });
      if (req.body?.confirm !== "CANLI GONDER") return res.status(400).json({ error: "Canli islem icin onay metni gerekli." });
      const settings = { ...(await readTrendyolSettings()), ...(req.body?.settings || {}) };
      const products = await readFrencinizProducts();
      const payload = buildStockPricePayload(products, settings, { limit: req.body?.limit });
      const chunks = chunkItems(payload.items, 1000);
      const results = [];
      for (const [index, chunk] of chunks.entries()) {
        const response = await trendyolRequest(`/integration/inventory/sellers/${publicTrendyolConfig().supplierId}/products/price-and-inventory`, {
          method: "POST",
          body: { items: chunk },
        });
        results.push({ chunk: index + 1, itemCount: chunk.length, response });
      }
      await logActivity("trendyol.stock-price.live", { by: admin.userId, itemCount: payload.items.length, chunkCount: chunks.length });
      return res.status(200).json({ success: true, summary: payload.summary, results });
    }

    if (action === "lookups") {
      const [products, tree, brandMatches] = await Promise.all([
        readFrencinizProducts(),
        trendyolRequest("/integration/product/product-categories"),
        brandSearch(),
      ]);
      const flat = flattenCategories(categoryRoots(tree));
      return res.status(200).json({
        success: true,
        categoryCount: flat.length,
        categoryCandidates: categoryCandidates(products, flat).slice(0, 250),
        brandMatches,
      });
    }

    if (action === "attributes") {
      const categoryId = String(req.query.categoryId || req.body?.categoryId || "").trim();
      if (!categoryId) return res.status(400).json({ error: "categoryId gerekli" });
      const supplierId = publicTrendyolConfig().supplierId;
      const data = await trendyolRequest(`/integration/ecgw/v1/${supplierId}/lookup/product-categories/${categoryId}/attributes`);
      return res.status(200).json({ success: true, categoryId, data });
    }

    if (action === "preview-products") {
      const settings = { ...(await readTrendyolSettings()), ...(req.body?.settings || {}) };
      const products = await readFrencinizProducts();
      const payload = buildProductV2Payload(products, settings, { limit: req.body?.limit });
      return res.status(200).json({ success: true, ...payload });
    }

    if (action === "live-products") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST gerekli" });
      if (req.body?.confirm !== "URUN YUKLE") return res.status(400).json({ error: "Canli urun yukleme icin onay metni gerekli." });
      const settings = { ...(await readTrendyolSettings()), ...(req.body?.settings || {}) };
      const products = await readFrencinizProducts();
      const payload = buildProductV2Payload(products, settings, { limit: req.body?.limit });
      if (!payload.items.length) return res.status(400).json({ error: "Gonderilecek uygun urun yok.", ...payload });
      const chunks = chunkItems(payload.items, 1000);
      const supplierId = publicTrendyolConfig().supplierId;
      const results = [];
      for (const [index, chunk] of chunks.entries()) {
        const response = await trendyolRequest(`/integration/product/sellers/${supplierId}/v2/products`, {
          method: "POST",
          body: { items: chunk },
        });
        results.push({ chunk: index + 1, itemCount: chunk.length, response });
      }
      await logActivity("trendyol.products.live", { by: admin.userId, itemCount: payload.items.length, chunkCount: chunks.length });
      return res.status(200).json({ success: true, summary: payload.summary, results });
    }

    if (action === "approved-products" || action === "inventory-products") {
      const kind = action === "inventory-products" ? "inventory" : "approved";
      const maxPages = Number(req.query.maxPages || req.body?.maxPages || 1);
      const size = Number(req.query.size || req.body?.size || 100);
      const page = Number(req.query.page || req.body?.page || 0);
      const nextPageToken = String(req.query.nextPageToken || req.body?.nextPageToken || "").trim();
      const filters = {
        barcode: req.query.barcode || req.body?.barcode,
        stockCode: req.query.stockCode || req.body?.stockCode,
        productMainId: req.query.productMainId || req.body?.productMainId,
        status: req.query.status || req.body?.status,
        orderByDirection: req.query.orderByDirection || req.body?.orderByDirection,
      };
      const products = await readFrencinizProducts();
      const marketplace = await fetchTrendyolProducts(kind, { maxPages, size, page, nextPageToken, filters });
      return res.status(200).json({
        success: true,
        marketplace,
        comparison: compareFrencinizToTrendyol(products, marketplace.items),
      });
    }

    if (action === "tracking") {
      const supplierId = publicTrendyolConfig().supplierId;
      const maxPages = Number(req.query.maxPages || req.body?.maxPages || 20);
      const size = Number(req.query.size || req.body?.size || 100);
      const batchIds = listFromInput(req.query.batchIds || req.body?.batchIds, DEFAULT_TRACKING_BATCH_IDS);
      const barcodes = listFromInput(req.query.barcodes || req.body?.barcodes, DEFAULT_TRACKING_BARCODES);
      const products = await readFrencinizProducts();

      const [marketplaceResult, batchResults, productResults] = await Promise.all([
        fetchTrendyolProducts("approved", { maxPages, size }).then((marketplace) => ({ ok: true, marketplace })).catch((error) => ({ ok: false, error })),
        Promise.all(batchIds.map(async (batchRequestId) => {
          try {
            const data = await trendyolRequest(`/integration/product/sellers/${supplierId}/products/batch-requests/${batchRequestId}`);
            return summarizeBatch(data, batchRequestId);
          } catch (error) {
            return {
              batchRequestId,
              ok: false,
              status: "ERROR",
              error: error.body?.message || error.body?.exception || error.message,
            };
          }
        })),
        Promise.all(barcodes.map(async (barcode) => {
          try {
            const data = await trendyolRequest(`/integration/product/sellers/${supplierId}/product/${encodeURIComponent(barcode)}`);
            return summarizeProductStatus(barcode, data);
          } catch (error) {
            return {
              barcode,
              ok: false,
              approved: false,
              status: "ERROR",
              error: error.body?.message || error.body?.exception || error.message,
            };
          }
        })),
      ]);

      const marketplace = marketplaceResult.ok ? marketplaceResult.marketplace : null;
      const comparison = marketplace ? compareFrencinizToTrendyol(products, marketplace.items) : null;
      const batchTotals = batchResults.reduce((acc, row) => {
        acc.itemCount += Number(row.itemCount || 0);
        acc.successCount += Number(row.successCount || 0);
        acc.failedItemCount += Number(row.failedItemCount || 0);
        acc.errorCount += row.ok === false ? 1 : 0;
        return acc;
      }, { itemCount: 0, successCount: 0, failedItemCount: 0, errorCount: 0 });
      const sampleApprovedCount = productResults.filter((row) => row.ok && row.approved).length;
      const samplePendingCount = productResults.filter((row) => row.ok && !row.approved).length;

      return res.status(200).json({
        success: true,
        checkedAt: new Date().toISOString(),
        summary: {
          frencinizCount: products.length,
          approvedVariantCount: marketplace?.summary?.variantCount ?? null,
          approvedProductCount: marketplace?.summary?.productCount ?? null,
          approvedTotalElements: marketplace?.summary?.totalElements ?? null,
          matchedCount: comparison?.summary?.matchedCount ?? null,
          missingOnTrendyolCount: comparison?.summary?.missingOnTrendyolCount ?? null,
          batchCount: batchResults.length,
          batchItemCount: batchTotals.itemCount,
          batchSuccessCount: batchTotals.successCount,
          batchFailedItemCount: batchTotals.failedItemCount,
          batchErrorCount: batchTotals.errorCount,
          sampleCount: productResults.length,
          sampleApprovedCount,
          samplePendingCount,
          sampleErrorCount: productResults.filter((row) => !row.ok).length,
        },
        marketplace: marketplace ? { summary: marketplace.summary } : null,
        marketplaceError: marketplaceResult.ok ? "" : (marketplaceResult.error?.body?.message || marketplaceResult.error?.message || "Onayli urun listesi alinamadi"),
        comparison: comparison ? { summary: comparison.summary, missingOnTrendyol: comparison.missingOnTrendyol, matched: comparison.matched } : null,
        batchSummaries: batchResults,
        productStatuses: productResults,
      });
    }

    if (action === "product-status") {
      const barcode = String(req.query.barcode || req.body?.barcode || "").trim();
      if (!barcode) return res.status(400).json({ error: "barcode gerekli" });
      const supplierId = publicTrendyolConfig().supplierId;
      const data = await trendyolRequest(`/integration/product/sellers/${supplierId}/product/${encodeURIComponent(barcode)}`);
      return res.status(200).json({ success: true, data });
    }

    if (action === "batch") {
      const batchRequestId = String(req.query.batchRequestId || req.body?.batchRequestId || "").trim();
      if (!batchRequestId) return res.status(400).json({ error: "batchRequestId gerekli" });
      const supplierId = publicTrendyolConfig().supplierId;
      const data = await trendyolRequest(`/integration/product/sellers/${supplierId}/products/batch-requests/${batchRequestId}`);
      return res.status(200).json({ success: true, data });
    }

    return res.status(404).json({ error: "Bilinmeyen Trendyol islemi" });
  } catch (error) {
    return sendError(res, error);
  }
}
