// Akıllı chat bot — gerçek ürün veritabanı + doğal Türkçe ile çalışır.
// Niyet algılama → kategori/araç/sku eşleştirme → bağlamsal cevap.
import fs from "fs";
import path from "path";

let PRODUCTS_CACHE = null;
let CATS_CACHE = null;
let CACHE_TIME = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

function loadProducts() {
  const now = Date.now();
  if (PRODUCTS_CACHE && (now - CACHE_TIME) < CACHE_TTL) {
    return { products: PRODUCTS_CACHE, cats: CATS_CACHE };
  }
  try {
    const prodPath = path.join(process.cwd(), "public/data/products.json");
    const catPath = path.join(process.cwd(), "public/data/categories.json");
    PRODUCTS_CACHE = JSON.parse(fs.readFileSync(prodPath, "utf8"));
    CATS_CACHE = JSON.parse(fs.readFileSync(catPath, "utf8"));
    CACHE_TIME = now;
  } catch (e) {
    PRODUCTS_CACHE = PRODUCTS_CACHE || [];
    CATS_CACHE = CATS_CACHE || [];
  }
  return { products: PRODUCTS_CACHE, cats: CATS_CACHE };
}

const SITE = "https://frenciniz.com";

const VEHICLES = {
  mercedes: ["mercedes","mersedes","mercede","benz","actros","atego","axor","sprinter","unimog","arocs","antos","accelo"],
  man: ["man","tga","tgs","tgx","tgm","tgl","tge"],
  daf: ["daf","xf","cf","lf","cfxf"],
  volvo: ["volvo","fh","fm","fmx","fl","fe"],
  scania: ["scania","skania","p series","r series","g series","s series"],
  iveco: ["iveco","eurocargo","stralis","trakker","daily","s-way","tector"],
  renault: ["renault","premium","magnum","kerax","midlum","kangoo","master","trafic"],
  ford: ["ford","cargo","f-max","fmax","transit"],
  bmc: ["bmc","fatih","tugra","prof","tgr"],
  isuzu: ["isuzu","npr","nkr","kamyonet"],
  mitsubishi: ["mitsubishi","canter","fuso"],
  bpw: ["bpw"],
  saf: ["saf","sauer"],
  ror: ["ror","mtr"],
  knorr: ["knorr","knor","bremse"],
  wabco: ["wabco","wabko"],
  dodge: ["dodge","ad8","ad300"],
  krone: ["krone"],
  schmitz: ["schmitz","cargobull"],
  setra: ["setra"],
  otokar: ["otokar","sultan","navigo","kent","doruk"],
  temsa: ["temsa","safir","maraton","tourmalin"],
};

const CAT_KEYWORDS = {
  "fren-diski": ["fren diski","disk","disc","rotor","fren disk"],
  "fren-diski-abs-li": ["abs disk","absli disk","abs li disk","abs lı disk","disk abs"],
  "fren-balatasi": ["balata","balatası","brake pad","pad","fren balata"],
  "fren-kampanasi": ["kampana","tambur","drum","fren kampana"],
  "fren-korugu": ["körük","koruk","fren körüğü","koruk","fren körük","brake chamber"],
  "kaliper": ["kaliper","kalıper","caliper"],
  "porya": ["porya","poyra","hub","göbek"],
  "bijon": ["bijon","saplama","stud","cıvata bijon"],
  "bijon-dps": ["bijon dps","dps","komple bijon"],
  "fren-circiri": ["cırcır","circir","cıvcır","slack adjuster","fren cırcırı"],
  "otomatik-fren-circiri": ["otomatik cırcır","oto cırcır","auto slack"],
  "mekanik-fren-circiri": ["mekanik cırcır"],
  "abs-sensoru-modulu-kablo": ["abs","abs sensör","abs modül","abs kablo","abs sensoru"],
  "ebs-modulator": ["ebs","ebs modülatör","modulator"],
  "yay": ["yay","spring","balata yay","yaylı"],
  "ayar-kolu-el-fren": ["ayar kolu","el fren","handbrake"],
  "fren-ayar-parcalari": ["ayar parça","fren ayar"],
  "kompresor": ["kompresör","kompresor","compressor"],
  "hortum": ["hortum","hose"],
  "rekor": ["rekor","fitting"],
  "nipel": ["nipel","nipple"],
  "sensor": ["sensör","sensor"],
  "sibop": ["sibop","subap","valve"],
  "fren-silindiri": ["fren silindiri","silindir","brake cylinder"],
};

