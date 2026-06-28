import fs from "fs";
import path from "path";
import { demandLandingUrl, OEM_DEMAND_GROUPS, matchOemDemandGroup } from "../shared/oem-demand-priority.js";
import { productSearchName, productSeoUrl } from "../shared/product-seo.js";
import { LANDING_PAGES } from "../api/_lib/seo-landing.js";

const SITE = "https://www.frenciniz.com";
const OUT_DIR = path.join(process.cwd(), "pricing-research");
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/categories.json"), "utf8"));

const MONEY_CATS = new Map([
  ["fren-diski", 10],
  ["fren-diski-abs-li", 10],
  ["fren-balatasi", 10],
  ["fren-kampanasi", 9],
  ["disk-bijonu-civatasi", 8],
  ["bijon", 8],
  ["porya", 8],
  ["fren-korugu", 8],
  ["suspansiyon-korugu", 8],
  ["fren-pabucu", 8],
  ["otomatik-fren-circiri", 7],
  ["fren-circiri", 7],
  ["kaliper", 7],
  ["kaliper-tamir-takimi", 7],
]);

const PART_LABELS = [
  { test: /balata/i, label: "fren balatasi" },
  { test: /kampana/i, label: "fren kampanasi" },
  { test: /disk/i, label: "fren diski" },
  { test: /bijon|somun|civata/i, label: "bijon" },
  { test: /porya|rulman/i, label: "porya" },
  { test: /koruk|körük/i, label: "koruk" },
  { test: /circir|cırcır|ayar/i, label: "fren circiri" },
  { test: /kaliper/i, label: "kaliper tamir" },
  { test: /pabuc|pabuç/i, label: "fren pabucu" },
];

const BAD_KEYWORDS = [
  "otomobil",
  "araba",
  "binek",
  "motosiklet",
  "bisiklet",
  "scooter",
  "cikma",
  "çıkma",
  "ikinci el",
  "bedava",
  "ucretsiz",
  "ücretsiz",
  "pdf",
  "katalog pdf",
  "resim",
  "tamiri nasil",
  "nasıl yapılır",
  "sahibinden",
  "letgo",
  "dolap",
  "aliexpress",
  "temu",
  "oyuncak",
  "maket",
];

const TOP100_GROUP_QUOTAS = [
  { group: "disk", quota: 26 },
  { group: "kampana", quota: 14 },
  { group: "balata", quota: 14 },
  { group: "bijon-grup", quota: 12 },
  { group: "porya-grup", quota: 8 },
  { group: "fren-korukleri", quota: 8 },
  { group: "circir", quota: 7 },
  { group: "kaliper-urunleri", quota: 6 },
  { group: "fren-pabuclari", quota: 5 },
];

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function csv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function compact(value, max) {
  const text = clean(value);
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "");
}

function isRealImage(product) {
  const img = String(product?.img || "").toLowerCase();
  return !!img && !img.includes("placehold") && !img.includes("missing-product") && !img.includes("/logo") && !img.includes("logo.");
}

function categoryName(product) {
  return categories.find(c => c.id === product?.cat)?.name || product?.cat || "Fren Aksami";
}

function groupId(product) {
  const sub = categories.find(c => c.id === product?.cat);
  return sub?.parent || product?.cat || "fren-aksami";
}

function partLabel(product) {
  const haystack = `${product?.name || ""} ${product?.cat || ""} ${categoryName(product)}`;
  return PART_LABELS.find(row => row.test.test(haystack))?.label || clean(categoryName(product)).toLowerCase();
}

function firstOem(product) {
  return clean(product?.oem).split(/[,;/|]+|\s+-\s+|-/).map(clean).find(v => v.length >= 4) || "";
}

function usefulCompat(product) {
  return (Array.isArray(product?.compat) ? product.compat : [])
    .map(clean)
    .filter(Boolean)
    .filter(value => !/agir vasita|ağır vasıta/i.test(value))
    .slice(0, 5);
}

