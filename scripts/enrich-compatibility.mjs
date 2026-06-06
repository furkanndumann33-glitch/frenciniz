import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "public", "data", "products.json");
const CATEGORIES_PATH = path.join(ROOT, "public", "data", "categories.json");
const REPORT_PATH = path.join(ROOT, "pricing-research", "compatibility-enrichment-report.json");

const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
const catById = Object.fromEntries(categories.map((category) => [category.id, category]));

const PRIORITY_GROUPS = new Set(["disk", "kampana", "balata", "susp-korugu"]);
const REFERENCE_SOURCES = [
  {
    title: "CEI 5010598308 brake disc",
    url: "https://www.cei.it/parts/products-details/brake-discs/renault/5010598308.html",
    usedFor: "Renault Midlum / Volvo FL brake disc cross reference",
  },
  {
    title: "BAS Parts 5010598308 brake disc",
    url: "https://www.basparts.com/en/new/dt-spare-parts-brake-disc-BP0741947",
    usedFor: "Renault Midlum and Volvo FL application check",
  },
  {
    title: "DFT 81436010163 air bellow",
    url: "https://dftautoparts.com/product/air-bellow/",
    usedFor: "MAN TGA/TGS/TGX air spring reference",
  },
  {
    title: "Can Brake 81436010162 air spring",
    url: "https://www.canbrake.com/en/products-5/air-spring-1861",
    usedFor: "MAN air spring reference",
  },
  {
    title: "Autokseft 0003270101 OE cross reference",
    url: "https://www.autokseft.cz/OE-cislo/0003270101/SETRA-2488",
    usedFor: "Mercedes-Benz, Setra and cross reference air spring OE numbers",
  },
  {
    title: "Tirshop WVA29279 brake pads",
    url: "https://www.tirshop.ro/en/product/24277/front-and-rear-brake-pads-man-tga-tgs-tgx-wva29279-pd-214.html",
    usedFor: "MAN TGA/TGS/TGX WVA 29279 brake pad reference",
  },
  {
    title: "AIB Original WVA 29165 brake pad",
    url: "https://www.aiboriginal.com/02-031-21-50-0-05-092-90-10-0-wva-29165-brake-pad/",
    usedFor: "BPW WVA 29165 / 29215 / 29306 brake pad reference",
  },
  {
    title: "Victor Truck brake drum catalogue",
    url: "https://www.victortruck.com/upload/2018100909170679.pdf",
    usedFor: "SAF 1064010801 brake drum reference",
  },
];

const CATEGORY_LABELS = {
  "fren-diski": "fren diski",
  "fren-diski-abs-li": "ABS'li fren diski",
  "fren-kampanasi": "fren kampanası",
  "fren-balatasi": "fren balatası",
  "suspansiyon-korugu": "süspansiyon körüğü",
  "burc-muylu": "burç / muylu",
  dingil: "dingil parçası",
  "fren-korugu": "fren körüğü",
  lastik: "körük lastiği",
  "fren-pabucu": "fren pabucu",
  percin: "perçin",
  yay: "fren yayı",
  kaliper: "kaliper parçası",
  "kaliper-tamir-takimi": "kaliper tamir takımı",
  "kaliper-ayar-mekanizmasi": "kaliper ayar mekanizması",
  "abs-sensoru-modulu-kablo": "ABS sensörü / modül kablosu",
  "ebs-modulator": "EBS modülatör",
  sensor: "sensör",
  bijon: "bijon",
  "disk-bijonu-civatasi": "disk bijonu / civatası",
  porya: "porya parçası",
};

