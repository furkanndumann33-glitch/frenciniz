import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from "react";
import { productIdFromRoute, productSeoFaqItems, productSearchDescription, productSearchName, productSearchTitle, productSeoPath, productSeoUrl } from "../shared/product-seo.js";
import { buildOrganizationJsonLd, buildProductJsonLd } from "../shared/structured-data.js";

// ===== TRANSLATIONS =====
const TR = {
  search:"Ürün adı, parça kodu veya OEM ara...",searchBtn:"Ara",cart:"Sepetim",login:"Giriş Yap",favs:"Favoriler",
  home:"Ana Sayfa",products:"Ürünler",brands:"Markalar",contact:"İletişim",about:"Hakkımızda",faq:"SSS",
  addToCart:"Sepete Ekle",outOfStock:"Tükendi",notifyMe:"🔔 Haber Ver",buyAgain:"Tekrar Al",
  heroTitle:"Fren Aksamı Uzmanı",heroDesc:"1.000+ stoklu ağır vasıta fren parçası. OEM/şase ile uyumluluk teyidi.",browseProducts:"Ürünleri İncele",
  byVehicle:"Araç Tipine Göre Alışveriş",bestSellers:"Çok Satanlar",featured:"Öne Çıkanlar",seeAll:"Tümünü Gör →",discounted:"🔥 İndirimli Ürünler",
  sameDay:"Aynı Gün Kargo",sameDayDesc:"14:00'a kadar sipariş",origGuarantee:"Uyumluluk Teyidi",origDesc:"OEM/şase kontrolü",
  installment:"12 Taksit",installmentDesc:"Tüm kredi kartlarına",returnPolicy:"14 Gün İade",returnDesc:"Koşulsuz iade hakkı",
  emptyCart:"Sepetiniz boş",startShopping:"Alışverişe Başla",orderSummary:"Sipariş Özeti",subtotal:"Ara Toplam",shipping:"Kargo",
  free:"Ücretsiz",total:"Toplam",checkout:"Siparişi Tamamla",applyCoupon:"Uygula",couponPlaceholder:"Kupon kodu",
  delivery:"Teslimat",payment:"Ödeme",confirm:"Onay",deliveryInfo:"Teslimat Bilgileri",paymentInfo:"Ödeme Bilgileri",
  confirmOrder:"Siparişi Onayla",orderReceived:"Siparişiniz Alındı!",goHome:"Ana Sayfaya Dön",
  stockAlert:"Bu ürün şu anda stokta yok. Gelince haber verelim mi?",notify:"Haber Ver",
  contactPlaceholder:"E-posta veya telefon numaranız",alertDone:"Kayıt alındı! Stok gelince size haber vereceğiz.",
  recentlyViewed:"Son Görüntülediğiniz Ürünler",frequentlyBought:"🔄 Sık Aldığınız Ürünler",
  allProducts:"Tüm Ürünler",category:"Kategori",vehicleType:"Araç Tipi",brand:"Marka",popularity:"Popülerlik",
  priceLow:"Fiyat: Düşük → Yüksek",priceHigh:"Fiyat: Yüksek → Düşük",noResults:"Ürün bulunamadı",
  description:"Açıklama",techSpecs:"Teknik Özellikler",compatVehicles:"Uyumluluk Adayları",similarProducts:"Benzer Ürünler",
  newsletter:"Bültenimize Abone Olun",newsletterDesc:"Yeni ürünler ve kampanyalar için katılın.",subscribe:"Abone Ol",
  filterTitle:"Filtreler",apply:"Uygula",close:"Kapat",menu:"Menü",
  truck:"Kamyon",trailer:"Tır / Çekici",bus:"Otobüs",semitrailer:"Dorse",allVehicles:"Tüm Araçlar",allBrands:"Tüm Markalar",
  product:"ürün",pieces:"ürün",reviews:"değerlendirme",inStock:"Stokta",
  // Hesap & Kullanıcı
  signIn:"Giriş Yap",signUp:"Kayıt Ol",myOrders:"Siparişlerim",myFavorites:"Favorilerim",myAccount:"Hesabım",
  myAddresses:"Adreslerim",accountDetails:"Hesap Bilgileri",notifications:"Bildirimler",changePassword:"Şifre Değiştir",
  currentPassword:"Mevcut Şifre",newPassword:"Yeni Şifre",minChars:"En az 6 karakter",logout:"Çıkış Yap",
  save:"Kaydet",saved:"Kaydedildi",update:"Güncelle",cancel:"İptal",delete:"Sil",edit:"Düzenle",add:"Ekle",
  // Navigasyon & Footer
  categories:"Kategoriler",companyInfo:"Şirket Bilgileri",shippingPolicy:"Gönderim Politikası",
  returnPolicyPage:"İade Politikası",termsConditions:"Şartlar ve Koşullar",privacyPolicy:"Gizlilik Politikası",
  kvkk:"KVKK Aydınlatma",accessibility:"Erişilebilirlik",allRightsReserved:"Tüm hakları saklıdır.",
  // Ürün Detay
  addedToCart:"Sepete eklendi",stockXItems:"Stokta ({0} adet)",outOfStockFull:"Stok Dışı",
  securePayment:"Ödemeniz 3D Secure ile korunmaktadır.",quantity:"Adet",
  // Sipariş Durumları
  preparing:"Hazırlanıyor",inTransit:"Kargoda",delivered:"Teslim Edildi",cancelled:"İptal",
  // Adres
  newAddress:"Yeni Adres",addNewAddress:"Yeni Adres Ekle",
  // Bildirim Ayarları
  emailNotif:"E-posta Bildirimleri",smsNotif:"SMS Bildirimleri",campaignNotif:"Kampanya Bildirimleri",stockNotif:"Stok Bildirimleri",
  // Para Birimi
  currency:"Para Birimi",
  // Chat
  chatGreeting:"Merhaba! Size nasıl yardımcı olabilirim?",
  // Kupon
  applied:"Uygulandı",
  // Cookie
  cookieText:"Bu siteyi kullanarak",cookieLink:"Gizlilik Politikamızı",cookieAccept:"Kabul Et",
  brakeParts:"Fren Aksamları",
  heavyDuty:"Ağır Vasıta",
};
const EN = {
  search:"Search product, part code or OEM...",searchBtn:"Search",cart:"My Cart",login:"Sign In",favs:"Favorites",
  home:"Home",products:"Products",brands:"Brands",contact:"Contact",about:"About Us",faq:"FAQ",
  addToCart:"Add to Cart",outOfStock:"Sold Out",notifyMe:"🔔 Notify Me",buyAgain:"Reorder",
  heroTitle:"Brake Parts Expert",heroDesc:"1,000+ in-stock heavy-duty brake parts. OEM/chassis fitment verification.",browseProducts:"Browse Products",
  byVehicle:"Shop by Vehicle Type",bestSellers:"Best Sellers",featured:"Featured",seeAll:"See All →",discounted:"🔥 Discounted Products",
  sameDay:"Same Day Shipping",sameDayDesc:"Order before 2 PM",origGuarantee:"Fitment Check",origDesc:"OEM/chassis check",
  installment:"12 Installments",installmentDesc:"All credit cards",returnPolicy:"14 Day Return",returnDesc:"Unconditional return",
  emptyCart:"Your cart is empty",startShopping:"Start Shopping",orderSummary:"Order Summary",subtotal:"Subtotal",shipping:"Shipping",
  free:"Free",total:"Total",checkout:"Complete Order",applyCoupon:"Apply",couponPlaceholder:"Coupon code",
  delivery:"Delivery",payment:"Payment",confirm:"Confirm",deliveryInfo:"Delivery Information",paymentInfo:"Payment Information",
  confirmOrder:"Confirm Order",orderReceived:"Order Received!",goHome:"Go to Home",
  stockAlert:"This product is currently out of stock. Want us to notify you?",notify:"Notify",
  contactPlaceholder:"Your email or phone number",alertDone:"Registered! We'll notify you when in stock.",
  recentlyViewed:"Recently Viewed Products",frequentlyBought:"🔄 Frequently Purchased",
  allProducts:"All Products",category:"Category",vehicleType:"Vehicle Type",brand:"Brand",popularity:"Popularity",
  priceLow:"Price: Low → High",priceHigh:"Price: High → Low",noResults:"No products found",
  description:"Description",techSpecs:"Technical Specs",compatVehicles:"Compatibility Candidates",similarProducts:"Similar Products",
  newsletter:"Subscribe to Newsletter",newsletterDesc:"Join for new products and deals.",subscribe:"Subscribe",
  filterTitle:"Filters",apply:"Apply",close:"Close",menu:"Menu",
  truck:"Truck",trailer:"Tractor",bus:"Bus",semitrailer:"Trailer",allVehicles:"All Vehicles",allBrands:"All Brands",
  product:"product",pieces:"products",reviews:"reviews",inStock:"In Stock",
  // Account & User
  signIn:"Sign In",signUp:"Sign Up",myOrders:"My Orders",myFavorites:"My Favorites",myAccount:"My Account",
  myAddresses:"My Addresses",accountDetails:"Account Details",notifications:"Notifications",changePassword:"Change Password",
  currentPassword:"Current Password",newPassword:"New Password",minChars:"At least 6 characters",logout:"Log Out",
  save:"Save",saved:"Saved",update:"Update",cancel:"Cancel",delete:"Delete",edit:"Edit",add:"Add",
  // Navigation & Footer
  categories:"Categories",companyInfo:"Company Info",shippingPolicy:"Shipping Policy",
  returnPolicyPage:"Return Policy",termsConditions:"Terms & Conditions",privacyPolicy:"Privacy Policy",
  kvkk:"GDPR Disclosure",accessibility:"Accessibility",allRightsReserved:"All rights reserved.",
  // Product Detail
  addedToCart:"Added to cart",stockXItems:"In Stock ({0} items)",outOfStockFull:"Out of Stock",
  securePayment:"Your payment is protected with 3D Secure.",quantity:"Qty",
  // Order Statuses
  preparing:"Preparing",inTransit:"In Transit",delivered:"Delivered",cancelled:"Cancelled",
  // Address
  newAddress:"New Address",addNewAddress:"Add New Address",
  // Notification Settings
  emailNotif:"Email Notifications",smsNotif:"SMS Notifications",campaignNotif:"Campaign Notifications",stockNotif:"Stock Notifications",
  // Currency
  currency:"Currency",
  // Chat
  chatGreeting:"Hello! How can I help you?",
  // Coupon
  applied:"Applied",
  // Cookie
  cookieText:"By using this site you agree to our",cookieLink:"Privacy Policy",cookieAccept:"Accept",
  brakeParts:"Brake Parts",
  heavyDuty:"Heavy Duty",
};
const LANGS = {tr:TR, en:EN};

function metaTrack(eventName, payload = {}, options) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, payload, options);
    }
  } catch(e) {}
}

function metaTrackCustom(eventName, payload = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, payload);
    }
  } catch(e) {}
}

function metaProductPayload(product, qty = 1, category) {
  const id = String(product?.id || product?.sku || "");
  const price = Number(product?.price || 0);
  return {
    content_ids: [id],
    content_type: "product",
    content_name: product?.name || "",
    content_category: category || product?.cat || "agir-vasita-fren",
    currency: "TRY",
    value: price * qty,
    contents: [{ id, quantity: qty, item_price: price }],
  };
}

function metaCartPayload(cartItems) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  return {
    content_ids: items.map(c => String(c.id || c.sku || "")),
    content_type: "product",
    currency: "TRY",
    value: items.reduce((s,c) => s + Number(c.price || 0) * Number(c.qty || 1), 0),
    num_items: items.reduce((s,c) => s + Number(c.qty || 1), 0),
    contents: items.map(c => ({
      id: String(c.id || c.sku || ""),
      quantity: Number(c.qty || 1),
      item_price: Number(c.price || 0),
    })),
  };
}

// ===== CATEGORY EN MAP (by id) =====
const CAT_EN = {
  "all":"All Products",
  "disk":"DISC","fren-diski":"Brake Disc","fren-diski-abs-li":"ABS Brake Disc",
  "kampana":"DRUM","fren-kampanasi":"Brake Drum",
  "balata":"PAD","fren-balatasi":"Brake Pad",
  "fren-pabuclari":"BRAKE SHOES","fren-pabucu":"Brake Shoe","percin":"Rivet",
  "circir":"SLACK ADJUSTER","fren-circiri":"Brake Slack Adjuster","mekanik-fren-circiri":"Manual Slack Adjuster","otomatik-fren-circiri":"Automatic Slack Adjuster",
  "fren-ayar":"BRAKE ADJUSTMENT PARTS","fren-ayar-parcalari":"Brake Adjustment Parts","ayar-kolu-el-fren":"Adjuster Arm / Handbrake","cam-set":"Cam Set (Z-CAM)",
  "kaliper-urunleri":"CALIPER PRODUCTS","kaliper":"Caliper","kaliper-ayar-mekanizmasi":"Caliper Adjuster Mechanism","kaliper-durbun-takimi":"Caliper Guide Pin Kit","kaliper-kilavuz-pim-takimi":"Caliper Guide Pin Kit","kaliper-kapak-conta":"Caliper Cover/Gasket","kaliper-perno-tamir-takimi":"Caliper Pin Repair Kit","kaliper-tamir-seti":"Caliper Repair Set","kaliper-tamir-takimi":"Caliper Repair Kit","kaliper-tamir-takimi-duco":"Caliper R.K. (Duco)","kaliper-tamir-takimi-elsa":"Caliper R.K. (Elsa)","kaliper-tamir-takimi-frenco":"Caliper R.K. (Frenco)","kaliper-tamir-takimi-maxx22":"Caliper R.K. (Maxx22)","kaliper-tamir-takimi-modulx":"Caliper R.K. (Modulx)","kaliper-tamir-takimi-pan":"Caliper R.K. (PAN)","kaliper-tamir-takimi-wabco":"Caliper R.K. (Wabco)","kaliper-toz-lastigi":"Caliper Dust Boot","kizak":"Slider - Carrier","perno":"Pin",
  "fren-korukleri":"BRAKE CHAMBERS","fren-korugu":"Brake Chamber","lastik":"Chamber Boots",
  "bijon-grup":"WHEEL STUDS","bijon":"Wheel Stud","bijon-dps":"Wheel Stud DPS","disk-bijonu-civatasi":"Disc Stud/Bolt","somun-civata":"Nut / Bolt",
  "porya-grup":"HUB","porya":"Hub","rulman":"Bearing","kece":"Seal",
  "sensor-uzatma":"SENSORS & EXTENSIONS","abs-sensoru-modulu-kablo":"ABS Sensor/Module/Cable","ebs-modulator":"EBS Modulator","sensor":"Sensor","elektrik-kablosu":"Electrical Cable",
  "fren-yaylari":"BRAKE SPRINGS","yay":"Spring",
  "susp-korugu":"SUSP. BELLOWS","suspansiyon-korugu":"Suspension Bellows","dingil":"Axle","burc-muylu":"Bushing / Trunnion",
  "diger-parcalar":"OTHER","tamir-takimi":"Repair Kit","volan-debriyaj":"Flywheel / Clutch","camurluk":"Fender","makara":"Pulley","diger":"Other",
};

// Longest-first dictionary for product name translation (TR → EN)
const PROD_TERMS = [
  ["Mekanik Fren Cırcırı","Manual Slack Adjuster"],
  ["Otomatik Fren Cırcırı","Automatic Slack Adjuster"],
  ["Fren Cırcırı","Slack Adjuster"],
  ["Kaliper Tamir Takımı","Caliper Repair Kit"],
  ["Kaliper Tamir Seti","Caliper Repair Set"],
  ["Kaliper Dürbün Takımı","Caliper Guide Pin Kit"],
  ["Kaliper Kilavuz Pim Takimi","Caliper Guide Pin Kit"],
  ["Kaliper Perno Tamir Takımı","Caliper Pin Repair Kit"],
  ["Kaliper Toz Lastiği","Caliper Dust Boot"],
  ["Kaliper Ayar Mekanizması","Caliper Adjuster Mechanism"],
  ["Kompresör Tamir Takımı","Compressor Repair Kit"],
  ["Kompresör Piston","Compressor Piston"],
  ["Kompresör Silindiri","Compressor Cylinder"],
  ["Süspansiyon Körüğü","Suspension Bellows"],
  ["Hortum Adaptörü","Hose Adapter"],
  ["Bağlantı Elemanı","Connector"],
  ["Bağlantı Elemanları","Connectors"],
  ["Röle Ventili","Relay Valve"],
  ["Dağıtıcı Ventil","Distribution Valve"],
  ["Şanzıman Ventili","Transmission Valve"],
  ["Hava Kurutucu","Air Dryer"],
  ["Hava Tüpü","Air Tank"],
  ["ABS Sensörü","ABS Sensor"],
  ["ABS Sensör","ABS Sensor"],
  ["EBS Modülatör","EBS Modulator"],
  ["Elektrik Kablosu","Electrical Cable"],
  ["Fren Diski","Brake Disc"],
  ["Fren Kampanası","Brake Drum"],
  ["Fren Balatası","Brake Pad"],
  ["Fren Pabucu","Brake Shoe"],
  ["Fren Körüğü","Brake Chamber"],
  ["Fren Silindiri","Brake Cylinder"],
  ["Fren Ayar Parçası","Brake Adjustment Part"],
  ["Fren Ayar Parçaları","Brake Adjustment Parts"],
  ["Ayar Kolu","Adjuster Arm"],
  ["El Fren","Handbrake"],
  ["Körük Lastiği","Chamber Boot"],
  ["Tamir Takımı","Repair Kit"],
  ["Tamir Seti","Repair Set"],
  ["Disk Bijonu","Disc Stud"],
  ["Disk Civatası","Disc Bolt"],
  ["Ağır Vasıta","Heavy Duty"],
  ["Stok durumu ve aracınıza uygunluk için lütfen iletişime geçiniz","For stock and vehicle compatibility please contact us"],
  ["Uyumluluk adayı araç markaları","Compatibility candidate brands"],
  ["Ürün Kodu","Product Code"],
  ["OEM No","OEM No"],
  ["Marka","Brand"],
  ["Kaliper","Caliper"],
  ["Kampana","Drum"],
  ["Balata","Pad"],
  ["Pabuç","Shoe"],
  ["Körük","Bellows"],
  ["Kompresör","Compressor"],
  ["Sensör","Sensor"],
  ["Modülatör","Modulator"],
  ["Modül","Module"],
  ["Kablo","Cable"],
  ["Rulman","Bearing"],
  ["Keçe","Seal"],
  ["Porya","Hub"],
  ["Bijon","Wheel Stud"],
  ["Somun","Nut"],
  ["Cıvata","Bolt"],
  ["Civatası","Bolt"],
  ["Perçin","Rivet"],
  ["Perno","Pin"],
  ["Kızak","Slider"],
  ["Taşıyıcı","Carrier"],
  ["Dingil","Axle"],
  ["Burç","Bushing"],
  ["Muylu","Trunnion"],
  ["Valf","Valve"],
  ["Ventil","Valve"],
  ["Filtre","Filter"],
  ["Kartuş","Cartridge"],
  ["Hortum","Hose"],
  ["Nipel","Nipple"],
  ["Rekor","Fitting"],
  ["Volan","Flywheel"],
  ["Debriyaj","Clutch"],
  ["Çamurluk","Fender"],
  ["Makara","Pulley"],
  ["Segman","Ring"],
  ["Silindir","Cylinder"],
  ["Piston","Piston"],
  ["Dorse","Trailer"],
  ["Kamyon","Truck"],
  ["Otobüs","Bus"],
  ["Çekici","Tractor"],
  ["Tır","Tractor"],
  ["Evrensel","Universal"],
  ["Delik","Hole"],
  ["Kanal","Slot"],
  ["Yay","Spring"],
  ["Diski","Disc"],
  ["Disk","Disc"],
  ["Fren","Brake"],
  ["Ön","Front"],
  ["Arka","Rear"],
  ["Sağ","Right"],
  ["Sol","Left"],
  ["Takımı","Kit"],
  ["Takım","Kit"],
  ["Seti","Set"],
  ["Adet","pcs"],
];

function escReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
const PROD_REGEX = new RegExp(PROD_TERMS.map(([t])=>escReg(t)).join("|"),"gi");
const PROD_MAP = {};
PROD_TERMS.forEach(([t,e])=>{PROD_MAP[t.toLowerCase()]=e;});

function translateName(s, lang){
  if (lang !== "en" || !s) return s;
  return s.replace(PROD_REGEX, (m) => {
    const en = PROD_MAP[m.toLowerCase()];
    if (!en) return m;
    if (m === m.toUpperCase()) return en.toUpperCase();
    return en;
  });
}
function translateCat(c, lang){
  if (!c) return c;
  if (lang !== "en") return c.name;
  return CAT_EN[c.id] || translateName(c.name, lang);
}
const SITE_IMAGES = {
  hero: "/img/site/hero-workshop.webp",
  missingProduct: "/img/site/missing-product.webp",
};
const BRAND_LOGO = "/img/site/frenciniz-logo-real.webp?v=1";
const CATEGORY_ACCENTS = {
  "fren-diski": ["#ff6000", "#0ea5e9"],
  "fren-diski-abs-li": ["#ff6000", "#0ea5e9"],
  "fren-kampanasi": ["#f97316", "#facc15"],
  "fren-balatasi": ["#ef4444", "#fb7185"],
  "fren-korugu": ["#06b6d4", "#22c55e"],
  "suspansiyon-korugu": ["#06b6d4", "#a3e635"],
  "kaliper": ["#8b5cf6", "#f97316"],
  "kaliper-tamir-takimi": ["#8b5cf6", "#f97316"],
  "bijon": ["#facc15", "#fb923c"],
  "somun-civata": ["#facc15", "#fb923c"],
  "porya": ["#14b8a6", "#38bdf8"],
};
function productAccent(p) {
  return CATEGORY_ACCENTS[p?.cat] || ["#ff6000", "#0ea5e9"];
}
function productCategoryName(p, lang) {
  const cat = CATS.find(c => c.id === p?.cat);
  return cat ? translateCat(cat, lang) : (p?.cat || "Fren Aksami");
}
function productGroupId(p) {
  const cat = CATS.find(c => c.id === p?.cat);
  return cat?.parent || p?.cat || "fren";
}
function hasRealImg(p){
  const img = String(p?.img || "").toLowerCase();
  return !!(p && img && !img.includes("placehold") && !img.includes("missing-product") && !img.includes("/logo") && !img.includes("logo."));
}
function generatedProductImg(p){
  const id = String(p?.id || "").replace(/[^0-9A-Za-z_-]/g, "");
  return id ? `/img/frenciniz-generated/${id}_frenciniz.webp` : "";
}
function productGalleryImages(p){
  if (hasRealImg(p)) {
    return (Array.isArray(p.images) && p.images.length ? p.images : [p.img_lg || p.img]).filter(Boolean);
  }
  const generated = generatedProductImg(p);
  return generated ? [generated] : [];
}
function prodImg(p){
  return productGalleryImages(p)[0] || SITE_IMAGES.missingProduct;
}
function hasDisplayImg(p){
  return Boolean(productGalleryImages(p).length);
}
function prodDesc(p, lang){
  const base = p?.desc || "";
  if (!hasDisplayImg(p)) {
    const prefix = lang === "en" ? "📸 Image coming soon\n\n" : "📸 Görsel hazırlanıyor\n\n";
    return prefix + base;
  }
  return base;
}

const REPRESENTATIVE_PRODUCT_VISUALS = [
  {match:["fren-diski","disk"], label:"FREN DISKI", detail:"havalandirmali disk", symbol:"D", accent:["#ff6000","#0ea5e9"]},
  {match:["fren-kampanasi","kampana"], label:"KAMPANA", detail:"agir vasita kampana", symbol:"K", accent:["#f97316","#facc15"]},
  {match:["fren-balatasi","balata"], label:"FREN BALATASI", detail:"disk / kampana balata", symbol:"B", accent:["#ef4444","#fb7185"]},
  {match:["fren-korugu"], label:"FREN KORUGU", detail:"servis / imdat korugu", symbol:"FK", accent:["#06b6d4","#22c55e"]},
  {match:["suspansiyon-korugu"], label:"SUSP. KORUGU", detail:"dorse ve cekici korugu", symbol:"SK", accent:["#06b6d4","#a3e635"]},
  {match:["kaliper"], label:"KALIPER", detail:"kaliper ve tamir grubu", symbol:"C", accent:["#8b5cf6","#f97316"]},
  {match:["bijon","somun-civata"], label:"BIJON", detail:"bijon / somun / civata", symbol:"10", accent:["#facc15","#fb923c"]},
  {match:["porya"], label:"PORYA", detail:"teker porya grubu", symbol:"P", accent:["#14b8a6","#38bdf8"]},
  {match:["fren-pabucu"], label:"FREN PABUCU", detail:"pabuc ve balata takimi", symbol:"PB", accent:["#ef4444","#f97316"]},
  {match:["fren-circiri","circir","fren-ayarlayici"], label:"FREN CIRCIRI", detail:"otomatik ayar kolu", symbol:"A", accent:["#f97316","#22c55e"]},
  {match:["abs","ebs","sensor"], label:"ABS / EBS", detail:"sensor ve modul grubu", symbol:"ABS", accent:["#0ea5e9","#8b5cf6"]},
];

function representativeProductMeta(p, lang) {
  const hay = `${p?.cat || ""} ${productGroupId(p)} ${p?.name || ""}`.toLowerCase();
  const found = REPRESENTATIVE_PRODUCT_VISUALS.find(v => v.match.some(m => hay.includes(m)));
  const fallbackAccent = productAccent(p);
  const meta = found || {label: productCategoryName(p, lang).toUpperCase(), detail: "agir vasita fren aksami", symbol: "FR", accent: fallbackAccent};
  return {...meta, accent: meta.accent || fallbackAccent};
}

function RepresentativeProductVisual({p, lang, large=false}) {
  const meta = representativeProductMeta(p, lang);
  const [accentA, accentB] = meta.accent;
  return (
    <div aria-label={lang==="en"?"Representative product visual":"Temsili urun gorseli"} style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:`radial-gradient(circle at 70% 18%, ${accentB}55, transparent 30%), linear-gradient(145deg,#070b13,#111827 58%,#222835)`}}>
      <img src={SITE_IMAGES.missingProduct} alt="" loading="lazy" decoding="async" style={{position:"absolute",inset:"4%",width:"92%",height:"92%",objectFit:"contain",opacity:.23,filter:"grayscale(.25) contrast(1.08) drop-shadow(0 18px 28px rgba(0,0,0,.44))"}} />
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,.1),transparent 38%,rgba(0,0,0,.28))"}} />
      <div style={{position:"relative",width:large?"74%":"78%",aspectRatio:"1 / 1",borderRadius:"50%",border:`2px solid ${accentA}`,boxShadow:`0 0 0 10px ${accentA}18, inset 0 0 32px rgba(255,255,255,.08), 0 22px 50px rgba(0,0,0,.35)`,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle at 50% 44%, rgba(255,255,255,.12), rgba(255,255,255,.02) 52%, ${accentA}22 54%, transparent 57%)`}}>
        <div style={{width:"54%",aspectRatio:"1 / 1",borderRadius:"50%",border:"10px solid rgba(255,255,255,.72)",boxShadow:`0 0 0 8px ${accentB}44`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:large?38:26,fontWeight:950,letterSpacing:0,textShadow:"0 4px 16px rgba(0,0,0,.55)"}}>{meta.symbol}</div>
      </div>
      <div style={{position:"absolute",left:large?22:12,right:large?22:12,bottom:large?20:12,padding:large?"12px 14px":"9px 10px",borderRadius:8,background:"rgba(4,8,15,.78)",border:"1px solid rgba(255,255,255,.12)",backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:large?18:12,fontWeight:950,color:"#fff",lineHeight:1.05,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{meta.label}</div>
            <div style={{fontSize:large?12:9,color:"#cbd5e1",fontWeight:800,marginTop:4,textTransform:"uppercase",letterSpacing:.2}}>{meta.detail}</div>
          </div>
          <span style={{flex:"0 0 auto",fontSize:large?12:9,fontWeight:900,color:"#111",background:`linear-gradient(135deg,${accentA},${accentB})`,padding:large?"6px 8px":"4px 6px",borderRadius:5}}>SKU {p?.sku || "-"}</span>
        </div>
      </div>
    </div>
  );
}

// ===== PRODUCT IMAGES (multiple per product) =====
const PROD_IMAGES = {
  1:["https://placehold.co/600x600/2d1b1b/e8c4c4?text=BALATA%0ASET%C4%B0&font=montserrat","https://placehold.co/600x600/3d2525/e8c4c4?text=BALATA%0A%C3%96N+Y%C3%9CZ&font=montserrat","https://placehold.co/600x600/4d2f2f/e8c4c4?text=BALATA%0AARKA+Y%C3%9CZ&font=montserrat"],
  2:["https://placehold.co/600x600/1a2332/a8c4e0?text=HAVA%0AKURUTUCU&font=montserrat","https://placehold.co/600x600/223044/a8c4e0?text=KURUTUCU%0ADETAY&font=montserrat"],
  3:["https://placehold.co/600x600/1c1c1c/b0b0b0?text=FREN%0AD%C4%B0SK%C4%B0%0A%C3%98430&font=montserrat","https://placehold.co/600x600/282828/b0b0b0?text=D%C4%B0SK%0AYAN+G%C3%96R%C3%9CN%C3%9CM&font=montserrat","https://placehold.co/600x600/333333/b0b0b0?text=D%C4%B0SK%0AHAVALANDIRMA&font=montserrat","https://placehold.co/600x600/222222/b0b0b0?text=D%C4%B0SK%0A%C3%96L%C3%87%C3%9C+DETAY&font=montserrat"],
  4:["https://placehold.co/600x600/0f2618/7bc8a4?text=ABS%0ASENS%C3%96R&font=montserrat","https://placehold.co/600x600/163320/7bc8a4?text=SENS%C3%96R%0AKABLO&font=montserrat"],
  5:["https://placehold.co/600x600/1c1c1c/b0b0b0?text=FREN%0AKAL%C4%B0PER%C4%B0&font=montserrat","https://placehold.co/600x600/282828/b0b0b0?text=KAL%C4%B0PER%0A%C4%B0%C3%87+G%C3%96R%C3%9CN%C3%9CM&font=montserrat","https://placehold.co/600x600/333333/b0b0b0?text=KAL%C4%B0PER%0AMONTAJ&font=montserrat"],
  6:["https://placehold.co/600x600/1a2a2a/80bfbf?text=K%C3%96R%C3%9CK%0ATAKIM&font=montserrat","https://placehold.co/600x600/223535/80bfbf?text=K%C3%96R%C3%9CK%0APAR%C3%87ALAR&font=montserrat"],
  7:["https://placehold.co/600x600/2a2018/d4b896?text=AYAR%0AKOLU&font=montserrat","https://placehold.co/600x600/352a20/d4b896?text=AYAR+KOLU%0AMONTAJ&font=montserrat"],
  8:["https://placehold.co/600x600/2a2018/d4b896?text=KAMPANA%0A%C3%98410&font=montserrat","https://placehold.co/600x600/352a20/d4b896?text=KAMPANA%0A%C4%B0%C3%87+Y%C3%9CZEY&font=montserrat","https://placehold.co/600x600/403025/d4b896?text=KAMPANA%0A%C3%96L%C3%87%C3%9CLER&font=montserrat"],
  9:["https://placehold.co/600x600/1a2332/a8c4e0?text=S%C4%B0BOP%0ASET%C4%B0&font=montserrat","https://placehold.co/600x600/223044/a8c4e0?text=S%C4%B0BOP%0ADETAY&font=montserrat"],
  10:["https://placehold.co/600x600/1a2332/a8c4e0?text=FREN%0AS%C4%B0L%C4%B0ND%C4%B0R%0AT24&font=montserrat","https://placehold.co/600x600/223044/a8c4e0?text=S%C4%B0L%C4%B0ND%C4%B0R%0AMEMBRAN&font=montserrat","https://placehold.co/600x600/2a3855/a8c4e0?text=S%C4%B0L%C4%B0ND%C4%B0R%0ABA%C4%9ELANTI&font=montserrat"],
  11:["https://placehold.co/600x600/0f2618/7bc8a4?text=EBS%0AMOD%C3%9CLAT%C3%96R&font=montserrat","https://placehold.co/600x600/163320/7bc8a4?text=EBS%0ABA%C4%9ELANTI&font=montserrat"],
  12:["https://placehold.co/600x600/2d1b1b/e8c4c4?text=D%C4%B0SK%0ABALATA%0APREM%C4%B0UM&font=montserrat","https://placehold.co/600x600/3d2525/e8c4c4?text=BALATA%0AYAN+G%C3%96R%C3%9CN%C3%9CM&font=montserrat","https://placehold.co/600x600/4d2f2f/e8c4c4?text=BALATA%0AKAL%C4%B0NL%C4%B0K&font=montserrat"],
};

// ===== MOBILE HOOK =====
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [breakpoint]);
  return isMobile;
}

// Ürünler ve kategoriler /data/ klasöründen yüklenir
let PRODUCTS = [];
let CATS = [{id:"all",name:"Tüm Ürünler",parent:null}];

// Görseller artık /public/img altında lokal webp olarak cache'leniyor.
// Vercel statik CDN'den anında servis edilir — sıfır cold start, sıfır proxy.
// Eski S3 URL'leri için fallback olarak wsrv.nl kalır.
function cdnImg(url, w) {
  if (!url || url.includes("placehold")) return url;
  // Lokal /img/* veya /logo* zaten optimize ve cache'li
  if (url.startsWith("/")) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  // Sync henüz çalışmamışsa S3 URL kalır → wsrv.nl ile resize
  const sw = (w && w <= 320) ? 320 : (w && w <= 800) ? 800 : 1200;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${sw}&q=55&af=1&maxage=1y`;
}
function cdnImgFallback(url, w) {
  if (!url || url.includes("placehold")) return url;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const sw = (w && w <= 320) ? 320 : (w && w <= 800) ? 800 : 1200;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${sw}&q=55&af=1&maxage=1y`;
}
// Lokal görsel için srcset gereksiz (browser doğal boyutta servis eder).
// Wsrv.nl URL'leri için 1x/2x srcset üret.
function cdnSrcSet(url, w) {
  if (!url || url.includes("placehold")) return undefined;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return undefined;
  const w1 = (w && w <= 320) ? 320 : 800;
  const w2 = w1 === 320 ? 800 : 1200;
  return `${cdnImg(url, w1)} ${w1}w, ${cdnImg(url, w2)} ${w2}w`;
}
function directImg(url) {
  if (!url || url.includes("placehold")) return url;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return url;
}

// ===== SEO HELPERS =====
const SITE_URL = "https://www.frenciniz.com";
const WHATSAPP_NUMBER = "908508887881";
const ETBIS_SITE_ID = "5a35ae3c-78e1-4f1a-8eec-8884decd2730";
const ETBIS_VERIFY_URL = `https://etbis.ticaret.gov.tr/tr/SiteSorgulamaSonuc?siteId=${ETBIS_SITE_ID}`;
const ETBIS_QR = "/img/site/etbis-qr.png";

function absoluteSiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function waUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function generalWhatsAppUrl(topic = "agir vasita fren parcasi") {
  return waUrl([
    "Merhaba Frenciniz, bugun fiyat/stok ve uyumluluk teyidi almak istiyorum.",
    "Varsa siparisime uygun indirim kuponu hakkinda bilgi rica ederim.",
    `Konu: ${topic}`,
    "OEM/parca kodum:",
    "Arac / sase no:",
    "Eski parca fotografi gonderebilirim.",
    "Bugun teklif rica ederim.",
  ].join("\n"));
}

function compatibilityCheckWhatsAppUrl() {
  return waUrl([
    "Merhaba Frenciniz, parca uyumlulugunu teyit etmek istiyorum.",
    "Varsa siparisime uygun indirim kuponu hakkinda bilgi rica ederim.",
    "Ilgilendigim urun / OEM kodu:",
    "Arac marka-model / sase:",
    "Eski parca fotografini gonderebilirim.",
    "Guncel fiyat ve stok bilgisi rica ederim.",
  ].join("\n"));
}

function productWhatsAppUrl(product, qty = 1) {
  const seoName = productSearchName(product, CATS, 140) || product?.name || "-";
  return waUrl([
    "Merhaba Frenciniz, bu urun icin fiyat, stok ve uyumluluk teyidi istiyorum. Varsa uygun indirim kuponu hakkinda da bilgi rica ederim.",
    `Urun: ${seoName}`,
    `SKU: ${product?.sku || "-"}`,
    `OEM / muadil: ${product?.oem || "-"}`,
    `Adet: ${qty || 1}`,
    "Arac marka/model:",
    "Sase no:",
    `Link: ${product ? productSeoUrl(SITE_URL, product) : `${SITE_URL}/urunler`}`,
  ].join("\n"));
}

function cartWhatsAppUrl(cartItems = [], total = 0, shipping = 0, discount = 0) {
  const items = (cartItems || []).slice(0, 12).map((item, index) => (
    `${index + 1}. ${item.name || "-"} | SKU: ${item.sku || "-"} | Adet: ${item.qty || 1} | Tutar: ${Math.round((Number(item.price) || 0) * (Number(item.qty) || 1))} TL`
  ));
  const grandTotal = Math.max(0, (Number(total) || 0) + (Number(shipping) || 0) - (Number(discount) || 0));
  return waUrl([
    "Merhaba Frenciniz, sepetimdeki urunler icin WhatsApp siparisi/uyumluluk teyidi almak istiyorum.",
    ...items,
    cartItems.length > 12 ? `+ ${cartItems.length - 12} urun daha var.` : "",
    `Sepet ara toplami: ${Math.round(Number(total) || 0)} TL`,
    `Kargo: ${Math.round(Number(shipping) || 0)} TL`,
    discount ? `Indirim: ${Math.round(Number(discount) || 0)} TL` : "",
    `Tahmini toplam: ${Math.round(grandTotal)} TL`,
    `Sepet linki: ${SITE_URL}/cart`,
    "Arac marka/model:",
    "Sase no:",
    "Eski parca/OEM no:",
  ].filter(Boolean).join("\n"));
}

function quickQuoteWhatsAppUrl({product, code, vehicle, phone, note} = {}) {
  const seoName = productSearchName(product, CATS, 140) || product?.name || "-";
  return waUrl([
    "Merhaba Frenciniz, hizli fiyat ve uyumluluk teyidi almak istiyorum. Varsa uygun indirim kuponu hakkinda da bilgi rica ederim.",
    product ? `Urun: ${seoName}` : "",
    product ? `SKU: ${product.sku || "-"}` : "",
    product?.oem ? `OEM / muadil: ${product.oem}` : "",
    `OEM / parca kodu: ${code || "-"}`,
    `Arac marka-model / sase: ${vehicle || "-"}`,
    phone ? `Telefon: ${phone}` : "",
    note ? `Not: ${note}` : "",
    product ? `Link: ${productSeoUrl(SITE_URL, product)}` : `Link: ${SITE_URL}`,
    "Eski parca fotografi gonderebilirim.",
  ].filter(Boolean).join("\n"));
}

function recordLeadEvent(type = "whatsapp", data = {}) {
  if (typeof window === "undefined") return;
  const payload = createLeadPayload(type, data);
  try {
    window.__frencinizLeadHandled = { kind: type, at: Date.now() };
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        event_category: "lead",
        event_label: payload.source,
        value: payload.value,
        currency: "TRY",
      });
      window.gtag("event", `${type}_lead_submit`, {
        event_category: "lead",
        event_label: payload.source,
      });
    }
    if (typeof window.frencinizTrackAdsConversion === "function") {
      window.frencinizTrackAdsConversion(type === "phone" ? "phone" : "lead", {
        value: payload.value,
        category: payload.category || "lead",
      });
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "Contact", {
        content_name: payload.source,
        content_category: payload.category || "lead",
        value: payload.value,
        currency: "TRY",
      });
    }
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/auth/lead", blob)) return;
    }
    fetch("/api/auth/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function createLeadPayload(type = "lead", data = {}) {
  const product = data.product || null;
  return {
    type,
    path: typeof window !== "undefined" ? (window.location.pathname || "/") : "/",
    ref: typeof document !== "undefined" ? (document.referrer || "") : "",
    source: data.source || type,
    href: data.href || "",
    productId: data.productId || product?.id || "",
    sku: data.sku || product?.sku || "",
    category: data.category || product?.cat || "",
    value: Number(data.value || product?.price || 0) || 0,
    items: Number(data.items || 0) || 0,
    contactName: data.contactName || "",
    contactPhone: data.contactPhone || "",
    contactEmail: data.contactEmail || "",
    code: data.code || "",
    vehicle: data.vehicle || "",
    note: data.note || "",
  };
}

async function submitLeadEvent(type = "lead", data = {}) {
  const response = await fetch("/api/auth/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createLeadPayload(type, data)),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || "Talep kaydedilemedi");
  return result;
}

function recordProductAction(type = "add_to_cart", product = {}, data = {}) {
  if (typeof window === "undefined" || !product) return;
  const qty = Math.max(1, Number(data.qty || 1) || 1);
  const payload = {
    type,
    path: window.location.pathname || "/",
    productId: product.id || data.productId || "",
    sku: product.sku || data.sku || "",
    name: productSearchName(product, CATS, 160) || product.name || "",
    category: product.cat || data.category || "",
    qty,
    value: Number(data.value || ((product.price || 0) * qty) || 0) || 0,
  };
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/auth/product-action", blob)) return;
    }
    fetch("/api/auth/product-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function recordFunnelEvent(type, data = {}) {
  if (typeof window === "undefined") return;
  const key = String(data.dedupeKey || data.productId || data.sku || data.cartKey || "session")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  const storageKey = `frenciniz:funnel:${type}:${key}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, new Date().toISOString());
  } catch {}

  const payload = {
    type,
    path: window.location.pathname || "/",
    productId: data.productId || "",
    sku: data.sku || "",
    name: data.name || "",
    category: data.category || "",
    qty: Math.max(1, Number(data.qty || data.items || 1) || 1),
    value: Number(data.value || 0) || 0,
  };
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/auth/product-action", blob)) return;
    }
    fetch("/api/auth/product-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// Keep the home catalogue aligned with the product pages that are actually
// receiving organic traffic. This turns a landing-page visit into another
// relevant internal click instead of sending every visitor back to a generic
// category grid.
const HOME_PRIORITY_PRODUCT_IDS = ["894", "809", "428", "739", "811", "459", "152", "614", "330", "429", "892", "882", "615", "821", "449", "959", "785"];

const HOME_INTENT_LINKS = [
  { href: "/urun/894/21961374-volvo-fh12-fm-fl-suspansiyon-korugu-427803-c-ekersan", title: "21961374 Volvo Suspansiyon Korugu", desc: "Volvo FH/FM icin OEM koduyla aranan komple koruk; stok ve sase teyidi" },
  { href: "/urun/809/ford-cargo-krone-dorse-kogel-dorse-porya-kapagi-eyd-700-08-ekersan", title: "EYD 700 08 Porya Kapagi", desc: "Dorse dingil grubu porya kapagi; olcu, stok ve uyumluluk teyidi" },
  { href: "/urun/428/0003270101-mercedes-travego-tourismo-suspansiyon-korugu-ekersan", title: "0003270101 Mercedes Koruk", desc: "Mercedes ve Setra otobus uygulamalari; OEM ve sase ile uyumluluk kontrolu" },
  { href: "/urun/739/29167-ford-cargo-bpw-dorse-krone-dorse-kogel-dorse-disk-fren-balatasi-pwr-5000-ekersan", title: "29167 PWR-5000 Fren Balatasi", desc: "Knorr-Bremse, BPW ve Fruehauf uygulamalari; olcu ve aks teyidi" },
  { href: "/urun/811/ford-cargo-krone-dorse-kogel-dorse-porya-kapagi-eyd-700-06-ekersan", title: "EYD 700 06 Porya Kapagi", desc: "Dorse ve agir vasita porya kapagi; stok, olcu ve uyumluluk teyidi" },
  { href: "/urun/459/ford-cargo-krone-dorse-kogel-dorse-suspansiyon-korugu-ft-34881-ekersan", title: "FT 34881 Suspansiyon Korugu", desc: "Google'dan talep alan stoklu dorse korugu; kod, olcu ve arac teyidi" },
  { href: "/urun/959/ford-cargo-krone-dorse-kogel-dorse-imdatli-fren-korugu-8120-ekersan", title: "8120 Imdatli Fren Korugu", desc: "Ford Cargo ve dorse uygulamalari; tip, baglanti ve sase teyidi" },
  { href: "/urun/785/4029106300-saf-holland-dorse-abs-sensoru-eyd-91-11-ekersan", title: "4029106300 ABS Sensoru", desc: "SAF ve dorse ABS/EBS sistemi; OEM koduyla uyumluluk kontrolu" },
  { href: "/urun/227/9604210412-mercedes-axor-actros-arocs-fren-diski-ekersan", title: "9604210412 Mercedes Fren Diski", desc: "Axor, Actros ve Arocs icin stoklu fren diski; sase ve aks teyidi" },
  { href: "/urun/138/82db1125aa-ford-cargo-fren-kampanasi-on-esk-040-04-ekersan", title: "82DB1125AA Ford Cargo Kampana", desc: "ESK 040 04 on fren kampanasi; model ve olcu teyidi" },
  { href: "/yay", title: "Ağır Vasıta Fren Yayları", desc: "Dorse, treyler ve kamyon fren yayı seçenekleri; ölçü ve stok teyidi" },
  { href: "/fren-balatasi", title: "Ağır Vasıta Fren Balatası", desc: "Ford Cargo, Mercedes, SAF, BPW ve dorse fren balataları" },
  { href: "/urun/142/fren-kampanasi-kampana-522-profesyonel-f-r-oem-57rs302616ub-esk-030-13-ekersan", title: "57RS302616UB BMC Fren Kampanası", desc: "ESK 030 13 BMC fren kampanası; OEM, ölçü ve stok teyidi" },
  { href: "/urun/422/suspansiyon-korugu-ft-34810-k04f-sku-ft-34810-k04f-ekersan", title: "FT 34810-K04F Süspansiyon Körüğü", desc: "Ford Cargo, Krone ve Kögel dorse süspansiyon körüğü" },
  { href: "/urun/813/ford-cargo-krone-dorse-kogel-dorse-porya-kapagi-eyd-700-03-ekersan", title: "EYD 700 03 Porya Kapağı", desc: "Ford Cargo ve dorse porya kapağı; stok ve uyumluluk teyidi" },
  { href: "/urun/915/komple-koruk-metal-piston-424159-c06-424159-c06-ekersan", title: "424159.C06 Süspansiyon Körüğü", desc: "Komple metal pistonlu körük; araç ve ölçü teyidi" },
  { href: "/urun/86/esc-80422-mercedes-arocs-fren-circiri-sol-ekersan", title: "ESC 80422 Arocs Fren Circiri", desc: "Mercedes Arocs sol fren circiri, stoklu fiyat ve uyumluluk teyidi" },
  { href: "/urun/281/3010097aa-ford-cargo-otokar-sultan-doruk-krone-dorse-fren-diski-abs-li-arka-ekersan", title: "3010097AA ESD 090 09 Fren Diski", desc: "Ford Cargo, Otokar Sultan/Doruk ve Krone dorse ABS'li arka disk" },
  { href: "/urun/452/ford-cargo-krone-dorse-kogel-dorse-suspansiyon-korugu-ft-344183-ekersan", title: "FT 344183 Suspansiyon Korugu", desc: "Ford Cargo, Krone ve Kogel dorse suspansiyon korugu" },
  { href: "/urun/212/2992636-ford-cargo-fren-diski-abs-li-arka-esd-030-17-ekersan", title: "2992636 ESD 030 17 Fren Diski", desc: "Ford Cargo ABS'li arka fren diski, stoklu urun teyidi" },
  { href: "/urun/718/29328-ford-cargo-krone-dorse-kogel-dorse-disk-fren-balatasi-ekersan", title: "29328 PWR-5027 Dorse Balata", desc: "Ford Cargo, Krone ve Kogel dorse disk fren balatasi" },
  { href: "/urun/731/29159-29126-saf-dorse-disk-fren-balatasi-pwr-5009-ekersan", title: "29159 29126 SAF Dorse Balata", desc: "SAF dorse PWR-5009 disk fren balatasi" },
  { href: "/urun/767/9433340945-mercedes-axor-porya-on-esp-01-39-01-ekersan", title: "9433340945 Axor On Porya", desc: "Mercedes Axor on porya ESP.01.39.01 stok ve fiyat" },
  { href: "/urun/322/fc461118ca-ford-cargo-bijon-dps-esb-422-10-ekersan", title: "FC461118CA Ford Cargo Bijon", desc: "Ford Cargo DPS ESB 422 10 bijon, adetli stok" },
  { href: "/ford-cargo-9c46-1125-ab-fren-kampanasi", title: "Ford Cargo 9C46 Kampana", desc: "9C46-1125-AB / ESK 040 12 Ford Cargo kampana" },
  { href: "/daf-cf-xf-99717-bijon", title: "DAF CF XF 99717 Bijon", desc: "DAF CF / XF bijon, somun ve disk civatasi teyidi" },
  { href: "/wabco-4630840410-ebs-dingil-kaldirma-bobini", title: "Wabco 4630840410 EBS", desc: "EBS dingil kaldirma bobini, dorse sistem teyidi" },
  { href: "/tirsan-dorse-orta-yay-27-cm", title: "Tirsan Dorse Orta Yay", desc: "27 cm Sertel tip dorse orta yay ve dingil grubu" },
  { href: "/360573-1414435-fren-kampanasi", title: "360573 Kampana", desc: "360573 / 1414435 fren kampanasi stok ve olcu teyidi" },
  { href: "/axor-1840-balata", title: "Axor 1840 Fren Balatası", desc: "Mercedes Axor 1840 fren balatasi ve pabuc grubu" },
  { href: "/axor-3340-fren-diski", title: "Axor 3340 Fren Diski", desc: "Axor 3340 / 4140 disk, bijon ve kaliper teyidi" },
  { href: "/actros-1840-balata", title: "Actros 1840 Fren Balatası", desc: "Actros 1840 / 1841 fren balatasi aramasi" },
  { href: "/travego-balata", title: "Travego Fren Balatası", desc: "Mercedes Travego otobus fren balatasi ve disk grubu" },
  { href: "/man-40-460-balata", title: "MAN 40.460 Fren Balatası", desc: "MAN TGA / TGS / 40.360 / 40.460 parca teyidi" },
  { href: "/scania-g420-fren-diski", title: "Scania G420 Fren Diski", desc: "Scania G/R seri disk, balata ve kaliper tamir" },
  { href: "/volvo-fh-fren-diski", title: "Volvo FH FM Fren Diski", desc: "Volvo FH / FM disk, kampana ve suspansiyon korugu" },
  { href: "/bpw-dorse-balata", title: "BPW Dorse Fren Balatası", desc: "BPW dorse balata, kampana, porya ve bijon" },
  { href: "/saf-dorse-kampana", title: "SAF Dorse Kampana", desc: "SAF dorse kampana, disk, bijon ve porya" },
  { href: "/ford-fmax-balata", title: "Ford F-Max Fren Balatası", desc: "Ford F-Max balata, disk ve kampana grubu" },
  { href: "/agir-vasita-kaliper-tamir-takimi", title: "Kaliper Tamir Takimi", desc: "Knorr, Wabco, Elsa, PAN ve Maxx22 setleri" },
  { href: "/agir-vasita-suspansiyon-korugu", title: "Suspansiyon Korugu", desc: "Dorse, kamyon ve otobus hava korugu kontrolu" },
  { href: "/daf-xf-balata", title: "DAF XF Fren Balatası", desc: "DAF XF / CF balata, disk ve kampana aramalari" },
  { href: "/axor-2528-balata", title: "Axor 2528 Fren Balatası", desc: "Axor 2528 / 3228 balata ve pabuc aramasi" },
  { href: "/actros-1844-fren-diski", title: "Actros 1844 Fren Diski", desc: "Actros 1841 / 1844 disk, kampana ve bijon" },
  { href: "/travego-15-balata", title: "Travego 15 Fren Balatası", desc: "Travego 15 otobus balata ve koruk grubu" },
  { href: "/man-18-460-balata", title: "MAN 18.460 Fren Balatası", desc: "MAN 18.460 / TGA / TGX fren balatasi" },
  { href: "/man-tgs-fren-circiri", title: "MAN TGS Fren Circiri", desc: "MAN TGS otomatik fren circiri ve ayar kolu" },
  { href: "/volvo-fh13-fren-diski", title: "Volvo FH13 Fren Diski", desc: "Volvo FH12 / FH13 disk ve balata grubu" },
  { href: "/daf-xf-105-balata", title: "DAF XF 105 Fren Balatası", desc: "DAF XF 105 / 106 balata, disk ve kampana" },
  { href: "/renault-premium-balata", title: "Renault Premium Fren Balatası", desc: "Premium / Kerax balata ve kampana aramasi" },
  { href: "/iveco-stralis-fren-diski", title: "Iveco Stralis Fren Diski", desc: "Stralis / Trakker disk, kampana ve bijon" },
  { href: "/bpw-eco-plus-porya-kapagi", title: "BPW Eco Plus Porya", desc: "BPW Eco Plus porya kapagi, rulman ve bijon" },
  { href: "/saf-intradisc-porya-kapagi", title: "SAF Intradisc Porya", desc: "SAF Intradisc porya, disk ve kampana grubu" },
  { href: "/isuzu-novociti-balata", title: "Isuzu NovoCiti Fren Balatası", desc: "NovoCiti / Turkuaz midibus balata aramasi" },
  { href: "/actros-1848-balata", title: "Actros 1848 Fren Balatası", desc: "Actros 1848 / 1851 balata, disk ve kampana" },
  { href: "/arocs-4142-fren-diski", title: "Arocs 4142 Fren Diski", desc: "Arocs 4142 / 4145 disk ve bijon grubu" },
  { href: "/axor-1843-kampana", title: "Axor 1843 Kampana", desc: "Axor 1833 / 1843 kampana ve balata" },
  { href: "/mercedes-o403-balata", title: "Mercedes O403 Fren Balatası", desc: "O403 / O500 otobus balata ve koruk" },
  { href: "/mercedes-o500-fren-korugu", title: "Mercedes O500 Koruk", desc: "O500 otobus fren korugu ve hava korugu" },
  { href: "/man-18-440-balata", title: "MAN 18.440 Fren Balatası", desc: "MAN 18.440 / 18.480 balata aramasi" },
  { href: "/scania-r450-fren-diski", title: "Scania R450 Fren Diski", desc: "Scania R450 / R500 disk ve kampana" },
  { href: "/volvo-fh460-balata", title: "Volvo FH460 Fren Balatası", desc: "Volvo FH460 / FH13 fren balatasi" },
  { href: "/daf-xf-460-balata", title: "DAF XF 460 Fren Balatası", desc: "DAF XF 460 / XF105 / XF106 balata" },
  { href: "/ford-cargo-1846-fren-diski", title: "Ford Cargo 1846 Disk", desc: "Cargo 1846 / 3542 fren diski ve kampana" },
  { href: "/renault-kerax-kampana", title: "Renault Kerax Kampana", desc: "Kerax / Premium kampana ve balata" },
  { href: "/iveco-trakker-fren-diski", title: "Iveco Trakker Disk", desc: "Trakker / Stralis fren diski ve balata" },
  { href: "/bpw-30k-kampana", title: "BPW 30K Kampana", desc: "BPW 30K dorse kampana ve porya" },
  { href: "/saf-intrax-fren-diski", title: "SAF Intrax Fren Diski", desc: "SAF Intrax / Intradisc disk ve balata" },
  { href: "/schmitz-cargobull-balata", title: "Schmitz Fren Balatası", desc: "Schmitz Cargobull dorse balata ve kampana" },
  { href: "/kogel-maxx-balata", title: "Kogel Maxx Fren Balatası", desc: "Kogel dorse balata, disk ve suspansiyon korugu" },
  { href: "/axor-1840-fren-diski", title: "Axor 1840 Fren Diski", desc: "Mercedes Axor 1840 disk, balata ve bijon teyidi" },
  { href: "/axor-1840-kampana", title: "Axor 1840 Kampana", desc: "Axor 1840 kampana, pabuclu fren ve balata" },
  { href: "/axor-1840-bijon", title: "Axor 1840 Bijon", desc: "Mercedes Axor 1840 bijon ve disk civatasi" },
  { href: "/axor-3340-balata", title: "Axor 3340 Fren Balatası", desc: "Axor 3340 / 4140 fren balatasi ve pabuc" },
  { href: "/actros-1848-fren-diski", title: "Actros 1848 Fren Diski", desc: "Actros 1848 / 1851 disk ve kampana grubu" },
  { href: "/tourismo-balata", title: "Tourismo Fren Balatası", desc: "Mercedes Tourismo otobus balata ve disk" },
  { href: "/tourismo-fren-diski", title: "Tourismo Fren Diski", desc: "Tourismo / Tourino otobus fren diski" },
  { href: "/man-fortuna-balata", title: "MAN Fortuna Fren Balatası", desc: "MAN Fortuna otobus balata ve koruk grubu" },
  { href: "/man-40-360-fren-diski", title: "MAN 40.360 Fren Diski", desc: "MAN 40.360 / 40.460 disk ve kampana" },
  { href: "/scania-g420-balata", title: "Scania G420 Fren Balatası", desc: "Scania G420 / G440 balata ve disk" },
  { href: "/daf-cf-bijon", title: "DAF CF Bijon", desc: "DAF CF / XF bijon, somun ve civata" },
  { href: "/bpw-30k-bijon", title: "BPW 30K Bijon", desc: "BPW 30K dorse bijon, somun ve porya" },
  { href: "/saf-intrax-kampana", title: "SAF Intrax Kampana", desc: "SAF Intrax dorse kampana ve disk" },
  { href: "/krone-dorse-kampana", title: "Krone Dorse Kampana", desc: "Krone dorse kampana, bijon ve porya" },
  { href: "/kogel-dorse-fren-diski", title: "Kogel Dorse Fren Diski", desc: "Kogel dorse disk, balata ve koruk" },
];

function HomeIntentLinks({isMobile, lang}) {
  const visibleLinks = HOME_INTENT_LINKS.slice(0, isMobile ? 8 : 16);
  return (
    <section style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"8px 18px 28px":"8px 24px 34px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:14}}>
        <div>
          <div style={{fontSize:12,color:"#16a34a",fontWeight:950,textTransform:"uppercase",letterSpacing:.5}}>{lang==="en"?"Popular searches":"Ziyaretcilerin en cok baktiklari"}</div>
          <h2 style={{fontSize:isMobile?22:28,fontWeight:950,color:"#111827",letterSpacing:0}}>{lang==="en"?"Popular fitment pages":"Model ve parca uyumluluk sayfalari"}</h2>
        </div>
        {!isMobile && <span style={{fontSize:12,color:"#64748b",fontWeight:800}}>OEM / sase / eski parca fotosu ile teyit</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:10}}>
        {visibleLinks.map(item => (
          <a key={item.href} href={item.href} onClick={() => metaTrackCustom("SeoLandingClick", { source: "home_intent_links", href: item.href })}
            style={{display:"block",minHeight:isMobile?84:112,padding:isMobile?13:15,borderRadius:8,border:"1px solid rgba(15,23,42,.1)",background:"linear-gradient(180deg,#ffffff,#f8fafc)",boxShadow:"0 10px 26px rgba(15,23,42,.06)",textDecoration:"none",color:"#111827"}}>
            <div style={{fontSize:15,fontWeight:950,lineHeight:1.25}}>{item.title}</div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.45,marginTop:7}}>{item.desc}</div>
            <div style={{fontSize:12,color:"#ff6000",fontWeight:950,marginTop:10}}>Urunleri gor</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function setMeta(name, content, attr = "name") {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  if (typeof document === 'undefined' || !href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id, data) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`script[data-jsonld="${id}"]`);
  if (data == null) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-jsonld", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function applySEO({title, description, canonical, ogImage, robots, ogType, productData, keywords}) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;
  if (description) {
    setMeta("description", description);
    setMeta("og:description", description, "property");
    setMeta("twitter:description", description);
  }
  if (title) {
    setMeta("og:title", title, "property");
    setMeta("twitter:title", title);
  }
  if (keywords) setMeta("keywords", keywords);
  setMeta("og:type", ogType || "website", "property");
  setLink("canonical", canonical || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : SITE_URL));
  setMeta("og:url", canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL), "property");
  if (ogImage) {
    setMeta("og:image", ogImage, "property");
    setMeta("twitter:image", ogImage);
  }
  setMeta("robots", robots || "index, follow, max-image-preview:large, max-snippet:-1");
  // Product-specific Open Graph (Facebook, WhatsApp, Pinterest önizlemelerinde fiyat/availability gözükür)
  if (productData) {
    setMeta("product:price:amount", String(productData.price), "property");
    setMeta("product:price:currency", "TRY", "property");
    setMeta("product:availability", productData.availability || "in stock", "property");
    if (productData.brand) setMeta("product:brand", productData.brand, "property");
    if (productData.condition) setMeta("product:condition", productData.condition, "property");
    if (productData.retailer_item_id) setMeta("product:retailer_item_id", productData.retailer_item_id, "property");
  } else {
    // Product değilse stale tag'leri temizle
    ["product:price:amount","product:price:currency","product:availability","product:brand","product:condition","product:retailer_item_id"].forEach(n => {
      const el = document.head.querySelector(`meta[property="${n}"]`);
      if (el) el.remove();
    });
  }
}

// Ürün görsellerini arka planda önceden indir (CDN cache'i ısıtır).
// Idle time'da çalışır — first paint'i bloklamaz.
function preloadImages(prods) {
  if (typeof window === 'undefined') return;
  const isMob = window.innerWidth < 768;
  const limit = isMob ? 6 : 12;
  const imgs = prods.filter(p => p.img && !p.img.includes("placehold")).slice(0, limit).map(p => cdnImg(p.img, isMob ? 320 : 320));
  let i = 0;
  function next() {
    if (i >= imgs.length) return;
    const img = new Image();
    img.decoding = "async";
    img.src = imgs[i++];
    img.onload = img.onerror = () => {
      if ('requestIdleCallback' in window) requestIdleCallback(next, {timeout: 1000});
      else setTimeout(next, 16);
    };
  }
  const parallel = isMob ? 1 : 3;
  const start = () => { for (let j = 0; j < parallel; j++) next(); };
  if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout: 2000});
  else setTimeout(start, 300);
}

// Kritik görseller için <link rel=preload> runtime inject — ilk N ürünün
// görseli sayfa parse aşamasından hemen sonra browser tarafından öncelikli
// indirilir. Sayfa değişince temizlenir.
function useCriticalImagePreload(items, count = 2, w = 320) {
  useEffect(() => {
    if (typeof document === 'undefined' || !Array.isArray(items)) return;
    const links = [];
    const slice = items.slice(0, count);
    for (const it of slice) {
      const src = it && it.img;
      if (!src || String(src).includes("placehold")) continue;
      const href = cdnImg(src, w);
      const srcset = cdnSrcSet(src, w);
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      if (srcset) {
        link.setAttribute("imagesrcset", srcset);
        link.setAttribute("imagesizes", `${w}px`);
      }
      link.setAttribute("fetchpriority", "high");
      link.setAttribute("data-critical-img", "1");
      document.head.appendChild(link);
      links.push(link);
    }
    return () => { links.forEach(l => { try { l.remove(); } catch {} }); };
  }, [items, count, w]);
}
// Yardımcı: Grup ID'ye ait tüm alt kategori id'lerini döndür
function getSubCatIds(groupId) {
  return CATS.filter(c => c.parent === groupId).map(c => c.id);
}
// Grup listesi (isGroup:true olanlar)
function getGroups() {
  return CATS.filter(c => c.isGroup);
}
function categoryProductImage(cat) {
  const id = String(cat?.id || cat || "").toLowerCase();
  const ids = new Set(id === "all" ? [] : [id]);
  if (id !== "all") CATS.filter(c => c.parent === id).forEach(c => ids.add(c.id));
  const matches = (p) => {
    if (!hasDisplayImg(p)) return false;
    if (id === "all") return true;
    return ids.has(String(p.cat || "").toLowerCase());
  };
  const found = (PRODUCTS || []).find(p => p.stock > 0 && matches(p)) || (PRODUCTS || []).find(matches);
  return found ? prodImg(found) : "";
}
function categoryVisual(cat) {
  const id = String(cat?.id || cat || "").toLowerCase();
  const withImage = (visual) => ({...visual, img: categoryProductImage(cat)});
  if (id === "all") return withImage({icon:"*", color:"#ff6000", bg:"rgba(255,96,0,.18)"});
  if (id.includes("disk")) return withImage({icon:"D", color:"#ff6000", bg:"rgba(255,96,0,.18)"});
  if (id.includes("kampana")) return withImage({icon:"K", color:"#f97316", bg:"rgba(249,115,22,.18)"});
  if (id.includes("balata") || id.includes("pabuc") || id.includes("percin")) return withImage({icon:"B", color:"#ef4444", bg:"rgba(239,68,68,.18)"});
  if (id.includes("circir") || id.includes("ayar")) return withImage({icon:"C", color:"#facc15", bg:"rgba(250,204,21,.2)"});
  if (id.includes("kaliper") || id.includes("perno") || id.includes("kizak")) return withImage({icon:"P", color:"#8b5cf6", bg:"rgba(139,92,246,.2)"});
  if (id.includes("koruk") || id.includes("lastik")) return withImage({icon:"F", color:"#06b6d4", bg:"rgba(6,182,212,.18)"});
  if (id.includes("bijon") || id.includes("somun") || id.includes("civata")) return withImage({icon:"J", color:"#fbbf24", bg:"rgba(251,191,36,.2)"});
  if (id.includes("porya") || id.includes("rulman") || id.includes("kece")) return withImage({icon:"O", color:"#14b8a6", bg:"rgba(20,184,166,.18)"});
  if (id.includes("sensor") || id.includes("ebs") || id.includes("abs") || id.includes("kablo")) return withImage({icon:"S", color:"#38bdf8", bg:"rgba(56,189,248,.18)"});
  if (id.includes("yay")) return withImage({icon:"Y", color:"#22c55e", bg:"rgba(34,197,94,.18)"});
  if (id.includes("susp") || id.includes("dingil")) return withImage({icon:"R", color:"#a3e635", bg:"rgba(163,230,53,.18)"});
  return withImage({icon:">", color:"#ff6000", bg:"rgba(255,96,0,.16)"});
}
function categoryIdsFor(catId, cats = CATS) {
  const id = String(catId || "all");
  if (id === "all") return [];
  const found = cats.find(c => c.id === id);
  if (found?.isGroup) return cats.filter(c => c.parent === id).map(c => c.id);
  return [id];
}

function topValues(values, limit = 5) {
  const counts = new Map();
  for (const value of values.flat().filter(Boolean)) {
    const clean = String(value).trim();
    const lower = clean.toLowerCase();
    if (!clean || lower === "agir vasita" || lower === "ağır vasıta") continue;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value);
}

const CATEGORY_SALES_COPY = {
  all: { eyebrow: "Tüm ağır vasıta fren aksamı", desc: "Kamyon, tır, otobüs ve dorse için fren diski, kampana, balata, körük, kaliper, bijon ve sensör gruplarında hızlı stok ve uyumluluk teyidi alın.", chips: ["Fren Diski", "Fren Kampanası", "Fren Balatası", "Süspansiyon Körüğü", "Bijon", "Kaliper"] },
  disk: { eyebrow: "Disk fren grubu", desc: "Fren disklerinde OEM, çap, bijon deliği ve aks/dorse uyumunu sipariş öncesi birlikte netleştirelim.", chips: ["Kögel", "Krone", "Mercedes Axor", "BPW", "SAF", "DAF"] },
  kampana: { eyebrow: "Kampana grubu", desc: "Fren kampanası seçiminde ölçü, aks markası ve OEM kodu kritik. Kod veya eski parça fotosu ile hızlı teyit verebiliriz.", chips: ["BPW", "SAF", "Mercedes", "MAN", "Dorse", "Treyler"] },
  balata: { eyebrow: "Balata grubu", desc: "Balata, pabuçlu sistem ve perçinli gruplarda araç tipi, kaliper/kampana ölçüsü ve OEM koduna göre teklif alın.", chips: ["Mercedes", "MAN", "Volvo", "Scania", "DAF", "Iveco"] },
  circir: { eyebrow: "Fren cırcırı grubu", desc: "Mekanik ve otomatik fren cırcırında delik, kanal, sağ-sol ve OEM koduna göre uyumluluk kontrolü yapalım.", chips: ["Mercedes Actros", "Axor", "Atego", "Renault", "MAN", "Volvo"] },
  "bijon-grup": { eyebrow: "Bijon ve somun grubu", desc: "Bijon, somun ve disk civatasında diş ölçüsü, boy ve porya/disk uyumu için parça kodu ile teklif alın.", chips: ["DAF", "ROR", "Meritor", "Mercedes", "MAN", "SAF"] },
  "porya-grup": { eyebrow: "Porya ve rulman grubu", desc: "Porya, rulman ve keçe seçiminde aks markası, rulman ölçüsü ve OEM kodu ile net uyumluluk teyidi alın.", chips: ["BPW", "SAF", "ROR", "Kögel", "Krone", "Dorse"] },
  "kaliper-urunleri": { eyebrow: "Kaliper ve tamir takımı", desc: "Kaliper, perno, kılavuz pim ve tamir setlerinde sistem tipi ve eski parça fotosu ile doğru seti hızlı bulalım.", chips: ["Wabco", "Knorr", "Meritor", "Elsa", "PAN", "Maxx22"] },
  "fren-korukleri": { eyebrow: "Fren körüğü grubu", desc: "Fren körüklerinde T tipi, strok, bağlantı ve araç/dorse uyumu sipariş öncesi teyit edilmelidir.", chips: ["T24", "T30", "T30/30", "Dorse", "Kamyon", "Otobüs"] },
  "fren-pabuclari": { eyebrow: "Fren pabucu grubu", desc: "Pabuç ve perçinli sistemlerde kampana ölçüsü, aks markası ve eski parça fotosu ile doğru ürünü seçin.", chips: ["BPW", "SAF", "Dorse", "Treyler", "Kampana", "Perçin"] },
  "fren-yaylari": { eyebrow: "Fren yayı grubu", desc: "Fren yaylarında set içeriği, pabuç tipi ve aks uyumu için OEM veya eski parça fotoğrafı ile destek alın.", chips: ["BPW", "SAF", "Pabuç", "Kampana", "Dorse", "Treyler"] },
  "sensor-uzatma": { eyebrow: "ABS, EBS ve kablo grubu", desc: "ABS sensörü, EBS modül ve kablolarda soket tipi, kablo boyu ve sistem uyumu kritik. Kodla hızlı teyit alın.", chips: ["ABS Sensörü", "EBS Modül", "Wabco", "Kablo", "Dorse", "Kamyon"] },
  "susp-korugu": { eyebrow: "Süspansiyon körüğü grubu", desc: "Süspansiyon körüğünde kapak tipi, yükseklik, delik ölçüsü ve aks/marka uyumunu sipariş öncesi birlikte netleştirelim.", chips: ["BPW", "SAF", "Krone", "Kögel", "Dorse", "Treyler"] },
};

function categorySalesInfo(catId, catName, items, productList, catList, lang) {
  const id = String(catId || "all");
  const selected = id === "all" ? productList : items;
  const found = catList.find(c => c.id === id);
  const parent = found?.parent ? catList.find(c => c.id === found.parent) : null;
  const copy = CATEGORY_SALES_COPY[id] || CATEGORY_SALES_COPY[parent?.id] || CATEGORY_SALES_COPY.all;
  const productsInScope = Array.isArray(selected) ? selected : [];
  const itemCount = productsInScope.length;
  const stockCount = productsInScope.filter(p => Number(p.stock || 0) > 0).length;
  const missingImages = productsInScope.filter(p => !hasDisplayImg(p)).length;
  const compat = topValues(productsInScope.map(p => p.compat || []), 6);
  const brands = topValues(productsInScope.map(p => p.brand ? [p.brand] : []), 4);
  const chips = [...new Set([...(copy.chips || []), ...compat, ...brands])].slice(0, 8);
  const displayCat = catName || found?.name || "Tüm Ürünler";
  const msg = [
    "Merhaba Frenciniz, kategori için teklif almak istiyorum. Varsa uygun indirim kuponu hakkinda da bilgi rica ederim.",
    `Kategori: ${displayCat}`,
    `Listede görünen ürün sayısı: ${itemCount}`,
    "OEM/parça kodum:",
    "Araç / şase no:",
  ].join("\n");
  return {
    eyebrow: copy.eyebrow,
    title: displayCat,
    desc: copy.desc,
    chips,
    whatsappHref: waUrl(msg),
    stats: [
      { label: lang === "en" ? "Products" : "ürün", value: itemCount },
      { label: lang === "en" ? "In stock" : "stokta", value: stockCount },
      { label: lang === "en" ? "Photo gap" : "görsel eksik", value: missingImages },
      { label: "OEM", value: "teyit" },
    ],
  };
}

const VEHS = [{id:"all",name:"Tüm Araçlar"},{id:"kamyon",name:"Kamyon"},{id:"tir",name:"Tır"},{id:"otobus",name:"Otobüs"},{id:"dorse",name:"Dorse"}];
let BRANDS = ["Ekersan"];
function deriveBrands(prods) {
  const set = new Set();
  for (const p of prods) if (p.brand) set.add(p.brand);
  return [...set].sort();
}

function readJsonStorage(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const Ctx = createContext();
const use$ = () => useContext(Ctx);

export default function App() {
  const isAdminMode = typeof window !== 'undefined' && (window.__ADMIN_MODE__ || new URLSearchParams(window.location.search).get("admin") === "1");
  const initRoute = (() => {
    if (typeof window === 'undefined') return {page: isAdminMode ? "admin-login" : "home", params: {}};
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const params = {};
    for (const [k, v] of search.entries()) params[k] = v;
    if (path === "/odeme-basarili") return {page: "payment-success", params};
    if (path === "/odeme-basarisiz") return {page: "payment-fail", params};
    return {page: isAdminMode ? "admin-login" : "home", params: {}};
  })();
  const [page, setPage] = useState(initRoute.page);
  const [params, setParams] = useState(initRoute.params);
  const [cart, setCart] = useState(() => readJsonStorage("frenciniz_cart", []));
  const [products, setProducts] = useState(PRODUCTS);
  const [cats, setCatsState] = useState(CATS);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Tek source of truth: statik JSON (Vercel CDN cache, anında).
    // sync.py lokalden git push ile günceller, görseller /img/* lokal webp.
    // Cache-bust: her saatlik bucket farklı URL → CDN edge taze çeker
    const cacheBust = Math.floor(Date.now() / 3600000);
    Promise.all([
      fetch(`/data/products.json?v=${cacheBust}`, { cache: "default" }).then(r => r.json()),
      fetch(`/data/categories.json?v=${cacheBust}`, { cache: "default" }).then(r => r.json()),
    ]).then(([p, c]) => {
      PRODUCTS = p;
      CATS = c;
      BRANDS = deriveBrands(p);
      setProducts(p);
      setCatsState(c);
      setDataLoaded(true);
      preloadImages(p);
    }).catch(() => setDataLoaded(true));
  }, []);
  useEffect(() => {
    writeJsonStorage("frenciniz_cart", cart);
  }, [cart]);
  useEffect(() => {
    if (!dataLoaded || !products?.length) return;
    setCart(prev => prev.map(item => {
      const fresh = products.find(product => product.id === item.id);
      return fresh ? {
        ...item,
        name: fresh.name,
        brand: fresh.brand,
        sku: fresh.sku,
        cat: fresh.cat,
        price: fresh.price,
        img: fresh.img,
        stock: fresh.stock,
      } : item;
    }));
  }, [dataLoaded, products]);
  const [favs, setFavs] = useState([]);
  const [viewed, setViewed] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem("frenciniz_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  useEffect(() => {
    try {
      if (user) localStorage.setItem("frenciniz_user", JSON.stringify(user));
      else localStorage.removeItem("frenciniz_user");
    } catch {}
  }, [user]);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.user) {
          setUser(d.user);
          if (d.user.role === "admin") setAdmin(true);
        }
        else if (d && d.user === null) {
          const raw = typeof window !== 'undefined' && localStorage.getItem("frenciniz_user");
          if (raw) { try { localStorage.removeItem("frenciniz_user"); setUser(null); } catch {} }
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);
  const [addresses, setAddresses] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem("frenciniz_addresses");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("frenciniz_addresses", JSON.stringify(addresses)); } catch {}
  }, [addresses]);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponData, setCouponData] = useState(null); // {code, discount, type, minOrder}
  const [couponError, setCouponError] = useState("");
  const [stockAlerts, setStockAlerts] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => [{
    from:"bot",
    text:"Frenciniz’e hoş geldiniz 👋 Aracınıza uygun parçayı bulmamız için marka/model, şase numarası veya OEM kodunu paylaşabilirsiniz.",
    time:new Date().toISOString(),
  }]);
  const [pastOrders, setPastOrders] = useState([]);
  const [lang, setLang] = useState("tr");
  const [curr, setCurr] = useState("TRY"); // TRY, EUR, USD
  const [rates, setRates] = useState({EUR:1,USD:1,TRY:1}); // base=TRY
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [cookieOk, setCookieOk] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("frenciniz_cookie_ok") === "1";
    } catch {
      return false;
    }
  });
  const [socialMedia, setSocialMedia] = useState({facebook:"",instagram:"",twitter:"",youtube:""});
  const isMobile = useIsMobile();
  const t = useCallback((key) => LANGS[lang]?.[key] || key, [lang]);
  useEffect(() => {
    if (!cookieOk) return;
    try { localStorage.setItem("frenciniz_cookie_ok", "1"); } catch {}
  }, [cookieOk]);
  // Döviz kuru ile fiyat formatlama
  const CURR_SYMBOLS = {TRY:"₺",EUR:"€",USD:"$"};
  const fp = useCallback((price) => {
    if (!price) return "";
    const converted = curr === "TRY" ? price : price * rates[curr];
    const symbol = CURR_SYMBOLS[curr] || "₺";
    if (curr === "TRY") return `${symbol}${converted.toLocaleString("tr-TR",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    return `${symbol}${converted.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }, [curr, rates]);

  // Döviz kurlarını çek (başlangıçta ve her 30dk)
  useEffect(() => {
    function fetchRates() {
      fetch("https://api.exchangerate-data.com/latest?base=TRY")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if(d?.rates) setRates({EUR:d.rates.EUR||0.026,USD:d.rates.USD||0.028,TRY:1}); })
        .catch(() => {
          // Fallback: yaklaşık kurlar
          fetch("https://open.er-api.com/v6/latest/TRY")
            .then(r=>r.json())
            .then(d=>{ if(d?.rates) setRates({EUR:d.rates.EUR||0.026,USD:d.rates.USD||0.028,TRY:1}); })
            .catch(()=> setRates({EUR:0.026,USD:0.028,TRY:1}));
        });
    }
    fetchRates();
    const iv = setInterval(fetchRates, 30*60*1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // URL ↔ state dönüşümü
  const buildUrl = useCallback((p, pr={}) => {
    if (p === "home") return "/";
    if (p === "products") {
      if (pr.cat && pr.cat !== "all") return `/${pr.cat}`;
      if (pr.q) return `/?q=${encodeURIComponent(pr.q)}`;
      if (pr.brand) return `/?brand=${encodeURIComponent(pr.brand)}`;
      if (pr.veh) return `/?veh=${encodeURIComponent(pr.veh)}`;
      return "/urunler";
    }
    if (p === "product") {
      const product = pr.product || products.find(item => String(item.id) === String(pr.id));
      return product ? productSeoPath(product) : `/urun/${pr.id}`;
    }
    return `/${p}`;
  }, [products]);

  const parseUrl = useCallback(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    const search = new URLSearchParams(window.location.search);
    if (path === "odeme-basarili") return { page: "payment-success", params: {} };
    if (path === "odeme-basarisiz") return { page: "payment-fail", params: {} };
    if (!path) {
      // Ana sayfa, query ile arama varsa products'a yönlendir
      if (search.get("q") || search.get("brand") || search.get("veh")) {
        return { page: "products", params: {
          q: search.get("q") || undefined,
          brand: search.get("brand") || undefined,
          veh: search.get("veh") || undefined,
        }};
      }
      return { page: "home", params: {} };
    }
    // Statik sayfalar
    const STATIC = ["urunler","contact","about","faq","brands","cart","account","auth","favs","orders","addresses","profile","notifications","change-password","checkout","return-policy","terms","shipping","shipping-policy","privacy","kvkk","accessibility","company","admin","admin-login","admin-panel"];
    if (STATIC.includes(path)) {
      return { page: path === "urunler" ? "products" : path, params: {} };
    }
    // Ürün detay: /urun/123
    const prodMatch = path.match(/^urun\/(.+)$/);
    if (prodMatch) return { page: "product", params: { id: productIdFromRoute(prodMatch[1]) } };
    // Diğer: kategori slug (örn: /disk, /kampana, /fren-diski)
    return { page: "products", params: { cat: path } };
  }, []);

  const pageStateRef = useRef({page, params});
  useEffect(() => { pageStateRef.current = {page, params}; }, [page, params]);

  // Sayfa değiştiğinde trafik takibi (admin/auth sayfalarını izleme)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (page === "admin" || page === "admin-login" || page === "admin-panel") return;
    const path = window.location.pathname;
    const search = window.location.search || "";
    const ref = document.referrer || "";
    fetch("/api/auth/track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, search, ref }),
      keepalive: true,
    }).catch(() => {});
  }, [page, params]);

  const go = useCallback((p, pr={}) => {
    const oldUrl = buildUrl(pageStateRef.current.page, pageStateRef.current.params);
    try { sessionStorage.setItem(`scroll:${oldUrl}`, String(window.scrollY||0)); } catch {}

    setPage(p); setParams(pr);
    const url = buildUrl(p, pr);
    if (window.location.pathname + window.location.search !== url) {
      window.history.pushState({page:p, params:pr}, "", url);
    }

    // Restore scroll if previously saved for new URL, else scroll to top
    setTimeout(() => {
      let saved = null;
      try { saved = sessionStorage.getItem(`scroll:${url}`); } catch {}
      window.scrollTo?.({top: saved !== null ? Number(saved) : 0});
    }, 0);
  }, [buildUrl]);

  // İlk yüklemede URL'i oku
  useEffect(() => {
    const parsed = parseUrl();
    if (parsed.page !== "home" || Object.keys(parsed.params).length > 0) {
      setPage(parsed.page);
      setParams(parsed.params);
    }
  }, []);

  // Geri/ileri butonu — scroll pozisyonunu da geri yükle
  useEffect(() => {
    const onPop = () => {
      const parsed = parseUrl();
      setPage(parsed.page);
      setParams(parsed.params);
      setTimeout(() => {
        const url = buildUrl(parsed.page, parsed.params);
        let saved = null;
        try { saved = sessionStorage.getItem(`scroll:${url}`); } catch {}
        window.scrollTo?.({top: saved !== null ? Number(saved) : 0});
      }, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [parseUrl, buildUrl]);

  // Scroll pozisyonunu sürekli kaydet (sessionStorage, URL bazlı)
  useEffect(() => {
    let timer;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const url = buildUrl(pageStateRef.current.page, pageStateRef.current.params);
        try { sessionStorage.setItem(`scroll:${url}`, String(window.scrollY||0)); } catch {}
      }, 100);
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [buildUrl]);

  const addToCart = useCallback((product, qty=1) => {
    if(!product.stock) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if(existing) return prev.map(c => c.id === product.id ? {...c, qty: c.qty + qty} : c);
      return [...prev, {...product, qty}];
    });
    setToast(product.name);
    setTimeout(() => setToast(null), 4500);
    // Google Ads / GA4 ecommerce event
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'add_to_cart', {
          currency: 'TRY',
          value: (product.price || 0) * qty,
          items: [{
            item_id: product.sku || product.id,
            item_name: product.name,
            item_brand: product.brand || 'Ekersan',
            item_category: product.cat,
            price: product.price,
            quantity: qty
          }]
        });
      }
    } catch(e) {}
    metaTrack('AddToCart', metaProductPayload(product, qty));
    recordProductAction("add_to_cart", product, { qty, value: (product.price || 0) * qty });
  }, []);

  const updateQty = useCallback((id, qty) => setCart(prev => qty < 1 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? {...c, qty} : c)), []);
  const removeItem = useCallback((id) => setCart(prev => prev.filter(c => c.id !== id)), []);
  const toggleFav = useCallback((id, productHint) => setFavs(prev => {
    if (prev.includes(id)) return prev.filter(f => f !== id);
    const product = productHint || products.find(p => p.id === id) || PRODUCTS.find(p => p.id === id);
    if (product) recordProductAction("favorite", product, { qty: 1, value: product.price || 0 });
    return [...prev, id];
  }), [products]);
  const addViewed = useCallback((id) => setViewed(prev => [id, ...prev.filter(v => v !== id)].slice(0, 8)), []);
  const addStockAlert = useCallback((productId, contact) => {
    setStockAlerts(prev => [...prev, {productId, contact, date: new Date()}]);
  }, []);
  const completePurchase = useCallback(() => {
    const total = cart.reduce((s,c) => s + (c.price||0)*(c.qty||1), 0);
    const txnId = 'order_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    setPastOrders(prev => {
      const newItems = cart.map(c => ({id:c.id, name:c.name, brand:c.brand, sku:c.sku, price:c.price, img:c.img, qty:c.qty, date:new Date()}));
      return [...newItems, ...prev].slice(0, 20);
    });
    // Google Ads / GA4 purchase conversion event
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function' && cart.length > 0) {
        window.gtag('event', 'purchase', {
          transaction_id: txnId,
          value: total,
          currency: 'TRY',
          shipping: total >= 3000 ? 0 : 150,
          tax: 0,
          items: cart.map(c => ({
            item_id: c.sku || c.id,
            item_name: c.name,
            item_brand: c.brand || 'Ekersan',
            item_category: c.cat,
            price: c.price,
            quantity: c.qty
          }))
        });
        if (window.frencinizTrackAdsConversion) {
          window.frencinizTrackAdsConversion('purchase', {
            value: total,
            currency: 'TRY',
            transaction_id: txnId,
            label: 'checkout_complete'
          });
        }
      }
    } catch(e) {}
    if (cart.length > 0) {
      metaTrack('Purchase', metaCartPayload(cart), { eventID: txnId });
    }
  }, [cart]);

  const cartCount = cart.reduce((s,c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s,c) => s + c.price * c.qty, 0);
  const discount = (() => {
    if (!couponApplied || !couponData) return 0;
    if (couponData.minOrder && cartTotal < couponData.minOrder) return 0;
    if (couponData.type === "₺") return Math.min(Math.round(couponData.discount), cartTotal);
    return Math.round(cartTotal * (Number(couponData.discount) || 0) / 100);
  })();

  // ===== SEO: sayfa değiştiğinde meta + JSON-LD güncelle =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const baseTitle = "Frenciniz - Ağır Vasıta Fren Aksamı | 0545 608 7008";
    const baseDesc = "Kamyon, tır, otobüs ve dorse için fren diski, balata, kampana, kaliper, EBS modülatör ve ABS sensörü. 1000+ ürün, OEM/şase ile uyumluluk teyidi, aynı gün kargo, 12 taksit, 14 gün iade. Tel: 0545 608 7008 · WhatsApp: 0850 888 7881.";
    const baseImg = `${SITE_URL}/img/site/frenciniz-logo-real-og.jpg`;
    const currentDocumentCanonical = `${SITE_URL}${window.location.pathname}`;

    // Doğrudan açılan ürün sayfasında sunucunun hazırladığı şemayı koru.
    // SPA ile başka URL'ye geçildiyse eski sayfanın sunucu şemalarını temizle.
    document.querySelectorAll('script[data-server-jsonld][data-server-canonical]').forEach(el => {
      if (el.getAttribute('data-server-canonical') !== currentDocumentCanonical) el.remove();
    });

    // Önceki sayfa-spesifik JSON-LD'yi temizle
    setJsonLd("page-product", null);
    setJsonLd("page-itemlist", null);
    setJsonLd("page-breadcrumb", null);
    setJsonLd("page-faq", null);
    setJsonLd("page-organization", null);
    setJsonLd("page-organization", buildOrganizationJsonLd(SITE_URL));

    let title = baseTitle, desc = baseDesc, canonical = `${SITE_URL}${window.location.pathname}`, img = baseImg, robots;
    let ogType = "website", productData = null, keywords = null;

    if (page === "home") {
      title = baseTitle;
      desc = baseDesc;
      canonical = `${SITE_URL}/`;
      // Homepage ItemList — popüler/öne çıkan ürünler — Google'a "bu site bu ürünleri öne çıkarıyor" sinyali
      const priorityProds = HOME_PRIORITY_PRODUCT_IDS
        .map(id => (products || []).find(p => String(p.id) === String(id)))
        .filter(Boolean);
      const featuredProds = [
        ...priorityProds,
        ...(products || []).filter(p => p.stock > 0 && p.img && !p.img.includes("placehold")),
      ]
        .filter((p, index, list) => list.findIndex(item => String(item.id) === String(p.id)) === index)
        .slice(0, 12);
      if (featuredProds.length) {
        setJsonLd("page-itemlist", {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Frenciniz Öne Çıkan Ürünler",
          "numberOfItems": featuredProds.length,
          "itemListElement": featuredProds.map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": productSeoUrl(SITE_URL, p),
            "item": buildProductJsonLd(p, cats, {
              site: SITE_URL,
              url: productSeoUrl(SITE_URL, p),
              images: [absoluteSiteUrl(cdnImg(p.img, 400))],
              includeContext: false,
            }),
          })),
        });
      }
      setJsonLd("page-breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Frenciniz", "item": `${SITE_URL}/`},
        ],
      });
      setJsonLd("page-faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Frenciniz hangi araclar icin fren parcasi satar?",
            "acceptedAnswer": {"@type": "Answer", "text": "Frenciniz kamyon, tir, cekici, otobus, dorse ve treyler icin fren diski, kampana, balata, kaliper, bijon, porya, fren korugu ve suspansiyon korugu urunleri satar."}
          },
          {
            "@type": "Question",
            "name": "OEM kodu veya sase ile uyumluluk teyidi yapiliyor mu?",
            "acceptedAnswer": {"@type": "Answer", "text": "Evet. Musteri OEM kodu, parca kodu, sase bilgisi veya eski parca fotografini WhatsApp hattina gondererek stok ve uyumluluk teyidi alabilir."}
          },
          {
            "@type": "Question",
            "name": "Ayni gun kargo var mi?",
            "acceptedAnswer": {"@type": "Answer", "text": "Stoklu urunlerde kargo saatine gore ayni gun cikis yapilabilir. 3000 TL uzeri siparislerde standart kargo ucretsizdir."}
          }
        ],
      });
    } else if (page === "products") {
      const cat = params?.cat ? cats.find(c => c.id === params.cat) : null;
      const catName = cat ? (cat.name || params.cat) : null;
      if (catName) {
        // Kategorideki ürünleri filtrele
        const subCatIds = cat.isGroup ? cats.filter(c => c.parent === cat.id).map(c => c.id) : [cat.id];
        const inCat = (products || []).filter(p => subCatIds.includes(p.cat));
        const count = inCat.length;
        const brandsInCat = [...new Set(inCat.map(p => p.brand).filter(Boolean))].slice(0, 5);

        title = `${catName} | ${count > 0 ? `${count} Ürün` : "Tüm Ürünler"} - Ağır Vasıta Fren Aksamı | Frenciniz`;
        desc = `${catName}: ${count} adet orijinal/eşdeğer ürün. ${brandsInCat.length ? brandsInCat.join(", ") + ". " : ""}OEM/parça kodu veya şase ile uyumluluk teyidi yapılır. 3000₺ üzeri ücretsiz kargo, 12 taksit, 14 gün iade. Tel: 0545 608 7008.`.slice(0, 300);
        canonical = `${SITE_URL}/${cat.id}`;
        keywords = [catName, ...brandsInCat, "fren aksamı", "ağır vasıta yedek parça", "OEM parça kodu", "şase ile uyumluluk", "kamyon", "tır", "otobüs", "dorse", "Mercedes Actros", "MAN TGA", "Volvo FH", "Scania", "DAF", "BPW", "SAF", "Ekersan", "Frenciniz"].join(", ");

        // ItemList JSON-LD (ilk 20 ürün)
        const sample = inCat.slice(0, 20);
        if (sample.length) {
          setJsonLd("page-itemlist", {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": catName,
            "numberOfItems": count,
            "itemListElement": sample.map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": productSeoUrl(SITE_URL, p),
              "item": buildProductJsonLd(p, cats, {
                site: SITE_URL,
                url: productSeoUrl(SITE_URL, p),
                images: [absoluteSiteUrl(cdnImg(prodImg(p), 400))],
                categoryName: catName,
                includeContext: false,
              }),
            })),
          });
        }

        // BreadcrumbList: Ana Sayfa > [Üst grup] > Kategori
        const grp = cat.parent ? cats.find(c => c.id === cat.parent) : null;
        const crumbs = [{ name: "Ana Sayfa", url: `${SITE_URL}/` }];
        if (grp) crumbs.push({ name: grp.name, url: `${SITE_URL}/${grp.id}` });
        crumbs.push({ name: cat.name, url: canonical });
        setJsonLd("page-breadcrumb", {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": crumbs.map((c, i) => ({
            "@type": "ListItem", "position": i + 1, "name": c.name, "item": c.url,
          })),
        });
      } else if (params?.q) {
        title = `"${params.q}" arama sonuçları - Frenciniz`;
        desc = `"${params.q}" için Frenciniz fren aksamı ürün sonuçları.`;
        robots = "noindex, follow";
      } else if (params?.brand) {
        title = `${params.brand} fren aksamı ürünleri - Frenciniz`;
        desc = `${params.brand} marka fren diski, balata, kampana ve kaliper ürünlerinde OEM/parça kodu veya şase ile uyumluluk teyidi.`;
        canonical = `${SITE_URL}/?brand=${encodeURIComponent(params.brand)}`;
      } else if (params?.veh) {
        const vname = ({kamyon:"Kamyon",tir:"Tır",otobus:"Otobüs",dorse:"Dorse"})[params.veh] || params.veh;
        title = `${vname} fren aksamı - Frenciniz`;
        desc = `${vname} için fren diski, balata, kampana ve diğer fren parçaları.`;
        canonical = `${SITE_URL}/?veh=${encodeURIComponent(params.veh)}`;
      } else {
        title = "Tüm ürünler - Frenciniz";
        desc = "Frenciniz'deki tüm fren aksamı ve ağır vasıta yedek parça ürünleri.";
        canonical = `${SITE_URL}/urunler`;
      }
    } else if (page === "product") {
      const p = products.find(x => x.id === params?.id);
      if (p) {
        const sub = cats.find(c => c.id === p.cat);
        const seoName = productSearchName(p, cats, 140);
        title = productSearchTitle(p, cats, 74);
        const compatStr = (p.compat || []).slice(0, 4).join(", ");
        const catName = sub ? sub.name : "fren aksamı";
        desc = productSearchDescription(p, cats, 300);
        canonical = productSeoUrl(SITE_URL, p);
        const productImageList = (productGalleryImages(p).length ? productGalleryImages(p) : [SITE_IMAGES.missingProduct])
          .filter(Boolean)
          .map(src => absoluteSiteUrl(cdnImg(src, 800)));
        const productImg = productImageList[0] || baseImg;
        img = productImg;

        // Per-product keyword genişletmesi (long-tail için)
        const kwParts = [
          seoName, p.name, p.brand, p.sku, p.oem, catName,
          ...(p.compat || []).slice(0, 6),
          "fren aksamı", "ağır vasıta yedek parça", "kamyon", "tır", "otobüs", "dorse",
          "OEM", "şase ile uyumluluk", "Frenciniz", "orijinal", "eşdeğer"
        ].filter(Boolean);
        keywords = [...new Set(kwParts)].join(", ");
        ogType = "product";
        productData = {
          price: p.price,
          availability: p.stock > 0 ? "in stock" : "out of stock",
          brand: p.brand || "Ekersan",
          condition: "new",
          retailer_item_id: p.sku || p.id
        };
        // GA4 / Google Ads view_item event
        try {
          if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('event', 'view_item', {
              currency: 'TRY',
              value: p.price,
              items: [{
                item_id: p.sku || p.id,
                item_name: seoName || p.name,
                item_brand: p.brand || 'Ekersan',
                item_category: catName,
                price: p.price
              }]
            });
          }
        } catch(e) {}

        // Bir sonraki yıla kadar geçerli fiyat (Google rich result REQ)
        metaTrack('ViewContent', metaProductPayload(p, 1, catName));
        const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        // Doğrudan URL açılışında sunucu Product şeması zaten mevcut.
        // SPA geçişlerinde ise istemci şeması oluşturulur.
        const hasServerProductSchema = Array.from(
          document.querySelectorAll('script[data-server-jsonld="product"]')
        ).some(el => el.getAttribute('data-server-canonical') === canonical);
        if (!hasServerProductSchema) {
          setJsonLd("page-product", buildProductJsonLd(p, cats, {
            site: SITE_URL,
            url: canonical,
            images: productImageList,
            categoryName: catName,
            priceValidUntil,
          }));
        }

        // Breadcrumb JSON-LD
        const grp = sub?.parent ? cats.find(c => c.id === sub.parent) : null;
        const crumbs = [{ name: "Ana Sayfa", url: `${SITE_URL}/` }];
        if (grp) crumbs.push({ name: grp.name, url: `${SITE_URL}/${grp.id}` });
        if (sub) crumbs.push({ name: sub.name, url: `${SITE_URL}/${sub.id}` });
        crumbs.push({ name: seoName || p.name, url: canonical });
        const hasServerBreadcrumbSchema = Array.from(
          document.querySelectorAll('script[data-server-jsonld="breadcrumb"]')
        ).some(el => el.getAttribute('data-server-canonical') === canonical);
        if (!hasServerBreadcrumbSchema) {
          setJsonLd("page-breadcrumb", {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": crumbs.map((c, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": c.name,
              "item": c.url
            }))
          });
        }
      }
    } else if (page === "contact") { title = "İletişim - Frenciniz"; desc = "Frenciniz iletişim: 0545 608 7008 (Tel), 0850 888 7881 (WhatsApp), info@frenciniz.com. Isparta merkez."; canonical = `${SITE_URL}/contact`; }
    else if (page === "about") {
      title = "Hakkımızda — Frenciniz Dumanlar Ticaret | Isparta Fren Aksamı";
      desc = "Frenciniz (Dumanlar Ticaret) — Isparta merkezli ağır vasıta fren aksamı uzmanı. Ekersan ve muadil ürünlerde OEM/şase ile uyumluluk teyidi, 1000+ stoklu ürün, aynı gün kargo, 12 taksit, 14 gün iade.";
      canonical = `${SITE_URL}/about`;
      setJsonLd("page-organization", {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Frenciniz",
        "alternateName": "Dumanlar Ticaret",
        "url": SITE_URL,
        "logo": `${SITE_URL}/img/site/frenciniz-logo-real.png`,
        "description": "Kamyon, tır, otobüs ve dorse için ağır vasıta fren aksamı satışı. 1000+ orijinal/eşdeğer parça ve OEM/şase ile uyumluluk teyidi.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Hızırbey Mah. 1509 Sok. No:24",
          "addressLocality": "Isparta",
          "addressRegion": "Isparta",
          "addressCountry": "TR",
        },
        "contactPoint": [
          {"@type": "ContactPoint", "telephone": "+90-545-608-7008", "contactType": "customer service", "areaServed": "TR", "availableLanguage": ["Turkish"]},
          {"@type": "ContactPoint", "telephone": "+90-850-888-7881", "contactType": "sales", "areaServed": "TR"},
        ],
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61573354240573",
          "https://www.instagram.com/frenciniz.co"
        ],
      });
    }
    else if (page === "faq") {
      title = "Sıkça Sorulan Sorular - Frenciniz | Tel: 0545 608 7008";
      desc = "Kargo süresi, ödeme, iade, garanti, taksit ve ürün uyumluluğu hakkında sıkça sorulan sorular. Tel: 0545 608 7008 · WhatsApp: 0850 888 7881.";
      canonical = `${SITE_URL}/faq`;
      const faqList = [
        {q:"Kargo süresi nedir?",a:"14:00'a kadar verilen siparişler aynı gün kargoya verilir. Aras Kargo ile gönderim yapılır."},
        {q:"Ürünler orijinal mi?",a:"Orijinal ve eşdeğer parça seçenekleri sunuyoruz; üretici/sertifika bilgisi ürün bazında OEM kodu, ambalaj ve stok kaydıyla teyit edilir."},
        {q:"İade yapabilir miyim?",a:"Kullanılmamış ürünler 14 gün içinde koşulsuz iade edilebilir. Hasarlı/yanlış üründe kargo ücreti tarafımıza aittir."},
        {q:"Toplu alım için teklif alabilir miyim?",a:"Evet. Adet, araç listesi ve OEM/parça kodlarını ileterek B2B teklif isteyebilirsiniz. Güncel fiyat için 0545 608 7008 numaralı telefondan ulaşabilirsiniz."},
        {q:"Taksit yapılıyor mu?",a:"Tüm kredi kartlarına 12 taksit imkânı mevcuttur. PayTR güvenli ödeme altyapısı kullanılır."},
        {q:"Ürün aracıma uyar mı?",a:"Ürün sayfasında uyumluluk adayları ve OEM referansları yer alır. Kesin sipariş öncesi şase numarası, eski parça fotoğrafı veya OEM koduyla 0545 608 7008'den teyit alabilirsiniz."},
        {q:"Kargo ücreti ne kadar?",a:"3000₺ altı siparişlerde 150₺, 3000₺ üzeri siparişlerde ücretsiz kargo."},
      ];
      setJsonLd("page-faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqList.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      });
    }
    else if (page === "brands") { title = "Markalar - Frenciniz"; desc = "Frenciniz'in çalıştığı marka ve uyumlu araçlar."; canonical = `${SITE_URL}/brands`; }
    else if (page === "shipping" || page === "shipping-policy") { title = "Kargo ve Teslimat - Frenciniz"; desc = "Aras Kargo ile aynı gün gönderim. 3000₺ üzeri ücretsiz kargo, altı 150₺."; canonical = `${SITE_URL}/shipping`; }
    else if (page === "return-policy") { title = "İade Politikası - Frenciniz"; desc = "14 gün koşulsuz iade hakkı. Hasarlı/yanlış üründe kargo ücreti bize ait."; canonical = `${SITE_URL}/return-policy`; }
    else if (page === "terms") { title = "Şartlar ve Koşullar - Frenciniz"; canonical = `${SITE_URL}/terms`; }
    else if (page === "privacy") { title = "Gizlilik Politikası - Frenciniz"; canonical = `${SITE_URL}/privacy`; }
    else if (page === "kvkk") { title = "KVKK Aydınlatma Metni - Frenciniz"; canonical = `${SITE_URL}/kvkk`; }
    else if (page === "cart" || page === "checkout" || page === "account" || page === "auth" || page === "favs" || page === "orders" || page === "admin" || page === "admin-login" || page === "admin-panel" || page === "payment-success" || page === "payment-fail") {
      robots = "noindex, nofollow";
      title = `${page} - Frenciniz`;
      // Begin checkout / view cart events
      try {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function' && cart.length > 0) {
          const evt = page === "checkout" ? "begin_checkout" : (page === "cart" ? "view_cart" : null);
          if (evt) {
            window.gtag('event', evt, {
              currency: 'TRY',
              value: cart.reduce((s,c) => s + (c.price||0)*(c.qty||1), 0),
              items: cart.map(c => ({
                item_id: c.sku || c.id,
                item_name: c.name,
                item_brand: c.brand || 'Ekersan',
                item_category: c.cat,
                price: c.price,
                quantity: c.qty
              }))
            });
          }
        }
      } catch(e) {}
      if (cart.length > 0) {
        const metaPayload = metaCartPayload(cart);
        if (page === "checkout") metaTrack('InitiateCheckout', metaPayload);
        else if (page === "cart") metaTrackCustom('ViewCart', metaPayload);
      }
    }

    applySEO({ title, description: desc, canonical, ogImage: img, robots, ogType, productData, keywords });
  }, [page, params, products, cats]);

  const isAdminPage = page === "admin" || page === "admin-login" || page === "admin-panel";
  const ctx = useMemo(() => ({page, params, go, cart, addToCart, updateQty, removeItem, cartCount, cartTotal, q, setQ, favs, toggleFav, viewed, addViewed, user, setUser, addresses, setAddresses, coupon, setCoupon, couponApplied, setCouponApplied, couponData, setCouponData, couponError, setCouponError, discount, stockAlerts, addStockAlert, chatOpen, setChatOpen, chatMessages, setChatMessages, pastOrders, completePurchase, lang, setLang, curr, setCurr, t, isMobile, mobileMenuOpen, setMobileMenuOpen, mobileFilterOpen, setMobileFilterOpen, fp, admin, setAdmin, authChecked, socialMedia, setSocialMedia, products, cats, dataLoaded}), [page, params, go, cart, addToCart, updateQty, removeItem, cartCount, cartTotal, q, favs, toggleFav, viewed, addViewed, user, addresses, coupon, couponApplied, couponData, couponError, discount, stockAlerts, addStockAlert, chatOpen, chatMessages, pastOrders, completePurchase, lang, curr, t, isMobile, mobileMenuOpen, mobileFilterOpen, fp, admin, authChecked, products, cats, dataLoaded]);

  return (
    <Ctx.Provider value={ctx}>
      <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background:isAdminPage?"#f3f4f6":"#f4f7fb", color:"#202226", minHeight:"100vh"}}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body, #root { overflow-x: hidden; }
          button { font-family: inherit; cursor: pointer; }
          input, select, textarea { font-family: inherit; }
          input:focus, textarea:focus, select:focus { outline: none; border-color: #ff6000 !important; }
          @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes heroSweep { 0%{transform:translateX(-18%);opacity:.15} 50%{opacity:.55} 100%{transform:translateX(18%);opacity:.15} }
          @keyframes glowPulse { 0%,100%{box-shadow:0 18px 45px rgba(255,96,0,.26)} 50%{box-shadow:0 24px 70px rgba(14,165,233,.28)} }
          .fr-hero {
            position: relative;
            min-height: 540px;
            overflow: hidden;
            color: #fff;
            background-image:
              radial-gradient(circle at 16% 76%, rgba(255,96,0,.45), transparent 30%),
              linear-gradient(90deg, rgba(4,7,14,.96) 0%, rgba(8,13,25,.88) 36%, rgba(8,13,25,.38) 66%, rgba(8,13,25,.18) 100%),
              url('/img/site/hero-workshop.webp');
            background-size: cover;
            background-position: center;
          }
          .fr-hero * { min-width: 0; }
          .fr-hero::before {
            content: "";
            position: absolute;
            inset: -25% 35% -20% -20%;
            background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,.16) 47%, transparent 56%);
            transform: translateX(-18%);
            animation: heroSweep 7s ease-in-out infinite;
            pointer-events: none;
          }
          .fr-glass {
            background: rgba(255,255,255,.1);
            border: 1px solid rgba(255,255,255,.22);
            box-shadow: 0 16px 50px rgba(0,0,0,.24);
            backdrop-filter: blur(12px);
          }
          .fr-card-hover:hover { transform: translateY(-5px); }
          .fr-product-card:hover img { transform: scale(1.045); }
          .fr-product-card:hover .fr-card-action { background: linear-gradient(135deg,#ff6000,#facc15); color:#111; }
          .fr-vehicle-card:hover { transform: translateY(-4px); border-color: rgba(255,96,0,.7) !important; }
          [data-admin-panel] { min-width: 0; }
          [data-admin-panel] * { min-width: 0; }
          .admin-card-body { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-card-body table { min-width: 720px; }
          .admin-card-body td, .admin-card-body th { vertical-align: top; }
          .admin-button { min-height: 36px; }
          .admin-mobile-tab-select { display: none; }
          .admin-input, [data-admin-panel] select, [data-admin-panel] textarea {
            min-height: 38px;
          }
          @media (max-width: 760px) {
            .fr-hero { min-height: 620px; background-position: 67% center; }
            .admin-shell {
              display: block !important;
              min-height: auto !important;
              background: #f3f4f6 !important;
            }
            .admin-sidebar {
              width: 100% !important;
              position: sticky !important;
              top: 0 !important;
              z-index: 120 !important;
              padding: 10px 10px 12px !important;
              border-bottom: 1px solid rgba(255,255,255,.08);
              box-shadow: 0 12px 26px rgba(0,0,0,.18);
            }
            .admin-brand {
              padding: 0 4px 8px !important;
              border-bottom: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 10px !important;
            }
            .admin-brand-title { font-size: 17px !important; }
            .admin-menu {
              display: none !important;
            }
            .admin-mobile-tab-select {
              display: block !important;
              width: 100% !important;
              min-height: 46px !important;
              border: 1px solid rgba(255,255,255,.16) !important;
              border-radius: 9px !important;
              padding: 0 12px !important;
              color: #fff !important;
              background: #202631 !important;
              font-size: 14px !important;
              font-weight: 800 !important;
            }
            .admin-menu button {
              flex: 0 0 auto !important;
              width: auto !important;
              max-width: 170px !important;
              margin-bottom: 0 !important;
              padding: 9px 11px !important;
              white-space: nowrap !important;
              border: 1px solid rgba(255,255,255,.08) !important;
              background: rgba(255,255,255,.04) !important;
            }
            .admin-menu button.admin-tab-active {
              background: #ff6000 !important;
              color: #111 !important;
              border-color: #ff6000 !important;
            }
            .admin-sidebar-footer {
              padding: 8px 0 0 !important;
              margin-top: 6px !important;
              border-top: 1px solid rgba(255,255,255,.08) !important;
            }
            .admin-sidebar-footer button {
              min-height: 38px !important;
              color: #fff !important;
              background: rgba(255,255,255,.08) !important;
            }
            .admin-content {
              padding: 12px !important;
              overflow: visible !important;
            }
            .admin-content h1 {
              font-size: 20px !important;
              margin-bottom: 12px !important;
              line-height: 1.25 !important;
            }
            .admin-card {
              border-radius: 8px !important;
              margin-bottom: 12px !important;
              overflow: hidden !important;
            }
            .admin-card-head {
              align-items: stretch !important;
              flex-direction: column !important;
              gap: 10px !important;
              padding: 12px !important;
            }
            .admin-card-head h2 {
              font-size: 15px !important;
              line-height: 1.25 !important;
            }
            .admin-card-action,
            .admin-card-action > div {
              width: 100% !important;
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 8px !important;
            }
            .admin-card-body {
              padding: 12px !important;
              overflow-x: auto !important;
            }
            .admin-button {
              flex: 1 1 128px !important;
              width: auto !important;
              min-height: 42px !important;
              padding: 10px 12px !important;
              font-size: 12px !important;
              white-space: normal !important;
              text-align: center !important;
            }
            .admin-input,
            [data-admin-panel] select,
            [data-admin-panel] textarea {
              min-height: 42px !important;
              font-size: 13px !important;
            }
            [data-admin-panel] [style*="grid-template-columns"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            [data-admin-panel] [style*="max-width:400"],
            [data-admin-panel] [style*="max-width:500"],
            [data-admin-panel] [style*="max-width:600"] {
              max-width: none !important;
            }
            [data-admin-panel] [style*="display: flex"] {
              max-width: 100%;
            }
            .admin-card-body table {
              min-width: 680px !important;
              font-size: 12px !important;
            }
            .admin-card-body td,
            .admin-card-body th {
              padding: 8px !important;
            }
            .admin-card-body table button,
            .admin-card-body table select {
              min-height: 34px !important;
              font-size: 12px !important;
            }
            .admin-card-body > div[style*="display: flex"],
            [data-admin-panel] form,
            [data-admin-panel] label {
              max-width: 100%;
            }
            .admin-login-shell {
              margin: 24px auto !important;
              padding: 0 14px !important;
            }
            .admin-login-card {
              padding: 22px !important;
            }
            .traffic-mobile-metrics,
            .traffic-mobile-actions {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .traffic-mobile-tabs {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }
          }
        `}</style>

        {/* Toast */}
        {toast && (
          <div style={{position:"fixed",top:isMobile?72:80,right:isMobile?12:20,left:isMobile?12:"auto",zIndex:9999,background:"#0f172a",color:"#fff",padding:isMobile?"12px":"13px 14px",borderRadius:8,fontSize:13,fontWeight:700,boxShadow:"0 16px 38px rgba(0,0,0,.24)",animation:"slideUp .3s",maxWidth:isMobile?"none":420,border:"1px solid rgba(255,255,255,.12)"}}>
            <div style={{lineHeight:1.35,marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:isMobile?"normal":"nowrap"}}>✓ {toast} — {t("addedToCart")}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={() => go("cart")} style={{minHeight:38,border:"1px solid rgba(255,255,255,.18)",borderRadius:6,background:"rgba(255,255,255,.08)",color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>Sepete git</button>
              <button onClick={() => go("checkout")} style={{minHeight:38,border:"none",borderRadius:6,background:"#ff6000",color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>Ödemeye geç</button>
            </div>
          </div>
        )}

        {/* WhatsApp Button */}
        <a href={generalWhatsAppUrl("site genel destek")} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"floating_whatsapp", href:generalWhatsAppUrl("site genel destek") }); metaTrackCustom("WhatsAppLead", { source: "floating" }); }}
          style={{position:"fixed",bottom:24,right:24,zIndex:998,minWidth:218,height:64,borderRadius:999,background:"#25D366",display:(isMobile||isAdminPage)?"none":"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 12px 30px rgba(37,211,102,.36)",textDecoration:"none",padding:"0 18px",color:"#062813"}}
          title="WhatsApp ile yazın">
          <svg viewBox="0 0 32 32" width="34" height="34" fill="#fff"><path d="M16.01 2.93A13.07 13.07 0 0 0 2.93 16a12.94 12.94 0 0 0 1.75 6.53L2.93 29.07l6.72-1.76A13.07 13.07 0 1 0 16.01 2.93Zm0 23.9a10.8 10.8 0 0 1-5.52-1.51l-.4-.23-3.98 1.04 1.06-3.88-.26-.41a10.83 10.83 0 1 1 9.1 5Z"/><path d="M22.36 18.76c-.35-.17-2.05-1.01-2.37-1.13-.32-.11-.55-.17-.78.17-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.18-1.47-.54-2.8-1.73-1.04-.92-1.73-2.06-1.94-2.41-.2-.35-.02-.54.15-.71.16-.16.35-.41.53-.61.17-.21.23-.35.35-.59.12-.23.06-.44-.03-.61-.09-.17-.78-1.88-1.07-2.57-.28-.68-.57-.59-.78-.6h-.67a1.28 1.28 0 0 0-.93.44 3.93 3.93 0 0 0-1.22 2.92c0 1.72 1.25 3.38 1.43 3.61.17.24 2.47 3.77 5.98 5.28.84.36 1.49.58 2 .74.84.27 1.6.23 2.2.14.67-.1 2.05-.84 2.34-1.65.29-.81.29-1.5.2-1.65-.08-.14-.32-.23-.67-.4Z"/></svg>
          <span style={{display:"flex",flexDirection:"column",lineHeight:1.05}}>
            <strong style={{fontSize:15,fontWeight:950}}>Kupon için WhatsApp</strong>
            <span style={{fontSize:11,fontWeight:800,opacity:.86}}>Fiyat, stok ve kupon sor</span>
          </span>
        </a>

        {/* Scroll to Top */}
        {showTop && !isAdminPage && <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}
          style={{position:"fixed",bottom:100,right:24,zIndex:999,width:44,height:44,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,.1)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn .3s"}}>↑</button>}

        {/* HEADER */}
        <header className="fr2-header" style={{display:isAdminPage?"none":"block",background:"#080d17",borderBottom:"1px solid rgba(255,255,255,.08)",position:"sticky",top:0,zIndex:100,boxShadow:"0 12px 34px rgba(0,0,0,.28)",backdropFilter:"blur(12px)"}}>
          <div className="fr2-topbar" style={{background:"linear-gradient(90deg,#090d16,#151821 48%,#ff6000)",padding:isMobile?"5px 0":"6px 0"}}>
            <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"0 14px":"0 20px",display:"flex",justifyContent:isMobile?"center":"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <span style={{color:"#f8fafc",fontSize:isMobile?11:12,fontWeight:isMobile?800:400,whiteSpace:"nowrap",letterSpacing:isMobile?.2:0}}>{lang==="tr"?(isMobile?"İndirim kuponu için WhatsApp":"İndirim kuponu için WhatsApp'tan iletişime geçin | 3000 TL üzeri ücretsiz kargo"):(isMobile?"Ask for a coupon on WhatsApp":"Contact us on WhatsApp for an available coupon | Free shipping over 3000 TL")}</span>
                {!isMobile && rates.EUR>0 && <span style={{color:"#aaa",fontSize:11,borderLeft:"1px solid #444",paddingLeft:10}}>€1 = ₺{(1/rates.EUR).toFixed(2)} | $1 = ₺{(1/rates.USD).toFixed(2)}</span>}
              </div>
              {!isMobile && <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <>
                  <a href="tel:+905456087008" onClick={() => recordLeadEvent("phone", { source:"header_phone" })} style={{color:"#ccc",fontSize:12,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>📞 0545 608 7008</a>
                  <a href={generalWhatsAppUrl("ust bar")} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"header_whatsapp", href:generalWhatsAppUrl("ust bar") }); metaTrackCustom("WhatsAppLead", { source: "header" }); }} style={{color:"#25D366",fontSize:12,textDecoration:"none",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.color="#4ade80"} onMouseLeave={e=>e.currentTarget.style.color="#25D366"}>💬 WhatsApp</a>
                </>
                {/* Social media in header */}
                {(socialMedia.facebook||socialMedia.instagram) && <div style={{display:"flex",gap:6,marginLeft:4}}>
                  {socialMedia.facebook&&<a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:12,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>f</a>}
                  {socialMedia.instagram&&<a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:12,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>📷</a>}
                </div>}
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <a href="https://www.facebook.com/profile.php?id=61573354240573" target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:14,textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#1877F2"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>f</a>
                  <a href="https://www.instagram.com/frenciniz.co" target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:14,textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#E4405F"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>📷</a>
                </div>
                {/* Language toggle */}
                <div style={{display:"flex",gap:0,borderRadius:4,overflow:"hidden",border:"1px solid #444"}}>
                  <button onClick={()=>setLang("tr")} style={{padding:"2px 8px",background:lang==="tr"?"#ff6000":"transparent",color:lang==="tr"?"#fff":"#999",border:"none",fontSize:11,fontWeight:600,cursor:"pointer"}}>TR</button>
                  <button onClick={()=>setLang("en")} style={{padding:"2px 8px",background:lang==="en"?"#ff6000":"transparent",color:lang==="en"?"#fff":"#999",border:"none",fontSize:11,fontWeight:600,cursor:"pointer"}}>EN</button>
                </div>
                {/* Currency toggle */}
                <div style={{display:"flex",gap:0,borderRadius:4,overflow:"hidden",border:"1px solid #444",marginLeft:6}}>
                  {["TRY","EUR","USD"].map(c=>(
                    <button key={c} onClick={()=>setCurr(c)} style={{padding:"2px 7px",background:curr===c?"#ff6000":"transparent",color:curr===c?"#fff":"#999",border:"none",fontSize:11,fontWeight:600,cursor:"pointer"}}>{c==="TRY"?"₺":c==="EUR"?"€":"$"}</button>
                  ))}
                </div>
              </div>}
            </div>
          </div>
          <div className="fr2-header-main" style={isMobile ? {padding:"9px 14px 11px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:"radial-gradient(circle at 88% 18%, rgba(255,96,0,.36), transparent 28%), linear-gradient(135deg,#0b1020,#151b2b 62%,#24150c)",color:"#fff"} : {padding:"10px 24px",display:"grid",gridTemplateColumns:"minmax(0,1fr) auto minmax(0,1fr)",alignItems:"center",gap:16,background:"radial-gradient(circle at 6% 45%, rgba(14,165,233,.24), transparent 24%), radial-gradient(circle at 91% 18%, rgba(255,96,0,.34), transparent 30%), linear-gradient(135deg,#090d16,#121a2a 58%,#24150c)",color:"#fff"}}>
            {/* Mobile hamburger */}
            {isMobile && <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",fontSize:22,color:"#fff",padding:0,cursor:"pointer",flex:"0 0 auto"}}>☰</button>}

            <div className="fr2-wordmark" role="button" tabIndex={0} aria-label="Frenciniz ana sayfa" style={{cursor:"pointer",flexShrink:0,justifySelf:"start",order:isMobile?2:"initial"}} onClick={() => go("home")} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ") go("home")}}>
              <img src={BRAND_LOGO} alt="Frenciniz" width={isMobile?236:348} height={isMobile?53:78} fetchpriority="high" style={{height:isMobile?53:78,width:isMobile?"min(236px, calc(100vw - 160px))":"auto",objectFit:"contain",display:"block",imageRendering:"auto",filter:"drop-shadow(0 12px 22px rgba(0,0,0,.35))"}} onError={e=>{e.currentTarget.src="/logo.webp?v=3"}}/>
              <span className="fr2-wordmark-text">Frenciniz<em>.com</em></span>
            </div>

            {/* Desktop: arama tam ortada (grid center col) */}
            {!isMobile && <div className="fr2-header-search" style={{width:500,display:"flex",border:"2px solid rgba(255,96,0,.9)",borderRadius:8,overflow:"hidden",justifySelf:"center",background:"#fff",boxShadow:"0 16px 34px rgba(255,96,0,.22)"}}>
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => {if(e.key==="Enter" && q.trim()) go("products",{q})}}
                placeholder={t("search")}
                style={{flex:1,padding:"10px 14px",border:"none",fontSize:14,outline:"none"}} />
              <button onClick={() => {if(q.trim()) go("products",{q})}} style={{padding:"10px 20px",background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#171717",border:"none",fontSize:14,fontWeight:800}}>{t("searchBtn")}</button>
            </div>}

            {/* Desktop actions — sağa yaslı */}
            {!isMobile && <div className="fr2-header-actions" style={{display:"flex",alignItems:"center",gap:20,flexShrink:0,justifySelf:"end"}}>
              <button onClick={() => go("favs")} style={{background:"none",border:"none",color:"#e5e7eb",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",cursor:"pointer"}}>
                <span style={{fontSize:20}}>♡</span><span>{t("favs")}</span>
                {favs.length > 0 && <span style={{position:"absolute",top:-4,right:-8,background:"#ff6000",color:"#fff",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{favs.length}</span>}
              </button>
              <button onClick={() => go(user ? "account" : "auth")} style={{background:"none",border:"none",color:"#e5e7eb",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}>
                <span style={{fontSize:20}}>👤</span><span>{user ? user.name : t("login")}</span>
              </button>
              <button onClick={() => go("cart")} style={{background:"none",border:"none",color:"#e5e7eb",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",cursor:"pointer"}}>
                <span style={{fontSize:20}}>🛒</span><span>{t("cart")}</span>
                {cartCount > 0 && <span style={{position:"absolute",top:-4,right:-8,background:"#ff6000",color:"#fff",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
              </button>
            </div>}

            {/* Mobile search */}
            {isMobile && <div className="fr2-header-search fr2-header-search-mobile" style={{order:4,flex:"1 0 100%",width:"100%",display:"flex",border:"2px solid #ff6000",borderRadius:8,overflow:"hidden",background:"#fff"}}>
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => {if(e.key==="Enter" && q.trim()) go("products",{q})}}
                placeholder={t("search")}
                style={{flex:1,padding:"8px 10px",border:"none",fontSize:13,outline:"none"}} />
              <button onClick={() => {if(q.trim()) go("products",{q})}} style={{padding:"8px 14px",background:"#ff6000",color:"#fff",border:"none",fontSize:14,fontWeight:600}}>{t("searchBtn")}</button>
            </div>}
            
            {/* Mobile icons */}
            {isMobile && <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:"auto",order:3}}>
              <button onClick={() => go(user ? "account" : "auth")} style={{background:"none",border:"none",fontSize:22,color:"#fff",padding:4,cursor:"pointer",flexShrink:0}}>👤</button>
              <button onClick={() => go("cart")} style={{background:"none",border:"none",fontSize:22,color:"#fff",position:"relative",padding:4,cursor:"pointer",flexShrink:0}}>
                🛒{cartCount>0&&<span style={{position:"absolute",top:-2,right:-6,background:"#ff6000",color:"#fff",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
              </button>
            </div>}
          </div>
          
        </header>

        {!isAdminPage && <CouponWhatsAppStrip />}

        {/* CONTENT */}
        {!isAdminPage && mobileMenuOpen && <MobileMenu />}
        {!isAdminPage && mobileFilterOpen && <MobileFilterDrawer />}
        <div style={{marginLeft:0}}>
        <main className={isAdminPage?"":"fr2-storefront-main"} style={{minHeight:isAdminPage?"100vh":"60vh"}}>
          {!isAdminPage && <CompatibilityCheckBanner />}
          {page==="home"&&<HomePage/>}
          {page==="products"&&<ProductsPage/>}
          {page==="product"&&<ProductDetailPage/>}
          {page==="cart"&&<CartPage/>}
          {page==="checkout"&&<CheckoutPage/>}
          {page==="auth"&&<AuthPage/>}
          {page==="account"&&<AccountPage/>}
          {page==="favs"&&<FavsPage/>}
          {page==="brands"&&<BrandsPage/>}
          {page==="about"&&<AboutPage/>}
          {page==="contact"&&<ContactPage/>}
          {page==="faq"&&<FaqPage/>}
          {page==="privacy"&&<PrivacyPage/>}
          {(page==="shipping" || page==="shipping-policy")&&<ShippingPolicyPage/>}
          {page==="terms"&&<TermsPage/>}
          {page==="return-policy"&&<ReturnPolicyPage/>}
          {page==="kvkk"&&<KvkkPage/>}
          {page==="company"&&<CompanyPage/>}
          {page==="accessibility"&&<AccessibilityPage/>}
          {page==="orders"&&<OrdersPage/>}
          {page==="addresses"&&<AddressesPage/>}
          {page==="profile"&&<ProfilePage/>}
          {page==="notifications"&&<NotificationsPage/>}
          {page==="change-password"&&<ChangePasswordPage/>}
          {page==="admin"&&<AdminPanel/>}
          {page==="admin-login"&&<AdminLoginPage/>}
          {page==="payment-success"&&<PaymentSuccessPage/>}
          {page==="payment-fail"&&<PaymentFailPage/>}
        </main>

        {/* Cookie Consent Banner */}
        {!isAdminPage && !cookieOk && (
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9998,background:"#1a1a1a",borderTop:"1px solid #333",padding:isMobile?"10px 0":"16px 0",animation:"slideUp .4s ease"}}>
            <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"0 14px":"0 20px",display:"flex",alignItems:isMobile?"stretch":"center",gap:isMobile?10:20,flexDirection:isMobile?"column":"row"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:isMobile?12:13,color:"#ccc",lineHeight:isMobile?1.45:1.7}}>
                  🍪 {lang==="en"?(isMobile?<>Cookies are used for site experience. See <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>Privacy</span>.</>:<>This website uses cookies to improve your experience and provide our services. By using our site you accept our <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>Privacy Policy</span> and <span onClick={()=>go("kvkk")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>GDPR Disclosure</span>.</>):(isMobile?<>Deneyimi iyileştirmek için çerez kullanıyoruz. <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>Gizlilik</span></>:<>Bu web sitesi, deneyiminizi iyileştirmek ve hizmetlerimizi sunmak için çerezler kullanmaktadır. Sitemizi kullanarak <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>Gizlilik Politikamızı</span> ve <span onClick={()=>go("kvkk")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>KVKK Aydınlatma Metnimizi</span> kabul etmiş sayılırsınız.</>)}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0,width:isMobile?"100%":"auto"}}>
                <button onClick={()=>setCookieOk(true)} style={{flex:isMobile?1:"0 0 auto",padding:isMobile?"9px 12px":"10px 24px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer"}}>{lang==="en"?"Accept":"Kabul Et"}</button>
                <button onClick={()=>setCookieOk(true)} style={{flex:isMobile?1:"0 0 auto",padding:isMobile?"9px 12px":"10px 24px",background:"transparent",color:"#999",border:"1px solid #555",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer"}}>{lang==="en"?"Essential Only":"Sadece Gerekli"}</button>
              </div>
            </div>
          </div>
        )}

        {!isAdminPage && page !== "product" && <MobileBottomBar />}
        {!isAdminPage && <ChatWidget />}

        {/* FOOTER */}
        <footer className="fr2-footer" style={{display:isAdminPage?"none":"block",background:"#1a1a1a",color:"#ccc",padding:"40px 0 20px",marginTop:40}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
            {/* Newsletter */}
            <div className="fr2-newsletter" style={{background:"#252525",borderRadius:8,padding:isMobile?"20px":"24px 28px",marginBottom:32,display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"stretch":"center",gap:isMobile?16:20}}>
              <div>
                <div style={{fontSize:isMobile?16:18,fontWeight:700,color:"#fff",marginBottom:4}}>{t("newsletter")}</div>
                <div style={{fontSize:13,color:"#888"}}>{t("newsletterDesc")}</div>
              </div>
              <div style={{display:"flex",gap:0,flexShrink:0}}>
                <input placeholder={lang==="en"?"Email":"E-posta"} style={{padding:"10px 14px",border:"1px solid #444",borderRight:"none",borderRadius:"6px 0 0 6px",background:"#333",color:"#fff",fontSize:13,width:isMobile?"100%":240,flex:isMobile?1:"none",outline:"none"}}/>
                <button style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:"0 6px 6px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("subscribe")}</button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:isMobile?20:32}}>
              <div style={isMobile?{gridColumn:"1 / -1"}:{}}>
                <div style={{cursor:"pointer",marginBottom:12}} onClick={()=>go("home")}>
                  <img src={BRAND_LOGO} alt="Frenciniz" width={240} height={54} loading="lazy" decoding="async" style={{height:54,width:"auto",display:"block",filter:"drop-shadow(0 8px 18px rgba(0,0,0,.35))"}} onError={e=>{e.currentTarget.src="/logo.webp?v=3"}}/>
                </div>
                <p style={{fontSize:13,color:"#888",lineHeight:1.7}}>{lang==="en"?"Brake parts for buses, trucks, tractors and trailers.":"Otobüs, kamyon, tır ve dorse için fren aksamı ürünleri."}</p>
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <a href="https://www.facebook.com/profile.php?id=61573354240573" target="_blank" rel="noopener noreferrer" title="Facebook" style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",transition:"transform .15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)"}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
                    <img src="/facebook.png" alt="Facebook" width={40} height={40} loading="lazy" decoding="async" style={{width:40,height:40,display:"block"}}/>
                  </a>
                  <a href="https://www.instagram.com/frenciniz.co" target="_blank" rel="noopener noreferrer" title="Instagram" style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",transition:"transform .15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)"}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
                    <img src="/instagram.png" alt="Instagram" width={40} height={40} loading="lazy" decoding="async" style={{width:40,height:40,display:"block",borderRadius:8}}/>
                  </a>
                </div>
                <div style={{marginTop:16,fontSize:13,color:"#888",lineHeight:2}}>📍 Hızırbey Mah. 1509 Sok. No:24, Isparta<br/>📞 <a href="tel:+905456087008" style={{color:"#888",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#888",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#25D366"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>💬 WhatsApp</a><br/>✉ <a href="mailto:info@frenciniz.com" style={{color:"#888",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>info@frenciniz.com</a></div>
                <a href={ETBIS_VERIFY_URL} target="_blank" rel="noopener noreferrer" style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:12,padding:"10px 12px",border:"1px solid rgba(255,255,255,.14)",borderRadius:8,background:"rgba(255,255,255,.04)",color:"#fff",textDecoration:"none",maxWidth:310}}>
                  <img src={ETBIS_QR} alt="ETBIS dogrulama karekodu" width={68} height={68} loading="lazy" decoding="async" style={{width:68,height:68,borderRadius:6,background:"#fff",padding:3,flexShrink:0}}/>
                  <span style={{display:"block"}}>
                    <strong style={{display:"block",fontSize:13,color:"#fff",marginBottom:4}}>ETBIS Dogrulama</strong>
                    <span style={{display:"block",fontSize:12,color:"#aaa",lineHeight:1.45}}>Ticaret Bakanligi kaydini sorgula</span>
                  </span>
                </a>
              </div>
              {/* Kategoriler */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>{t("categories")}</div>
                {CATS.filter(c=>c.isGroup).slice(0,6).map((c,j) => ({l:translateCat(c,lang),p:"products",pr:{cat:c.id}})).map((item,j) => (
                  <div key={j} onClick={()=>go(item.p,item.pr)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
              {/* Bilgi */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>{lang==="en"?"Information":"Bilgi"}</div>
                {[{l:lang==="en"?"About Us":"Hakkımızda",p:"about"},{l:lang==="en"?"Company Info":"Şirket Bilgileri",p:"company"},{l:lang==="en"?"FAQ":"SSS",p:"faq"},{l:lang==="en"?"Shipping Policy":"Gönderim Politikası",p:"shipping-policy"},{l:lang==="en"?"Return Policy":"İade Politikası",p:"return-policy"},{l:lang==="en"?"Terms & Conditions":"Şartlar ve Koşullar",p:"terms"},{l:lang==="en"?"Privacy Policy":"Gizlilik Politikası",p:"privacy"},{l:lang==="en"?"GDPR Disclosure":"KVKK Aydınlatma",p:"kvkk"},{l:lang==="en"?"Accessibility":"Erişilebilirlik",p:"accessibility"}].map((item,j) => (
                  <div key={j} onClick={()=>go(item.p)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
              {/* Hesap */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>{lang==="en"?"Account":"Hesap"}</div>
                {[{l:lang==="en"?"Sign In":"Giriş Yap",p:"auth"},{l:lang==="en"?"Sign Up":"Kayıt Ol",p:"auth"},{l:lang==="en"?"My Orders":"Siparişlerim",p:"account"},{l:lang==="en"?"My Favorites":"Favorilerim",p:"favs"}].map((item,j) => (
                  <div key={j} onClick={()=>go(item.p)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
            </div>
            <div style={{marginTop:24,paddingTop:16,borderTop:"1px solid #333",display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:12,fontSize:12,color:"#666"}}>
              <span>© 2026 <span onClick={()=>go("admin-login")} style={{cursor:"pointer"}}>Frenciniz</span> — {t("allRightsReserved")}</span>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <img src="/payment/visa.svg" alt="Visa" width={72} height={24} loading="lazy" decoding="async" style={{display:"block"}}/>
                <img src="/payment/mastercard.svg" alt="Mastercard" width={72} height={24} loading="lazy" decoding="async" style={{display:"block"}}/>
                <img src="/payment/troy.svg" alt="Troy" width={72} height={24} loading="lazy" decoding="async" style={{display:"block"}}/>
                <span style={{color:"#666",marginLeft:4}}>· Havale/EFT</span>
              </div>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function MobileBottomBar() {
  const {isMobile, lang} = use$();
  if (!isMobile) return null;
  const itemStyle = {
    minWidth: 0,
    minHeight: 48,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.12)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 950,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  };
  return (
    <nav aria-label={lang==="en"?"Quick actions":"Hizli islemler"} style={{position:"fixed",left:0,right:0,bottom:0,zIndex:997,padding:"8px 12px calc(8px + env(safe-area-inset-bottom))",background:"linear-gradient(180deg,rgba(7,10,18,.92),#070a12)",borderTop:"1px solid rgba(255,255,255,.12)",boxShadow:"0 -14px 38px rgba(0,0,0,.34)",display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
      <a href={generalWhatsAppUrl("mobil alt bar")} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"mobile_bottom_bar", href:generalWhatsAppUrl("mobil alt bar") }); metaTrackCustom("WhatsAppLead", { source: "mobile_bottom_bar" }); }} style={{...itemStyle,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813"}}>
        <span style={{fontSize:10,letterSpacing:.3}}>WhatsApp</span>
        <strong style={{fontSize:14,lineHeight:1}}>Kupon ve Fiyat Sor</strong>
      </a>
      <a href="tel:+905456087008" onClick={() => { recordLeadEvent("phone", { source:"mobile_bottom_bar" }); metaTrackCustom("PhoneLead", { source: "mobile_bottom_bar" }); }} style={{...itemStyle,background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#111827"}}>
        <span style={{fontSize:10,letterSpacing:.3}}>Telefon</span>
        <strong style={{fontSize:14,lineHeight:1}}>Hemen Ara</strong>
      </a>
    </nav>
  );
}

function CouponWhatsAppStrip() {
  const {isMobile, lang} = use$();
  const href = generalWhatsAppUrl("indirim kuponu talebi");
  return (
    <section aria-label={lang==="en"?"WhatsApp coupon request":"İndirim kuponu WhatsApp iletişimi"} style={{background:"linear-gradient(90deg,#052e16,#166534 52%,#25D366)",color:"#fff",borderBottom:"1px solid rgba(255,255,255,.2)",boxShadow:"0 8px 22px rgba(22,101,52,.16)"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"9px 12px":"10px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:isMobile?8:16,flexDirection:isMobile?"column":"row",textAlign:"center"}}>
        <strong style={{fontSize:isMobile?13:15,lineHeight:1.35}}>
          {lang==="en"?"Contact us on WhatsApp for an available discount coupon.":"İndirim kuponu için WhatsApp'tan iletişime geçin."}
        </strong>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"coupon_whatsapp_strip", href }); metaTrackCustom("WhatsAppCouponLead", { source:"coupon_whatsapp_strip" }); }} style={{minHeight:38,padding:"9px 16px",borderRadius:999,background:"#fff",color:"#14532d",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",whiteSpace:"nowrap",boxShadow:"0 8px 18px rgba(0,0,0,.16)"}}>
          {lang==="en"?"Ask on WhatsApp":"WhatsApp'tan kupon sor"}
        </a>
      </div>
    </section>
  );
}

function WhatsAppTrustStrip() {
  const {isMobile, page, lang} = use$();
  if (page === "checkout" || page === "cart") return null;
  const href = generalWhatsAppUrl("OEM sase foto ile hizli teklif");
  return (
    <section style={{background:"linear-gradient(135deg,#052e1a,#064e3b)",borderBottom:"1px solid rgba(34,197,94,.24)",color:"#fff"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"10px 14px":"10px 24px",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:10,flexDirection:isMobile?"column":"row"}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:950,color:"#86efac",textTransform:"uppercase",letterSpacing:.4,marginBottom:2}}>
            {lang==="en"?"Fast fitment check":"Yanlis parca riski almadan"}
          </div>
          <div style={{fontSize:isMobile?13:14,fontWeight:900,lineHeight:1.45}}>
            {lang==="en"?"Send OEM, chassis number or old part photo on WhatsApp; get stock, price and fitment confirmation today.":"OEM kodu, sase no veya eski parca fotosunu WhatsApp'tan gonder; bugun stok, fiyat ve uyumlulugu netlestirelim."}
          </div>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"trust_strip", href }); metaTrackCustom("WhatsAppLead", { source:"trust_strip" }); }} style={{minHeight:42,padding:"10px 16px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",whiteSpace:isMobile?"normal":"nowrap",textAlign:"center",boxShadow:"0 10px 22px rgba(37,211,102,.24)"}}>
          {lang==="en"?"Get today's quote":"Bugun teklif al"}
        </a>
      </div>
    </section>
  );
}

function TodaySalesStrip() {
  const {isMobile, page, lang} = use$();
  if (page === "checkout" || page === "cart" || page === "admin") return null;
  const href = generalWhatsAppUrl("bugun siparis icin stok fiyat teyidi");
  return (
    <section style={{background:"linear-gradient(90deg,#111827,#7f1d1d 48%,#ff6000)",color:"#fff",borderBottom:"1px solid rgba(255,255,255,.16)"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"10px 14px":"9px 24px",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:10,flexDirection:isMobile?"column":"row"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flexWrap:isMobile?"wrap":"nowrap"}}>
          <span style={{background:"#facc15",color:"#111827",fontSize:11,fontWeight:950,padding:"5px 8px",borderRadius:999,whiteSpace:"nowrap"}}>{lang==="en"?"TODAY":"BUGUN"}</span>
          <strong style={{fontSize:isMobile?13:14,lineHeight:1.35}}>
            {lang==="en"?"Buying today? Send code/photo, get the right part confirmed before ordering.":"Bugun siparis vereceksen kod/foto gonder, dogru parcayi siparisten once teyit edelim."}
          </strong>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"today_sales_strip", href }); metaTrackCustom("WhatsAppLead", { source:"today_sales_strip" }); }} style={{minHeight:38,padding:"9px 13px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
            {lang==="en"?"WhatsApp now":"WhatsApp'tan yaz"}
          </a>
          <a href="tel:+905456087008" onClick={() => { recordLeadEvent("phone", { source:"today_sales_strip" }); metaTrackCustom("PhoneLead", { source:"today_sales_strip" }); }} style={{minHeight:38,padding:"9px 13px",borderRadius:8,border:"1px solid rgba(255,255,255,.28)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,fontWeight:900,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
            0545 608 7008
          </a>
        </div>
      </div>
    </section>
  );
}

function CompatibilityCheckBanner() {
  const {isMobile, page, lang} = use$();
  if (page === "admin" || page === "home") return null;
  const href = compatibilityCheckWhatsAppUrl();
  return (
    <section style={{background:"linear-gradient(90deg,#fff7ed,#fef3c7 54%,#dcfce7)",borderBottom:"1px solid #fed7aa",color:"#111827"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"10px 14px":"10px 24px",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:10,flexDirection:isMobile?"column":"row"}}>
        <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",gap:10,minWidth:0,flexDirection:isMobile?"column":"row"}}>
          <span style={{background:"#ff6000",color:"#fff",fontSize:11,fontWeight:950,padding:"5px 8px",borderRadius:999,whiteSpace:"nowrap"}}>
            {lang==="en"?"PART CHECK":"PARCA TEYIDI"}
          </span>
          <strong style={{fontSize:isMobile?13:14,lineHeight:1.4}}>
            {lang==="en"?"Send the OEM code, chassis or old-part photo before ordering.":"OEM kodunu, saseyi veya eski parca fotografini gonderin; fiyat, stok ve uyumlulugu teyit edelim."}
          </strong>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"compatibility_banner_whatsapp", href }); metaTrackCustom("WhatsAppCompatibilityLead", { source:"compatibility_banner" }); }} style={{minHeight:38,padding:"9px 14px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",whiteSpace:isMobile?"normal":"nowrap",textAlign:"center",boxShadow:"0 10px 22px rgba(37,211,102,.2)"}}>
          {lang==="en"?"Send code/photo":"Kod/fotograf gonder"}
        </a>
      </div>
    </section>
  );
}

function ProductLeadNudge() {
  const {page, params, products, isMobile, dataLoaded} = use$();
  const productList = (products && products.length) ? products : PRODUCTS;
  const product = page === "product" ? productList.find(item => item.id === params?.id) : null;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const storageKey = product ? `lead_nudge_seen_${product.id}` : "";
  const href = useMemo(() => product ? productWhatsAppUrl(product, 1) : generalWhatsAppUrl("urun uyumluluk teyidi"), [product?.id]);

  useEffect(() => {
    setVisible(false);
    setDismissed(false);
    if (!product || !dataLoaded) return;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), isMobile ? 1600 : 2400);
    return () => clearTimeout(timer);
  }, [product?.id, dataLoaded, isMobile]);

  if (!product || dismissed || !visible) return null;
  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(storageKey, "1"); } catch {}
  };
  const partCode = product.oem || product.sku || "OEM / parca kodu";
  return (
    <aside aria-label="Urun uyumluluk teklifi" style={{
      position:"fixed",
      right:isMobile?10:24,
      left:isMobile?10:"auto",
      bottom:isMobile?86:92,
      zIndex:9997,
      width:isMobile?"auto":360,
      background:"linear-gradient(135deg,#07111f,#14213a)",
      color:"#fff",
      border:"1px solid rgba(255,96,0,.28)",
      borderRadius:8,
      boxShadow:"0 20px 48px rgba(0,0,0,.32)",
      padding:14
    }}>
      <button onClick={close} aria-label="Kapat" style={{position:"absolute",top:8,right:8,width:28,height:28,border:"1px solid rgba(255,255,255,.16)",borderRadius:6,background:"rgba(255,255,255,.08)",color:"#fff",cursor:"pointer",fontSize:16,lineHeight:1}}>x</button>
      <div style={{paddingRight:28}}>
        <div style={{fontSize:11,fontWeight:950,color:"#facc15",textTransform:"uppercase",marginBottom:5}}>Bugun siparis icin hizli teyit</div>
        <div style={{fontSize:15,fontWeight:950,lineHeight:1.25,marginBottom:7}}>Bu urun araciniza uyar mi?</div>
        <div style={{fontSize:12,color:"#d1d5db",lineHeight:1.55,marginBottom:10}}>OEM, sase veya eski parca fotografini gonderin; fiyat, stok, kargo ve uyumlulugu netlestirelim.</div>
        <div style={{fontSize:11,color:"#9ca3af",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"7px 8px",overflowWrap:"anywhere",marginBottom:10}}>Kod: {partCode}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 92px",gap:8}}>
        <a href={href} target="_blank" rel="noopener noreferrer" data-lead-source="product_lead_nudge" data-lead-product-id={product.id} data-lead-sku={product.sku || ""} data-lead-category={product.cat || ""} data-lead-value={product.price || 0}
          onClick={() => { recordLeadEvent("whatsapp", { source:"product_lead_nudge", product, value:product.price || 0 }); close(); }}
          style={{minHeight:42,borderRadius:6,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 10px"}}>
          Bugun fiyat al
        </a>
        <a href="tel:+905456087008" data-lead-source="product_lead_nudge_phone" onClick={() => { recordLeadEvent("phone", { source:"product_lead_nudge", product, value:product.price || 0 }); close(); }}
          style={{minHeight:42,borderRadius:6,background:"#fff",color:"#111827",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
          Hemen ara
        </a>
      </div>
    </aside>
  );
}

function ReferralSalesBar() {
  const {isMobile, go, lang, page, params, products} = use$();
  const source = useMemo(() => {
    if (typeof window === "undefined") return "";
    const qs = new URLSearchParams(window.location.search || "");
    const utm = String(qs.get("utm_source") || "").toLowerCase();
    const medium = String(qs.get("utm_medium") || "").toLowerCase();
    const ref = String(document.referrer || "").toLowerCase();
    if (utm.includes("facebook") || ref.includes("facebook.com") || ref.includes("fb.com")) return "facebook";
    if (utm.includes("meta") || utm.includes("instagram") || medium.includes("catalog") || ref.includes("instagram.com")) return "meta";
    if (utm.includes("google") || ref.includes("google.")) return "google";
    return "";
  }, []);
  if (!source) return null;
  const productList = (products && products.length) ? products : PRODUCTS;
  const product = page === "product" ? productList.find(item => item.id === params?.id) : null;
  const isFb = source === "facebook";
  const isMeta = source === "meta";
  const href = product ? productWhatsAppUrl(product, 1) : waUrl([
    "Merhaba Frenciniz, grup/arama uzerinden geldim.",
    "Parca uyumlulugu ve fiyat teklifi almak istiyorum.",
    "OEM / SKU / parca kodu:",
    "Arac marka-model:",
    "Sase no:",
    "Eski parca fotosu gonderebilirim.",
  ].join("\n"));
  const title = product
    ? "Bu urun icin hizli teklif"
    : (isFb ? "Facebook grubundan gelenlere hizli destek" : isMeta ? "Katalogdan gelenlere hizli destek" : "Google aramasindan gelenlere hizli destek");
  const detail = product
    ? "WhatsApp'a tiklayinca urun, SKU, OEM ve link otomatik gider. Arac modelini veya eski parca fotografini ekleyin; stok ve uyumlulugu hizli teyit edelim."
    : "Parca kodu, OEM, sase veya eski parca fotosunu gonderin; uyumluluk ve stok teyidini hizli yapalim.";
  return (
    <section style={{background:isFb?"linear-gradient(135deg,#07111f,#0b2a1a 56%,#134e4a)":isMeta?"linear-gradient(135deg,#07111f,#3b0764 58%,#6d28d9)":"linear-gradient(135deg,#07111f,#172554 58%,#1e3a8a)",borderBottom:"1px solid rgba(255,255,255,.12)",color:"#fff"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"12px 14px":"12px 24px",display:"flex",flexDirection:isMobile?"column":"row",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:10}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:950,color:isFb?"#86efac":isMeta?"#ddd6fe":"#bfdbfe",letterSpacing:.4,textTransform:"uppercase",marginBottom:3}}>
            {title}
          </div>
          <div style={{fontSize:isMobile?13:14,lineHeight:1.45,fontWeight:800}}>
            {detail}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
          <a href={href} target="_blank" rel="noopener noreferrer" data-lead-source={`${source}_referral_bar`} data-lead-product-id={product?.id || ""} data-lead-sku={product?.sku || ""} data-lead-category={product?.cat || ""} data-lead-value={product?.price || 0} onClick={() => { recordLeadEvent("whatsapp", { source:`${source}_referral_bar`, href, product, value:product?.price || 0 }); metaTrackCustom("WhatsAppLead", { source: `${source}_referral_bar`, productId: product?.id || "", sku: product?.sku || "" }); }} style={{minHeight:40,padding:"10px 14px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
            {product ? "Bu urune teklif al" : "WhatsApp'tan teyit al"}
          </a>
          <button onClick={() => go("products")} style={{minHeight:40,padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.26)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:13,fontWeight:900}}>
            Urunleri incele
          </button>
        </div>
      </div>
    </section>
  );
}

// ===== CATEGORY SIDEBAR (Hiyerarşik) =====
function CategorySidebar({go, activeCat, onSelect, isFixed}) {
  const [openGroup, setOpenGroup] = useState(null);
  const [headerH, setHeaderH] = useState(190);
  const {t, lang} = use$();
  const groups = getGroups();
  useEffect(() => {
    if (!isFixed) return;
    const measure = () => {
      const h = document.querySelector("header");
      if (h) setHeaderH(h.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro && document.querySelector("header")) ro.observe(document.querySelector("header"));
    return () => { window.removeEventListener("resize", measure); if (ro) ro.disconnect(); };
  }, [isFixed]);
  const fixedStyle = isFixed ? {position:"fixed",left:0,top:headerH,width:220,height:`calc(100vh - ${headerH}px)`,overflowY:"auto",borderRight:"1px solid #eee",background:"#fff",padding:"12px 0",zIndex:50} : {};
  return (
    <aside style={fixedStyle}>
      {isFixed && <div style={{padding:"4px 16px 10px",fontSize:13,fontWeight:700,color:"#1a1a1a",borderBottom:"1px solid #f0f0f0",marginBottom:6}}>{t("categories")}</div>}
      {onSelect && <div onClick={() => onSelect("all")} style={{padding:"8px 16px",fontSize:12,color:activeCat==="all"?"#ff6000":"#555",fontWeight:activeCat==="all"?700:400,cursor:"pointer"}}>{t("allProducts")}</div>}
      {groups.map(g => {
        const subs = CATS.filter(c => c.parent === g.id);
        const isOpen = openGroup === g.id;
        const isActive = activeCat === g.id || subs.some(s => s.id === activeCat);
        return (
          <div key={g.id}>
            <div onClick={() => {
              setOpenGroup(isOpen ? null : g.id);
              if (onSelect) onSelect(g.id);
              else go("products",{cat:g.id});
            }}
              style={{padding:"8px 16px",fontSize:12,fontWeight:600,color:isActive?"#ff6000":"#333",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"background .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#fff5ee"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
              <span>{translateCat(g,lang)}</span>
              <span style={{fontSize:10,transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
            </div>
            {isOpen && subs.map(s => (
              <div key={s.id} onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(s.id);
                else go("products",{cat:s.id});
              }}
                style={{padding:"6px 16px 6px 32px",fontSize:11,color:activeCat===s.id?"#ff6000":"#777",fontWeight:activeCat===s.id?600:400,cursor:"pointer",transition:"background .15s,color .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#fff5ee";e.currentTarget.style.color="#ff6000"}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=activeCat===s.id?"#ff6000":"#777"}}>
                {translateCat(s,lang)}
              </div>
            ))}
          </div>
        );
      })}
    </aside>
  );
}

// ===== CATEGORY SIDEBAR V2 =====
function CategoryIcon({visual, small=false, alt=""}) {
  const size = small ? 22 : 32;
  const img = visual?.img;
  const fallbackStyle = {
    display: img ? "none" : "inline-flex",
    alignItems:"center",
    justifyContent:"center",
    width:"100%",
    height:"100%",
    color:"#08111f",
    fontSize:small?10:13,
    fontWeight:950,
  };
  return (
    <span style={{
      width:size,
      height:size,
      borderRadius:small?7:10,
      display:"inline-flex",
      alignItems:"center",
      justifyContent:"center",
      flex:"0 0 auto",
      overflow:"hidden",
      position:"relative",
      background:`radial-gradient(circle at 30% 18%, rgba(255,255,255,.92), transparent 34%), linear-gradient(135deg,${visual.color},rgba(255,255,255,.78))`,
      border:"1px solid rgba(255,255,255,.38)",
      boxShadow:`0 10px 22px ${visual.bg}, inset 0 1px 0 rgba(255,255,255,.45)`,
    }}>
      {img && <img src={cdnImg(img, small ? 80 : 120)} alt={alt} loading="lazy" decoding="async" width={size} height={size}
        style={{width:"100%",height:"100%",objectFit:"contain",padding:small?2:3,filter:"drop-shadow(0 5px 7px rgba(0,0,0,.42))"}}
        onError={e=>{e.currentTarget.style.display="none"; const fallback=e.currentTarget.nextElementSibling; if (fallback) fallback.style.display="inline-flex";}} />}
      <span style={fallbackStyle}>{visual.icon}</span>
    </span>
  );
}

function CategorySidebarV2({go, activeCat, onSelect, isFixed}) {
  const [openGroup, setOpenGroup] = useState(null);
  const [headerH, setHeaderH] = useState(190);
  const {t, lang} = use$();
  const groups = getGroups();
  useEffect(() => {
    if (!isFixed) return;
    const measure = () => {
      const h = document.querySelector("header");
      if (h) setHeaderH(h.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro && document.querySelector("header")) ro.observe(document.querySelector("header"));
    return () => { window.removeEventListener("resize", measure); if (ro) ro.disconnect(); };
  }, [isFixed]);

  const shellStyle = isFixed
    ? {position:"fixed",left:0,top:0,width:220,height:"100vh",overflowY:"auto",borderRight:"1px solid rgba(255,255,255,.1)",background:"radial-gradient(circle at 16% 8%, rgba(255,96,0,.22), transparent 34%), linear-gradient(180deg,#0b1020,#111827 58%,#1b1110)",padding:`${headerH + 12}px 10px 12px`,zIndex:50,boxShadow:"16px 0 38px rgba(0,0,0,.28)",color:"#fff"}
    : {borderRadius:8,background:"radial-gradient(circle at 10% 0%, rgba(255,96,0,.22), transparent 38%), linear-gradient(180deg,#0b1020,#111827)",padding:10,color:"#fff",border:"1px solid rgba(255,255,255,.1)"};
  const allVisual = categoryVisual("all");
  const rowBase = {display:"flex",alignItems:"center",gap:9,borderRadius:8,cursor:"pointer",transition:"background .15s,border-color .15s,color .15s,transform .15s"};

  return (
    <aside style={shellStyle}>
      {isFixed && <div style={{padding:"6px 8px 12px",fontSize:13,fontWeight:950,color:"#fff",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
        <CategoryIcon visual={allVisual} small alt={t("categories")} />
        <span>{t("categories")}</span>
      </div>}
      {onSelect && <div onClick={() => onSelect("all")} style={{...rowBase,padding:"8px 8px",margin:"3px 0 6px",fontSize:12,color:activeCat==="all"?"#fff":"#cbd5e1",fontWeight:activeCat==="all"?900:700,background:activeCat==="all"?"rgba(255,96,0,.2)":"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
        <CategoryIcon visual={allVisual} small alt={t("allProducts")} />
        <span>{t("allProducts")}</span>
      </div>}
      {groups.map(g => {
        const subs = CATS.filter(c => c.parent === g.id);
        const isOpen = openGroup === g.id;
        const isActive = activeCat === g.id || subs.some(s => s.id === activeCat);
        const visual = categoryVisual(g);
        return (
          <div key={g.id} style={{margin:"4px 0"}}>
            <div
              onClick={() => {
                setOpenGroup(isOpen ? null : g.id);
                if (onSelect) onSelect(g.id);
                else go("products",{cat:g.id});
              }}
              style={{...rowBase,padding:"8px 8px",fontSize:12,fontWeight:900,color:isActive?"#fff":"#e5e7eb",background:isActive?`linear-gradient(135deg,${visual.bg},rgba(255,255,255,.08))`:"rgba(255,255,255,.035)",border:`1px solid ${isActive?visual.color:"rgba(255,255,255,.07)"}`}}
              onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${visual.bg},rgba(255,255,255,.09))`;e.currentTarget.style.transform="translateX(2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.background=isActive?`linear-gradient(135deg,${visual.bg},rgba(255,255,255,.08))`:"rgba(255,255,255,.035)";e.currentTarget.style.transform="translateX(0)"}}
            >
              <CategoryIcon visual={visual} alt={translateCat(g,lang)} />
              <span style={{flex:1,lineHeight:1.25}}>{translateCat(g,lang)}</span>
              <span style={{fontSize:14,color:visual.color,transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
            </div>
            {isOpen && subs.map(s => {
              const subVisual = categoryVisual(s);
              return (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelect) onSelect(s.id);
                    else go("products",{cat:s.id});
                  }}
                  style={{...rowBase,margin:"4px 0 4px 18px",padding:"6px 8px",fontSize:11,color:activeCat===s.id?"#fff":"#aeb8c7",fontWeight:activeCat===s.id?900:700,background:activeCat===s.id?subVisual.bg:"transparent",border:"1px solid transparent"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=subVisual.bg;e.currentTarget.style.color="#fff"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=activeCat===s.id?subVisual.bg:"transparent";e.currentTarget.style.color=activeCat===s.id?"#fff":"#aeb8c7"}}
                >
                  <CategoryIcon visual={subVisual} small alt={translateCat(s,lang)} />
                  <span style={{lineHeight:1.25}}>{translateCat(s,lang)}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}

// ===== Text içindeki telefon/mail'leri tıklanabilir link yapar =====
function linkifyContacts(text) {
  if (!text) return null;
  return text.split(/(0850\s?888\s?7881|0545\s?608\s?7008|info@frenciniz\.com)/g).map((part, i) => {
    const clean = (part||"").replace(/\s+/g," ");
    if (clean === "0850 888 7881" || clean === "08508887881") return <a key={i} href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",fontWeight:700,textDecoration:"underline"}}>{part}</a>;
    if (clean === "0545 608 7008" || clean === "05456087008") return <a key={i} href="tel:+905456087008" style={{color:"#ff6000",fontWeight:700,textDecoration:"underline"}}>{part}</a>;
    if (clean === "info@frenciniz.com") return <a key={i} href="mailto:info@frenciniz.com" style={{color:"#ff6000",textDecoration:"underline"}}>{part}</a>;
    return part;
  });
}

// ===== Chat mesajlarındaki URL/telefon/mail'leri tıklanabilir yapar =====
function formatChatText(text) {
  if (!text) return null;
  const URL_RE = /(https?:\/\/[^\s)]+|0850\s?888\s?7881|0545\s?608\s?7008|info@frenciniz\.com)/g;
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    const trimmed = part.trim();
    if (trimmed.startsWith("http")) {
      return <a key={i} href={trimmed} target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline",wordBreak:"break-all"}}>{trimmed}</a>;
    }
    const clean = trimmed.replace(/\s+/g, " ");
    if (clean === "0850 888 7881") return <a key={i} href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline",fontWeight:600}}>{part}</a>;
    if (clean === "0545 608 7008") return <a key={i} href="tel:+905456087008" style={{color:"inherit",textDecoration:"underline",fontWeight:600}}>{part}</a>;
    if (clean === "info@frenciniz.com") return <a key={i} href="mailto:info@frenciniz.com" style={{color:"inherit",textDecoration:"underline"}}>{part}</a>;
    return part;
  });
}

// ===== OPTIMIZED IMAGE with skeleton + CDN =====
// stage: 0=Vercel proxy (resize + Edge cache), 1=wsrv.nl direct, 2=S3 direct, 3=logo
function OptImg({src, alt, w, h, style, cdnW, eager}) {
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState(0);
  // Stage 0: 2.5sn'de yüklenmezse wsrv.nl'e atla; 1: 3sn → S3
  useEffect(() => {
    if (loaded) return;
    const timeouts = { 0: 2500, 1: 3000 };
    const ms = timeouts[stage];
    if (!ms) return;
    const timer = setTimeout(() => { if (!loaded) setStage(s => s + 1); }, ms);
    return () => clearTimeout(timer);
  }, [stage, loaded]);
  const baseW = cdnW || 300;
  const finalSrc =
    stage === 0 ? cdnImg(src, baseW) :
    stage === 1 ? cdnImgFallback(src, baseW) :
    stage === 2 ? directImg(src) :
    SITE_IMAGES.missingProduct;
  const srcSet =
    stage === 0 ? cdnSrcSet(src, baseW) :
    stage === 1 ? cdnSrcSet(src, baseW) : undefined;
  return (
    <>
      {!loaded && <div aria-hidden="true" style={{position:"absolute",inset:"10%",background:"linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",borderRadius:6,pointerEvents:"none"}} />}
      <img src={finalSrc} srcSet={srcSet} sizes={w ? `${w}px` : undefined} alt={alt||""} width={w} height={h}
        loading={eager ? "eager" : "lazy"} decoding="async" fetchpriority={eager ? "high" : "auto"}
        style={{...style, opacity: loaded ? 1 : 0, transition: "opacity .2s ease-out"}}
        onLoad={()=>setLoaded(true)}
        onError={()=>{ if(stage<3){setStage(s=>s+1); setLoaded(false);} else {setLoaded(true);} }} />
    </>
  );
}

// ===== PRODUCT CARD with Favorite =====
function ProductCard({p, eager}) {
  const {go, addToCart, favs, toggleFav, fp, t, lang, isMobile} = use$();
  const [showAlert, setShowAlert] = useState(false);
  const disc = p.old ? Math.round((1 - p.price/p.old) * 100) : 0;
  const isFav = favs.includes(p.id);
  const [accentA, accentB] = productAccent(p);
  const realImage = hasRealImg(p);
  const displayImage = Boolean(productGalleryImages(p).length);
  const catName = productCategoryName(p, lang);
  const quoteHref = productWhatsAppUrl(p, 1);
  const seoCardName = productSearchName(p, CATS, 112) || p.name;

  return (
    <div onClick={() => go("product",{id:p.id})}
      className="fr-product-card fr-card-hover"
      style={{border:"1px solid rgba(15,23,42,.08)",borderRadius:8,overflow:"hidden",cursor:"pointer",background:"#fff",transition:"transform .22s ease, box-shadow .22s ease, border-color .22s ease",boxShadow:"0 12px 34px rgba(15,23,42,.08)",minHeight:"100%",display:"flex",flexDirection:"column"}}
      onMouseEnter={e => {e.currentTarget.style.boxShadow=`0 20px 55px ${accentA}33`;e.currentTarget.style.borderColor=`${accentA}66`;}}
      onMouseLeave={e => {e.currentTarget.style.boxShadow="0 12px 34px rgba(15,23,42,.08)";e.currentTarget.style.borderColor="rgba(15,23,42,.08)";}}>
      <div style={{height:isMobile?176:212,background:`radial-gradient(circle at 78% 18%, ${accentB}33, transparent 32%), linear-gradient(145deg,#0b1020,#161b29 58%,#222835)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,.14),transparent 35%,rgba(255,96,0,.16))",pointerEvents:"none"}} />
        {displayImage ? (
          <OptImg src={prodImg(p)} alt={lang==="en" ? translateName(p.name,lang) : seoCardName} eager={eager} style={{maxWidth:"82%",maxHeight:"82%",objectFit:"contain",filter:"drop-shadow(0 18px 24px rgba(0,0,0,.38))",transition:"transform .25s ease"}} />
        ) : (
          <RepresentativeProductVisual p={p} lang={lang} />
        )}
        {!realImage && displayImage && <span style={{position:"absolute",left:10,top:10,background:"rgba(255,255,255,.92)",color:"#111",fontSize:10,fontWeight:900,padding:"4px 8px",borderRadius:4,letterSpacing:0}}>{lang==="en"?"Representative":"Temsili gorsel"}</span>}
        {disc > 0 && <span style={{position:"absolute",top:10,left:10,background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#111",fontSize:12,fontWeight:900,padding:"4px 9px",borderRadius:4}}>%{disc}</span>}
        {p.stock > 0 && <span style={{position:"absolute",top:10,right:48,background:"rgba(34,197,94,.95)",color:"#fff",fontSize:11,fontWeight:800,padding:"4px 8px",borderRadius:4}}>{lang==="en"?"In stock":"Stokta"}</span>}
        <button onClick={e => {e.stopPropagation(); toggleFav(p.id)}}
          aria-label="Favori"
          style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.96)",border:"1px solid rgba(255,255,255,.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:isFav?"#ff6000":"#9ca3af",cursor:"pointer",boxShadow:"0 8px 18px rgba(0,0,0,.2)"}}>
          {isFav ? "♥" : "♡"}
        </button>
        {!p.stock && <div style={{position:"absolute",inset:0,background:"rgba(7,10,18,.68)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{background:"#fff",padding:"7px 16px",borderRadius:4,fontSize:12,fontWeight:800,color:"#d9480f"}}>{t("outOfStock")}</span></div>}
      </div>
      <div style={{padding:isMobile?"11px 10px 12px":"13px 14px 16px",display:"flex",flexDirection:"column",gap:7,flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div style={{fontSize:11,color:accentA,fontWeight:900,textTransform:"uppercase",letterSpacing:.2}}>{p.brand || "Ekersan"}</div>
          <div style={{fontSize:10,color:"#64748b",fontWeight:700,background:"#f1f5f9",padding:"3px 7px",borderRadius:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:isMobile?72:120}}>{catName}</div>
        </div>
        <div style={{fontSize:isMobile?13:14,fontWeight:800,color:"#111827",lineHeight:1.32,minHeight:isMobile?34:38,overflowWrap:"anywhere"}}>{lang==="en" ? translateName(p.name,lang) : seoCardName}</div>
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:5,fontSize:11,color:"#64748b"}}>
          <span style={{fontWeight:900,color:"#111827",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,padding:"4px 7px",lineHeight:1}}>SKU {p.sku}</span>
          {p.oem ? (
            <span title={String(p.oem)} style={{fontWeight:800,color:"#475569",background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:5,padding:"4px 7px",lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>OEM {String(p.oem).slice(0,32)}</span>
          ) : (
            <span style={{fontWeight:800,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:5,padding:"4px 7px",lineHeight:1}}>OEM ile teyit</span>
          )}
        </div>
        {p.compat && p.compat.length > 0 && <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {p.compat.slice(0,4).map((c,i) => {
            const isUniv = c==="Ağır Vasıta";
            const label = isUniv && t("heavyDuty") ? t("heavyDuty") : c;
            return <span key={i} style={{fontSize:9,padding:"3px 7px",background:isUniv?`${accentA}15`:"#eef6ff",color:isUniv?accentA:"#1d4ed8",borderRadius:4,fontWeight:800}}>{label}</span>;
          })}
          {p.compat.length > 4 && <span style={{fontSize:9,padding:"2px 6px",color:"#999"}}>+{p.compat.length-4}</span>}
        </div>}
        <div style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:isMobile?7:10,marginTop:"auto",paddingTop:4,flexDirection:isMobile?"column":"row",minWidth:0}}>
          <div style={{minWidth:0}}>
            <span style={{fontSize:isMobile?18:21,fontWeight:900,color:"#0f172a"}}>{fp(p.price)}</span>
            {p.old && <span style={{fontSize:13,color:"#bbb",textDecoration:"line-through",marginLeft:6}}>{fp(p.old)}</span>}
            <div style={{fontSize:10,color:"#16a34a",fontWeight:900,marginTop:3,lineHeight:1.25}}>Kargo + uyum teyidi</div>
          </div>
          <button onClick={e => {e.stopPropagation(); p.stock ? addToCart(p) : setShowAlert(true)}}
            className="fr-card-action"
            style={{width:isMobile?"100%":"auto",padding:isMobile?"9px 8px":"9px 13px",background:p.stock?"#111827":"#fff",color:p.stock?"#fff":"#ff6000",border:p.stock?"none":"1px solid #ff6000",borderRadius:6,fontSize:isMobile?11:(p.stock?12:11),fontWeight:900,whiteSpace:"nowrap",transition:"background .2s ease,color .2s ease",textAlign:"center",boxSizing:"border-box"}}>
            {p.stock ? t("addToCart") : t("notifyMe")}
          </button>
        </div>
        <a href={quoteHref} target="_blank" rel="noopener noreferrer" data-lead-source="product_card_whatsapp" data-lead-product-id={p.id} data-lead-sku={p.sku || ""} data-lead-category={p.cat || ""} data-lead-value={p.price || 0}
          onClick={e => {e.stopPropagation(); recordLeadEvent("whatsapp", { source:"product_card_whatsapp", href:quoteHref, productId:p.id, sku:p.sku || "", category:p.cat || "", value:p.price || 0 }); metaTrack("Contact", metaProductPayload(p, 1, p.cat)); metaTrackCustom("WhatsAppLead", { source: "product_card", productId: p.id, category: p.cat });}}
          style={{minHeight:isMobile?40:38,borderRadius:6,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:isMobile?11:12,fontWeight:950,marginTop:2,textAlign:"center",padding:"0 8px",boxShadow:"0 10px 22px rgba(37,211,102,.16)"}}>
          Fiyat, stok ve uyumluluk sor
        </a>
        {showAlert && <StockAlertInline productId={p.id} onClose={() => setShowAlert(false)} />}
      </div>
    </div>
  );
}

function ProductCardLegacy({p, eager}) {
  const {go, addToCart, favs, toggleFav, fp, t, lang} = use$();
  const [showAlert, setShowAlert] = useState(false);
  const disc = p.old ? Math.round((1 - p.price/p.old) * 100) : 0;
  const isFav = favs.includes(p.id);

  return (
    <div onClick={() => go("product",{id:p.id})}
      style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden",cursor:"pointer",background:"#fff",transition:"box-shadow .2s"}}
      onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
      <div style={{height:200,background:"#f9f9f9",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <OptImg src={prodImg(p)} alt={translateName(p.name,lang)} eager={eager} style={{maxWidth:"80%",maxHeight:"80%",objectFit:"contain"}} />
        {disc > 0 && <span style={{position:"absolute",top:8,left:8,background:"#ff6000",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:4}}>%{disc}</span>}
        {/* Favorite button */}
        <button onClick={e => {e.stopPropagation(); toggleFav(p.id)}}
          style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:"50%",background:"#fff",border:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:isFav?"#ff6000":"#ccc",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
          {isFav ? "♥" : "♡"}
        </button>
        {!p.stock && <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.8)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{background:"#f0f0f0",padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,color:"#999"}}>{t("outOfStock")}</span></div>}
      </div>
      <div style={{padding:"12px 14px 16px"}}>
        <div style={{fontSize:12,color:"#ff6000",fontWeight:600,marginBottom:4}}>{p.brand}</div>
        <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",lineHeight:1.35,marginBottom:4,minHeight:38}}>{translateName(p.name,lang)}</div>
        <div style={{fontSize:11,color:"#bbb",marginBottom:4}}>{p.sku}</div>
        {p.compat && p.compat.length > 0 && <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
          {p.compat.slice(0,4).map((c,i) => {
            const isUniv = c==="Ağır Vasıta";
            const label = isUniv && t("heavyDuty") ? t("heavyDuty") : c;
            return <span key={i} style={{fontSize:9,padding:"2px 6px",background:isUniv?"#fff4e6":"#f0f4ff",color:isUniv?"#c05200":"#336",borderRadius:3,fontWeight:600}}>{label}</span>;
          })}
          {p.compat.length > 4 && <span style={{fontSize:9,padding:"2px 6px",color:"#999"}}>+{p.compat.length-4}</span>}
        </div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <span style={{fontSize:20,fontWeight:700,color:"#1a1a1a"}}>{fp(p.price)}</span>
            {p.old && <span style={{fontSize:13,color:"#bbb",textDecoration:"line-through",marginLeft:6}}>{fp(p.old)}</span>}
          </div>
          <button onClick={e => {e.stopPropagation(); p.stock ? addToCart(p) : setShowAlert(true)}}
            style={{padding:"8px 14px",background:p.stock?"#ff6000":"#fff",color:p.stock?"#fff":"#ff6000",border:p.stock?"none":"1px solid #ff6000",borderRadius:6,fontSize:p.stock?13:11,fontWeight:600}}>
            {p.stock ? t("addToCart") : t("notifyMe")}
          </button>
        </div>
        {/* Stock Alert Mini Form */}
        {showAlert && <StockAlertInline productId={p.id} onClose={() => setShowAlert(false)} />}
      </div>
    </div>
  );
}

// ===== Recently Viewed =====
function RecentlyViewed() {
  const {viewed, go, fp, t, lang} = use$();
  const items = viewed.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>{t("recentlyViewed")}</h2>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
        {items.slice(0,6).map(p => (
          <div key={p.id} onClick={() => go("product",{id:p.id})}
            style={{minWidth:160,border:"1px solid #eee",borderRadius:8,padding:12,cursor:"pointer",background:"#fff",flexShrink:0}}>
            <img src={cdnImg(prodImg(p),200)} alt={translateName(p.name,lang)} loading="lazy" decoding="async" width={120} height={100} style={{width:"100%",height:100,objectFit:"contain",marginBottom:8,borderRadius:6,background:"#101624"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
            <div style={{fontSize:12,fontWeight:500,color:"#333",lineHeight:1.3,marginBottom:4}}>{translateName(p.name,lang)}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{fp(p.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickQuoteBox({source = "quick_quote", product = null, dark = false}) {
  const {lang, isMobile} = use$();
  const [form, setForm] = useState({
    code: product?.oem || product?.sku || "",
    vehicle: "",
    phone: "",
    note: "",
  });
  const [sent, setSent] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);
  const [callbackStatus, setCallbackStatus] = useState("");
  const bg = dark ? "rgba(4,8,15,.72)" : "#fff";
  const border = dark ? "1px solid rgba(255,255,255,.18)" : "1px solid #dbeafe";
  const text = dark ? "#fff" : "#111827";
  const muted = dark ? "rgba(255,255,255,.72)" : "#64748b";
  const inputStyle = {
    minHeight: 42,
    border: dark ? "1px solid rgba(255,255,255,.18)" : "1px solid #d1d5db",
    borderRadius: 7,
    background: dark ? "rgba(255,255,255,.96)" : "#fff",
    color: "#111827",
    fontSize: 13,
    fontWeight: 700,
    padding: "0 11px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const href = quickQuoteWhatsAppUrl({ product, ...form });
  const cleanPhone = form.phone.replace(/\D/g, "");
  const canRequestCallback = cleanPhone.length >= 10;
  function submit(e) {
    e.preventDefault();
    const payload = {
      source,
      href,
      productId: product?.id || "",
      sku: product?.sku || "",
      category: product?.cat || "",
      value: product?.price || 0,
      code: form.code,
      vehicle: form.vehicle,
      contactPhone: form.phone,
      note: form.note,
    };
    recordLeadEvent("whatsapp", payload);
    metaTrackCustom("QuickQuoteLead", payload);
    setSent(true);
    if (typeof window !== "undefined") window.open(href, "_blank", "noopener,noreferrer");
  }
  function requestCallback() {
    if (!canRequestCallback) {
      setCallbackStatus("Arama icin telefon numarasi gerekli.");
      return;
    }
    const payload = {
      source: `${source}_callback`,
      productId: product?.id || "",
      sku: product?.sku || "",
      category: product?.cat || "",
      value: product?.price || 0,
      code: form.code,
      vehicle: form.vehicle,
      contactPhone: form.phone,
      note: form.note || "Hizli teklif formundan geri arama talebi",
    };
    recordLeadEvent("phone", payload);
    metaTrackCustom("CallbackLead", payload);
    setCallbackSent(true);
    setCallbackStatus("Arama talebi kaydedildi.");
  }
  return (
    <form onSubmit={submit} style={{padding:isMobile?12:14,borderRadius:8,background:bg,border,boxShadow:dark?"0 16px 44px rgba(0,0,0,.22)":"0 14px 34px rgba(37,99,235,.08)"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontSize:12,fontWeight:950,color:dark?"#facc15":"#ff6000",textTransform:"uppercase",letterSpacing:.3}}>
            {lang==="en"?"Fast quote desk":"Hizli teklif masasi"}
          </div>
          <div style={{fontSize:isMobile?14:16,fontWeight:950,color:text,marginTop:3,lineHeight:1.25}}>
            Kod, sase veya eski parca bilgisini gonderin; guncel fiyat, stok ve uyumu teyit edelim.
          </div>
        </div>
        <span style={{fontSize:11,fontWeight:900,color:dark?"#86efac":"#15803d",background:dark?"rgba(34,197,94,.14)":"#dcfce7",borderRadius:999,padding:"5px 8px",whiteSpace:"nowrap"}}>WhatsApp</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
        <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="OEM / SKU / parca kodu" style={inputStyle} />
        <input value={form.vehicle} onChange={e=>setForm(f=>({...f,vehicle:e.target.value}))} placeholder="Arac model / sase no" style={inputStyle} />
        <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Telefon (isterseniz)" style={inputStyle} />
        <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Not: on/arka, olcu, adet..." style={inputStyle} />
      </div>
      <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:8,alignItems:isMobile?"stretch":"center",marginTop:10}}>
        <button type="button" onClick={requestCallback}
          style={{minHeight:44,border:"none",borderRadius:7,background:canRequestCallback?"linear-gradient(135deg,#ff6000,#f97316)":"#cbd5e1",color:canRequestCallback?"#fff":"#64748b",fontSize:13,fontWeight:950,padding:"0 14px",cursor:canRequestCallback?"pointer":"default"}}>
          Beni arayin
        </button>
        <button type="submit" data-lead-source={source} data-lead-product-id={product?.id || ""} data-lead-sku={product?.sku || ""} data-lead-category={product?.cat || ""} data-lead-value={product?.price || 0}
          style={{minHeight:44,border:"none",borderRadius:7,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",fontSize:13,fontWeight:950,padding:"0 14px",cursor:"pointer"}}>
          İndirim kuponu için WhatsApp'tan iletişime geçin
        </button>
        <div style={{fontSize:12,color:muted,lineHeight:1.45}}>
          {callbackStatus || (sent ? "Talep kaydedildi; WhatsApp acildi." : callbackSent ? "Arama talebi kaydedildi." : "Telefon yazarsaniz WhatsApp acmadan da sizi arayabiliriz.")}
        </div>
      </div>
    </form>
  );
}

// ===== HOME =====
function HomePage() {
  const {go, products} = use$();
  const [partQuery, setPartQuery] = useState("");
  const productList = products || [];
  const featured = useMemo(() => {
    const pool = productList.filter(product => Number(product.stock || 0) > 0);
    const priority = ["fren-diski","fren-kampanasi","fren-korugu","kaliper-tamir-takimi","bijon","porya","fren-balatasi"];
    const hotProducts = HOME_PRIORITY_PRODUCT_IDS.map(id => pool.find(product => String(product.id) === String(id))).filter(Boolean);
    const categoryPicks = priority.flatMap(category => pool.filter(product => product.cat === category).slice(0, 2));
    return [...hotProducts, ...categoryPicks]
      .filter((product, index, list) => list.findIndex(item => String(item.id) === String(product.id)) === index)
      .slice(0, 8);
  }, [productList]);
  const totalCount = productList.length || 1055;
  const stockCount = productList.filter(product => Number(product.stock || 0) > 0).length || totalCount;
  const heroProduct = featured.find(hasRealImg) || featured[0];
  useCriticalImagePreload(featured, 3, 420);
  const categories = [
    {cat:"fren-diski", code:"01", title:"Fren Diski", note:"Kamyon, tır ve dorse"},
    {cat:"fren-kampanasi", code:"02", title:"Fren Kampanası", note:"Ford Cargo, BPW, SAF"},
    {cat:"fren-balatasi", code:"03", title:"Fren Balatası", note:"Disk ve kampana grubu"},
    {cat:"fren-korugu", code:"04", title:"Fren Körüğü", note:"Servis ve imdatlı tipler"},
    {cat:"kaliper-tamir-takimi", code:"05", title:"Kaliper Parçaları", note:"Knorr, Wabco, Meritor"},
    {cat:"abs-sensoru-modulu-kablo", code:"06", title:"ABS / EBS", note:"Sensör, kablo ve modül"},
  ];
  const submitSearch = event => {
    event.preventDefault();
    if (partQuery.trim()) go("products", {q: partQuery.trim()});
  };
  const whatsappHref = generalWhatsAppUrl("ana sayfa parça teyidi");

  return <>
    <section className="fr2-hero">
      <div className="fr2-container fr2-hero-grid">
        <div className="fr2-hero-copy">
          <span className="fr2-kicker">Ağır vasıta fren parçasında uzman destek</span>
          <h1>Doğru parçayı<br/><em>ilk seferde</em> bulun.</h1>
          <p>OEM kodunu, araç modelini veya parça adını yazın. Stoktaki uygun ürünü, fiyatı ve teslimat seçeneğini tek ekranda görün.</p>
          <form className="fr2-part-search" onSubmit={submitSearch}>
            <div><span>OEM / SKU / ARAÇ</span><input value={partQuery} onChange={event=>setPartQuery(event.target.value)} placeholder="Örn. 9604210412 veya Actros fren diski" aria-label="Parça ara" /></div>
            <button type="submit">Parçayı bul</button>
          </form>
          <div className="fr2-hero-actions">
            <a className="fr2-wa" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => recordLeadEvent("whatsapp", {source:"home_hero_new", href:whatsappHref})}>WhatsApp’tan fotoğraf gönder</a>
            <a className="fr2-phone" href="tel:+905456087008" onClick={() => recordLeadEvent("phone", {source:"home_hero_new"})}>0545 608 7008</a>
          </div>
          <div className="fr2-proof-row">
            <div><strong>{stockCount.toLocaleString("tr-TR")}</strong><span>stoklu ürün</span></div>
            <div><strong>14:00</strong><span>aynı gün kargo</span></div>
            <div><strong>12 taksit</strong><span>PayTR güvencesi</span></div>
          </div>
        </div>
        {heroProduct && <article className="fr2-hero-product" onClick={()=>go("product",{id:heroProduct.id})}>
          <div className="fr2-stock-pill">Stokta</div>
          <div className="fr2-product-stage"><OptImg src={prodImg(heroProduct)} alt={heroProduct.name} eager style={{maxWidth:"86%",maxHeight:"86%",objectFit:"contain"}} /></div>
          <div className="fr2-hero-product-info">
            <span>Bugünün öne çıkan ürünü</span><h2>{heroProduct.name}</h2>
            <div><b>{heroProduct.sku}</b><strong>{Number(heroProduct.price).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}</strong></div>
          </div>
        </article>}
      </div>
    </section>
    <section className="fr2-section fr2-container">
      <div className="fr2-section-head"><div><span>Hızlı seçim</span><h2>Aradığınız parça grubu</h2></div><button onClick={()=>go("products")}>Tüm ürünler <b>→</b></button></div>
      <div className="fr2-category-grid">{categories.map(item=><button key={item.cat} onClick={()=>go("products",{cat:item.cat})}><span className="fr2-category-code">{item.code}</span><div><strong>{item.title}</strong><small>{item.note}</small></div><b>→</b></button>)}</div>
    </section>
    <section className="fr2-products-section"><div className="fr2-container">
      <div className="fr2-section-head"><div><span>Stoktan hızlı teslim</span><h2>En çok aranan parçalar</h2></div><p>Gerçek ürün bilgisi, görünür OEM kodu ve tek dokunuşla teklif.</p></div>
      <div className="fr2-product-grid">{featured.map((product,index)=><ProductCard key={product.id} p={product} eager={index<3}/>)}</div>
    </div></section>
    <section className="fr2-how"><div className="fr2-container">
      <div className="fr2-section-head fr2-section-head-light"><div><span>Yanlış parça riskini azaltın</span><h2>Üç adımda doğru parça</h2></div></div>
      <div className="fr2-steps"><article><b>1</b><h3>Kodu veya aracı yazın</h3><p>OEM, SKU, şase bilgisi ya da eski parça fotoğrafı yeterli.</p></article><article><b>2</b><h3>Uyumluluğu teyit edin</h3><p>Ekibimiz stok, ölçü ve araç bilgisini siparişten önce kontrol eder.</p></article><article><b>3</b><h3>Güvenle sipariş verin</h3><p>Kartla güvenli ödeme veya WhatsApp üzerinden hızlı sipariş.</p></article></div>
    </div></section>
    <section className="fr2-fleet"><div className="fr2-container fr2-fleet-grid">
      <div><span>Filo · Servis · Toptan alım</span><h2>Parça listenizi gönderin,<br/>tek teklif hazırlayalım.</h2><p>Araç parkı, OEM kodları ve adetleri paylaşın. Stok ve termin bilgisini tek listede alın.</p></div>
      <div><QuickQuoteBox source="home_fleet_new" dark /></div>
    </div></section>
  </>;
}

function HomePagePrevious() {
  const {go, isMobile, t, lang, products} = use$();
  const productList = products || [];
  const popular = useMemo(() => {
    const targetCats = ["fren-diski","fren-diski-abs-li","fren-kampanasi","fren-balatasi"];
    const pool = productList.filter(p => targetCats.includes(p.cat) && p.stock > 0);
    const perCat = {};
    targetCats.forEach(c => { perCat[c] = pool.filter(p => p.cat === c).slice(0, 3); });
    return [...(perCat["fren-diski"]||[]), ...(perCat["fren-kampanasi"]||[]), ...(perCat["fren-balatasi"]||[]), ...(perCat["fren-diski-abs-li"]||[])].slice(0, 8);
  }, [productList]);
  const featured = useMemo(() => {
    const pool = productList.filter(p => p.stock > 0);
    const priority = ["fren-diski","fren-kampanasi","fren-korugu","suspansiyon-korugu","kaliper-tamir-takimi","bijon","porya","fren-balatasi"];
    const hotProducts = HOME_PRIORITY_PRODUCT_IDS
      .map(id => pool.find(p => String(p.id) === String(id)))
      .filter(Boolean);
    const categoryPicks = [];
    priority.forEach(cat => categoryPicks.push(...pool.filter(p => p.cat === cat).slice(0, 2)));
    return [...hotProducts, ...categoryPicks]
      .filter((product, index, list) => list.findIndex(item => String(item.id) === String(product.id)) === index)
      .slice(0, 16);
  }, [productList]);
  const discounted = productList.filter(p => p.old).slice(0, 4);
  const totalCount = productList.length || 1055;
  const stockCount = productList.filter(p => p.stock > 0).length || totalCount;
  useCriticalImagePreload(featured, 2, 320);

  const vehicleCards = [
    {id:"kamyon", name:t("truck"), desc:lang==="en"?"city and long-haul trucks":"sehir ici ve uzun yol kamyonlari", gradient:"linear-gradient(135deg,#ff6000,#facc15)"},
    {id:"tir", name:t("trailer"), desc:lang==="en"?"tractor units and road fleets":"cekici ve yol filolari", gradient:"linear-gradient(135deg,#0ea5e9,#2563eb)"},
    {id:"otobus", name:t("bus"), desc:lang==="en"?"bus brake safety parts":"otobus fren guvenligi", gradient:"linear-gradient(135deg,#22c55e,#14b8a6)"},
    {id:"dorse", name:t("semitrailer"), desc:lang==="en"?"BPW, SAF and trailer parts":"BPW, SAF ve dorse grubu", gradient:"linear-gradient(135deg,#8b5cf6,#f97316)"},
  ];
  const categoryTiles = [
    {cat:"fren-diski", title:lang==="en"?"Brake Discs":"Fren Diskleri", text:lang==="en"?"Actros, MAN, Volvo, Scania":"Actros, MAN, Volvo, Scania", color:"#ff6000"},
    {cat:"fren-kampanasi", title:lang==="en"?"Brake Drums":"Fren Kampanalari", text:lang==="en"?"Ford Cargo, BPW, SAF":"Ford Cargo, BPW, SAF", color:"#f97316"},
    {cat:"fren-korugu", title:lang==="en"?"Brake Chambers":"Fren Korukleri", text:lang==="en"?"24/30, 30/30, disc chambers":"24/30, 30/30, disk korugu", color:"#06b6d4"},
    {cat:"kaliper-tamir-takimi", title:lang==="en"?"Caliper Repair":"Kaliper Tamir", text:lang==="en"?"Knorr, Wabco, ELSA, PAN":"Knorr, Wabco, ELSA, PAN", color:"#8b5cf6"},
  ];
  const heroIntentChips = [
    {label:"FT 34881 koruk", href:"/urun/459/ford-cargo-krone-dorse-kogel-dorse-suspansiyon-korugu-ft-34881-ekersan"},
    {label:"8120 imdatli koruk", href:"/urun/959/ford-cargo-krone-dorse-kogel-dorse-imdatli-fren-korugu-8120-ekersan"},
    {label:"4029106300 ABS", href:"/urun/785/4029106300-saf-holland-dorse-abs-sensoru-eyd-91-11-ekersan"},
    {label:"9604210412 Mercedes disk", href:"/urun/227/9604210412-mercedes-axor-actros-arocs-fren-diski-ekersan"},
    {label:"82DB1125AA Cargo kampana", href:"/urun/138/82db1125aa-ford-cargo-fren-kampanasi-on-esk-040-04-ekersan"},
  ];

  return <>
    {!isMobile && <CategorySidebarV2 go={go} isFixed={true} />}

    <section className="fr-hero">
      <div style={{position:"relative",zIndex:1,maxWidth:1220,margin:"0 auto",padding:isMobile?"42px 18px 34px":"66px 28px 44px",display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.05fr) minmax(310px,.65fr)",gap:isMobile?28:36,alignItems:"center"}}>
        <div style={{maxWidth:720}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:999,background:"rgba(255,96,0,.16)",border:"1px solid rgba(255,96,0,.45)",color:"#ffd8bf",fontSize:12,fontWeight:900,letterSpacing:.4,textTransform:"uppercase",marginBottom:16}}>
            {lang==="en"?"Fast quote by OEM code":"OEM koduyla hizli teklif"}
          </div>
          <h1 style={{fontSize:isMobile?32:62,lineHeight:isMobile?1.1:1.02,fontWeight:950,letterSpacing:0,margin:"0 0 16px",maxWidth:isMobile?350:760,wordBreak:"normal"}}>
            {lang==="en"?"Send the code, confirm the right brake part.":"Parca kodunu gonder, dogru fren parcasini bulalim."}
          </h1>
          <p style={{fontSize:isMobile?15:19,lineHeight:1.7,color:"rgba(255,255,255,.86)",maxWidth:isMobile?320:650,margin:"0 0 24px"}}>
            {lang==="en"?"Heavy-duty brake discs, drums, pads, chambers, calipers, bolts and trailer parts. Send OEM, chassis or old part photo; get stock, price and compatibility confirmation before ordering.":"Agir vasita fren diski, kampana, balata, koruk, kaliper, bijon ve dorse fren parcalarinda OEM, sase veya eski parca fotografiyla stok, fiyat ve uyumluluk teyidi alin."}
          </p>
          <div style={{display:"flex",flexDirection:isMobile?"column":"row",flexWrap:isMobile?"nowrap":"wrap",gap:12,alignItems:isMobile?"stretch":"center",maxWidth:isMobile?310:"none"}}>
            <a href={generalWhatsAppUrl("bugun parca kodu ile teklif")} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"home_hero", href:generalWhatsAppUrl("bugun parca kodu ile teklif") }); metaTrackCustom("WhatsAppLead", { source: "home_hero" }); }} style={{minHeight:50,padding:"14px 22px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",fontWeight:950,fontSize:15,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",textAlign:"center",boxShadow:"0 18px 45px rgba(37,211,102,.24)",animation:"glowPulse 4s ease-in-out infinite"}}>{lang==="en"?"Get today's quote":"Bugun WhatsApp'tan fiyat al"}</a>
            <button onClick={() => go("products")} style={{minHeight:48,padding:"13px 18px",borderRadius:8,border:"1px solid rgba(255,255,255,.28)",background:"rgba(255,255,255,.1)",color:"#fff",fontWeight:850,fontSize:14,cursor:"pointer"}}>{lang==="en"?"See in-stock parts":"Stoklu urunlere bak"}</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16,maxWidth:isMobile?330:650}}>
            {heroIntentChips.map(chip => (
              <a key={chip.href} href={chip.href} onClick={() => metaTrackCustom("SeoHeroIntentClick", { source: "home_hero_intent", href: chip.href })}
                style={{display:"inline-flex",alignItems:"center",minHeight:34,padding:"8px 11px",borderRadius:999,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"#fff",textDecoration:"none",fontSize:12,fontWeight:900,lineHeight:1.2}}>
                {chip.label}
              </a>
            ))}
          </div>
          <div style={{marginTop:16,maxWidth:isMobile?340:620}}>
            <QuickQuoteBox source="home_hero_form" dark />
          </div>
        </div>

        <div className="fr-glass" style={{borderRadius:8,padding:isMobile?16:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{n:`${totalCount}+`,l:lang==="en"?"products":"urun"},{n:`${stockCount}+`,l:lang==="en"?"in stock":"stoklu"},{n:"14:00",l:lang==="en"?"same-day cargo":"ayni gun kargo"},{n:"OEM",l:lang==="en"?"chassis check":"sase teyidi"}].map((s,i)=>(
              <div key={i} style={{padding:14,borderRadius:8,background:"rgba(5,8,15,.72)",border:"1px solid rgba(255,255,255,.12)"}}>
                <div style={{fontSize:isMobile?22:28,fontWeight:950,color:i===0?"#facc15":i===1?"#22c55e":"#fff",lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.72)",fontWeight:700,marginTop:6}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:14,borderRadius:8,background:"linear-gradient(135deg,rgba(255,96,0,.24),rgba(14,165,233,.18))",border:"1px solid rgba(255,255,255,.16)"}}>
            <div style={{fontSize:13,fontWeight:900,color:"#fff",marginBottom:5}}>{lang==="en"?"OEM code, chassis or old part photo is enough.":"OEM kodu, sase veya eski parca fotografi yeterli."}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",lineHeight:1.6}}>{lang==="en"?"The right part is confirmed before shipment.":"Kargodan once dogru parca teyidi alinir."}</div>
          </div>
        </div>
      </div>
    </section>

    <section style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"26px 18px 12px":"34px 24px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:16}}>
        <div>
          <div style={{fontSize:12,color:"#ff6000",fontWeight:950,textTransform:"uppercase",letterSpacing:.5}}>{lang==="en"?"Showcase":"Vitrin"}</div>
          <h2 style={{fontSize:isMobile?24:30,fontWeight:950,color:"#111827",letterSpacing:0}}>{t("featured")}</h2>
        </div>
        <button onClick={() => go("products")} style={{background:"#111827",border:"none",color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",borderRadius:8,padding:"10px 14px"}}>{t("seeAll")}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:isMobile?10:16}}>{featured.map((p,i) => <ProductCard key={p.id} p={p} eager={i<2} />)}</div>
    </section>

    <section style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"14px 18px 28px":"8px 24px 34px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:16}}>
        <div>
          <div style={{fontSize:12,color:"#0ea5e9",fontWeight:950,textTransform:"uppercase",letterSpacing:.5}}>{lang==="en"?"Best sellers":"Cok satan urunler"}</div>
          <h2 style={{fontSize:isMobile?24:30,fontWeight:950,color:"#111827"}}>{t("bestSellers")}</h2>
        </div>
        <button onClick={() => go("products")} style={{background:"transparent",border:"1px solid #cbd5e1",color:"#111827",fontSize:13,fontWeight:900,cursor:"pointer",borderRadius:8,padding:"10px 14px"}}>{t("seeAll")}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:isMobile?10:16}}>{popular.slice(0,8).map((p,i) => <ProductCard key={p.id} p={p} eager={false} />)}</div>
    </section>

    <section style={{background:"#0b1020",padding:isMobile?"18px 0":"24px 0",borderTop:"1px solid rgba(255,255,255,.08)",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:"0 20px",display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
        {vehicleCards.map(v => (
          <button key={v.id} onClick={() => go("products",{veh:v.id})} className="fr-vehicle-card" style={{textAlign:"left",padding:isMobile?14:18,borderRadius:8,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#fff",transition:"transform .2s ease,border-color .2s ease",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",right:-24,top:-26,width:90,height:90,borderRadius:"50%",background:v.gradient,opacity:.28}} />
            <div style={{fontSize:11,color:"#cbd5e1",fontWeight:900,textTransform:"uppercase",letterSpacing:.5}}>{lang==="en"?"Shop by vehicle":"Araca gore"}</div>
            <div style={{fontSize:isMobile?18:22,fontWeight:950,marginTop:5}}>{v.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.68)",lineHeight:1.45,marginTop:4}}>{v.desc}</div>
          </button>
        ))}
      </div>
    </section>

    <section style={{maxWidth:1220,margin:"0 auto",padding:isMobile?"28px 18px 12px":"36px 24px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:14}}>
        {categoryTiles.map(tile => (
          <button key={tile.cat} onClick={() => go("products",{cat:tile.cat})} style={{textAlign:"left",border:"1px solid rgba(15,23,42,.08)",borderRadius:8,background:"#fff",padding:18,boxShadow:"0 12px 34px rgba(15,23,42,.07)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-30,bottom:-30,width:110,height:110,borderRadius:"50%",background:tile.color,opacity:.14}} />
            <div style={{fontSize:13,color:tile.color,fontWeight:950,textTransform:"uppercase",letterSpacing:.4}}>{lang==="en"?"Fast category":"Hizli kategori"}</div>
            <div style={{fontSize:21,fontWeight:950,color:"#111827",marginTop:7}}>{tile.title}</div>
            <div style={{fontSize:13,color:"#64748b",lineHeight:1.5,marginTop:6}}>{tile.text}</div>
          </button>
        ))}
      </div>
    </section>

    {discounted.length > 0 && <section style={{background:"linear-gradient(135deg,#fff7ed,#eef6ff)",padding:isMobile?"28px 0":"34px 0",borderTop:"1px solid rgba(255,96,0,.12)",borderBottom:"1px solid rgba(14,165,233,.12)"}}>
      <div style={{maxWidth:1220,margin:"0 auto",padding:"0 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h2 style={{fontSize:isMobile?22:28,fontWeight:950,color:"#111827"}}>{t("discounted")}</h2>
          <span style={{fontSize:12,color:"#9a3412",fontWeight:900,background:"#ffedd5",padding:"6px 10px",borderRadius:999}}>{lang==="en"?"Limited stock":"Stokla sinirli"}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:isMobile?10:16}}>{discounted.map((p,i) => <ProductCard key={p.id} p={p} eager={i<2} />)}</div>
      </div>
    </section>}

    <section style={{background:"#111827",color:"#fff",padding:isMobile?"26px 18px":"32px 24px"}}>
      <div style={{maxWidth:1220,margin:"0 auto",display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
        {[{title:t("sameDay"),desc:t("sameDayDesc"),color:"#ff6000"},{title:t("origGuarantee"),desc:t("origDesc"),color:"#22c55e"},{title:t("installment"),desc:t("installmentDesc"),color:"#0ea5e9"},{title:t("returnPolicy"),desc:t("returnDesc"),color:"#facc15"}].map((f,i) => (
          <div key={i} style={{padding:18,border:"1px solid rgba(255,255,255,.1)",borderRadius:8,background:"rgba(255,255,255,.05)"}}>
            <div style={{width:34,height:4,borderRadius:99,background:f.color,marginBottom:12}} />
            <div style={{fontSize:15,fontWeight:950}}>{f.title}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.68)",marginTop:4,lineHeight:1.5}}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>

    <HomeIntentLinks isMobile={isMobile} lang={lang} />
  </>;
}

function HomePageLegacy() {
  const {go, isMobile, t, lang, products} = use$();
  const popular = useMemo(() => {
    const targetCats = ["fren-diski","fren-diski-abs-li","fren-kampanasi","fren-balatasi"];
    const pool = (products||[]).filter(p => targetCats.includes(p.cat) && hasDisplayImg(p) && p.stock > 0);
    const perCat = {};
    targetCats.forEach(c => { perCat[c] = pool.filter(p => p.cat === c).slice(0, 2); });
    const balanced = [...(perCat["fren-diski"]||[]), ...(perCat["fren-kampanasi"]||[]), ...(perCat["fren-balatasi"]||[]), ...(perCat["fren-diski-abs-li"]||[])];
    return balanced.slice(0, 8);
  }, [products]);
  // Öne Çıkanlar — farklı kategorilerden 25 karışık ürün (oturum başına stabil)
  const featured = useMemo(() => {
    const pool = (products||[]).filter(p => hasDisplayImg(p) && p.stock > 0);
    const byCat = {};
    pool.forEach(p => { (byCat[p.cat] ||= []).push(p); });
    const sample = [];
    Object.values(byCat).forEach(arr => { sample.push(...arr.slice(0, 2)); });
    // Deterministik karıştırma (her oturumda aynı sıra)
    let seed = 42;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const shuffled = [...sample].sort(() => rnd() - 0.5);
    return shuffled.slice(0, 25);
  }, [products]);
  const discounted = (products||[]).filter(p => p.old);
  // Kritik görsel preload — ilk 6 öne çıkan ürünün görselini browser'a önceden indirt
  useCriticalImagePreload(featured, 2, 320);

  return <>
    {/* Sol kenar kategori çubuğu (sadece geniş ekran) - hiyerarşik */}
    {!isMobile && <CategorySidebarV2 go={go} isFixed={true} />}

    {/* Banner */}
    <div style={{background:"linear-gradient(90deg, #ff6000, #ff8c00)",padding:"40px 0"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{fontSize:32,fontWeight:800,color:"#fff",marginBottom:8}}>{t("heroTitle")}</h1>
          <p style={{fontSize:16,color:"rgba(255,255,255,.85)",marginBottom:20}}>{t("heroDesc")}</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#fff",color:"#ff6000",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer"}}>{t("browseProducts")}</button>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[{n:`${(products||[]).length.toLocaleString("tr-TR")}`,l:t("products")},{n:"52",l:lang==="tr"?"Kategori":"Categories"},{n:`${products?.length ? Math.round(products.filter(p => Number(p.stock || 0) > 0).length / products.length * 100) : 0}%`,l:lang==="tr"?"Stoklu":"In stock"}].map((s,i) => (
            <div key={i} style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:28,fontWeight:800}}>{s.n}</div><div style={{fontSize:12,opacity:.8}}>{s.l}</div></div>
          ))}
        </div>
      </div>
    </div>

    {/* Vehicles */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("byVehicle")}</h2>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
        {[{id:"kamyon",name:t("truck"),emoji:"🚚",count:"4.200+"},{id:"tir",name:t("trailer"),emoji:"🚛",count:"3.800+"},{id:"otobus",name:t("bus"),emoji:"🚌",count:"2.900+"},{id:"dorse",name:t("semitrailer"),emoji:"⬜",count:"1.600+"}].map(v => (
          <div key={v.id} onClick={() => go("products",{veh:v.id})}
            style={{padding:isMobile?"14px":"20px",border:"1px solid #eee",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e => e.currentTarget.style.borderColor="#eee"}>
            <span style={{fontSize:isMobile?24:32}}>{v.emoji}</span>
            <div><div style={{fontSize:isMobile?13:15,fontWeight:600}}>{v.name}</div><div style={{fontSize:12,color:"#999"}}>{v.count} {t("pieces")}</div></div>
          </div>
        ))}
      </div>
    </div>

    {/* Featured — Öne Çıkanlar (25 karışık ürün, üstte) */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px 32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700}}>{t("featured")}</h2>
        <button onClick={() => go("products")} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("seeAll")}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{featured.map((p,i) => <ProductCard key={p.id} p={p} eager={i<2} />)}</div>
    </div>

    {/* Discounted */}
    {discounted.length > 0 && <div style={{background:"#fff8f0",padding:"32px 0"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("discounted")}</h2>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{discounted.slice(0,4).map((p,i) => <ProductCard key={p.id} p={p} eager={i<2} />)}</div>
      </div>
    </div>}

    {/* Best Sellers — Çok Satanlar (altta) */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px 32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700}}>{t("bestSellers")}</h2>
        <button onClick={() => go("products")} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("seeAll")}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{popular.slice(0,8).map((p,i) => <ProductCard key={p.id} p={p} eager={false} />)}</div>
    </div>

    {/* Info */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px 40px"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>
        {[{icon:"🚚",title:t("sameDay"),desc:t("sameDayDesc")},{icon:"🛡️",title:t("origGuarantee"),desc:t("origDesc")},{icon:"💳",title:t("installment"),desc:t("installmentDesc")},{icon:"🔄",title:t("returnPolicy"),desc:t("returnDesc")}].map((f,i) => (
          <div key={i} style={{padding:"20px",border:"1px solid #eee",borderRadius:8,display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:28}}>{f.icon}</span>
            <div><div style={{fontSize:14,fontWeight:600}}>{f.title}</div><div style={{fontSize:12,color:"#999"}}>{f.desc}</div></div>
          </div>
        ))}
      </div>
    </div>

    <RecentlyViewed />
  </>;
}

const CATEGORY_MODEL_SUGGESTIONS = [
  {label:"Mercedes Actros", terms:["actros"], query:"Mercedes Actros fren"},
  {label:"Mercedes Axor 1840", terms:["axor 1840","1840"], query:"Mercedes Axor 1840 fren"},
  {label:"Mercedes Axor 3340", terms:["axor 3340","3340"], query:"Mercedes Axor 3340 fren"},
  {label:"Mercedes Axor 4140", terms:["axor 4140","4140"], query:"Mercedes Axor 4140 fren"},
  {label:"Travego / Tourismo", terms:["travego","tourismo"], query:"Travego Tourismo fren"},
  {label:"MAN TGA", terms:["man tga","tga"], query:"MAN TGA fren"},
  {label:"MAN TGS / TGX", terms:["tgs","tgx"], query:"MAN TGS TGX fren"},
  {label:"MAN Fortuna", terms:["fortuna"], query:"MAN Fortuna fren"},
  {label:"Scania G420 / R420", terms:["g420","r420","scania"], query:"Scania G420 R420 fren"},
  {label:"Volvo FH / FM", terms:["volvo fh","volvo fm","fh","fm"], query:"Volvo FH FM fren"},
  {label:"Ford Cargo", terms:["cargo","ford"], query:"Ford Cargo fren"},
  {label:"DAF / Iveco / Renault", terms:["daf","iveco","renault"], query:"DAF Iveco Renault fren"},
  {label:"Kogel / Krone dorse", terms:["kogel","kögel","krone"], query:"Kogel Krone dorse fren"},
  {label:"BPW / SAF dorse", terms:["bpw","saf"], query:"BPW SAF dorse fren"},
];

function categoryModelBlocks(items, lang) {
  const scored = CATEGORY_MODEL_SUGGESTIONS.map(item => {
    const count = items.filter(p => {
      const hay = [p.name,p.brand,p.sku,p.oem,p.desc,...(p.compat||[])].filter(Boolean).join(" ").toLowerCase();
      return item.terms.some(term => hay.includes(term));
    }).length;
    return {...item, count};
  }).filter(item => item.count > 0).sort((a,b) => b.count - a.count);
  const top = scored.slice(0, 8);
  if (top.length) return top;
  return CATEGORY_MODEL_SUGGESTIONS.slice(0, 6).map(item => ({...item, count: 0}));
}

// ===== PRODUCTS =====
function ProductsPage() {
  const {params, q, go, isMobile, t, lang, products, cats} = use$();
  const [cat, setCat] = useState(params?.cat || "all");
  const [veh, setVeh] = useState(params?.veh || "all");
  const [brand, setBrand] = useState(params?.brand || "all");
  const [sort, setSort] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  // Context'ten gelen veri yoksa global'a fallback (ilk render'da)
  const productList = (products && products.length) ? products : PRODUCTS;
  const catList = (cats && cats.length) ? cats : CATS;

  useEffect(() => {
    // Arama yapılınca filtreleri sıfırla (global arama)
    if (params?.q) { setCat("all"); setVeh("all"); setBrand("all"); }
    else { setCat(params?.cat||"all"); setVeh(params?.veh||"all"); setBrand(params?.brand||"all"); }
  }, [params]);

  const term = params?.q || q || "";
  // Kategori filtresi: grup seçilmişse altındaki tüm alt kategorileri dahil et
  const catMatch = useMemo(() => {
    if (cat === "all") return null;
    const group = catList.find(c => c.id === cat && c.isGroup);
    if (group) return catList.filter(c => c.parent === cat).map(c => c.id);
    return [cat];
  }, [cat, catList]);

  const items = useMemo(() => {
    let r = productList.filter(p => {
      if(catMatch && !catMatch.includes(p.cat)) return false;
      if(veh!=="all" && !p.veh.includes(veh)) return false;
      if(brand!=="all" && p.brand!==brand) return false;
      if(term && ![p.name,p.brand,p.sku,p.oem,...(p.compat||[])].some(s=>(s||"").toLowerCase().includes(term.toLowerCase()))) return false;
      return true;
    });
    if(sort==="price-asc") r=[...r].sort((a,b)=>a.price-b.price);
    else if(sort==="price-desc") r=[...r].sort((a,b)=>b.price-a.price);
    else r=[...r].sort((a,b)=>(b.reviews||0)-(a.reviews||0));
    return r;
  }, [cat,catMatch,veh,brand,sort,term,productList]);
  // Kritik görsel preload — listenin ilk 6'sı için browser'a önceden indir
  useCriticalImagePreload(items, 2, 320);

  const activeFilters = (cat!=="all"?1:0)+(veh!=="all"?1:0)+(brand!=="all"?1:0);

  // Aktif kategori adı (breadcrumb ve başlık için)
  const catName = useMemo(() => {
    if (cat === "all") return t("allProducts");
    const found = catList.find(c => c.id === cat);
    return found ? translateCat(found,lang) : t("allProducts");
  }, [cat, t, lang, catList]);

  const salesInfo = useMemo(() => categorySalesInfo(cat, catName, items, productList, catList, lang), [cat, catName, items, productList, catList, lang]);
  const modelBlocks = useMemo(() => categoryModelBlocks(items, lang), [items, lang]);

  const FilterPanel = ({includeCategory=true}={}) => (
    <>
      {includeCategory && <div style={{border:"1px solid rgba(255,96,0,.22)",borderRadius:8,padding:10,marginBottom:16,background:"#0b1020",boxShadow:"0 14px 32px rgba(15,23,42,.12)"}}>
        <div style={{fontSize:14,fontWeight:950,margin:"2px 4px 10px",color:"#fff"}}>{t("category")}</div>
        <CategorySidebarV2 activeCat={cat} onSelect={(id) => go("products", id === "all" ? {} : {cat: id})} go={go} />
      </div>}
      <div style={{border:"1px solid #eee",borderRadius:8,padding:16,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t("vehicleType")}</div>
        {VEHS.map(item => <div key={item.id} onClick={() => setVeh(item.id)} style={{padding:"7px 0",fontSize:13,color:veh===item.id?"#ff6000":"#555",fontWeight:veh===item.id?600:400,cursor:"pointer"}}>{item.name}</div>)}
      </div>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t("brand")}</div>
        <div onClick={() => setBrand("all")} style={{padding:"7px 0",fontSize:13,color:brand==="all"?"#ff6000":"#555",fontWeight:brand==="all"?600:400,cursor:"pointer"}}>{t("allBrands")}</div>
        {BRANDS.map(b => <div key={b} onClick={() => setBrand(b)} style={{padding:"7px 0",fontSize:13,color:brand===b?"#ff6000":"#555",fontWeight:brand===b?600:400,cursor:"pointer"}}>{b}</div>)}
      </div>
    </>
  );

  return (
    <>
    <div className="fr2-products-page" style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={() => go("home")}>{t("home")}</span> / <span style={{color:"#555"}}>{term ? `"${term}"` : catName}</span></div>
      
      <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
        {/* Desktop sidebar */}
        {!isMobile && <div style={{width:220,flexShrink:0,position:"sticky",top:150,maxHeight:"calc(100vh - 170px)",overflowY:"auto"}}><FilterPanel includeCategory={false} /></div>}

        <div style={{flex:1}}>
          {!term && <div className="fr2-category-hero" style={{position:"relative",overflow:"hidden",borderRadius:8,background:"linear-gradient(135deg,#07111f 0%,#111827 54%,#7c2d12 100%)",color:"#fff",padding:isMobile?"18px 16px":"24px 26px",marginBottom:18,boxShadow:"0 20px 50px rgba(15,23,42,.18)",border:"1px solid rgba(255,255,255,.1)"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 10%, rgba(250,204,21,.26), transparent 28%), radial-gradient(circle at 10% 80%, rgba(255,96,0,.25), transparent 32%)",pointerEvents:"none"}} />
            <div style={{position:"relative",display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1fr) 260px",gap:isMobile?16:22,alignItems:"center"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:900,color:"#facc15",textTransform:"uppercase",letterSpacing:.2,marginBottom:8}}>{salesInfo.eyebrow}</div>
                <h1 style={{fontSize:isMobile?22:30,lineHeight:1.1,fontWeight:950,marginBottom:10,letterSpacing:0}}>{salesInfo.title}</h1>
                <p style={{fontSize:isMobile?13:15,lineHeight:1.65,color:"#dbeafe",maxWidth:760,marginBottom:14}}>{salesInfo.desc}</p>
                {salesInfo.chips.length > 0 && <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                  {salesInfo.chips.map(chip => <button key={chip} onClick={() => go("products",{q:chip})} style={{border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",borderRadius:6,padding:"7px 10px",fontSize:12,fontWeight:800,cursor:"pointer"}}>{chip}</button>)}
                </div>}
                <a href={salesInfo.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"category_hero_whatsapp", href:salesInfo.whatsappHref, category:catName }); metaTrackCustom("WhatsAppCategoryLead", { category: cat, name: salesInfo.title }); }}
                  style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:44,padding:"12px 16px",background:"#25D366",color:"#07111f",borderRadius:6,textDecoration:"none",fontSize:14,fontWeight:950,boxShadow:"0 14px 28px rgba(37,211,102,.22)"}}>
                  İndirim kuponu için WhatsApp'tan iletişime geçin
                </a>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                {salesInfo.stats.map(stat => <div key={stat.label} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"13px 10px",minWidth:0}}>
                  <div style={{fontSize:isMobile?20:24,fontWeight:950,color:"#fff",lineHeight:1}}>{stat.value}</div>
                  <div style={{fontSize:11,color:"#cbd5e1",fontWeight:800,marginTop:6,textTransform:"uppercase"}}>{stat.label}</div>
                </div>)}
              </div>
            </div>
          </div>}

          {!term && modelBlocks.length > 0 && <div style={{border:"1px solid rgba(15,23,42,.08)",borderRadius:8,background:"#fff",padding:isMobile?"14px":"16px 18px",marginBottom:16,boxShadow:"0 12px 32px rgba(15,23,42,.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,color:"#ff6000",fontWeight:950,textTransform:"uppercase",letterSpacing:.4}}>{lang==="en"?"Popular compatibility":"Sik aranan uyumluluklar"}</div>
                <div style={{fontSize:isMobile?16:18,fontWeight:950,color:"#111827",marginTop:3}}>{catName} icin marka-model hizli arama</div>
              </div>
              {!isMobile && <a href={generalWhatsAppUrl(`${catName} uyumluluk teyidi`)} target="_blank" rel="noopener noreferrer" onClick={() => { const href = generalWhatsAppUrl(`${catName} uyumluluk teyidi`); recordLeadEvent("whatsapp", { source:"category_model_whatsapp", href, category:catName }); metaTrackCustom("WhatsAppCategoryLead", { source: "model_block", category: cat }); }} style={{fontSize:12,fontWeight:900,color:"#25D366",textDecoration:"none",whiteSpace:"nowrap"}}>Modelimi sor</a>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:8}}>
              {modelBlocks.map(item => (
                <button key={item.label} onClick={() => go("products",{q:item.query})} style={{textAlign:"left",minHeight:isMobile?58:64,border:"1px solid #e2e8f0",borderRadius:8,background:"linear-gradient(135deg,#f8fafc,#fff)",padding:"10px 11px",cursor:"pointer",overflow:"hidden"}}>
                  <div style={{fontSize:13,fontWeight:950,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>
                  <div style={{fontSize:11,color:item.count?"#16a34a":"#64748b",fontWeight:800,marginTop:5}}>{item.count ? `${item.count} urun` : "Uyumluluk teyidi"}</div>
                </button>
              ))}
            </div>
          </div>}

          {!term && items.length > 0 && <div style={{border:"1px solid #bbf7d0",borderRadius:8,background:"linear-gradient(135deg,#f0fdf4,#fff)",padding:isMobile?"12px":"14px 16px",marginBottom:16,boxShadow:"0 12px 34px rgba(22,163,74,.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:isMobile?"flex-start":"center",marginBottom:10,flexDirection:isMobile?"column":"row"}}>
              <div>
                <div style={{fontSize:12,fontWeight:950,color:"#16a34a",textTransform:"uppercase",letterSpacing:.3}}>OEM / sase ile parca teyidi</div>
                <div style={{fontSize:isMobile?14:16,fontWeight:950,color:"#111827",marginTop:3,lineHeight:1.35}}>{catName} icin kod, sase veya eski parca fotosu gonderin.</div>
              </div>
              <a href={generalWhatsAppUrl(`${catName} OEM sase fotograf ile fiyat stok uyumluluk teyidi`)} target="_blank" rel="noopener noreferrer" onClick={() => { const href = generalWhatsAppUrl(`${catName} OEM sase fotograf ile fiyat stok uyumluluk teyidi`); recordLeadEvent("whatsapp", { source:"category_quote_nudge_whatsapp", href, category:catName }); metaTrackCustom("WhatsAppCategoryLead", { source:"category_quote_nudge", category: cat }); }} style={{minHeight:40,padding:"9px 13px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:13,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",whiteSpace:isMobile?"normal":"nowrap",textAlign:"center"}}>
                WhatsApp'tan netlestir
              </a>
            </div>
            <QuickQuoteBox source={`category_quick_quote_${cat}`} />
          </div>}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:10,flexWrap:"wrap"}}>
            <h2 style={{fontSize:isMobile?18:20,fontWeight:700}}>{term ? `"${term}"` : catName} <span style={{fontSize:14,fontWeight:400,color:"#999"}}>({items.length})</span></h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {/* Mobile filter button */}
              {isMobile && <button onClick={() => setShowFilters(true)} style={{padding:"8px 14px",border:"1px solid #ddd",borderRadius:6,background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                ☰ {t("filterTitle")} {activeFilters>0&&<span style={{background:"#ff6000",color:"#fff",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters}</span>}
              </button>}
              <select value={sort} onChange={e => setSort(e.target.value)} style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,color:"#555",background:"#fff"}}>
                <option value="popular">{t("popularity")}</option>
                <option value="price-asc">{t("priceLow")}</option>
                <option value="price-desc">{t("priceHigh")}</option>
              </select>
            </div>
          </div>
          {items.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 18px",color:"#64748b",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff"}}>
              <div style={{fontSize:13,fontWeight:950,letterSpacing:.5,color:"#ff6000",textTransform:"uppercase",marginBottom:12}}>Parca bulunamadi</div>
              <div style={{fontSize:18,fontWeight:900,color:"#111827",marginBottom:8}}>{t("noResults")}</div>
              <div style={{fontSize:13,lineHeight:1.6,maxWidth:440,margin:"0 auto 18px"}}>Aradiginiz OEM, SKU veya arac modelini WhatsApp'tan gonderin; stok ve muadil parcayi hizli teyit edelim.</div>
              <a href={generalWhatsAppUrl(`aranan urun: ${term || catName}`)} target="_blank" rel="noopener noreferrer" onClick={() => { const href = generalWhatsAppUrl(`aranan urun: ${term || catName}`); recordLeadEvent("whatsapp", { source:"no_results_whatsapp", href, search:term || "", category:catName }); metaTrackCustom("WhatsAppLead", { source:"no_results", search:term || "", category:catName }); }} style={{minHeight:44,padding:"12px 18px",borderRadius:8,background:"#25D366",color:"#062813",fontSize:14,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                WhatsApp'tan urunu sor
              </a>
            </div>
          ) : (
            <div className="fr2-catalog-grid" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:isMobile?10:16}}>{items.map((p,i) => <ProductCard key={p.id} p={p} eager={i<2} />)}</div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobile && showFilters && (
        <div style={{position:"fixed",inset:0,zIndex:200}}>
          <div onClick={() => setShowFilters(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)"}} />
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"16px 16px 0 0",maxHeight:"80vh",overflowY:"auto",animation:"slideUp .3s ease",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:700}}>{t("filterTitle")}</div>
              <button onClick={() => setShowFilters(false)} style={{background:"none",border:"none",fontSize:20,color:"#999",cursor:"pointer"}}>✕</button>
            </div>
            <FilterPanel />
            <button onClick={() => setShowFilters(false)} style={{width:"100%",padding:"14px",background:"#ff6000",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16}}>{t("apply")}</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function ProductConversionPanel({p, qty, href, isMobile, fp}) {
  const partCode = p?.oem || p?.sku || "OEM / parca kodu";
  const trustItems = [
    {k:"Mesaj hazir acilir", v:"Urun, SKU, OEM, adet ve sayfa linki otomatik eklenir"},
    {k:"Stok ve fiyat", v:"Guncel durum ayni urun uzerinden teyit edilir"},
    {k:"Uyumluluk kontrolu", v:"Arac modeli, sase veya eski parca koduyla kontrol"},
  ];
  const leadPayload = { source:"product_detail_primary_whatsapp", href, product:p, value:(Number(p?.price || 0) * Number(qty || 1)) };
  return (
    <section aria-label="Hizli teklif ve uyumluluk" style={{
      marginBottom:18,
      padding:isMobile?14:16,
      borderRadius:8,
      background:"linear-gradient(135deg,#07111f,#111827 58%,#172033)",
      color:"#fff",
      border:"1px solid rgba(37,211,102,.28)",
      boxShadow:"0 16px 34px rgba(15,23,42,.16)"
    }}>
      <div style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:950,color:"#facc15",textTransform:"uppercase",letterSpacing:.2,marginBottom:5}}>Urunu dogru secin</div>
          <h2 style={{fontSize:isMobile?18:20,lineHeight:1.2,margin:"0 0 7px",fontWeight:950}}>Kod veya fotograf gonderin, dogru parcayi teyit edelim.</h2>
          <p style={{fontSize:13,lineHeight:1.55,color:"#d1d5db",margin:"0 0 11px"}}>Butona tiklayinca urun, SKU, OEM ve sayfa linki hazir gelir. Arac/sase bilgisini ekleyin; gerekirse eski parca fotografini WhatsApp'tan gonderin.</p>
          <div style={{fontSize:11,color:"#a7f3d0",background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.22)",borderRadius:6,padding:"7px 8px",overflowWrap:"anywhere"}}>Kod: {partCode}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr",gap:8,minWidth:isMobile?0:210}}>
          <a href={href} target="_blank" rel="noopener noreferrer" data-lead-source="product_detail_primary_whatsapp" data-lead-product-id={p?.id} data-lead-sku={p?.sku || ""} data-lead-category={p?.cat || ""} data-lead-value={(Number(p?.price || 0) * Number(qty || 1)) || 0}
            onClick={() => { recordLeadEvent("whatsapp", leadPayload); metaTrack("Contact", metaProductPayload(p, qty, p?.cat)); metaTrackCustom("WhatsAppLead", { source:"product_detail_primary", productId:p?.id, sku:p?.sku }); }}
            style={{minHeight:50,borderRadius:7,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",textDecoration:"none",fontSize:15,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 16px",boxShadow:"0 12px 22px rgba(37,211,102,.22)"}}>
            Kod/fotograf gonder - WhatsApp
          </a>
          <a href="tel:+905456087008" data-lead-source="product_detail_primary_phone" onClick={() => { recordLeadEvent("phone", { source:"product_detail_primary_phone", product:p, value:p?.price || 0 }); metaTrackCustom("PhoneLead", { source:"product_detail_primary", productId:p?.id }); }}
            style={{minHeight:42,borderRadius:7,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.18)",color:"#fff",textDecoration:"none",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 14px"}}>
            Hemen ara: 0545 608 7008
          </a>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>
        {trustItems.map(item => (
          <div key={item.k} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,padding:"9px 10px",minWidth:0}}>
            <div style={{fontSize:11,fontWeight:950,color:"#fff",marginBottom:4}}>{item.k}</div>
            <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.35,overflowWrap:"anywhere"}}>{item.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:12,flexWrap:"wrap",fontSize:12,color:"#cbd5e1"}}>
        <span>Fiyat: <strong style={{color:"#fff"}}>{fp(p?.price || 0)}</strong></span>
        <span>Stok ve uyumluluk siparisten once teyit edilir</span>
      </div>
    </section>
  );
}

function ProductCallbackLeadForm({p, qty, isMobile}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(p?.oem || p?.sku || "");
  const [vehicle, setVehicle] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const canSubmit = cleanPhone.replace(/\D/g, "").length >= 10 && !sending;
  const value = (Number(p?.price || 0) * Number(qty || 1)) || Number(p?.price || 0) || 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus("Telefon numarasini yazin.");
      return;
    }
    setSending(true);
    setStatus("Kaydediliyor...");
    const payload = {
      source: "product_callback_form",
      product: p,
      value,
      contactPhone: phone.trim(),
      code: code.trim(),
      vehicle: vehicle.trim(),
      note: "Urun sayfasindan geri arama talebi",
    };
    try {
      await submitLeadEvent("phone", payload);
      metaTrackCustom("CallbackLead", { source: "product_callback_form", productId: p?.id, sku: p?.sku, value });
      setStatus("Arama talebiniz kaydedildi.");
      setPhone("");
      setVehicle("");
    } catch {
      setStatus("Talep kaydedilemedi. Lutfen 0545 608 7008 numarasini arayin veya WhatsApp'i kullanin.");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    width: "100%",
    minHeight: 42,
    borderRadius: 7,
    border: "1px solid #d7dee8",
    background: "#fff",
    color: "#111827",
    fontSize: 13,
    fontWeight: 700,
    padding: "0 11px",
    outline: "none",
  };

  return (
    <section aria-label="Geri arama talebi" style={{
      marginBottom:18,
      padding:isMobile?14:16,
      borderRadius:8,
      background:"#fff",
      border:"1px solid #dbe3ef",
      boxShadow:"0 12px 26px rgba(15,23,42,.06)"
    }}>
      <div style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row",marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:950,color:"#ff6000",textTransform:"uppercase",letterSpacing:0,marginBottom:4}}>Geri arama</div>
          <h2 style={{fontSize:isMobile?17:19,lineHeight:1.25,margin:"0 0 5px",fontWeight:950,color:"#111827"}}>Telefonunuzu birakin, bu urun icin sizi arayalim.</h2>
          <p style={{fontSize:12.5,lineHeight:1.5,color:"#526070",margin:0}}>Parca kodu, arac veya sase bilgisini ekleyin; fiyat, stok ve uyumlulugu netlestirelim.</p>
        </div>
        <div style={{fontSize:12,fontWeight:950,color:"#087f3d",background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:999,padding:"7px 10px",alignSelf:isMobile?"flex-start":"center",whiteSpace:"nowrap"}}>
          Tek adim
        </div>
      </div>
      <form onSubmit={submit} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.05fr 1fr 1fr auto",gap:8,alignItems:"stretch"}}>
        <input value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Telefon: 05xx xxx xx xx" aria-label="Telefon numarasi" style={inputStyle} />
        <input value={code} onChange={event => setCode(event.target.value)} placeholder="OEM / parca kodu" aria-label="OEM veya parca kodu" style={inputStyle} />
        <input value={vehicle} onChange={event => setVehicle(event.target.value)} placeholder="Arac / sase notu" aria-label="Arac veya sase notu" style={inputStyle} />
        <button type="submit" disabled={!canSubmit} style={{minHeight:42,borderRadius:7,border:"none",background:canSubmit?"#ff6000":"#cbd5e1",color:canSubmit?"#fff":"#64748b",fontSize:13,fontWeight:950,cursor:canSubmit?"pointer":"default",padding:"0 16px",whiteSpace:"nowrap"}}>
          Beni arayin
        </button>
      </form>
      {status && <div style={{marginTop:9,fontSize:12,color:status.includes("kaydedildi")?"#15803d":"#64748b",fontWeight:800}}>{status}</div>}
    </section>
  );
}

// ===== PRODUCT DETAIL =====
function ProductDetailPage() {
  const {params, go, addToCart, addViewed, favs, toggleFav, addStockAlert, isMobile, t, fp, lang, products, dataLoaded} = use$();
  const productList = (products && products.length) ? products : PRODUCTS;
  const p = productList.find(x => x.id === params?.id);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    if (!p) return;
    addViewed(p.id);
    recordFunnelEvent("view_product", {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.cat,
      value: p.price || 0,
      dedupeKey: p.id,
    });
  }, [p?.id]);

  // Products henüz yükleniyor — direct link gelince "bulunamadı" göstermek yerine bekle
  if(!dataLoaded && !p) return <div style={{padding:"60px 20px",textAlign:"center",color:"#999"}}>Yükleniyor...</div>;
  if(!p) return <div style={{padding:"60px 20px",textAlign:"center",color:"#999"}}>Ürün bulunamadı.</div>;
  const disc = p.old ? Math.round((1-p.price/p.old)*100) : 0;
  const related = productList.filter(x => x.cat === p.cat && x.id !== p.id).slice(0,4);
  const isFav = favs.includes(p.id);
  const whatsappQuoteHref = productWhatsAppUrl(p, qty);
  const seoDisplayName = productSearchName(p, CATS, 140) || p.name;
  const detailDesc = translateName(prodDesc(p,lang),lang);
  const compatPreview = Array.isArray(p.compat) ? p.compat.filter(Boolean).slice(0, 7) : [];
  const specs = p.specs && typeof p.specs === "object" ? p.specs : {};
  const seoFaqItems = productSeoFaqItems(p, CATS);
  const galleryImages = productGalleryImages(p);
  const checkoutNow = () => {
    if (!p.stock) return;
    addToCart(p, qty);
    metaTrackCustom("BuyNowClick", { source: "product_detail", product_id: p.id, sku: p.sku, value: (p.price || 0) * qty });
    go("checkout");
  };

  return (
    <div className="fr2-product-detail" style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"16px 12px 104px":"20px"}}>
      <div style={{fontSize:13,color:"#999",marginBottom:20}}>
        <span style={{cursor:"pointer"}} onClick={() => go("home")}>{t("home")}</span> / {(() => { const sub = CATS.find(c=>c.id===p.cat); const grp = sub?.parent ? CATS.find(c=>c.id===sub.parent) : null; return <>{grp && <><span style={{cursor:"pointer"}} onClick={() => go("products",{cat:grp.id})}>{translateCat(grp,lang)}</span> / </>}<span style={{cursor:"pointer"}} onClick={() => go("products",{cat:p.cat})}>{sub ? translateCat(sub,lang) : p.cat}</span></>; })()} / <span style={{color:"#555"}}>{lang==="en" ? translateName(p.name,lang) : seoDisplayName}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?20:32,marginBottom:40}}>
        {/* Image Gallery */}
        {galleryImages.length ? (
          <ImageGallery images={galleryImages} discount={disc} />
        ) : (
          <div style={{position:"relative",height:isMobile?330:520,borderRadius:8,overflow:"hidden",background:"#0b1020",boxShadow:"0 18px 46px rgba(15,23,42,.18)"}}>
            <RepresentativeProductVisual p={p} lang={lang} large />
            {disc > 0 && <div style={{position:"absolute",top:16,left:16,background:"#ff6000",color:"#fff",padding:"6px 12px",borderRadius:6,fontWeight:900}}>-%{disc}</div>}
            <div style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.94)",color:"#111827",padding:"6px 10px",borderRadius:6,fontSize:12,fontWeight:900}}>Temsili gorsel</div>
          </div>
        )}
        <div>
          <div style={{fontSize:13,color:"#ff6000",fontWeight:600,marginBottom:6}}>{p.brand}</div>
          <h1 style={{fontSize:24,fontWeight:700,marginBottom:8}}>{lang==="en" ? translateName(p.name,lang) : seoDisplayName}</h1>
          {Number(p.rating || 0) > 0 && Number(p.reviews || 0) > 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <span style={{color:"#f5a623"}}>★ {p.rating}</span>
              <span style={{color:"#999",fontSize:13}}>{p.reviews} değerlendirme</span>
            </div>
          ) : (
            <div style={{display:"inline-flex",alignItems:"center",gap:7,marginBottom:8,padding:"6px 9px",borderRadius:6,background:"#ecfdf5",border:"1px solid #bbf7d0",color:"#166534",fontSize:12,fontWeight:900}}>
              OEM / şase ile sipariş öncesi uyumluluk teyidi
            </div>
          )}
          <div style={{fontSize:13,color:"#999",marginBottom:16}}>SKU: {p.sku} | OEM: {p.oem}</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.15fr .85fr",gap:10,marginBottom:16}}>
            <div style={{padding:"14px 15px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 10px 24px rgba(15,23,42,.05)"}}>
              <div style={{fontSize:12,fontWeight:900,color:"#ff6000",textTransform:"uppercase",letterSpacing:0,marginBottom:8}}>Uyumluluk adayları</div>
              {compatPreview.length ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {compatPreview.map(label => (
                    <span key={label} style={{fontSize:12,fontWeight:800,color:"#122033",background:"#f3f6fb",border:"1px solid #dbe3ef",borderRadius:5,padding:"6px 8px"}}>{label}</span>
                  ))}
                </div>
              ) : (
                <div style={{fontSize:13,color:"#667085",lineHeight:1.55}}>Araç modeli, şase veya OEM koduyla hızlı uyumluluk teyidi alın.</div>
              )}
            </div>
            <div style={{padding:"14px 15px",background:"linear-gradient(135deg,#07111f,#172033)",border:"1px solid rgba(255,96,0,.2)",borderRadius:8,color:"#fff",boxShadow:"0 12px 26px rgba(15,23,42,.12)"}}>
              <div style={{fontSize:12,fontWeight:900,color:"#facc15",textTransform:"uppercase",letterSpacing:0,marginBottom:8}}>OEM / parça kodu</div>
              <div style={{fontSize:13,lineHeight:1.6,color:"#e5e7eb",overflowWrap:"anywhere"}}>{p.oem || p.sku || "Kod ile teyit"}</div>
              <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.12)"}}>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:900,color:"#a7b0c0",textTransform:"uppercase",marginBottom:3}}>Fiyat</div>
                    <div style={{fontSize:24,fontWeight:950,color:"#fff",lineHeight:1}}>{fp(p.price)}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:900,color:p.stock?"#86efac":"#fecaca",background:p.stock?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)",border:`1px solid ${p.stock?"rgba(34,197,94,.24)":"rgba(239,68,68,.24)"}`,borderRadius:999,padding:"5px 8px",whiteSpace:"nowrap"}}>
                    {p.stock ? `${p.stock} stok` : "Stok yok"}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"104px 1fr",gap:8,alignItems:"stretch"}}>
                  <div style={{display:"grid",gridTemplateColumns:"32px 40px 32px",border:"1px solid rgba(255,255,255,.18)",borderRadius:7,overflow:"hidden",background:"rgba(255,255,255,.06)",minHeight:40}}>
                    <button onClick={() => setQty(Math.max(1,qty-1))} style={{border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer"}}>-</button>
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:950,color:"#fff"}}>{qty}</span>
                    <button onClick={() => setQty(qty+1)} style={{border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer"}}>+</button>
                  </div>
                  <button onClick={() => p.stock && addToCart(p, qty)} disabled={!p.stock} style={{minHeight:40,borderRadius:7,border:"1px solid rgba(255,255,255,.16)",background:p.stock?"#fff":"rgba(255,255,255,.08)",color:p.stock?"#111827":"#94a3b8",fontSize:12,fontWeight:950,cursor:p.stock?"pointer":"default",padding:"0 10px"}}>
                    Sepete ekle
                  </button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1.35fr .85fr",gap:8,marginTop:8}}>
                  <a href={whatsappQuoteHref} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"product_price_box_whatsapp", href:whatsappQuoteHref, product:p, value:(p.price || 0) * qty }); metaTrack("Contact", metaProductPayload(p, qty, p.cat)); }}
                    style={{minHeight:44,borderRadius:7,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",textDecoration:"none",fontSize:12,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 9px"}}>
                    Kupon ve fiyat için WhatsApp
                  </a>
                  <a href="tel:+905456087008" onClick={() => { recordLeadEvent("phone", { source:"product_price_box_phone", product:p, value:p.price || 0 }); metaTrackCustom("PhoneLead", { source:"product_price_box", product_id:p.id, sku:p.sku }); }}
                    style={{minHeight:44,borderRadius:7,background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#111827",textDecoration:"none",fontSize:12,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 9px"}}>
                    Hemen ara
                  </a>
                </div>
                <button onClick={checkoutNow} disabled={!p.stock} style={{width:"100%",minHeight:38,marginTop:8,borderRadius:7,border:"1px solid rgba(255,255,255,.18)",background:p.stock?"rgba(255,255,255,.08)":"#1f2937",color:p.stock?"#fff":"#94a3b8",fontSize:12,fontWeight:900,cursor:p.stock?"pointer":"default"}}>
                  Online ödemeye geç
                </button>
              </div>
              <div style={{fontSize:12,color:"#a7b0c0",marginTop:8,lineHeight:1.45}}>Siparişten önce eski parça fotoğrafı veya şase ile kontrol önerilir.</div>
            </div>
          </div>
                  <ProductCallbackLeadForm p={p} qty={qty} isMobile={isMobile} />
          <div style={{fontSize:14,color:"#666",lineHeight:1.7,marginBottom:16,whiteSpace:"pre-line"}}>{linkifyContacts(detailDesc)}</div>
          <div style={{padding:"16px 20px",background:"#f9f9f9",borderRadius:8,marginBottom:20,border:"1px solid #eee"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:32,fontWeight:800}}>{fp(p.price)}</span>
              {p.old && <span style={{fontSize:16,color:"#bbb",textDecoration:"line-through"}}>{fp(p.old)}</span>}
              <span style={{fontSize:12,color:"#999"}}>+ KDV</span>
            </div>
            <div style={{marginTop:8,fontSize:13,color:p.stock?"#4caf50":"#e53935",fontWeight:600}}>{p.stock ? t("stockXItems").replace("{0}",p.stock) : t("outOfStockFull")}</div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:p.stock?20:10}}>
            <div style={{display:"flex",border:"1px solid #ddd",borderRadius:6,overflow:"hidden"}}>
              <button onClick={() => setQty(Math.max(1,qty-1))} style={{width:40,height:44,background:"#f5f5f5",border:"none",fontSize:18,color:"#555"}}>−</button>
              <span style={{width:48,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600}}>{qty}</span>
              <button onClick={() => setQty(qty+1)} style={{width:40,height:44,background:"#f5f5f5",border:"none",fontSize:18,color:"#555"}}>+</button>
            </div>
            <button onClick={() => p.stock && addToCart(p, qty)} style={{flex:"1 1 130px",padding:"12px",background:p.stock?"#fff":"#eee",color:p.stock?"#111827":"#999",border:p.stock?"1px solid #d1d5db":"none",borderRadius:6,fontSize:15,fontWeight:800,cursor:p.stock?"pointer":"default"}}>
              {p.stock ? t("addToCart") : t("outOfStockFull")}
            </button>
            {p.stock && (
              <button onClick={checkoutNow} style={{flex:"1.25 1 170px",padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:16,fontWeight:950,cursor:"pointer",boxShadow:"0 10px 24px rgba(255,96,0,.24)"}}>
                Hemen Al - Ödemeye Geç
              </button>
            )}
            <button onClick={() => toggleFav(p.id)} style={{width:48,height:48,border:"1px solid #eee",borderRadius:6,background:"#fff",fontSize:22,color:isFav?"#ff6000":"#ccc",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              {isFav ? "♥" : "♡"}
            </button>
          </div>
          {/* Stock Alert for out-of-stock */}
          {!p.stock && (
            <div style={{padding:"14px 16px",background:"#fffbf0",border:"1px solid #ffeeba",borderRadius:8,marginBottom:20}}>
              {alertSent ? (
                <div style={{fontSize:14,color:"#4caf50",fontWeight:600,display:"flex",alignItems:"center",gap:8}}>✓ {t("alertDone")}</div>
              ) : (
                <>
                  <div style={{fontSize:13,fontWeight:600,color:"#856404",marginBottom:8}}>🔔 {t("stockAlert")}</div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder={t("contactPlaceholder")}
                      style={{flex:1,padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,outline:"none"}} />
                    <button onClick={() => {if(alertEmail.trim()){addStockAlert(p.id,alertEmail);setAlertSent(true)}}}
                      style={{padding:"9px 18px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{t("notify")}</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
            {[{icon:"🚚",text:t("sameDay")},{icon:"🔄",text:t("returnPolicy")},{icon:"🛡️",text:t("origGuarantee")},{icon:"💳",text:t("installment")}].map((f,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f9f9f9",borderRadius:6,fontSize:12,color:"#666"}}><span>{f.icon}</span>{f.text}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{borderBottom:"1px solid #eee",display:"flex",gap:0,marginBottom:20}}>
        {[{id:"desc",l:t("description")},{id:"specs",l:t("techSpecs")},{id:"compat",l:t("compatVehicles")}].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{padding:"12px 24px",background:"none",border:"none",borderBottom:`2px solid ${tab===tb.id?"#ff6000":"transparent"}`,color:tab===tb.id?"#1a1a1a":"#999",fontSize:14,fontWeight:tab===tb.id?600:400,cursor:"pointer",marginBottom:-1}}>{tb.l}</button>
        ))}
      </div>
      {tab==="desc" && <div style={{marginBottom:32}}>
        <div style={{fontSize:15,color:"#555",lineHeight:1.8,whiteSpace:"pre-line",marginBottom:20}}>
          {linkifyContacts(detailDesc)}
        </div>
        {/* Hızlı iletişim butonları */}
        <div style={{display:"flex",flexWrap:"wrap",gap:10,padding:16,background:"#fff8f0",borderRadius:10,border:"1px solid #ffd9b3"}}>
          <div style={{width:"100%",fontSize:13,fontWeight:700,color:"#c05200",marginBottom:4}}>{lang==="en"?"Ask for price, stock and compatibility":"Fiyat, stok ve uyumluluk icin hemen ulasin"}</div>
          <a href={whatsappQuoteHref} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"product_desc_whatsapp", href:whatsappQuoteHref, product:p, value:(p.price || 0) * qty }); metaTrack("Contact", metaProductPayload(p, qty, p.cat)); }} style={{flex:"1 1 210px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 20px",background:"#25D366",color:"#062813",borderRadius:8,fontSize:15,fontWeight:950,textDecoration:"none",minHeight:48}}>💬 WhatsApp'tan Sor</a>
          <a href="tel:+905456087008" onClick={() => { recordLeadEvent("phone", { source:"product_desc_phone", product:p, value:p.price || 0 }); metaTrackCustom("PhoneLead", { source:"product_desc", product_id:p.id, sku:p.sku }); }} style={{flex:"1 1 210px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 20px",background:"#ff6000",color:"#fff",borderRadius:8,fontSize:15,fontWeight:950,textDecoration:"none",minHeight:48}}>📞 {lang==="en"?"Call now":"Hemen Ara"}: 0545 608 7008</a>
        </div>
        <section aria-label="Urun uyumluluk sorulari" style={{marginTop:18,padding:18,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8}}>
          <h2 style={{fontSize:18,fontWeight:950,color:"#111827",margin:"0 0 12px"}}>{seoDisplayName} uyumluluk ve OEM bilgisi</h2>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
            {seoFaqItems.map(item => (
              <article key={item.question} style={{padding:"13px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 8px 20px rgba(15,23,42,.04)"}}>
                <h3 style={{fontSize:13,fontWeight:950,color:"#111827",margin:"0 0 6px",lineHeight:1.35}}>{item.question}</h3>
                <p style={{fontSize:12.5,color:"#526070",lineHeight:1.65,margin:0}}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>}
      {tab==="specs" && <div style={{marginBottom:32}}>{Object.keys(specs).length ? Object.entries(specs).map(([k,v]) => (<div key={k} style={{display:"flex",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{width:200,color:"#999"}}>{k}</span><span style={{fontWeight:500,color:"#333"}}>{v}</span></div>)) : <div style={{color:"#999",fontSize:14}}>Teknik bilgi için SKU/OEM koduyla Frenciniz'den teyit alın.</div>}</div>}
      {tab==="compat" && <div style={{marginBottom:32}}>
        {p.oem && (
          <div style={{padding:"14px 16px",background:"#07111f",color:"#fff",borderRadius:8,border:"1px solid rgba(255,96,0,.22)",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:900,color:"#facc15",textTransform:"uppercase",marginBottom:7}}>OEM / Muadil numaraları</div>
            <div style={{fontSize:13,lineHeight:1.65,overflowWrap:"anywhere"}}>{p.oem}</div>
          </div>
        )}
        {p.compat && p.compat.length > 0 ? <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{p.compat.map((c,i) => {
          const isUniv = c==="Ağır Vasıta";
          const label = isUniv ? (lang==="en"?"Heavy Duty (Universal)":"Ağır Vasıta (Evrensel)") : c;
          return <div key={i} onClick={() => go("products",{q:c})} style={{padding:"12px 20px",background:isUniv?"#fff4e6":"#f0f4ff",borderRadius:8,fontSize:14,fontWeight:600,color:isUniv?"#c05200":"#336",cursor:"pointer",border:`1px solid ${isUniv?"#ffd9b3":"#dde4f0"}`,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff6000";e.currentTarget.style.color="#ff6000"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=isUniv?"#ffd9b3":"#dde4f0";e.currentTarget.style.color=isUniv?"#c05200":"#336"}}>{label}</div>;
        })}</div> : <div style={{color:"#999",fontSize:14}}>{lang==="en"?"No compatibility info available":"Uyumluluk bilgisi bulunamadı"}</div>}
      </div>}
      {related.length > 0 && <div><h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("similarProducts")}</h2><div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{related.map(rp => <ProductCard key={rp.id} p={rp} />)}</div></div>}
      <RecentlyViewed />
      {isMobile && (
        <nav aria-label="Urun hizli islemleri" style={{position:"fixed",left:0,right:0,bottom:0,zIndex:998,padding:"8px 10px calc(8px + env(safe-area-inset-bottom))",background:"linear-gradient(180deg,rgba(7,10,18,.94),#070a12)",borderTop:"1px solid rgba(255,255,255,.12)",boxShadow:"0 -14px 38px rgba(0,0,0,.34)",display:"grid",gridTemplateColumns:"1.35fr .85fr",gap:8,alignItems:"stretch"}}>
          <a href={whatsappQuoteHref} target="_blank" rel="noopener noreferrer" onClick={() => { recordLeadEvent("whatsapp", { source:"product_mobile_sticky_whatsapp", href:whatsappQuoteHref, product:p, value:(p.price || 0) * qty }); metaTrack("Contact", metaProductPayload(p, qty, p.cat)); }}
            style={{minHeight:54,borderRadius:8,background:"linear-gradient(135deg,#16a34a,#25D366)",color:"#062813",textDecoration:"none",fontSize:14,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 10px"}}>
            WhatsApp'tan Sor
          </a>
          <a href="tel:+905456087008" onClick={() => { recordLeadEvent("phone", { source:"product_mobile_sticky_phone", product:p, value:p.price || 0 }); metaTrackCustom("PhoneLead", { source: "product_sticky_bar", product_id: p.id, sku: p.sku }); }}
            style={{minHeight:54,borderRadius:8,background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#111827",textDecoration:"none",fontSize:14,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 10px"}}>
            Hemen Ara
          </a>
        </nav>
      )}
    </div>
  );
}

// ===== CART with Coupon + Shipping Progress =====
function CartPage() {
  const {cart, updateQty, removeItem, cartTotal, go, coupon, setCoupon, couponApplied, setCouponApplied, couponData, setCouponData, couponError, setCouponError, discount, isMobile, t, fp, lang} = use$();
  const ship = cartTotal >= 3000 ? 0 : 150;
  const shippingProgress = Math.min((cartTotal / 3000) * 100, 100);
  const remaining = Math.max(3000 - cartTotal, 0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackStatus, setCallbackStatus] = useState("");
  const whatsappCartHref = cartWhatsAppUrl(cart, cartTotal, ship, discount);
  const cartFunnelKey = cart.map(item => `${item.id}:${item.qty}`).sort().join("|") || "empty";
  const cartItemCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);

  useEffect(() => {
    if (!cart.length) return;
    recordFunnelEvent("view_cart", {
      items: cart.reduce((sum, item) => sum + Number(item.qty || 1), 0),
      value: cartTotal + ship - discount,
      dedupeKey: cartFunnelKey,
    });
  }, [cartFunnelKey]);

  const requestCartCallback = () => {
    const digits = callbackPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setCallbackStatus("Geçerli bir telefon numarası yazın.");
      return;
    }
    const itemSummary = cart
      .slice(0, 12)
      .map(item => `${item.sku || item.id} x${item.qty || 1}`)
      .join(", ");
    recordLeadEvent("phone", {
      source: "cart_callback",
      contactPhone: callbackPhone,
      value: cartTotal + ship - discount,
      items: cartItemCount,
      note: `Sepet sipariş desteği: ${itemSummary}`.slice(0, 480),
    });
    metaTrackCustom("CallbackLead", {
      source: "cart_callback",
      value: cartTotal + ship - discount,
      items: cartItemCount,
    });
    setCallbackStatus("Arama talebiniz kaydedildi.");
    setCallbackPhone("");
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code || couponApplied || couponLoading) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const r = await fetch(`/api/coupon-validate?code=${encodeURIComponent(code)}`);
      const d = await r.json();
      if (!r.ok || !d.valid) {
        setCouponError(d.error || "Kupon geçersiz");
        return;
      }
      if (d.minOrder && cartTotal < d.minOrder) {
        setCouponError(`Bu kupon için min. sepet tutarı ${fp(d.minOrder)}`);
        return;
      }
      setCouponData({code: d.code, discount: d.discount, type: d.type, minOrder: d.minOrder});
      setCouponApplied(true);
    } catch (e) {
      setCouponError("Kupon doğrulanamadı, tekrar deneyin");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponData(null);
    setCoupon("");
    setCouponError("");
  };

  const minNotMet = couponApplied && couponData?.minOrder && cartTotal < couponData.minOrder;
  const couponLabel = couponData
    ? (couponData.type === "₺" ? `Kupon (${couponData.code} · ${fp(couponData.discount)})` : `Kupon (${couponData.code} · %${couponData.discount})`)
    : "Kupon";

  return (
    <div className="fr2-cart-page" style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"16px 12px 24px":"20px",overflow:"hidden"}}>
      <h1 style={{fontSize:isMobile?20:22,fontWeight:700,marginBottom:isMobile?14:20}}>Sepetim</h1>
      {cart.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><p style={{color:"#999",marginBottom:16}}>Sepetiniz boş</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Alışverişe Başla</button></div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"minmax(0,1fr) 320px",gap:isMobile?16:24,alignItems:"start",minWidth:0}}>
          <div style={{minWidth:0}}>
            {/* Free shipping progress */}
            <div style={{padding:isMobile?"12px":"14px 16px",background:cartTotal >= 3000 ? "#e8f5e9" : "#fff8e1",borderRadius:8,marginBottom:16,border:`1px solid ${cartTotal >= 3000 ? "#c8e6c9" : "#fff3c4"}`,minWidth:0}}>
              {cartTotal >= 3000 ? (
                <div style={{fontSize:13,fontWeight:600,color:"#2e7d32"}}>✓ Ücretsiz kargo hakkı kazandınız!</div>
              ) : (
                <>
                  <div style={{fontSize:13,color:"#f57f17",fontWeight:600,marginBottom:8}}>Ücretsiz kargoya <strong>{fp(remaining)}</strong> kaldı!</div>
                  <div style={{height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${shippingProgress}%`,height:"100%",background:"linear-gradient(90deg,#ff6000,#ff8c00)",borderRadius:3,transition:"width .3s"}}/>
                  </div>
                </>
              )}
            </div>

            {/* Cart items */}
            <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden",minWidth:0}}>
              {cart.map((item,i) => (
                <div key={item.id} style={{display:"flex",gap:isMobile?10:16,padding:isMobile?"12px":"16px",borderBottom:i<cart.length-1?"1px solid #f0f0f0":"none",alignItems:isMobile?"flex-start":"center",flexWrap:isMobile?"wrap":"nowrap",minWidth:0}}>
                  <img src={cdnImg(prodImg(item),100)} alt={item.name||""} loading="lazy" decoding="async" width={isMobile?62:72} height={isMobile?62:72} onClick={()=>go("product",{id:item.id})} style={{width:isMobile?62:72,height:isMobile?62:72,objectFit:"contain",borderRadius:6,background:"#101624",cursor:"pointer",flex:"0 0 auto"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
                  <div style={{flex:"1 1 0",minWidth:0,cursor:"pointer",paddingRight:isMobile?4:0}} onClick={()=>go("product",{id:item.id})}>
                    <div style={{fontSize:isMobile?13:14,fontWeight:700,lineHeight:1.35,color:"#111827",overflowWrap:"anywhere"}}>{translateName(item.name,lang)}</div>
                    <div style={{fontSize:12,color:"#999",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.brand} · {item.sku}</div>
                  </div>
                  {isMobile && <span aria-hidden="true" style={{flexBasis:"100%",height:0}} />}
                  <div style={{display:"flex",alignItems:"center",border:"1px solid #ddd",borderRadius:6,overflow:"hidden",flex:"0 0 auto"}}>
                    <button onClick={() => updateQty(item.id, item.qty-1)} style={{width:32,height:32,background:"#f9f9f9",border:"none",fontSize:16,color:"#555",cursor:"pointer"}}>−</button>
                    <span style={{width:36,textAlign:"center",fontSize:13,fontWeight:600}}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty+1)} style={{width:32,height:32,background:"#f9f9f9",border:"none",fontSize:16,color:"#555",cursor:"pointer"}}>+</button>
                  </div>
                  <div style={{width:isMobile?"auto":100,minWidth:isMobile?0:100,flex:isMobile?"1 1 auto":"0 0 100px",textAlign:isMobile?"left":"right",fontSize:isMobile?15:16,fontWeight:800,color:"#111827"}}>{fp(item.price*item.qty)}</div>
                  <button onClick={() => removeItem(item.id)} aria-label="Sepetten kaldır" style={{background:isMobile?"#fff5f5":"none",border:isMobile?"1px solid #fecaca":"none",borderRadius:isMobile?6:0,color:isMobile?"#dc2626":"#ccc",fontSize:isMobile?14:18,fontWeight:800,cursor:"pointer",width:isMobile?34:"auto",height:isMobile?32:"auto",flex:"0 0 auto"}}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{border:"1px solid #eee",borderRadius:8,padding:isMobile?16:20,position:isMobile?"static":"sticky",top:isMobile?"auto":120,minWidth:0,overflow:"hidden"}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Sipariş Özeti</h3>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#666"}}>{t("subtotal")}</span><span style={{fontWeight:600}}>{fp(cartTotal)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#666"}}>{t("shipping")}</span><span style={{fontWeight:600,color:ship===0?"#4caf50":"inherit"}}>{ship===0?t("free"):`${fp(ship)}`}</span></div>
            {couponApplied && !minNotMet && <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#4caf50"}}>{couponLabel}</span><span style={{fontWeight:600,color:"#4caf50"}}>-{fp(discount)}</span></div>}
            {minNotMet && <div style={{marginBottom:8,fontSize:12,color:"#d32f2f",background:"#ffebee",padding:"6px 10px",borderRadius:4}}>Kupon için min. {fp(couponData.minOrder)} sepet gerekli — şu an indirim uygulanmıyor.</div>}

            {/* Coupon code */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:0,marginTop:8,minWidth:0}}>
                <input value={coupon} onChange={e => {setCoupon(e.target.value); setCouponError("");}} placeholder="Kupon kodu"
                  onKeyDown={e => {if(e.key==="Enter") applyCoupon();}}
                  style={{flex:"1 1 auto",minWidth:0,padding:"8px 12px",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:13,outline:"none",textTransform:"uppercase"}} disabled={couponApplied||couponLoading}/>
                <button onClick={couponApplied ? removeCoupon : applyCoupon} disabled={couponLoading}
                  style={{padding:isMobile?"8px 10px":"8px 14px",background:couponApplied?"#4caf50":"#333",color:"#fff",border:"none",borderRadius:"0 6px 6px 0",fontSize:13,fontWeight:600,cursor:couponLoading?"wait":"pointer",opacity:couponLoading?0.6:1,flex:"0 0 auto"}}>
                  {couponLoading ? "..." : couponApplied ? "✓ Kaldır" : "Uygula"}
                </button>
              </div>
              {couponError && <div style={{fontSize:11,color:"#d32f2f",marginTop:4}}>{couponError}</div>}
            </div>

            <div style={{borderTop:"1px solid #eee",padding:"12px 0 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12}}><span style={{fontSize:16,fontWeight:700}}>{t("total")}</span><span style={{fontSize:isMobile?20:22,fontWeight:800,color:"#ff6000",textAlign:"right"}}>{fp(cartTotal + ship - discount)}</span></div>
            </div>
            <a href={whatsappCartHref} target="_blank" rel="noopener noreferrer" data-lead-source="cart_whatsapp" data-lead-value={cartTotal + ship - discount} data-lead-items={cart.length}
              onClick={() => recordLeadEvent("whatsapp", { source:"cart_whatsapp", href:whatsappCartHref, value:cartTotal + ship - discount, items:cart.length })}
              style={{width:"100%",padding:"14px",background:"#25D366",color:"#062813",border:"none",borderRadius:6,fontSize:15,fontWeight:950,cursor:"pointer",marginTop:16,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:46}}>
              WhatsApp ile 30 Saniyede Sipariş Ver
            </a>
            <button onClick={() => {
              recordFunnelEvent("begin_checkout", {
                items: cartItemCount,
                value: cartTotal + ship - discount,
                dedupeKey: cartFunnelKey,
              });
              go("checkout");
            }} style={{width:"100%",padding:"14px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:16,fontWeight:950,cursor:"pointer",marginTop:10,boxShadow:"0 10px 24px rgba(255,96,0,.18)"}}>Kartla Güvenli Ödeme</button>
            <div style={{marginTop:12,padding:11,border:"1px solid #dbeafe",borderRadius:7,background:"#f8fbff"}}>
              <div style={{fontSize:12,fontWeight:900,color:"#111827",marginBottom:7}}>Sepet için sipariş desteği ister misiniz?</div>
              <div style={{display:"flex",gap:6,minWidth:0}}>
                <input value={callbackPhone} onChange={e=>{setCallbackPhone(e.target.value);setCallbackStatus("");}} inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx"
                  style={{flex:"1 1 auto",minWidth:0,minHeight:40,border:"1px solid #cbd5e1",borderRadius:6,padding:"0 9px",fontSize:12}} />
                <button type="button" onClick={requestCartCallback}
                  style={{flex:"0 0 auto",minHeight:40,border:"none",borderRadius:6,background:"#111827",color:"#fff",padding:"0 11px",fontSize:12,fontWeight:900,cursor:"pointer"}}>Beni arayın</button>
              </div>
              <div style={{fontSize:10.5,color:callbackStatus?"#15803d":"#64748b",lineHeight:1.4,marginTop:6}}>{callbackStatus || "Telefonunuz yalnızca bu sepetle ilgili sipariş desteği için kullanılır."}</div>
            </div>
            <div style={{fontSize:11,color:"#6b7280",lineHeight:1.45,textAlign:"center",marginTop:9}}>Üyelik zorunlu değil. Kart bilgisi PayTR güvenli sayfasında girilir.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CHECKOUT =====
function CheckoutPage() {
  const {cart, cartTotal, go, discount, completePurchase, isMobile, fp, user, addresses} = use$();
  const [step, setStep] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [card, setCard] = useState({number:"", holder:"", exp:"", cvv:"", installment:1});
  const ship = cartTotal >= 3000 ? 0 : 150;
  const grandTotal = Math.max(0, cartTotal - discount + ship);
  const checkoutWhatsAppHref = cartWhatsAppUrl(cart, cartTotal, ship, discount);
  const checkoutFunnelKey = cart.map(item => `${item.id}:${item.qty}`).sort().join("|") || "empty";
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};

  useEffect(() => {
    if (!cart.length) return;
    recordFunnelEvent("begin_checkout", {
      items: cart.reduce((sum, item) => sum + Number(item.qty || 1), 0),
      value: grandTotal,
      dedupeKey: checkoutFunnelKey,
    });
  }, [checkoutFunnelKey]);

  // Varsayılan değerler: user profili + ilk kayıtlı adres
  const defAddr = addresses && addresses[0];
  const splitName = (user?.name || defAddr?.name || "").trim().split(/\s+/);
  const defFirst = splitName[0] || "";
  const defLast = splitName.slice(1).join(" ") || "";
  const [ship_form, setShipForm] = useState({
    first: defFirst,
    last: defLast,
    email: user?.email || "",
    phone: user?.phone || defAddr?.phone || "",
    address: defAddr ? `${defAddr.address||""}${defAddr.city?` — ${defAddr.city}`:""}` : "",
    city: defAddr?.city || "",
  });
  const [nameInput, setNameInput] = useState(`${defFirst} ${defLast}`.trim());
  // Seçilen adres değişirse form'u güncelle
  const [selectedAddrId, setSelectedAddrId] = useState(defAddr?.id || null);
  useEffect(() => {
    const addr = addresses?.find(a => a.id === selectedAddrId);
    if (addr) {
      const sp = (addr.name || user?.name || "").trim().split(/\s+/);
      setShipForm(f => ({
        ...f,
        first: sp[0] || f.first,
        last: sp.slice(1).join(" ") || f.last,
        phone: addr.phone || f.phone,
        address: `${addr.address||""}${addr.city?` — ${addr.city}`:""}`,
        city: addr.city || f.city,
      }));
      setNameInput((addr.name || user?.name || "").trim());
    }
  }, [selectedAddrId]);
  const updateFullName = (value) => {
    setNameInput(value);
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    setShipForm(f => ({
      ...f,
      first: parts[0] || "",
      last: parts.slice(1).join(" "),
    }));
  };
  const continueToPayment = () => {
    setPayError("");
    if (!ship_form.first || !ship_form.last || !ship_form.phone || !ship_form.address || !ship_form.city) {
      return setPayError("Ad soyad, telefon, şehir ve adresi tamamlayın.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ship_form.email || "")) {
      return setPayError("PayTR ödeme bağlantısı için geçerli bir e-posta gerekiyor.");
    }
    if (String(ship_form.phone || "").replace(/\D/g, "").length < 10) {
      return setPayError("Geçerli bir cep telefonu numarası yazın.");
    }
    recordFunnelEvent("checkout_contact", {
      items: cart.reduce((sum, item) => sum + Number(item.qty || 1), 0),
      value: grandTotal,
      dedupeKey: checkoutFunnelKey,
    });
    setStep(2);
    try { window.scrollTo({top:0, behavior:"smooth"}); } catch {}
  };

  if(!cart.length) return <div style={{textAlign:"center",padding:"60px 20px"}}><p style={{color:"#999"}}>Sepetiniz boş.</p></div>;

  return (
    <div className="fr2-checkout-page" style={{maxWidth:800,margin:"0 auto",padding:isMobile?"16px 12px 24px":"20px",overflow:"hidden"}}>
      <h1 style={{fontSize:isMobile?20:22,fontWeight:700,marginBottom:isMobile?14:20}}>Sipariş</h1>
      <div style={{display:"flex",gap:isMobile?6:16,marginBottom:isMobile?18:28,alignItems:"center",justifyContent:isMobile?"space-between":"flex-start",minWidth:0}}>
        {[{n:1,l:"Teslimat"},{n:2,l:"Ödeme"},{n:3,l:"Onay"}].map((s,i) => (
          <div key={s.n} style={{display:"flex",alignItems:"center",gap:isMobile?5:8,minWidth:0,flex:isMobile?"1 1 0":"0 0 auto",justifyContent:isMobile?"center":"flex-start"}}>
            <div style={{width:isMobile?24:28,height:isMobile?24:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?12:13,fontWeight:700,background:step>=s.n?"#ff6000":"#eee",color:step>=s.n?"#fff":"#999",flex:"0 0 auto"}}>{s.n}</div>
            <span style={{fontSize:isMobile?12:14,fontWeight:step===s.n?700:400,color:step===s.n?"#1a1a1a":"#999",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.l}</span>
            {!isMobile && i<2 && <span style={{color:"#ddd",margin:"0 4px"}}>—</span>}
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:isMobile?16:28,minWidth:0,overflow:"hidden"}}>
        {step===1 && <>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:6}}>2 Dakikada Siparişi Tamamla</h2>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.55,marginBottom:18}}>Üyelik zorunlu değil. Teslimat bilgilerini yazın, kart bilgisini PayTR güvenli ödeme sayfasında girin.</div>
          {addresses && addresses.length > 0 && (
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Kayıtlı Adreslerim</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {addresses.map(a => (
                  <button key={a.id} onClick={()=>setSelectedAddrId(a.id)} style={{padding:"8px 14px",border:`2px solid ${selectedAddrId===a.id?"#ff6000":"#ddd"}`,borderRadius:6,background:selectedAddrId===a.id?"#fff5ee":"#fff",fontSize:13,fontWeight:600,color:"#333",cursor:"pointer"}}>
                    📍 {a.title}
                  </button>
                ))}
                <button onClick={()=>go("addresses")} style={{padding:"8px 14px",border:"1px dashed #999",borderRadius:6,background:"transparent",fontSize:13,color:"#666",cursor:"pointer"}}>+ Adres Yönet</button>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:14}}>
            <div style={{gridColumn:isMobile?"auto":"1 / -1"}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Ad Soyad</label><input value={nameInput} onChange={e=>updateFullName(e.target.value)} placeholder="Adınız Soyadınız" style={IS}/></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Telefon</label><input value={ship_form.phone} onChange={e=>setShipForm(f=>({...f,phone:e.target.value}))} placeholder="05xx xxx xx xx" style={IS}/></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>E-posta</label><input type="email" value={ship_form.email} onChange={e=>setShipForm(f=>({...f,email:e.target.value}))} placeholder="ornek@email.com" style={IS}/></div>
          </div>
          <div style={{marginTop:14,display:"grid",gridTemplateColumns:isMobile?"1fr":"180px 1fr",gap:12}}>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Şehir</label><input value={ship_form.city} onChange={e=>setShipForm(f=>({...f,city:e.target.value}))} placeholder="Isparta" autoComplete="address-level1" style={IS}/></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Adres</label><textarea rows={3} value={ship_form.address} onChange={e=>setShipForm(f=>({...f,address:e.target.value}))} placeholder="Teslimat adresi" autoComplete="street-address" style={{...IS,resize:"vertical"}}/></div>
          </div>
          {payError && <div style={{marginTop:12,padding:"10px 14px",background:"#fee2e2",borderRadius:6,border:"1px solid #fecaca",fontSize:13,color:"#991b1b"}}>⚠ {payError}</div>}
          <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:10,alignItems:"stretch",marginTop:18}}>
            <button onClick={continueToPayment} style={{width:isMobile?"100%":"auto",padding:"13px 30px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:950,cursor:"pointer",boxShadow:"0 10px 24px rgba(255,96,0,.18)"}}>Ödemeye Geç →</button>
            <a href={checkoutWhatsAppHref} target="_blank" rel="noopener noreferrer" onClick={() => recordLeadEvent("whatsapp", { source:"checkout_whatsapp", href:checkoutWhatsAppHref, value:grandTotal, items:cart.reduce((sum,item)=>sum+Number(item.qty||1),0) })} style={{padding:"13px 18px",borderRadius:6,background:"#25D366",color:"#062813",fontSize:14,fontWeight:950,textDecoration:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>WhatsApp ile sipariş ver</a>
          </div>
          <div style={{fontSize:11,color:"#64748b",marginTop:8,lineHeight:1.45}}>Kartla ödemek istemezseniz sepetiniz WhatsApp mesajına otomatik eklenir.</div>
        </>}
        {step===2 && <>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>Ödeme</h2>
          <div style={{marginBottom:20,padding:"14px 18px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#475569",lineHeight:1.6}}>
            🔒 Ödemeniz <strong>PayTR</strong> güvenli ödeme altyapısı üzerinden alınacak. Devam ettiğinizde PayTR'nin güvenli ödeme sayfasına yönlendirileceksiniz. <strong>Kart bilgileriniz Frenciniz tarafından saklanmaz</strong>; doğrudan PayTR'nin PCI-DSS sertifikalı altyapısında işlenir.
          </div>
          <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
            <img src="/payment/visa.svg" alt="Visa" width={56} height={20} style={{display:"block"}}/>
            <img src="/payment/mastercard.svg" alt="Mastercard" width={56} height={20} style={{display:"block"}}/>
            <img src="/payment/troy.svg" alt="Troy" width={56} height={20} style={{display:"block"}}/>
            <span style={{fontSize:11,color:"#94a3b8"}}>3D Secure ile korunur</span>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Taksit Tercihi</label>
            <select value={card.installment} onChange={e=>setCard(c=>({...c,installment:Number(e.target.value)}))} style={IS}>
              <option value={1}>Peşin (Tek Çekim)</option>
              <option value={0}>PayTR sayfasında seç (2-12 taksit)</option>
            </select>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>Banka kartı ile sadece tek çekim yapılabilir. Kredi kartında taksit seçeneği PayTR sayfasında görünür.</div>
          </div>
          <div style={{marginBottom:14,padding:"12px 14px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:6,fontSize:13}}>
            <div style={{color:"#6b7280",marginBottom:6}}>Sipariş Özeti</div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:15}}>
              <span>Toplam</span>
              <span style={{color:"#ff6000"}}>{fp(grandTotal)}</span>
            </div>
          </div>
          {payError && <div style={{marginTop:10,padding:"10px 14px",background:"#fee2e2",borderRadius:6,border:"1px solid #fecaca",fontSize:13,color:"#991b1b"}}>⚠ {payError}</div>}
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button onClick={() => setStep(1)} disabled={payLoading} style={{padding:"12px 24px",background:"#f5f5f5",color:"#555",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:payLoading?"not-allowed":"pointer"}}>← Geri</button>
            <button disabled={payLoading} onClick={async () => {
              setPayError("");
              if (!ship_form.first || !ship_form.email || !ship_form.phone || !ship_form.address) {
                return setPayError("Teslimat bilgileri eksik — Geri tuşu ile tamamlayın");
              }
              setPayLoading(true);
              try {
                const payload = {
                  amount: Number(grandTotal.toFixed(2)),
                  installmentCount: card.installment,
                  billingAddress: {
                    address: ship_form.address,
                    city: ship_form.city,
                    country: "Türkiye",
                    zipCode: "00000",
                    district: "-",
                    contactName: `${ship_form.first} ${ship_form.last}`.trim(),
                    phoneNumber: ship_form.phone,
                    emailAddress: ship_form.email,
                  },
                  buyer: {
                    buyerId: user?.id ? String(user.id) : `guest-${Date.now()}`,
                    name: ship_form.first,
                    surName: ship_form.last,
                    emailAddress: ship_form.email,
                    phoneNumber: ship_form.phone,
                    city: ship_form.city,
                    country: "Türkiye",
                    zipCode: "00000",
                    registrationAddress: ship_form.address,
                    registrationDate: new Date().toISOString(),
                    lastLoginDate: new Date().toISOString(),
                  },
                  basket: {
                    basketId: `FRN-${Date.now()}`,
                    basketItems: cart.slice(0, 50).map(it => ({
                      itemId: String(it.id),
                      name: (it.name||"Ürün").slice(0, 60),
                      itemType: "PHYSICAL",
                      numberOfProducts: it.qty,
                      unitPrice: Number(it.price),
                      totalPrice: Number((it.price * it.qty).toFixed(2)),
                      sku: it.sku || "",
                      brand: it.brand || "",
                      img: it.img || null,
                    })),
                  },
                };
                const r = await fetch("/api/payment/paytr-start", {
                  method: "POST",
                  headers: {"Content-Type":"application/json"},
                  body: JSON.stringify(payload),
                });
                const data = await r.json();
                if (!r.ok || !data.success) throw new Error(data.error || "Ödeme başlatılamadı");
                if (!data.iframeUrl) throw new Error("PayTR yönlendirme URL'i boş");
                recordFunnelEvent("payment_redirect", {
                  items: cart.reduce((sum, item) => sum + Number(item.qty || 1), 0),
                  value: grandTotal,
                  dedupeKey: checkoutFunnelKey,
                });
                window.location.href = data.iframeUrl;
              } catch (e) {
                recordFunnelEvent("payment_error", {
                  items: cart.reduce((sum, item) => sum + Number(item.qty || 1), 0),
                  value: grandTotal,
                  dedupeKey: `${checkoutFunnelKey}:${String(e?.message || "error").slice(0, 32)}`,
                });
                setPayError(e.message || "Ödeme sırasında hata oluştu");
                setPayLoading(false);
              }
            }} style={{padding:"12px 28px",background:payLoading?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:payLoading?"not-allowed":"pointer"}}>
              {payLoading ? "Yönlendiriliyor..." : `${fp(grandTotal)} Öde →`}
            </button>
          </div>
        </>}
        {step===3 && <div style={{textAlign:"center",padding:"40px 0"}}>
          <div style={{fontSize:48,marginBottom:16}}>✅</div>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:8}}>Siparişiniz Alındı!</h2>
          <p style={{color:"#666",marginBottom:20}}>Sipariş numaranız: <strong>FRN-{Math.floor(Math.random()*9000+1000)}</strong></p>
          <button onClick={() => go("home")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Ana Sayfaya Dön</button>
        </div>}
      </div>
    </div>
  );
}

// ===== AUTH — Real backend (signup/login API + httpOnly session cookie) =====
function ForgotForm({en, IS, setMode, setUser, go}){
  const [step,setStep]=useState(1);
  const [emailOrPhone,setEOP]=useState("");
  const [otp,setOtp]=useState("");
  const [pw,setPw]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [info,setInfo]=useState("");

  async function sendCode(){
    setErr(""); setInfo(""); setBusy(true);
    try{
      const r=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({emailOrPhone})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Hata");
      setInfo(en?`Code sent (${d.channel}: ${d.masked})`:`Kod gönderildi (${d.channel==="sms"?"SMS":"e-posta"}: ${d.masked})`);
      setStep(2);
    }catch(e){ setErr(e.message); } finally{ setBusy(false); }
  }
  async function verify(){
    setErr(""); setBusy(true);
    try{
      const r=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({emailOrPhone,otp,newPassword:pw})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Hata");
      setUser?.(d.user);
      go?.("account");
    }catch(e){ setErr(e.message); } finally{ setBusy(false); }
  }

  return <div style={{maxWidth:400,margin:"40px auto",padding:"0 20px"}}>
    <div style={{border:"1px solid #eee",borderRadius:8,padding:28}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>{en?"Forgot Password":"Şifremi Unuttum"}</h2>
      {step===1 && <>
        <p style={{fontSize:14,color:"#888",marginBottom:20}}>{en?"Enter your registered email or phone number.":"Kayıtlı e-posta adresinizi veya telefon numaranızı girin."}</p>
        <input value={emailOrPhone} onChange={e=>setEOP(e.target.value)} placeholder={en?"Email or phone":"E-posta veya telefon"} style={{...IS,marginBottom:14}}/>
        <button onClick={sendCode} disabled={busy||!emailOrPhone} style={{width:"100%",padding:"12px",background:busy?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:busy?"not-allowed":"pointer",marginBottom:12}}>
          {busy?(en?"Sending...":"Gönderiliyor..."):(en?"Send Reset Code":"Sıfırlama Kodu Gönder")}
        </button>
      </>}
      {step===2 && <>
        {info && <div style={{padding:"10px",background:"#e8f5e9",borderRadius:6,fontSize:13,color:"#2e7d32",marginBottom:14}}>✓ {info}</div>}
        <p style={{fontSize:13,color:"#666",marginBottom:14}}>{en?"Enter the 6-digit code and your new password.":"Aldığınız 6 haneli kodu ve yeni şifrenizi girin."}</p>
        <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder={en?"6-digit code":"6 haneli kod"} style={{...IS,marginBottom:10,letterSpacing:6,textAlign:"center",fontWeight:700,fontSize:18}}/>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder={en?"New password (min 6 chars)":"Yeni şifre (en az 6 karakter)"} style={{...IS,marginBottom:14}}/>
        <button onClick={verify} disabled={busy||otp.length!==6||pw.length<6} style={{width:"100%",padding:"12px",background:(busy||otp.length!==6||pw.length<6)?"#ddd":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:(busy||otp.length!==6||pw.length<6)?"not-allowed":"pointer",marginBottom:8}}>
          {busy?(en?"Verifying...":"Doğrulanıyor..."):(en?"Reset Password":"Şifreyi Yenile")}
        </button>
        <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:"#888",fontSize:12,cursor:"pointer",display:"block",margin:"6px auto"}}>{en?"← Resend code":"← Yeni kod iste"}</button>
      </>}
      {err && <div style={{padding:"10px",background:"#fee2e2",borderRadius:6,fontSize:13,color:"#dc2626",marginBottom:12}}>⚠ {err}</div>}
      <button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",display:"block",margin:"0 auto"}}>{en?"← Back to login":"← Giriş ekranına dön"}</button>
    </div>
  </div>;
}

function AuthPage() {
  const {params} = use$();
  const [mode, setMode] = useState(params?.mode === "register" ? "register" : "login"); // login | register | forgot
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [regData, setRegData] = useState({name:"",email:"",phone:"",password:""});
  const [loginData, setLoginData] = useState({emailOrPhone:"",password:""});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const {go, setUser, lang} = use$();
  const en = lang === "en";

  async function doSignup() {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          name: regData.name.trim(),
          email: regData.email.trim(),
          phone: regData.phone,
          password: regData.password,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Kayıt başarısız");
      setUser(d.user);
      go("account");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function doLogin() {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(loginData),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Giriş başarısız");
      setUser(d.user);
      go("account");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};

  if(mode === "forgot") return <ForgotForm en={en} IS={IS} setMode={setMode} setUser={setUser} go={go}/>;

  return (
    <div style={{maxWidth:400,margin:"40px auto",padding:"0 20px"}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:28}}>
        {/* Tabs */}
        <div style={{display:"flex",marginBottom:24}}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{flex:1,padding:"10px",background:"none",border:"none",borderBottom:`2px solid ${mode===m?"#ff6000":"#eee"}`,color:mode===m?"#1a1a1a":"#999",fontSize:14,fontWeight:mode===m?700:400,cursor:"pointer"}}>
              {m === "login" ? (en?"Sign In":"Giriş Yap") : (en?"Sign Up":"Kayıt Ol")}
            </button>
          ))}
        </div>

        {err && <div style={{marginBottom:12,padding:"10px 14px",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:6,fontSize:13,color:"#991b1b"}}>⚠ {err}</div>}
        {mode === "login" ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Email or Phone":"E-posta veya Telefon"}</label>
              <input value={loginData.emailOrPhone} onChange={e=>setLoginData({...loginData,emailOrPhone:e.target.value})} placeholder={en?"example@email.com or 05xx xxx xx xx":"ornek@email.com veya 05xx xxx xx xx"} style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Password":"Şifre"}</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})} placeholder="••••••••" style={{...IS,paddingRight:44}}/>
                <button onClick={() => setShowPw(!showPw)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#999",fontSize:13,cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#666",cursor:"pointer"}}>
                <input type="checkbox" style={{accentColor:"#ff6000"}}/> {en?"Remember me":"Beni hatırla"}
              </label>
              <button onClick={() => {setMode("forgot"); setOtpSent(false)}} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer"}}>{en?"Forgot password":"Şifremi unuttum"}</button>
            </div>
            <button disabled={busy} onClick={doLogin}
              style={{padding:"12px",background:busy?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:busy?"not-allowed":"pointer",marginTop:4}}>{busy?"...":(en?"Sign In":"Giriş Yap")}</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Full Name":"Ad Soyad"}</label>
              <input value={regData.name} onChange={e => setRegData({...regData,name:e.target.value})} placeholder={en?"Your Full Name":"Adınız Soyadınız"} style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Phone Number":"Telefon Numarası"}</label>
              <div style={{display:"flex",gap:0}}>
                <span style={{padding:"10px 12px",background:"#f5f5f5",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:14,color:"#555"}}>+90</span>
                <input value={regData.phone} onChange={e => setRegData({...regData,phone:e.target.value.replace(/\D/g,"")})} placeholder="5XX XXX XX XX" maxLength={10}
                  style={{...IS,borderRadius:"0 6px 6px 0",flex:1}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Email":"E-posta"}</label>
              <input value={regData.email} onChange={e => setRegData({...regData,email:e.target.value})} type="email" placeholder="example@email.com" style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{en?"Password":"Şifre"}</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={regData.password} onChange={e => setRegData({...regData,password:e.target.value})} placeholder={en?"At least 6 characters":"En az 6 karakter"} style={{...IS,paddingRight:44}}/>
                <button onClick={() => setShowPw(!showPw)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#999",fontSize:13,cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#888",cursor:"pointer"}}>
              <input type="checkbox" style={{accentColor:"#ff6000",marginTop:2}}/>
              {en ? <span>I accept the <span onClick={()=>go("terms")} style={{color:"#ff6000",cursor:"pointer"}}>Terms & Conditions</span> and <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer"}}>Privacy Policy</span>.</span>
                  : <span><span onClick={()=>go("terms")} style={{color:"#ff6000",cursor:"pointer"}}>Kullanım koşullarını</span> ve <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer"}}>gizlilik politikasını</span> kabul ediyorum.</span>}
            </label>
            <button disabled={busy} onClick={doSignup}
              style={{padding:"12px",background:busy?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:busy?"not-allowed":"pointer",marginTop:4}}>{busy?"...":(en?"Sign Up":"Kayıt Ol")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ACCOUNT =====
function AccountPage() {
  const {user, setUser, go, pastOrders, addToCart, fp, lang} = use$();
  const en = lang === "en";
  if(!user) return <div style={{textAlign:"center",padding:"60px 20px"}}><p style={{color:"#999",marginBottom:16}}>{en?"You need to sign in.":"Giriş yapmanız gerekiyor."}</p><button onClick={() => go("auth")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>{en?"Sign In":"Giriş Yap"}</button></div>;

  // Deduplicate past orders for "frequently bought"
  const frequentItems = useMemo(() => {
    const counts = {};
    pastOrders.forEach(o => { counts[o.id] = (counts[o.id]||0) + o.qty; });
    return Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, totalQty]) => {
        const item = pastOrders.find(o => o.id === Number(id));
        const product = PRODUCTS.find(p => p.id === Number(id));
        return item ? {...item, totalQty, currentProduct: product} : null;
      })
      .filter(Boolean);
  }, [pastOrders]);

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700}}>{en?"My Account":"Hesabım"}</h1>
        <button onClick={async () => {try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}; setUser(null); go("home")}} style={{padding:"8px 16px",background:"none",border:"1px solid #ddd",borderRadius:6,fontSize:13,color:"#999",cursor:"pointer"}}>{en?"Log Out":"Çıkış Yap"}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:32}}>
        {[
          {icon:"📦",title:en?"My Orders":"Siparişlerim",desc:en?"Track your order history":"Sipariş geçmişinizi takip edin",onClick:()=>go("orders")},
          {icon:"📍",title:en?"My Addresses":"Adreslerim",desc:en?"Manage your delivery addresses":"Teslimat adreslerinizi yönetin",onClick:()=>go("addresses")},
          {icon:"👤",title:en?"Account Details":"Hesap Bilgileri",desc:en?"Update your personal info":"Kişisel bilgilerinizi güncelleyin",onClick:()=>go("profile")},
          {icon:"♥",title:en?"My Favorites":"Favorilerim",desc:en?"View your liked products":"Beğendiğiniz ürünleri görüntüleyin",onClick:()=>go("favs")},
          {icon:"🔔",title:en?"Notifications":"Bildirimler",desc:en?"Email and SMS preferences":"E-posta ve SMS tercihleriniz",onClick:()=>go("notifications")},
          {icon:"🔑",title:en?"Change Password":"Şifre Değiştir",desc:en?"Update account security":"Hesap güvenliğinizi güncelleyin",onClick:()=>go("change-password")},
        ].map((item,i) => (
          <div key={i} onClick={item.onClick} style={{padding:20,border:"1px solid #eee",borderRadius:8,cursor:"pointer",transition:"border-color .2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e => e.currentTarget.style.borderColor="#eee"}>
            <div style={{fontSize:28,marginBottom:10}}>{item.icon}</div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{item.title}</div>
            <div style={{fontSize:13,color:"#999"}}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Sık Alınanlar — Frequently Purchased */}
      {frequentItems.length > 0 && (
        <div style={{marginBottom:32}}>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>🔄 {en?"Frequently Purchased":"Sık Aldığınız Ürünler"}</h2>
          <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
            {frequentItems.map((item, i) => (
              <div key={item.id} style={{display:"flex",gap:14,padding:"14px 16px",borderBottom:i<frequentItems.length-1?"1px solid #f0f0f0":"none",alignItems:"center"}}>
                <img src={cdnImg(prodImg(item),80)} alt={item.name||""} loading="lazy" decoding="async" width={52} height={52} style={{width:52,height:52,objectFit:"contain",borderRadius:6,background:"#101624"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{translateName(item.name,lang)}</div>
                  <div style={{fontSize:12,color:"#999"}}>{item.brand} · {item.sku}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:2}}>{en?`Ordered ${item.totalQty} pcs total`:`Toplam ${item.totalQty} adet sipariş edildi`}</div>
                </div>
                <div style={{textAlign:"right",marginRight:12}}>
                  <div style={{fontSize:16,fontWeight:700}}>{fp(item.price)}</div>
                  {item.currentProduct && <div style={{fontSize:11,color:item.currentProduct.stock?"#4caf50":"#e53935"}}>{item.currentProduct.stock ? (en?"In Stock":"Stokta") : (en?"Sold Out":"Tükendi")}</div>}
                </div>
                <button onClick={() => {if(item.currentProduct?.stock) addToCart(item.currentProduct)}}
                  style={{padding:"8px 16px",background:item.currentProduct?.stock?"#ff6000":"#eee",color:item.currentProduct?.stock?"#fff":"#999",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:item.currentProduct?.stock?"pointer":"default",whiteSpace:"nowrap"}}>
                  {en?"Reorder":"Tekrar Al"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== FAVORITES =====
function FavsPage() {
  const {favs, go, isMobile, lang} = use$();
  const en = lang === "en";
  const items = favs.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"My Favorites":"Favorilerim"} ({items.length})</h1>
      {items.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:12}}>♡</div><p style={{color:"#999",marginBottom:16}}>{en?"You have no favorites yet":"Henüz favori ürününüz yok"}</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>{en?"Browse Products":"Ürünleri İncele"}</button></div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}

// ===== BRANDS / ABOUT / CONTACT / FAQ =====
function BrandsPage() {
  const {go,isMobile,t}=use$();
  return <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{t("brands")}</h1>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:12}}>
      {BRANDS.map(b => <div key={b} onClick={() => go("products",{brand:b})} style={{padding:"24px 16px",border:"1px solid #eee",borderRadius:8,textAlign:"center",cursor:"pointer",fontSize:15,fontWeight:600,transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e=>e.currentTarget.style.borderColor="#eee"}>{b}</div>)}
    </div></div>;
}

function AboutPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:16}}>{en?"About Us":"Hakkımızda"}</h1>
    <div style={{color:"#555",fontSize:15,lineHeight:1.8}}>
      {en ? <>
        <p style={{marginBottom:14}}><strong>Frenciniz</strong> offers bus, truck, tractor and trailer brake parts with confidence under Dumanlar Ticaret. Our top priority is not just selling products, but ensuring your safety on the road.</p>
        <p style={{marginBottom:14}}>We prioritize quality, durability and compatibility in every part. Because we know that the most important thing in the heavy vehicle world is a safe stop.</p>
        <p style={{marginBottom:14}}>At Frenciniz, we aim to build long-term relationships with our customers, deliver the right product at the right time, and make your shopping experience easy, transparent and enjoyable.</p>
        <p style={{fontWeight:600,color:"#ff6000",fontSize:16}}>Safety on the road is possible with Frenciniz.</p>
      </> : <>
        <p style={{marginBottom:14}}><strong>Frenciniz</strong>, Dumanlar Ticaret çatısı altında otobüs, kamyon, tır ve dorse fren aksamı ürünlerini sizlere güvenle sunar. Bizim için sadece ürün satmak değil, yolda güveninizi sağlamak en büyük önceliğimizdir.</p>
        <p style={{marginBottom:14}}>Her parçamızda kaliteyi, dayanıklılığı ve uyumu ön planda tutuyoruz. Çünkü biliyoruz ki, ağır vasıta dünyasında en önemli şey güvenli bir duruştur.</p>
        <p style={{marginBottom:14}}>Frenciniz olarak, müşterilerimizle uzun vadeli dostluklar kurmayı, doğru ürünü doğru zamanda ulaştırmayı ve alışverişinizi kolay, şeffaf ve keyifli hale getirmeyi hedefliyoruz.</p>
        <p style={{fontWeight:600,color:"#ff6000",fontSize:16}}>Yolda güven, Frenciniz ile mümkün.</p>
      </>}
    </div></div>;
}

// ===== ACCOUNT SUB-PAGES =====
function OrdersPage() {
  const {go, lang, user} = use$();
  const en = lang === "en";
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!user) { setOrders([]); return; }
    fetch("/api/auth/my-orders", {credentials:"include"})
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => { setErr("load"); setOrders([]); });
  }, [user]);

  return <div style={{maxWidth:900,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>{en?"My Account":"Hesabım"}</span> / <span style={{color:"#555"}}>{en?"My Orders":"Siparişlerim"}</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"My Orders":"Siparişlerim"}</h1>
    {!user ? (
      <div style={{textAlign:"center",padding:"48px 0"}}>
        <p style={{color:"#999",marginBottom:16}}>{en?"Please sign in to view your orders.":"Siparişlerinizi görmek için giriş yapın."}</p>
        <button onClick={()=>go("auth")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>{en?"Sign In":"Giriş Yap"}</button>
      </div>
    ) : orders === null ? (
      <div style={{textAlign:"center",padding:"48px 0",color:"#999"}}>{en?"Loading…":"Yükleniyor…"}</div>
    ) : orders.length === 0 ? (
      <div style={{textAlign:"center",padding:"48px 0"}}>
        <div style={{fontSize:48,marginBottom:12}}>📦</div>
        <p style={{color:"#999",marginBottom:16}}>{en?"You have no orders yet.":"Henüz siparişiniz bulunmuyor."}</p>
        <button onClick={()=>go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>{en?"Start Shopping":"Alışverişe Başla"}</button>
      </div>
    ) : (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {orders.map((o) => (
          <div key={o.orderRef} style={{border:"1px solid #eee",borderRadius:10,overflow:"hidden",background:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#fafafa",borderBottom:"1px solid #eee",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:13,color:"#999"}}>{en?"Order No":"Sipariş No"}</div>
                <div style={{fontSize:14,fontWeight:600}}>{o.orderRef}</div>
              </div>
              <div>
                <div style={{fontSize:13,color:"#999"}}>{en?"Date":"Tarih"}</div>
                <div style={{fontSize:13}}>{new Date(o.paidAt||o.createdAt).toLocaleString("tr-TR")}</div>
              </div>
              <div>
                <div style={{fontSize:13,color:"#999"}}>{en?"Status":"Durum"}</div>
                <div style={{fontSize:13,fontWeight:600,color:"#15803d"}}>✓ {o.fulfillmentStatus || (en?"Preparing":"Hazırlanıyor")}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,color:"#999"}}>{en?"Total":"Tutar"}</div>
                <div style={{fontSize:18,fontWeight:800,color:"#ff6000"}}>₺{Number(o.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
              </div>
            </div>
            {o.items && o.items.length > 0 && (
              <div style={{padding:"4px 16px"}}>
                {o.items.map((it,j) => (
                  <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:j<o.items.length-1?"1px solid #f5f5f5":"none",fontSize:13}}>
                    <div>
                      <div style={{fontWeight:500}}>{translateName(it.name,lang)}</div>
                      {(it.sku||it.brand) && <div style={{fontSize:12,color:"#999"}}>{[it.brand,it.sku].filter(Boolean).join(" · ")}</div>}
                    </div>
                    <div style={{textAlign:"right",whiteSpace:"nowrap"}}>
                      <div>{it.qty} {en?"pcs":"adet"} × ₺{Number(it.price).toLocaleString("tr-TR")}</div>
                      <div style={{fontWeight:600}}>₺{(it.price*it.qty).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>;
}

function AddressesPage() {
  const {go, addresses, setAddresses, user} = use$();
  const [editing, setEditing] = useState(null);
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  const updateAddr = (id, patch) => setAddresses(p => p.map(a => a.id===id ? {...a, ...patch} : a));
  const addNew = () => {
    const id = Date.now();
    setAddresses(p => [...p, {id, title:"Yeni Adres", name:user?.name||"", address:"", city:"", phone:user?.phone||""}]);
    setEditing(id);
  };

  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Adreslerim</span></div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h1 style={{fontSize:22,fontWeight:700}}>Adreslerim</h1>
      <button onClick={addNew} style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Yeni Adres Ekle</button>
    </div>
    {addresses.length === 0 && <div style={{padding:"40px 20px",textAlign:"center",color:"#999",border:"1px dashed #ddd",borderRadius:8}}>Henüz kayıtlı adresiniz yok. Yeni adres ekleyin.</div>}
    {addresses.map((addr) => (
      <div key={addr.id} style={{border:"1px solid #eee",borderRadius:8,padding:20,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:600}}>{addr.title}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditing(editing===addr.id?null:addr.id)} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"6px 14px",fontSize:12,color:"#555",cursor:"pointer"}}>{editing===addr.id?"Kapat":"Düzenle"}</button>
            <button onClick={()=>setAddresses(p=>p.filter(a=>a.id!==addr.id))} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"6px 14px",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
          </div>
        </div>
        {editing===addr.id ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input placeholder="Adres başlığı (Ev, İş...)" value={addr.title} onChange={e=>updateAddr(addr.id,{title:e.target.value})} style={IS}/>
            <input placeholder="Ad Soyad" value={addr.name} onChange={e=>updateAddr(addr.id,{name:e.target.value})} style={IS}/>
            <textarea placeholder="Adres" rows={2} value={addr.address} onChange={e=>updateAddr(addr.id,{address:e.target.value})} style={{...IS,resize:"vertical"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input placeholder="İl" value={addr.city} onChange={e=>updateAddr(addr.id,{city:e.target.value})} style={IS}/>
              <input placeholder="Telefon" value={addr.phone} onChange={e=>updateAddr(addr.id,{phone:e.target.value})} style={IS}/>
            </div>
            <button onClick={()=>setEditing(null)} style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>Kaydet</button>
          </div>
        ) : (
          <div style={{fontSize:13,color:"#888",lineHeight:1.6}}>
            {addr.name && <div><strong>{addr.name}</strong></div>}
            <div>{addr.address || "Adres bilgisi girilmemiş"}{addr.city && ` — ${addr.city}`}</div>
            {addr.phone && <div>📞 {addr.phone}</div>}
          </div>
        )}
      </div>
    ))}
  </div>;
}

function PaymentSuccessPage() {
  const {go, params} = use$();
  const orderId = params?.orderId || "—";
  return <div style={{maxWidth:540,margin:"60px auto",padding:"40px 24px",textAlign:"center",border:"1px solid #eee",borderRadius:12}}>
    <div style={{fontSize:64,marginBottom:12}}>✅</div>
    <h1 style={{fontSize:24,fontWeight:800,marginBottom:8,color:"#15803d"}}>Ödemeniz Başarılı!</h1>
    <p style={{color:"#666",marginBottom:8}}>Siparişiniz alındı ve hazırlanmaya başlanacak.</p>
    <p style={{color:"#333",marginBottom:24,fontSize:14}}>Sipariş No: <strong>{orderId}</strong></p>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
      <button onClick={()=>go("orders")} style={{padding:"12px 24px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Siparişlerim</button>
      <button onClick={()=>go("home")} style={{padding:"12px 24px",background:"#f5f5f5",color:"#555",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Ana Sayfa</button>
    </div>
  </div>;
}

function PaymentFailPage() {
  const {go, params} = use$();
  const reasonMap = {
    hash: "Doğrulama hatası (güvenlik imzası eşleşmedi)",
    "3ds": "3D Secure doğrulaması başarısız oldu",
    complete: "Banka ödemeyi tamamlayamadı",
    server: "Sunucu hatası",
    "missing-order": "Sipariş bilgisi bulunamadı",
  };
  const reason = reasonMap[params?.reason] || "Ödeme tamamlanamadı";
  return <div style={{maxWidth:540,margin:"60px auto",padding:"40px 24px",textAlign:"center",border:"1px solid #eee",borderRadius:12}}>
    <div style={{fontSize:64,marginBottom:12}}>❌</div>
    <h1 style={{fontSize:24,fontWeight:800,marginBottom:8,color:"#dc2626"}}>Ödeme Başarısız</h1>
    <p style={{color:"#666",marginBottom:8}}>{reason}.</p>
    {params?.orderId && <p style={{color:"#999",marginBottom:24,fontSize:13}}>Sipariş No: {params.orderId}</p>}
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
      <button onClick={()=>go("checkout")} style={{padding:"12px 24px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Tekrar Dene</button>
      <button onClick={()=>go("home")} style={{padding:"12px 24px",background:"#f5f5f5",color:"#555",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Ana Sayfa</button>
    </div>
  </div>;
}

function ProfilePage() {
  const {go, user, setUser} = use$();
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  const RO = {padding:"10px 14px",border:"1px solid #eee",borderRadius:6,fontSize:14,background:"#fafafa",color:"#333"};
  const HDR = {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4};
  const LBL = {fontSize:13,color:"#666"};
  const BTN = {background:"none",border:"none",color:"#ff6000",fontSize:12,fontWeight:600,cursor:"pointer",padding:"2px 6px"};
  const MISSING = <span style={{color:"#bbb",fontStyle:"italic"}}>Belirtilmemiş</span>;

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    birth: user?.birth || "",
  });
  // user context değişince form'u senkronla (giriş yenilenince vb.)
  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      birth: user?.birth || "",
    });
  }, [user]);
  const [edit, setEdit] = useState({name:false, email:false, phone:false, birth:false});
  const toggleEdit = (k) => setEdit(p => ({...p, [k]: !p[k]}));
  const update = (k, v) => { setForm(p => ({...p, [k]: v})); setSaveErr(""); };
  const fmtBirth = form.birth ? new Date(form.birth).toLocaleDateString("tr-TR") : null;
  const saveAll = async () => {
    if (saving) return;
    setSaving(true);
    setSaveErr("");
    try {
      const r = await fetch("/api/auth/update-profile", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok || !d.success) {
        setSaveErr(d.error || "Kaydedilemedi");
        return;
      }
      setUser(d.user);
      setEdit({name:false,email:false,phone:false,birth:false});
      setSaved(true);
      setTimeout(()=>setSaved(false), 2000);
    } catch (e) {
      setSaveErr("Sunucuya ulaşılamadı");
    } finally {
      setSaving(false);
    }
  };

  return <div style={{maxWidth:500,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Hesap Bilgileri</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Hesap Bilgileri</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,padding:24}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Ad Soyad */}
        <div>
          <div style={HDR}><label style={LBL}>Ad Soyad</label><button onClick={()=>toggleEdit("name")} style={BTN}>{edit.name?"İptal":"Güncelle"}</button></div>
          {edit.name
            ? <input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Adınız Soyadınız" style={IS} autoFocus/>
            : <div style={RO}>{form.name || MISSING}</div>}
        </div>
        {/* E-posta */}
        <div>
          <div style={HDR}><label style={LBL}>E-posta</label><button onClick={()=>toggleEdit("email")} style={BTN}>{edit.email?"İptal":"Güncelle"}</button></div>
          {edit.email
            ? <input type="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="ornek@email.com" style={IS} autoFocus/>
            : <div style={RO}>{form.email || MISSING}</div>}
        </div>
        {/* Telefon */}
        <div>
          <div style={HDR}><label style={LBL}>Telefon</label><button onClick={()=>toggleEdit("phone")} style={BTN}>{edit.phone?"İptal":"Güncelle"}</button></div>
          {edit.phone
            ? <div style={{display:"flex",gap:0}}>
                <span style={{padding:"10px 12px",background:"#f5f5f5",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:14,color:"#555"}}>+90</span>
                <input value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="5XX XXX XX XX" style={{...IS,borderRadius:"0 6px 6px 0",flex:1}} autoFocus/>
              </div>
            : <div style={RO}>{form.phone ? `+90 ${form.phone}` : MISSING}</div>}
        </div>
        {/* Doğum Tarihi */}
        <div>
          <div style={HDR}><label style={LBL}>Doğum Tarihi</label><button onClick={()=>toggleEdit("birth")} style={BTN}>{edit.birth?"İptal":"Güncelle"}</button></div>
          {edit.birth
            ? <input type="date" value={form.birth} onChange={e=>update("birth",e.target.value)} style={IS} autoFocus/>
            : <div style={RO}>{fmtBirth || MISSING}</div>}
        </div>
        {saveErr && <div style={{fontSize:13,color:"#d32f2f",background:"#ffebee",padding:"8px 12px",borderRadius:6}}>{saveErr}</div>}
        <button onClick={saveAll} disabled={saving} style={{padding:"12px",background:saving?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:saving?"wait":"pointer",marginTop:4,opacity:saving?0.7:1}}>
          {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Bilgileri Kaydet"}
        </button>
      </div>
    </div>
  </div>;
}

function NotificationsPage() {
  const {go} = use$();
  const [prefs, setPrefs] = useState({email:true, sms:true, campaign:true, stock:true, order:true});
  const toggle = (key) => setPrefs(p=>({...p,[key]:!p[key]}));

  return <div style={{maxWidth:500,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Bildirimler</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Bildirim Tercihleri</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
      {[
        {key:"email",label:"E-posta Bildirimleri",desc:"Sipariş ve kampanya e-postaları"},
        {key:"sms",label:"SMS Bildirimleri",desc:"Sipariş durumu SMS bildirimleri"},
        {key:"campaign",label:"Kampanya Bildirimleri",desc:"İndirim ve kampanya duyuruları"},
        {key:"stock",label:"Stok Bildirimleri",desc:"Takip ettiğiniz ürünler stoğa girince"},
        {key:"order",label:"Sipariş Güncellemeleri",desc:"Kargo ve teslimat bildirimleri"},
      ].map((item,i) => (
        <div key={item.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:i<4?"1px solid #f0f0f0":"none"}}>
          <div><div style={{fontSize:14,fontWeight:600}}>{item.label}</div><div style={{fontSize:12,color:"#999"}}>{item.desc}</div></div>
          <button onClick={()=>toggle(item.key)}
            style={{width:48,height:26,borderRadius:13,border:"none",background:prefs[item.key]?"#ff6000":"#ddd",position:"relative",cursor:"pointer",transition:"background .2s"}}>
            <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:2,left:prefs[item.key]?24:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
          </button>
        </div>
      ))}
    </div>
  </div>;
}

function ChangePasswordPage() {
  const {go} = use$();
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  const [showPw, setShowPw] = useState({old:false,new1:false,new2:false});
  const [saved, setSaved] = useState(false);

  return <div style={{maxWidth:450,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Şifre Değiştir</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Şifre Değiştir</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,padding:24}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[{key:"old",label:"Mevcut Şifre",ph:"Mevcut şifrenizi girin"},{key:"new1",label:"Yeni Şifre",ph:"En az 6 karakter"},{key:"new2",label:"Yeni Şifre (Tekrar)",ph:"Yeni şifrenizi tekrar girin"}].map(f => (
          <div key={f.key}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{f.label}</label>
            <div style={{position:"relative"}}>
              <input type={showPw[f.key]?"text":"password"} placeholder={f.ph} style={{...IS,paddingRight:44}}/>
              <button onClick={()=>setShowPw(p=>({...p,[f.key]:!p[f.key]}))} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#999",fontSize:13,cursor:"pointer"}}>{showPw[f.key]?"🙈":"👁"}</button>
            </div>
          </div>
        ))}
        <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}} style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>
          {saved ? "✓ Şifre Güncellendi" : "Şifreyi Değiştir"}
        </button>
      </div>
    </div>
  </div>;
}

function AccessibilityPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Accessibility Statement":"Erişilebilirlik Bildirimi"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) is committed to meeting accessibility standards so that everyone can use our website and services equally. Our goal is to make our bus, truck, trailer and semi-trailer brake parts products accessible to all users.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Compliance with Standards</h2>
      <p style={{marginBottom:16}}>Our website has been designed in accordance with international accessibility standards (WCAG 2.1). Necessary adjustments are made to ensure that visual, textual and interactive content can be used by everyone.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Continuous Improvement</h2>
      <p style={{marginBottom:16}}>Accessibility is a continuously evolving process. We regularly update and improve our website based on feedback from our users.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Support and Contact</h2>
      <p style={{marginBottom:16}}>If you experience any accessibility issues while using our website, please contact us. Your request will be evaluated as soon as possible and necessary steps will be taken to resolve it.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Commitment</h2>
      <p>At Frenciniz, we consider accessibility a priority responsibility to ensure all our customers have a safe and easy shopping experience.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret), herkesin web sitemizi ve hizmetlerimizi eşit şekilde kullanabilmesi için erişilebilirlik standartlarına uymayı taahhüt eder. Amacımız, otobüs, kamyon, tır ve dorse fren aksamı ürünlerimizi tüm kullanıcılarımız için erişilebilir hale getirmektir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Standartlara Uyum</h2>
      <p style={{marginBottom:16}}>Web sitemiz, uluslararası erişilebilirlik standartları (WCAG 2.1) dikkate alınarak tasarlanmıştır. Görsel, metin ve etkileşimli içeriklerin herkes tarafından kullanılabilir olması için gerekli düzenlemeler yapılmaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Sürekli İyileştirme</h2>
      <p style={{marginBottom:16}}>Erişilebilirlik, sürekli gelişen bir süreçtir. Kullanıcılarımızdan gelen geri bildirimler doğrultusunda web sitemizi düzenli olarak günceller ve iyileştiririz.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Destek ve İletişim</h2>
      <p style={{marginBottom:16}}>Eğer web sitemizi kullanırken erişimle ilgili bir sorun yaşarsanız, bizimle iletişime geçebilirsiniz. Talebiniz en kısa sürede değerlendirilir ve çözüm için gerekli adımlar atılır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Taahhüt</h2>
      <p>Frenciniz olarak, tüm müşterilerimizin güvenli ve kolay bir alışveriş deneyimi yaşaması için erişilebilirlik konusunu öncelikli bir sorumluluk olarak kabul ediyoruz.</p>
      </>}

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 <a href="tel:+905456087008" style={{color:"#ff6000",textDecoration:"none"}}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",textDecoration:"none"}}>💬 WhatsApp</a><br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function CompanyPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Company Information":"Şirket Bilgileri"}</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
      {[
        {label:en?"Company Name":"Şirket Ünvanı",value:"Dumanlar Ticaret"},
        {label:en?"Tax Office":"Vergi Dairesi",value:"Kaymakkapı"},
        {label:en?"Tax Number":"Vergi Numarası",value:"3140853144"},
        {label:en?"Address":"Adres",value:"Hızırbey Mahallesi, 1509 Sokak, No:24, Isparta Merkez"},
        {label:en?"KEP Address":"KEP Adresi",value:"tarkan.duman.2@hs01.kep.tr"},
        {label:en?"Corporate Email":"Kurumsal E-posta",value:"info@frenciniz.com"},
        {label:en?"Phone":"Telefon",value:"0545 608 7008"},
        {label:"WhatsApp",value:"0850 888 7881"},
      ].map((row,i,arr) => (
        <div key={i} style={{display:"flex",padding:"14px 20px",borderBottom:i<arr.length-1?"1px solid #f0f0f0":"none",background:i%2===0?"#fafafa":"#fff"}}>
          <span style={{width:180,flexShrink:0,fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{row.label}</span>
          <span style={{fontSize:14,color:"#555"}}>{row.value}</span>
        </div>
      ))}
    </div>
    <a href={ETBIS_VERIFY_URL} target="_blank" rel="noopener noreferrer" style={{marginTop:18,display:"flex",alignItems:"center",gap:16,padding:16,border:"1px solid #e8eef7",borderRadius:8,background:"#f8fbff",textDecoration:"none",color:"#172033"}}>
      <img src={ETBIS_QR} alt="ETBIS dogrulama karekodu" width={96} height={96} loading="lazy" decoding="async" style={{width:96,height:96,borderRadius:8,background:"#fff",padding:4,border:"1px solid #d8e2f0",flexShrink:0}}/>
      <span>
        <strong style={{display:"block",fontSize:16,marginBottom:6,color:"#0b1b33"}}>{en?"ETBIS Verification":"ETBIS Dogrulama"}</strong>
        <span style={{display:"block",fontSize:14,lineHeight:1.6,color:"#4f5f73"}}>{en?"Query Frenciniz's Ministry of Trade registration record.":"Frenciniz Ticaret Bakanligi kayit sorgulamasini acin."}</span>
        <span style={{display:"block",fontSize:12,color:"#7a8797",marginTop:6,overflowWrap:"anywhere"}}>{ETBIS_SITE_ID}</span>
      </span>
    </a>
  </div>;
}

function KvkkPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"KVKK Disclosure Text":"KVKK Aydınlatma Metni"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>At Frenciniz (Dumanlar Ticaret), we attach great importance to the protection of your personal data within the scope of the Personal Data Protection Law No. 6698 ("KVKK"). This text explains for what purposes your personal data is processed, with whom it may be shared, and the rights you have.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Data Controller</h2>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) processes your personal data as the "Data Controller" within the scope of KVKK.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Purposes of Processing Personal Data</h2>
      <p style={{marginBottom:8}}>Your personal data is processed for the following purposes:</p>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Receiving orders, preparing and delivering products,</li>
        <li style={{marginBottom:6}}>Processing payments,</li>
        <li style={{marginBottom:6}}>Managing customer service and support processes,</li>
        <li>Fulfilling legal obligations.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Transfer of Personal Data</h2>
      <p style={{marginBottom:16}}>Your personal data may be shared with third parties only when required by legal obligations or necessary for the performance of the service (e.g., cargo companies, payment providers).</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Method of Collecting Personal Data</h2>
      <p style={{marginBottom:16}}>Your data is collected electronically through membership, order and contact forms on our website.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. Your Rights Under KVKK</h2>
      <p style={{marginBottom:8}}>Pursuant to Article 11 of KVKK, you have the right to:</p>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Learn whether your personal data is being processed,</li>
        <li style={{marginBottom:6}}>Request information if it has been processed,</li>
        <li style={{marginBottom:6}}>Learn whether it is used in accordance with its purpose,</li>
        <li style={{marginBottom:6}}>Request correction or deletion,</li>
        <li>Object to its processing.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. Contact</h2>
      <p>To exercise your rights or for any questions, please contact Frenciniz customer service.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu metin, kişisel verilerinizin hangi amaçlarla işlendiğini, kimlerle paylaşılabileceğini ve sahip olduğunuz hakları açıklamaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Veri Sorumlusu</h2>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret), KVKK kapsamında "Veri Sorumlusu" sıfatıyla kişisel verilerinizi işlemektedir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Kişisel Verilerin İşlenme Amaçları</h2>
      <p style={{marginBottom:8}}>Kişisel verileriniz;</p>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Siparişlerin alınması, ürünlerin hazırlanması ve teslim edilmesi,</li>
        <li style={{marginBottom:6}}>Ödeme işlemlerinin gerçekleştirilmesi,</li>
        <li style={{marginBottom:6}}>Müşteri hizmetleri ve destek süreçlerinin yürütülmesi,</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi,</li>
      </ul>
      <p style={{marginBottom:16}}>amaçlarıyla işlenmektedir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Kişisel Verilerin Aktarımı</h2>
      <p style={{marginBottom:16}}>Kişisel verileriniz, yalnızca yasal zorunluluklar veya hizmetin ifası için gerekli durumlarda (örneğin kargo firmaları, ödeme sağlayıcıları) üçüncü kişilerle paylaşılabilir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Kişisel Verilerin Toplanma Yöntemi</h2>
      <p style={{marginBottom:16}}>Verileriniz, web sitemiz üzerinden üyelik, sipariş ve iletişim formları aracılığıyla elektronik ortamda toplanmaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. KVKK Kapsamındaki Haklarınız</h2>
      <p style={{marginBottom:8}}>KVKK'nın 11. maddesi uyarınca;</p>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
        <li style={{marginBottom:6}}>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li style={{marginBottom:6}}>Amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li style={{marginBottom:6}}>Düzeltilmesini veya silinmesini talep etme,</li>
        <li>İşlenmesine itiraz etme,</li>
      </ul>
      <p style={{marginBottom:16}}>haklarına sahipsiniz.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. İletişim</h2>
      <p>Haklarınızı kullanmak veya sorularınız için Frenciniz müşteri hizmetleri ile iletişime geçebilirsiniz.</p>
      </>}

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 <a href="tel:+905456087008" style={{color:"#ff6000",textDecoration:"none"}}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",textDecoration:"none"}}>💬 WhatsApp</a><br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function ReturnPolicyPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Return Policy":"İade Politikası"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) prioritizes customer satisfaction and protects your right to return/exchange purchased products. This Return Policy has been prepared in accordance with Consumer Protection Law No. 6502 and related legislation.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Return Period</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>You have the right to return products within 14 days of delivery.</li>
        <li>You must contact our customer service for your return request.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Return Conditions</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Products must be unused, undamaged and in their original packaging.</li>
        <li style={{marginBottom:6}}>Returns are not accepted if technical parts such as brake components have been installed or used.</li>
        <li>In case of incorrect or damaged product delivery, product cost and shipping fees will be covered by us.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Return Process</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>After your return request is approved, the product must be sent to us via contracted cargo company.</li>
        <li>After the product reaches us, it will be inspected and if approved, the refund will be processed within 7 business days.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Exchange</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li>You may request an exchange instead of a return. Product exchange is made based on stock availability.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. Exceptions</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li>Products damaged through use, installed parts and custom order products are excluded from returns.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. Contact</h2>
      <p>For return and exchange requests, please contact Frenciniz customer service.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret), müşteri memnuniyetini ön planda tutar ve satın aldığınız ürünlerde iade/değişim hakkınızı korur. Bu İade Politikası, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili mevzuat çerçevesinde hazırlanmıştır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. İade Süresi</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Teslim aldığınız ürünleri, 14 gün içerisinde iade etme hakkına sahipsiniz.</li>
        <li>İade talebiniz için müşteri hizmetlerimizle iletişime geçmeniz gerekmektedir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. İade Şartları</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Ürünler kullanılmamış, hasar görmemiş ve orijinal ambalajında olmalıdır.</li>
        <li style={{marginBottom:6}}>Fren aksamı gibi teknik parçaların montajı yapılmış veya kullanılmış olması halinde iade kabul edilmez.</li>
        <li>Yanlış veya hasarlı ürün teslimi durumunda, ürün bedeli ve kargo ücreti tarafımızca karşılanır.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. İade Süreci</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>İade talebiniz onaylandıktan sonra ürün, anlaşmalı kargo firması aracılığıyla tarafımıza gönderilmelidir.</li>
        <li>Ürün tarafımıza ulaştıktan sonra gerekli inceleme yapılır ve uygun bulunması halinde ücret iadesi 7 iş günü içerisinde gerçekleştirilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Değişim</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li>İade yerine değişim talep edebilirsiniz. Stok durumuna göre ürün değişimi yapılır.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. İstisnalar</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li>Kullanım sonucu hasar görmüş ürünler, montajı yapılmış parçalar ve özel sipariş ürünler iade kapsamı dışındadır.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. İletişim</h2>
      <p>İade ve değişim talepleriniz için Frenciniz müşteri hizmetleri ile iletişime geçebilirsiniz.</p>
      </>}

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 <a href="tel:+905456087008" style={{color:"#ff6000",textDecoration:"none"}}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",textDecoration:"none"}}>💬 WhatsApp</a><br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function TermsPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Terms and Conditions":"Şartlar ve Koşullar"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>All users who visit and shop on the Frenciniz (Dumanlar Ticaret) website are deemed to have accepted the following terms.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. General Provisions</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>All transactions made through this site are subject to the laws of the Republic of Turkey.</li>
        <li>By visiting and shopping on the site, the user accepts these terms.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Products and Services</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Product information and prices on the site are updated regularly.</li>
        <li>Stock availability and price changes may be made without prior notice.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Orders and Payment</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Orders are processed after payment confirmation is received.</li>
        <li>Payment methods are carried out through secure infrastructure.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Shipping and Delivery</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Products are shipped via contracted cargo companies.</li>
        <li>Delivery times may vary by region.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. Returns and Exchanges</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Return and exchange processes are managed under the "Return and Exchange Policy".</li>
        <li>In case of damaged or incorrect product delivery, customer service should be contacted.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. Privacy and Data Protection</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Users' personal data is protected under KVKK.</li>
        <li>Data is used only for order and customer service processes.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>7. Disclaimer</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Frenciniz cannot be held responsible for indirect damages arising from use of the site.</li>
        <li>The user uses the site at their own responsibility.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>8. Jurisdiction</h2>
      <p>Isparta Courts and Enforcement Offices are authorized for disputes arising from these terms and conditions.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) web sitesini ziyaret eden ve alışveriş yapan tüm kullanıcılar aşağıdaki şartları kabul etmiş sayılır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Genel Hükümler</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Bu site üzerinden yapılan tüm işlemler Türkiye Cumhuriyeti yasalarına tabidir.</li>
        <li>Kullanıcı, siteyi ziyaret ederek ve alışveriş yaparak bu şartları kabul etmiş olur.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Ürün ve Hizmetler</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Sitede yer alan ürün bilgileri ve fiyatlar düzenli olarak güncellenir.</li>
        <li>Stok durumu ve fiyat değişiklikleri önceden haber verilmeksizin yapılabilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Sipariş ve Ödeme</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Siparişler, ödeme onayı alındıktan sonra işleme alınır.</li>
        <li>Ödeme yöntemleri güvenli altyapılar üzerinden gerçekleştirilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Gönderim ve Teslimat</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Ürünler anlaşmalı kargo firmaları aracılığıyla gönderilir.</li>
        <li>Teslimat süreleri bölgeye göre değişiklik gösterebilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. İade ve Değişim</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>İade ve değişim süreçleri "İade ve Değişim Politikası" kapsamında yürütülür.</li>
        <li>Hasarlı veya yanlış ürün teslimi durumunda müşteri hizmetleri ile iletişime geçilmelidir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>6. Gizlilik ve Veri Koruma</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Kullanıcıların kişisel verileri KVKK kapsamında korunur.</li>
        <li>Veriler yalnızca sipariş ve müşteri hizmetleri süreçlerinde kullanılır.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>7. Sorumluluk Reddi</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Frenciniz, site kullanımından doğabilecek dolaylı zararlardan sorumlu tutulamaz.</li>
        <li>Kullanıcı, siteyi kendi sorumluluğu altında kullanır.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>8. Yetkili Mahkeme</h2>
      <p>İşbu şartlar ve koşullardan doğabilecek uyuşmazlıklarda Isparta Mahkemeleri ve İcra Daireleri yetkilidir.</p>
      </>}
    </div>
  </div>;
}

function ShippingPolicyPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Shipping Policy":"Gönderim Politikası"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret) is committed to providing a safe, fast and transparent shipping process to its customers. This Shipping Policy explains the principles followed in the preparation and delivery of your orders.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Order Preparation</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>All orders are processed as soon as possible after payment confirmation.</li>
        <li>In-stock products are generally shipped within 1-3 business days.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Cargo and Delivery</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Shipments are made via contracted cargo companies.</li>
        <li style={{marginBottom:6}}>Delivery time may vary depending on your region.</li>
        <li>A cargo tracking number will be provided after your order is shipped.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Shipping Fees</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Orders under 3000 TL: 150 TL shipping fee.</li>
        <li style={{marginBottom:6}}>Orders 3000 TL and over: free shipping.</li>
        <li>Free shipping may also be offered during certain promotional periods.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Responsibility and Returns</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Products are under Frenciniz's responsibility until handed over to the cargo company.</li>
        <li style={{marginBottom:6}}>For damage or loss that may occur after delivery, the cargo company should be contacted.</li>
        <li>In case of damaged or incorrect product delivery, return and exchange processes are managed under the "Return and Exchange Policy".</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. Contact</h2>
      <p>For any questions and requests regarding the shipping process, please contact our customer service.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret), müşterilerine güvenli, hızlı ve şeffaf bir gönderim süreci sunmayı taahhüt eder. Bu Gönderim Politikası, siparişlerinizin hazırlanması ve teslim edilmesi aşamalarında izlenen esasları açıklamaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Sipariş Hazırlığı</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Tüm siparişleriniz, ödeme onayı alındıktan sonra en kısa sürede işleme alınır.</li>
        <li>Stokta bulunan ürünler genellikle 1-3 iş günü içerisinde kargoya teslim edilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Kargo ve Teslimat</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Gönderimler anlaşmalı kargo firmaları aracılığıyla yapılır.</li>
        <li style={{marginBottom:6}}>Teslimat süresi, bulunduğunuz bölgeye göre değişiklik gösterebilir.</li>
        <li>Kargo takip numarası, siparişiniz kargoya verildikten sonra tarafınıza iletilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Gönderim Ücretleri</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>3000 TL altı siparişlerde kargo ücreti 150 TL'dir.</li>
        <li style={{marginBottom:6}}>3000 TL ve üzeri siparişlerde kargo ücretsizdir.</li>
        <li>Belirli kampanya dönemlerinde ücretsiz kargo imkânı sunulabilir.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Sorumluluk ve İade</h2>
      <ul style={{marginBottom:16,paddingLeft:20}}>
        <li style={{marginBottom:6}}>Ürünler kargoya teslim edilene kadar Frenciniz sorumluluğundadır.</li>
        <li style={{marginBottom:6}}>Teslimat sonrası oluşabilecek hasar veya kayıplar için kargo firması ile iletişime geçilmesi gerekmektedir.</li>
        <li>Hasarlı veya yanlış ürün teslimi durumunda, iade ve değişim süreçleri "İade ve Değişim Politikası" kapsamında yürütülür.</li>
      </ul>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. İletişim</h2>
      <p>Gönderim süreciyle ilgili her türlü soru ve talebiniz için müşteri hizmetlerimizle iletişime geçebilirsiniz.</p>
      </>}

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 <a href="tel:+905456087008" style={{color:"#ff6000",textDecoration:"none"}}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",textDecoration:"none"}}>💬 WhatsApp</a><br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function PrivacyPage() {
  const {lang} = use$();
  const en = lang==="en";
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Privacy Policy":"Gizlilik Politikası"}</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      {en ? <>
      <p style={{marginBottom:16}}>Frenciniz operates under Dumanlar Ticaret and attaches great importance to the protection of our customers' personal data. This Privacy Policy has been prepared in accordance with the Personal Data Protection Law No. 6698 ("KVKK") and related legislation.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Collection and Processing of Personal Data</h2>
      <p style={{marginBottom:16}}>Name, surname, address, phone, email and payment information shared by our customers during order, membership and contact processes are processed solely for the purpose of service delivery, product delivery and ensuring customer satisfaction.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Sharing of Personal Data</h2>
      <p style={{marginBottom:16}}>Collected data is not shared with third parties except for legal obligations. However, necessary information may be shared with service providers such as logistics and cargo companies solely for the purpose of delivery.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Data Security</h2>
      <p style={{marginBottom:16}}>Frenciniz takes the necessary technical and administrative measures to prevent unauthorized access, loss or misuse of personal data.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Your Rights</h2>
      <p style={{marginBottom:16}}>Under KVKK, you have the right to learn whether your personal data is being processed, request correction, request deletion and object to its processing. You may contact us to exercise these rights.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. Contact</h2>
      <p>For any questions, requests and applications, please contact Frenciniz customer service.</p>
      </> : <>
      <p style={{marginBottom:16}}>Frenciniz, Dumanlar Ticaret çatısı altında faaliyet göstermekte olup, müşterilerimizin kişisel verilerinin korunmasına büyük önem vermektedir. Bu Gizlilik Politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuat çerçevesinde hazırlanmıştır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Kişisel Verilerin Toplanması ve İşlenmesi</h2>
      <p style={{marginBottom:16}}>Müşterilerimizin sipariş, üyelik ve iletişim süreçlerinde paylaştığı ad, soyad, adres, telefon, e-posta ve ödeme bilgileri; yalnızca hizmetin ifası, ürün teslimi ve müşteri memnuniyetinin sağlanması amacıyla işlenmektedir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Kişisel Verilerin Paylaşımı</h2>
      <p style={{marginBottom:16}}>Toplanan veriler, yasal yükümlülükler dışında üçüncü kişilerle paylaşılmaz. Ancak lojistik ve kargo firmaları gibi hizmet sağlayıcılarla, yalnızca teslimatın gerçekleşmesi için gerekli bilgiler paylaşılabilir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Veri Güvenliği</h2>
      <p style={{marginBottom:16}}>Frenciniz, kişisel verilerin yetkisiz erişim, kayıp veya kötüye kullanımını önlemek amacıyla gerekli teknik ve idari tedbirleri almaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Haklarınız</h2>
      <p style={{marginBottom:16}}>KVKK kapsamında, kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini talep etme, silinmesini isteme ve işlenmesine itiraz etme haklarına sahipsiniz. Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>5. İletişim</h2>
      <p>Her türlü soru, talep ve başvurularınız için Frenciniz müşteri hizmetleri ile iletişime geçebilirsiniz.</p>
      </>}

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 <a href="tel:+905456087008" style={{color:"#ff6000",textDecoration:"none"}}>0545 608 7008</a> – <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer" style={{color:"#25D366",textDecoration:"none"}}>💬 WhatsApp</a><br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function ContactPage() {
  const {lang, isMobile} = use$();
  const en = lang==="en";
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const body = [`Ad Soyad: ${name}`, `E-posta: ${email}`, `Telefon: ${phone}`, "", message].join("\n");
    window.location.href = `mailto:info@frenciniz.com?subject=${encodeURIComponent("Frenciniz iletişim formu")}&body=${encodeURIComponent(body)}`;
  };
  return <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Contact":"İletişim"}</h1>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:24}}>
        <form onSubmit={handleContactSubmit} style={{display:"flex",flexDirection:"column",gap:12}}>
          <input name="name" required placeholder={en?"Full Name":"Ad Soyad"} style={IS}/><input name="email" type="email" required placeholder={en?"Email":"E-posta"} style={IS}/><input name="phone" placeholder={en?"Phone":"Telefon"} style={IS}/>
          <textarea name="message" required rows={4} placeholder={en?"Your message...":"Mesajınız..."} style={{...IS,resize:"vertical"}}/>
          <button type="submit" style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>{en?"Send":"Gönder"}</button>
        </form>
      </div>
      <div>
        {[
          {icon:"📍",label:en?"Address":"Adres",value:"Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez",href:"https://maps.google.com/?q=Hızırbey+Mah+1509+Sok+24+Isparta"},
          {icon:"📞",label:en?"Phone":"Telefon",value:"0545 608 7008",href:"tel:+905456087008"},
          {icon:"💬",label:"WhatsApp",value:"0850 888 7881",href:"https://wa.me/908508887881",color:"#25D366"},
          {icon:"✉️",label:en?"Email":"E-posta",value:"info@frenciniz.com",href:"mailto:info@frenciniz.com"},
          {icon:"⏰",label:en?"Working Hours":"Çalışma",value:en?"Mon–Sat 08:00–18:00":"Pzt–Cmt 08:00–18:00"},
        ].map((c,i) => {
          const inner = <>
            <span style={{fontSize:24}}>{c.icon}</span>
            <div><div style={{fontSize:12,color:"#999"}}>{c.label}</div><div style={{fontSize:15,fontWeight:600,color:c.color||"#333"}}>{c.value}</div></div>
          </>;
          return c.href ? <a key={i} href={c.href} target={c.href.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" style={{display:"flex",gap:14,alignItems:"center",padding:16,borderBottom:"1px solid #f0f0f0",textDecoration:"none",cursor:"pointer",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f9f9f9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{inner}</a>
            : <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:16,borderBottom:"1px solid #f0f0f0"}}>{inner}</div>;
        })}
      </div>
    </div></div>;
}

function FaqPage() {
  const {lang} = use$();
  const en = lang==="en";
  const [open, setOpen] = useState(null);
  const faqs = en ? [
    {q:"What is the shipping time?",a:"Orders placed before 2 PM are shipped the same day."},
    {q:"Are the products original?",a:"We offer original and certified equivalent parts."},
    {q:"Can I make a return?",a:"Unused products can be returned within 14 days."},
    {q:"Is there a bulk purchase discount?",a:"Discounts on orders over 5,000 TL. You can request a B2B quote."},
    {q:"Is installment payment available?",a:"12-month installment options are available for all credit cards."},
    {q:"Will the product fit my vehicle?",a:"Compatibility candidates and OEM references are available on the product page; please confirm by chassis, OEM code or old part photo before ordering."}
  ] : [
    {q:"Kargo süresi nedir?",a:"14:00'a kadar verilen siparişler aynı gün kargoya verilir."},
    {q:"Ürünler orijinal mi?",a:"Orijinal ve eşdeğer seçenekler sunuyoruz; sertifika/üretici bilgisi ürün bazında teyit edilir."},
    {q:"İade yapabilir miyim?",a:"Kullanılmamış ürünler 14 gün içinde iade edilebilir."},
    {q:"Toplu alım için teklif alabilir miyim?",a:"Evet. Adet, araç listesi ve OEM/parça kodlarını ileterek güncel B2B teklif isteyebilirsiniz."},
    {q:"Taksit yapılıyor mu?",a:"Tüm kredi kartlarına 12 taksit imkânı mevcuttur."},
    {q:"Ürün aracıma uyar mı?",a:"Ürün sayfasında uyumluluk adayları ve OEM referansları yer alır; kesin sipariş öncesi şase, OEM kodu veya eski parça fotoğrafıyla teyit alın."}
  ];
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{en?"Frequently Asked Questions":"Sık Sorulan Sorular"}</h1>
    {faqs.map((f,i) => <div key={i} style={{borderBottom:"1px solid #eee"}}>
      <button onClick={() => setOpen(open===i?null:i)} style={{width:"100%",padding:"16px 0",background:"none",border:"none",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:15,fontWeight:600,cursor:"pointer"}}>{f.q}<span style={{color:"#999",transform:open===i?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span></button>
      {open===i && <div style={{padding:"0 0 16px",fontSize:14,color:"#666",lineHeight:1.7}}>{f.a}</div>}
    </div>)}</div>;
}

// ===== MOBILE MENU =====
function MobileMenu() {
  const {go, setMobileMenuOpen, setUser, t, user, favs, lang} = use$();
  const en = lang === "en";
  return (
    <div style={{position:"fixed",inset:0,zIndex:200}}>
      <div onClick={() => setMobileMenuOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)"}} />
      <div style={{position:"absolute",top:0,left:0,bottom:0,width:280,background:"#fff",overflowY:"auto",animation:"slideLeft .25s ease",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <img src={BRAND_LOGO} alt="Frenciniz" onClick={() => {go("home");setMobileMenuOpen(false)}} onError={e=>{e.currentTarget.src="/logo.webp?v=3"}} style={{flex:1,width:"100%",maxHeight:64,objectFit:"contain",cursor:"pointer",display:"block"}} />
          <button onClick={() => setMobileMenuOpen(false)} style={{background:"none",border:"none",fontSize:22,color:"#999",cursor:"pointer",flexShrink:0,padding:"4px 8px"}}>✕</button>
        </div>
        <div style={{padding:"12px 0"}}>
          {/* 1. Hesap alanı — en üstte */}
          {user ? (
            <>
              <button onClick={() => {go("account");setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"14px 20px",background:"#fff5f0",border:"none",fontSize:15,fontWeight:600,color:"#ff6000",cursor:"pointer",textAlign:"left"}}>
                👤 {user.name}
              </button>
              <button onClick={async () => { try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}; setUser(null); setMobileMenuOpen(false); go("home"); }} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",background:"none",border:"none",fontSize:14,color:"#888",cursor:"pointer",textAlign:"left"}}>
                ↩ {en?"Sign Out":"Çıkış Yap"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => {go("auth",{mode:"login"});setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"14px 20px",background:"#ff6000",border:"none",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",textAlign:"left"}}>
                🔑 {en?"Sign In":"Giriş Yap"}
              </button>
              <button onClick={() => {go("auth",{mode:"register"});setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",background:"none",border:"1px solid #ff6000",borderRadius:0,fontSize:14,fontWeight:600,color:"#ff6000",cursor:"pointer",textAlign:"left",margin:"8px 20px",width:"calc(100% - 40px)"}}>
                ✏️ {en?"Sign Up":"Kayıt Ol"}
              </button>
            </>
          )}
          <button onClick={() => {go("favs");setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",background:"none",border:"none",fontSize:14,color:"#555",cursor:"pointer",textAlign:"left"}}>
            ♡ {t("favs")} {favs.length>0&&`(${favs.length})`}
          </button>

          <div style={{height:1,background:"#eee",margin:"8px 20px"}} />

          {/* 2. Kategoriler — ortada */}
          <div style={{margin:"10px 14px",padding:10,borderRadius:8,background:"radial-gradient(circle at 12% 0%, rgba(255,96,0,.24), transparent 42%), linear-gradient(180deg,#0b1020,#111827)",border:"1px solid rgba(255,255,255,.1)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 4px 10px",fontSize:12,fontWeight:950,color:"#fff",textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:8}}>
              <CategoryIcon visual={categoryVisual("all")} small alt={t("category")} />
              <span>{t("category")}</span>
            </div>
            {CATS.filter(c=>c.isGroup).map(c => {
              const visual = categoryVisual(c);
              return (
                <button key={c.id} onClick={() => {go("products",{cat:c.id});setMobileMenuOpen(false)}}
                  style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"7px 8px",margin:"5px 0",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,fontSize:13,color:"#e5e7eb",fontWeight:850,cursor:"pointer",textAlign:"left"}}>
                  <CategoryIcon visual={visual} alt={translateCat(c,lang)} />
                  <span style={{flex:1,lineHeight:1.25}}>{translateCat(c,lang)}</span>
                  <span style={{fontSize:12,color:visual.color}}>▶</span>
                </button>
              );
            })}
          </div>

          <div style={{height:1,background:"#eee",margin:"8px 20px"}} />

          {/* 3. Ana navigasyon — en altta */}
          {[
            {l:t("home"),p:"home",icon:"🏠"},
            {l:t("products"),p:"products",icon:"📦"},
            {l:t("brands"),p:"brands",icon:"🏷"},
            {l:t("about"),p:"about",icon:"ℹ️"},
            {l:t("contact"),p:"contact",icon:"📞"},
            {l:t("faq"),p:"faq",icon:"❓"},
          ].map((n,i) => (
            <button key={i} onClick={() => {go(n.p);setMobileMenuOpen(false)}}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",background:"none",border:"none",fontSize:15,color:"#333",cursor:"pointer",textAlign:"left"}}>
              <span>{n.icon}</span>{n.l}
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}

// ===== MOBILE FILTER DRAWER =====
function MobileFilterDrawer() {
  const {setMobileFilterOpen, t} = use$();
  // This is a placeholder - the actual filter logic is in ProductsPage
  // This drawer is triggered from ProductsPage's mobile filter button
  return null; // Filters are rendered inline in ProductsPage for mobile
}

// ===== IMAGE GALLERY =====
function ImageGallery({images, discount}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[active] || SITE_IMAGES.missingProduct;

  return (
    <div>
      <div onClick={() => setZoomed(true)}
        style={{background:"radial-gradient(circle at 70% 12%, rgba(255,96,0,.24), transparent 31%), linear-gradient(145deg,#0b1020,#171d2c 62%,#222835)",borderRadius:8,height:400,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(15,23,42,.1)",position:"relative",cursor:"zoom-in",overflow:"hidden",boxShadow:"0 18px 50px rgba(15,23,42,.12)"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,.12),transparent 35%,rgba(14,165,233,.14))",pointerEvents:"none"}} />
        <img src={cdnImg(current,600)} srcSet={cdnSrcSet(current,600)} sizes="(max-width: 768px) 90vw, 600px" alt="" fetchpriority="high" decoding="async" style={{maxWidth:"86%",maxHeight:"86%",objectFit:"contain",transition:"transform .3s",filter:"drop-shadow(0 22px 26px rgba(0,0,0,.38))"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
        {discount > 0 && <span style={{position:"absolute",top:16,left:16,background:"linear-gradient(135deg,#ff6000,#facc15)",color:"#111",fontSize:14,fontWeight:900,padding:"6px 14px",borderRadius:6}}>%{discount}</span>}
        <div style={{position:"absolute",bottom:12,right:12,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.18)",color:"#fff",padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:800}}>Buyutmek icin tiklayin</div>
      </div>

      {images.length > 1 && (
        <div style={{display:"flex",gap:8,marginTop:10,overflowX:"auto",paddingBottom:4}}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{width:72,height:72,borderRadius:6,border:`2px solid ${active===i?"#ff6000":"#e2e8f0"}`,background:"#101624",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"border-color .2s",overflow:"hidden"}}>
              <img src={cdnImg(img,100)} alt="" loading="lazy" decoding="async" width={72} height={72} style={{maxWidth:"88%",maxHeight:"88%",objectFit:"contain"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
            </div>
          ))}
        </div>
      )}

      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",animation:"fadeIn .2s"}}>
          <button onClick={() => setZoomed(false)} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,.2)",border:"none",color:"#fff",fontSize:24,width:40,height:40,borderRadius:"50%",cursor:"pointer"}}>x</button>
          {images.length > 1 && <>
            <button onClick={e => {e.stopPropagation();setActive((active-1+images.length)%images.length)}}
              style={{position:"absolute",left:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:48,height:48,borderRadius:"50%",cursor:"pointer"}}>{"<"}</button>
            <button onClick={e => {e.stopPropagation();setActive((active+1)%images.length)}}
              style={{position:"absolute",right:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:48,height:48,borderRadius:"50%",cursor:"pointer"}}>{">"}</button>
          </>}
          <img src={cdnImg(current,1200)} alt="" style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain",filter:"drop-shadow(0 24px 42px rgba(0,0,0,.5))"}} onError={e=>{e.target.src=SITE_IMAGES.missingProduct}}/>
        </div>
      )}
    </div>
  );
}

function ImageGalleryLegacy({images, discount}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div>
      {/* Main image */}
      <div onClick={() => setZoomed(true)}
        style={{background:"#f9f9f9",borderRadius:8,height:400,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #eee",position:"relative",cursor:"zoom-in",overflow:"hidden"}}>
        <img src={cdnImg(images[active],600)} srcSet={cdnSrcSet(images[active],600)} sizes="(max-width: 768px) 90vw, 600px" alt="" fetchpriority="high" decoding="async" style={{maxWidth:"80%",maxHeight:"80%",objectFit:"contain",transition:"transform .3s"}} onError={e=>{e.target.style.display="none"}}/>
        {discount > 0 && <span style={{position:"absolute",top:16,left:16,background:"#ff6000",color:"#fff",fontSize:14,fontWeight:700,padding:"6px 14px",borderRadius:6}}>%{discount}</span>}
        <div style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.5)",color:"#fff",padding:"4px 10px",borderRadius:4,fontSize:11}}>🔍 Büyütmek için tıklayın</div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{display:"flex",gap:8,marginTop:10,overflowX:"auto",paddingBottom:4}}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{width:72,height:72,borderRadius:6,border:`2px solid ${active===i?"#ff6000":"#eee"}`,background:"#f9f9f9",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"border-color .2s"}}>
              <img src={cdnImg(img,100)} alt="" loading="lazy" decoding="async" width={72} height={72} style={{maxWidth:"85%",maxHeight:"85%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
            </div>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",animation:"fadeIn .2s"}}>
          <button onClick={() => setZoomed(false)} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,.2)",border:"none",color:"#fff",fontSize:24,width:40,height:40,borderRadius:"50%",cursor:"pointer"}}>✕</button>
          {/* Prev/Next */}
          {images.length > 1 && <>
            <button onClick={e => {e.stopPropagation();setActive((active-1+images.length)%images.length)}}
              style={{position:"absolute",left:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:48,height:48,borderRadius:"50%",cursor:"pointer"}}>‹</button>
            <button onClick={e => {e.stopPropagation();setActive((active+1)%images.length)}}
              style={{position:"absolute",right:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:48,height:48,borderRadius:"50%",cursor:"pointer"}}>›</button>
          </>}
          <img src={cdnImg(images[active],1200)} alt="" style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
          {/* Dots */}
          {images.length > 1 && <div style={{position:"absolute",bottom:24,display:"flex",gap:8}}>
            {images.map((_,i) => <div key={i} onClick={e=>{e.stopPropagation();setActive(i)}} style={{width:10,height:10,borderRadius:"50%",background:active===i?"#ff6000":"rgba(255,255,255,.4)",cursor:"pointer"}}/>)}
          </div>}
        </div>
      )}
    </div>
  );
}

// ===== LIVE CHAT WIDGET =====
function ChatWidget() {
  const {chatOpen, setChatOpen, chatMessages, setChatMessages, page, params, products, isMobile} = use$();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [supportActive, setSupportActive] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);
  const pollRef = useRef(null);
  const lastAdminMessageRef = useRef("");

  // Session ID oluştur/al
  useEffect(() => {
    let sid = localStorage.getItem("frenciniz_chat_session");
    if (!sid) {
      sid = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem("frenciniz_chat_session", sid);
    }
    sessionIdRef.current = sid;
  }, []);

  const currentProduct = page === "product"
    ? (params?.product || products.find(item => String(item.id) === String(params?.id)))
    : null;
  const supportMeta = () => {
    let source = new URLSearchParams(window.location.search).get("utm_source") || "";
    if (!source && document.referrer) {
      try { source = new URL(document.referrer).hostname.replace(/^www\./, ""); } catch {}
    }
    return {
      sessionId: sessionIdRef.current,
      path: window.location.pathname || "/",
      pageTitle: document.title || "Frenciniz",
      productId: currentProduct?.id || "",
      productName: currentProduct?.name || "",
      source: source || "direct",
    };
  };

  // Gerçek ilgi sinyali: ürün sayfasında 15 sn, diğer sayfalarda 25 sn kalan ziyaretçi.
  useEffect(() => {
    const timer = setTimeout(() => {
      const meta = supportMeta();
      if (!meta.sessionId) return;
      fetch("/api/chat/presence", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(meta),
        keepalive:true,
      }).then(()=>setSupportActive(true)).catch(()=>{});
      if (!chatOpen) setInviteVisible(true);
    }, page === "product" ? 15000 : 25000);
    return () => clearTimeout(timer);
  }, [page, params?.id]);

  // Admin cevaplarını poll et
  useEffect(() => {
    if (!chatOpen && !supportActive) return;
    const poll = async () => {
      try {
        const sid = sessionIdRef.current;
        if (!sid) return;
        const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages.map(m => ({...m, time: m.time || new Date().toISOString()})));
          const supportMessages = data.messages.filter(m=>m.from==="admin" || m.from==="bot");
          const latestSupport = supportMessages[supportMessages.length-1];
          if (latestSupport) {
            const supportKey = `${latestSupport.time||""}|${latestSupport.text||""}`;
            let seenKey = lastAdminMessageRef.current;
            try {
              seenKey = seenKey
                || localStorage.getItem(`frenciniz_chat_support_seen:${sid}`)
                || localStorage.getItem(`frenciniz_chat_admin_seen:${sid}`)
                || "";
            } catch {}
            if (supportKey && supportKey !== seenKey) {
              lastAdminMessageRef.current = supportKey;
              try { localStorage.setItem(`frenciniz_chat_support_seen:${sid}`, supportKey); } catch {}
              setInviteVisible(false);
              setChatOpen(true);
            }
          }
        }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [chatOpen, supportActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    const userMsg = {from:"user", text, time:new Date().toISOString()};
    setChatMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setSupportActive(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...supportMeta(), message: text, from: "user"})
      });
      const data = await res.json();
      if (data.botReply) {
        setChatMessages(prev => [...prev, data.botReply]);
      }
    } catch {
      setChatMessages(prev => [...prev, {from:"bot", text:"Bağlantı hatası. Lütfen tekrar deneyin veya WhatsApp'tan ulaşın: 0850 888 7881", time:new Date().toISOString()}]);
    }
    setTyping(false);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
  };

  return <>
    {inviteVisible && !chatOpen && <div style={{position:"fixed",bottom:isMobile?150:164,right:isMobile?12:24,zIndex:999,width:isMobile?"calc(100vw - 88px)":300,maxWidth:300,padding:"13px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 12px 34px rgba(15,23,42,.2)"}}>
      <button onClick={()=>setInviteVisible(false)} aria-label="Canlı destek davetini kapat" style={{position:"absolute",top:5,right:7,border:"none",background:"transparent",color:"#94a3b8",fontSize:16}}>×</button>
      <div style={{fontSize:13,fontWeight:900,color:"#111827",paddingRight:14}}>Canlı destek buradayız 👋</div>
      <div style={{fontSize:11,color:"#64748b",lineHeight:1.45,marginTop:4}}>Parça kodunu veya araç bilgilerini yazın, doğru ürünü birlikte bulalım.</div>
      <button onClick={()=>{setInviteVisible(false);setChatOpen(true)}} style={{marginTop:9,minHeight:36,width:"100%",border:"none",borderRadius:8,background:"#ff6000",color:"#fff",fontSize:12,fontWeight:900}}>Canlı desteği aç</button>
    </div>}
    {/* Toggle button */}
    <button onClick={() => {setInviteVisible(false);setChatOpen(!chatOpen)}} aria-label={chatOpen?"Canlı desteği kapat":"Canlı desteği aç"}
      style={{position:"fixed",bottom:isMobile?86:96,right:isMobile?14:24,zIndex:1000,width:56,height:56,borderRadius:"50%",background:chatOpen?"#333":"#ff6000",color:"#fff",border:"none",boxShadow:"0 4px 16px rgba(0,0,0,.2)",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background .2s"}}>
      {chatOpen ? "✕" : "💬"}
    </button>

    {/* Chat window */}
    {chatOpen && (
      <div style={{position:"fixed",bottom:isMobile?154:164,right:isMobile?12:24,zIndex:1000,width:isMobile?"calc(100vw - 24px)":360,height:isMobile?"min(520px, calc(100vh - 180px))":460,background:"#fff",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,.15)",display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideUp .3s ease",border:"1px solid #e0e0e0"}}>
        {/* Header */}
        <div style={{padding:"14px 18px",background:"#ff6000",color:"#fff",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎧</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Frenciniz Destek</div>
            <div style={{fontSize:11,opacity:.85,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#4caf50"}}/>Çevrimiçi
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,background:"#f9f9f9"}}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{display:"flex",justifyContent:msg.from==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:msg.from==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:msg.from==="user"?"#ff6000":msg.from==="admin"?"#1a73e8":"#fff",color:msg.from==="user"||msg.from==="admin"?"#fff":"#333",fontSize:13,lineHeight:1.5,boxShadow:msg.from==="bot"?"0 1px 3px rgba(0,0,0,.06)":"none",whiteSpace:"pre-line",wordBreak:"break-word"}}>
                {formatChatText(msg.text)}
                <div style={{fontSize:10,opacity:.6,marginTop:4,textAlign:"right"}}>{formatTime(msg.time)}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{display:"flex",justifyContent:"flex-start"}}>
              <div style={{padding:"10px 18px",borderRadius:12,background:"#fff",fontSize:14,color:"#999",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
                <span style={{animation:"fadeIn .5s infinite alternate"}}>●</span>
                <span style={{animation:"fadeIn .5s infinite alternate .2s"}}> ●</span>
                <span style={{animation:"fadeIn .5s infinite alternate .4s"}}> ●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div style={{padding:"10px 12px",borderTop:"1px solid #eee",display:"flex",gap:8,background:"#fff"}}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()}
            placeholder="Mesajınızı yazın..."
            style={{flex:1,padding:"10px 14px",border:"1px solid #e0e0e0",borderRadius:8,fontSize:13,outline:"none"}} />
          <button onClick={sendMessage}
            style={{padding:"10px 16px",background:"#ff6000",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>
            ➤
          </button>
        </div>
      </div>
    )}
  </>;
}

// ===== STOCK ALERT INLINE FORM =====
function StockAlertInline({productId, onClose}) {
  const {addStockAlert} = use$();
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!contact.trim()) return;
    addStockAlert(productId, contact);
    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  return (
    <div onClick={e => e.stopPropagation()} style={{padding:"12px 14px",borderTop:"1px solid #f0f0f0",background:"#fffbf0",animation:"fadeIn .2s"}}>
      {submitted ? (
        <div style={{fontSize:13,color:"#4caf50",fontWeight:600,textAlign:"center",padding:"4px 0"}}>
          ✓ Stok gelince bildirim alacaksınız!
        </div>
      ) : (
        <>
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>Stok gelince haber verelim:</div>
          <div style={{display:"flex",gap:6}}>
            <input value={contact} onChange={e => setContact(e.target.value)}
              placeholder="E-posta veya telefon"
              onClick={e => e.stopPropagation()}
              style={{flex:1,padding:"7px 10px",border:"1px solid #ddd",borderRadius:4,fontSize:12,outline:"none"}} />
            <button onClick={handleSubmit}
              style={{padding:"7px 12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
              Bildir
            </button>
            <button onClick={onClose}
              style={{padding:"7px 8px",background:"none",border:"1px solid #ddd",borderRadius:4,fontSize:12,color:"#999",cursor:"pointer"}}>✕</button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════

function AdminLoginPage() {
  const {go, setAdmin, setUser} = use$();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(()=>{
    fetch("/api/auth/me",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d?.user?.role==="admin"){setAdmin(true); setUser(d.user); go("admin");}
    }).catch(()=>{});
  },[]);
  async function handleLogin(){
    setErr(""); setBusy(true);
    try{
      const r=await fetch("/api/auth/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({emailOrPhone:email,password:pw})});
      const d=await r.json();
      if(!r.ok||!d.success) throw new Error(d.error||"Giriş başarısız");
      if(d.user?.role!=="admin"){
        await fetch("/api/auth/logout",{method:"POST",credentials:"include"}).catch(()=>{});
        throw new Error("Bu hesap admin yetkisine sahip değil");
      }
      setUser(d.user); setAdmin(true); go("admin");
    }catch(e){ setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="admin-login-shell" style={{maxWidth:380,margin:"60px auto",padding:"0 20px"}}>
      <div className="admin-login-card" style={{border:"1px solid #eee",borderRadius:8,padding:32,textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:800,color:"#ff6000",marginBottom:4}}>frenciniz</div>
        <div style={{fontSize:13,color:"#999",marginBottom:24}}>Yönetim Paneli Girişi</div>
        <input value={email} onChange={e=>{setEmail(e.target.value);setErr("")}} type="text" placeholder="E-posta veya telefon"
          style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#e53935":"#ddd"}`,borderRadius:6,fontSize:14,marginBottom:12,outline:"none"}}/>
        <input value={pw} onChange={e=>{setPw(e.target.value);setErr("")}} type="password" placeholder="Şifre"
          onKeyDown={e=>{if(e.key==="Enter")handleLogin()}}
          style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#e53935":"#ddd"}`,borderRadius:6,fontSize:14,marginBottom:12,outline:"none"}}/>
        {err&&<div style={{fontSize:12,color:"#e53935",marginBottom:8}}>{err}</div>}
        <button disabled={busy} onClick={handleLogin}
          style={{width:"100%",padding:"12px",background:busy?"#ffa06a":"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:busy?"not-allowed":"pointer"}}>{busy?"...":"Giriş Yap"}</button>
      </div>
    </div>
  );
}

function AdminPanel() {
  const {go, admin, setAdmin, stockAlerts, authChecked} = use$();
  const [tab, setTab] = useState(()=>new URLSearchParams(window.location.search).get("adminTab")||"dashboard");
  // Auth check tamamlanmadan yönlendirme yapma — refresh sırasında session yüklenirken bekle
  if (!authChecked) return <div style={{padding:60,textAlign:"center",color:"#888"}}>Yetkilendirme kontrol ediliyor…</div>;
  if(!admin) { go("admin-login"); return null; }

  const menu = [
    {id:"dashboard",label:"Dashboard",icon:"📊"},{id:"sales-chart",label:"Satış Grafikleri",icon:"📈"},
    {id:"products",label:"Ürünler",icon:"📦"},{id:"categories",label:"Kategoriler",icon:"🗂"},
    {id:"traffic",label:"Site Trafiği",icon:"📈"},
    {id:"digital-marketing",label:"Dijital Pazarlama",icon:"📣"},
    {id:"orders",label:"Siparişler",icon:"🛒"},{id:"returns",label:"İade Talepleri",icon:"↩️"},
    {id:"customers",label:"Müşteriler",icon:"👥"},{id:"coupons",label:"Kuponlar",icon:"🎟"},
    {id:"stock-alerts",label:"Stok Alarmları",icon:"🔔"},{id:"low-stock",label:"Düşük Stok",icon:"⚠️"},
    {id:"pricing",label:"Toplu Fiyat",icon:"💰"},{id:"import",label:"XML / Excel",icon:"📥"},
    {id:"trendyol",label:"Trendyol",icon:"TY"},
    {id:"banners",label:"Bannerlar",icon:"🖼"},{id:"pages",label:"Sayfalar",icon:"📄"},
    {id:"seo",label:"SEO Ayarları",icon:"🔍"},{id:"payment",label:"Ödeme Ayarları",icon:"💳"},
    {id:"email",label:"Mail Ayarları",icon:"✉️"},
    {id:"sms",label:"NetGSM",icon:"📱"},{id:"campaign",label:"Kampanya SMS",icon:"📢"},{id:"email-templates",label:"Mail Şablonları",icon:"📨"},
    {id:"chat-history",label:"Chat Geçmişi",icon:"💬"},{id:"revenue",label:"Gelir/Gider",icon:"📉"},
    {id:"admin-users",label:"Admin Yönetimi",icon:"🔐"},{id:"settings",label:"Site Ayarları",icon:"⚙️"},
    {id:"activity",label:"Aktivite Logu",icon:"📋"},{id:"backup",label:"Yedekleme",icon:"💾"},
  ];

  return (
    <div data-admin-panel className="admin-shell" style={{display:"flex",minHeight:"80vh",background:"#f5f5f5"}}>
      <div className="admin-sidebar" style={{width:220,background:"#1a1a1a",padding:"20px 0",flexShrink:0}}>
        <div className="admin-brand" style={{padding:"0 16px 16px",borderBottom:"1px solid #333"}}>
          <div className="admin-brand-title" style={{fontSize:18,fontWeight:800,color:"#ff6000"}}>frenciniz</div>
          <div style={{fontSize:10,color:"#666"}}>Admin Panel</div>
        </div>
        <div className="admin-menu" style={{padding:"12px 8px"}}>
          {menu.map(m=>(
            <button key={m.id} className={tab===m.id?"admin-tab-active":""} onClick={()=>setTab(m.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",border:"none",borderRadius:6,background:tab===m.id?"#333":"transparent",color:tab===m.id?"#fff":"#888",fontSize:13,fontWeight:tab===m.id?600:400,cursor:"pointer",textAlign:"left",marginBottom:2,fontFamily:"inherit"}}>
              <span style={{fontSize:14}}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
        <select className="admin-mobile-tab-select" value={tab} onChange={e=>setTab(e.target.value)} aria-label="Yönetim bölümü seç">
          {menu.map(m=><option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
        </select>
        <div className="admin-sidebar-footer" style={{padding:"12px 16px",borderTop:"1px solid #333",marginTop:8}}>
          <button onClick={async()=>{try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{};setAdmin(false);go("admin-login")}} style={{width:"100%",padding:"8px",background:"#333",color:"#999",border:"none",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Çıkış Yap</button>
        </div>
      </div>
      <div className="admin-content" style={{flex:1,padding:24,overflowY:"auto"}}>
        {tab==="dashboard"&&<ADash/>}
        {tab==="sales-chart"&&<ASalesChart/>}
        {tab==="products"&&<AProds/>}
        {tab==="categories"&&<ACats/>}
        {tab==="orders"&&<AOrds/>}
        {tab==="returns"&&<AReturns/>}
        {tab==="customers"&&<ACusts/>}
        {tab==="coupons"&&<ACoups/>}
        {tab==="stock-alerts"&&<AStocks/>}
        {tab==="low-stock"&&<ALowStock/>}
        {tab==="pricing"&&<APrice/>}
        {tab==="import"&&<AImport/>}
        {tab==="trendyol"&&<ATrendyol/>}
        {tab==="banners"&&<ABanners/>}
        {tab==="pages"&&<APagesAdmin/>}
        {tab==="seo"&&<ASeo/>}
        {tab==="payment"&&<APaymentCfg/>}
        {tab==="email"&&<AEmailCfg/>}
        {tab==="sms"&&<ASMSCfg/>}
        {tab==="campaign"&&<ACampaign/>}
        {tab==="traffic"&&<ATraffic/>}
        {tab==="digital-marketing"&&<ADigitalMarketing/>}
        {tab==="email-templates"&&<AEmailTemplates/>}
        {tab==="chat-history"&&<AChatHistory/>}
        {tab==="revenue"&&<ARevenue/>}
        {tab==="admin-users"&&<AAdminUsers/>}
        {tab==="settings"&&<ASettingsCfg/>}
        {tab==="activity"&&<AActivityLog/>}
        {tab==="backup"&&<ABackupCfg/>}
      </div>
    </div>
  );
}

const ACard=({title,children,action})=>(<div className="admin-card" style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,marginBottom:16}}><div className="admin-card-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f0f0f0"}}><h2 style={{fontSize:16,fontWeight:700}}>{title}</h2>{action&&<div className="admin-card-action">{action}</div>}</div><div className="admin-card-body" style={{padding:20}}>{children}</div></div>);
const ABtn=({children,color,className="",...p})=><button {...p} className={`admin-button ${className}`.trim()} style={{padding:"8px 18px",background:color||"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",...(p.style||{})}}>{children}</button>;
const AIn=({className="",...p})=><input {...p} className={`admin-input ${className}`.trim()} style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,fontFamily:"inherit",...(p.style||{})}}/>;

function ADash(){
  const [stats,setStats]=useState(null);
  const [recent,setRecent]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  useEffect(()=>{
    (async()=>{
      try{
        const [s,o]=await Promise.all([
          fetch("/api/admin/dashboard",{credentials:"include"}).then(r=>r.json()),
          fetch("/api/admin/orders",{credentials:"include"}).then(r=>r.json()),
        ]);
        if(s.error) throw new Error(s.error);
        setStats(s.stats);
        setRecent((o.orders||[]).slice(0,6));
      }catch(e){setErr(e.message||"Yüklenemedi")}
      finally{setLoading(false)}
    })();
  },[]);
  const sc={"Hazırlanıyor":{bg:"#fef3c7",c:"#b45309"},"Kargoda":{bg:"#dbeafe",c:"#2563eb"},"Teslim Edildi":{bg:"#dcfce7",c:"#059669"},"İptal":{bg:"#fee2e2",c:"#dc2626"}};
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  if(err) return <div style={{padding:20,color:"#dc2626"}}>⚠ {err}</div>;
  const cards=[
    {n:`₺${(stats?.totalRevenue||0).toLocaleString("tr-TR")}`,l:"Toplam Satış",c:"#ff6000",i:"💰"},
    {n:String(stats?.paidOrders||0),l:"Ödenmiş Sipariş",c:"#2563eb",i:"🛒"},
    {n:String(stats?.totalCustomers||0),l:"Müşteri",c:"#059669",i:"👥"},
    {n:String(stats?.productsCount||0),l:"Ürün",c:"#7c3aed",i:"📦"},
  ];
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Dashboard</h1>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {cards.map((s,i)=>(
        <div key={i} style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.n}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>{s.l}</div></div>
            <span style={{fontSize:28}}>{s.i}</span></div></div>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <ACard title="Son Siparişler">
        {recent.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz sipariş yok.</div>:recent.map((o,i)=>{
          const st=o.fulfillmentStatus||"Hazırlanıyor";
          return <div key={o.orderRef||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<recent.length-1?"1px solid #f0f0f0":"none"}}>
            <div><div style={{fontSize:13,fontWeight:600,fontFamily:"monospace"}}>{o.orderRef}</div><div style={{fontSize:11,color:"#999"}}>{o.customerName||o.buyer?.name||"—"}</div></div>
            <span style={{fontSize:14,fontWeight:600}}>₺{Number(o.amount||0).toLocaleString("tr-TR")}</span>
            <span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:sc[st]?.bg||"#f5f5f5",color:sc[st]?.c||"#666"}}>{st}</span>
          </div>;
        })}
      </ACard>
      <ACard title="Popüler Ürünler">
        {[...PRODUCTS].sort((a,b)=>(b.reviews||0)-(a.reviews||0)).slice(0,5).map((p,i)=>(
          <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<4?"1px solid #f0f0f0":"none"}}>
            <span style={{fontSize:13}}>{p.name}</span><span style={{fontSize:12,color:"#999"}}>{p.reviews||0}</span></div>))}
      </ACard>
    </div></>;
}

function AProds(){
  const {products:ctxProds} = use$();
  const [prods,setProds]=useState(()=>ctxProds||PRODUCTS||[]);
  useEffect(()=>{if(ctxProds && ctxProds.length>0) setProds(ctxProds)},[ctxProds]);
  const [editId,setEditId]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",brand:"",sku:"",oem:"",price:"",stock:"",cat:"disk",desc:""});
  const [bulkSel,setBulkSel]=useState([]);
  const toggleBulk=(id)=>setBulkSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const save=()=>{if(editId){setProds(p=>p.map(x=>x.id===editId?{...x,...form,price:Number(form.price),stock:Number(form.stock)}:x));setEditId(null)}else{setProds(p=>[...p,{...form,id:Date.now(),price:Number(form.price),stock:Number(form.stock),old:null,rating:0,reviews:0,veh:["kamyon"],img:"https://placehold.co/400x400/1c1c1c/b0b0b0?text=YEN%C4%B0&font=montserrat",specs:{},compat:[]}]);setShowAdd(false)}setForm({name:"",brand:"",sku:"",oem:"",price:"",stock:"",cat:"disk",desc:""})};
  return <><ACard title={`Ürünler (${prods.length})`} action={<div style={{display:"flex",gap:8}}>{bulkSel.length>0&&<><ABtn color="#e53935" onClick={()=>{setProds(p=>p.filter(x=>!bulkSel.includes(x.id)));setBulkSel([])}}>🗑 Seçilenleri Sil ({bulkSel.length})</ABtn><ABtn color="#999" onClick={()=>setBulkSel([])}>İptal</ABtn></>}<ABtn onClick={()=>{setShowAdd(!showAdd);setEditId(null);setForm({name:"",brand:"",sku:"",oem:"",price:"",stock:"",cat:"disk",desc:""})}}>+ Ürün Ekle</ABtn></div>}>
    {(showAdd||editId)&&<div style={{background:"#fafafa",borderRadius:8,padding:16,marginBottom:16,border:"1px solid #eee"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{editId?"Düzenle":"Yeni Ürün"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <AIn placeholder="Ürün Adı" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <AIn placeholder="Marka" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/>
        <AIn placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
        <AIn placeholder="OEM" value={form.oem} onChange={e=>setForm({...form,oem:e.target.value})}/>
        <AIn placeholder="Fiyat (₺)" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
        <AIn placeholder="Stok" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
        <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} style={{padding:"9px",border:"1px solid #ddd",borderRadius:6,fontSize:13}}>{CATS.filter(c=>c.id!=="all"&&!c.isGroup).map(c=><option key={c.id} value={c.id}>{(c.parent?CATS.find(g=>g.id===c.parent)?.name+" > ":"") + c.name}</option>)}</select>
        <AIn placeholder="Açıklama" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/>
      </div>
      {/* Görsel Yükleme */}
      <div style={{marginTop:12,padding:14,border:"2px dashed #ddd",borderRadius:8,background:"#fff",textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:4}}>🖼</div>
        <div style={{fontSize:12,fontWeight:600,color:"#666"}}>Ürün Görselleri</div>
        <div style={{fontSize:11,color:"#999",marginBottom:8}}>Sürükle-bırak veya tıklayarak görsel ekleyin (max 5 adet)</div>
        <button style={{padding:"6px 16px",border:"1px solid #ddd",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer",color:"#555"}}>Dosya Seç</button>
      </div>
      {/* Varyantlar */}
      <div style={{marginTop:12,padding:14,border:"1px solid #eee",borderRadius:8,background:"#fff"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Ürün Varyantları</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
          <div><label style={{fontSize:11,color:"#888"}}>Varyant Tipi</label><AIn placeholder="Örn: Boyut, Tip"/></div>
          <div><label style={{fontSize:11,color:"#888"}}>Değer</label><AIn placeholder="Örn: 220mm, Sol"/></div>
          <div><label style={{fontSize:11,color:"#888"}}>Fiyat Farkı</label><AIn placeholder="₺0" type="number"/></div>
          <button style={{padding:"8px 14px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",height:36}}>+</button>
        </div>
        <div style={{fontSize:11,color:"#999",marginTop:6}}>Örnek: Boyut → 220mm, 250mm | Tip → Sol, Sağ</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}><ABtn onClick={save}>{editId?"Güncelle":"Ekle"}</ABtn><ABtn color="#999" onClick={()=>{setShowAdd(false);setEditId(null)}}>İptal</ABtn></div>
    </div>}
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}><th style={{padding:"8px",width:30}}><input type="checkbox" onChange={e=>{if(e.target.checked)setBulkSel(prods.map(p=>p.id));else setBulkSel([])}} checked={bulkSel.length===prods.length&&prods.length>0} style={{accentColor:"#ff6000"}}/></th>{["Ürün","Marka","SKU","Fiyat","Stok","İşlem"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{prods.map(p=><tr key={p.id} style={{borderBottom:"1px solid #f0f0f0",background:bulkSel.includes(p.id)?"#fff5f0":"transparent"}}>
        <td style={{padding:"10px",width:30}}><input type="checkbox" checked={bulkSel.includes(p.id)} onChange={()=>toggleBulk(p.id)} style={{accentColor:"#ff6000"}}/></td>
        <td style={{padding:"10px",fontWeight:600}}>{p.name}</td>
        <td style={{padding:"10px",color:"#ff6000"}}>{p.brand}</td>
        <td style={{padding:"10px",fontFamily:"monospace",fontSize:12,color:"#888"}}>{p.sku}</td>
        <td style={{padding:"10px",fontWeight:600}}>₺{p.price?.toLocaleString("tr-TR")}</td>
        <td style={{padding:"10px"}}><span style={{color:p.stock>0?"#059669":"#e53935",fontWeight:600}}>{p.stock||0}</span></td>
        <td style={{padding:"10px"}}><div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setEditId(p.id);setShowAdd(false);setForm({name:p.name,brand:p.brand,sku:p.sku,oem:p.oem||"",price:String(p.price),stock:String(p.stock),cat:p.cat,desc:p.desc||""})}} style={{padding:"4px 10px",border:"1px solid #ddd",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer"}}>Düzenle</button>
          <button onClick={()=>setProds(pr=>pr.filter(x=>x.id!==p.id))} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer",color:"#e53935"}}>Sil</button>
        </div></td></tr>)}</tbody>
    </table></ACard></>;
}

function ACats(){
  const {cats:ctxCats, products:ctxProds} = use$();
  const [cats,setCats]=useState(()=>(ctxCats||CATS).filter(c=>c.id!=="all"));
  useEffect(()=>{if(ctxCats && ctxCats.length>1) setCats(ctxCats.filter(c=>c.id!=="all"))},[ctxCats]);
  const [n,setN]=useState("");
  const groups = cats.filter(c=>c.isGroup);
  const subs = (gid) => cats.filter(c=>c.parent===gid);
  const ungrouped = cats.filter(c=>!c.isGroup && !c.parent);
  return <ACard title={`Kategoriler (${cats.filter(c=>!c.isGroup).length})`} action={<div style={{display:"flex",gap:6}}><AIn placeholder="Yeni kategori" value={n} onChange={e=>setN(e.target.value)} style={{width:200}}/><ABtn onClick={()=>{if(n.trim()){setCats(p=>[...p,{id:n.toLowerCase().replace(/\s/g,"-"),name:n}]);setN("")}}}>Ekle</ABtn></div>}>
    {groups.map(g=><div key={g.id} style={{marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:700,color:"#ff6000",padding:"8px 0",borderBottom:"1px solid #eee"}}>{g.name} ({subs(g.id).length})</div>
      {subs(g.id).map((c,i)=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 8px 16px",borderBottom:"1px solid #f8f8f8"}}>
        <span style={{fontSize:13}}>{c.name}</span>
        <span style={{fontSize:11,color:"#999"}}>{(ctxProds||PRODUCTS).filter(p=>p.cat===c.id).length} ürün</span>
      </div>)}
    </div>)}
    {ungrouped.length>0 && ungrouped.map((c,i)=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>
      <span style={{fontSize:13}}>{c.name}</span>
      <span style={{fontSize:11,color:"#999"}}>{(ctxProds||PRODUCTS).filter(p=>p.cat===c.id).length} ürün</span>
    </div>)}
  </ACard>;
}

function AOrds(){
  const statuses=["Hazırlanıyor","Kargoda","Teslim Edildi","İptal"];
  const sc={"Hazırlanıyor":{bg:"#fef3c7",c:"#b45309"},"Kargoda":{bg:"#dbeafe",c:"#2563eb"},"Teslim Edildi":{bg:"#dcfce7",c:"#059669"},"İptal":{bg:"#fee2e2",c:"#dc2626"}};
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [openRef,setOpenRef]=useState(null);
  const [shipping,setShipping]=useState({});
  useEffect(()=>{
    fetch("/api/admin/orders",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.error) setErr(d.error); else setOrders(d.orders||[]);
    }).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[]);
  async function updateStatus(orderRef,status,extra={}){
    setOrders(p=>p.map(x=>x.orderRef===orderRef?{...x,fulfillmentStatus:status,...extra}:x));
    try{
      const r=await fetch("/api/admin/orders",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderRef,status,...extra})});
      const d=await r.json();
      if(!r.ok||d.error) throw new Error(d.error||"Sipariş güncellenemedi");
    }catch(e){setErr(e.message||"Sipariş güncellenemedi")}
  }
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  if(err) return <div style={{padding:20,color:"#dc2626"}}>⚠ {err}</div>;
  return <ACard title={`Siparişler (${orders.length})`}>
    {orders.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz sipariş yok.</div>:
    <div style={{display:"flex",flexDirection:"column",gap:10}}>{orders.map(o=>{
        const st=o.fulfillmentStatus||"Hazırlanıyor";
        const dt=o.paidAt||o.createdAt;
        const d=dt?new Date(dt).toLocaleString("tr-TR"):"—";
        const buyer=o.buyer||{};
        const billing=o.billingAddress||{};
        const items=o.basket?.basketItems||o.items||[];
        const isOpen=openRef===o.orderRef;
        const ship=shipping[o.orderRef]||{cargoFirma:o.cargoFirma||"",trackingNo:o.trackingNo||""};
        const fullName=[buyer.name,buyer.surName].filter(Boolean).join(" ").trim()||o.customerName||billing.contactName||"—";
        return <div key={o.orderRef} style={{border:"1px solid #e5e7eb",borderRadius:9,background:"#fff",overflow:"hidden"}}>
          <button onClick={()=>setOpenRef(isOpen?null:o.orderRef)} style={{width:"100%",border:"none",background:isOpen?"#fff7ed":"#fff",padding:14,display:"grid",gridTemplateColumns:"minmax(170px,1.2fr) minmax(140px,1fr) 110px 150px 105px",gap:12,alignItems:"center",textAlign:"left"}}>
            <div><div style={{fontWeight:800,fontFamily:"monospace",fontSize:12}}>{o.orderRef}</div><div style={{fontSize:11,color:"#888",marginTop:3}}>{d}</div></div>
            <div><div style={{fontWeight:700}}>{fullName}</div><div style={{fontSize:11,color:"#888"}}>{buyer.phoneNumber||o.customerPhone||billing.phoneNumber||"Telefon yok"}</div></div>
            <div><strong>{items.reduce((sum,item)=>sum+Number(item.numberOfProducts||item.qty||1),0)} adet</strong><div style={{fontSize:11,color:"#888"}}>{items.length} kalem</div></div>
            <div style={{fontWeight:800,color:"#059669"}}>₺{Number(o.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
            <div><span style={{padding:"5px 9px",borderRadius:4,fontSize:11,fontWeight:700,background:sc[st]?.bg||"#f5f5f5",color:sc[st]?.c||"#666"}}>{st}</span><span style={{marginLeft:7,color:"#888"}}>{isOpen?"▲":"▼"}</span></div>
          </button>
          {isOpen&&<div style={{padding:16,borderTop:"1px solid #fed7aa",display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(280px,.75fr)",gap:18}}>
            <div>
              <h3 style={{fontSize:14,marginBottom:9}}>Alınan ürünler</h3>
              {items.map((item,index)=><div key={`${item.itemId||item.sku||index}-${index}`} style={{display:"grid",gridTemplateColumns:"1fr 70px 105px",gap:10,padding:"10px 0",borderBottom:"1px solid #f0f0f0",alignItems:"center"}}>
                <div><div style={{fontWeight:700,fontSize:13}}>{item.name||"Ürün"}</div><div style={{fontSize:11,color:"#888",marginTop:3}}>SKU: {item.sku||"—"}{item.brand?` · ${item.brand}`:""}</div></div>
                <div style={{fontSize:12,fontWeight:700}}>{Number(item.numberOfProducts||item.qty||1)} adet</div>
                <div style={{textAlign:"right",fontSize:12}}>₺{Number(item.totalPrice||(Number(item.unitPrice||item.price||0)*Number(item.numberOfProducts||item.qty||1))).toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
              </div>)}
            </div>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:14}}>
              <h3 style={{fontSize:14,marginBottom:9}}>Teslimat ve kargo</h3>
              <div style={{fontSize:13,lineHeight:1.65,marginBottom:12}}><strong>{billing.contactName||fullName}</strong><br/>{billing.address||buyer.registrationAddress||"Adres belirtilmemiş"}<br/>{[billing.district,billing.city,billing.zipCode,billing.country].filter(Boolean).join(" / ")}<br/><a href={`tel:${buyer.phoneNumber||o.customerPhone||billing.phoneNumber||""}`} style={{color:"#2563eb"}}>{buyer.phoneNumber||o.customerPhone||billing.phoneNumber||"Telefon belirtilmemiş"}</a><br/>{buyer.emailAddress||o.customerMail||billing.emailAddress||"E-posta belirtilmemiş"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <AIn placeholder="Kargo firması" value={ship.cargoFirma} onChange={e=>setShipping(p=>({...p,[o.orderRef]:{...ship,cargoFirma:e.target.value}}))}/>
                <AIn placeholder="Takip numarası" value={ship.trackingNo} onChange={e=>setShipping(p=>({...p,[o.orderRef]:{...ship,trackingNo:e.target.value}}))}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:9,flexWrap:"wrap"}}>
                <select value={st} onChange={e=>updateStatus(o.orderRef,e.target.value)} style={{padding:"8px",border:"1px solid #ddd",borderRadius:6,fontSize:12}}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
                <ABtn onClick={()=>updateStatus(o.orderRef,"Kargoda",ship)}>Kargoya ver ve kaydet</ABtn>
              </div>
            </div>
          </div>}
        </div>;
      })}</div>}</ACard>;
}

function ACusts(){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  useEffect(()=>{
    fetch("/api/admin/customers",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.error) setErr(d.error); else setUsers((d.users||[]).filter(u=>u.role!=="admin"));
    }).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[]);
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  if(err) return <div style={{padding:20,color:"#dc2626"}}>⚠ {err}</div>;
  return <ACard title={`Müşteriler (${users.length})`}>
    {users.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz müşteri yok.</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{["İsim","İletişim","Teslimat adresi","Son sipariş","Sipariş","Toplam"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{users.map(c=><tr key={c.id} style={{borderBottom:"1px solid #f0f0f0"}}>
        <td style={{padding:"10px",fontWeight:600}}>{c.name}<div style={{fontSize:10,color:c.customerType==="guest"?"#b45309":"#059669",marginTop:3}}>{c.customerType==="guest"?"Misafir alışveriş":"Üye"}</div></td>
        <td style={{padding:"10px",color:"#666",fontSize:12}}>{c.email||"—"}<br/>{c.phone||c.lastAddress?.phone||"—"}</td>
        <td style={{padding:"10px",color:"#555",fontSize:12,lineHeight:1.5,maxWidth:320}}>{c.lastAddress?<><strong>{c.lastAddress.contactName||c.name}</strong><br/>{c.lastAddress.address}<br/>{[c.lastAddress.district,c.lastAddress.city,c.lastAddress.zipCode].filter(Boolean).join(" / ")}</>:"Sipariş adresi yok"}</td>
        <td style={{padding:"10px",color:"#888",fontSize:12}}>{c.lastOrderAt?new Date(c.lastOrderAt).toLocaleDateString("tr-TR"):"—"}</td>
        <td style={{padding:"10px",fontWeight:600}}>{c.orderCount||0}</td>
        <td style={{padding:"10px",fontWeight:600,color:"#059669"}}>₺{Number(c.totalSpent||0).toLocaleString("tr-TR")}</td></tr>)}</tbody></table>}</ACard>;
}

function ACoups(){
  const [cs,setCs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);
  const [f,setF]=useState({code:"",disc:"",type:"%",min:""});
  async function load(){
    setLoading(true);
    try{
      const d=await fetch("/api/admin/coupons",{credentials:"include"}).then(r=>r.json());
      setCs(d.coupons||[]);
    }catch{}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);
  async function create(){
    if(!f.code||!f.disc) return;
    await fetch("/api/admin/coupons",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:f.code,discount:Number(f.disc),type:f.type,minOrder:Number(f.min||0),active:true})});
    setShow(false); setF({code:"",disc:"",type:"%",min:""}); load();
  }
  async function toggleActive(c){
    await fetch("/api/admin/coupons",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:c.code,discount:c.discount,type:c.type,minOrder:c.minOrder,active:!c.active})});
    load();
  }
  async function remove(code){
    await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`,{method:"DELETE",credentials:"include"});
    load();
  }
  return <ACard title={`Kuponlar (${cs.length})`} action={<ABtn onClick={()=>setShow(!show)}>+ Yeni Kupon</ABtn>}>
    {show&&<div style={{background:"#fafafa",borderRadius:8,padding:16,marginBottom:16,border:"1px solid #eee"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <AIn placeholder="Kupon Kodu" value={f.code} onChange={e=>setF({...f,code:e.target.value.toUpperCase()})}/>
        <div style={{display:"flex",gap:6}}><AIn placeholder="İndirim" type="number" value={f.disc} onChange={e=>setF({...f,disc:e.target.value})}/><select value={f.type} onChange={e=>setF({...f,type:e.target.value})} style={{padding:"8px",border:"1px solid #ddd",borderRadius:6}}><option>%</option><option>₺</option></select></div>
        <AIn placeholder="Min. Sipariş (₺)" type="number" value={f.min} onChange={e=>setF({...f,min:e.target.value})}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}><ABtn onClick={create}>Oluştur</ABtn><ABtn color="#999" onClick={()=>setShow(false)}>İptal</ABtn></div>
    </div>}
    {loading?<div style={{color:"#999",fontSize:13}}>Yükleniyor…</div>:cs.length===0?<div style={{color:"#999",fontSize:13}}>Henüz kupon yok.</div>:cs.map((c,i)=><div key={c.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<cs.length-1?"1px solid #f0f0f0":"none"}}>
      <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:"#ff6000",background:"#fff5f0",padding:"4px 10px",borderRadius:4}}>{c.code}</span>
      <span style={{fontSize:13,fontWeight:600}}>{c.discount}{c.type}</span>
      <span style={{fontSize:12,color:"#888"}}>Min: ₺{c.minOrder}</span>
      <span style={{fontSize:12,color:"#888"}}>{c.used||0} kull.</span>
      <button onClick={()=>toggleActive(c)} style={{padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:c.active?"#dcfce7":"#fee2e2",color:c.active?"#059669":"#dc2626"}}>{c.active?"Aktif":"Pasif"}</button>
      <button onClick={()=>remove(c.code)} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
    </div>)}</ACard>;
}

function AStocks(){
  const {stockAlerts}=use$();
  return <ACard title={`Stok Alarmları (${stockAlerts.length})`}>
    {stockAlerts.length===0?<div style={{textAlign:"center",padding:"32px",color:"#999"}}>Henüz stok alarmı yok.</div>:
      stockAlerts.map((a,i)=>{const p=PRODUCTS.find(x=>x.id===a.productId);return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<stockAlerts.length-1?"1px solid #f0f0f0":"none"}}>
        <div><div style={{fontSize:13,fontWeight:600}}>{p?.name||"#"+a.productId}</div><div style={{fontSize:12,color:"#999"}}>{a.contact}</div></div>
        <span style={{fontSize:12,color:"#888"}}>{new Date(a.date).toLocaleDateString("tr-TR")}</span></div>})}
  </ACard>;
}

function APrice(){
  const [pct,setPct]=useState("");const [dir,setDir]=useState("up");const [ok,setOk]=useState(false);
  return <ACard title="Toplu Fiyat Güncelleme"><div style={{maxWidth:400}}>
    <p style={{fontSize:13,color:"#888",marginBottom:16}}>Tüm ürünlere toplu yüzdelik artış/azalış uygulayın.</p>
    <div style={{display:"flex",gap:10,marginBottom:12}}>
      <select value={dir} onChange={e=>setDir(e.target.value)} style={{padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13}}><option value="up">Artış ↑</option><option value="down">Azalış ↓</option></select>
      <AIn placeholder="%" type="number" value={pct} onChange={e=>setPct(e.target.value)} style={{width:120}}/>
      <ABtn onClick={()=>{if(pct){setOk(true);setTimeout(()=>setOk(false),2000)}}}>{ok?"✓ Uygulandı":"Uygula"}</ABtn>
    </div>
    {pct&&<div style={{padding:12,background:"#fafafa",borderRadius:6,border:"1px solid #eee",fontSize:13,color:"#666"}}>Tüm ürünlere <strong>%{pct} {dir==="up"?"artış":"azalış"}</strong> uygulanacak.</div>}
  </div></ACard>;
}

function AImport(){
  const [type,setType]=useState("xml");const [ok,setOk]=useState(false);
  return <ACard title="Ürün İçe Aktarma">
    <div style={{display:"flex",gap:12,marginBottom:20}}>
      {["xml","excel"].map(t=><button key={t} onClick={()=>setType(t)} style={{padding:"10px 24px",border:`2px solid ${type===t?"#ff6000":"#ddd"}`,borderRadius:6,background:type===t?"#fff5f0":"#fff",color:type===t?"#ff6000":"#888",fontSize:14,fontWeight:600,cursor:"pointer"}}>{t==="xml"?"📄 XML":"📊 Excel"}</button>)}
    </div>
    <div style={{border:"2px dashed #ddd",borderRadius:8,padding:40,textAlign:"center",background:"#fafafa"}}>
      <div style={{fontSize:36,marginBottom:12}}>{type==="xml"?"📄":"📊"}</div>
      <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{type==="xml"?"XML":"Excel"} dosyanızı yükleyin</div>
      <div style={{fontSize:12,color:"#999",marginBottom:16}}>{type==="xml"?".xml":".xlsx, .xls"} formatında</div>
      <ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),3000)}}>{ok?"✓ Yüklendi":"Dosya Seç"}</ABtn>
    </div>
  </ACard>;
}

function ATrendyol(){
  const [view,setView]=useState("overview");
  const [status,setStatus]=useState(null);
  const [settings,setSettings]=useState(null);
  const [settingsForm,setSettingsForm]=useState({
    commissionRate:"14",stopajRate:"1",adRate:"3",targetProfit:"750",defaultCargoCost:"250",defaultDesi:"5",listPriceMarkup:"10",brandId:"",cargoCompanyId:"",defaultOrigin:"TR"
  });
  const [categoryMapText,setCategoryMapText]=useState("{}");
  const [stockPreview,setStockPreview]=useState(null);
  const [productPreview,setProductPreview]=useState(null);
  const [lookups,setLookups]=useState(null);
  const [attributes,setAttributes]=useState(null);
  const [categoryId,setCategoryId]=useState("");
  const [batchId,setBatchId]=useState("");
  const [batchResult,setBatchResult]=useState(null);
  const [marketplace,setMarketplace]=useState(null);
  const [inventoryPull,setInventoryPull]=useState(null);
  const [tracking,setTracking]=useState(null);
  const [marketplacePages,setMarketplacePages]=useState("1");
  const [marketplaceSize,setMarketplaceSize]=useState("100");
  const [productStatusBarcode,setProductStatusBarcode]=useState("");
  const [productStatus,setProductStatus]=useState(null);
  const [confirmStock,setConfirmStock]=useState("");
  const [confirmProducts,setConfirmProducts]=useState("");
  const [liveLimit,setLiveLimit]=useState("");
  const [busy,setBusy]=useState("");
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");
  const [lastResult,setLastResult]=useState(null);

  async function api(action,{method="GET",body}={}){
    const r=await fetch(`/api/trendyol/${action}`,{
      method,
      credentials:"include",
      headers:body?{"Content-Type":"application/json"}:undefined,
      body:body?JSON.stringify(body):undefined,
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||"Trendyol islemi tamamlanamadi");
    return d;
  }

  function settingsPayload(){
    let categoryMappings={};
    try{ categoryMappings=JSON.parse(categoryMapText||"{}"); }
    catch{ throw new Error("Kategori eslestirme JSON formati hatali"); }
    return {
      commissionRate:Number(settingsForm.commissionRate)||0,
      stopajRate:Number(settingsForm.stopajRate)||0,
      adRate:Number(settingsForm.adRate)||0,
      targetProfit:Number(settingsForm.targetProfit)||0,
      defaultCargoCost:Number(settingsForm.defaultCargoCost)||0,
      defaultDesi:Number(settingsForm.defaultDesi)||1,
      listPriceMarkup:Number(settingsForm.listPriceMarkup)||0,
      brandId:String(settingsForm.brandId||"").trim(),
      cargoCompanyId:String(settingsForm.cargoCompanyId||"").trim(),
      defaultOrigin:String(settingsForm.defaultOrigin||"TR").trim()||"TR",
      categoryMappings,
    };
  }

  function applySettingsForm(s){
    const next=s||{};
    setSettings(next);
    setSettingsForm({
      commissionRate:String(next.commissionRate??14),
      stopajRate:String(next.stopajRate??1),
      adRate:String(next.adRate??3),
      targetProfit:String(next.targetProfit??750),
      defaultCargoCost:String(next.defaultCargoCost??250),
      defaultDesi:String(next.defaultDesi??5),
      listPriceMarkup:String(next.listPriceMarkup??10),
      brandId:String(next.brandId||""),
      cargoCompanyId:String(next.cargoCompanyId||""),
      defaultOrigin:String(next.defaultOrigin||"TR"),
    });
    setCategoryMapText(JSON.stringify(next.categoryMappings||{},null,2));
  }

  async function loadAll(){
    setBusy("load");setErr("");setMsg("");
    try{
      const [st,sg]=await Promise.all([api("status"),api("settings")]);
      setStatus(st);
      applySettingsForm(sg.settings);
      const [stock,products,track]=await Promise.all([
        api("preview-stock-price",{method:"POST",body:{settings:sg.settings}}),
        api("preview-products",{method:"POST",body:{settings:sg.settings}}),
        api("tracking?maxPages=20&size=100").catch(e=>({success:false,error:e.message})),
      ]);
      setStockPreview(stock);
      setProductPreview(products);
      if(track?.success) {
        setTracking(track);
        if(track.comparison) setMarketplace({marketplace:track.marketplace,comparison:track.comparison});
      }
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  useEffect(()=>{loadAll()},[]);

  async function saveSettings(){
    setBusy("settings");setErr("");setMsg("");
    try{
      const d=await api("settings",{method:"POST",body:settingsPayload()});
      applySettingsForm(d.settings);
      setMsg("Trendyol ayarlari kaydedildi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function refreshStock(){
    setBusy("stock");setErr("");setMsg("");
    try{
      const d=await api("preview-stock-price",{method:"POST",body:{settings:settingsPayload()}});
      setStockPreview(d);
      setMsg("Stok/fiyat onizleme yenilendi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function refreshProducts(){
    setBusy("products");setErr("");setMsg("");
    try{
      const d=await api("preview-products",{method:"POST",body:{settings:settingsPayload()}});
      setProductPreview(d);
      setMsg("Urun yukleme onizleme yenilendi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function runLookups(){
    setBusy("lookups");setErr("");setMsg("");
    try{
      const d=await api("lookups");
      setLookups(d);
      setMsg("Kategori ve marka lookup verisi alindi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function fetchAttributes(){
    if(!categoryId.trim()) return;
    setBusy("attributes");setErr("");setMsg("");
    try{
      const d=await api(`attributes?categoryId=${encodeURIComponent(categoryId.trim())}`);
      setAttributes(d);
      setMsg("Kategori attribute listesi alindi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function liveStock(){
    setBusy("live-stock");setErr("");setMsg("");setLastResult(null);
    try{
      const d=await api("live-stock-price",{method:"POST",body:{settings:settingsPayload(),confirm:confirmStock,limit:Number(liveLimit)||0}});
      setLastResult(d);
      setMsg("Canli stok/fiyat gonderimi yapildi. Batch sonucunu kontrol edin.");
      setConfirmStock("");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function liveProducts(){
    setBusy("live-products");setErr("");setMsg("");setLastResult(null);
    try{
      const d=await api("live-products",{method:"POST",body:{settings:settingsPayload(),confirm:confirmProducts,limit:Number(liveLimit)||0}});
      setLastResult(d);
      setMsg("Canli urun yukleme istegi Trendyol'a gonderildi. Batch sonucunu kontrol edin.");
      setConfirmProducts("");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function checkBatch(){
    if(!batchId.trim()) return;
    setBusy("batch");setErr("");setMsg("");
    try{
      const d=await api(`batch?batchRequestId=${encodeURIComponent(batchId.trim())}`);
      setBatchResult(d.data);
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function pullMarketplace(){
    setBusy("marketplace");setErr("");setMsg("");
    try{
      const qs=new URLSearchParams({maxPages:String(Number(marketplacePages)||1),size:String(Number(marketplaceSize)||100)});
      const d=await api(`approved-products?${qs.toString()}`);
      setMarketplace(d);
      setMsg("Trendyol onayli urun listesi cekildi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function pullInventory(){
    setBusy("inventory");setErr("");setMsg("");
    try{
      const qs=new URLSearchParams({maxPages:String(Number(marketplacePages)||1),size:String(Number(marketplaceSize)||100)});
      const d=await api(`inventory-products?${qs.toString()}`);
      setInventoryPull(d);
      setMsg("Trendyol stok/fiyat listesi cekildi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function refreshTracking(){
    setBusy("tracking");setErr("");setMsg("");
    try{
      const d=await api("tracking?maxPages=20&size=100");
      setTracking(d);
      if(d.comparison) setMarketplace({marketplace:d.marketplace,comparison:d.comparison});
      setMsg("Trendyol takip verisi yenilendi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  async function checkProductStatus(){
    if(!productStatusBarcode.trim()) return;
    setBusy("product-status");setErr("");setMsg("");setProductStatus(null);
    try{
      const d=await api(`product-status?barcode=${encodeURIComponent(productStatusBarcode.trim())}`);
      setProductStatus(d.data);
      setMsg("Barkod durumu alindi.");
    }catch(e){setErr(e.message)}
    finally{setBusy("")}
  }

  const Stat=({label,value,muted,color})=><div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:16,minHeight:92}}>
    <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color:color||"#111827",lineHeight:1.1}}>{value}</div>
    {muted&&<div style={{fontSize:11,color:"#9ca3af",marginTop:8}}>{muted}</div>}
  </div>;
  const Pill=({ok,text})=><span style={{display:"inline-flex",alignItems:"center",minHeight:24,padding:"3px 9px",borderRadius:999,fontSize:12,fontWeight:700,background:ok?"#dcfce7":"#fee2e2",color:ok?"#15803d":"#b91c1c"}}>{text}</span>;
  const TextBtn=({id,label})=><button onClick={()=>setView(id)} style={{minHeight:36,padding:"8px 13px",border:"1px solid "+(view===id?"#ff6000":"#ddd"),borderRadius:6,background:view===id?"#fff5f0":"#fff",color:view===id?"#ff6000":"#555",fontSize:13,fontWeight:700,cursor:"pointer"}}>{label}</button>;
  const RowTable=({rows,columns,empty})=>{
    const list=Array.isArray(rows)?rows:[];
    if(!list.length) return <div style={{fontSize:13,color:"#999",padding:"10px 0"}}>{empty||"Kayit yok."}</div>;
    return <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{columns.map(c=><th key={c.k} style={{padding:"8px",textAlign:c.align||"left",color:"#777",whiteSpace:"nowrap"}}>{c.l}</th>)}</tr></thead>
      <tbody>{list.map((row,i)=><tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>{columns.map(c=>{const val=c.render?c.render(row):row[c.k];return <td key={c.k} style={{padding:"8px",textAlign:c.align||"left",maxWidth:c.maxWidth||280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:c.wrap?"normal":"nowrap"}} title={String(val??"")}>{val}</td>})}</tr>)}</tbody>
    </table></div>;
  };

  const stockSummary=stockPreview?.summary||{};
  const productSummary=productPreview?.summary||{};
  const attrs=attributes?.data?.categoryAttributes||attributes?.data?.attributes||[];
  const requiredAttrs=Array.isArray(attrs)?attrs.filter(a=>a.required||a.isRequired||a.varianter||a.slicer):[];
  const resultBatches=lastResult?.results||[];
  const marketSummary=marketplace?.comparison?.summary||{};
  const inventorySummary=inventoryPull?.marketplace?.summary||{};
  const trackingSummary=tracking?.summary||{};
  const trackingBatches=tracking?.batchSummaries||[];
  const trackingProducts=tracking?.productStatuses||[];
  const fmtDate=(value)=>{
    if(!value) return "-";
    try{return new Date(value).toLocaleString("tr-TR")}
    catch{return value}
  };
  const TrackingPanel=({compact=false})=><>
    <ACard title="Trendyol Canli Takip" action={<ABtn onClick={refreshTracking} color="#111827" disabled={busy==="tracking"}>{busy==="tracking"?"Yenileniyor":"Takibi Yenile"}</ABtn>}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        <Stat label="Onayli Urun" value={trackingSummary.approvedVariantCount??"-"} muted={`${trackingSummary.matchedCount??0} eslesen`}/>
        <Stat label="Onay Bekleyen" value={trackingSummary.missingOnTrendyolCount??"-"} muted="TY onayli listede yok" color="#b45309"/>
        <Stat label="Batch Basarili" value={trackingSummary.batchSuccessCount??"-"} muted={`${trackingSummary.batchFailedItemCount??0} hata` } color="#15803d"/>
        <Stat label="Ornek Onay" value={`${trackingSummary.sampleApprovedCount??0}/${trackingSummary.sampleCount??0}`} muted={`${trackingSummary.samplePendingCount??0} bekliyor`}/>
        <Stat label="Son Kontrol" value={tracking?.checkedAt?fmtDate(tracking.checkedAt).split(" ")[1]:"-"} muted={tracking?.checkedAt?fmtDate(tracking.checkedAt).split(" ")[0]:""}/>
      </div>
      {tracking?.marketplaceError&&<div style={{fontSize:12,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:10,marginBottom:12}}>{tracking.marketplaceError}</div>}
      <RowTable rows={trackingProducts} empty="Takip verisi henuz alinmadi." columns={[
        {k:"barcode",l:"Barkod"},{k:"approved",l:"Onay",render:r=>r.ok?(r.approved?"Onayli":"Onayda"):"Hata"},{k:"status",l:"Durum"},{k:"stockCode",l:"Stok Kodu"},{k:"contentId",l:"Content ID"},{k:"listingId",l:"Listing ID",maxWidth:260}
      ]}/>
    </ACard>
    {!compact&&<ACard title="Yukleme Batchleri">
      <RowTable rows={trackingBatches} empty="Batch takibi henuz alinmadi." columns={[
        {k:"batchRequestId",l:"Batch ID",maxWidth:360},{k:"status",l:"Durum"},{k:"itemCount",l:"Toplam",align:"right"},{k:"successCount",l:"Basarili",align:"right"},{k:"failedItemCount",l:"Hata",align:"right"},{k:"failureReasons",l:"Ilk Hatalar",maxWidth:420,render:r=>(r.failureReasons||[]).map(x=>`${x.count}x ${x.reason}`).join(" | ")||r.error||"-",wrap:true}
      ]}/>
    </ACard>}
    {!compact&&<ACard title="Onayli Listede Henuz Gorunmeyenler">
      <RowTable rows={tracking?.comparison?.missingOnTrendyol||[]} empty="Eksik/onay bekleyen urun yok veya takip cekilmedi." columns={[
        {k:"sku",l:"SKU"},{k:"name",l:"Urun",maxWidth:360},{k:"barcode",l:"Barkod"},{k:"sitePrice",l:"Site Fiyat",align:"right"},{k:"stock",l:"Stok",align:"right"},{k:"category",l:"Kategori"}
      ]}/>
    </ACard>}
  </>;

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 6px"}}>Trendyol Yonetimi</h1>
        <div style={{fontSize:13,color:"#666"}}>Frenciniz katalogundan Trendyol stok/fiyat, urun yukleme ve kategori eslestirme yonetimi.</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <ABtn onClick={loadAll} color="#111827">{busy==="load"?"Yukleniyor":"Tumunu Yenile"}</ABtn>
        <ABtn onClick={()=>setView("settings")} color="#475569">Ayarlar</ABtn>
      </div>
    </div>

    {err&&<div style={{padding:12,border:"1px solid #fecaca",borderRadius:8,background:"#fef2f2",color:"#b91c1c",fontSize:13,fontWeight:700}}>{err}</div>}
    {msg&&<div style={{padding:12,border:"1px solid #bbf7d0",borderRadius:8,background:"#f0fdf4",color:"#15803d",fontSize:13,fontWeight:700}}>{msg}</div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
      <Stat label="API Durumu" value={status?.authOk?"Bagli":"Kontrol"} muted={status?.config?.userAgent||status?.authError||"Durum bekleniyor"} color={status?.authOk?"#15803d":"#b45309"}/>
      <Stat label="Frenciniz Urun" value={status?.productCount??"-"} muted="Katalogdaki urun sayisi"/>
      <Stat label="Stok/Fiyat Hazir" value={stockSummary.itemCount??"-"} muted={`${stockSummary.chunkCount||0} parca, ${stockSummary.skippedCount||0} atlanan`}/>
      <Stat label="Urun V2 Hazir" value={productSummary.itemCount??"-"} muted={`${productSummary.mappingNeededCount||0} kategori eslesmesi bekliyor`}/>
      <Stat label="TY Onayli" value={trackingSummary.approvedVariantCount??marketSummary.trendyolVariantCount??"-"} muted={`${trackingSummary.matchedCount??marketSummary.matchedCount??0} eslesen, ${trackingSummary.missingOnTrendyolCount??marketSummary.missingOnTrendyolCount??0} bekleyen`}/>
    </div>

    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <TextBtn id="overview" label="Ozet"/>
      <TextBtn id="tracking" label="Canli Takip"/>
      <TextBtn id="settings" label="Fiyat Politikasi"/>
      <TextBtn id="stock" label="Stok / Fiyat"/>
      <TextBtn id="marketplace" label="Trendyol'daki Urunler"/>
      <TextBtn id="products" label="Urun Yukleme"/>
      <TextBtn id="lookups" label="Kategori / Attribute"/>
      <TextBtn id="batch" label="Batch Kontrol"/>
    </div>

    {view==="overview"&&<>
      <TrackingPanel compact/>
      <ACard title="Trendyol Baglanti Ozeti" action={<ABtn onClick={loadAll}>{busy==="load"?"...":"Yenile"}</ABtn>}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <div style={{fontSize:13,lineHeight:1.8}}>
            <div><strong>Supplier ID:</strong> {status?.config?.supplierId||"-"}</div>
            <div><strong>User-Agent:</strong> {status?.config?.userAgent||"-"}</div>
            <div><strong>API Key:</strong> <Pill ok={status?.config?.hasApiKey} text={status?.config?.hasApiKey?"Tanimli":"Eksik"}/></div>
            <div><strong>API Secret:</strong> <Pill ok={status?.config?.hasApiSecret} text={status?.config?.hasApiSecret?"Tanimli":"Eksik"}/></div>
          </div>
          <div style={{fontSize:13,lineHeight:1.8}}>
            <div><strong>Kategori kok sayisi:</strong> {status?.categoryRootCount??"-"}</div>
            <div><strong>Ekersan marka sonucu:</strong> {status?.brandMatches?.length||0}</div>
            <div><strong>Brand ID:</strong> {settings?.brandId||"Eksik"}</div>
            <div><strong>Canli durum:</strong> <Pill ok={status?.authOk} text={status?.authOk?"Hazir":"Hazir degil"}/></div>
          </div>
        </div>
      </ACard>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
        <ACard title="Acil Yapilacaklar">
          <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:13,color:"#444"}}>
            {!settings?.brandId&&<div style={{padding:10,border:"1px solid #fed7aa",borderRadius:6,background:"#fff7ed"}}>1. Trendyol marka ID eksik. Ekersan aramasi sonuc vermezse panelden marka acilmasi gerekir.</div>}
            {productSummary.mappingNeededCount>0&&<div style={{padding:10,border:"1px solid #bfdbfe",borderRadius:6,background:"#eff6ff"}}>2. {productSummary.mappingNeededCount} kategori icin category-map eslestirmesi gerekiyor.</div>}
            {stockSummary.itemCount>0&&<div style={{padding:10,border:"1px solid #bbf7d0",borderRadius:6,background:"#f0fdf4"}}>3. Stok/fiyat icin {stockSummary.itemCount} urun hazir. Urunler Trendyol'da onaylandiktan sonra canli gonderim yapilabilir.</div>}
            {!marketplace&&<div style={{padding:10,border:"1px solid #e5e7eb",borderRadius:6,background:"#f9fafb"}}>4. Once Trendyol'daki onayli urunleri cekip Frenciniz katalogu ile karsilastirin.</div>}
          </div>
        </ACard>
        <ACard title="Son Canli Sonuc">
          {!resultBatches.length?<div style={{fontSize:13,color:"#999"}}>Bu oturumda canli gonderim yok.</div>:<RowTable rows={resultBatches} columns={[
            {k:"chunk",l:"Parca"},{k:"itemCount",l:"Urun"},{k:"batch",l:"Batch",render:r=>r.response?.batchRequestId||"-",maxWidth:360}
          ]}/>}
        </ACard>
      </div>
    </>}

    {view==="tracking"&&<TrackingPanel/>}

    {view==="settings"&&<ACard title="Fiyat Politikasi ve Eslestirme" action={<ABtn onClick={saveSettings}>{busy==="settings"?"Kaydediliyor":"Kaydet"}</ABtn>}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:14}}>
        {[
          ["commissionRate","Komisyon %"],["stopajRate","Stopaj %"],["adRate","Reklam %"],["targetProfit","Hedef Kar TL"],["defaultCargoCost","Kargo TL"],["defaultDesi","Varsayilan Desi"],["listPriceMarkup","Liste Fiyat Artis %"],["brandId","Trendyol Brand ID"],["cargoCompanyId","Kargo Firma ID"],["defaultOrigin","Mensei"]
        ].map(([k,l])=><label key={k} style={{fontSize:12,color:"#666",fontWeight:700}}>{l}<AIn value={settingsForm[k]||""} onChange={e=>setSettingsForm({...settingsForm,[k]:e.target.value})} style={{marginTop:4}}/></label>)}
      </div>
      <div style={{fontSize:12,color:"#666",fontWeight:700,marginBottom:6}}>Kategori eslestirme JSON</div>
      <textarea value={categoryMapText} onChange={e=>setCategoryMapText(e.target.value)} rows={12} style={{width:"100%",fontFamily:"Consolas, monospace",fontSize:12,border:"1px solid #ddd",borderRadius:6,padding:12,resize:"vertical"}}/>
      <div style={{fontSize:11,color:"#888",marginTop:8}}>Ornek key: urunun Frenciniz kategori slug'i veya kategori adi. Attribute icin customAttributeValueFrom kullanilabilir: oem, sku, name.</div>
    </ACard>}

    {view==="stock"&&<>
      <ACard title="Stok / Fiyat Onizleme" action={<ABtn onClick={refreshStock}>{busy==="stock"?"...":"Onizle"}</ABtn>}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
          <Stat label="Hazir SKU" value={stockSummary.itemCount??"-"}/>
          <Stat label="Atlanan" value={stockSummary.skippedCount??"-"}/>
          <Stat label="Batch Parca" value={stockSummary.chunkCount??"-"}/>
          <Stat label="Uretilen Barkod" value={stockSummary.generatedBarcodes??"-"}/>
        </div>
        {!stockSummary.hasCostData&&<div style={{fontSize:12,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:10,marginBottom:12}}>Katalogda alis maliyeti olmadigi icin kar hesabi tum urunlerde gorunmeyebilir; fiyat olarak site fiyati esas alinir.</div>}
        <RowTable rows={stockPreview?.sample||[]} columns={[
          {k:"sku",l:"SKU"},{k:"name",l:"Urun",maxWidth:360},{k:"barcode",l:"Barkod"},{k:"quantity",l:"Stok",align:"right"},{k:"salePrice",l:"Satis",align:"right"},{k:"listPrice",l:"Liste",align:"right"},{k:"expectedProfit",l:"Kar",align:"right",render:r=>r.expectedProfit??"-"}
        ]}/>
      </ACard>
      <ACard title="Canli Stok / Fiyat Gonderimi">
        <div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(180px,1fr) auto",gap:10,alignItems:"end"}}>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Test limiti bos olursa tum hazir urunler<AIn value={liveLimit} onChange={e=>setLiveLimit(e.target.value)} placeholder="Orn: 5"/></label>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Onay metni: CANLI GONDER<AIn value={confirmStock} onChange={e=>setConfirmStock(e.target.value)} placeholder="CANLI GONDER"/></label>
          <ABtn color="#dc2626" disabled={busy==="live-stock"} onClick={liveStock}>{busy==="live-stock"?"Gonderiliyor":"Canli Gonder"}</ABtn>
        </div>
      </ACard>
    </>}

    {view==="marketplace"&&<>
      <ACard title="Trendyol'dan Urunleri Cek" action={<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <ABtn onClick={pullMarketplace} color="#111827" disabled={busy==="marketplace"}>{busy==="marketplace"?"Cekiliyor":"Onayli Urunleri Cek"}</ABtn>
        <ABtn onClick={pullInventory} color="#475569" disabled={busy==="inventory"}>{busy==="inventory"?"Cekiliyor":"Stok/Fiyat Cek"}</ABtn>
      </div>}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,alignItems:"end",marginBottom:14}}>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Sayfa adedi<AIn value={marketplacePages} type="number" min="1" max="50" onChange={e=>setMarketplacePages(e.target.value)} style={{marginTop:4}}/></label>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Sayfa boyutu<AIn value={marketplaceSize} type="number" min="1" max="100" onChange={e=>setMarketplaceSize(e.target.value)} style={{marginTop:4}}/></label>
          <div style={{fontSize:12,color:"#777",lineHeight:1.55}}>Trendyol API tek istekte en fazla 100 kayit dondurur. Fazla urun icin sayfa adedini artirin.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
          <Stat label="TY Varyant" value={marketSummary.trendyolVariantCount??"-"} muted={`${marketplace?.marketplace?.summary?.pagesFetched||0} sayfa cekildi`}/>
          <Stat label="Eslesen" value={marketSummary.matchedCount??"-"} color="#15803d"/>
          <Stat label="TY'de Eksik" value={marketSummary.missingOnTrendyolCount??"-"} color="#b45309"/>
          <Stat label="TY Fazla" value={marketSummary.extraOnTrendyolCount??"-"} color="#475569"/>
        </div>
        <RowTable rows={marketplace?.comparison?.trendyolSample||[]} empty="Henuz Trendyol'dan onayli urun cekilmedi." columns={[
          {k:"barcode",l:"Barkod"},{k:"stockCode",l:"Stok Kodu"},{k:"title",l:"Trendyol Urun",maxWidth:420},{k:"quantity",l:"Stok",align:"right"},{k:"salePrice",l:"Satis",align:"right"},{k:"listPrice",l:"Liste",align:"right"},{k:"status",l:"Durum"}
        ]}/>
      </ACard>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
        <ACard title="Trendyol'da Eksik Olan Frenciniz Urunleri">
          <RowTable rows={marketplace?.comparison?.missingOnTrendyol||[]} empty="Karsilastirma icin once onayli urunleri cekin." columns={[
            {k:"sku",l:"SKU"},{k:"name",l:"Urun",maxWidth:360},{k:"barcode",l:"Barkod"},{k:"sitePrice",l:"Site Fiyat",align:"right"},{k:"stock",l:"Stok",align:"right"},{k:"category",l:"Kategori"}
          ]}/>
        </ACard>
        <ACard title="Frenciniz ile Eslesenler">
          <RowTable rows={marketplace?.comparison?.matched||[]} empty="Eslesen urun yok veya liste cekilmedi." columns={[
            {k:"sku",l:"SKU"},{k:"name",l:"Urun",maxWidth:320},{k:"matchType",l:"Eslesme"},{k:"trendyolSalePrice",l:"TY Satis",align:"right"},{k:"trendyolQuantity",l:"TY Stok",align:"right"},{k:"trendyolStatus",l:"Durum"}
          ]}/>
        </ACard>
      </div>

      <ACard title="Trendyol Stok / Fiyat Cekilen Kayitlar">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
          <Stat label="Cekilen Kayit" value={inventorySummary.variantCount??"-"} muted={`${inventorySummary.pagesFetched||0} sayfa`}/>
          <Stat label="Toplam Bilinen" value={inventorySummary.totalElements??"-"}/>
          <Stat label="Sonraki Token" value={inventorySummary.nextPageToken?"Var":"Yok"}/>
        </div>
        <RowTable rows={inventoryPull?.marketplace?.variants||[]} empty="Stok/fiyat listesi henuz cekilmedi." columns={[
          {k:"barcode",l:"Barkod"},{k:"stockCode",l:"Stok Kodu"},{k:"title",l:"Urun",maxWidth:420},{k:"quantity",l:"Stok",align:"right"},{k:"salePrice",l:"Satis",align:"right"},{k:"listPrice",l:"Liste",align:"right"}
        ]}/>
      </ACard>

      <ACard title="Tek Barkod Durumu">
        <div style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",marginBottom:12}}>
          <label style={{fontSize:12,color:"#666",fontWeight:700,minWidth:280}}>Barkod<AIn value={productStatusBarcode} onChange={e=>setProductStatusBarcode(e.target.value)} placeholder="Trendyol barkodu"/></label>
          <ABtn onClick={checkProductStatus} color="#111827" disabled={busy==="product-status"}>{busy==="product-status"?"...":"Sorgula"}</ABtn>
        </div>
        {productStatus&&<pre style={{maxHeight:360,overflow:"auto",background:"#111827",color:"#e5e7eb",borderRadius:8,padding:14,fontSize:12,whiteSpace:"pre-wrap"}}>{JSON.stringify(productStatus,null,2)}</pre>}
      </ACard>
    </>}

    {view==="products"&&<>
      <ACard title="Product V2 Urun Yukleme Onizleme" action={<ABtn onClick={refreshProducts}>{busy==="products"?"...":"Onizle"}</ABtn>}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
          <Stat label="Yuklemeye Hazir" value={productSummary.itemCount??"-"}/>
          <Stat label="Atlanan" value={productSummary.skippedCount??"-"}/>
          <Stat label="Kategori Eksigi" value={productSummary.mappingNeededCount??"-"}/>
          <Stat label="Brand Hazir" value={productSummary.brandReady?"Evet":"Hayir"} color={productSummary.brandReady?"#15803d":"#b91c1c"}/>
        </div>
        {productPreview?.mappingNeeded?.length>0&&<div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,marginBottom:8}}>Kategori eslestirmesi gerekenler</div>
          <RowTable rows={productPreview.mappingNeeded.slice(0,40)} columns={[
            {k:"category",l:"Kategori"},{k:"productCat",l:"Slug"},{k:"count",l:"Adet",align:"right"},{k:"sampleSku",l:"Ornek SKU"}
          ]}/>
        </div>}
        <RowTable rows={productPreview?.sample||[]} empty="Brand ID ve kategori map tamamlaninca urun adaylari burada gorunecek." columns={[
          {k:"sku",l:"SKU"},{k:"title",l:"Baslik",maxWidth:360},{k:"barcode",l:"Barkod"},{k:"categoryId",l:"Kategori"},{k:"salePrice",l:"Satis",align:"right"}
        ]}/>
      </ACard>
      <ACard title="Canli Urun Yukleme">
        <div style={{fontSize:12,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:10,marginBottom:12}}>Urun yukleme Trendyol onay surecine sokar. Brand ID, kategori ID ve zorunlu attribute eslesmeleri tamamlanmadan canli yukleme yapmayin.</div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(180px,1fr) auto",gap:10,alignItems:"end"}}>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Test limiti<AIn value={liveLimit} onChange={e=>setLiveLimit(e.target.value)} placeholder="Orn: 5"/></label>
          <label style={{fontSize:12,color:"#666",fontWeight:700}}>Onay metni: URUN YUKLE<AIn value={confirmProducts} onChange={e=>setConfirmProducts(e.target.value)} placeholder="URUN YUKLE"/></label>
          <ABtn color="#dc2626" disabled={busy==="live-products"} onClick={liveProducts}>{busy==="live-products"?"Yukleniyor":"Urun Yukle"}</ABtn>
        </div>
      </ACard>
    </>}

    {view==="lookups"&&<>
      <ACard title="Trendyol Kategori ve Marka Lookup" action={<ABtn onClick={runLookups}>{busy==="lookups"?"...":"Lookup Al"}</ABtn>}>
        <div style={{fontSize:13,color:"#666",marginBottom:12}}>Kategori adayi, Frenciniz urun kategorilerine gore otomatik siralanir. Canli yukleme oncesi elle kontrol edin.</div>
        <RowTable rows={lookups?.categoryCandidates?.slice(0,60)||[]} empty="Lookup henuz alinmadi." columns={[
          {k:"category",l:"Frenciniz Kategori"},{k:"count",l:"Adet",align:"right"},{k:"candidateId",l:"TY ID"},{k:"candidatePath",l:"Trendyol Kategori",maxWidth:520},{k:"score",l:"Puan",align:"right"}
        ]}/>
      </ACard>
      <ACard title="Kategori Attribute Sorgula">
        <div style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",marginBottom:12}}>
          <label style={{fontSize:12,color:"#666",fontWeight:700,minWidth:180}}>Kategori ID<AIn value={categoryId} onChange={e=>setCategoryId(e.target.value)} placeholder="Orn: 4232"/></label>
          <ABtn onClick={fetchAttributes}>{busy==="attributes"?"...":"Attribute Al"}</ABtn>
        </div>
        <RowTable rows={requiredAttrs.slice(0,40)} empty="Kategori ID girip attribute alin." columns={[
          {k:"attributeId",l:"ID"},{k:"attributeName",l:"Attribute"},{k:"required",l:"Zorunlu",render:r=>r.required?"Evet":"-"},{k:"allowCustom",l:"Ozel Deger",render:r=>r.allowCustom?"Evet":"Hayir"},{k:"valueCount",l:"Deger",align:"right",render:r=>(r.attributeValues||[]).length}
        ]}/>
      </ACard>
    </>}

    {view==="batch"&&<ACard title="Batch Sonucu Kontrol">
      <div style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",marginBottom:14}}>
        <label style={{fontSize:12,color:"#666",fontWeight:700,minWidth:320}}>Batch Request ID<AIn value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="batchRequestId"/></label>
        <ABtn onClick={checkBatch}>{busy==="batch"?"...":"Sorgula"}</ABtn>
      </div>
      {batchResult&&<pre style={{maxHeight:420,overflow:"auto",background:"#111827",color:"#e5e7eb",borderRadius:8,padding:14,fontSize:12,whiteSpace:"pre-wrap"}}>{JSON.stringify(batchResult,null,2)}</pre>}
    </ACard>}
  </div>;
}

function ABanners(){
  const [bs,setBs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);
  const [f,setF]=useState({title:"",image:"",link:""});
  async function load(){
    setLoading(true);
    try{ const d=await fetch("/api/admin/banners",{credentials:"include"}).then(r=>r.json()); setBs(d.banners||[]); }catch{} finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);
  async function save(patch){
    await fetch("/api/admin/banners",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
    load();
  }
  async function remove(id){
    await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`,{method:"DELETE",credentials:"include"});
    load();
  }
  return <ACard title={`Banner Yönetimi (${bs.length})`} action={<ABtn onClick={()=>setShow(!show)}>+ Banner Ekle</ABtn>}>
    {show&&<div style={{background:"#fafafa",borderRadius:8,padding:16,marginBottom:16,border:"1px solid #eee"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <AIn placeholder="Başlık" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
        <AIn placeholder="Görsel URL" value={f.image} onChange={e=>setF({...f,image:e.target.value})}/>
        <AIn placeholder="Bağlantı" value={f.link} onChange={e=>setF({...f,link:e.target.value})}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <ABtn onClick={async()=>{if(f.title){await save({...f,active:true});setShow(false);setF({title:"",image:"",link:""})}}}>Oluştur</ABtn>
        <ABtn color="#999" onClick={()=>setShow(false)}>İptal</ABtn>
      </div>
    </div>}
    {loading?<div style={{color:"#999",fontSize:13}}>Yükleniyor…</div>:bs.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz banner yok.</div>:bs.map((b,i)=><div key={b.id} style={{display:"flex",alignItems:"center",gap:16,padding:"12px 0",borderBottom:i<bs.length-1?"1px solid #f0f0f0":"none"}}>
      <div style={{width:120,height:50,background:b.image?`url(${b.image}) center/cover`:"#f0f0f0",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#999"}}>{!b.image&&"🖼"}</div>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{b.title}</div>{b.link&&<div style={{fontSize:11,color:"#888"}}>{b.link}</div>}</div>
      <button onClick={()=>save({...b,active:!b.active})} style={{padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:b.active?"#dcfce7":"#fee2e2",color:b.active?"#059669":"#dc2626"}}>{b.active?"Aktif":"Pasif"}</button>
      <button onClick={()=>remove(b.id)} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
    </div>)}</ACard>;
}

function APagesAdmin(){
  const pgs=[{slug:"about",n:"Hakkımızda"},{slug:"privacy",n:"Gizlilik Politikası"},{slug:"terms",n:"Şartlar ve Koşullar"},{slug:"shipping-policy",n:"Gönderim Politikası"},{slug:"return-policy",n:"İade Politikası"},{slug:"kvkk",n:"KVKK"},{slug:"accessibility",n:"Erişilebilirlik"},{slug:"company",n:"Şirket Bilgileri"}];
  const [sel,setSel]=useState(null);
  const [ok,setOk]=useState(false);
  const [content,setContent]=useState("");
  const [title,setTitle]=useState("");
  useEffect(()=>{
    if(!sel) return;
    fetch("/api/admin/pages",{credentials:"include"}).then(r=>r.json()).then(d=>{
      const rec=(d.pages||[]).find(p=>p.slug===sel.slug);
      setContent(rec?.content||""); setTitle(rec?.title||sel.n);
    });
  },[sel]);
  async function save(){
    await fetch("/api/admin/pages",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:sel.slug,title,content})});
    setOk(true); setTimeout(()=>setOk(false),2000);
  }
  return <ACard title="Sayfa İçerik Yönetimi">
    {!sel?pgs.map((p,i)=><div key={p.slug} onClick={()=>setSel(p)} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:i<pgs.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
      <span style={{fontSize:14}}>📄 {p.n}</span><span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span></div>)
    :<div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:12}}>← Geri</button>
      <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{sel.n}</div>
      <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Sayfa Başlığı</label>
      <AIn value={title} onChange={e=>setTitle(e.target.value)} style={{marginBottom:12}}/>
      <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>İçerik (Markdown / HTML)</label>
      <textarea rows={14} value={content} onChange={e=>setContent(e.target.value)} placeholder={`${sel.n} sayfa içeriği...`} style={{width:"100%",padding:14,border:"1px solid #ddd",borderRadius:6,fontSize:14,lineHeight:1.7,resize:"vertical",fontFamily:"inherit"}}/>
      <ABtn onClick={save} style={{marginTop:12}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
    </div>}</ACard>;
}

function AEmailCfg(){
  const [cfg,setCfg]=useState({apiKey:"",fromAddress:"Frenciniz <noreply@frenciniz.com>",notifySignup:true,notifyOrder:true,notifyShipped:true});
  const [ok,setOk]=useState(false);
  const [testTo,setTestTo]=useState("");
  const [testStatus,setTestStatus]=useState("");
  useEffect(()=>{
    fetch("/api/admin/email-config",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.config && Object.keys(d.config).length) setCfg(p=>({...p,...d.config}));
    });
  },[]);
  async function save(){
    await fetch("/api/admin/email-config",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)});
    setOk(true); setTimeout(()=>setOk(false),2000);
  }
  async function testSend(){
    if(!testTo) return setTestStatus("⚠ E-posta adresi girin");
    setTestStatus("Gönderiliyor...");
    try{
      const r=await fetch("/api/admin/test-notify",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({channel:"email",to:testTo,subject:"Frenciniz test",message:"Bu bir test e-postasıdır."})});
      const d=await r.json();
      setTestStatus(r.ok?`✓ Gönderildi (id: ${d.id||"-"})`:`✗ ${d.error||"Hata"}`);
    }catch(e){ setTestStatus(`✗ ${e.message}`); }
  }
  const rows=[{k:"notifySignup",l:"Yeni üye kayıt"},{k:"notifyOrder",l:"Sipariş onay"},{k:"notifyShipped",l:"Kargoya verildi"}];
  return <ACard title="Mail Entegrasyonu (Resend)"><div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:12}}>
    <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1"}}>💡 Resend API anahtarınızı resend.com adresinden alabilirsiniz. Domain (frenciniz.com) Resend'de doğrulanmış olmalıdır.</div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Resend API Anahtarı</label><AIn type="password" value={cfg.apiKey||""} onChange={e=>setCfg({...cfg,apiKey:e.target.value})} placeholder="re_xxxxxxxxxxxx"/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Gönderici (From)</label><AIn value={cfg.fromAddress||""} onChange={e=>setCfg({...cfg,fromAddress:e.target.value})} placeholder="Frenciniz <noreply@frenciniz.com>"/></div>
    <div style={{border:"1px solid #eee",borderRadius:6,padding:14}}>
      <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Otomatik Mail Bildirimleri</div>
      {rows.map(r=><div key={r.k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:13}}>{r.l}</span><input type="checkbox" checked={cfg[r.k]!==false} onChange={e=>setCfg({...cfg,[r.k]:e.target.checked})} style={{accentColor:"#ff6000"}}/></div>)}
    </div>
    <div style={{display:"flex",gap:8,marginTop:4}}><ABtn onClick={save}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn></div>
    <div style={{borderTop:"1px solid #eee",paddingTop:12,marginTop:4}}>
      <div style={{fontSize:12,fontWeight:600,color:"#666",marginBottom:6}}>Test Gönder</div>
      <div style={{display:"flex",gap:6}}>
        <AIn value={testTo} onChange={e=>setTestTo(e.target.value)} placeholder="ornek@adres.com" style={{flex:1}}/>
        <ABtn onClick={testSend}>Test</ABtn>
      </div>
      {testStatus && <div style={{fontSize:12,marginTop:6,color:testStatus.startsWith("✓")?"#15803d":"#dc2626"}}>{testStatus}</div>}
    </div>
  </div></ACard>;
}

function ASMSCfg(){
  const [cfg,setCfg]=useState({user:"",pass:"",header:"FRENCINIZ",adminPhone:"",notifySignup:true,notifyOrder:true,notifyShipped:true,notifyStock:true,notifyAdminOrder:true});
  const [ok,setOk]=useState(false);
  const [testTo,setTestTo]=useState("");
  const [testStatus,setTestStatus]=useState("");
  useEffect(()=>{
    fetch("/api/admin/sms-config",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.config && Object.keys(d.config).length) setCfg(p=>({...p,...d.config}));
    });
  },[]);
  async function save(){
    await fetch("/api/admin/sms-config",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)});
    setOk(true); setTimeout(()=>setOk(false),2000);
  }
  async function testSend(){
    if(!testTo) return setTestStatus("⚠ Telefon numarası girin (5XX...)");
    setTestStatus("Gönderiliyor...");
    try{
      const r=await fetch("/api/admin/test-notify",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({channel:"sms",to:testTo,message:"Frenciniz test SMS — entegrasyon calisiyor."})});
      const d=await r.json();
      setTestStatus(r.ok?`✓ Gönderildi (jobid: ${d.jobid||"-"})`:`✗ kod ${d.code||"?"}: ${d.description||d.error||"Hata"}`);
    }catch(e){ setTestStatus(`✗ ${e.message}`); }
  }
  const rows=[{k:"notifySignup",l:"Yeni üye kayıt"},{k:"notifyOrder",l:"Sipariş onay"},{k:"notifyShipped",l:"Kargoya verildi"},{k:"notifyStock",l:"Stok bildirimi"}];
  return <ACard title="NetGSM SMS Entegrasyonu"><div style={{maxWidth:500}}>
    <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 NetGSM API bilgilerinizi netgsm.com.tr adresinden alabilirsiniz. Başlığın (msgheader) NetGSM panelinden onaylı olması gerekir.</div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Kullanıcı Kodu</label><AIn value={cfg.user} onChange={e=>setCfg({...cfg,user:e.target.value})} placeholder="850XXXXXXX"/></div>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>API Şifresi</label><AIn type="password" value={cfg.pass} onChange={e=>setCfg({...cfg,pass:e.target.value})} placeholder="API şifresi"/></div>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Başlık</label><AIn value={cfg.header} onChange={e=>setCfg({...cfg,header:e.target.value})} placeholder="FRENCINIZ"/></div>
      <div style={{borderTop:"1px solid #eee",paddingTop:14,marginTop:4}}>
        <label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Yönetici Telefonu (yeni sipariş bildirimi için)</label>
        <AIn value={cfg.adminPhone||""} onChange={e=>setCfg({...cfg,adminPhone:e.target.value})} placeholder="5456087008"/>
        <div style={{fontSize:11,color:"#888",marginTop:4}}>Yeni sipariş geldiğinde bu numaraya SMS gider — admin paneli kontrol etmene gerek kalmaz.</div>
      </div>
      <div style={{border:"1px solid #eee",borderRadius:6,padding:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Otomatik SMS Bildirimleri</div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px dashed #f0f0f0",marginBottom:6}}>
          <span style={{fontSize:13,fontWeight:600,color:"#ff6000"}}>📢 Yeni sipariş → yöneticiye</span>
          <input type="checkbox" checked={cfg.notifyAdminOrder!==false} onChange={e=>setCfg({...cfg,notifyAdminOrder:e.target.checked})} style={{accentColor:"#ff6000"}}/>
        </div>
        {rows.map(r=><div key={r.k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:13}}>{r.l}</span><input type="checkbox" checked={cfg[r.k]!==false} onChange={e=>setCfg({...cfg,[r.k]:e.target.checked})} style={{accentColor:"#ff6000"}}/></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}><ABtn onClick={save}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn></div>
      <div style={{borderTop:"1px solid #eee",paddingTop:12,marginTop:4}}>
        <div style={{fontSize:12,fontWeight:600,color:"#666",marginBottom:6}}>Test Gönder</div>
        <div style={{display:"flex",gap:6}}>
          <AIn value={testTo} onChange={e=>setTestTo(e.target.value)} placeholder="5XXXXXXXXX" style={{flex:1}}/>
          <ABtn onClick={testSend}>Test</ABtn>
        </div>
        {testStatus && <div style={{fontSize:12,marginTop:6,color:testStatus.startsWith("✓")?"#15803d":"#dc2626"}}>{testStatus}</div>}
      </div>
    </div>
  </div></ACard>;
}

function MobileTrafficPanel({data,leadData,visitors,vLoading,onRefresh,refreshing,updatedAt}){
  const [view,setView]=useState("summary");
  const [period,setPeriod]=useState("today");
  const chart=Array.isArray(data?.chart)?data.chart:[];
  const leadChart=Array.isArray(leadData?.chart)?leadData.chart:[];
  const actions=data?.productActions||{};
  const periodCount=period==="today"?1:period==="7d"?7:30;
  const periodLabel=period==="today"?"Bugün":period==="7d"?"Son 7 gün":"Son 30 gün";
  const trafficRows=chart.slice(-periodCount);
  const leadRows=leadChart.slice(-periodCount);
  const views=trafficRows.reduce((sum,row)=>sum+Number(row.views||0),0);
  const unique=trafficRows.reduce((sum,row)=>sum+Number(row.unique||0),0);
  const whatsapp=leadRows.reduce((sum,row)=>sum+Number(row.whatsapp||0),0);
  const phone=leadRows.reduce((sum,row)=>sum+Number(row.phone||0),0);
  const email=leadRows.reduce((sum,row)=>sum+Number(row.email||0),0);
  const actionKey=period==="today"?"today":period==="7d"?"last7":"totals";
  const periodActions=actions[actionKey]||{};
  const contactClicks=whatsapp+phone+email;
  const contactRate=unique?((contactClicks/unique)*100).toFixed(1):"0.0";
  const maxViews=Math.max(...trafficRows.map(row=>Number(row.views||0)),1);
  const tabs=[
    {id:"summary",label:"Özet",icon:"📊"},
    {id:"contacts",label:"İletişim",icon:"💬"},
    {id:"pages",label:"Sayfalar",icon:"📦"},
    {id:"visitors",label:"Ziyaretçiler",icon:"👥"},
  ];
  const sourceNames={
    product_card_whatsapp:"Ürün kartı WhatsApp",
    product_detail:"Ürün detayı",
    product_lead_nudge:"Ürün hatırlatma kutusu",
    floating_whatsapp:"Sabit WhatsApp",
    site_whatsapp:"Site WhatsApp",
    coupon_whatsapp:"İndirim kuponu",
    fleet_bulk_quote_form:"Filo teklif formu",
  };
  const sourceLabel=value=>sourceNames[value]||String(value||"Bilinmeyen kaynak").replace(/_/g," ");
  const typeLabel=value=>value==="whatsapp"?"WhatsApp":value==="phone"?"Telefon":value==="email"?"E-posta":value||"İletişim";
  const typeColor=value=>value==="whatsapp"?"#16a34a":value==="phone"?"#ff6000":"#2563eb";
  const shortPath=value=>{
    const raw=String(value||"/");
    try{return decodeURIComponent(raw)}catch{return raw}
  };
  const refLabel=value=>{
    if(!value)return "Doğrudan giriş";
    try{return new URL(value).hostname.replace(/^www\./,"")}catch{return String(value)}
  };
  const Metric=({label,value,icon,color,note})=><div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:13,boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"#64748b",fontWeight:800,lineHeight:1.25}}>{label}</span><span style={{fontSize:18}}>{icon}</span></div>
    <div style={{fontSize:26,fontWeight:950,color:color||"#111827",marginTop:7,lineHeight:1}}>{Number(value||0).toLocaleString("tr-TR")}</div>
    {note&&<div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>{note}</div>}
  </div>;
  const Empty=({children="Henüz veri yok."})=><div style={{padding:"24px 12px",textAlign:"center",color:"#94a3b8",fontSize:13}}>{children}</div>;
  const SectionTitle=({children,note})=><div style={{margin:"18px 2px 9px"}}><div style={{fontSize:15,fontWeight:950,color:"#111827"}}>{children}</div>{note&&<div style={{fontSize:11,color:"#64748b",marginTop:3,lineHeight:1.4}}>{note}</div>}</div>;
  const Card=({children})=><div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>{children}</div>;

  return <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:24}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
      <div><h1 style={{fontSize:21,fontWeight:950,margin:"0 0 3px",color:"#111827"}}>Site Trafiği</h1><div style={{fontSize:11,color:"#64748b"}}>{updatedAt?`Son güncelleme ${updatedAt.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}`:"Canlı veriler"}</div></div>
      <button onClick={onRefresh} disabled={refreshing} style={{minWidth:104,minHeight:42,border:"none",borderRadius:9,background:refreshing?"#fed7aa":"#ff6000",color:"#fff",fontWeight:900,fontSize:12}}>{refreshing?"Yenileniyor…":"↻ Yenile"}</button>
    </div>

    <div className="traffic-mobile-tabs" style={{position:"sticky",top:104,zIndex:30,background:"#f3f4f6",padding:"3px 0 5px",gap:5}}>
      {tabs.map(tab=><button key={tab.id} onClick={()=>setView(tab.id)} style={{minHeight:48,border:view===tab.id?"1px solid #ff6000":"1px solid #e5e7eb",borderRadius:9,background:view===tab.id?"#fff4ed":"#fff",color:view===tab.id?"#c2410c":"#64748b",fontSize:10,fontWeight:900,padding:"5px 2px"}}><span style={{display:"block",fontSize:17,marginBottom:2}}>{tab.icon}</span>{tab.label}</button>)}
    </div>

    {view!=="visitors"&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
      {[{id:"today",label:"Bugün"},{id:"7d",label:"7 Gün"},{id:"30d",label:"30 Gün"}].map(item=><button key={item.id} onClick={()=>setPeriod(item.id)} style={{minHeight:40,border:period===item.id?"none":"1px solid #dbe2ea",borderRadius:8,background:period===item.id?"#111827":"#fff",color:period===item.id?"#fff":"#475569",fontWeight:900,fontSize:12}}>{item.label}</button>)}
    </div>}

    {view==="summary"&&<>
      <div className="traffic-mobile-metrics" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}>
        <Metric label="Görüntüleme" value={views} icon="👁️" color="#ff6000" note={periodLabel}/>
        <Metric label={period==="today"?"Bugünkü ziyaretçi":"Tekil ziyaretçi"} value={unique} icon="👤" color="#2563eb" note={periodLabel}/>
        <Metric label="WhatsApp tıklaması" value={whatsapp} icon="💬" color="#16a34a" note="Mesaj sayısı değildir"/>
        <Metric label="Telefon tıklaması" value={phone} icon="📞" color="#7c3aed" note="Arama sayısı değildir"/>
      </div>

      <div style={{padding:14,borderRadius:12,border:`1px solid ${contactClicks?"#bbf7d0":"#fecaca"}`,background:contactClicks?"#f0fdf4":"#fff7f7"}}>
        <div style={{fontSize:13,fontWeight:950,color:contactClicks?"#166534":"#b91c1c"}}>{contactClicks?`${periodLabel}: ${contactClicks} iletişim tıklaması`:`${periodLabel}: iletişim tıklaması yok`}</div>
        <div style={{fontSize:11,color:contactClicks?"#15803d":"#991b1b",marginTop:4,lineHeight:1.45}}>Tekil ziyaretçiden iletişim tıklamasına geçiş: <strong>%{contactRate}</strong>. Tıklama, gerçekleşmiş mesaj veya arama anlamına gelmez.</div>
      </div>

      <SectionTitle>Satış hareketleri</SectionTitle>
      <div className="traffic-mobile-actions" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
        {[{label:"Ürün görüntüleme",value:periodActions.view_product,icon:"📦",color:"#2563eb"},{label:"Sepete ekleme",value:periodActions.add_to_cart,icon:"🛒",color:"#ff6000"},{label:"Ödeme başlangıcı",value:periodActions.begin_checkout,icon:"💳",color:"#7c3aed"},{label:"PayTR yönlendirme",value:periodActions.payment_redirect,icon:"✅",color:"#15803d"}].map(item=><div key={item.label} style={{padding:12,background:"#fff",border:"1px solid #e5e7eb",borderRadius:10}}><div style={{fontSize:11,color:"#64748b",fontWeight:800}}>{item.icon} {item.label}</div><div style={{fontSize:22,fontWeight:950,color:item.color,marginTop:5}}>{Number(item.value||0).toLocaleString("tr-TR")}</div></div>)}
      </div>

      {period!=="today"&&<><SectionTitle>Günlük trafik</SectionTitle><Card><div style={{height:150,display:"flex",alignItems:"flex-end",gap:period==="30d"?2:7,padding:"16px 12px 8px"}}>{trafficRows.map((row,index)=>{const height=Math.max(4,(Number(row.views||0)/maxViews)*112);const uniqueHeight=Math.max(2,(Number(row.unique||0)/maxViews)*112);return <div key={row.date} title={`${row.date}: ${row.views} görüntüleme, ${row.unique} tekil`} style={{flex:1,height:120,display:"flex",alignItems:"flex-end",position:"relative"}}><div style={{width:"100%",height,borderRadius:"4px 4px 1px 1px",background:"#ff6000",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",left:0,right:0,bottom:0,height:uniqueHeight,background:"#fed7aa"}}/></div></div>})}</div><div style={{display:"flex",justifyContent:"space-between",padding:"0 12px 12px",fontSize:10,color:"#94a3b8"}}><span>{trafficRows[0]?.date?.slice(5)}</span><span>Turuncu: görüntüleme</span><span>{trafficRows[trafficRows.length-1]?.date?.slice(5)}</span></div></Card></>}

      <SectionTitle note="Bir önceki adıma göre ilerleme">Satış hunisi</SectionTitle>
      <Card>{[
        {label:"Ürün görüntüleme",value:periodActions.view_product,color:"#2563eb"},
        {label:"Sepete ekleme",value:periodActions.add_to_cart,color:"#ff6000"},
        {label:"Ödeme başlangıcı",value:periodActions.begin_checkout,color:"#7c3aed"},
        {label:"Teslimat bilgileri",value:periodActions.checkout_contact,color:"#0f766e"},
        {label:"PayTR yönlendirme",value:periodActions.payment_redirect,color:"#15803d"},
      ].map((stage,index,rows)=>{const previous=index?Number(rows[index-1].value||0):Number(stage.value||0);const rate=index?(previous?Math.min(100,(Number(stage.value||0)/previous)*100):0):100;return <div key={stage.label} style={{padding:"12px 14px",borderBottom:index<rows.length-1?"1px solid #f1f5f9":"none"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><span style={{fontSize:12,fontWeight:850,color:"#334155"}}>{stage.label}</span><span style={{fontSize:16,fontWeight:950,color:stage.color}}>{Number(stage.value||0).toLocaleString("tr-TR")}{index>0&&<small style={{fontSize:10,color:"#64748b",marginLeft:6}}>%{rate.toFixed(1)}</small>}</span></div><div style={{height:5,borderRadius:9,background:"#e2e8f0",marginTop:7,overflow:"hidden"}}><div style={{width:`${rate}%`,height:"100%",background:stage.color,borderRadius:9}}/></div></div>})}</Card>
    </>}

    {view==="contacts"&&<>
      <div className="traffic-mobile-metrics" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}>
        <Metric label="WhatsApp" value={whatsapp} icon="💬" color="#16a34a"/>
        <Metric label="Telefon" value={phone} icon="📞" color="#7c3aed"/>
        <Metric label="E-posta" value={email} icon="✉️" color="#2563eb"/>
        <Metric label="İletişim oranı" value={contactRate} icon="%" color="#ff6000" note="Tekil ziyaretçiye göre"/>
      </div>
      <SectionTitle note="Kaynak toplamları son 7 gündür">En çok dönüş getiren yerler</SectionTitle>
      <Card>{!leadData?.topSources?.length?<Empty/>:leadData.topSources.map((row,index)=><div key={`${row.type}-${row.source}-${index}`} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",padding:"12px 14px",borderBottom:index<leadData.topSources.length-1?"1px solid #f1f5f9":"none"}}><div><div style={{fontSize:12,fontWeight:900,color:typeColor(row.type)}}>{typeLabel(row.type)}</div><div style={{fontSize:11,color:"#64748b",marginTop:3,textTransform:"capitalize"}}>{sourceLabel(row.source)}</div></div><div style={{minWidth:34,height:34,borderRadius:10,display:"grid",placeItems:"center",background:"#f8fafc",fontSize:15,fontWeight:950,color:"#111827"}}>{Number(row.count||0)}</div></div>)}</Card>
      <SectionTitle>Son iletişim hareketleri</SectionTitle>
      <Card>{!leadData?.recent?.length?<Empty/>:leadData.recent.slice(0,20).map((row,index)=>{const date=row.at?new Date(row.at):null;const detail=[row.code&&`Kod: ${row.code}`,row.vehicle&&`Araç: ${row.vehicle}`,row.note].filter(Boolean).join(" • ");return <div key={index} style={{padding:"12px 14px",borderBottom:index<Math.min(20,leadData.recent.length)-1?"1px solid #f1f5f9":"none"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><span style={{fontSize:12,fontWeight:950,color:typeColor(row.type)}}>{typeLabel(row.type)}</span><span style={{fontSize:10,color:"#94a3b8"}}>{date?date.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"-"}</span></div><div style={{fontSize:11,color:"#475569",marginTop:5,overflowWrap:"anywhere"}}>{shortPath(row.path)}</div>{detail&&<div style={{fontSize:11,color:"#111827",fontWeight:700,marginTop:5,lineHeight:1.4}}>{detail}</div>}</div>})}</Card>
    </>}

    {view==="pages"&&<>
      <SectionTitle note="Son 7 gün">En çok ziyaret edilen sayfalar</SectionTitle>
      <Card>{!data?.topPaths?.length?<Empty/>:data.topPaths.map((row,index)=><div key={`${row.path}-${index}`} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",padding:"12px 14px",borderBottom:index<data.topPaths.length-1?"1px solid #f1f5f9":"none"}}><div style={{fontSize:11,color:"#334155",fontWeight:750,overflowWrap:"anywhere",paddingRight:6}}>{shortPath(row.path)}</div><div style={{minWidth:38,textAlign:"right",fontSize:16,fontWeight:950,color:"#ff6000"}}>{Number(row.count||0)}</div></div>)}</Card>
      <SectionTitle note="Son 7 gün">En çok sepete eklenen ürünler</SectionTitle>
      <Card>{!actions.topProducts?.add_to_cart?.length?<Empty/>:actions.topProducts.add_to_cart.slice(0,10).map((row,index)=><div key={`${row.productId}-${index}`} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"12px 14px",borderBottom:index<Math.min(10,actions.topProducts.add_to_cart.length)-1?"1px solid #f1f5f9":"none"}}><div><div style={{fontSize:12,fontWeight:900,color:"#111827",lineHeight:1.35}}>{row.name||row.productId||"Ürün"}</div><div style={{fontSize:10,color:"#64748b",marginTop:3}}>{row.sku?`Stok kodu: ${row.sku}`:""}</div></div><div style={{fontSize:17,fontWeight:950,color:"#ff6000"}}>{Number(row.count||0)}</div></div>)}</Card>
      <SectionTitle>Son sepet ve favori hareketleri</SectionTitle>
      <Card>{!actions.recent?.length?<Empty/>:actions.recent.slice(0,20).map((row,index)=>{const date=row.at?new Date(row.at):null;return <div key={index} style={{padding:"12px 14px",borderBottom:index<Math.min(20,actions.recent.length)-1?"1px solid #f1f5f9":"none"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{fontSize:11,fontWeight:950,color:row.type==="favorite"?"#e11d48":"#ff6000"}}>{row.type==="favorite"?"♥ Favori":"🛒 Sepet"}</span><span style={{fontSize:10,color:"#94a3b8"}}>{date?date.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"-"}</span></div><div style={{fontSize:12,fontWeight:850,color:"#334155",marginTop:5,lineHeight:1.35}}>{row.name||row.sku||row.productId||"Ürün"}</div><div style={{fontSize:10,color:"#64748b",marginTop:4,overflowWrap:"anywhere"}}>{shortPath(row.path)}</div></div>})}</Card>
    </>}

    {view==="visitors"&&<>
      <div style={{padding:12,borderRadius:10,background:"#eff6ff",border:"1px solid #bfdbfe",fontSize:11,color:"#1e40af",lineHeight:1.45}}>Son ziyaretler burada görünür. Aynı kişinin farklı sayfalara geçişleri ayrı hareket olarak listelenebilir.</div>
      {vLoading&&!visitors.length?<Empty>Yükleniyor…</Empty>:!visitors.length?<Empty/>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{visitors.map((row,index)=>{const date=row.at?new Date(row.at):null;return <div key={index} style={{padding:13,background:"#fff",border:"1px solid #e5e7eb",borderRadius:11}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><div style={{fontSize:12,fontWeight:950,color:"#111827"}}>📍 {row.city||row.region||row.country||"Konum bilinmiyor"}</div><div style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>{date?date.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"-"}</div></div><div style={{fontSize:11,color:"#334155",fontWeight:750,marginTop:7,overflowWrap:"anywhere"}}>{shortPath(row.path)}</div><div style={{fontSize:10,color:"#64748b",marginTop:5}}>Kaynak: {refLabel(row.ref)}</div></div>})}</div>}
    </>}
  </div>;
}

function ATraffic(){
  const {isMobile}=use$();
  const [data,setData]=useState(null);
  const [leadData,setLeadData]=useState(null);
  const [err,setErr]=useState("");
  const [visitors,setVisitors]=useState([]);
  const [vLoading,setVLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [updatedAt,setUpdatedAt]=useState(null);
  const refreshVisitors=()=>{
    setVLoading(true);
    fetch("/api/admin/traffic-visitors?limit=200",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setVisitors(d.visitors||[]);
    }).catch(()=>{}).finally(()=>setVLoading(false));
  };
  const loadAll=async()=>{
    setRefreshing(true); setErr(""); setVLoading(true);
    try{
      const [traffic,leads,visitorData]=await Promise.all([
        fetch("/api/admin/traffic",{credentials:"include"}).then(r=>r.json()),
        fetch("/api/admin/leads",{credentials:"include"}).then(r=>r.json()),
        fetch("/api/admin/traffic-visitors?limit=200",{credentials:"include"}).then(r=>r.json()),
      ]);
      if(traffic.error) throw new Error(traffic.error);
      setData(traffic);
      if(!leads.error) setLeadData(leads);
      setVisitors(visitorData.visitors||[]);
      setUpdatedAt(new Date());
    }catch(e){setErr(e.message||"Trafik verileri yüklenemedi")}finally{setRefreshing(false);setVLoading(false)}
  };
  useEffect(()=>{
    loadAll();
  },[]);
  if(err) return <div style={{padding:20,color:"#dc2626"}}>⚠ {err}</div>;
  if(!data) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;

  const last7Views = data.chart.slice(-7).reduce((s,c)=>s+c.views,0);
  const last7Unique = data.chart.slice(-7).reduce((s,c)=>s+c.unique,0);
  const max = Math.max(...data.chart.map(c=>c.views), 1);
  const whatsappLeads = leadData?.totals?.whatsapp || 0;
  const phoneLeads = leadData?.totals?.phone || 0;
  const emailLeads = leadData?.totals?.email || 0;
  const productActions = data.productActions || {};
  const cartAdds = productActions.totals?.add_to_cart || 0;
  const favoriteAdds = productActions.totals?.favorite || 0;
  const cartAddsToday = productActions.today?.add_to_cart || 0;
  const favoriteAddsToday = productActions.today?.favorite || 0;
  const cartAdds7 = productActions.last7?.add_to_cart || 0;
  const favoriteAdds7 = productActions.last7?.favorite || 0;
  const funnelCounts = {
    viewed: productActions.totals?.view_product || 0,
    cart: productActions.totals?.add_to_cart || 0,
    checkout: productActions.totals?.begin_checkout || 0,
    contact: productActions.totals?.checkout_contact || 0,
    redirect: productActions.totals?.payment_redirect || 0,
    errors: productActions.totals?.payment_error || 0,
  };
  const funnelRate = (value, base) => base > 0 ? `%${((value / base) * 100).toFixed(1)}` : "-";

  if(isMobile) return <MobileTrafficPanel data={data} leadData={leadData} visitors={visitors} vLoading={vLoading} onRefresh={loadAll} refreshing={refreshing} updatedAt={updatedAt}/>;

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Stats cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
      {[
        {label:"Toplam Sayfa Görüntüleme (30g)",val:data.totalViews,icon:"👁"},
        {label:"Toplam Tekil Ziyaretçi (30g)",val:data.totalUnique,icon:"👤"},
        {label:"Görüntüleme (7g)",val:last7Views,icon:"📊"},
        {label:"Tekil Ziyaretçi (7g)",val:last7Unique,icon:"📈"},
        {label:"WhatsApp Tiklamasi (30g)",val:whatsappLeads,icon:"WA"},
        {label:"Telefon Tiklamasi (30g)",val:phoneLeads,icon:"TEL"},
        {label:"E-posta Tiklamasi (30g)",val:emailLeads,icon:"MAIL"},
        {label:"Bugun Sepete Eklenen",val:cartAddsToday,icon:"CART"},
        {label:"Bugun Favoriye Eklenen",val:favoriteAddsToday,icon:"FAV"},
        {label:"Sepete Eklenen Urun (7g)",val:cartAdds7,icon:"CART"},
        {label:"Favoriye Eklenen Urun (7g)",val:favoriteAdds7,icon:"FAV"},
        {label:"Sepete Eklenen Urun (30g)",val:cartAdds,icon:"CART"},
        {label:"Favoriye Eklenen Urun (30g)",val:favoriteAdds,icon:"FAV"},
      ].map((s,i)=>(
        <div key={i} style={{padding:16,background:"#fff",border:"1px solid #eee",borderRadius:10}}>
          <div style={{fontSize:12,color:"#888",marginBottom:6}}>{s.label}</div>
          <div style={{fontSize:24,fontWeight:800,color:"#1a1a1a"}}>{s.icon} {Number(s.val).toLocaleString("tr-TR")}</div>
        </div>
      ))}
    </div>

    <ACard title="Satış Hunisi (son 30 gün)">
      <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:12}}>Aynı oturumdaki tekrarlar süzülür. Böylece ziyaretçinin ürün, sepet ve ödeme adımlarından hangisinde düştüğü görünür.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
        {[
          {label:"Ürün görüntüleme",value:funnelCounts.viewed,rate:"Başlangıç",color:"#2563eb"},
          {label:"Sepete ekleme",value:funnelCounts.cart,rate:funnelRate(funnelCounts.cart,funnelCounts.viewed),color:"#ff6000"},
          {label:"Ödeme başlangıcı",value:funnelCounts.checkout,rate:funnelRate(funnelCounts.checkout,funnelCounts.cart),color:"#7c3aed"},
          {label:"Teslimat tamamlandı",value:funnelCounts.contact,rate:funnelRate(funnelCounts.contact,funnelCounts.checkout),color:"#0f766e"},
          {label:"PayTR yönlendirme",value:funnelCounts.redirect,rate:funnelRate(funnelCounts.redirect,funnelCounts.contact),color:"#15803d"},
          {label:"Ödeme hatası",value:funnelCounts.errors,rate:funnelRate(funnelCounts.errors,funnelCounts.checkout),color:"#dc2626"},
        ].map(stage => (
          <div key={stage.label} style={{padding:13,border:"1px solid #e5e7eb",borderRadius:8,background:"#fff"}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:5}}>{stage.label}</div>
            <div style={{fontSize:22,fontWeight:950,color:stage.color}}>{Number(stage.value).toLocaleString("tr-TR")}</div>
            <div style={{fontSize:11,fontWeight:900,color:"#475569",marginTop:4}}>{stage.rate}</div>
          </div>
        ))}
      </div>
    </ACard>

    {/* Daily chart */}
    <ACard title="Son 30 Gün — Günlük Trafik">
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:180,padding:"8px 0",borderBottom:"1px solid #eee"}}>
        {data.chart.map(c=>{
          const h = max > 0 ? (c.views/max)*160 : 0;
          const uh = max > 0 ? (c.unique/max)*160 : 0;
          return <div key={c.date} style={{flex:1,display:"flex",flexDirection:"column-reverse",alignItems:"center",position:"relative"}} title={`${c.date}\n${c.views} görüntüleme\n${c.unique} tekil`}>
            <div style={{width:"70%",height:h,background:"linear-gradient(to top,#ff6000,#ff8c00)",borderRadius:"2px 2px 0 0",position:"relative"}}>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:uh,background:"#ffd699",borderRadius:"2px 2px 0 0"}}/>
            </div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#888",marginTop:6}}>
        <span>{data.chart[0]?.date}</span>
        <span>{data.chart[Math.floor(data.chart.length/2)]?.date}</span>
        <span>{data.chart[data.chart.length-1]?.date}</span>
      </div>
      <div style={{display:"flex",gap:14,marginTop:10,fontSize:12,color:"#666"}}>
        <span><span style={{display:"inline-block",width:10,height:10,background:"#ff6000",marginRight:4,borderRadius:2,verticalAlign:"middle"}}/>Görüntüleme</span>
        <span><span style={{display:"inline-block",width:10,height:10,background:"#ffd699",marginRight:4,borderRadius:2,verticalAlign:"middle"}}/>Tekil ziyaretçi</span>
      </div>
    </ACard>

    {productActions && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <ACard title="Sepet ve Favori Takibi">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {[
            {title:"En Cok Sepete Eklenen",rows:productActions.topProducts?.add_to_cart || [],color:"#ff6000"},
            {title:"En Cok Favoriye Eklenen",rows:productActions.topProducts?.favorite || [],color:"#e11d48"},
          ].map(section=>(
            <div key={section.title} style={{border:"1px solid #eef0f3",borderRadius:8,overflow:"hidden"}}>
              <div style={{padding:"10px 12px",background:"#f8fafc",fontSize:12,fontWeight:900,color:section.color}}>{section.title}</div>
              {!section.rows.length ? <div style={{padding:12,color:"#999",fontSize:12}}>Henuz kayit yok.</div> :
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <tbody>{section.rows.slice(0,8).map((row,i)=>(
                  <tr key={`${section.title}-${row.productId}-${i}`} style={{borderTop:"1px solid #f1f5f9"}}>
                    <td style={{padding:"8px",fontSize:11,overflowWrap:"anywhere"}}>
                      <div style={{fontWeight:800,color:"#111827"}}>{row.name || row.productId || "-"}</div>
                      <div style={{fontFamily:"monospace",color:"#64748b",marginTop:2}}>{row.sku || row.productId || "-"}</div>
                    </td>
                    <td style={{padding:"8px",textAlign:"right",fontWeight:900,color:section.color}}>{Number(row.count||0).toLocaleString("tr-TR")}</td>
                  </tr>
                ))}</tbody>
              </table>}
            </div>
          ))}
        </div>
      </ACard>
      <ACard title="Son Sepet / Favori Hareketleri">
        {!productActions.recent?.length ? <div style={{color:"#999",fontSize:13}}>Henuz sepet veya favori kaydi yok.</div> :
        <div style={{maxHeight:300,overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"2px solid #eee"}}>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Zaman</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Islem</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Urun</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Konum / Sayfa</th>
              <th style={{padding:"8px",textAlign:"right",color:"#999"}}>Adet</th>
              <th style={{padding:"8px",textAlign:"right",color:"#999"}}>Tutar</th>
            </tr></thead>
            <tbody>{productActions.recent.slice(0,30).map((row,i)=>{
              const d = row.at ? new Date(row.at) : null;
              const when = d ? d.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "-";
              const productLabel = [row.name, row.sku && `SKU: ${row.sku}`].filter(Boolean).join(" | ") || row.productId || "-";
              const typeLabel = row.type === "favorite" ? "Favori" : row.type === "add_to_cart" ? "Sepet" : row.type;
              const locationLabel = [row.city || row.country, row.path].filter(Boolean).join(" | ") || "-";
              return <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
                <td style={{padding:"8px",whiteSpace:"nowrap",color:"#666"}}>{when}</td>
                <td style={{padding:"8px",fontWeight:900,color:row.type==="favorite"?"#e11d48":"#ff6000"}}>{typeLabel}</td>
                <td style={{padding:"8px",maxWidth:360,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={productLabel}>{productLabel}</td>
                <td style={{padding:"8px",maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:11,color:"#64748b"}} title={locationLabel}>{locationLabel}</td>
                <td style={{padding:"8px",textAlign:"right",fontWeight:700}}>{Number(row.qty||1).toLocaleString("tr-TR")}</td>
                <td style={{padding:"8px",textAlign:"right",fontWeight:700}}>{Number(row.value||0).toLocaleString("tr-TR")} TL</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </ACard>
    </div>}

    {leadData && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      <ACard title="Iletisim Tiklama Kaynaklari (son 7 gun)">
        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:10}}>Bu tablo mesaj/arama garantisi degil; WhatsApp veya telefon linkine tiklamayi gosterir.</div>
        {!leadData.topSources?.length ? <div style={{color:"#999",fontSize:13}}>Henuz tiklama kaydi yok.</div> :
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"2px solid #eee"}}>
            <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Tip</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Kaynak</th>
            <th style={{padding:"8px",textAlign:"right",color:"#999"}}>Adet</th>
          </tr></thead>
          <tbody>{leadData.topSources.map((row,i)=>(
            <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
              <td style={{padding:"8px",fontWeight:700,color:row.type==="whatsapp"?"#16a34a":row.type==="phone"?"#ff6000":"#555"}}>{row.type}</td>
              <td style={{padding:"8px",fontFamily:"monospace",fontSize:11,overflowWrap:"anywhere"}}>{row.source}</td>
              <td style={{padding:"8px",textAlign:"right",fontWeight:800}}>{Number(row.count||0).toLocaleString("tr-TR")}</td>
            </tr>
          ))}</tbody>
        </table>}
      </ACard>
      <ACard title="Son Iletisim Tiklamalari">
        {!leadData.recent?.length ? <div style={{color:"#999",fontSize:13}}>Henuz kayit yok.</div> :
        <div style={{maxHeight:260,overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"2px solid #eee"}}>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Zaman</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Tip</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Sayfa</th>
              <th style={{padding:"8px",textAlign:"left",color:"#999"}}>Talep Detayi</th>
            </tr></thead>
            <tbody>{leadData.recent.slice(0,20).map((row,i)=>{
              const d = row.at ? new Date(row.at) : null;
              const when = d ? d.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "-";
              const detail = [row.contactPhone && `Tel: ${row.contactPhone}`, row.code && `Kod: ${row.code}`, row.vehicle && `Arac: ${row.vehicle}`, row.note && `Not: ${row.note}`].filter(Boolean).join(" | ");
              return <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
                <td style={{padding:"8px",whiteSpace:"nowrap",color:"#666"}}>{when}</td>
                <td style={{padding:"8px",fontWeight:700}}>{row.type}</td>
                <td style={{padding:"8px",fontFamily:"monospace",fontSize:11,maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={row.path}>{row.path || "/"}</td>
                <td style={{padding:"8px",fontSize:11,color:detail?"#111827":"#999",maxWidth:320,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={detail}>{detail || "-"}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </ACard>
    </div>}

    {/* Top paths */}
    <ACard title="En Çok Ziyaret Edilen Sayfalar (son 7 gün)">
      {data.topPaths.length===0?<div style={{color:"#999",fontSize:13}}>Henüz veri yok.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{borderBottom:"2px solid #eee"}}>
          <th style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999"}}>Sayfa</th>
          <th style={{padding:"8px",textAlign:"right",fontSize:12,color:"#999"}}>Görüntüleme</th>
        </tr></thead>
        <tbody>{data.topPaths.map((p,i)=>(
          <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
            <td style={{padding:"8px",fontFamily:"monospace",fontSize:12}}>{p.path}</td>
            <td style={{padding:"8px",textAlign:"right",fontWeight:600}}>{p.count.toLocaleString("tr-TR")}</td>
          </tr>
        ))}</tbody>
      </table>}
    </ACard>

    {/* Son ziyaretçiler */}
    <ACard title={`Son Ziyaretçiler (${visitors.length})`} action={<ABtn onClick={refreshVisitors}>{vLoading?"...":"↻ Yenile"}</ABtn>}>
      {vLoading && visitors.length===0 ? <div style={{color:"#999",fontSize:13}}>Yükleniyor…</div> :
       visitors.length===0 ? <div style={{color:"#999",fontSize:13}}>Henüz ziyaret kaydı yok.</div> :
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"2px solid #eee"}}>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600,whiteSpace:"nowrap"}}>Zaman</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600}}>IP</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600}}>Şehir / Bölge</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600}}>Ülke</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600}}>Sayfa</th>
            <th style={{padding:"8px",textAlign:"left",color:"#999",fontWeight:600}}>Yönlendiren</th>
          </tr></thead>
          <tbody>{visitors.map((v,i)=>{
            const d = v.at ? new Date(v.at) : null;
            const when = d ? d.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";
            return <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
              <td style={{padding:"8px",whiteSpace:"nowrap",color:"#666"}}>{when}</td>
              <td style={{padding:"8px",fontFamily:"monospace",fontSize:11}}>{v.ip||"—"}</td>
              <td style={{padding:"8px"}}>{v.city ? `${v.city}${v.region?` / ${v.region}`:""}` : "—"}</td>
              <td style={{padding:"8px"}}>{v.country||"—"}</td>
              <td style={{padding:"8px",fontFamily:"monospace",fontSize:11,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v.path}>{v.path||"/"}</td>
              <td style={{padding:"8px",color:"#888",fontSize:11}}>{v.ref||"—"}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </ACard>
  </div>;
}

function ADigitalMarketing(){
  const [data,setData]=useState({dashboard:null,traffic:null,leads:null,feeds:null});
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState("");

  async function readTextStatus(url){
    try{
      const r = await fetch(url, {cache:"no-store"});
      const text = await r.text();
      return {
        url,
        status: r.status,
        ok: r.ok,
        length: text.length,
        urlCount: (text.match(/<url>/g) || []).length,
        hasSitemap: text.toLowerCase().includes("sitemap"),
      };
    }catch(e){
      return {url,status:"ERR",ok:false,length:0,error:e.message};
    }
  }

  async function load(){
    setLoading(true); setErr("");
    try{
      const [dashboard, traffic, leads, sitemap, robots, merchant, meta] = await Promise.all([
        fetch("/api/admin/dashboard",{credentials:"include"}).then(r=>r.json()),
        fetch("/api/admin/traffic",{credentials:"include"}).then(r=>r.json()),
        fetch("/api/admin/leads",{credentials:"include"}).then(r=>r.json()),
        readTextStatus("/sitemap.xml"),
        readTextStatus("/robots.txt"),
        readTextStatus("/google-merchant-feed.xml"),
        readTextStatus("/meta-catalog-feed.csv"),
      ]);
      if(dashboard?.error) throw new Error(dashboard.error);
      if(traffic?.error) throw new Error(traffic.error);
      setData({dashboard,traffic,leads,feeds:{sitemap,robots,merchant,meta}});
    }catch(e){
      setErr(e.message || "Dijital pazarlama verileri yuklenemedi");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{load()},[]);

  async function copyText(id, text){
    try{
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(()=>setCopied(""),1800);
    }catch{
      setCopied("kopyalanamadi");
      setTimeout(()=>setCopied(""),1800);
    }
  }

  if(loading) return <div style={{padding:20,color:"#999"}}>Dijital pazarlama paneli yukleniyor...</div>;
  if(err) return <div style={{padding:20,color:"#dc2626"}}>⚠ {err}</div>;

  const stats = data.dashboard?.stats || {};
  const traffic = data.traffic || {};
  const leadTotals = data.leads?.totals || {};
  const totalContactClicks = Number(leadTotals.whatsapp||0) + Number(leadTotals.phone||0) + Number(leadTotals.email||0);
  const totalUnique = Number(traffic.totalUnique || 0);
  const contactClickRate = totalUnique ? ((totalContactClicks / totalUnique) * 100).toFixed(1) : "0.0";
  const orderRate = totalUnique ? ((Number(stats.paidOrders||0) / totalUnique) * 100).toFixed(1) : "0.0";
  const last7Views = (traffic.chart || []).slice(-7).reduce((s,c)=>s+Number(c.views||0),0);
  const last7Unique = (traffic.chart || []).slice(-7).reduce((s,c)=>s+Number(c.unique||0),0);
  const topPath = traffic.topPaths?.[0];
  const topLead = data.leads?.topSources?.[0];
  const recentLead = data.leads?.recent?.[0];
  const feedRows = [
    {name:"Sitemap",...data.feeds?.sitemap, note:data.feeds?.sitemap?.urlCount ? `${data.feeds.sitemap.urlCount} URL` : ""},
    {name:"Robots",...data.feeds?.robots, note:data.feeds?.robots?.hasSitemap ? "Sitemap var" : ""},
    {name:"Google Merchant",...data.feeds?.merchant, note:"Alisveris feed"},
    {name:"Meta Katalog",...data.feeds?.meta, note:"Facebook/Instagram katalog"},
  ];
  const todayTasks = [
    "Google Ads'te kampanya bitis tarihi ve toplam butceyi kontrol et; bitmis kampanya trafik getirmez.",
    "Google Ads panelinde reklam engelleyici uyarisi varsa kapat; panel metrikleri ve kaydetme islemleri aksayabilir.",
    "Search Console'da ilk 20 para getiren landing/product URL icin dizine ekleme iste.",
    "Merchant Center urun sorunlarini kontrol et; reddedilen urun varsa baslik, gorsel, fiyat ve stok alanini duzelt.",
    "Facebook'ta sadece alakali 2-4 agir vasita/yedek parca grubunda gruba ozel, tekrar etmeyen post paylas.",
    "WhatsApp'a gelen her kod/foto icin 5 dakika icinde fiyat + uyum teyidi cevabi ver.",
    "Google Ads'te genis esleme yerine Axor, Actros, Tourismo, BPW, SAF, Krone + parca adina odaklan.",
  ];
  const landingLinks = [
    {label:"Axor 1840 Balata",url:"/axor-1840-balata"},
    {label:"Axor 1840 Fren Diski",url:"/axor-1840-fren-diski"},
    {label:"Axor 3340 Balata",url:"/axor-3340-balata"},
    {label:"Actros Axor Fren Diski",url:"/mercedes-actros-axor-fren-diski"},
    {label:"Tourismo Fren Diski",url:"/tourismo-fren-diski"},
    {label:"Travego Balata",url:"/travego-balata"},
    {label:"MAN Fortuna Balata",url:"/man-fortuna-balata"},
    {label:"BPW 30K Bijon",url:"/bpw-30k-bijon"},
    {label:"BPW 30K Kampana",url:"/bpw-30k-kampana"},
    {label:"Krone Dorse Kampana",url:"/krone-dorse-kampana"},
    {label:"Kogel Dorse Fren Diski",url:"/kogel-dorse-fren-diski"},
  ];
  const snippets = [
    {
      id:"facebook",
      title:"Facebook grup postu",
      text:"Tir, kamyon, otobus ve dorse fren parcasi icin Frenciniz.com\\n\\nFren diski, kampana, balata, bijon, porya, fren circiri, kaliper, ABS/EBS ve suspansiyon korugu sorabilirsiniz. OEM kodu, sase no veya eski parca fotografi ile uyumluluk teyidi yapiyoruz.\\n\\nSite: https://www.frenciniz.com/",
    },
    {
      id:"whatsapp",
      title:"WhatsApp hizli cevap",
      text:"Merhaba, yardimci olalim. Aracin marka/modeli, sase no veya eski parca uzerindeki OEM/parca kodunu gonderir misiniz? Uyum, stok ve guncel fiyat bilgisini hemen kontrol edelim.",
    },
    {
      id:"ads",
      title:"Google Ads kelime seti",
      text:"axor 1840 fren diski\\naxor 3340 balata\\nactros fren diski\\ntourismo fren diski\\nman fortuna balata\\nbpw 30k bijon\\nkrone dorse kampana\\nkogel dorse fren diski\\nsaf dorse kampana\\nfren korugu 30/30",
    },
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 6px"}}>Dijital Pazarlama</h1>
        <div style={{fontSize:13,color:"#666",lineHeight:1.55}}>Google SEO, Merchant, Meta katalog, Facebook gruplari ve WhatsApp satis akisinin tek ekrani.</div>
      </div>
      <ABtn onClick={load}>↻ Verileri Yenile</ABtn>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
      {[
        {label:"30g Goruntuleme",value:traffic.totalViews||0,color:"#ff6000"},
        {label:"30g Tekil",value:traffic.totalUnique||0,color:"#2563eb"},
        {label:"7g Goruntuleme",value:last7Views,color:"#7c3aed"},
        {label:"7g Tekil",value:last7Unique,color:"#0f766e"},
        {label:"Iletisim Tiklamasi",value:totalContactClicks,color:"#16a34a"},
        {label:"Tiklama Orani",value:`%${contactClickRate}`,color:"#059669"},
        {label:"Odenmis Siparis",value:stats.paidOrders||0,color:"#111827"},
        {label:"Siparis Orani",value:`%${orderRate}`,color:"#b45309"},
      ].map(k=>(
        <div key={k.label} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:16}}>
          <div style={{fontSize:12,color:"#777",marginBottom:7}}>{k.label}</div>
          <div style={{fontSize:25,fontWeight:850,color:k.color}}>{typeof k.value==="number"?Number(k.value).toLocaleString("tr-TR"):k.value}</div>
        </div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:16}}>
      <ACard title="Kanal Sagligi">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {feedRows.map(row=>(
            <div key={row.name} style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}>
              <div>
                <div style={{fontSize:13,fontWeight:800}}>{row.name}</div>
                <div style={{fontSize:11,color:"#888"}}>{row.note || row.url}</div>
              </div>
              <span style={{padding:"5px 9px",borderRadius:999,fontSize:12,fontWeight:800,background:row.ok?"#dcfce7":"#fee2e2",color:row.ok?"#166534":"#991b1b"}}>{row.status}</span>
            </div>
          ))}
        </div>
      </ACard>

      <ACard title="Satis Hunisi">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{padding:12,border:"1px solid #eee",borderRadius:8,background:"#fafafa"}}>
            <div style={{fontSize:11,color:"#777",marginBottom:5}}>WhatsApp</div>
            <strong style={{fontSize:22,color:"#16a34a"}}>{Number(leadTotals.whatsapp||0).toLocaleString("tr-TR")}</strong>
          </div>
          <div style={{padding:12,border:"1px solid #eee",borderRadius:8,background:"#fafafa"}}>
            <div style={{fontSize:11,color:"#777",marginBottom:5}}>Telefon</div>
            <strong style={{fontSize:22,color:"#ff6000"}}>{Number(leadTotals.phone||0).toLocaleString("tr-TR")}</strong>
          </div>
          <div style={{gridColumn:"1 / -1",padding:12,border:"1px solid #eee",borderRadius:8,background:"#fff"}}>
            <div style={{fontSize:12,color:"#666",lineHeight:1.55}}>En cok ziyaret edilen sayfa: <strong>{topPath?.path || "veri yok"}</strong></div>
            <div style={{fontSize:12,color:"#666",lineHeight:1.55}}>En iyi tiklama kaynagi: <strong>{topLead ? `${topLead.type} / ${topLead.source}` : "veri yok"}</strong></div>
            {recentLead && <div style={{fontSize:12,color:"#666",lineHeight:1.55,marginTop:6}}>Son tiklama: <strong>{[recentLead.contactPhone, recentLead.code, recentLead.vehicle].filter(Boolean).join(" / ") || recentLead.path || "detay yok"}</strong></div>}
          </div>
        </div>
      </ACard>
    </div>

    <ACard title="Bugun Yapilacaklar">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10}}>
        {todayTasks.map((task,i)=>(
          <div key={task} style={{padding:12,border:"1px solid #eee",borderRadius:8,background:i<2?"#fff7ed":"#fff"}}>
            <div style={{fontSize:11,fontWeight:900,color:"#ff6000",marginBottom:6}}>ADIM {i+1}</div>
            <div style={{fontSize:13,color:"#333",lineHeight:1.5}}>{task}</div>
          </div>
        ))}
      </div>
    </ACard>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <ACard title="Para Getiren Landing Linkleri">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {landingLinks.map(link=>(
            <div key={link.url} style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f4f4f4"}}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:700,color:"#2563eb",textDecoration:"none"}}>{link.label}</a>
              <button onClick={()=>copyText(link.url, `${window.location.origin}${link.url}`)} style={{border:"1px solid #ddd",background:"#fff",borderRadius:6,padding:"6px 8px",fontSize:11,cursor:"pointer"}}>{copied===link.url?"Kopyalandi":"Kopyala"}</button>
            </div>
          ))}
        </div>
      </ACard>

      <ACard title="Hazir Metinler">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {snippets.map(s=>(
            <div key={s.id} style={{border:"1px solid #eee",borderRadius:8,padding:12,background:"#fafafa"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:800}}>{s.title}</div>
                <button onClick={()=>copyText(s.id,s.text)} style={{border:"none",background:"#111827",color:"#fff",borderRadius:6,padding:"7px 10px",fontSize:11,fontWeight:800,cursor:"pointer"}}>{copied===s.id?"Kopyalandi":"Kopyala"}</button>
              </div>
              <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:12,lineHeight:1.45,color:"#555",margin:0,maxHeight:126,overflow:"auto"}}>{s.text}</pre>
            </div>
          ))}
        </div>
      </ACard>
    </div>
  </div>;
}

function ACampaign(){
  const [msg,setMsg]=useState("");
  const [target,setTarget]=useState("with-phone");
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [confirm,setConfirm]=useState(false);
  const len=msg.length;
  const segments=Math.ceil(len/155)||1;
  async function send(){
    setBusy(true); setResult(null);
    try{
      const r=await fetch("/api/admin/campaign-send",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,target})});
      const d=await r.json();
      setResult(d);
    }catch(e){ setResult({error:e.message}); } finally{ setBusy(false); setConfirm(false); }
  }
  return <ACard title="Kampanya / İndirim SMS"><div style={{maxWidth:600,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:14,background:"#fff8e1",border:"1px solid #fde68a",borderRadius:8,fontSize:13,color:"#92400e",lineHeight:1.6}}>
      ⚠ <strong>İYS Uyarısı:</strong> Reklam/kampanya SMS göndermek için müşterilerden açık ticari ileti izni almanız gerekir. Onaysız ticari SMS, İYS yönetmeliğine göre cezaya tabidir. Bilgilendirme/işlem mesajları için izin gerekmez.
    </div>
    <div>
      <label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Hedef Kitle</label>
      <select value={target} onChange={e=>setTarget(e.target.value)} style={{width:"100%",padding:9,border:"1px solid #ddd",borderRadius:6,fontSize:13}}>
        <option value="with-phone">Telefon numarası olan tüm müşteriler</option>
      </select>
    </div>
    <div>
      <label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Mesaj İçeriği</label>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={5} placeholder="Frenciniz: Tum disk balata urunlerinde %15 indirim! Kupon: BAHAR15. frenciniz.com" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:6,fontSize:14,fontFamily:"inherit",resize:"vertical"}}/>
      <div style={{fontSize:11,color:"#888",marginTop:4,display:"flex",justifyContent:"space-between"}}>
        <span>{len} karakter — {segments} SMS segmenti</span>
        <span>Türkçe karakter kullanmamanız önerilir (maliyet)</span>
      </div>
    </div>
    {!confirm ? (
      <ABtn onClick={()=>setConfirm(true)} style={{background:msg.length>=10?"#ff6000":"#ddd",cursor:msg.length>=10?"pointer":"not-allowed"}} disabled={msg.length<10}>📢 Gönder</ABtn>
    ) : (
      <div style={{padding:14,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:"#991b1b"}}>Bu mesaj telefonu olan TÜM müşterilere gönderilecek. Onaylıyor musun?</div>
        <div style={{display:"flex",gap:8}}>
          <ABtn onClick={send} disabled={busy} style={{background:busy?"#999":"#dc2626"}}>{busy?"Gönderiliyor...":"Evet, Gönder"}</ABtn>
          <ABtn onClick={()=>setConfirm(false)} style={{background:"#666"}}>İptal</ABtn>
        </div>
      </div>
    )}
    {result && (result.error
      ? <div style={{padding:12,background:"#fee2e2",borderRadius:6,fontSize:13,color:"#dc2626"}}>⚠ {result.error}</div>
      : <div style={{padding:14,background:"#dcfce7",borderRadius:8,fontSize:13,color:"#166534"}}>
          ✓ {result.sent}/{result.total} müşteriye SMS gönderildi.
          {result.failed>0 && <div style={{marginTop:6,color:"#92400e"}}>{result.failed} adet hata.</div>}
        </div>
    )}
  </div></ACard>;
}

function ASettingsCfg(){
  const {socialMedia, setSocialMedia} = use$();
  const [s,setS]=useState({siteName:"Frenciniz",phone:"",email:"",address:"",freeShippingLimit:500,social:{facebook:"",instagram:"",twitter:"",youtube:""}});
  const [ok,setOk]=useState(false);
  useEffect(()=>{
    fetch("/api/admin/settings",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.settings){
        setS(p=>({...p,...d.settings,social:{...p.social,...(d.settings.social||{})}}));
        if(d.settings.social) setSocialMedia(d.settings.social);
      }
    });
  },[]);
  async function save(){
    const payload={...s,social:s.social};
    await fetch("/api/admin/settings",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    setSocialMedia(s.social);
    setOk(true); setTimeout(()=>setOk(false),2000);
  }
  return <ACard title="Site Ayarları"><div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:14}}>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Site Adı</label><AIn value={s.siteName} onChange={e=>setS({...s,siteName:e.target.value})}/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Telefon</label><AIn value={s.phone} onChange={e=>setS({...s,phone:e.target.value})}/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>E-posta</label><AIn value={s.email} onChange={e=>setS({...s,email:e.target.value})}/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Adres</label><AIn value={s.address} onChange={e=>setS({...s,address:e.target.value})}/></div>
    <div style={{borderTop:"1px solid #eee",paddingTop:14}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Sosyal Medya</div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>URL girildiğinde sitede otomatik görünür. Boş bırakılan gizlenir.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:11,color:"#888"}}>Facebook</label><AIn placeholder="https://facebook.com/..." value={s.social.facebook||""} onChange={e=>setS({...s,social:{...s.social,facebook:e.target.value}})}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>Instagram</label><AIn placeholder="https://instagram.com/..." value={s.social.instagram||""} onChange={e=>setS({...s,social:{...s.social,instagram:e.target.value}})}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>Twitter / X</label><AIn placeholder="https://x.com/..." value={s.social.twitter||""} onChange={e=>setS({...s,social:{...s.social,twitter:e.target.value}})}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>YouTube</label><AIn placeholder="https://youtube.com/..." value={s.social.youtube||""} onChange={e=>setS({...s,social:{...s.social,youtube:e.target.value}})}/></div>
      </div>
    </div>
    <div style={{borderTop:"1px solid #eee",paddingTop:14}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Ücretsiz Kargo Limiti</div>
      <AIn type="number" value={s.freeShippingLimit} onChange={e=>setS({...s,freeShippingLimit:Number(e.target.value)||0})} style={{width:150}}/><div style={{fontSize:11,color:"#999",marginTop:4}}>Bu tutarın üzerinde kargo ücretsiz.</div>
    </div>
    <ABtn onClick={save} style={{alignSelf:"flex-start"}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
  </div></ACard>;
}

function ABackupCfg(){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");
  async function exportSection(section){
    setBusy(true); setMsg("");
    try{
      const d=await fetch(`/api/admin/${section}`,{credentials:"include"}).then(r=>r.json());
      const key = Object.keys(d).find(k=>Array.isArray(d[k])) || section;
      const json = JSON.stringify(d[key]||[], null, 2);
      const blob = new Blob([json],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download=`frenciniz-${section}-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      setMsg(`${section} indirildi`);
    }catch(e){ setMsg(`Hata: ${e.message}`); }
    finally{ setBusy(false); setTimeout(()=>setMsg(""),2500); }
  }
  async function fullBackup(){
    setBusy(true); setMsg("");
    try{
      const r = await fetch("/api/admin/backup",{credentials:"include"});
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download=`frenciniz-full-backup-${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(url);
      setMsg("Tam yedek indirildi");
    }catch(e){ setMsg(`Hata: ${e.message}`); }
    finally{ setBusy(false); setTimeout(()=>setMsg(""),2500); }
  }
  const sections=[{t:"Siparişler",i:"🛒",k:"orders"},{t:"Müşteriler",i:"👥",k:"customers"},{t:"Kuponlar",i:"🎟",k:"coupons"},{t:"Bannerlar",i:"🖼",k:"banners"},{t:"İadeler",i:"↩️",k:"returns"}];
  return <ACard title="Yedekleme & Dışa Aktarım">
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
      {sections.map((x)=>(
        <div key={x.k} style={{border:"1px solid #eee",borderRadius:8,padding:20,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>{x.i}</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{x.t}</div>
          <button disabled={busy} onClick={()=>exportSection(x.k)} style={{padding:"6px 14px",border:"1px solid #ddd",borderRadius:4,background:"#fff",fontSize:12,cursor:busy?"not-allowed":"pointer"}}>JSON indir</button>
        </div>))}
    </div>
    {msg&&<div style={{padding:12,background:"#dcfce7",borderRadius:6,fontSize:13,color:"#059669",fontWeight:600,textAlign:"center",marginBottom:12}}>✓ {msg}</div>}
    <div style={{marginTop:16,padding:16,background:"#fafafa",borderRadius:8,border:"1px solid #eee"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Tam Yedekleme</div>
      <div style={{fontSize:13,color:"#888",marginBottom:12}}>Tüm KV verilerini (kullanıcı, sipariş, kupon, banner, sayfa, iade, SEO, ayarlar) tek JSON dosyasında yedekle.</div>
      <ABtn onClick={fullBackup} disabled={busy}>{busy?"...":"💾 Tam Yedek Al"}</ABtn>
    </div>
  </ACard>;
}

// ── SALES CHART ──
function ASalesChart(){
  const [chart,setChart]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/admin/dashboard",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setChart(d.chart||[]);
    }).finally(()=>setLoading(false));
  },[]);
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  const amounts = chart.map(c=>c.amount);
  const mx = Math.max(1, ...amounts);
  const total = amounts.reduce((a,b)=>a+b,0);
  const avg = amounts.length? Math.round(total/amounts.length) : 0;
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Satış Grafikleri — Son 30 Gün</h1>
    <ACard title="Günlük Satış">
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:220,padding:"10px 0"}}>
        {chart.map((c,i)=>{
          const d=new Date(c.date);
          const lbl=`${d.getDate()}.${d.getMonth()+1}`;
          return <div key={c.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            {i%3===0 && <span style={{fontSize:10,fontWeight:600,color:"#555"}}>{c.amount>0?"₺"+c.amount.toLocaleString("tr-TR"):""}</span>}
            <div style={{width:"100%",height:`${(c.amount/mx)*180}px`,background:"linear-gradient(180deg,#ff6000,#ff8c00)",borderRadius:"3px 3px 0 0",minHeight:2}}/>
            {i%3===0 && <span style={{fontSize:9,color:"#999"}}>{lbl}</span>}
          </div>;
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20,paddingTop:16,borderTop:"1px solid #f0f0f0"}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#ff6000"}}>₺{total.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999"}}>30 Gün Toplam</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#2563eb"}}>{amounts.filter(a=>a>0).length}</div><div style={{fontSize:12,color:"#999"}}>Satışlı Gün</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#059669"}}>₺{avg.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999"}}>Günlük Ortalama</div></div>
      </div>
    </ACard></>;
}

// ── RETURNS ──
function AReturns(){
  const statuses=["Beklemede","Onaylandı","Reddedildi","Tamamlandı"];
  const sc={"Beklemede":{bg:"#fef3c7",c:"#b45309"},"Onaylandı":{bg:"#dbeafe",c:"#2563eb"},"Reddedildi":{bg:"#fee2e2",c:"#dc2626"},"Tamamlandı":{bg:"#dcfce7",c:"#059669"}};
  const [returns,setReturns]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/admin/returns",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setReturns(d.returns||[]);
    }).finally(()=>setLoading(false));
  },[]);
  async function updateStatus(id,status){
    setReturns(p=>p.map(x=>x.id===id?{...x,status}:x));
    await fetch("/api/admin/returns",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
  }
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  return <ACard title={`İade Talepleri (${returns.length})`}>
    {returns.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz iade talebi yok.</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{["İade No","Sipariş","Müşteri","Ürün","Sebep","Durum","İşlem"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{returns.map(r=><tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
        <td style={{padding:"10px",fontFamily:"monospace",fontWeight:600}}>{r.id}</td>
        <td style={{padding:"10px",fontSize:12,color:"#888"}}>{r.orderRef||"—"}</td>
        <td style={{padding:"10px",fontWeight:500}}>{r.customerName||"—"}</td>
        <td style={{padding:"10px",fontSize:12}}>{r.product||"—"}</td>
        <td style={{padding:"10px",fontSize:12,color:"#888",maxWidth:150}}>{r.reason||"—"}</td>
        <td style={{padding:"10px"}}><span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:sc[r.status]?.bg,color:sc[r.status]?.c}}>{r.status}</span></td>
        <td style={{padding:"10px"}}><select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)} style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4,fontSize:12}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td>
      </tr>)}</tbody>
    </table>}
  </ACard>;
}

// ── LOW STOCK ──
function ALowStock(){
  const {products:ctxProds} = use$();
  const [threshold,setThreshold]=useState(10);
  const source=(ctxProds && ctxProds.length>0)?ctxProds:PRODUCTS;
  const lowItems=source.filter(p=>Number(p.stock||0)<=threshold);
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Düşük Stok Uyarıları</h1>
    <ACard title="Stok Eşiği Ayarı">
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:"#666"}}>Stok eşiği:</span>
        <AIn type="number" value={threshold} onChange={e=>setThreshold(Number(e.target.value))} style={{width:80}}/>
        <span style={{fontSize:13,color:"#888"}}>ve altındaki ürünleri göster</span>
      </div>
    </ACard>
    <ACard title={`Düşük Stoklu Ürünler (${lowItems.length})`}>
      {lowItems.length===0?<div style={{textAlign:"center",padding:"24px",color:"#059669",fontWeight:600}}>✓ Tüm ürünler yeterli stokta!</div>:
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{borderBottom:"2px solid #eee"}}>{["Ürün","SKU","Marka","Stok","Durum"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
          <tbody>{lowItems.map(p=><tr key={p.id} style={{borderBottom:"1px solid #f0f0f0",background:p.stock===0?"#fff5f5":"transparent"}}>
            <td style={{padding:"10px",fontWeight:600}}>{p.name}</td>
            <td style={{padding:"10px",fontFamily:"monospace",fontSize:12,color:"#888"}}>{p.sku}</td>
            <td style={{padding:"10px",color:"#ff6000"}}>{p.brand}</td>
            <td style={{padding:"10px"}}><span style={{fontWeight:700,color:p.stock===0?"#dc2626":"#b45309"}}>{p.stock}</span></td>
            <td style={{padding:"10px"}}><span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:p.stock===0?"#fee2e2":"#fef3c7",color:p.stock===0?"#dc2626":"#b45309"}}>{p.stock===0?"Tükendi":"Düşük"}</span></td>
          </tr>)}</tbody>
        </table>}
    </ACard></>;
}

// ── ACTIVITY LOG ──
function AActivityLog(){
  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/admin/activity",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setLogs(d.activity||[]);
    }).finally(()=>setLoading(false));
  },[]);
  const eventMeta={
    "user.signup":{type:"user",label:"Yeni üye kaydı"},
    "user.login":{type:"user",label:"Kullanıcı girişi"},
    "order.paid":{type:"order",label:"Sipariş alındı"},
    "order.status":{type:"order",label:"Sipariş durumu güncellendi"},
    "coupon.upsert":{type:"coupon",label:"Kupon oluşturuldu/güncellendi"},
    "coupon.delete":{type:"coupon",label:"Kupon silindi"},
    "return.status":{type:"stock",label:"İade durumu güncellendi"},
  };
  const typeColors={product:"#7c3aed",order:"#2563eb",user:"#059669",coupon:"#d97706",price:"#dc2626",stock:"#b45309",page:"#0891b2",banner:"#be185d"};
  function detailOf(l){
    if(l.event==="user.signup") return `${l.name||""} — ${l.email||"—"}${l.role==="admin"?" (admin)":""}`;
    if(l.event==="user.login") return l.name||"";
    if(l.event==="order.paid") return `${l.orderRef} — ₺${Number(l.amount||0).toLocaleString("tr-TR")} (${l.customer||""})`;
    if(l.event==="order.status") return `${l.orderRef} → ${l.status}`;
    if(l.event==="coupon.upsert"||l.event==="coupon.delete") return l.code;
    if(l.event==="return.status") return `${l.id} → ${l.status}`;
    return JSON.stringify(l);
  }
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  return <ACard title={`Aktivite Logu (${logs.length})`}>
    {logs.length===0?<div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz aktivite yok.</div>:logs.map((log,i)=>{
      const meta=eventMeta[log.event]||{type:"page",label:log.event};
      const t=log.at?new Date(log.at).toLocaleString("tr-TR"):"";
      return <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<logs.length-1?"1px solid #f0f0f0":"none",alignItems:"flex-start"}}>
        <div style={{width:8,height:8,borderRadius:4,background:typeColors[meta.type]||"#999",marginTop:6,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600}}>{meta.label}</span>
            <span style={{fontSize:11,color:"#999"}}>{t}</span>
          </div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>{detailOf(log)}</div>
        </div>
      </div>;
    })}
  </ACard>;
}

// ── SEO ──
function ASeo(){
  const pageList=[{id:"home",n:"Ana Sayfa"},{id:"products",n:"Ürünler"},{id:"about",n:"Hakkımızda"},{id:"contact",n:"İletişim"},{id:"brands",n:"Markalar"},{id:"faq",n:"SSS"}];
  const [seoMap,setSeoMap]=useState({});
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({title:"",description:"",keywords:""});
  const [ok,setOk]=useState(false);
  async function load(){
    const d=await fetch("/api/admin/seo",{credentials:"include"}).then(r=>r.json());
    setSeoMap(d.seo||{});
  }
  useEffect(()=>{load()},[]);
  useEffect(()=>{
    if(sel){const rec=seoMap[sel.id]||{}; setForm({title:rec.title||"",description:rec.description||"",keywords:rec.keywords||""})}
  },[sel,seoMap]);
  async function save(){
    await fetch("/api/admin/seo",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:sel.id,...form})});
    setOk(true); setTimeout(()=>setOk(false),2000);
    load();
  }
  return <ACard title="SEO Ayarları">
    {!sel?<>
      <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 Her sayfa için meta başlık ve açıklama belirleyerek arama motorlarında görünürlüğünüzü artırın.</div>
      {pageList.map((p,i)=>{const r=seoMap[p.id]||{}; return <div key={p.id} onClick={()=>setSel(p)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<pageList.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>{p.n}</div><div style={{fontSize:12,color:"#059669",marginTop:2}}>{r.title||<em style={{color:"#999"}}>başlık yok</em>}</div><div style={{fontSize:11,color:"#999"}}>{r.description||"—"}</div></div>
        <span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span>
      </div>;})}
    </>:<div>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:16}}>← Geri</button>
      <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{sel.n} — SEO Ayarları</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:500}}>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Meta Başlık (Title)</label><AIn value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><div style={{fontSize:11,color:"#999",marginTop:4}}>{form.title.length}/60 karakter</div></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Meta Açıklama (Description)</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,resize:"vertical"}}/><div style={{fontSize:11,color:"#999",marginTop:4}}>{form.description.length}/160 karakter</div></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Anahtar Kelimeler</label><AIn value={form.keywords} onChange={e=>setForm({...form,keywords:e.target.value})} placeholder="fren, balata, disk, kamyon, tır..."/></div>
        <div style={{padding:14,background:"#fafafa",borderRadius:8,border:"1px solid #eee"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#888",marginBottom:6}}>Google Önizleme</div>
          <div style={{fontSize:16,color:"#1a0dab",fontWeight:500}}>{form.title||sel.n}</div>
          <div style={{fontSize:13,color:"#006621"}}>frenciniz.com/{sel.id==="home"?"":sel.id}</div>
          <div style={{fontSize:12,color:"#545454",marginTop:2}}>{form.description}</div>
        </div>
        <ABtn onClick={save}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
      </div>
    </div>}
  </ACard>;
}

// ── EMAIL TEMPLATES ──
function AEmailTemplates(){
  const defaults={
    welcome:{name:"Hoş Geldin",subject:"Frenciniz'e Hoş Geldiniz!",body:"Merhaba {{isim}},\n\nFrenciniz ailesine katıldığınız için teşekkür ederiz."},
    "order-confirm":{name:"Sipariş Onayı",subject:"Siparişiniz Alındı — {{siparis_no}}",body:"Merhaba {{isim}},\n\n{{siparis_no}} numaralı siparişiniz alınmıştır. Tutar: {{tutar}}"},
    shipped:{name:"Kargoya Verildi",subject:"Siparişiniz Kargoya Verildi — {{siparis_no}}",body:"Merhaba {{isim}},\n\nSiparişiniz kargoya verildi. Kargo: {{kargo_firma}} — Takip: {{takip_no}}"},
    delivered:{name:"Teslim Edildi",subject:"Siparişiniz Teslim Edildi — {{siparis_no}}",body:"Merhaba {{isim}},\n\nSiparişiniz teslim edildi. Yorumunuzu bekliyoruz."},
    "stock-notify":{name:"Stok Bildirimi",subject:"İstediğiniz Ürün Stoğa Girdi!",body:"Takip ettiğiniz {{urun_adi}} ürünü tekrar stoklara girmiştir."},
  };
  const [items,setItems]=useState([]);
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({subject:"",body:"",name:""});
  const [ok,setOk]=useState(false);
  async function load(){
    const d=await fetch("/api/admin/email-templates",{credentials:"include"}).then(r=>r.json());
    const merged=(d.templates||[]).map(t=>{const def=defaults[t.id]||{}; return {...def,...t,name:t.name||def.name||t.id,subject:t.subject||def.subject||"",body:t.body||def.body||""}});
    setItems(merged);
  }
  useEffect(()=>{load()},[]);
  useEffect(()=>{if(sel) setForm({name:sel.name,subject:sel.subject,body:sel.body})},[sel]);
  async function save(){
    await fetch("/api/admin/email-templates",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:sel.id,...form})});
    setOk(true); setTimeout(()=>setOk(false),2000);
    load();
  }
  return <ACard title="E-posta Şablonları">
    {!sel?<>
      <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 Şablonlarda {"{{isim}}"}, {"{{siparis_no}}"}, {"{{tutar}}"} gibi değişkenler otomatik doldurulur.</div>
      {items.map((t,i)=><div key={t.id} onClick={()=>setSel(t)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:i<items.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>📨 {t.name}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>Konu: {t.subject||<em>boş</em>}</div></div>
        <span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span>
      </div>)}
    </>:<div>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:16}}>← Geri</button>
      <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{form.name} Şablonu</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:600}}>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>E-posta Konusu</label><AIn value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>İçerik</label><textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={10} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:6,fontSize:13,lineHeight:1.7,resize:"vertical",fontFamily:"inherit"}}/></div>
        <div style={{display:"flex",gap:8}}><ABtn onClick={save}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn></div>
      </div>
    </div>}
  </ACard>;
}

// ── CHAT HISTORY ──
function AChatHistory(){
  const {isMobile}=use$();
  const [sessions,setSessions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(null);
  const [messages,setMessages]=useState([]);
  const [loadingMsgs,setLoadingMsgs]=useState(false);
  const [reply,setReply]=useState("");
  const [sending,setSending]=useState(false);
  const [err,setErr]=useState("");
  const messagesEndRef=useRef(null);
  const quickReplies=[
    "Hoş geldiniz, Frenciniz canlı desteğe bağlandınız. Size nasıl yardımcı olabiliriz?",
    "Aracın marka/modelini ve mümkünse şase numarasını paylaşabilir misiniz?",
    "Parçanın üzerindeki OEM veya stok kodunu ya da ürün fotoğrafını paylaşabilir misiniz?",
  ];
  const loadSessions=async()=>{
    try{
      const d=await fetch("/api/admin/chat-sessions",{credentials:"include",cache:"no-store"}).then(r=>r.json());
      if(d.error) throw new Error(d.error);
      setSessions(d.sessions||[]);
      if(sel){const fresh=(d.sessions||[]).find(item=>item.id===sel.id);if(fresh)setSel(fresh)}
    }catch(e){setErr(e.message||"Sohbetler yüklenemedi")}finally{setLoading(false)}
  };
  const loadMessages=async(session=sel)=>{
    if(!session?.id)return;
    setLoadingMsgs(true);
    try{
      const d=await fetch(`/api/admin/chat-messages?sid=${encodeURIComponent(session.id)}`,{credentials:"include",cache:"no-store"}).then(r=>r.json());
      if(d.error)throw new Error(d.error);
      setMessages(d.messages||[]);
      setTimeout(()=>messagesEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
    }catch(e){setErr(e.message||"Mesajlar yüklenemedi")}finally{setLoadingMsgs(false)}
  };
  useEffect(()=>{
    loadSessions();
    const timer=setInterval(loadSessions,5000);
    return()=>clearInterval(timer);
  },[sel?.id]);
  useEffect(()=>{
    if(!sel) return;
    loadMessages(sel);
    const timer=setInterval(()=>loadMessages(sel),3500);
    return()=>clearInterval(timer);
  },[sel?.id]);
  async function sendReply(textOverride){
    const text=String(textOverride||reply).trim();
    if(!sel?.id||!text||sending)return;
    setSending(true);setErr("");
    try{
      const r=await fetch("/api/admin/chat-reply",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:sel.id,message:text})});
      const d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Mesaj gönderilemedi");
      setReply("");
      setMessages(prev=>[...prev,d.message]);
      await loadSessions();
      setTimeout(()=>messagesEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
    }catch(e){setErr(e.message)}finally{setSending(false)}
  }
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  const sessionList=<div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",background:"#fff"}}>
    <div style={{padding:"12px 14px",background:"#f8fafc",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:13}}>Ziyaretçiler ({sessions.length})</strong><button onClick={loadSessions} style={{border:"none",background:"transparent",color:"#ff6000",fontWeight:900}}>↻</button></div>
    <div style={{maxHeight:isMobile?"none":620,overflowY:"auto"}}>{sessions.length===0?<div style={{color:"#999",fontSize:13,padding:18}}>Henüz canlı destek ziyareti yok.</div>:sessions.map((ch,i)=>{
      const dt=ch.lastSeen||ch.lastTime;
      const name=ch.productName||ch.pageTitle||`Ziyaretçi #${String(ch.id||"").slice(-4)}`;
      const active=sel?.id===ch.id;
      return <button key={ch.id} onClick={()=>{setSel(ch);setErr("")}} style={{display:"block",width:"100%",border:"none",borderBottom:i<sessions.length-1?"1px solid #f1f5f9":"none",background:active?"#fff4ed":"#fff",padding:"12px 14px",textAlign:"left",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><span style={{fontSize:12,fontWeight:900,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>{Number(ch.unread||0)>0&&<span style={{minWidth:22,height:22,borderRadius:11,display:"grid",placeItems:"center",background:"#dc2626",color:"#fff",fontSize:10,fontWeight:950}}>{ch.unread}</span>}</div>
        <div style={{fontSize:11,color:"#64748b",marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.lastMessage||ch.path||"Siteyi inceliyor"}</div>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:10,color:"#94a3b8",marginTop:5}}><span>{ch.status==="chatting"?"💬 Sohbette":"🟢 Sitede"}</span><span>{dt?new Date(dt).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):""}</span></div>
      </button>})}</div>
  </div>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:14,flexWrap:"wrap"}}><div><h1 style={{fontSize:22,fontWeight:900,margin:"0 0 4px"}}>Canlı Destek</h1><div style={{fontSize:12,color:"#64748b"}}>İlgili ziyaretçileri görün, hazır cevapla anında karşılayın.</div></div><ABtn onClick={loadSessions}>↻ Yenile</ABtn></div>
    {err&&<div style={{padding:10,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#b91c1c",fontSize:12,marginBottom:10}}>⚠ {err}</div>}
    <div style={{display:"grid",gridTemplateColumns:sel&&!isMobile?"minmax(280px,.8fr) minmax(0,1.5fr)":"1fr",gap:14}}>
      {(!isMobile||!sel)&&sessionList}
      {sel&&<div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",background:"#fff",display:"flex",flexDirection:"column",minHeight:520}}>
        <div style={{padding:"12px 14px",background:"#111827",color:"#fff"}}>
          {isMobile&&<button onClick={()=>{setSel(null);setMessages([])}} style={{border:"none",background:"transparent",color:"#fdba74",fontSize:12,fontWeight:900,padding:"0 0 8px"}}>← Ziyaretçilere dön</button>}
          <div style={{fontSize:14,fontWeight:950}}>{sel.productName||sel.pageTitle||`Ziyaretçi #${String(sel.id||"").slice(-4)}`}</div>
          <div style={{fontSize:10,color:"#cbd5e1",marginTop:4,overflowWrap:"anywhere"}}>{sel.path||"/"}{sel.source?` • Kaynak: ${sel.source}`:""}</div>
        </div>
        <div style={{flex:1,minHeight:260,maxHeight:430,overflowY:"auto",padding:14,background:"#f8fafc"}}>
          {loadingMsgs&&messages.length===0?<div style={{color:"#999",fontSize:13}}>Mesajlar yükleniyor…</div>:messages.length===0?<div style={{textAlign:"center",padding:"30px 10px"}}><div style={{fontSize:30}}>👋</div><div style={{fontSize:13,fontWeight:900,color:"#334155",marginTop:8}}>Ziyaretçi henüz mesaj yazmadı</div><div style={{fontSize:11,color:"#64748b",marginTop:4}}>Hazır karşılama mesajıyla konuşmayı siz başlatabilirsiniz.</div></div>:messages.map((m,i)=>{
            const isUser=m.from==="user";
            const isAdmin=m.from==="admin";
            const tm=m.time?new Date(m.time).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}):"";
            return <div key={i} style={{display:"flex",justifyContent:isUser?"flex-start":"flex-end",marginBottom:9}}><div style={{maxWidth:"82%",padding:"9px 12px",borderRadius:isUser?"2px 12px 12px 12px":"12px 12px 2px 12px",background:isUser?"#fff":isAdmin?"#2563eb":"#e2e8f0",color:isUser?"#111827":isAdmin?"#fff":"#334155",border:isUser?"1px solid #e5e7eb":"none",fontSize:12,lineHeight:1.45,overflowWrap:"anywhere"}}>{m.text}<div style={{fontSize:9,opacity:.65,textAlign:"right",marginTop:3}}>{tm}</div></div></div>
          })}<div ref={messagesEndRef}/>
        </div>
        <div style={{padding:10,borderTop:"1px solid #e5e7eb",background:"#fff"}}>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8}}>{quickReplies.map((text,i)=><button key={i} onClick={()=>sendReply(text)} disabled={sending} style={{flex:"0 0 auto",maxWidth:220,minHeight:34,border:"1px solid #fed7aa",borderRadius:8,background:"#fff7ed",color:"#9a3412",fontSize:10,fontWeight:800,padding:"6px 9px",textAlign:"left"}}>{i===0?"👋 Hoş geldiniz":i===1?"🚚 Araç bilgisi iste":"🔎 OEM/fotoğraf iste"}</button>)}</div>
          <div style={{display:"flex",gap:7}}><textarea value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply()}}} placeholder="Mesajınızı yazın…" rows={2} style={{flex:1,resize:"none",border:"1px solid #d1d5db",borderRadius:8,padding:"9px 10px",fontSize:12,fontFamily:"inherit"}}/><button onClick={()=>sendReply()} disabled={sending||!reply.trim()} style={{minWidth:76,border:"none",borderRadius:8,background:sending||!reply.trim()?"#cbd5e1":"#ff6000",color:"#fff",fontWeight:900,fontSize:12}}>{sending?"…":"Gönder"}</button></div>
        </div>
      </div>}
    </div>
  </div>;
}

// ── REVENUE REPORT ──
function ARevenue(){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [costRatio,setCostRatio]=useState(()=>{
    try{ const v=localStorage.getItem("frenciniz_cost_ratio"); return v?Number(v):0.68; }catch{ return 0.68; }
  });
  useEffect(()=>{
    fetch("/api/admin/orders",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setOrders((d.orders||[]).filter(o=>o.status==="paid"));
    }).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{ try{localStorage.setItem("frenciniz_cost_ratio",String(costRatio))}catch{} },[costRatio]);

  const byMonth = {};
  orders.forEach(o=>{
    const d=o.paidAt||o.createdAt;
    if(!d) return;
    const key = String(d).slice(0,7);
    if(!byMonth[key]) byMonth[key]={month:key,revenue:0,orders:0};
    byMonth[key].revenue += Number(o.amount||0);
    byMonth[key].orders += 1;
  });
  const rows = Object.values(byMonth).sort((a,b)=>b.month.localeCompare(a.month)).slice(0,12)
    .map(r=>({...r, cost: Math.round(r.revenue*costRatio)}));
  const totRev=rows.reduce((a,r)=>a+r.revenue,0);
  const totCost=rows.reduce((a,r)=>a+r.cost,0);
  const totProfit=totRev-totCost;
  const margin=totRev>0?Math.round((totProfit/totRev)*100):0;
  const monthNames=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  function fmtMonth(ym){
    const [y,m]=ym.split("-"); return `${monthNames[Number(m)-1]} ${y}`;
  }
  if(loading) return <div style={{padding:20,color:"#999"}}>Yükleniyor…</div>;
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Gelir / Gider Raporu</h1>
    <ACard title="Gider Oranı">
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:"#666"}}>Tahmini maliyet oranı (ürün + kargo + komisyon):</span>
        <AIn type="number" step="0.01" min="0" max="1" value={costRatio} onChange={e=>setCostRatio(Math.max(0,Math.min(1,Number(e.target.value)||0)))} style={{width:100}}/>
        <span style={{fontSize:13,color:"#888"}}>({Math.round(costRatio*100)}% — gelir üzerinden)</span>
      </div>
    </ACard>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#059669"}}>₺{totRev.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Toplam Gelir</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#dc2626"}}>₺{totCost.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Tahmini Gider</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>₺{totProfit.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Net Kâr</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#7c3aed"}}>%{margin}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Kâr Marjı</div></div>
    </div>
    <ACard title="Aylık Detay">
      {rows.length===0?<div style={{color:"#999",fontSize:13}}>Henüz ödenmiş sipariş yok.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{borderBottom:"2px solid #eee"}}>{["Dönem","Gelir","Gider","Kâr","Marj","Sipariş"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r=>{const profit=r.revenue-r.cost;const m=r.revenue>0?Math.round((profit/r.revenue)*100):0;return(
          <tr key={r.month} style={{borderBottom:"1px solid #f0f0f0"}}>
            <td style={{padding:"10px",fontWeight:600}}>{fmtMonth(r.month)}</td>
            <td style={{padding:"10px",color:"#059669",fontWeight:600}}>₺{r.revenue.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px",color:"#dc2626"}}>₺{r.cost.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px",color:"#2563eb",fontWeight:600}}>₺{profit.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:50,height:6,background:"#eee",borderRadius:3}}><div style={{width:`${m}%`,height:6,background:m>30?"#059669":"#b45309",borderRadius:3}}/></div><span style={{fontSize:12,fontWeight:600}}>%{m}</span></div></td>
            <td style={{padding:"10px"}}>{r.orders}</td>
          </tr>)})}</tbody>
      </table>}
    </ACard></>;
}

// ── ADMIN USER MANAGEMENT ──
function AAdminUsers(){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/admin/customers",{credentials:"include"}).then(r=>r.json()).then(d=>{
      setUsers((d.users||[]).filter(u=>u.role==="admin"));
    }).finally(()=>setLoading(false));
  },[]);
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Admin Kullanıcıları</h1>
    <ACard title={`Admin Rolündeki Kullanıcılar (${users.length})`}>
      <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 Admin yetkisi vermek için Vercel ortam değişkenlerinde <code>ADMIN_EMAILS</code> listesine kullanıcının e-postasını ekleyin. Sonra o kullanıcı giriş yaptığında otomatik admin rolü alır.</div>
      {loading?<div style={{color:"#999",fontSize:13}}>Yükleniyor…</div>:users.length===0?
        <div style={{color:"#999",fontSize:13,padding:"12px 0"}}>Henüz admin rolünde kullanıcı yok. Vercel'de ADMIN_EMAILS ayarlanmamış olabilir.</div>:
        users.map((u,i)=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:i<users.length-1?"1px solid #f0f0f0":"none"}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#ff6000",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:700}}>{(u.name||"?").charAt(0).toUpperCase()}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
              <div style={{fontSize:12,color:"#888"}}>{u.email||(u.phone?`0${u.phone}`:"—")}</div>
            </div>
            <span style={{padding:"4px 12px",borderRadius:4,fontSize:11,fontWeight:600,background:"#fef3c7",color:"#b45309"}}>Admin</span>
            <div style={{fontSize:11,color:"#999",textAlign:"right",minWidth:100}}>Son giriş:<br/>{u.lastLogin?new Date(u.lastLogin).toLocaleString("tr-TR"):"—"}</div>
          </div>
        ))}
    </ACard></>;
}

// ── PAYMENT GATEWAY SETTINGS ──
function APaymentCfg(){
  const [activeGw,setActiveGw]=useState("esnekpos");
  const [ok,setOk]=useState(false);
  const [gateways,setGateways]=useState({
    esnekpos:{enabled:false,mode:"test",merchantId:"",apiKey:"",secretKey:"",successUrl:"",failUrl:""},
  });
  useEffect(()=>{
    fetch("/api/admin/email-config",{credentials:"include"}).catch(()=>{});
    fetch("/api/admin/settings",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(d.settings?.gateways) setGateways(p=>({...p,...d.settings.gateways}));
    }).catch(()=>{});
  },[]);
  async function savePayment(){
    const r=await fetch("/api/admin/settings",{credentials:"include"}).then(r=>r.json()).catch(()=>({settings:{}}));
    const merged={...(r.settings||{}),gateways};
    await fetch("/api/admin/settings",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(merged)});
    setOk(true); setTimeout(()=>setOk(false),2000);
  }

  const updateGw=(gw,field,val)=>setGateways(p=>({...p,[gw]:{...p[gw],[field]:val}}));
  const gwInfo={
    esnekpos:{name:"EsnekPOS",logo:"💳",color:"#4f46ff",docs:"https://esnekpos.com",fields:[
      {key:"merchantId",label:"Üye İşyeri No (Merchant ID)",ph:"XXXXXX"},
      {key:"apiKey",label:"API Anahtarı (API Key)",ph:"••••••••",type:"password"},
      {key:"secretKey",label:"Gizli Anahtar (Secret Key)",ph:"••••••••",type:"password"},
      {key:"successUrl",label:"Başarılı Ödeme URL",ph:"https://www.frenciniz.com/odeme-basarili"},
      {key:"failUrl",label:"Başarısız Ödeme URL",ph:"https://www.frenciniz.com/odeme-basarisiz"},
    ]},
  };

  const gw=gwInfo[activeGw];
  const gwState=gateways[activeGw];
  const enabledCount=Object.values(gateways).filter(g=>g.enabled).length;

  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Ödeme Ayarları</h1>

    {/* Summary cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:20}}>
      {Object.entries(gwInfo).map(([key,info])=>(
        <div key={key} onClick={()=>setActiveGw(key)}
          style={{background:"#fff",border:`2px solid ${activeGw===key?info.color:"#e8e8e8"}`,borderRadius:8,padding:16,cursor:"pointer",transition:"border-color .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:24}}>{info.logo}</span>
            <span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,
              background:gateways[key].enabled?"#dcfce7":"#f5f5f5",
              color:gateways[key].enabled?"#059669":"#999"}}>
              {gateways[key].enabled?"Aktif":"Pasif"}
            </span>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>{info.name}</div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>Mod: {gateways[key].mode==="test"?"Test":"Canlı"}</div>
        </div>
      ))}
    </div>

    {/* Active gateway settings */}
    <ACard title={`${gw.name} Entegrasyonu`} action={
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#888"}}>{gwState.enabled?"Aktif":"Pasif"}</span>
        <button onClick={()=>updateGw(activeGw,"enabled",!gwState.enabled)}
          style={{width:48,height:26,borderRadius:13,border:"none",background:gwState.enabled?"#059669":"#ddd",position:"relative",cursor:"pointer",transition:"background .2s"}}>
          <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:2,left:gwState.enabled?24:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
        </button>
      </div>
    }>
      <div style={{maxWidth:500}}>
        {/* Mode */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["test","live"].map(m=>(
            <button key={m} onClick={()=>updateGw(activeGw,"mode",m)}
              style={{padding:"8px 20px",border:`2px solid ${gwState.mode===m?gw.color:"#ddd"}`,borderRadius:6,
                background:gwState.mode===m?gw.color+"10":"#fff",color:gwState.mode===m?gw.color:"#888",
                fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {m==="test"?"🧪 Test Modu":"🟢 Canlı Mod"}
            </button>
          ))}
        </div>

        {gwState.mode==="live"&&<div style={{padding:12,background:"#fee2e2",borderRadius:6,border:"1px solid #fecaca",fontSize:12,color:"#dc2626",marginBottom:16}}>
          ⚠️ Canlı mod aktif! Gerçek ödemeler alınacaktır.
        </div>}

        {/* API Fields */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {gw.fields.map(f=>(
            <div key={f.key}>
              <label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>{f.label}</label>
              <AIn type={f.type||"text"} placeholder={f.ph} value={gwState[f.key]||""} onChange={e=>updateGw(activeGw,f.key,e.target.value)}/>
            </div>
          ))}
        </div>

        {/* Taksit ayarları */}
        <div style={{marginTop:20,padding:16,border:"1px solid #eee",borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Taksit Ayarları</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[2,3,6,9,12].map(t=>(
              <label key={t} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}>
                <input type="checkbox" defaultChecked={t<=6} style={{accentColor:gw.color}}/> {t} Taksit
              </label>
            ))}
          </div>
        </div>

        {/* Komisyon */}
        <div style={{marginTop:12,padding:16,border:"1px solid #eee",borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Komisyon Oranları</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={{fontSize:11,color:"#888"}}>Tek Çekim (%)</label><AIn type="number" placeholder="1.49" style={{fontSize:12}}/></div>
            <div><label style={{fontSize:11,color:"#888"}}>Taksitli (%)</label><AIn type="number" placeholder="2.99" style={{fontSize:12}}/></div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginTop:16}}>
          <ABtn onClick={savePayment}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
        </div>

        <div style={{marginTop:16,padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1"}}>
          💡 API bilgilerinizi <a href={gw.docs} target="_blank" style={{color:"#0369a1",fontWeight:600}}>{gw.name} geliştirici portalından</a> alabilirsiniz.
        </div>
      </div>
    </ACard>

    {/* Genel ödeme ayarları */}
    <ACard title="Genel Ödeme Ayarları">
      <div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}>
          <div><div style={{fontSize:14,fontWeight:600}}>3D Secure Zorunlu</div><div style={{fontSize:12,color:"#888"}}>Tüm ödemelerde 3D Secure doğrulaması</div></div>
          <input type="checkbox" defaultChecked style={{accentColor:"#ff6000"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
          <div><div style={{fontSize:14,fontWeight:600}}>Havale / EFT</div><div style={{fontSize:12,color:"#888"}}>Manuel havale ile ödeme seçeneği</div></div>
          <input type="checkbox" defaultChecked style={{accentColor:"#ff6000"}}/>
        </div>
      </div>
    </ACard>
  </>;
}