function scoreProduct(product) {
  const demandGroup = matchOemDemandGroup(product);
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);
  let score = MONEY_CATS.get(product.cat) || 2;
  if (demandGroup && !demandGroup.addOnOnly) score += 14;
  else if (demandGroup) score += 5;
  if (isRealImage(product)) score += 4;
  if (clean(product.oem)) score += 4;
  if (usefulCompat(product).length) score += 3;
  if (stock > 0) score += 2;
  if (stock >= 20) score += 1;
  if (stock >= 100) score += 1;
  if (price >= 500 && price <= 20000) score += 2;
  if (/mercedes|actros|axor|atego|travego|tourismo|man|tga|tgs|tgx|scania|volvo|daf|ford|bpw|saf|krone|kogel|schmitz/i.test(`${product.name} ${product.desc} ${product.oem}`)) score += 2;
  return score;
}

function salesPriority(product) {
  const demandGroup = matchOemDemandGroup(product);
  if (demandGroup && !demandGroup.addOnOnly) return "sales-priority-1";
  const score = scoreProduct(product);
  if (score >= 18) return "sales-priority-1";
  if (score >= 13) return "sales-priority-2";
  return "sales-priority-3";
}

function productRow(product, rank) {
  const demandGroup = matchOemDemandGroup(product);
  return {
    rank,
    score: scoreProduct(product),
    priority: salesPriority(product),
    id: product.id,
    sku: product.sku || "",
    name: productSearchName(product, categories, 140) || product.name || "",
    category: categoryName(product),
    group: groupId(product),
    part: partLabel(product),
    price: Number(product.price || 0).toFixed(2),
    stock: Math.floor(Number(product.stock || 0)),
    oem: product.oem || "",
    compat: usefulCompat(product).join(" | "),
    image: isRealImage(product) ? "yes" : "no",
    demand_group: demandGroup ? demandGroup.slug : "",
    demand_rank: demandGroup ? demandGroup.rank : "",
    url: productSeoUrl(SITE, product),
  };
}

function writeCsv(file, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const content = [headers.map(csv).join(","), ...rows.map(row => headers.map(h => csv(row[h])).join(","))].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, file), content, "utf8");
}

function uniq(values) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

const ranked = products
  .filter(p => Number(p.stock || 0) > 0 && p.id && p.name && p.price != null)
  .sort((a, b) => scoreProduct(b) - scoreProduct(a) || Number(b.stock || 0) - Number(a.stock || 0));

const picked = [];
const pickedIds = new Set();
for (const product of ranked.filter(p => matchOemDemandGroup(p)).sort((a, b) => {
  const ga = matchOemDemandGroup(a);
  const gb = matchOemDemandGroup(b);
  return Number(ga?.rank || 999) - Number(gb?.rank || 999) || Number(b.stock || 0) - Number(a.stock || 0);
})) {
  if (pickedIds.has(product.id)) continue;
  picked.push(product);
  pickedIds.add(product.id);
}
for (const { group, quota } of TOP100_GROUP_QUOTAS) {
  for (const product of ranked.filter(p => groupId(p) === group)) {
    if (pickedIds.has(product.id)) continue;
    picked.push(product);
    pickedIds.add(product.id);
    if (picked.filter(p => groupId(p) === group).length >= quota) break;
  }
}
for (const product of ranked) {
  if (picked.length >= 100) break;
  if (pickedIds.has(product.id)) continue;
  picked.push(product);
  pickedIds.add(product.id);
}
const top100 = picked.slice(0, 100).map((product, index) => productRow(product, index + 1));
writeCsv("sales-machine-top100-products.csv", top100);

const priorityLandingPages = [...LANDING_PAGES]
  .filter(page => Number(page.priority || 0) >= 0.78)
  .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
  .slice(0, 80);

const searchConsoleRows = [
  ...priorityLandingPages.map((page, index) => ({
    priority: index + 1,
    type: "landing",
    url: `${SITE}/${page.slug}`,
    reason: `${page.heading} | priority ${page.priority}`,
  })),
  ...top100.slice(0, 100).map((row, index) => ({
    priority: priorityLandingPages.length + index + 1,
    type: "product",
    url: row.url,
    reason: `${row.name} | ${row.sku} | ${row.priority}`,
  })),
];
writeCsv("search-console-indexing-priority.csv", searchConsoleRows);