const MODEL_RULES = [
  {
    key: "mercedes-axor",
    regex: /\bAXOR\b|AXOR-ACTROS/i,
    compat: ["Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140"],
  },
  {
    key: "mercedes-actros",
    regex: /\bACTROS\b|AXOR-ACTROS/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140"],
  },
  {
    key: "mercedes-arocs",
    regex: /\bAROCS\b|\bAROX\b/i,
    compat: ["Mercedes-Benz Arocs"],
  },
  {
    key: "mercedes-atego",
    regex: /\bATEGO\b|\bATECO\b|975421|675421/i,
    compat: ["Mercedes-Benz Atego"],
  },
  {
    key: "mercedes-bus",
    regex: /MERCEDES.*(OTOB|BUS|V-8)|0302|0303|0304|0305|0307|0309/i,
    compat: ["Mercedes-Benz O302/O303/O304/O305/O307/O309 otobüs", "Mercedes-Benz V6/V8 otobüs"],
  },
  {
    key: "man-tg",
    regex: /\bMAN\b|\bTGA\b|\bTGS\b|\bTGX\b|\bTGM\b|815080|8150\.?803/i,
    compat: ["MAN TGA", "MAN TGS", "MAN TGX", "MAN TGM", "MAN TGS/TGX 40.360", "MAN TGS/TGX 40.460"],
  },
  {
    key: "scania",
    regex: /\bSCANIA\b|\bSCAN\b|\bG420\b|\bR420\b|\bR440\b/i,
    compat: ["Scania P/G/R serisi", "Scania G420", "Scania R420/R440"],
  },
  {
    key: "volvo-fh-fm",
    regex: /\bVOLVO\b|\bFH\b|\bFH12\b|\bFM\b/i,
    compat: ["Volvo FH", "Volvo FH12", "Volvo FM", "Volvo FL II/FL III"],
  },
  {
    key: "renault",
    regex: /\bRENAULT\b|\bPREMIUM\b|\bMAGNUM\b|\bKERAX\b|\bMIDLUM\b/i,
    compat: ["Renault Trucks Premium", "Renault Trucks Magnum", "Renault Trucks Kerax", "Renault Trucks Midlum"],
  },
  {
    key: "ford-cargo",
    regex: /\bFORD\b|\bCARGO\b|9C46|DC46/i,
    compat: ["Ford Cargo", "Ford Cargo 1833", "Ford Cargo 1846", "Ford Cargo 2532", "Ford Cargo 3232"],
  },
  {
    key: "daf",
    regex: /\bDAF\b|\bXF\b|\bCF\b/i,
    compat: ["DAF XF", "DAF CF"],
  },
  {
    key: "iveco",
    regex: /\bIVECO\b|\bVECO\b|\bEUROCARGO\b|\bSTRALIS\b|\bTRAKKER\b/i,
    compat: ["Iveco Eurocargo", "Iveco Stralis", "Iveco Trakker"],
  },
  {
    key: "isuzu",
    regex: /\bISUZU\b|\bNOVO\b|\bNOVOCITI\b|\bCITILIFE\b|\bCITYBUS\b|387\.?061/i,
    compat: ["Isuzu Novo", "Isuzu NovoCiti Life", "Isuzu CitiLife", "Isuzu Citybus"],
  },
  {
    key: "bmc",
    regex: /\bBMC\b|57RS/i,
    compat: ["BMC Probus", "BMC Profesyonel", "BMC kamyon / otobüs"],
  },
  {
    key: "mitsubishi",
    regex: /\bMITSUBISHI\b|\bNPR\b|\bNQR\b|MB ?060500/i,
    compat: ["Mitsubishi Canter", "Mitsubishi Fuso", "Isuzu NPR/NQR"],
  },
  {
    key: "otokar",
    regex: /\bOTOKAR\b|\bDORUK\b|\bSULTAN\b/i,
    compat: ["Otokar Doruk", "Otokar Sultan"],
  },
  {
    key: "karsan",
    regex: /\bKARSAN\b|\bATAK\b/i,
    compat: ["Karsan Atak"],
  },
  {
    key: "bpw",
    regex: /\bBPW\b/i,
    compat: ["BPW dorse dingili", "BPW treyler"],
  },
  {
    key: "saf",
    regex: /\bSAF\b/i,
    compat: ["SAF dorse dingili", "SAF Holland treyler"],
  },
  {
    key: "ror",
    regex: /\bROR\b|\bMERITOR\b/i,
    compat: ["ROR dorse dingili", "Meritor/ROR treyler"],
  },
  {
    key: "krone",
    regex: /\bKRONE\b/i,
    compat: ["Krone dorse", "Krone treyler"],
  },
  {
    key: "tirsan",
    regex: /\bTIRSAN\b|\bTIRŞAN\b/i,
    compat: ["Tırsan dorse", "Tırsan treyler"],
  },
  {
    key: "schmitz",
    regex: /\bSCHMITZ\b|\bSCHMITZ CARGOBULL\b/i,
    compat: ["Schmitz Cargobull dorse"],
  },
  {
    key: "trailer-general",
    regex: /\bDORSE\b|\bTREYLER\b|\bVALX\b|\bYTE\b|\bÖZTREYLER\b|\bOZTREYLER\b|\bFRUEHAUF\b|\bSMB\b|\bSERTEL\b|\bJUMBO\b/i,
    compat: ["Dorse / treyler", "Ağır vasıta dorse dingili"],
  },
];

