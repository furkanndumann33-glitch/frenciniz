// Akıllı chat bot — gerçek ürün veritabanıyla çalışır
import fs from "fs";
import path from "path";

let PRODUCTS_CACHE = null;
let CATS_CACHE = null;

function loadProducts() {
  if (PRODUCTS_CACHE) return { products: PRODUCTS_CACHE, cats: CATS_CACHE };
  try {
    const prodPath = path.join(process.cwd(), "public/data/products.json");
    const catPath = path.join(process.cwd(), "public/data/categories.json");
    PRODUCTS_CACHE = JSON.parse(fs.readFileSync(prodPath, "utf8"));
    CATS_CACHE = JSON.parse(fs.readFileSync(catPath, "utf8"));
  } catch (e) {
    PRODUCTS_CACHE = [];
    CATS_CACHE = [];
  }
  return { products: PRODUCTS_CACHE, cats: CATS_CACHE };
}

const VEHICLES = ["mercedes","mersedes","actros","atego","axor","sprinter","man","tga","tgs","tgx","tgm","tgl","daf","xf","cf","lf","volvo","fh","fm","scania","iveco","eurocargo","stralis","trakker","daily","bmc","fatih","ford","cargo","renault","premium","magnum","kerax","isuzu","npr","mitsubishi","canter","bpw","saf","ror","knorr","wabco","dodge","krone","schmitz","setra","otokar"];

function fp(price) {
  return "₺" + Number(price).toLocaleString("tr-TR");
}

function searchProducts(msg, products, limit = 5) {
  const lower = msg.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length >= 2);
  const scored = [];

  for (const p of products) {
    const haystack = [(p.name||""), (p.sku||""), (p.oem||""), (p.brand||""), ...(p.compat||[])].join(" ").toLowerCase();
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score += w.length;
    }
    // Stokta olan bonusu
    if (p.stock > 0) score += 2;
    if (score > 0) scored.push({ p, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.p);
}

function formatProducts(prods, max = 5) {
  let reply = "";
  prods.slice(0, max).forEach(p => {
    const stockInfo = p.stock > 0 ? `✅ Stokta (${p.stock} adet)` : "❌ Tükendi";
    const compat = (p.compat || []).slice(0, 3).join(", ");
    reply += `🔹 *${p.name}*\n`;
    reply += `   ${fp(p.price)} | ${stockInfo}\n`;
    if (p.sku) reply += `   SKU: ${p.sku}\n`;
    if (compat) reply += `   Uyumlu: ${compat}\n`;
    reply += "\n";
  });
  return reply.trim();
}

