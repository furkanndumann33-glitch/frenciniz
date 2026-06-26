import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";
import { buildSeoProductDescription, buildSeoProductTitle } from "../../shared/product-content.js";

const DEFAULT_SETTINGS = {
  commissionRate: 14,
  stopajRate: 1,
  adRate: 3,
  targetProfit: 750,
  defaultCargoCost: 250,
  defaultDesi: 5,
  listPriceMarkup: 10,
  brandId: "",
  cargoCompanyId: "",
  defaultOrigin: "TR",
  categoryMappings: {},
};

let localEnvLoaded = false;

function loadLocalEnv() {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

export function getTrendyolConfig() {
  loadLocalEnv();
  const supplierId = String(process.env.TRENDYOL_SUPPLIER_ID || "").trim();
  const apiKey = String(process.env.TRENDYOL_API_KEY || "").trim();
  const apiSecret = String(process.env.TRENDYOL_API_SECRET || "").trim();
  const integratorName = String(process.env.TRENDYOL_INTEGRATOR_NAME || "SelfIntegration")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 30) || "SelfIntegration";
  const baseUrl = String(process.env.TRENDYOL_BASE_URL || "https://apigw.trendyol.com").replace(/\/+$/, "");

  return {
    supplierId,
    apiKey,
    apiSecret,
    integratorName,
    baseUrl,
    userAgent: supplierId ? `${supplierId} - ${integratorName}` : "",
    hasCredentials: Boolean(supplierId && apiKey && apiSecret),
  };
}

export function publicTrendyolConfig() {
  const config = getTrendyolConfig();
  return {
    supplierId: config.supplierId,
    integratorName: config.integratorName,
    baseUrl: config.baseUrl,
    userAgent: config.userAgent,
    hasSupplierId: Boolean(config.supplierId),
    hasApiKey: Boolean(config.apiKey),
    hasApiSecret: Boolean(config.apiSecret),
    hasCredentials: config.hasCredentials,
  };
}

function buildHeaders(config, extra = {}) {
  if (!config.hasCredentials) throw new Error("Trendyol API bilgileri eksik.");
  const token = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "User-Agent": config.userAgent,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
}

function withQuery(url, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
}

export async function trendyolRequest(endpoint, options = {}) {
  const config = getTrendyolConfig();
  const url = new URL(endpoint.startsWith("http") ? endpoint : `${config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`);
  withQuery(url, options.query);
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: buildHeaders(config, options.headers),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let data = text;
  if (text) {
    try { data = JSON.parse(text); } catch {}
  }
  if (!response.ok) {
    const err = new Error(`Trendyol API ${response.status}: ${url.pathname}`);
    err.status = response.status;
    err.body = data;
    throw err;
  }
  return data;
}

async function safeKvGet(key) {
  try { return await kv.get(key); } catch { return null; }
}

