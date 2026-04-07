// Akıllı kural tabanlı otomatik cevap sistemi
const PRODUCTS = [
  {name:"Kampana Fren Balata Seti",cat:"balata",price:1250,brand:"Knorr-Bremse",stock:24,sku:"KB-BLT-4210",oem:"29108",compat:["Mercedes Actros","MAN TGA/TGS","DAF XF","Volvo FH"]},
  {name:"Hava Kurutucusu Kartuşu",cat:"pnomatik",price:890,brand:"Wabco",stock:18,sku:"WB-HK-3301",oem:"432 410 222 7",compat:["Universal"]},
  {name:"Fren Diski Ø430 Havalandırmalı",cat:"disk",price:3200,brand:"SAF-Holland",stock:7,sku:"SF-DSK-430V",oem:"4079001300",compat:["Mercedes Tourismo","MAN Lion's Coach","Setra 500"]},
  {name:"ABS Sensörü Komple",cat:"elektronik",price:450,brand:"Haldex",stock:35,sku:"HX-ABS-2201",oem:"441 032 578 0",compat:["SAF Dingil","BPW Dingil"]},
  {name:"Fren Kaliperi Sol",cat:"disk",price:2800,brand:"Knorr-Bremse",stock:0,sku:"KB-KLP-L910",oem:"SB/SN 7",compat:["BPW Disk","SAF INTRADISC"]},
  {name:"Körük Tamir Takımı",cat:"suspansiyon",price:680,brand:"ContiTech",stock:42,sku:"CT-KRK-5501",oem:"81.43601.0078",compat:["MAN TGA/TGS/TGX"]},
  {name:"Otomatik Fren Ayar Kolu",cat:"mekanik",price:1100,brand:"Haldex",stock:19,sku:"HX-AYR-7801",oem:"72523",compat:["Mercedes Actros","MAN TGA","DAF CF/XF"]},
  {name:"Fren Kampanası Ø410",cat:"mekanik",price:2450,brand:"BPW",stock:11,sku:"BW-KMP-410",oem:"0310667290",compat:["BPW 12T","SAF 9T/11T"]},
  {name:"Fren Sibop Seti",cat:"pnomatik",price:560,brand:"Wabco",stock:53,sku:"WB-SBP-4400",oem:"961 723 142 0",compat:["Tüm Dorseler"]},
  {name:"Fren Silindir T24",cat:"pnomatik",price:1750,brand:"Knorr-Bremse",stock:15,sku:"KB-SLN-T24",oem:"BS 9404",compat:["Mercedes Actros","MAN TGX","Volvo FH"]},
  {name:"EBS Modülatör Valfı",cat:"elektronik",price:4200,brand:"Wabco",stock:5,sku:"WB-EBS-2210",oem:"480 102 070 0",compat:["Wabco EBS","Dorse EBS"]},
  {name:"Disk Balata Seti Premium",cat:"balata",price:1680,brand:"SAF-Holland",stock:28,sku:"SF-BLT-P770",oem:"3057008400",compat:["SAF INTRADISC","BPW Disk"]},
];