const OEM_RULES = [
  {
    regex: /20763234|5010598309/i,
    compat: ["Volvo FL II/FL III", "Renault Trucks Midlum", "Renault Trucks D serisi"],
    note: "OEM 20763234 / 5010598309 referansı Volvo FL II/III ve Renault Midlum/D serisi fren diski kataloglarında geçer.",
  },
  {
    regex: /81508030027|81508030057|81508030020/i,
    compat: ["MAN TGM", "MAN TGS", "MAN TGX"],
    note: "OEM 81508030027 / 81508030057 / 81508030020 referansı MAN TGM/TGS/TGX fren diski kataloglarında geçer.",
  },
  {
    regex: /387\.?061\.?2600\.?51|387061260/i,
    compat: ["Isuzu NovoCiti Life", "Isuzu Novo"],
    note: "OEM 387.061.2600.51 referansı Isuzu NovoCiti Life fren diski olarak kataloglarda geçer.",
  },
  {
    regex: /3014210801/i,
    compat: ["Mercedes-Benz Actros/Axor serisi"],
    note: "OEM 3014210801 Mercedes-Benz fren kampanası referansı olarak kullanılır.",
  },
  {
    regex: /20700508|5010598308|20931249/i,
    compat: ["Renault Trucks Midlum", "Volvo FL II/FL III"],
    note: "OEM 20700508 / 5010598308 / 20931249 referansı Renault Midlum ve Volvo FL fren diski kataloglarında geçer.",
  },
  {
    regex: /0003270101|0003270201|3073270101|1134445/i,
    compat: ["Mercedes-Benz O300/O400/O500 otobüs", "Setra S200/S300/S400/S500"],
    note: "OEM 0003270101 / 0003270201 / 3073270101 referansı Mercedes-Benz ve Setra otobüs süspansiyon körüğü kataloglarında geçer.",
  },
  {
    regex: /3873280101|81436010033|1629193|0220024100|51436010039/i,
    compat: ["MAN kamyon/otobüs", "Mercedes-Benz kamyon/otobüs", "Volvo kamyon/otobüs", "BPW dorse dingili"],
    note: "OEM 3873280101 / 81436010033 / 1629193 / 0220024100 referansı MAN, Mercedes-Benz, Volvo ve BPW roll körük kataloglarında geçer.",
  },
  {
    regex: /81436010163|81436010162/i,
    compat: ["MAN TGA", "MAN TGS", "MAN TGX"],
    note: "OEM 81436010163 / 81436010162 referansı MAN TGA/TGS/TGX air spring kataloglarında geçer.",
  },
  {
    regex: /\b29279\b|81508206065|81508205112|6403229332/i,
    compat: ["MAN TGA", "MAN TGS", "MAN TGX"],
    note: "WVA 29279 ve OEM 81508206065 / 81508205112 referansları MAN TGA/TGS/TGX fren balatası kataloglarında geçer.",
  },
  {
    regex: /\b29088\b|5010848607|5001866951|81508205023|81508206042/i,
    compat: ["DAF LF45/LF55", "Iveco Eurocargo", "MAN L2000/M2000", "Renault Trucks Midlum"],
    note: "WVA 29088 ve OEM 5010848607 / 81508206042 referansları DAF LF, Iveco Eurocargo, MAN L/M 2000 ve Renault Midlum balata kataloglarında geçer.",
  },
  {
    regex: /\b29125\b|\b29277\b|2201903828698027/i,
    compat: ["Volvo FH", "Volvo FH12/FH16", "Volvo FM", "Volvo FL6", "Volvo B9/B12"],
    note: "WVA 29125 / 29277 referansları Volvo FH/FM/FL ve Volvo otobüs fren balatası kataloglarında geçer.",
  },
  {
    regex: /\b29141\b|\b29142\b|\b29119\b|5001855902/i,
    compat: ["Renault Trucks Midlum"],
    note: "WVA 29141 / 29142 / 29119 ve OEM 5001855902 referansları Renault Midlum fren balatası kataloglarında geçer.",
  },
  {
    regex: /\b29165\b|\b29215\b|\b29268\b|\b29306\b/i,
    compat: ["BPW dorse dingili", "BPW treyler"],
    note: "WVA 29165 / 29215 / 29268 referansları BPW dorse ve treyler fren balatası kataloglarında geçer.",
  },
  {
    regex: /310977340/i,
    compat: ["BPW dorse dingili", "BPW treyler"],
    note: "OEM 310977340 BPW fren kampanası referansı olarak listelenir.",
  },
  {
    regex: /1064010801|1064012801/i,
    compat: ["SAF dorse dingili", "SAF Holland treyler"],
    note: "OEM 1064010801 / 1064012801 SAF fren kampanası referansı olarak listelenir.",
  },
  {
    regex: /786450|786115/i,
    compat: ["York dorse dingili", "Otoyol / York treyler"],
    note: "OEM 786450 / 786115 York dorse fren kampanası referansı olarak listelenir.",
  },
];

