const CATEGORY_TITLE_BASES = {
  "fren-diski": "Fren Diski",
  "fren-diski-abs-li": "ABS'li Fren Diski",
  "fren-kampanasi": "Fren Kampanası",
  "fren-balatasi": "Fren Balatası",
  "fren-pabucu": "Fren Pabucu",
  percin: "Fren Pabucu Perçini",
  "fren-korugu": "Fren Körüğü",
  "suspansiyon-korugu": "Süspansiyon Körüğü",
  lastik: "Körük Lastiği",
  "fren-circiri": "Fren Cırcırı",
  "otomatik-fren-circiri": "Otomatik Fren Cırcırı",
  "mekanik-fren-circiri": "Mekanik Fren Cırcırı",
  bijon: "Bijon",
  "disk-bijonu-civatasi": "Disk Bijonu",
  "somun-civata": "Bijon Somunu",
  porya: "Porya",
  kece: "Porya Keçesi",
  yay: "Fren Yayı",
  kaliper: "Kaliper",
  "kaliper-tamir-takimi": "Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-wabco": "WABCO Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-elsa": "ELSA Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-maxx22": "MAXX22 Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-frenco": "Frenco Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-pan": "PAN Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-modulx": "ModulX Kaliper Tamir Takımı",
  "kaliper-tamir-takimi-duco": "DUCO Kaliper Tamir Takımı",
  "kaliper-ayar-mekanizmasi": "Kaliper Ayar Mekanizması",
  "kaliper-perno-tamir-takimi": "Kaliper Perno Tamir Takımı",
  "kaliper-kapak-conta": "Kaliper Kapak Conta",
  "kaliper-toz-lastigi": "Kaliper Toz Lastiği",
  "kaliper-kilavuz-pim-takimi": "Kaliper Kılavuz Pim Takımı",
  kizak: "Kaliper Kızak",
  perno: "Perno",
  "abs-sensoru-modulu-kablo": "ABS Sensörü",
  "ebs-modulator": "EBS Modülatör",
  sensor: "Sensör",
  "elektrik-kablosu": "Elektrik Kablosu",
  dingil: "Dingil Parçası",
  "burc-muylu": "Burç Muylu",
};

const GROUP_BY_CAT = {
  "fren-diski": "disk",
  "fren-diski-abs-li": "disk",
  "fren-kampanasi": "kampana",
  "fren-balatasi": "balata",
  "fren-pabucu": "fren-pabuclari",
  percin: "fren-pabuclari",
  "fren-korugu": "fren-korukleri",
  lastik: "fren-korukleri",
  "suspansiyon-korugu": "susp-korugu",
  dingil: "susp-korugu",
  "burc-muylu": "susp-korugu",
  "fren-circiri": "circir",
  "otomatik-fren-circiri": "circir",
  "mekanik-fren-circiri": "circir",
  bijon: "bijon-grup",
  "disk-bijonu-civatasi": "bijon-grup",
  "somun-civata": "bijon-grup",
  porya: "porya-grup",
  kece: "porya-grup",
  yay: "fren-yaylari",
  kaliper: "kaliper-urunleri",
  "kaliper-tamir-takimi": "kaliper-urunleri",
  "kaliper-tamir-takimi-wabco": "kaliper-urunleri",
  "kaliper-tamir-takimi-elsa": "kaliper-urunleri",
  "kaliper-tamir-takimi-maxx22": "kaliper-urunleri",
  "kaliper-tamir-takimi-frenco": "kaliper-urunleri",
  "kaliper-tamir-takimi-pan": "kaliper-urunleri",
  "kaliper-tamir-takimi-modulx": "kaliper-urunleri",
  "kaliper-tamir-takimi-duco": "kaliper-urunleri",
  "kaliper-ayar-mekanizmasi": "kaliper-urunleri",
  "kaliper-perno-tamir-takimi": "kaliper-urunleri",
  "kaliper-kapak-conta": "kaliper-urunleri",
  "kaliper-toz-lastigi": "kaliper-urunleri",
  "kaliper-kilavuz-pim-takimi": "kaliper-urunleri",
  kizak: "kaliper-urunleri",
  perno: "kaliper-urunleri",
  "abs-sensoru-modulu-kablo": "sensor-uzatma",
  "ebs-modulator": "sensor-uzatma",
  sensor: "sensor-uzatma",
  "elektrik-kablosu": "sensor-uzatma",
};