const TR_FOLD = { "ı":"i","İ":"i","ğ":"g","Ğ":"g","ü":"u","Ü":"u","ş":"s","Ş":"s","ö":"o","Ö":"o","ç":"c","Ç":"c" };
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, c => TR_FOLD[c] || c)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fp(price) {
  return "₺" + Number(price).toLocaleString("tr-TR");
}

function detectVehicle(normMsg) {
  for (const [key, syns] of Object.entries(VEHICLES)) {
    for (const s of syns) {
      if (normMsg.includes(normalize(s))) return key;
    }
  }
  return null;
}

function detectCategory(normMsg) {
  let best = null, bestLen = 0;
  for (const [catId, syns] of Object.entries(CAT_KEYWORDS)) {
    for (const s of syns) {
      const ns = normalize(s);
      if (normMsg.includes(ns) && ns.length > bestLen) {
        best = catId;
        bestLen = ns.length;
      }
    }
  }
  return best;
}

function searchProducts(msg, products, opts = {}) {
  const limit = opts.limit || 5;
  const filterCat = opts.cat;
  const filterVeh = opts.vehicle;
  const norm = normalize(msg);
  const words = norm.split(/\s+/).filter(w => w.length >= 2);
  if (!words.length && !filterCat && !filterVeh) return [];

  const scored = [];
  for (const p of products) {
    if (filterCat && p.cat !== filterCat) continue;
    if (filterVeh) {
      const compat = (p.compat || []).map(c => normalize(c)).join(" ");
      const name = normalize(p.name);
      if (!compat.includes(filterVeh) && !name.includes(filterVeh)) continue;
    }
    const haystack = normalize([
      p.name || "", p.sku || "", p.oem || "", p.brand || "",
      ...(p.compat || []),
    ].join(" "));
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score += w.length * 2;
    }
    // SKU/OEM tam eşleşme bonusu
    if (p.sku && norm.includes(normalize(p.sku))) score += 50;
    if (p.oem) {
      const oems = String(p.oem).split(/[,\-\s]+/).map(o => normalize(o)).filter(Boolean);
      if (oems.some(o => o.length >= 4 && norm.includes(o))) score += 40;
    }
    if (p.stock > 0) score += 3;
    if (score > 0 || filterCat || filterVeh) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.p);
}

function productLine(p) {
  const stock = p.stock > 0 ? `Stokta (${p.stock})` : "Tükendi";
  const url = `${SITE}/urun/${p.id}`;
  let line = `• ${p.name}\n`;
  line += `   Fiyat: ${fp(p.price)}  |  ${stock}\n`;
  if (p.sku) line += `   SKU: ${p.sku}\n`;
  if (p.oem) {
    const oem = String(p.oem).split(/[,\s]+/).slice(0, 3).join(", ");
    if (oem) line += `   OEM: ${oem}\n`;
  }
  const compat = (p.compat || []).slice(0, 3).join(", ");
  if (compat) line += `   Uyumlu: ${compat}\n`;
  line += `   ${url}`;
  return line;
}