async function safeKvSet(key, value) {
  try {
    await kv.set(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function readTrendyolSettings() {
  const raw = await safeKvGet("trendyol:settings");
  let saved = {};
  try { saved = typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch {}
  return { ...DEFAULT_SETTINGS, ...saved, categoryMappings: saved.categoryMappings || DEFAULT_SETTINGS.categoryMappings };
}

export async function writeTrendyolSettings(patch = {}) {
  const current = await readTrendyolSettings();
  const next = {
    ...current,
    ...patch,
    categoryMappings: patch.categoryMappings || current.categoryMappings || {},
    updatedAt: new Date().toISOString(),
  };
  await safeKvSet("trendyol:settings", next);
  return next;
}

function readStaticProducts() {
  const fullPath = path.join(process.cwd(), "public/data/products.json");
  if (!fs.existsSync(fullPath)) return [];
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return Array.isArray(data) ? data : (data.products || []);
}

export async function readFrencinizProducts() {
  const cached = await safeKvGet("products:cache") || await safeKvGet("products");
  if (cached) {
    try {
      const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      return Array.isArray(parsed) ? parsed : (parsed.products || []);
    } catch {}
  }
  return readStaticProducts();
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function cleanText(value, max = Infinity) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, max);
}

export function slugKey(value) {
  return String(value || "")
    .toLocaleUpperCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function barcodeFor(product, index) {
  const existing = cleanText(product.barcode || product.barkod, 40);
  if (existing) return { barcode: existing, source: "product" };
  const sku = cleanText(product.sku || product.stockCode || product.id || index, 24).replace(/[^A-Za-z0-9]/g, "");
  const prefix = String(product.id || index + 1).replace(/\D/g, "").padStart(6, "0").slice(-6);
  return { barcode: `FRN${prefix}${sku}`.slice(0, 40), source: "generated" };
}

function imageList(product) {
  const siteBase = String(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.frenciniz.com").replace(/\/+$/, "");
  const normalizeUrl = (value) => {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^https:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${siteBase}${url}`;
    return "";
  };
  const raw = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.img_lg,
    product.img,
  ].filter(Boolean);
  return Array.from(new Set(raw))
    .map(normalizeUrl)
    .filter((url) => /^https:\/\//i.test(String(url)))
    .slice(0, 8)
    .map((url) => ({ url: String(url) }));
}

function costFor(product) {
  const value = product.cost ?? product.b2b_price ?? product.alis_son_net ?? product.purchasePrice ?? product.buyingPrice;
  const parsed = toNumber(value, 0);
  return parsed > 0 ? parsed : null;
}

function categoryKey(product) {
  return cleanText(product.cat || product.category || product.categoryName || product.frenciniz_kategori);
}

function categoryNameFromProduct(product) {
  return cleanText(product.categoryName || product.frenciniz_kategori || product.cat || "Kategori yok");
}

function salePriceFor(product, settings) {
  const sitePrice = money(toNumber(product.price || product.site_fiyati, 0));
  const cost = costFor(product);
  if (!cost) return { salePrice: sitePrice, expectedProfit: null, cost: null, sitePrice };
  const rate = (
    toNumber(settings.commissionRate, 0) +
    toNumber(settings.stopajRate, 0) +
    toNumber(settings.adRate, 0)
  ) / 100;
  const cargo = toNumber(product.cargoCost || product.kargo_maliyeti, toNumber(settings.defaultCargoCost, 0));
  const targetProfit = toNumber(settings.targetProfit, 0);
  const required = rate >= 0.95 ? sitePrice : (cost + cargo + targetProfit) / (1 - rate);
  const salePrice = money(Math.max(sitePrice, required));
  const expectedProfit = money(salePrice * (1 - rate) - cost - cargo);
  return { salePrice, expectedProfit, cost: money(cost), sitePrice, cargo: money(cargo) };
}

function listPriceFor(salePrice, product, settings) {
  const siteOld = toNumber(product.old || product.listPrice || product.piyasa_fiyati, 0);
  const markup = toNumber(settings.listPriceMarkup, 10);
  return money(Math.max(Math.ceil(salePrice * (1 + markup / 100)), Math.ceil(siteOld), Math.ceil(salePrice) + 1));
}

function marketplaceTitleFor(product) {
  const title = buildSeoProductTitle(product, product.compat || [], { max: 100, marketplace: true });
  return title || cleanText(product.name || product.title || product.sku || product.stockCode, 100);
}

function marketplaceDescriptionFor(product, title) {
  return buildSeoProductDescription(product, product.compat || [], {
    title,
    max: 30000,
    marketplace: true,
  });
}

export function buildStockPricePayload(products, settings, options = {}) {
  const limit = Math.max(0, Number(options.limit) || 0);
  const items = [];
  const skipped = [];
  const sample = [];
  let generatedBarcodes = 0;

  for (const [index, product] of products.entries()) {
    const { barcode, source } = barcodeFor(product, index);
    const quantity = Math.min(20000, Math.max(0, Math.floor(toNumber(product.stock, 0))));
    const pricing = salePriceFor(product, settings);
    if (source === "generated") generatedBarcodes += 1;
    if (!barcode || !(pricing.salePrice > 0)) {
      skipped.push({ sku: product.sku, name: product.name, reason: "barcode veya fiyat gecersiz" });
      continue;
    }
    const item = {
      barcode,
      quantity,
      salePrice: pricing.salePrice,
      listPrice: listPriceFor(pricing.salePrice, product, settings),
    };
    items.push(item);
    if (sample.length < 80) {
      sample.push({
        ...item,
        sku: product.sku || "",
        name: product.name || "",
        barcodeSource: source,
        expectedProfit: pricing.expectedProfit,
        cost: pricing.cost,
        sitePrice: pricing.sitePrice,
      });
    }
    if (limit && items.length >= limit) break;
  }

  return {
    summary: {
      sourceProductCount: products.length,
      itemCount: items.length,
      skippedCount: skipped.length,
      chunkCount: Math.ceil(items.length / 1000),
      generatedBarcodes,
      hasCostData: sample.some((row) => row.cost !== null),
    },
    items,
    sample,
    skipped: skipped.slice(0, 80),
  };
}

function resolveAttributeValue(product, attr) {
  const next = { ...attr };
  const from = next.customAttributeValueFrom;
  if (from) {
    const value = cleanText(product[from] ?? product[from.replace(/^product\./, "")], next.customAttributeMaxLength || 500);
    next.customAttributeValue = value || next.customAttributeFallback || "";
    delete next.customAttributeValueFrom;
    delete next.customAttributeMaxLength;
    delete next.customAttributeFallback;
  }
  return next;
}

function findCategoryMapping(product, settings) {
  const mappings = settings.categoryMappings || {};
  const keys = [
    categoryKey(product),
    categoryNameFromProduct(product),
    slugKey(categoryKey(product)),
    slugKey(categoryNameFromProduct(product)),
  ].filter(Boolean);
  for (const key of keys) {
    if (mappings[key]) return mappings[key];
  }
  return null;
}

export function buildProductV2Payload(products, settings, options = {}) {
  const limit = Math.max(0, Number(options.limit) || 0);
  const brandId = Number(settings.brandId || 0);
  const items = [];
  const sample = [];
  const skipped = [];
  const mappingNeeded = new Map();

  for (const [index, product] of products.entries()) {
    const reasons = [];
    const { barcode, source } = barcodeFor(product, index);
    const pricing = salePriceFor(product, settings);
    const images = imageList(product);
    const mapping = findCategoryMapping(product, settings);

    if (!brandId) reasons.push("brandId eksik");
    if (!mapping?.categoryId || !Array.isArray(mapping?.attributes)) {
      const key = categoryNameFromProduct(product);
      const current = mappingNeeded.get(key) || { category: key, productCat: categoryKey(product), count: 0, sampleSku: product.sku || "" };
      current.count += 1;
      mappingNeeded.set(key, current);
      reasons.push("kategori/attribute eslesmesi eksik");
    }
    if (!images.length) reasons.push("https gorsel yok");
    if (!barcode || !(pricing.salePrice > 0)) reasons.push("barcode veya fiyat gecersiz");

    if (reasons.length) {
      skipped.push({ sku: product.sku, name: product.name, category: categoryNameFromProduct(product), reason: reasons.join(" | ") });
      continue;
    }

    const title = marketplaceTitleFor(product);
    const description = marketplaceDescriptionFor(product, title);

    const item = {
      barcode,
      title,
      description,
      productMainId: cleanText(product.sku || product.id || barcode, 40),
      brandId,
      categoryId: Number(mapping.categoryId),
      quantity: Math.min(20000, Math.max(0, Math.floor(toNumber(product.stock, 0)))),
      stockCode: cleanText(product.sku || barcode, 100),
      origin: mapping.origin || settings.defaultOrigin || "TR",
      dimensionalWeight: money(toNumber(product.desi, toNumber(settings.defaultDesi, 1))),
      listPrice: listPriceFor(pricing.salePrice, product, settings),
      salePrice: pricing.salePrice,
      vatRate: Math.round(toNumber(product.vat_rate ?? product.vatRate, 20)),
      images,
      attributes: mapping.attributes.map((attr) => resolveAttributeValue(product, attr)),
    };
    if (settings.cargoCompanyId) item.cargoCompanyId = Number(settings.cargoCompanyId);
    items.push(item);
    if (sample.length < 50) sample.push({ ...item, sku: product.sku, name: product.name, barcodeSource: source });
    if (limit && items.length >= limit) break;
  }

  return {
    summary: {
      sourceProductCount: products.length,
      itemCount: items.length,
      skippedCount: skipped.length,
      chunkCount: Math.ceil(items.length / 1000),
      mappingNeededCount: mappingNeeded.size,
      brandReady: Boolean(brandId),
    },
    items,
    sample,
    skipped: skipped.slice(0, 80),
    mappingNeeded: Array.from(mappingNeeded.values()).sort((a, b) => b.count - a.count),
  };
}

function pageItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

function normalizeKey(value) {
  return cleanText(value, 120).toLocaleUpperCase("tr-TR");
}

function numericOrBlank(value) {
  const n = toNumber(value, NaN);
  return Number.isFinite(n) ? money(n) : "";
}

export function flattenTrendyolVariants(products = []) {
  const rows = [];
  for (const product of products || []) {
    const brand = product.brand?.name || product.brandName || product.brandNameText || product.brand || "";
    const category = product.category?.name || product.categoryName || product.pimCategoryName || product.category || "";
    const base = {
      productMainId: cleanText(product.productMainId || product.productContentId || product.id || "", 80),
      title: cleanText(product.title || product.name || product.productName || "", 180),
      brand: cleanText(brand, 80),
      category: cleanText(category, 120),
      status: cleanText(product.status || product.productStatus || "", 60),
      approved: product.approved ?? product.isApproved ?? "",
    };
    const variants = Array.isArray(product.variants) && product.variants.length ? product.variants : [product];
    for (const variant of variants) {
      rows.push({
        ...base,
        barcode: cleanText(variant.barcode || product.barcode || "", 80),
        stockCode: cleanText(variant.stockCode || product.stockCode || variant.stockId || "", 100),
        quantity: numericOrBlank(variant.quantity ?? variant.stock?.quantity ?? variant.stock ?? product.quantity ?? product.stock?.quantity ?? product.stock),
        salePrice: numericOrBlank(variant.salePrice ?? variant.price?.salePrice ?? variant.price ?? product.salePrice ?? product.price?.salePrice ?? product.price),
        listPrice: numericOrBlank(variant.listPrice ?? variant.price?.listPrice ?? product.listPrice ?? product.price?.listPrice),
        vatRate: numericOrBlank(variant.vatRate ?? product.vatRate),
        raw: variant,
      });
    }
  }
  return rows.filter((row) => row.barcode || row.stockCode || row.title || row.productMainId);
}

export async function fetchTrendyolProducts(kind = "approved", options = {}) {
  const { supplierId } = publicTrendyolConfig();
  const isInventory = kind === "inventory";
  let endpoint = isInventory
    ? `/integration/product/sellers/${supplierId}/products/approved/inventory-and-price`
    : `/integration/product/sellers/${supplierId}/products/approved`;
  const fallbackEndpoint = `/integration/product/sellers/${supplierId}/products`;
  let source = isInventory ? "product-v2-inventory-and-price" : "product-v2-approved";
  const size = Math.max(1, Math.min(100, Number(options.size) || 100));
  const maxPages = Math.max(1, Math.min(50, Number(options.maxPages) || 1));
  const filters = options.filters || {};
  const items = [];
  const pages = [];
  let page = Math.max(0, Number(options.page) || 0);
  let token = cleanText(options.nextPageToken || filters.nextPageToken || "", 300);
  let totalElements = null;
  let totalPages = null;
  let nextPageToken = token;

  for (let i = 0; i < maxPages; i += 1) {
    const query = { ...filters, size };
    delete query.nextPageToken;
    if (source === "v1-filter-products") query.approved = true;
    if (token && source !== "v1-filter-products") query.nextPageToken = token;
    else query.page = page;

    let data;
    try {
      data = await trendyolRequest(endpoint, { query });
    } catch (error) {
      if (error.status !== 404 || endpoint === fallbackEndpoint) throw error;
      endpoint = fallbackEndpoint;
      source = "v1-filter-products";
      const fallbackQuery = { ...filters, size, page, approved: true };
      data = await trendyolRequest(endpoint, { query: fallbackQuery });
    }
    const content = pageItems(data);
    items.push(...content);
    totalElements = data?.totalElements ?? data?.totalCount ?? totalElements;
    totalPages = data?.totalPages ?? totalPages;
    nextPageToken = cleanText(data?.nextPageToken || "", 300);
    pages.push({
      page: data?.page ?? page,
      size,
      itemCount: content.length,
      nextPageToken,
    });

    if (nextPageToken && nextPageToken !== token) {
      token = nextPageToken;
      continue;
    }
    if (!token && totalPages !== null && page + 1 < Number(totalPages)) {
      page += 1;
      continue;
    }
    if (!token && totalPages === null && content.length >= size) {
      page += 1;
      continue;
    }
    break;
  }

  const variants = flattenTrendyolVariants(items);
  return {
    kind: isInventory ? "inventory" : "approved",
    summary: {
      pagesFetched: pages.length,
      productCount: items.length,
      variantCount: variants.length,
      totalElements,
      totalPages,
      nextPageToken,
      size,
      source,
    },
    pages,
    items,
    variants,
  };
}

export function frencinizMarketplaceRows(products = []) {
  return products.map((product, index) => {
    const { barcode, source } = barcodeFor(product, index);
    return {
      sku: cleanText(product.sku || product.stockCode || product.id || "", 100),
      name: cleanText(product.name || product.title || "", 180),
      barcode,
      barcodeSource: source,
      stock: Math.max(0, Math.floor(toNumber(product.stock, 0))),
      sitePrice: money(toNumber(product.price || product.site_fiyati, 0)),
      category: categoryNameFromProduct(product),
    };
  });
}

export function compareFrencinizToTrendyol(products = [], marketplaceProducts = []) {
  const frencinizRows = frencinizMarketplaceRows(products);
  const trendyolRows = flattenTrendyolVariants(marketplaceProducts);
  const byBarcode = new Map();
  const byStockCode = new Map();

  for (const row of trendyolRows) {
    const barcode = normalizeKey(row.barcode);
    const stockCode = normalizeKey(row.stockCode);
    if (barcode && !byBarcode.has(barcode)) byBarcode.set(barcode, row);
    if (stockCode && !byStockCode.has(stockCode)) byStockCode.set(stockCode, row);
  }

  const frencinizBarcodes = new Set(frencinizRows.map((row) => normalizeKey(row.barcode)).filter(Boolean));
  const frencinizStockCodes = new Set(frencinizRows.map((row) => normalizeKey(row.sku)).filter(Boolean));
  const matched = [];
  const missing = [];

  for (const row of frencinizRows) {
    const barcode = normalizeKey(row.barcode);
    const sku = normalizeKey(row.sku);
    const hit = (barcode && byBarcode.get(barcode)) || (sku && byStockCode.get(sku));
    if (hit) {
      matched.push({
        ...row,
        matchType: barcode && normalizeKey(hit.barcode) === barcode ? "barcode" : "stockCode",
        trendyolSalePrice: hit.salePrice,
        trendyolListPrice: hit.listPrice,
        trendyolQuantity: hit.quantity,
        trendyolStatus: hit.status || hit.approved,
      });
    } else {
      missing.push(row);
    }
  }

  const extra = trendyolRows.filter((row) => {
    const barcode = normalizeKey(row.barcode);
    const stockCode = normalizeKey(row.stockCode);
    return !(barcode && frencinizBarcodes.has(barcode)) && !(stockCode && frencinizStockCodes.has(stockCode));
  });

  return {
    summary: {
      frencinizCount: frencinizRows.length,
      trendyolProductCount: marketplaceProducts.length,
      trendyolVariantCount: trendyolRows.length,
      matchedCount: matched.length,
      missingOnTrendyolCount: missing.length,
      extraOnTrendyolCount: extra.length,
      generatedBarcodeCount: frencinizRows.filter((row) => row.barcodeSource === "generated").length,
    },
    matched: matched.slice(0, 100),
    missingOnTrendyol: missing.slice(0, 100),
    extraOnTrendyol: extra.slice(0, 100),
    trendyolSample: trendyolRows.slice(0, 100),
  };
}

export function chunkItems(items, size = 1000) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function childrenOf(node) {
  return node.subCategories || node.children || node.categoryTree || node.categories || [];
}

export function flattenCategories(nodes, parentPath = [], depth = 0) {
  const rows = [];
  for (const node of nodes || []) {
    const name = cleanText(node.name || node.categoryName || node.displayName);
    const id = node.id || node.categoryId;
    const fullPath = [...parentPath, name].filter(Boolean);
    rows.push({ id, name, depth, path: fullPath.join(" > ") });
    rows.push(...flattenCategories(childrenOf(node), fullPath, depth + 1));
  }
  return rows;
}

export function categoryRoots(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.categoryTree)) return data.categoryTree;
  return [];
}

export function categoryCandidates(products, flatCategories) {
  const groups = new Map();
  for (const product of products) {
    const key = categoryNameFromProduct(product);
    const current = groups.get(key) || { category: key, productCat: categoryKey(product), count: 0, sampleSku: product.sku || "" };
    current.count += 1;
    groups.set(key, current);
  }
  const stop = new Set(["OTO", "OTOMOBIL", "MOTOSIKLET", "YEDEK", "PARCA", "AKSESUAR", "VE"]);
  const tokens = (text) => slugKey(text).split(/\s+/).filter((token) => token.length >= 3 && !stop.has(token));
  return Array.from(groups.values()).flatMap((group) => {
    const groupTokens = tokens(`${group.category} ${group.productCat}`);
    return flatCategories
      .map((category) => {
        const pathKey = slugKey(category.path);
        let score = 0;
        for (const token of groupTokens) {
          if (slugKey(category.name).includes(token)) score += 8;
          else if (pathKey.includes(token)) score += 4;
        }
        if (pathKey.includes("OTOMOBIL YEDEK PARCA")) score += 5;
        if (pathKey.includes("BAKIM TEMIZLIK")) score -= 6;
        return { ...group, candidateId: category.id, candidatePath: category.path, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  });
}
