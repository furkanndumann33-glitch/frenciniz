// Ekersan B2B API'den ürünleri otomatik senkronize eder (v3)
// - Görselleri included image map ile çıkarır (relationships.images)
// - Kategori: name + path birlikte regex pattern ile (field10 kullanılmaz)
// - Brand: brand_id mapping
// Vercel Cron ile günde 1 kez çalışır (05:00 UTC)

import { kv } from "@vercel/kv";

const EKERSAN_API = "https://bayi.ekersan.com/api/tr/v1";
const EKERSAN_USER = process.env.EKERSAN_USERNAME || "DUMANLAR";
const EKERSAN_PASS = process.env.EKERSAN_PASSWORD || "320043";

const BRAND_MAP = { 1: "Ekersan" };

// (regex, kategori) — daha spesifik önce
const CATEGORY_PATTERNS = [
  [/D[İI]SK\s*B[İI]JON|B[İI]JON\s*D[İI]SK\b|D[İI]SK\s*C[İI]VATA/i, "Disk Bijonu/Civatası"],
  // "BİJON ..." ile başlayanlar (DİSK geçse bile) bijon
  [/^B[İI]JON\s/i, "Bijon"],
  // Körük (DISK fallback'inden ÖNCE — "DİSK TİPİ İMDAT FREN KÖRÜK" isimleri DISK'e düşmesin)
  [/D[İI]NG[İI]L\s*KALDIRMA\s*KÖR[ÜU]K|HAVA\s*YASTI[GĞ]|SÜSPANS[İI]YON\s*KÖR[ÜU]K/i, "Süspansiyon Körüğü"],
  [/FREN\s*KÖR[ÜU]K|FREN\s*KÖR[ÜU][GĞ]|[İI]MD.*FREN\s*KÖR|SERV[İI]S\s*FREN\s*KÖR|D[İI]SK\s*[İI]MDAT\s*FREN\s*KÖR|D[İI]SK\s*FREN\s*KÖR|D[İI]SK\s*T[İI]P[İI].*KÖR|D[İI]SK.*KÖR[ÜU][GĞ]|D[İI]SK\s*KÖR[ÜU]K/i, "Fren Körüğü"],
  [/DORSE\s*KÖR[ÜU]K|^KÖR[ÜU]K|\bKÖR[ÜU]K\b|KÖRUGU|KORUGU|KOMPLE\s*KÖR|P[İI]STONSUZ\s*KÖR|KATLI\s*KÖR/i, "Fren Körüğü"],
  // SKU bazlı: 42xxxx.S/.C/.CP/.KP/.S## suffix'li ürünler → fren körüğü çeşitleri
  [/\b42\d{4}\.(S|C|CP|KP|S\d+)\b/i, "Fren Körüğü"],
  // KIZAK pattern BALATA'dan önce — "TAŞIYICI KIZAK ... BALATA" karma ürünleri yakala
  [/TAŞIYICI\s*KIZA[KĞG]|\bKIZA[KĞG]\b|^KIZA[KĞG]/i, "Kızak"],
  // Balata (DISK fallback'inden ÖNCE — "DİSK BALATASI" isimleri DISK'e düşmesin)
  [/D[İI]SK\s*BALATA|FREN\s*D[İI]SK\s*BALATA|BALATA\s*.*D[İI]SK|D[İI]SK\s*.*BALATA|FREN\s*BALATA|^BALATA|\bBALATA\b/i, "Fren Balatası"],
  [/FREN\s*D[İI]SK[İI]\s*ABS/i, "Fren Diski ABS'li"],
  [/FREN\s*D[İI]SK[İI]|\bFREN-D[İI]SK[İI]|D[İI]SK[İI]?\s*ISUZU|D[İI]SK[İI]?\s*KRONE|GOBEKL[İI]\s*D[İI]SK/i, "Fren Diski"],
  [/\bD[İI]SK\b|\bDISK\b/i, "Fren Diski"],
  [/FREN\s*KAMPANAS|^KAMPANA|\bKAMPANA\b/i, "Fren Kampanası"],
  [/OTOMAT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMOT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMAT[İI]K-FREN-C[İI]RC[İI]R/i, "Otomatik Fren Cırcırı"],
  [/MEKAN[İI]K\s*FREN\s*C[İI]RC[İI]R|MEKAN[İI]K-FREN-C[İI]RC[İI]R/i, "Mekanik Fren Cırcırı"],
  [/FREN\s*C[İI]RC[İI]R|\bCIRCIR\b|FREN-C[İI]RC[İI]R|AKILLI\s*C[İI]RC[İI]R|\bC[İI]RC[İI]R\b/i, "Fren Cırcırı"],
  [/FREN\s*PABUC|\bPABUC/i, "Fren Pabucu"],
  [/FREN\s*AYNAS|\bAYNA\b/i, "Fren Aynası"],
  [/FREN\s*S[İI]L[İI]ND[İI]R|FREN-S[İI]L[İI]ND[İI]R/i, "Fren Silindiri"],
  [/KAL[İI]PER\s*PERNO|PERNO\s*TAM[İI]R|PERNO\s*TM\s*TK/i, "Kaliper Perno Tamir Takımı"],
  // Kaliper kapak — greedy ile "ÜST KAPAĞI" gibi araya kelime giren formatları yakala
  [/KAL[İI]PER.*KAPA[KĞG]|KAL[İI]PER.*CONTA|SENS[ÖO]RLÜ\s*KAPA[KĞG]|SENS[ÖO]RSÜZ\s*KAPA[KĞG]/i, "Kaliper Kapak/Conta"],
  [/KAL[İI]PER.*MEKAN[İI]ZMA|KAL[İI]PER.*AYAR|AYAR\s*MEKAN[İI]ZMA|AYAR\s*D[İI]ŞL[İI]|AYAR\s*TAŞIYIC/i, "Kaliper Ayar Mekanizması"],
  [/KAL[İI]PER.*TOZ\s*LAST[İI]|TOZ\s*LAST[İI]G[İI]/i, "Kaliper Toz Lastiği"],
  [/KAL[İI]PER.*DURBUN|DÜRBÜN\s*TAKIM/i, "Kaliper Dürbün Takımı"],
  // Kaliper Tamir Takımı: TM.TK., MASURA, BİLYA YATAĞI, RULMAN YATAĞI, ESKOL, ARCS SET
  [/KAL[İI]PER.*TM\.?\s*TK|KAL[İI]PER.*MASURA|MASURA\s*B[İI]LYA|B[İI]LYA\s*YATA[ĞG]|RULMAN\s*YATA[ĞG]|KAL[İI]PER.*P[İI]STON\s*KAPA|MEK\.?\s*KOMPLE\s*SET|\bESKOL\b|\bARCS\s*SET|BPW.*TM\.?\s*TK|AXOR\s*SET\s*Y/i, "Kaliper Tamir Takımı"],
  // Kaliper Taşıyıcı → Kaliper Ayar Mekanizması altına
  [/KAL[İI]PER\s*TAŞIYIC|TAŞIYIC.*KAL[İI]PER|CAL[İI]PER\s*TAŞIYIC/i, "Kaliper Ayar Mekanizması"],
  [/\bKAL[İI]PER|\bCAL[İI]PER/i, "Kaliper"],
  [/\bELSA\b.*\d|\bELSA[\d-]+|ELSA-?2|ELSA195|ELSA225/i, "Kaliper Tamir Takımı (Elsa)"],
  [/\bSB\d|\bSB-\d|\bSB[5-7]|\bSN[6-7]|\bSK[6-7]|\bNA[6-7]|\bST[6-7]|\bSL[5-7]|\bSM[5-7]/i, "Kaliper Tamir Takımı (Wabco)"],
  [/MAXX\s*22|MAXX22/i, "Kaliper Tamir Takımı (Maxx22)"],
  [/PAN[\s-]?19|PAN[\s-]?22|PAN-19/i, "Kaliper Tamir Takımı (PAN)"],
  [/MODULX|MODUL\s*X/i, "Kaliper Tamir Takımı (Modulx)"],
  [/FRENCO+\b|FRENCOO/i, "Kaliper Tamir Takımı (Frenco)"],
  [/\bDUCO\b/i, "Kaliper Tamir Takımı (Duco)"],
  [/DX\s*195|DX195|D3\b/i, "Kaliper Tamir Takımı"],
  [/\bB\.V\b|^B\.V|MARK\s*[IV]+/i, "Kaliper Tamir Takımı"],
  [/\bB[İI]JON\s*DPS\b/i, "Bijon DPS"],
  [/\bB[İI]JON|D[İI]NG[İI]L\s*SOMUN/i, "Bijon"],
  [/\bPORYA|PORYA\s*KAPAK|PORYA\s*FLANŞ|D[İI]SKL[İI]\s*PORYA|EUROCARGO.*PORYA/i, "Porya"],
  [/\bD[İI]NG[İI]L\b/i, "Dingil"],
  [/AYAR\s*KOLU|EL\s*FREN\s*KOLU/i, "Ayar Kolu / El Fren"],
  [/ABS\s*SENS[ÖO]R|ABS\s*MOD|ABS\s*UZATMA|ABS\s*KABLO|\bABS\b.*D[İI]ŞL[İI]/i, "ABS Sensörü/Modülü/Kablo"],
  [/EBS\s*MOD|\bEBS\b/i, "EBS Modülatör"],
  [/\bSENS[ÖO]R/i, "Sensör"],
  [/HAVA\s*KURUTUC|KURUTUCU\s*HAVA|\bKURUTUCU|HAVA\s*[İI]ŞLEME|EAC|HAVA\s*TAHL/i, "Hava Kurutucu"],
  [/HAVA\s*T[ÜU]P|HAVA\s*TANK|\d+\s*LT\s*HAVA/i, "Hava Tüpü"],
  [/KOMPRES[ÖO]R\s*S[İI]L[İI]ND[İI]R/i, "Kompresör Silindiri"],
  [/KOMPRES[ÖO]R\s*P[İI]STON|KOMPRES[ÖO]R.*SEGMAN/i, "Kompresör Piston/Segman"],
  [/KOMPRES[ÖO]R\s*KAPAK/i, "Kompresör Kapak"],
  [/KOMPRES[ÖO]R\s*TAM[İI]R/i, "Kompresör Tamir Takımı"],
  [/\bKOMPRES[ÖO]R/i, "Kompresör"],
  [/\bS[İI]BOP/i, "Sibop"],
  [/KARTUŞ\s*F[İI]LTRE|\bF[İI]LTRE\b/i, "Filtre / Kartuş"],
  [/R[ÖO]LE\s*VENT[İI]L|R[ÖO]LE\s*VALF/i, "Röle Ventili"],
  [/DAGITICI\s*VENT[İI]L|DA[ĞG]ITICI\s*VENT[İI]L|D[ÖO]RTL[ÜU]\s*DA[GĞ]/i, "Dağıtıcı Ventil"],
  [/BASIN[CÇ]\s*AYAR\s*VAL|S[ÜU]SPANS[İI]YON\s*VENT|YÜKSEKL[İI]K\s*AYAR\s*VAL/i, "Süspansiyon/Basınç Ventili"],
  [/ŞANZIMAN\s*VENT|ŞANZIMAN\s*VAL/i, "Şanzıman Ventili"],
  [/\bVENT[İI]L|\bVALF|VANAS|\bVANA\b/i, "Valf / Ventil"],
  [/HORTUM\s*ADAPT|ADAPT[ÖO]R[ÜU]?\s*HORTUM|Ç[İI]FT\s*Y[ÖO]NL[ÜU]\s*HORTUM/i, "Hortum Adaptörü"],
  [/\bHORTUM/i, "Hortum"],
  [/\bN[İI]PEL\b/i, "Nipel"],
  [/REDÜKS[İI]YON|YÜKSELT[İI]C[İI]|D[ÜU]Ş[ÜU]R[ÜU]C[ÜU]|ŞAS[İI]\s*GE[ÇC][İI]Ş|K[ÖO]R\s*TAPA|TEST\s*APARAT|T[ÜU]P\s*TAHL[İI]YE|ARA\s*D[İI]RSEK|\bD[İI]RSEK\b/i, "Bağlantı Elemanları"],
  [/DORSE\s*Y[ÜU]KSEKL[İI]K|RAMPA\s*KOLU/i, "Süspansiyon"],
  [/FREN\s*AYAR\s*(KAMA|P[İI]STON|SOMUN|P[İI]M|P[İI]NYON|MANDAL|K[İI]L[İI]T|ÇAPRAZ|V[İI]DA|C[İI]VATA|KAPAK|TOZ|C\s*YAY|MEKAN|TAM)/i, "Fren Ayar Parçaları"],
  [/AYAR\s*KAMA|AYAR\s*P[İI]NYON|AYAR\s*SOMUN|AYAR\s*P[İI]STON|AYAR\s*K[İI]L[İI]T|AYAR\s*MANDAL|AYAR\s*KAPA[KĞG]/i, "Fren Ayar Parçaları"],
  [/\d+\s*AYAR\s*C[İI]VATA|\bPRO\s*\d+\s*KAMA\b|KROM\s*D[İI]ŞL[İI]|PARK\s*BUTONU/i, "Fren Ayar Parçaları"],
  // Porya ek pattern: JANT FLANŞ
  [/JANT\s*FLAN[ŞS]/i, "Porya"],
  // Kompresör segman ek pattern
  [/REKOR\s*SEGMAN|PLS\s*REKOR/i, "Kompresör Piston/Segman"],
  // Keçe ek pattern: NBR + ARKA/ÖN DIŞ
  [/NBR\s*ARKA\s*DI[ŞS]|NBR\s*ÖN\s*DI[ŞS]|\d+\*\d+\*+\d+\/\d+\s*NBR/i, "Keçe"],
  [/FREN\s*YAY|DORSE\s*YAY|KOL\s*YAY|ASKI\s*YAY|^YAY|\bYAY[IİL]?\b/i, "Yay"],
  [/\bMAKAS\b/i, "Makas"],
  [/D[ÖO]NER\s*PULLU\s*SOMUN|JANT\s*SOMUN|[İI]SP[İI]T\s*SOMUN|\bSOMUN\b/i, "Somun / Cıvata"],
  [/\bPERNO\b|PERNO\s*KL[İI]PS|PERNO\s*P[İI]ML|PERNO\s*TAPAS|PERNO\s*STANDART/i, "Perno"],
  [/PER[ÇC][İI]N/i, "Perçin"],
  [/KAPL[İI]N\s*LAST[İI][GĞ]|KALDIRMA\s*LAST[İI][GĞ]|\bLAST[İI]K\b/i, "Lastik"],
  [/\bAKS\b/i, "Aks"],
  [/P[ÖO]MPALAR|\bPOMPA/i, "Pompa"],
  [/R[ÖO]T[ÜU]L|\bR[ÖO]T\b/i, "Rotül"],
  [/AMORT[İI]S[ÖO]R/i, "Amortisör"],
  [/\bBURÇ|\bMUYLU/i, "Burç / Muylu"],
  [/\bKEÇE/i, "Keçe"],
  [/\bVOLAN|DEBR[İI]YAJ/i, "Volan / Debriyaj"],
  [/RULMAN/i, "Rulman"],
  // KIZAK pattern artık yukarıda BALATA'dan önce
  [/Z-?CAM\s*SET|S-?CAM\s*SET/i, "Cam Set"],
  [/ÇAMURLUK|CAMURLUK/i, "Çamurluk"],
  [/\bMAKARA/i, "Makara"],
  [/24V\s*ELEKTR[İI]K|ELEKTR[İI]K\s*KABLO/i, "Elektrik Kablosu"],
  [/TAM[İI]R\s*TAKIM/i, "Tamir Takımı"],
  [/\bSET\s*KOMPLE\b|^SET\s|SET\s*SOL|SET\s*SAĞ/i, "Kaliper Tamir Seti"],
];