const keywordRows = [];
const campaign = "FRN-Search-HighIntent-OEM-Lead";
const usedKeywords = new Set();
for (const row of top100) {
  const product = products.find(p => String(p.id) === String(row.id));
  const demandGroup = matchOemDemandGroup(product);
  const part = row.part;
  const oem = firstOem(product);
  const compat = usefulCompat(product);
  const baseTerms = [
    ...(demandGroup?.adKeywords || []),
    ...compat.map(model => `${model} ${part}`),
    oem ? `${oem} ${part}` : "",
    product?.sku ? `${product.sku} ${part}` : "",
    row.name,
  ];
  for (const keyword of uniq(baseTerms).slice(0, 4)) {
    const key = keyword.toLowerCase();
    if (usedKeywords.has(key) || keyword.length < 6 || keyword.length > 80) continue;
    usedKeywords.add(key);
    keywordRows.push({
      campaign,
      ad_group: compact(`${compat[0] || row.group} ${part}`, 45),
      keyword,
      match_type: "Exact",
      final_url: demandGroup && !demandGroup.addOnOnly ? demandLandingUrl(SITE, demandGroup) : row.url,
      max_cpc_try: "6.00",
      priority: row.priority,
    });
    if (keywordRows.length >= 260) break;
  }
  if (keywordRows.length >= 260) break;
}
writeCsv("google-ads-high-intent-keywords.csv", keywordRows);

const ads = [
  ...OEM_DEMAND_GROUPS.filter(group => !group.addOnOnly).slice(0, 8).map(group => ({
    campaign,
    ad_group: compact(group.heading, 45),
    final_url: demandLandingUrl(SITE, group),
    headline_1: compact(group.heading, 30),
    headline_2: "OEM Koduyla Teyit",
    headline_3: "WhatsApp Fiyat Al",
    headline_4: "Stok ve Uyum Kontrol",
    headline_5: "Frenciniz Fren Parcasi",
    description_1: `${group.heading} icin OEM/WVA kodu, sase veya eski parca fotografi ile stok ve uyumluluk teyidi alin.`,
    description_2: "Yanlis parca riskini azaltin. WhatsApp'tan hizli teklif, ayni gun kargo ve taksit secenekleri.",
  })),
  {
    campaign,
    ad_group: "Mercedes Axor Actros",
    final_url: `${SITE}/mercedes-actros-axor-fren-diski`,
    headline_1: "Axor Actros Fren Parcasi",
    headline_2: "OEM Sase Ile Teyit",
    headline_3: "WhatsApp Hemen Fiyat Al",
    headline_4: "Fren Diski Balata Kampana",
    headline_5: "Frenciniz Stoklu Urunler",
    description_1: "Mercedes Axor Actros fren diski, balata, kampana ve bijon icin OEM kodu veya sase ile hizli teklif alin.",
    description_2: "Yanlis parca riskini azaltin. Eski parca fotografini WhatsApp'a gonderin, stok ve uyum teyidi alalim.",
  },
  {
    campaign,
    ad_group: "Otobus Travego Tourismo",
    final_url: `${SITE}/tourismo-fren-diski`,
    headline_1: "Travego Tourismo Fren",
    headline_2: "Otobus Fren Parcasi",
    headline_3: "Kod Gonder Fiyat Al",
    headline_4: "Ayni Gun Kargo",
    headline_5: "Frenciniz WhatsApp Teklif",
    description_1: "Travego, Tourismo ve otobus fren diski, balata, koruk urunlerinde stok ve uyumluluk teyidi.",
    description_2: "OEM kodu, sase veya eski parca fotografi ile dogru urunu hizli bulalim.",
  },
  {
    campaign,
    ad_group: "Dorse BPW SAF Krone",
    final_url: `${SITE}/bpw-dorse-fren-kampanasi`,
    headline_1: "BPW SAF Krone Dorse Fren",
    headline_2: "Bijon Kampana Porya",
    headline_3: "OEM Ile Uyum Teyidi",
    headline_4: "Dorse Fren Stoklari",
    headline_5: "WhatsApp Hizli Teklif",
    description_1: "BPW, SAF, Krone, Kogel ve Schmitz dorse fren kampanasi, disk, bijon, porya urunleri.",
    description_2: "Parca kodunu veya eski parca fotosunu gonderin; stok, fiyat ve uyumlulugu teyit edelim.",
  },
];
writeCsv("google-ads-high-intent-ads.csv", ads);