const rules = [
  // Selamlama
  { match: /^(merhaba|selam|hey|sa|slm|mrb|günaydın|iyi günler|iyi akşamlar|hello|hi)/i,
    reply: "Merhaba! Frenciniz'e hoş geldiniz 👋\n\nSize nasıl yardımcı olabilirim?\n\n🔹 Ürün bilgisi ve fiyat (ürün adı, SKU veya OEM yazın)\n🔹 Araç uyumu (örn: \"Mercedes Actros için balata\")\n🔹 Sipariş takibi (FRN-XXXX)\n🔹 Kargo ve teslimat bilgisi\n🔹 Toplu alım / B2B teklif" },

  // Teşekkür
  { match: /(teşekkür|sağol|eyvallah|tşk|eyv|tesekkur|thanks|thank you)/i,
    reply: "Rica ederim! 🙂 Başka bir sorunuz olursa her zaman buradayım.\n\nGüvenli yolculuklar!" },

  // Vedalaşma
  { match: /^(görüşürüz|bye|hoşça|güle güle|bb|bay bay|iyi günler$)/i,
    reply: "İyi günler! 👋 Tekrar bekleriz.\n\n📞 0850 888 7881 | 📱 0545 608 7008" },

  // Sipariş takibi
  { match: /(FRN-\d+|sipariş.*takip|takip.*sipariş|kargom nerede|siparişim nerede)/i,
    reply: "📦 Sipariş takibi için:\n\n1️⃣ Hesabım > Siparişlerim sayfasından takip edebilirsiniz\n2️⃣ Kargo takip numarası e-postanıza gönderilir\n3️⃣ Aras Kargo üzerinden https://kargotakip.araskargo.com.tr\n\nSorun yaşıyorsanız sipariş numaranızı (FRN-XXXX) paylaşın, hemen kontrol edelim.\n\n📞 Hızlı destek: 0545 608 7008 (WhatsApp)" },

  // İade
  { match: /(iade|geri iade|ürün geldi ama|hasarlı|bozuk|yanlış.*gel|değişim|değiştir)/i,
    reply: "♻️ İade ve Değişim Politikası:\n\n✅ 14 gün içinde koşulsuz iade hakkı\n✅ Hasarlı/yanlış ürün → iade kargo ücreti bize ait\n✅ Kullanılmamış ve orijinal ambalajında olmalı\n✅ Fatura/irsaliye ile birlikte\n\n📋 Nasıl başlatırım?\n1. Hesabım > Siparişlerim > İade Başlat\n2. Veya 0850 888 7881'i arayın\n3. Ya da info@frenciniz.com'a mail atın\n\nİşlem 3-5 iş günü içinde tamamlanır." },

  // Kargo
  { match: /(kargo|gönderi|teslimat|kaç günde|ne zaman gelir|ücretsiz kargo)/i,
    reply: "🚚 Kargo Bilgileri:\n\n⏰ **Sipariş Süresi**\n• 14:00'a kadar → aynı gün kargoya\n• Sonrası → bir sonraki iş günü\n\n📍 **Teslimat Süreleri**\n• İstanbul/Ankara/İzmir: 1-2 iş günü\n• Marmara/Ege: 2-3 iş günü\n• Diğer iller: 2-4 iş günü\n\n💰 **Kargo Ücretleri**\n• 500₺ üzeri → Ücretsiz 🎁\n• 500₺ altı → ₺49.90\n\n🚚 Anlaşmalı: Aras Kargo" },

  // Ödeme (kapıda ödeme kaldırıldı)
  { match: /(ödeme|taksit|kredi kartı|havale|eft|nakit|ne ile ödeme)/i,
    reply: "💳 Ödeme Seçeneklerimiz:\n\n💳 **Kredi / Banka Kartı**\n• Garanti BBVA, PayTR, Param\n• 2-12 taksit imkanı\n• Visa, Mastercard, Troy\n\n🏦 **Havale / EFT**\n• %3 ek indirim\n• Tüm bankalar desteklenir\n• Ödeme sonrası 1 iş günü içinde kargo\n\n🔒 Tüm ödemeler 3D Secure ile korunur.\n500₺ üzeri siparişlerde kargo bedava!" },

  // Garanti
  { match: /(garanti|sertifika|orijinal|kalite|ece|r-90|r90)/i,
    reply: "✅ Kalite Güvencemiz:\n\n🏅 **Sertifikalar**\n• ECE R-90 (AB sertifikası)\n• ISO 9001:2015\n• TSE standartlarına uygun\n\n🛡️ **Garanti Süreleri**\n• Fren diski, kampana: 2 yıl\n• Elektronik parçalar: 1 yıl\n• Aşınan parçalar (balata vb.): 6 ay\n\n📄 Her üründe:\n• Fatura + garanti belgesi\n• Orijinal ambalaj\n• Teknik doküman (gerekirse)" },

  // İletişim
  { match: /(iletişim|telefon|numara|adres|nerede|mail|e-posta|whatsapp|ara)/i,
    reply: "📍 İletişim Bilgilerimiz:\n\n📞 **Telefon**\n• 0850 888 7881 (Sabit)\n• 0545 608 7008 (WhatsApp)\n\n✉️ **E-posta**\n• info@frenciniz.com\n\n📍 **Adres**\nHızırbey Mah. 1509 Sok. No:24\nIsparta / TÜRKİYE\n\n⏰ **Çalışma Saatleri**\nPazartesi – Cumartesi: 08:00 – 18:00\nPazar: Kapalı\n\n🌐 Online sipariş 7/24 açık!" },

  // Çalışma saatleri
  { match: /(çalışma saat|saat kaç|açık mı|kaçta kapanıyor|hafta sonu|pazar)/i,
    reply: "⏰ Çalışma Saatlerimiz:\n\n• **Pazartesi – Cumartesi**: 08:00 – 18:00\n• **Pazar**: Kapalı\n\n🌐 Ancak online siparişler 7/24 açık!\nSiparişlerinizi gece de verebilirsiniz, pazartesi sabah işleme alınır." },

  // Toplu alım / B2B
  { match: /(toplu|bayi|b2b|toptancı|iskonto|özel fiyat|müşteri olmak|üye olmak|kurumsal)/i,
    reply: "🤝 Kurumsal / B2B Müşteriler:\n\n💰 **Kademeli İndirim**\n• 10+ adet: %5 indirim\n• 25+ adet: %10 indirim\n• 50+ adet: Özel teklif\n• 100+ adet: Fabrika fiyatı\n\n📋 **Bayilik İmkanları**\n• İl/ilçe bayiliği\n• Özel fiyat listesi\n• Vadeli satış seçenekleri\n• Teknik destek\n\n📞 Direkt iletişim:\n• 0545 608 7008 (WhatsApp)\n• info@frenciniz.com" },

  // Çalıştığımız markalar (ürün markaları)
  { match: /(hangi marka|marka.*var|marka.*satıyor|markalar nedir|brand)/i,
    handler: () => {
      const { products } = loadProducts();
      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      let reply = "🏭 Ana marka: **Ekersan** (kendi üretimimiz)\n\n";
      reply += "🚛 **Uyumlu araç markaları:**\n";
      reply += "• Mercedes (Actros, Atego, Axor)\n";
      reply += "• MAN (TGA, TGS, TGX)\n";
      reply += "• Volvo (FH, FM)\n";
      reply += "• Scania (P, R, G)\n";
      reply += "• DAF (XF, CF, LF)\n";
      reply += "• Renault (Premium, Magnum, Kerax)\n";
      reply += "• Iveco (Eurocargo, Stralis, Trakker)\n";
      reply += "• Ford Cargo, BMC, Otokar, Isuzu\n";
      reply += "• Dorse: BPW, SAF, ROR, Fruehauf\n\n";
      reply += "Aracınızı yazın, uyumlu ürünleri listeleyeyim.";
      return reply;
    }
  },
];