const GENERIC_BY_GROUP = {
  disk: ["Kamyon", "Tır / çekici", "Otobüs", "Dorse"],
  kampana: ["Kamyon", "Tır / çekici", "Otobüs", "Dorse"],
  balata: ["Kamyon", "Tır / çekici", "Otobüs", "Dorse"],
  "susp-korugu": ["Dorse", "Treyler", "Kamyon", "Tır / çekici"],
  "fren-korukleri": ["Kamyon", "Tır / çekici", "Dorse", "Otobüs"],
  "fren-pabuclari": ["Kamyon", "Tır / çekici", "Dorse", "Otobüs"],
  "fren-yaylari": ["Dorse", "Kamyon", "Otobüs"],
  "kaliper-urunleri": ["Kamyon", "Tır / çekici", "Otobüs", "Dorse"],
  "sensor-uzatma": ["Kamyon", "Tır / çekici", "Otobüs", "Dorse"],
  "bijon-grup": ["Kamyon", "Tır / çekici", "Dorse"],
  "porya-grup": ["Dorse", "Treyler", "Kamyon"],
};
const GENERIC_LABELS = new Set(Object.values(GENERIC_BY_GROUP).flat());

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toUpperCase();
}

function cleanOem(oem) {
  const raw = String(oem || "").trim();
  if (!raw || /^fren\s/i.test(raw)) return "";
  return raw.replace(/\s+/g, " ");
}

