import { prioritySeoProductName } from "./oem-demand-priority.js";

const TR_MAP = {
  "ı": "i",
  "İ": "i",
  "ğ": "g",
  "Ğ": "g",
  "ü": "u",
  "Ü": "u",
  "ş": "s",
  "Ş": "s",
  "ö": "o",
  "Ö": "o",
  "ç": "c",
  "Ç": "c",
};

export function slugifyProductText(value, maxLength = 96) {
  const slug = String(value || "")
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, char => TR_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length <= maxLength) return slug || "urun";

  const trimmed = slug.slice(0, maxLength).replace(/-[^-]*$/, "").replace(/^-+|-+$/g, "");
  return trimmed || slug.slice(0, maxLength).replace(/^-+|-+$/g, "") || "urun";
}

const CATEGORY_SEARCH_LABELS = {
  "fren-diski": "Fren Diski",
  "fren-diski-abs-li": "ABS'li Fren Diski",
  "fren-kampanasi": "Fren Kampanası",
  "fren-balatasi": "Fren Balatası",
  "fren-pabucu": "Fren Pabucu",
  "fren-korugu": "Fren Körüğü",
  "suspansiyon-korugu": "Süspansiyon Körüğü",
  "otomatik-fren-circiri": "Otomatik Fren Cırcırı",
  "mekanik-fren-circiri": "Mekanik Fren Cırcırı",
  "fren-circiri": "Fren Cırcırı",
  "bijon": "Bijon",
  "disk-bijonu-civatasi": "Disk Bijonu Cıvatası",
  "somun-civata": "Somun Cıvata",
  "porya": "Porya",
  "porya-kapagi": "Porya Kapağı",
  "kaliper": "Kaliper",
  "kaliper-tamir-takimi": "Kaliper Tamir Takımı",
  "kaliper-perno-tamir-takimi": "Kaliper Perno Tamir Takımı",
  "kaliper-ayar-mekanizmasi": "Kaliper Ayar Mekanizması",
  "kaliper-kapak-conta": "Kaliper Kapak Conta",
  "kaliper-toz-lastigi": "Kaliper Toz Lastiği",
  "abs-sensoru-modulu-kablo": "ABS Sensörü EBS Modülatör",
  "ebs-modulator": "EBS Modülatör",
  "sensor": "ABS Sensörü",
  "yay": "Dorse Yayı",
};

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value) {
  return cleanText(value)
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, char => TR_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compactText(value, max = 155) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 3)).replace(/\s+\S*$/, "").replace(/[|,-]\s*$/g, "") + "...";
}

