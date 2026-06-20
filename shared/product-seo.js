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
  "fren-kampanasi": "Fren Kampanasi",
  "fren-balatasi": "Fren Balatasi",
  "fren-pabucu": "Fren Pabucu",
  "fren-korugu": "Fren Korugu",
  "suspansiyon-korugu": "Suspansiyon Korugu",
  "otomatik-fren-circiri": "Otomatik Fren Circiri",
  "mekanik-fren-circiri": "Mekanik Fren Circiri",
  "fren-circiri": "Fren Circiri",
  "bijon": "Bijon",
  "disk-bijonu-civatasi": "Disk Bijonu Civatasi",
  "somun-civata": "Somun Civata",
  "porya": "Porya",
  "porya-kapagi": "Porya Kapagi",
  "kaliper": "Kaliper",
  "kaliper-tamir-takimi": "Kaliper Tamir Takimi",
  "kaliper-perno-tamir-takimi": "Kaliper Perno Tamir Takimi",
  "kaliper-ayar-mekanizmasi": "Kaliper Ayar Mekanizmasi",
  "kaliper-kapak-conta": "Kaliper Kapak Conta",
  "kaliper-toz-lastigi": "Kaliper Toz Lastigi",
  "abs-sensoru-modulu-kablo": "ABS Sensoru EBS Modulator",
  "ebs-modulator": "EBS Modulator",
  "sensor": "ABS Sensoru",
  "yay": "Dorse Yayi",
};

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value) {
  return cleanText(value)
    .replace(/[Ä±Ä°ÄŸÄÃ¼ÃœÅŸÅÃ¶Ã–Ã§Ã‡]/g, char => TR_MAP[char] || char)
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
  const first = cleanText(value)
    .split(/[,;/|]+|\s+-\s+|\s{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
    .find(part => /[0-9]/.test(part)) || "";
  const hyphenParts = first.split("-").map(part => part.trim()).filter(Boolean);
  if (hyphenParts.length >= 3 && /^\d{5,}$/.test(hyphenParts[0])) return hyphenParts[0];
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
  const mapped = CATEGORY_SEARCH_LABELS[product?.cat];
  if (mapped) return mapped;
  const category = Array.isArray(categories) ? categories.find(item => item.id === product?.cat) : null;
  return cleanText(category?.name || product?.cat || "Agir Vasita Fren Aksami");
}

export function productVehicleSignals(product, max = 3) {
  const values = [
    ...(Array.isArray(product?.compat) ? product.compat : []),
    ...(Array.isArray(product?.veh) ? product.veh : []),
  ].map(cleanText).filter(Boolean);

  const useful = values.filter(value => !/^(agir vasita|kamyon|tir|otobus|dorse|treyler)$/i.test(normalizeSearchText(value)));
  if (useful.length) return uniqueParts(useful).slice(0, max);

  const name = cleanText(product?.name);
  const known = [
    "Mercedes Axor", "Mercedes Actros", "Mercedes Atego", "Mercedes Arocs", "Travego", "Tourismo",
    "MAN TGA", "MAN TGS", "MAN TGX", "MAN Fortuna", "Volvo FH", "Volvo FM", "Scania G", "Scania R",
    "DAF XF", "DAF CF", "Ford Cargo", "Ford F-Max", "Renault Premium", "Renault Kerax", "Renault Magnum",
    "Iveco Stralis", "Iveco Eurocargo", "BPW", "SAF", "Krone", "Kogel", "Schmitz", "Tirsan", "ROR", "Meritor",
    "Isuzu NovoCiti", "Isuzu NPR", "Mitsubishi Canter",
  ];
  const haystack = normalizeSearchText(name);
  return known.filter(term => haystack.includes(normalizeSearchText(term))).slice(0, max);
}

export function productVehiclePhrase(product, max = 5) {
  return productVehicleSignals(product, max).join(", ");
}

function nameHasPart(name, part) {
  const haystack = normalizeSearchText(name);
  const needle = normalizeSearchText(part);
  if (needle && haystack.includes(needle)) return true;
  return needle.split(/\s+/).filter(word => word.length > 3).some(word => haystack.includes(word));
}

export function productSearchName(product, categories = [], max = 128) {
  const original = cleanText(product?.name || "Agir Vasita Fren Parcasi");
  const part = productPartLabel(product, categories);
  const base = nameHasPart(original, part) ? original : `${part} ${original}`;
  const code = productPrimaryCode(product);
  const codeLabel = productPrimaryCodeLabel(product);
  const sku = cleanText(product?.sku);
  const pieces = [base];
  if (code && !normalizeSearchText(base).includes(normalizeSearchText(code))) pieces.push(`${codeLabel} ${code}`);
  if (sku && !normalizeSearchText(pieces.join(" ")).includes(normalizeSearchText(sku))) pieces.push(sku);
  return compactText(uniqueParts(pieces).join(" "), max);
}

export function productSearchTitle(product, categories = [], max = 74) {
  const name = productSearchName(product, categories, 116);
  const suffix = " | Frenciniz";
  return `${compactText(name, Math.max(24, max - suffix.length))}${suffix}`;
}

export function productSearchDescription(product, categories = [], max = 165) {
  const name = productSearchName(product, categories, 120);
  const vehicles = productVehicleSignals(product).join(", ");
  const code = productPrimaryCode(product);
  const stock = Number(product?.stock || 0);
  const pieces = [
    `${name} icin stok, fiyat ve uyumluluk teyidi.`,
    vehicles ? `Uygunluk adaylari: ${vehicles}.` : "",
    code ? `OEM/SKU: ${code}.` : "",
    stock > 0 ? "Stokta urun, hizli kargo ve WhatsApp teklif." : "Stok ve fiyat icin WhatsApp teklif alin.",
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