function formatProducts(prods, max = 5) {
  return prods.slice(0, max).map(productLine).join("\n\n");
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─────────────────────── INTENT KURALLARI ───────────────────────
const INTENT_RULES = [
  {
    id: "greet",
    test: (n) => /^(merhaba|selam|sa|slm|mrb|mrhb|hey|hello|hi|gunaydin|iyi gunler|iyi aksamlar|aleyk?um|alaykum|sea?lam|nasilsin)/.test(n),
    reply: () => pick([
      "Merhaba 👋 Frenciniz'e hoş geldiniz. Hangi araç için fren parçası arıyorsunuz? Marka veya model yazmanız yeter.",
      "Selam! Size nasıl yardımcı olabilirim? Aracınızı veya parça adını yazabilirsiniz (örn: \"Mercedes Actros disk\").",
      "Merhaba! Ürün, sipariş, kargo veya iade — ne hakkında bilgi istersiniz?"
    ])
  },
  {
    id: "thanks",
    test: (n) => /(tesekk|sagol|sag ol|eyvallah|tsk|eyv|thanks|thank you|sukran)/.test(n),
    reply: () => pick([
      "Rica ederim! Başka bir konuda yardım gerekirse buradayım. Güvenli yolculuklar 🚛",
      "Ne demek, asıl biz teşekkür ederiz. Aklınıza takılan başka bir şey olursa yazın.",
      "Rica ederim. İhtiyacınız olduğunda 0545 608 7008'i de arayabilirsiniz."
    ])
  },
  {
    id: "bye",
    test: (n) => /^(gorusur|bye|hosca|gule gule|bb|bay bay|iyi gunler$|iyi aksamlar$|kapat)/.test(n),
    reply: () => "İyi günler! 👋 Tekrar bekleriz.\nDestek: 0545 608 7008  |  WhatsApp: 0850 888 7881"
  },
  {
    id: "order_track",
    test: (n) => /(frn[\s\-]?\d|siparis.*takip|takip.*siparis|kargom nerede|siparisim nerede|nerede kargo|kargo nerde|takip no|kargo takip)/.test(n),
    reply: (msg) => {
      const m = msg.match(/FRN[\s\-]?(\d+)/i);
      const ord = m ? `FRN-${m[1]}` : null;
      let r = "📦 Sipariş takibi için:\n\n";
      if (ord) r += `Sipariş numaranız: *${ord}* — bunu kayda alıyorum, müşteri temsilcimiz birazdan dönecek.\n\n`;
      r += "1) Hesabım > Siparişlerim sayfasından canlı durumu görebilirsiniz\n";
      r += "2) Aras Kargo: https://kargotakip.araskargo.com.tr\n";
      r += "3) Hızlı destek: 0545 608 7008  |  WhatsApp: 0850 888 7881\n\n";
      r += "Sipariş numaranızı (FRN-XXXX) paylaşırsanız hemen kontrol edelim.";
      return r;
    }
  },
  {
    id: "return",
    test: (n) => /(iade|geri iade|hasarl|bozuk|yanlis gel|degisim|degistir|kirik|garanti is)/.test(n),
    reply: () => "♻️ İade ve değişim koşullarımız çok basit:\n\n" +
      "• 14 gün koşulsuz iade hakkı\n" +
      "• Hasarlı veya yanlış ürünse iade kargo bizden\n" +
      "• Ürün kullanılmamış ve orijinal ambalajda olmalı\n" +
      "• Fatura/irsaliye ile birlikte gönderilmeli\n\n" +
      "Başlatmak için: Hesabım > Siparişlerim > İade Başlat\n" +
      "Veya 0545 608 7008'i arayın, e-posta: info@frenciniz.com\n\n" +
      "İade onayı sonrası para iadesi 3-5 iş günü içinde hesabınıza geçer."
  },
  {
    id: "shipping",
    test: (n) => /(kargo|gonderi|teslimat|kac gunde|ne zaman gel|ucretsiz kargo|aras|ptt|yurtici|mng|sevk|kac gun sur)/.test(n),
    reply: () => "🚚 Kargo bilgilerimiz:\n\n" +
      "Sipariş süresi: 14:00'a kadar verilen siparişler aynı gün kargoya verilir.\n\n" +
      "Teslimat süresi:\n" +
      "• İstanbul / Ankara / İzmir: 1-2 iş günü\n" +
      "• Marmara / Ege: 2-3 iş günü\n" +
      "• Diğer iller: 2-4 iş günü\n\n" +
      "Kargo ücreti:\n" +
      "• 500₺ üzeri ücretsiz 🎁\n" +
      "• 500₺ altı: ₺49,90\n\n" +
      "Anlaşmalı kargo: Aras Kargo. Takip numarası e-postanıza otomatik gelir."
  },
  {
    id: "payment",
    test: (n) => /(odeme|taksit|kredi kart|havale|eft|nakit|ne ile odeme|kac taksit|kart secen)/.test(n),
    reply: () => "💳 Ödeme seçeneklerimiz:\n\n" +
      "• Kredi/banka kartı (Visa, Mastercard, Troy) — 2-12 taksit\n" +
      "• Havale / EFT — %3 ek indirim, ödeme sonrası 1 iş günü içinde kargo\n" +
      "• 3D Secure ile tüm ödemeler korunur\n\n" +
      "Ödeme altyapısı: Garanti BBVA, PayTR, Param.\n500₺ üzeri tüm siparişlerde kargo bedava."
  },
  {
    id: "warranty",
    test: (n) => /(garanti|sertifika|orjinal|orijinal|kalite|ece r|r-?90|r90|saglam mi|saglam mi|tse|iso)/.test(n),
    reply: () => "🛡 Kalite ve garanti:\n\n" +
      "Sertifikalar: ECE R-90 (AB), ISO 9001:2015, TSE uygunluk.\n\n" +
      "Garanti süreleri:\n" +
      "• Fren diski ve kampana: 2 yıl\n" +
      "• Elektronik (EBS, ABS): 1 yıl\n" +
      "• Aşınan parçalar (balata vb.): 6 ay\n\n" +
      "Her üründe fatura, garanti belgesi ve orijinal ambalaj çıkar."
  },
  {
    id: "contact",
    test: (n) => /(iletisim|telefon|numara|adres|nerede|mail|e-posta|eposta|whatsapp|wp|aramak|sizi|muhattap)/.test(n),
    reply: () => "📍 İletişim bilgilerimiz:\n\n" +
      "Telefon: 0545 608 7008\n" +
      "WhatsApp: 0850 888 7881\n" +
      "E-posta: info@frenciniz.com\n\n" +
      "Adres: Hızırbey Mah. 1509 Sok. No:24, Isparta\n\n" +
      "Çalışma saatleri:\n" +
      "Pazartesi – Cumartesi: 08:00 – 18:00\n" +
      "Pazar: kapalı (online sipariş 7/24 açık)"
  },
  {
    id: "hours",
    test: (n) => /(calisma saat|saat kac|acik mi|acik misiniz|kacta kapan|hafta sonu|pazar acik)/.test(n),
    reply: () => "⏰ Çalışma saatleri: Pazartesi – Cumartesi 08:00 – 18:00. Pazar günü kapalıyız ama online sipariş 7/24 açık — pazartesi sabah ilk işlerimizden biri olur."
  },
  {
    id: "b2b",
    test: (n) => /(toplu|bayi|b2b|toptanc|toptan|iskonto|ozel fiyat|musteri olmak|uye olmak|kurumsal|filo)/.test(n),
    reply: () => "🤝 Kurumsal ve B2B müşterilerimize özel:\n\n" +
      "Adet bazlı indirim:\n" +
      "• 10+ adet: %5\n" +
      "• 25+ adet: %10\n" +
      "• 50+ adet: özel teklif\n" +
      "• 100+ adet: fabrika fiyatı\n\n" +
      "Bayilik isteyenler için il/ilçe bayiliği, vadeli satış ve teknik destek de sağlıyoruz.\n\n" +
      "Direkt iletişim: 0545 608 7008  |  info@frenciniz.com"
  },
  {
    id: "brands",
    test: (n) => /(hangi marka|marka var|marka satiyor|markalar nedir|marka liste|brand)/.test(n),
    reply: () => {
      const { products } = loadProducts();
      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      let r = "🏭 Ana üretici markamız: *Ekersan* (kendi üretimimiz, ECE R-90 sertifikalı).\n\n";
      r += "Uyumlu araç markaları:\n";
      r += "• Mercedes — Actros, Atego, Axor, Arocs\n";
      r += "• MAN — TGA, TGS, TGX, TGM, TGL\n";
      r += "• Volvo — FH, FM, FMX\n";
      r += "• Scania — P / R / G / S serisi\n";
      r += "• DAF — XF, CF, LF\n";
      r += "• Renault — Premium, Magnum, Kerax\n";
      r += "• Iveco — Eurocargo, Stralis, Trakker\n";
      r += "• Ford Cargo, BMC, Otokar, Temsa, Isuzu\n";
      r += "• Dorse: BPW, SAF, ROR, Schmitz, Krone\n\n";
      r += `Sitemizde toplam ${products.length}+ ürün var. Aracınızı yazın, uyumlu ürünleri listeleyeyim.`;
      return r;
    }
  },
  {
    id: "price_only",
    test: (n) => /^(fiyat|fiyatlar|ucret|ne kadar|kac para|kacaa)$/.test(n),
    reply: () => "Fiyat öğrenmek istediğiniz ürünün adını, SKU'sunu veya OEM numarasını yazın — anında detaylı bilgi vereyim. Örnek: \"Mercedes Actros disk fiyatı\" veya \"ESD 130 09\"."
  },
  {
    id: "stock",
    test: (n) => /^(stok var mi|stok|mevcut mu|stokta var mi)$/.test(n),
    reply: () => "Hangi üründen bahsediyorsunuz? Ürün adı, SKU veya OEM yazın — stok durumunu hemen söyleyeyim."
  },
];

// ─────────────────────── ANA FONKSİYON ───────────────────────
export function getSmartReply(message) {
  const msg = String(message || "").trim();
  if (!msg) return "Yazdığınız mesaj boş görünüyor. Size nasıl yardımcı olabilirim?";

  const norm = normalize(msg);

  // 1) Niyet kuralları
  for (const rule of INTENT_RULES) {
    if (rule.test(norm)) return rule.reply(msg);
  }

  // 2) Araç + kategori birleşik sorgu
  const { products } = loadProducts();
  const veh = detectVehicle(norm);
  const cat = detectCategory(norm);

  if (veh || cat) {
    const found = searchProducts(msg, products, {
      vehicle: veh,
      cat: cat,
      limit: 5,
    });
    if (found.length > 0) {
      const vehLabel = veh ? veh.charAt(0).toUpperCase() + veh.slice(1) : null;
      const catLabel = cat ? cat.replace(/-/g, " ") : null;
      let r = "";
      if (vehLabel && catLabel) r = `🚛 ${vehLabel} için *${catLabel}* ürünleri (${found.length} adet):\n\n`;
      else if (vehLabel) r = `🚛 ${vehLabel} ile uyumlu ürünler (${found.length} adet):\n\n`;
      else r = `🔧 ${catLabel} kategorisindeki ürünler:\n\n`;
      r += formatProducts(found, 5);
      // Devam linki
      const moreUrl = cat ? `${SITE}/${cat}` : (veh ? `${SITE}/?veh=${veh}` : `${SITE}/urunler`);
      r += `\n\nTümünü görmek için: ${moreUrl}`;
      r += "\n\nBaşka bir parça mı arıyorsunuz? Adını yazabilirsiniz.";
      return r;
    }
    // Eşleşme yoksa yardımcı yönlendirme
    if (veh && !cat) {
      return `🚛 ${veh.toUpperCase()} için stokta uygun ürün bulamadım. Hangi parça için bakıyorsunuz? Örn: balata, disk, kampana, kaliper, EBS, ABS sensörü...`;
    }
    if (cat && !veh) {
      return `🔧 ${cat.replace(/-/g, " ")} kategorisinde sonuç çıkmadı. Aracınızı söylerseniz (Mercedes, MAN, Volvo, Scania vb.) daha hızlı bulurum.`;
    }
  }

  // 3) Genel ürün araması (SKU / OEM / isim)
  const found = searchProducts(msg, products, { limit: 5 });
  if (found.length > 0) {
    let r = `🔍 "${msg}" için bulduğum ürünler:\n\n`;
    r += formatProducts(found, 5);
    r += "\n\nDetay için ürün linkine tıklayın. Başka bir aramada yardım edeyim mi?";
    return r;
  }

  // 4) Kısa mesaj (tek kelime) → ne aradığını sor
  if (norm.split(/\s+/).length === 1 && norm.length < 4) {
    return `"${msg}" hakkında daha fazla bilgi verir misiniz? Aracınızı, parça adını veya SKU/OEM numarasını yazarsanız size doğru ürünü gösterebilirim.`;
  }

  // 5) Varsayılan — net yönlendirme
  return "Tam olarak anlayamadım 🤔 Size daha hızlı yardım edebilmem için şunlardan birini deneyin:\n\n" +
    "• Aracınız + parça (örn: \"MAN TGA balata\", \"Volvo FH disk\")\n" +
    "• SKU veya OEM numarası (örn: ESD 130 09)\n" +
    "• Kategori adı (balata, disk, kampana, kaliper, EBS, ABS sensörü...)\n" +
    "• \"Kargo\", \"Ödeme\", \"İade\", \"Garanti\" gibi konular\n\n" +
    "Veya direkt arayın: 0545 608 7008  |  WhatsApp: 0850 888 7881  |  info@frenciniz.com";
}