function slug(name) {
  if (!name) return "diger";
  let s = name;
  const repl = { 'ı':'i','İ':'i','ş':'s','Ş':'s','ç':'c','Ç':'c','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','â':'a','Â':'a','î':'i','Î':'i','û':'u','Û':'u' };
  for (const [k,v] of Object.entries(repl)) s = s.split(k).join(v);
  s = s.normalize("NFD").replace(/\p{Mn}/gu, "");
  s = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "diger";
}

// Sitede satılmayan kategoriler — bu kategoriye düşen ürünler products.json'a yazılmaz
const REJECTED_CATEGORIES = new Set([
  // HAVALI FREN PARÇALARI
  "Valf / Ventil", "Dağıtıcı Ventil", "Röle Ventili",
  "Süspansiyon/Basınç Ventili", "Şanzıman Ventili",
  "Hava Kurutucu", "Filtre / Kartuş", "Hava Tüpü",
  // KOMPRESÖR
  "Kompresör Piston/Segman", "Kompresör Silindiri",
  "Kompresör Tamir Takımı", "Kompresör Kapak", "Kompresör",
  // REKOR / HORTUM
  "Bağlantı Elemanları", "Nipel", "Hortum", "Hortum Adaptörü",
]);

function detectCategory(name, path, sku) {
  const haystack = ((name || "") + " " + (path || "").replace(/-/g, " ") + " " + (sku || "")).toUpperCase();
  for (const [pat, cat] of CATEGORY_PATTERNS) {
    if (pat.test(haystack)) return cat;
  }
  return "Diğer";
}