// Araç markası tespit et ve o markaya uyumlu ürünleri listele
function findByVehicle(msg) {
  const { products } = loadProducts();
  const lower = msg.toLowerCase();
  const matched = VEHICLES.find(v => lower.includes(v));
  if (!matched) return null;

  // Kategori de aranıyor mu?
  const catKeywords = {
    "balata": ["balata"],
    "fren-diski": ["disk", "rotor"],
    "fren-kampanasi": ["kampana", "tambur"],
    "fren-korugu": ["körük", "koruk"],
    "porya": ["porya"],
    "bijon": ["bijon"],
    "kaliper": ["kaliper"],
    "fren-circiri": ["cırcır", "circir"],
    "abs-sensoru-modulu-kablo": ["abs", "sensör"],
    "ebs-modulator": ["ebs"],
    "yay": ["yay"],
  };
  let targetCat = null;
  for (const [cat, kws] of Object.entries(catKeywords)) {
    if (kws.some(k => lower.includes(k))) { targetCat = cat; break; }
  }

  const brandName = matched.charAt(0).toUpperCase() + matched.slice(1);
  let filtered = products.filter(p =>
    (p.compat||[]).some(c => c.toLowerCase().includes(matched))
  );
  if (targetCat) filtered = filtered.filter(p => p.cat === targetCat);

  if (filtered.length === 0) return null;

  let reply = `🚛 **${brandName.toUpperCase()}** için bulduğum ürünler`;
  if (targetCat) reply += ` (${targetCat.replace(/-/g, " ")})`;
  reply += ` (${filtered.length} adet):\n\n`;
  reply += formatProducts(filtered, 5);
  if (filtered.length > 5) reply += `\n\n...ve ${filtered.length - 5} ürün daha. Tümü için sitede kategori veya arama kullanın.`;
  return reply;
}

export function getSmartReply(message) {
  const msg = message.trim();
  const lower = msg.toLowerCase();

  // 1. Kural tabanlı cevaplar
  for (const rule of rules) {
    if (rule.match.test(msg)) {
      if (rule.handler) return rule.handler(msg);
      return rule.reply;
    }
  }

  // 2. Araç markası + kategori sorgusu
  const vehicleReply = findByVehicle(msg);
  if (vehicleReply) return vehicleReply;

  // 3. Ürün arama (SKU, OEM, isim)
  const { products } = loadProducts();
  const found = searchProducts(msg, products, 5);
  if (found.length > 0) {
    let reply = `🔍 "${msg}" için bulduğum ürünler:\n\n`;
    reply += formatProducts(found, 5);
    reply += "\n\nDetay için ürün adına tıklayın veya SKU/OEM numarasını yazın.";
    return reply;
  }

  // 4. Varsayılan
  return "Anlayamadım 🤔 Size nasıl yardımcı olabilirim?\n\n💡 **Şunları deneyebilirsiniz:**\n• Ürün adı, SKU veya OEM yazın\n• Araç markası + parça (örn: \"Mercedes Actros balata\")\n• \"Kargo\", \"Ödeme\", \"İade\" gibi konular\n• \"Toplu alım\" veya \"B2B\"\n\n📞 Direkt destek: 0545 608 7008 (WhatsApp)\n✉️ info@frenciniz.com";
}