function uniq(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function groupId(product) {
  return catById[product.cat]?.parent || product.cat || "";
}

function categoryLabel(product) {
  return CATEGORY_LABELS[product.cat] || (catById[product.cat]?.name || "ağır vasıta fren parçası");
}

function detectCompatibility(product) {
  const text = `${product.name || ""} ${product.sku || ""} ${product.oem || ""}`;
  const normalized = normalize(text);
  const compat = [];
  const notes = [];

  for (const rule of MODEL_RULES) {
    if (rule.regex.test(text) || rule.regex.test(normalized)) {
      compat.push(...rule.compat);
    }
  }

  for (const rule of OEM_RULES) {
    if (rule.regex.test(text) || rule.regex.test(normalized)) {
      compat.push(...rule.compat);
      notes.push(rule.note);
    }
  }

  if (product.compat_source !== "name_oem_rules_v1") {
    compat.push(...(product.compat || []));
  }

  if (compat.length === 0) {
    compat.push(...(GENERIC_BY_GROUP[groupId(product)] || ["Ağır vasıta"]));
  }

  return { compat: uniq(compat).slice(0, 12), notes: uniq(notes) };
}

function makeDescription(product, compat, notes) {
  const group = groupId(product);
  const label = categoryLabel(product);
  const oem = cleanOem(product.oem);
  const modelText = compat.slice(0, 8).join(", ");
  const baseName = String(product.name || "").trim();
  const priority = PRIORITY_GROUPS.has(group);

  const intro = priority
    ? `${baseName} ${label} ürünüdür. OEM ve ürün adı referansına göre ${modelText} araç gruplarında kullanılan ağır vasıta fren parçası olarak listelenmiştir.`
    : `${baseName} ${label} ürünüdür. ${modelText} araç grupları ve ağır vasıta fren sistemleri için uyumluluk kontrolü yapılabilir.`;

  const oemLine = oem ? `OEM / muadil referans: ${oem}.` : "OEM / muadil referans için ürün kodu ve eski parça numarasıyla teyit önerilir.";
  const noteLine = notes.length ? `${notes.join(" ")}` : "";
  const safetyLine = "Uyumluluk model, aks tipi, ölçü, üretim yılı ve şaseye göre değişebilir; kesin sipariş öncesi şase numarası, eski parça fotoğrafı veya OEM numarasıyla Frenciniz'den teyit alın.";

  return [intro, oemLine, noteLine, safetyLine].filter(Boolean).join("\n");
}

const summary = {
  total: products.length,
  changed: 0,
  withDescription: 0,
  withCompatibility: 0,
  specificCompatibility: 0,
  byGroup: {},
  referenceSources: REFERENCE_SOURCES,
  generatedAt: new Date().toISOString(),
};

for (const product of products) {
  const { compat, notes } = detectCompatibility(product);
  const desc = makeDescription(product, compat, notes);
  const group = groupId(product);
  summary.byGroup[group] = summary.byGroup[group] || {
    total: 0,
    changed: 0,
    withDescription: 0,
    withCompatibility: 0,
    specificCompatibility: 0,
  };
  summary.byGroup[group].total += 1;

  const before = JSON.stringify({ desc: product.desc, compat: product.compat });
  product.desc = desc;
  product.compat = compat;
  product.compat_source = "name_oem_rules_v1";
  product.compat_updated_at = summary.generatedAt;
  if (notes.length) product.compat_notes = notes;
  else delete product.compat_notes;

  const isSpecific = compat.some((item) => !GENERIC_LABELS.has(item));
  if (product.desc) {
    summary.withDescription += 1;
    summary.byGroup[group].withDescription += 1;
  }
  if (product.compat?.length) {
    summary.withCompatibility += 1;
    summary.byGroup[group].withCompatibility += 1;
  }
  if (isSpecific) {
    summary.specificCompatibility += 1;
    summary.byGroup[group].specificCompatibility += 1;
  }

  if (JSON.stringify({ desc: product.desc, compat: product.compat }) !== before) {
    summary.changed += 1;
    summary.byGroup[group].changed += 1;
  }
}

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products));
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