async function ekersanLogin() {
  const res = await fetch(`${EKERSAN_API}/data/b2b_signin.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ username: EKERSAN_USER, password: EKERSAN_PASS }),
    redirect: "manual",
  });
  let cookieParts = [];
  if (typeof res.headers.getSetCookie === "function") {
    cookieParts = res.headers.getSetCookie().map(c => c.split(";")[0]);
  } else {
    const raw = res.headers.get("set-cookie") || "";
    cookieParts = raw.split(/,(?=[^ ]+=)/).map(c => c.split(";")[0].trim()).filter(Boolean);
  }
  const cookieStr = cookieParts.join("; ");
  const data = await res.json();
  return { csrf: data.csrf, cookies: cookieStr };
}

async function fetchAllProducts(auth) {
  const allProducts = [];
  const allIncluded = [];

  for (let page = 1; page <= 600; page++) {
    let attempt = 0;
    let data = null;
    while (attempt < 8) {
      try {
        const res = await fetch(
          `${EKERSAN_API}/data/b2b/products.json?page=${page}`,
          { headers: { "Accept": "application/json", "X-CSRF-TOKEN": auth.csrf, "Cookie": auth.cookies } }
        );
        if (res.status === 429) {
          await new Promise(r => setTimeout(r, 30000 * (attempt + 1)));
          attempt++;
          continue;
        }
        data = await res.json();
        break;
      } catch (e) {
        attempt++;
        await new Promise(r => setTimeout(r, 10000));
      }
    }
    if (!data || data.error) break;
    const products = data.products?.data || [];
    const included = data.products?.included || [];
    if (products.length === 0) break;
    allProducts.push(...products);
    allIncluded.push(...included);
    if (products.length < 20) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  return { products: allProducts, included: allIncluded };
}

function processProducts(raw) {
  const { products, included } = raw;

  const unitsMap = {};
  const imageUrlMap = {};
  for (const inc of included) {
    if (inc.type === "unit") unitsMap[String(inc.id)] = inc.attributes || {};
    else if (inc.type === "image") imageUrlMap[String(inc.id)] = (inc.attributes || {}).url;
  }

  const final = [];
  const catsMap = {};
  let pid = 1;

  for (const p of products) {
    const a = p.attributes || {};
    if (!a.b2b_in_stock) continue;

    const unitIds = (p.relationships?.units?.data || []).map(u => String(u.id));
    let price = 0;
    for (const uid of unitIds) {
      const u = unitsMap[uid] || {};
      if (u.b2b_price) { price = u.b2b_price; break; }
    }
    if (price <= 0) continue;

    const imgIds = (p.relationships?.images?.data || []).map(i => String(i.id));
    const images = imgIds.map(iid => imageUrlMap[iid]).filter(Boolean);
    const mainImg = images[0] || ("https://placehold.co/600x600/1c1c1c/b0b0b0?text=" + encodeURIComponent(a.sku || "URUN"));

    const catName = detectCategory(a.name || "", a.path || "", a.sku || "");
    // Sitede satılmayan kategoriler — havalı fren / kompresör / rekor-hortum grupları kaldırıldı
    if (REJECTED_CATEGORIES.has(catName)) continue;
    const catId = slug(catName);
    catsMap[catId] = catName;

    const brand = BRAND_MAP[a.brand_id] || "Ekersan";

    final.push({
      id: pid++,
      name: a.name || "",
      sku: a.sku || "",
      price: Math.round(price * 100) / 100,
      old: null,
      vat_rate: a.vat_rate || 0,
      stock: Math.floor(a.b2b_stock_qty || 0),
      oem: a.field1 || "",
      cat: catId,
      brand,
      rating: 4.5,
      reviews: 0,
      img: mainImg,
      images,
      desc: a.name || "",
      specs: {},
      compat: [],
      veh: ["kamyon", "tir"],
    });
  }

  // Hiyerarşik kategori listesi (Ekersan B2B yapısına uygun)
  const HIERARCHY = {
    "Fren Diski":"disk","Fren Diski ABS'li":"disk",
    "Fren Kampanası":"kampana",
    "Fren Balatası":"balata",
    "Fren Pabucu":"fren-pabuclari","Perçin":"fren-pabuclari",
    "Fren Cırcırı":"circir","Mekanik Fren Cırcırı":"circir","Otomatik Fren Cırcırı":"circir",
    "Fren Ayar Parçaları":"fren-ayar","Ayar Kolu / El Fren":"fren-ayar","Cam Set":"fren-ayar",
    "Kaliper":"kaliper-urunleri","Kaliper Ayar Mekanizması":"kaliper-urunleri","Kaliper Dürbün Takımı":"kaliper-urunleri","Kaliper Kapak/Conta":"kaliper-urunleri","Kaliper Perno Tamir Takımı":"kaliper-urunleri","Kaliper Tamir Seti":"kaliper-urunleri","Kaliper Tamir Takımı":"kaliper-urunleri","Kaliper Tamir Takımı (Duco)":"kaliper-urunleri","Kaliper Tamir Takımı (Elsa)":"kaliper-urunleri","Kaliper Tamir Takımı (Frenco)":"kaliper-urunleri","Kaliper Tamir Takımı (Maxx22)":"kaliper-urunleri","Kaliper Tamir Takımı (Modulx)":"kaliper-urunleri","Kaliper Tamir Takımı (PAN)":"kaliper-urunleri","Kaliper Tamir Takımı (Wabco)":"kaliper-urunleri","Kaliper Toz Lastiği":"kaliper-urunleri","Kızak":"kaliper-urunleri","Perno":"kaliper-urunleri",
    "Fren Körüğü":"fren-korukleri","Lastik":"fren-korukleri",
    "Bijon":"bijon-grup","Bijon DPS":"bijon-grup","Disk Bijonu/Civatası":"bijon-grup","Somun / Cıvata":"bijon-grup",
    "Porya":"porya-grup","Rulman":"porya-grup","Keçe":"porya-grup",
    "ABS Sensörü/Modülü/Kablo":"sensor-uzatma","EBS Modülatör":"sensor-uzatma","Sensör":"sensor-uzatma","Elektrik Kablosu":"sensor-uzatma",
    "Valf / Ventil":"havali-fren","Dağıtıcı Ventil":"havali-fren","Röle Ventili":"havali-fren","Süspansiyon/Basınç Ventili":"havali-fren","Şanzıman Ventili":"havali-fren","Hava Kurutucu":"havali-fren","Filtre / Kartuş":"havali-fren","Hava Tüpü":"havali-fren",
    "Yay":"fren-yaylari",
    "Süspansiyon Körüğü":"susp-korugu","Dingil":"susp-korugu","Burç / Muylu":"susp-korugu",
    "Kompresör Piston/Segman":"kompresor-grup","Kompresör Silindiri":"kompresor-grup","Kompresör Tamir Takımı":"kompresor-grup",
    "Bağlantı Elemanları":"rekor-hortum","Nipel":"rekor-hortum","Hortum":"rekor-hortum","Hortum Adaptörü":"rekor-hortum",
  };
  const GROUP_NAMES = {
    "disk":"DİSK","kampana":"KAMPANA","balata":"BALATA","fren-pabuclari":"FREN PABUÇLARI",
    "circir":"CIRCIR","fren-ayar":"FREN AYAR PARÇALARI","kaliper-urunleri":"KALİPER ÜRÜNLERİ",
    "fren-korukleri":"FREN KÖRÜKLERİ","bijon-grup":"BİJON","porya-grup":"PORYA",
    "sensor-uzatma":"SENSÖR VE UZATMALAR","havali-fren":"HAVALI FREN PARÇALARI",
    "fren-yaylari":"FREN YAYLARI","susp-korugu":"SÜSP. KÖRÜĞÜ","kompresor-grup":"KOMPRESÖR",
    "rekor-hortum":"REKOR / HORTUM","diger-parcalar":"DİĞER",
  };
  const cats = [{ id: "all", name: "Tüm Ürünler", parent: null }];
  const groupOrder = []; const groupChildren = {}; const ungrouped = [];
  const sortedIds = Object.keys(catsMap).sort((x, y) => catsMap[x].localeCompare(catsMap[y], "tr"));
  for (const cid of sortedIds) {
    const catName = catsMap[cid];
    const gid = HIERARCHY[catName];
    if (gid) {
      if (!groupChildren[gid]) { groupOrder.push(gid); groupChildren[gid] = []; }
      groupChildren[gid].push({ id: cid, name: catName, parent: gid });
    } else {
      ungrouped.push({ id: cid, name: catName, parent: "diger-parcalar" });
    }
  }
  for (const gid of groupOrder) {
    cats.push({ id: gid, name: GROUP_NAMES[gid], parent: null, isGroup: true });
    cats.push(...groupChildren[gid]);
  }
  if (ungrouped.length) {
    cats.push({ id: "diger-parcalar", name: "Diğer Parçalar", parent: null, isGroup: true });
    cats.push(...ungrouped);
  }

  return { products: final, categories: cats };
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "frenciniz-cron-2026"}`) {
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || "frenciniz-admin-2026"}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("[sync] Ekersan login...");
    const auth = await ekersanLogin();

    console.log("[sync] Fetching products...");
    const raw = await fetchAllProducts(auth);
    console.log(`[sync] Raw: ${raw.products.length} products, ${raw.included.length} included`);

    const { products, categories } = processProducts(raw);
    console.log(`[sync] Processed: ${products.length} in-stock, ${categories.length} categories`);

    await kv.set("products", JSON.stringify(products));
    await kv.set("categories", JSON.stringify(categories));
    await kv.set("sync:last", new Date().toISOString());
    await kv.set("sync:stats", JSON.stringify({
      total: raw.products.length,
      inStock: products.length,
      categories: categories.length - 1,
      time: new Date().toISOString(),
    }));

    return res.status(200).json({
      ok: true,
      total: raw.products.length,
      inStock: products.length,
      categories: categories.length - 1,
      syncTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync] Error:", err);
    return res.status(500).json({ error: "Sync failed", message: err.message });
  }
}