writeCsv("google-ads-negative-keywords.csv", BAD_KEYWORDS.map(keyword => ({ campaign, keyword, match_type: "Phrase" })));

const groupCounts = top100.reduce((acc, row) => {
  acc[row.group] = (acc[row.group] || 0) + 1;
  acc[row.priority] = (acc[row.priority] || 0) + 1;
  return acc;
}, {});
const metaSets = [
  { set_name: "OEM Talep Ilk 13", rule: "custom_label_4 equals sales-priority-1 AND title contains OEM/WVA demand codes", product_count_top100: top100.filter(row => row.demand_group && !/21022167|31796200/.test(row.demand_group)).length, use: "Google Merchant ve Meta katalogda en once test edilecek urunler" },
  { set_name: "Satis Onceligi 1", rule: "custom_label_4 equals sales-priority-1", product_count_top100: groupCounts["sales-priority-1"] || 0, use: "Remarketing ve katalog reklaminda ilk secilecek set" },
  { set_name: "Disk Balata Kampana", rule: "custom_label_0 in disk,balata,kampana", product_count_top100: (groupCounts["disk"] || 0) + (groupCounts["balata"] || 0) + (groupCounts["kampana"] || 0), use: "Google/Meta en yuksek niyetli fren grubu" },
  { set_name: "Dorse Fren Grubu", rule: "title/description contains BPW, SAF, Krone, Kogel, Schmitz", product_count_top100: top100.filter(row => /bpw|saf|krone|kogel|schmitz/i.test(`${row.name} ${row.compat} ${row.oem}`)).length, use: "Dorse ve treyler hedefli reklamlar" },
  { set_name: "Bijon Porya", rule: "custom_label_0 in bijon-grup,porya-grup", product_count_top100: (groupCounts["bijon-grup"] || 0) + (groupCounts["porya-grup"] || 0), use: "Dusuk karar sureli parca aramalari" },
];
writeCsv("meta-product-sets.csv", metaSets);

const quickReplies = [
  ["/kod", "Kod iste", "Merhaba, dogru parcayi bulmam icin eski parca uzerindeki OEM/parca kodunu veya urun fotografini gonderebilir misiniz?"],
  ["/sase", "Sase iste", "Aracin marka-modeli ve mumkunse sase numarasini gonderirseniz uyumlulugu daha net teyit edebilirim."],
  ["/foto", "Foto iste", "Eski parcanin on/arka fotografini ve uzerindeki kodlari gonderin; stok ve fiyat bilgisini hemen kontrol edelim."],
  ["/fiyat", "Fiyat kontrol", "Fiyat ve stok bilgisini kontrol ediyorum. OEM/SKU veya arac modelini netlestirirsek yanlis parca riskini azaltiriz."],
  ["/stok", "Stok var", "Urun stokta gorunuyor. Siparis oncesi OEM/sase teyidini yapip kargo bilgisini paylasalim."],
  ["/kargo", "Kargo", "14:00'a kadar netlesen stoklu siparislerde ayni gun kargo icin hazirlik yapiyoruz. 3000 TL uzeri standart kargo ucretsizdir."],
  ["/iade", "Iade guven", "Uyumluluk teyidiyle ilerliyoruz. Buna ragmen sorun olursa 14 gun iade destegimiz var."],
  ["/odeme", "Odeme", "Kredi karti, taksit ve havale/EFT secenekleriyle ilerleyebiliriz. Net tutari stok/uyum teyidinden sonra paylasiyorum."],
  ["/dorse", "Dorse", "BPW, SAF, Krone, Kogel, Schmitz ve Tirsan dorse fren parcalari icin OEM kodu veya eski parca fotografi gonderebilirsiniz."],
  ["/otobus", "Otobus", "Travego, Tourismo, O403, O500 ve Fortuna otobus fren parcalari icin model, yil ve parca kodu ile teyit yapalim."],
];
writeCsv("whatsapp-business-quick-replies.csv", quickReplies.map(([shortcut, title, message]) => ({ shortcut, title, message })));