function uniqueParts(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts.map(cleanText).filter(Boolean)) {
    const key = normalizeSearchText(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

function firstUsefulCode(value) {
  const candidates = cleanText(value)
    .split(/[,;/|]+|\s+-\s+|\s{2,}/)
    .map(part => part.trim())
    .filter(Boolean);
  const first = candidates.find(part => {
    const compact = part.replace(/[^a-z0-9]/gi, "");
    const digitCount = (part.match(/\d/g) || []).length;
    return digitCount >= 3 || (digitCount >= 1 && compact.length >= 6);
  }) || "";
  const hyphenParts = first.split("-").map(part => part.trim()).filter(Boolean);
  if (hyphenParts.length >= 3 && /\d/.test(hyphenParts[0]) && hyphenParts.filter(part => /\d/.test(part)).length >= 2) {
    return hyphenParts[0];
  }
  if (first.length > 28) return "";
  return first;
}

export function productPrimaryCode(product) {
  return firstUsefulCode(product?.oem) || firstUsefulCode(product?.sku) || cleanText(product?.id);
}

export function productPrimaryCodeLabel(product) {
  if (firstUsefulCode(product?.oem)) return "OEM";
  if (firstUsefulCode(product?.sku)) return "SKU";
  return "Kod";
}

export function productPartLabel(product, categories = []) {
  const productName = normalizeSearchText(product?.name);
  const explicitParts = [
    ["kaliper tamir takimi", "Kaliper Tamir Tak\u0131m\u0131"],
    ["kaliper ayar mekanizmasi", "Kaliper Ayar Mekanizmas\u0131"],
    ["kaliper toz lastigi", "Kaliper Toz Lasti\u011fi"],
    ["porya kapagi", "Porya Kapa\u011f\u0131"],
    ["suspansiyon korugu", "S\u00fcspansiyon K\u00f6r\u00fc\u011f\u00fc"],
    ["fren korugu", "Fren K\u00f6r\u00fc\u011f\u00fc"],
    ["fren circiri", "Fren C\u0131rc\u0131r\u0131"],
    ["fren diski", "Fren Diski"],
    ["fren balat", "Fren Balatas\u0131"],
    ["fren kampana", "Fren Kampanas\u0131"],
    ["abs sensor", "ABS Sens\u00f6r\u00fc"],
    ["fren yayi", "Dorse Fren Yay\u0131"],
  ];
  const explicit = explicitParts.find(([needle]) => productName.includes(needle));
  if (explicit) return explicit[1];

  const mapped = CATEGORY_SEARCH_LABELS[product?.cat];
  if (mapped) return mapped;
  const category = Array.isArray(categories) ? categories.find(item => item.id === product?.cat) : null;
  return cleanText(category?.name || product?.cat || "Ağır Vasıta Fren Aksamı");
}

export function productVehicleSignals(product, max = 3) {
  const name = cleanText(product?.name);
  const known = [
    "Mercedes Axor", "Mercedes Actros", "Mercedes Atego", "Mercedes Arocs", "Travego", "Tourismo",
    "MAN TGA", "MAN TGS", "MAN TGX", "MAN Fortuna", "Volvo FH", "Volvo FM", "Scania G", "Scania R",
    "DAF XF", "DAF CF", "Ford Cargo", "Ford F-Max", "Renault Premium", "Renault Kerax", "Renault Magnum",
    "Iveco Stralis", "Iveco Eurocargo", "BPW", "SAF", "Krone", "Kogel", "Schmitz", "Tirsan", "ROR", "Meritor",
    "Isuzu NovoCiti", "Isuzu NPR", "Mitsubishi Canter",
  ];
  const haystack = normalizeSearchText(name);
  const explicitNameSignals = known.filter(term => haystack.includes(normalizeSearchText(term)));
  if (explicitNameSignals.length) return uniqueParts(explicitNameSignals).slice(0, max);

  const values = [
    ...(Array.isArray(product?.compat) ? product.compat : []),
    ...(Array.isArray(product?.veh) ? product.veh : []),
  ].map(cleanText).filter(Boolean);

  const useful = values.filter(value => !/^(agir vasita|kamyon|tir|otobus|dorse|treyler)$/i.test(normalizeSearchText(value)));
  if (useful.length) return uniqueParts(useful).slice(0, max);

  return known.filter(term => haystack.includes(normalizeSearchText(term))).slice(0, max);
}

export function productVehiclePhrase(product, max = 5) {
  return productVehicleSignals(product, max).join(", ");
}

export function productSeoSearchPhrases(product, categories = [], max = 8) {
  const name = productSearchName(product, categories, 130);
  const part = productPartLabel(product, categories);
  const code = productPrimaryCode(product);
  const sku = firstUsefulCode(product?.sku);
  const oem = firstUsefulCode(product?.oem);
  const vehicles = productVehicleSignals(product, 4);
  const vehiclePhrases = vehicles.flatMap(vehicle => [
    `${vehicle} ${part}`,
    code ? `${vehicle} ${code}` : "",
    sku ? `${vehicle} ${sku}` : "",
  ]);

  return uniqueParts([
    name,
    ...vehiclePhrases,
    code ? `${code} ${part}` : "",
    sku ? `${sku} ${part}` : "",
    oem ? `${oem} ${part}` : "",
    `${part} fiyat`,
    `${part} stok`,
    `${part} uyumluluk`,
  ]).slice(0, max);
}

function nameHasPart(name, part) {
  const haystack = normalizeSearchText(name);
  const needle = normalizeSearchText(part);
  if (needle && haystack.includes(needle)) return true;
  return needle.split(/\s+/).filter(word => word.length > 3).some(word => haystack.includes(word));
}

export function productSearchName(product, categories = [], max = 128) {
  const priorityName = prioritySeoProductName(product, max);
  if (priorityName) return compactText(priorityName, max);
  const original = cleanText(product?.name || "Ağır Vasıta Fren Parçası");
  const part = productPartLabel(product, categories);
  const base = nameHasPart(original, part) ? original : `${part} ${original}`;
  const code = firstUsefulCode(product?.oem) || firstUsefulCode(product?.sku);
  const codeFirstBase = code && !normalizeSearchText(base).includes(normalizeSearchText(code))
    ? `${code} ${base}`
    : base;
  return compactText(uniqueParts([codeFirstBase]).join(" "), max);
}

export function productSearchTitle(product, categories = [], max = 74) {
  const part = productPartLabel(product, categories);
  const vehicleSignals = productVehicleSignals(product, 2);
  const primaryCode = productPrimaryCode(product);
  const sku = cleanText(product?.sku).slice(0, 24) || cleanText(product?.id);
  const usefulCode = /\d/.test(primaryCode) ? primaryCode : sku;
  const distinctSku = normalizeSearchText(sku) !== normalizeSearchText(usefulCode) ? sku : "";
  const suffix = " | Frenciniz";
  const available = Math.max(30, max - suffix.length);
  const candidates = [
    uniqueParts([usefulCode, distinctSku, vehicleSignals[0], part, "Fiyatı"]).join(" "),
    uniqueParts([usefulCode, distinctSku, part, "Fiyatı"]).join(" "),
    uniqueParts([usefulCode, ...vehicleSignals, part, "Fiyatı"]).join(" "),
  ].filter(Boolean);
  const base = candidates.find(value => value.length <= available)
    || compactText(candidates[candidates.length - 1] || productSearchName(product, categories, 116), available);
  return `${base}${suffix}`;
}

export function productSearchDescription(product, categories = [], max = 165) {
  const name = productSearchName(product, categories, 120);
  const vehicles = productVehicleSignals(product).join(", ");
  const code = productPrimaryCode(product);
  const stock = Number(product?.stock || 0);
  const searchPhrases = productSeoSearchPhrases(product, categories, 4)
    .filter(phrase => normalizeSearchText(phrase) !== normalizeSearchText(name))
    .join("; ");
  const pieces = [
    `${name} fiyatı, stok ve uyumluluk teyidi.`,
    vehicles ? `Uyumluluk adayları: ${vehicles}.` : "",
    code ? `OEM/SKU: ${code}.` : "",
    searchPhrases ? `İlgili aramalar: ${searchPhrases}.` : "",
    stock > 0 ? "Stokta ürün, hızlı kargo ve WhatsApp teklif." : "Stok ve fiyat için WhatsApp teklif alın.",
  ];
  return compactText(pieces.filter(Boolean).join(" "), max);
}

export function productSeoFaqItems(product, categories = []) {
  const name = productSearchName(product, categories, 140) || cleanText(product?.name, "Frenciniz urunu");
  const part = productPartLabel(product, categories);
  const code = productPrimaryCode(product);
  const sku = cleanText(product?.sku);
  const oem = cleanText(product?.oem);
  const vehicles = productVehiclePhrase(product, 6);
  const stock = Number(product?.stock || 0);
  const searchPhrases = productSeoSearchPhrases(product, categories, 6).join(", ");

  return [
    {
      question: `${name} aracıma uyar mı?`,
      answer: `${name} icin kesin uyumluluk OEM/parca kodu, sase no veya eski parca fotografi ile teyit edilir.${vehicles ? ` Aday uyumluluklar: ${vehicles}.` : ""}`,
    },
    {
      question: `${name} OEM veya stok kodu nedir?`,
      answer: code
        ? `${name} icin gorunen ana kod: ${code}. Stok kodu: ${sku || "-"}. OEM/muadil kod: ${oem || "-"}.`
        : `${name} icin OEM veya stok kodu eski parca fotografi ya da sase ile kontrol edilir.`,
    },
    {
      question: `${name} stok ve kargo durumu nedir?`,
      answer: stock > 0
        ? `${name} icin stokta ${Math.floor(stock)} adet gorunuyor. Fiyat, kargo ve uyumluluk siparisten once Frenciniz tarafindan teyit edilir.`
        : `${name} icin stok ve fiyat bilgisi WhatsApp uzerinden teyit edilir.`,
    },
    {
      question: `${name} hangi parca aramalarinda kontrol edilir?`,
      answer: searchPhrases
        ? `${name} icin kontrol edilen baslica arama ifadeleri: ${searchPhrases}. Kesin siparis oncesi OEM, sase veya eski parca fotografi ile teyit alin.`
        : `${name} icin arama ve uyumluluk OEM/parca kodu, arac modeli ve eski parca fotografi ile kontrol edilir.`,
    },
    {
      question: `${part} siparişinde yanlış parça riskini nasıl azaltırım?`,
      answer: "Siparisten once OEM/parca kodu, arac marka-model, sase no veya eski parca fotografini Frenciniz WhatsApp hattina gondererek uyumluluk teyidi alabilirsiniz.",
    },
  ];
}

export function productSeoSlug(product) {
  if (!product) return "urun";
  const parts = [
    productSearchName(product, [], 110),
    product.brand,
  ].filter(Boolean);
  return slugifyProductText(parts.join(" "));
}

export function productSeoPath(product) {
  if (!product?.id) return "/urunler";
  return `/urun/${encodeURIComponent(product.id)}/${productSeoSlug(product)}`;
}

export function productSeoUrl(site, product) {
  const root = String(site || "").replace(/\/+$/g, "");
  return `${root}${productSeoPath(product)}`;
}

export function productIdFromRoute(value) {
  const first = String(value || "").replace(/^\/+|\/+$/g, "").split("/")[0];
  const numeric = Number(first);
  return Number.isFinite(numeric) && first !== "" ? numeric : first;
}