const rules = [
  // Selamlama
  { match: /^(merhaba|selam|hey|sa|slm|mrb|günaydın|iyi günler|iyi akşamlar)/i,
    reply: "Merhaba! Frenciniz'e hoş geldiniz. Size nasıl yardımcı olabilirim? 🙂\n\n• Ürün bilgisi ve fiyat\n• Sipariş takibi\n• Araç uyumu sorgulama\n• Toplu alım teklifi\n• Kargo ve teslimat bilgisi" },

  // Teşekkür
  { match: /^(teşekkür|sağol|eyvallah|tşk|eyv|tesekkur)/i,
    reply: "Rica ederim! Başka bir sorunuz olursa her zaman buradayız. İyi günler! 🙂" },

  // Vedalaşma
  { match: /^(görüşürüz|bye|hoşça|güle güle|bb|iyi günler$|bay bay)/i,
    reply: "İyi günler dileriz! Tekrar bekleriz. 🙂" },

  // Sipariş takibi
  { match: /(sipariş|takip|kargo|nerede|ne zaman gelir|teslim|teslimat)/i,
    reply: "Sipariş takibi için sipariş numaranızı (FRN-XXXX) paylaşır mısınız?\n\nSipariş numaranızı bilmiyorsanız, kayıtlı e-posta adresinize gönderilen onay mailinden bulabilirsiniz.\n\n📦 Kargo süreleri:\n• İstanbul/Ankara/İzmir: 1-2 iş günü\n• Diğer iller: 2-3 iş günü\n• 14:00'a kadar verilen siparişler aynı gün kargoya verilir." },

  // İade
  { match: /(iade|geri göndermek|geri iade|değişim|değiştirmek|ürün geldi ama|hasarlı|bozuk|yanlış)/i,
    reply: "İade ve değişim politikamız:\n\n✅ 14 gün içinde koşulsuz iade hakkı\n✅ Hasarlı/yanlış ürün → ücretsiz iade kargo\n✅ Değişim → yeni ürün aynı gün kargoya verilir\n\nİade başlatmak için sipariş numaranızı paylaşın veya 0850 888 7881'i arayın." },

  // Fiyat / ne kadar
  { match: /(fiyat|kaç lira|kaç tl|ne kadar|ücret|para)/i,
    handler: (msg) => {
      const found = findProducts(msg);
      if (found.length > 0) {
        let reply = "İlgili ürünlerimiz:\n\n";
        found.forEach(p => {
          reply += `• ${p.name} (${p.brand})\n  💰 ₺${p.price.toLocaleString("tr-TR")} ${p.stock > 0 ? "✅ Stokta" : "❌ Tükendi"}\n\n`;
        });
        reply += "Sipariş vermek ister misiniz?";
        return reply;
      }
      return "Hangi ürünün fiyatını öğrenmek istiyorsunuz? Ürün adı, parça kodu veya OEM numarası ile arayabilirim.\n\nÖrnek: \"Balata fiyatı\", \"KB-BLT-4210 fiyat\", \"29108 OEM\"";
    }
  },

  // Stok sorgusu
  { match: /(stok|var mı|mevcut mu|bulunuyor mu|stokta)/i,
    handler: (msg) => {
      const found = findProducts(msg);
      if (found.length > 0) {
        let reply = "";
        found.forEach(p => {
          if (p.stock > 0) {
            reply += `✅ ${p.name} — ${p.stock} adet stokta.\n💰 Fiyat: ₺${p.price.toLocaleString("tr-TR")}\n\n`;
          } else {
            reply += `❌ ${p.name} — şu anda stokta yok.\n🔔 Stok gelince haber vermemizi ister misiniz?\n\n`;
          }
        });
        return reply.trim();
      }
      return "Hangi ürünün stok durumunu kontrol etmemi istersiniz? Ürün adı veya parça kodu yazabilirsiniz.";
    }
  },

  // OEM / parça kodu sorgusu
  { match: /(oem|parça kodu|parça no|part number|referans)/i,
    handler: (msg) => {
      const found = findProducts(msg);
      if (found.length > 0) {
        let reply = "Bulunan ürünler:\n\n";
        found.forEach(p => {
          reply += `• ${p.name}\n  SKU: ${p.sku} | OEM: ${p.oem}\n  Marka: ${p.brand} | ₺${p.price.toLocaleString("tr-TR")}\n  Uyumlu: ${p.compat.join(", ")}\n\n`;
        });
        return reply.trim();
      }
      return "OEM veya parça kodunu yazın, sizin için arayalım.\n\nÖrnek: \"29108\", \"KB-BLT-4210\", \"441 032 578 0\"";
    }
  },

  // Araç uyumu
  { match: /(uyar mı|uyumlu|uygun mu|araca|aracıma|mercedes|man |daf|volvo|scania|iveco|bmc|ford|renault|actros|tga|tgs|tgx|xf|fh|tourismo)/i,
    handler: (msg) => {
      const lower = msg.toLowerCase();
      const vehicles = ["mercedes","actros","man","tga","tgs","tgx","daf","xf","cf","volvo","fh","scania","iveco","bmc","ford","renault","tourismo","setra","bpw","saf"];
      const matchedVehicle = vehicles.find(v => lower.includes(v));
      if (matchedVehicle) {
        const compatible = PRODUCTS.filter(p => p.compat.some(c => c.toLowerCase().includes(matchedVehicle)));
        if (compatible.length > 0) {
          let reply = `🚛 "${matchedVehicle.toUpperCase()}" ile uyumlu ürünlerimiz:\n\n`;
          compatible.forEach(p => {
            reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} ${p.stock > 0 ? "✅" : "❌ Tükendi"}\n`;
          });
          reply += "\nDetay veya sipariş için ürün adını yazın.";
          return reply;
        }
      }
      return "Hangi araç için parça arıyorsunuz? Marka ve modeli yazın, uyumlu ürünleri listeleyelim.\n\nÖrnek: \"Mercedes Actros\", \"MAN TGA\", \"DAF XF\", \"Volvo FH\"";
    }
  },

  // Balata
  { match: /(balata|brake pad|fren balatası)/i,
    handler: () => {
      const balatas = PRODUCTS.filter(p => p.cat === "balata");
      let reply = "🔧 Balata ürünlerimiz:\n\n";
      balatas.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | SKU: ${p.sku}\n  Uyumlu: ${p.compat.join(", ")}\n\n`;
      });
      reply += "Tüm balatalarımız ECE R-90 sertifikalıdır.";
      return reply;
    }
  },

  // Disk
  { match: /(fren diski|disk fren|rotor)/i,
    handler: () => {
      const disks = PRODUCTS.filter(p => p.cat === "disk");
      let reply = "🔧 Disk fren ürünlerimiz:\n\n";
      disks.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | ${p.stock > 0 ? "✅ Stokta" : "❌ Tükendi"}\n\n`;
      });
      return reply.trim();
    }
  },

  // Kampana
  { match: /(kampana|drum|tambur)/i,
    handler: () => {
      const mechs = PRODUCTS.filter(p => p.cat === "mekanik");
      let reply = "🔧 Kampana & mekanik ürünlerimiz:\n\n";
      mechs.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | SKU: ${p.sku}\n\n`;
      });
      return reply.trim();
    }
  },

  // ABS / Elektronik
  { match: /(abs|ebs|sensör|sensor|elektronik|modülatör)/i,
    handler: () => {
      const elecs = PRODUCTS.filter(p => p.cat === "elektronik");
      let reply = "⚡ Elektronik fren ürünlerimiz:\n\n";
      elecs.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | OEM: ${p.oem}\n  Uyumlu: ${p.compat.join(", ")}\n\n`;
      });
      return reply.trim();
    }
  },

  // Pnömatik
  { match: /(pnömatik|pnomatik|hava|kurutucu|sibop|silindir|membran)/i,
    handler: () => {
      const pneus = PRODUCTS.filter(p => p.cat === "pnomatik");
      let reply = "💨 Pnömatik sistem ürünlerimiz:\n\n";
      pneus.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | ${p.stock > 0 ? "✅ Stokta" : "❌ Tükendi"}\n\n`;
      });
      return reply.trim();
    }
  },

  // Toplu alım
  { match: /(toplu|adet|miktar|toptancı|bayi|indirim|iskonto|özel fiyat)/i,
    reply: "Toplu alımlarda özel fiyat uyguluyoruz! 🤝\n\n• 10+ adet: %5 indirim\n• 25+ adet: %10 indirim\n• 50+ adet: Özel teklif\n\nÜrün ve miktar bilgisini paylaşın, size özel teklif hazırlayalım.\n\n📞 Direkt: 0545 608 7008\n✉️ info@frenciniz.com" },

  // Ödeme / Taksit
  { match: /(ödeme|taksit|kredi kartı|havale|eft|kapıda|nakit)/i,
    reply: "💳 Ödeme seçeneklerimiz:\n\n• Kredi kartı — 12 taksit imkanı\n• Havale/EFT — %3 ek indirim\n• Kapıda ödeme (nakit veya kart)\n\n🏦 Desteklenen kartlar: Visa, Mastercard, Troy\n\n500₺ üzeri siparişlerde kargo ücretsiz!" },

  // Kargo
  { match: /(kargo|gönderi|teslimat süresi|kaç günde gelir|ücretsiz kargo)/i,
    reply: "🚚 Kargo bilgileri:\n\n• 14:00'a kadar sipariş → aynı gün kargo\n• İstanbul/Ankara/İzmir: 1-2 iş günü\n• Diğer iller: 2-3 iş günü\n• 500₺ üzeri siparişlerde kargo ücretsiz\n• 500₺ altı kargo ücreti: ₺49.90\n\nAnlaşmalı kargo firması: Aras Kargo" },

  // Garanti / Sertifika
  { match: /(garanti|sertifika|orijinal|kalite|ece|r-90)/i,
    reply: "✅ Kalite garantimiz:\n\n• Tüm ürünler ECE R-90 sertifikalı\n• 2 yıl garanti\n• Orijinal ve eşdeğer parça seçenekleri\n• Her ürün kalite kontrol sürecinden geçer\n• Fatura ile birlikte garanti belgesi" },

  // İletişim
  { match: /(iletişim|telefon|numara|adres|nerede|mail|e-posta|arayabilir|ulaşabilir)/i,
    reply: "📍 İletişim bilgilerimiz:\n\n📞 0850 888 7881\n📱 0545 608 7008 (WhatsApp)\n✉️ info@frenciniz.com\n📍 Hızırbey Mah. 1509 Sok. No:24, Isparta\n\n⏰ Çalışma saatleri: Pzt–Cmt 08:00–18:00" },

  // Çalışma saatleri
  { match: /(çalışma saat|saat kaç|açık mı|kaçta açılıyor|kaçta kapanıyor|hafta sonu)/i,
    reply: "⏰ Çalışma saatlerimiz:\n\n• Pazartesi – Cumartesi: 08:00 – 18:00\n• Pazar: Kapalı\n\nOnline sipariş 7/24 verebilirsiniz!" },

  // Marka sorgusu
  { match: /(knorr|wabco|saf.holland|haldex|bpw|contitech|marka)/i,
    handler: (msg) => {
      const lower = msg.toLowerCase();
      const brands = {"knorr":"Knorr-Bremse","wabco":"Wabco","saf":"SAF-Holland","haldex":"Haldex","bpw":"BPW","contitech":"ContiTech"};
      for (const [key, brand] of Object.entries(brands)) {
        if (lower.includes(key)) {
          const prods = PRODUCTS.filter(p => p.brand === brand);
          if (prods.length > 0) {
            let reply = `🏭 ${brand} ürünlerimiz:\n\n`;
            prods.forEach(p => {
              reply += `• ${p.name}\n  ₺${p.price.toLocaleString("tr-TR")} | SKU: ${p.sku}\n\n`;
            });
            return reply.trim();
          }
        }
      }
      return "Çalıştığımız markalar:\n\n• Knorr-Bremse\n• Wabco\n• SAF-Holland\n• Haldex\n• BPW\n• ContiTech\n• Mercedes OE\n• Vaden\n• Polmo\n\nHangi markanın ürünlerini görmek istersiniz?";
    }
  },

  // Körük
  { match: /(körük|koruk|suspansiyon|süspansiyon)/i,
    handler: () => {
      const sus = PRODUCTS.filter(p => p.cat === "suspansiyon");
      let reply = "🔧 Süspansiyon ürünlerimiz:\n\n";
      sus.forEach(p => {
        reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | SKU: ${p.sku}\n\n`;
      });
      return reply.trim();
    }
  },
];

function findProducts(msg) {
  const lower = msg.toLowerCase();
  return PRODUCTS.filter(p =>
    lower.includes(p.name.toLowerCase()) ||
    lower.includes(p.sku.toLowerCase()) ||
    lower.includes(p.oem.toLowerCase()) ||
    (lower.includes("balata") && p.cat === "balata") ||
    (lower.includes("disk") && p.cat === "disk") ||
    (lower.includes("kampana") && p.cat === "mekanik") ||
    (lower.includes("sensör") && p.cat === "elektronik") ||
    (lower.includes("silindir") && p.name.toLowerCase().includes("silindir")) ||
    (lower.includes("kaliper") && p.name.toLowerCase().includes("kaliper")) ||
    (lower.includes("körük") && p.cat === "suspansiyon") ||
    (lower.includes("sibop") && p.name.toLowerCase().includes("sibop")) ||
    (lower.includes("kurutucu") && p.name.toLowerCase().includes("kurutucu")) ||
    (lower.includes("ayar kolu") && p.name.toLowerCase().includes("ayar kolu")) ||
    (lower.includes("modülatör") && p.name.toLowerCase().includes("modülatör"))
  );
}

export function getSmartReply(message) {
  const msg = message.trim();

  for (const rule of rules) {
    if (rule.match.test(msg)) {
      if (rule.handler) return rule.handler(msg);
      return rule.reply;
    }
  }

  // Ürün arama fallback
  const found = findProducts(msg);
  if (found.length > 0) {
    let reply = "Şu ürünleri buldum:\n\n";
    found.forEach(p => {
      reply += `• ${p.name} (${p.brand})\n  ₺${p.price.toLocaleString("tr-TR")} | ${p.stock > 0 ? "✅ Stokta (" + p.stock + " adet)" : "❌ Tükendi"}\n  SKU: ${p.sku} | OEM: ${p.oem}\n\n`;
    });
    reply += "Detaylı bilgi veya sipariş için yazabilirsiniz.";
    return reply;
  }

  // Varsayılan cevap
  return "Anlayamadım, ama size yardımcı olmak istiyorum! 🙂\n\nŞu konularda yardımcı olabilirim:\n• 🔧 Ürün bilgisi ve fiyat\n• 🚛 Araç uyumu sorgulama\n• 📦 Sipariş takibi\n• 🚚 Kargo bilgisi\n• 💳 Ödeme ve taksit\n• 🤝 Toplu alım teklifi\n\nVeya WhatsApp'tan bize ulaşabilirsiniz: 0545 608 7008";
}