const socialPost = `# Frenciniz organik sosyal medya postlari

## Post 1 - Genel
Agir vasita fren parcasinda yanlis parca riski almayin.

Fren diski, kampana, balata, bijon, porya, fren circiri, kaliper, ABS/EBS ve koruk gruplarinda OEM kodu, sase veya eski parca fotografiyla hizli uyumluluk teyidi yapiyoruz.

WhatsApp: 0850 888 7881
Site: https://www.frenciniz.com/

## Post 2 - Mercedes
Mercedes Axor, Actros, Atego, Travego ve Tourismo fren parcasi arayanlar:

Fren diski, balata, kampana, bijon ve koruk icin OEM/parca kodunu gonderin; stok, fiyat ve uyumlulugu teyit edelim.

https://www.frenciniz.com/mercedes-actros-axor-fren-diski

## Post 3 - Dorse
BPW, SAF, Krone, Kogel, Schmitz ve Tirsan dorse fren grubu:

Kampana, disk, bijon, porya, ABS/EBS ve suspansiyon korugu icin eski parca kodu/fotografiyla hizli teklif alin.

https://www.frenciniz.com/bpw-dorse-fren-kampanasi

## Story metni
OEM kodunu gonder, dogru fren parcasini bulalim.
Fren diski | Balata | Kampana | Bijon | Porya | Koruk
WhatsApp: 0850 888 7881
`;
fs.writeFileSync(path.join(OUT_DIR, "organic-social-posts.md"), socialPost, "utf8");

const report = `# Frenciniz Satis Makinesi Aksiyon Raporu

Olusturma: ${new Date().toISOString()}

## Cikti dosyalari

- sales-machine-top100-products.csv: reklam ve Merchant icin ilk 100 satis urunu.
- google-ads-high-intent-keywords.csv: Google Ads exact match kelimeler.
- google-ads-high-intent-ads.csv: RSA reklam taslaklari.
- google-ads-negative-keywords.csv: bos harcama engelleyen negatif kelimeler.
- search-console-indexing-priority.csv: Search Console URL inspection sirasi.
- meta-product-sets.csv: Meta katalog urun seti kurallari.
- whatsapp-business-quick-replies.csv: WhatsApp Business hizli cevaplari.
- organic-social-posts.md: Facebook/Instagram organik post metinleri.

## Ana sayilar

- Stoklu urun: ${products.filter(p => Number(p.stock || 0) > 0).length}
- Ilk 100 urunde sales-priority-1: ${top100.filter(row => row.priority === "sales-priority-1").length}
- Google Ads keyword: ${keywordRows.length}
- Search Console URL: ${searchConsoleRows.length}

## Uygulama sirasi

1. Google Ads'te sadece google-ads-high-intent-keywords.csv dosyasindaki exact kelimeleri kullan.
2. Merchant Center'da custom_label_4 = sales-priority-1 urunleri ayrica takip et.
3. Search Console'da ilk 80 landing + ilk 100 urun URL'sini dizine ekleme icin kontrol et.
4. WhatsApp Business'a hizli cevaplari ekle.
5. Meta katalogda sales-priority-1 ve Disk/Balata/Kampana urun setlerini olustur.
`;
fs.writeFileSync(path.join(OUT_DIR, "sales-machine-action-report.md"), report, "utf8");

console.log(JSON.stringify({
  topProducts: top100.length,
  keywords: keywordRows.length,
  searchConsoleUrls: searchConsoleRows.length,
  metaSets: metaSets.length,
  quickReplies: quickReplies.length,
}, null, 2));