const GENERIC_COMPAT = new Set([
  "ağır vasıta",
  "agir vasita",
  "kamyon",
  "tır",
  "tir",
  "tır / çekici",
  "tir / cekici",
  "otobüs",
  "otobus",
  "dorse",
  "treyler",
  "dorse / treyler",
  "ağır vasıta dorse dingili",
  "agir vasita dorse dingili",
]);

const POLICY_REPLACEMENTS = [
  [/\bjumbo\b/gi, "Büyük Tip"],
];

export function cleanProductText(value, max = Infinity) {
  const text = String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return Number.isFinite(max) ? text.slice(0, max).trim() : text;
}

export function normalizeProductText(value) {
  return cleanProductText(value)
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/İ/g, "I");
}

function compactKey(value) {
  return normalizeProductText(value).replace(/[^A-Z0-9]+/g, "");
}

function uniqParts(values) {
  const seen = new Set();
  const out = [];
  for (const value of values.map((item) => cleanProductText(item)).filter(Boolean)) {
    const key = normalizeProductText(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function titleCaseTr(value) {
  const protectedWords = new Set([
    "ABS", "EBS", "DPS", "MAN", "DAF", "SAF", "BPW", "ROR", "BMC", "WABCO", "PAN",
    "MAXX22", "DUCO", "ELSA", "SMB", "FH12", "FH", "FM", "FL", "TGA", "TGS", "TGX", "TGM", "TGL",
    "NPR", "NQR", "SFK", "DP", "DD", "M22",
  ]);
  return cleanProductText(value)
    .split(" ")
    .map((word) => {
      const plain = word.replace(/[^\p{L}\p{N}]/gu, "");
      const upper = normalizeProductText(plain);
      if (protectedWords.has(upper)) return word.toLocaleUpperCase("tr-TR");
      if (/^\d/.test(word)) return word;
      return word
        .toLocaleLowerCase("tr-TR")
        .replace(/^\p{L}/u, (char) => char.toLocaleUpperCase("tr-TR"));
    })
    .join(" ")
    .replace(/\bAbs\b/g, "ABS")
    .replace(/\bEbs\b/g, "EBS")
    .replace(/\bDps\b/g, "DPS");
}

function productGroup(product) {
  return GROUP_BY_CAT[product?.cat] || product?.group || product?.cat || "";
}

export function productPartTitle(product = {}) {
  const source = sourceText(product);
  const normalized = normalizeProductText(source);
  if (product.cat === "fren-balatasi" && /\bDISK\b/.test(normalized)) return "Disk Fren Balatası";
  if (product.cat === "porya" && /KAPAK|KAPAGI/.test(normalized)) return "Porya Kapağı";
  if (product.cat === "fren-korugu" && /SERVIS/.test(normalized) && !/IMDAT|D\/P|D\/D|\d+\s*\/\s*\d+/.test(normalized)) return "Servis Fren Körüğü";
  if (product.cat === "fren-korugu" && /IMDAT|D\/P|D\/D|\d+\s*\/\s*\d+/.test(normalized)) return "İmdatlı Fren Körüğü";
  return CATEGORY_TITLE_BASES[product.cat] || cleanProductText(product.categoryName || product.frenciniz_kategori || "Ağır Vasıta Fren Parçası");
}

function rawProductName(product = {}) {
  return cleanProductText(
    product.sourceName ||
    product.source_name ||
    product.supplier_name ||
    product.original_name ||
    product.raw_name ||
    product.name ||
    product.title ||
    "",
  );
}

function sourceText(product = {}) {
  return [
    rawProductName(product),
    product.sku,
    product.oem,
    product.categoryName,
    product.frenciniz_kategori,
    ...(Array.isArray(product.compat) ? product.compat : []),
  ].filter(Boolean).join(" ");
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function modelPhraseFromSignals(product = {}, compat = []) {
  const signals = uniqParts([
    ...(Array.isArray(compat) ? compat : []),
    ...(Array.isArray(product.compat) ? product.compat : []),
    rawProductName(product),
    product.oem,
    product.sku,
  ]);
  const source = signals.join(" ");
  const text = normalizeProductText(source);
  const phrases = [];
  const push = (value) => {
    const cleaned = cleanProductText(value);
    if (cleaned) phrases.push(cleaned);
  };

  if (hasAny(text, [/TRAVEGO|TOURISMO|TOURINO|INTOURO|O ?403|O ?404|O ?500|SETRA/])) {
    push("Mercedes Travego Tourismo");
  } else {
    const mercedes = [];
    if (hasAny(text, [/\bAXOR\b/, /MERCEDES-BENZ AXOR/, /MERCEDES AXOR/])) mercedes.push("Axor");
    if (hasAny(text, [/\bACTROS\b/, /MERCEDES-BENZ ACTROS/, /MERCEDES ACTROS/])) mercedes.push("Actros");
    if (hasAny(text, [/\bAROCS\b|\bAROX\b/, /MERCEDES-BENZ AROCS/])) mercedes.push("Arocs");
    if (hasAny(text, [/\bATEGO\b|\bATECO\b/, /MERCEDES-BENZ ATEGO/])) mercedes.push("Atego");
    if (!mercedes.length && hasAny(text, [/MERCEDES|MERCEDES-BENZ|\bMERS\b/])) mercedes.push("Mercedes");
    if (mercedes.length) push(mercedes[0] === "Mercedes" ? "Mercedes" : `Mercedes ${uniqParts(mercedes).join(" ")}`);
  }

  if (hasAny(text, [/MAN FORTUNA|LION'?S|NEOPLAN/])) {
    push("MAN Fortuna Otobüs");
  } else if (hasAny(text, [/\bMAN\b|\bTGA\b|\bTGS\b|\bTGX\b|\bTGM\b|\bTGL\b|8150|8143|8145|8135|8199/])) {
    const models = [];
    if (/\bTGA\b/.test(text)) models.push("TGA");
    if (/\bTGS\b/.test(text)) models.push("TGS");
    if (/\bTGX\b/.test(text)) models.push("TGX");
    if (/\bTGM\b/.test(text)) models.push("TGM");
    if (/\bTGL\b/.test(text)) models.push("TGL");
    push(models.length ? `MAN ${models.join(" ")}` : "MAN");
  }

  if (hasAny(text, [/RENAULT|RENO|RVI|PREMIUM|MAGNUM|KERAX|MIDLUM/])) {
    const models = [];
    if (/PREMIUM/.test(text)) models.push("Premium");
    if (/MAGNUM/.test(text)) models.push("Magnum");
    if (/KERAX/.test(text)) models.push("Kerax");
    if (/MIDLUM/.test(text)) models.push("Midlum");
    if (/\bD SERISI\b|\bD-SERISI\b/.test(text)) models.push("D Serisi");
    push(models.length ? `Renault ${models.join(" ")}` : "Renault");
  }

  if (hasAny(text, [/VOLVO|\bFH\b|\bFH12\b|\bFM\b|\bFL\b/])) {
    const models = [];
    const hasFh12 = /\bFH12\b/.test(text);
    if (hasFh12) models.push("FH12");
    if ((/\bFH\b/.test(text) || /VOLVO/.test(text)) && !hasFh12) models.push("FH");
    if (/\bFM\b/.test(text) || /VOLVO/.test(text)) models.push("FM");
    if (/\bFL\b/.test(text)) models.push("FL");
    push(models.length ? `Volvo ${uniqParts(models).join(" ")}` : "Volvo");
  }

  if (hasAny(text, [/SCANIA|G420|R420|R440/])) push("Scania P G R");
  if (hasAny(text, [/FORD|CARGO|7C46|85DB|13C33|FC46|A333K/])) push("Ford Cargo");
  if (hasAny(text, [/IVECO|EUROCARGO|EUROTECH|STRALIS|TRAKKER/])) {
    const models = [];
    if (/EUROCARGO/.test(text)) models.push("Eurocargo");
    if (/EUROTECH/.test(text)) models.push("Eurotech");
    if (/STRALIS/.test(text)) models.push("Stralis");
    if (/TRAKKER/.test(text)) models.push("Trakker");
    push(models.length ? `Iveco ${models.join(" ")}` : "Iveco");
  }
  if (hasAny(text, [/DAF|\bXF\b|\bCF\b/])) push("DAF CF XF");
  if (hasAny(text, [/ISUZU|NOVO|NOVOCITI|CITILIFE|CITYBUS|NPR|NQR/])) {
    if (/NPR|NQR/.test(text)) push("Isuzu NPR NQR");
    else push("Isuzu NovoCiti");
  }
  if (hasAny(text, [/MITSUBISHI|CANTER|FUSO|MB ?060500/])) push("Mitsubishi Canter Fuso");
  if (hasAny(text, [/BMC|FATIH|PROFESYONEL|PROBUS|DODGE|ASKAM/])) push("BMC");
  if (hasAny(text, [/OTOKAR|DORUK|SULTAN/])) push("Otokar Sultan Doruk");

  if (hasAny(text, [/BPW|\bBP\b|ECOPLUS|03\.?27|0327|3109|3296/])) push("BPW Dorse");
  if (hasAny(text, [/SAF|HOLLAND|10640|407900|054294|343438|SFK/])) push("SAF Dorse");
  if (hasAny(text, [/ROR|MERITOR|GIGANT|2102|2120|2222|MBR/])) push("ROR Meritor");
  if (hasAny(text, [/KRONE/])) push("Krone Dorse");
  if (hasAny(text, [/KOGEL|KÖGEL/])) push("Kögel Dorse");
  if (hasAny(text, [/FRUEHAUF|FRUHAUF|\bSMB\b/])) push("Fruehauf SMB");
  if (hasAny(text, [/YORK|VALX|YTE|OZTREYLER|ÖZTREYLER/])) push("York Valx");
  if (hasAny(text, [/TIRSAN|TIRŞAN/])) push("Tırsan Dorse");
  if (hasAny(text, [/SCHMITZ/])) push("Schmitz Dorse");

  if (hasAny(text, [/KNORR|SB6|SB7|SN6|SN7|SK7|K000/])) push("Knorr");
  if (hasAny(text, [/WABCO|PAN ?(?:17|19|22)|MAXX ?22/])) push("WABCO");
  if (hasAny(text, [/DUCO|ELSA|MCK/])) push("Meritor");
  if (hasAny(text, [/HALDEX|MODULX/])) push("Haldex");

  if (!phrases.length && productGroup(product) === "fren-korukleri") push("Dorse");
  if (!phrases.length && productGroup(product) === "susp-korugu") push("Dorse");
  if (!phrases.length && hasAny(text, [/DORSE|TREYLER|TRAILER/])) push("Dorse");

  return compactPhrase(uniqParts(phrases), product);
}

function compactPhrase(phrases, product) {
  if (!phrases.length) return "";
  const group = productGroup(product);
  if (group === "kaliper-urunleri") {
    const system = phrases.filter((part) => /Knorr|WABCO|Meritor|Haldex/i.test(part)).slice(0, 3).join(" ");
    if (system) return system;
  }
  const primary = phrases.filter((part) => !/Knorr|WABCO|Meritor|Haldex/i.test(part));
  const list = primary.length ? primary : phrases;
  let phrase = "";
  for (const part of list) {
    const next = cleanProductText(`${phrase} ${part}`);
    if (next.length > 48 && phrase) break;
    phrase = next;
    if (phrase.length >= 34) break;
  }
  return phrase || list[0];
}

function detailCandidates(product = {}) {
  const raw = sourceText(product).replace(/[()]/g, " ");
  const normalized = normalizeProductText(raw);
  const group = productGroup(product);
  const details = [];
  const add = (value) => {
    const cleaned = formatDetail(value);
    const key = compactKey(cleaned);
    if (!key) return;
    if (details.some((item) => {
      const existing = compactKey(item);
      return existing === key || existing.includes(key) || key.includes(existing);
    })) return;
    details.push(cleaned);
  };

  for (const match of raw.matchAll(/\b\d{1,3}\s*[xX*]\s*\d{1,3}(?:\s*[xX*]\s*\d{1,3})?\s*MM\b/gi)) {
    if (raw[match.index - 1] === ".") continue;
    add(match[0].replace(/\s*[xX*]\s*/g, "x"));
  }
  for (const match of raw.matchAll(/\b\d{1,2}\s*[\/xX]\s*\d{1,2}\b/g)) {
    const value = match[0];
    if (raw[match.index - 1] === ".") continue;
    const after = raw.slice(match.index + value.length, match.index + value.length + 4);
    if (/[xX]/.test(value) && /\s*MM/i.test(after)) continue;
    if (/[xX]/.test(value) && group !== "fren-korukleri" && group !== "susp-korugu") add(value.replace(/\s*[xX]\s*/g, "x"));
    else add(value.replace(/\s*[xX]\s*/g, "/").replace(/\s*\/\s*/g, "/"));
  }
  for (const match of raw.matchAll(/\b\d{1,3}\s*(?:L[ÜU]K|LİK|LIK)\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\bM\d{1,3}(?:[,.]\d{1,2})?\s*(?:x|\*)\s*\d{1,3}(?:[,.]\d+)?\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\b\d{2,4}(?:[,.]\d{1,2})?\s*MM\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\b\d{1,2}\s*CM\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\b\d+\s*DEL[İI]K\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\b\d+\s*KANAL\b/gi)) add(match[0]);
  for (const match of raw.matchAll(/\b12[-.]153\b/gi)) add(match[0]);
  if (/\bABS'?L?[İI]?\b/.test(normalized)) add("ABS'li");
  if (/GOBEKLI|GÖBEKLI|GÖBEKLI|GOBEKLİ/.test(normalized)) add("Göbekli");
  if (/MACASIZ|MAÇASIZ/.test(normalized)) add("Maçasız");
  if (/\bDOLU\b/.test(normalized)) add("Dolu");
  if (/DAKROMAT/.test(normalized)) add("Dakromatlı");
  if (/\bDPS\b/.test(normalized)) add("DPS");
  if (/\bOZEL\b/.test(normalized)) add("Özel");
  if (/\bKISA\b/.test(normalized)) add("Kısa");
  if (/\bUZUN\b/.test(normalized)) add("Uzun");
  if (/\bSERVIS\b/.test(normalized)) add("Servis");
  if (/\bIMDAT|D\/P|D\/D/.test(normalized)) add("İmdatlı");
  if (/DISK TIPI|D\/P|D\/D/.test(normalized)) add("Disk Tipi");
  if (/KAMPANA TIPI/.test(normalized)) add("Kampana Tipi");
  if (/\bMAKARA/.test(normalized)) add("Makarası");
  if (/(^|[^A-Z])SAG([^A-Z]|$)/.test(normalized)) add("Sağ");
  if (/(^|[^A-Z])SOL([^A-Z]|$)/.test(normalized)) add("Sol");
  if (/(^|[^A-Z])ON([^A-Z]|$)/.test(normalized)) add("Ön");
  if (/(^|[^A-Z])ARKA([^A-Z]|$)/.test(normalized)) add("Arka");
  if (/\bR-?L\b/.test(normalized)) add("R-L");
  if (/\bY\.?M\.?\b/.test(normalized)) add("Y.M.");
  if (/\bE\.?M\.?\b/.test(normalized)) add("E.M.");

  if (["disk", "kampana", "balata", "bijon-grup"].includes(group)) {
    const cap = raw.match(/\b(\d{3,4})\s*(?:ÇAP|CAP)\b/i);
    if (cap) add(`${cap[1]} Çap`);
  }

  return details;
}

function formatDetail(value) {
  return titleCaseTr(value)
    .replace(/(M\d+(?:[,.]\d+)?)X/gi, "$1x")
    .replace(/Mm\b/g, "mm")
    .replace(/Cm\b/g, "cm")
    .replace(/\bM(\d+)/g, "M$1")
    .replace(/\bAbs'li\b/g, "ABS'li")
    .replace(/\bDps\b/g, "DPS")
    .replace(/\bR-l\b/gi, "R-L")
    .replace(/\bD\/p\b/gi, "D/P")
    .replace(/\bD\/d\b/gi, "D/D")
    .replace(/\bY\.m\.\b/gi, "Y.M.")
    .replace(/\bE\.m\.\b/gi, "E.M.");
}

function removeDuplicateDetailWords(title, details) {
  const titleKey = compactKey(title);
  return details.filter((detail) => {
    const key = compactKey(detail);
    return key && !titleKey.includes(key);
  });
}

function trimTitle(title, max) {
  const cleaned = cleanProductText(title);
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max).replace(/\s+\S*$/, "").trim() || cleaned.slice(0, max).trim();
}

function sanitizePolicyText(value) {
  let text = String(value || "");
  for (const [pattern, replacement] of POLICY_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

export function buildSeoProductTitle(product = {}, compat = product.compat || [], options = {}) {
  const max = Math.max(40, Number(options.max) || 100);
  const marketplace = options.marketplace !== false;
  const vehicle = modelPhraseFromSignals(product, compat);
  const part = productPartTitle(product);
  const details = detailCandidates(product);
  const group = productGroup(product);
  const sizeDetail = details.find((detail) => /\d+\s*[\/xX]\s*\d+|\d+\s*(?:Lük|Lik|Lık|LİK|LÜK)/i.test(detail));
  const rest = removeDuplicateDetailWords(`${vehicle} ${part} ${sizeDetail || ""}`, details.filter((detail) => detail !== sizeDetail));

  let pieces;
  if (group === "fren-korukleri" && sizeDetail) {
    pieces = [vehicle, sizeDetail, part, ...rest.slice(0, 3)];
  } else if (group === "susp-korugu" && sizeDetail) {
    pieces = [vehicle, sizeDetail, part, ...rest.slice(0, 3)];
  } else {
    pieces = [vehicle, part, sizeDetail, ...rest.slice(0, 3)];
  }

  let title = cleanProductText(uniqParts(pieces).join(" "));
  if (!vehicle && !sizeDetail && rest.length === 0) {
    const source = rawProductName(product);
    const sourceWithoutCodes = source
      .replace(/\b(?:ES[A-Z]|ARF|BK|EYD|EBD|FT|MCK)\s*[\w./-]+\b/gi, "")
      .replace(/\b\d{5,}\b/g, "")
      .trim();
    title = cleanProductText(`${part} ${sourceWithoutCodes}`) || title;
  }

  if (!title || compactKey(title) === compactKey(part)) {
    const sku = cleanProductText(product.sku || product.stockCode || product.id);
    title = cleanProductText(`${vehicle || "Ağır Vasıta"} ${part} ${sku}`);
  }

  title = titleCaseTr(title)
    .replace(/\bMm\b/g, "mm")
    .replace(/\bCm\b/g, "cm")
    .replace(/\bSmb\b/g, "SMB")
    .replace(/\bAbs'li\b/g, "ABS'li")
    .replace(/\bDps\b/g, "DPS")
    .replace(/E\.m\./gi, "E.M.")
    .replace(/Y\.m\./gi, "Y.M.");
  if (marketplace) title = sanitizePolicyText(title);
  return trimTitle(title, max);
}

export function buildSeoProductDescription(product = {}, compat = product.compat || [], options = {}) {
  const marketplace = options.marketplace !== false;
  const title = cleanProductText(options.title || product.name || buildSeoProductTitle(product, compat, options), 180);
  const part = productPartTitle(product);
  const sku = cleanProductText(product.sku || product.stockCode || "");
  const oem = cleanProductText(product.oem || product.oemNumber || "");
  const rawName = rawProductName(product);
  const compatible = uniqParts([
    ...(Array.isArray(compat) ? compat : []),
    ...(Array.isArray(product.compat) ? product.compat : []),
  ]).filter((value) => !GENERIC_COMPAT.has(value.toLocaleLowerCase("tr-TR")) || /dorse|treyler/i.test(value));
  const modelLine = compatible.length
    ? `Uyumlu araçlar / sistemler: ${compatible.slice(0, 16).join(", ")}.`
    : "Uyumluluk: Ağır vasıta araç grubu için OEM, şase ve ölçü kontrolü önerilir.";
  const originalLine = rawName && compactKey(rawName) !== compactKey(title)
    ? `Tedarikçi ürün adı: ${rawName}.`
    : "";
  const lines = [
    `${title} ağır vasıta ${part.toLocaleLowerCase("tr-TR")} ürünüdür.`,
    sku ? `Stok kodu: ${sku}.` : "",
    oem ? `OEM / muadil numarası: ${oem}.` : "OEM / muadil numarası: Tedarikçi kaydında net OEM yok; stok kodu, şase veya eski parça numarasıyla teyit önerilir.",
    modelLine,
    originalLine,
    "Kesin uyumluluk araç şasesi, model yılı, aks tipi, ölçü ve mevcut parça numarasına göre değişebilir; sipariş öncesi OEM numarası veya eski parça fotoğrafı ile Frenciniz'den teyit alın.",
  ].filter(Boolean);

  let description = lines.join("\n");
  if (marketplace) description = sanitizePolicyText(description);
  const max = Number(options.max) || 30000;
  return String(description || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max)
    .trim();
}

export function buildSeoProductContent(product = {}, compat = product.compat || [], options = {}) {
  const title = buildSeoProductTitle(product, compat, options);
  return {
    title,
    description: buildSeoProductDescription(product, compat, { ...options, title }),
  };
}
