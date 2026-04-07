import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from "react";

// ===== TRANSLATIONS =====
const TR = {
  search:"Ürün adı, parça kodu veya OEM ara...",searchBtn:"Ara",cart:"Sepetim",login:"Giriş Yap",favs:"Favoriler",
  home:"Ana Sayfa",products:"Ürünler",brands:"Markalar",contact:"İletişim",about:"Hakkımızda",faq:"SSS",
  addToCart:"Sepete Ekle",outOfStock:"Tükendi",notifyMe:"🔔 Haber Ver",buyAgain:"Tekrar Al",
  heroTitle:"Fren Aksamı Uzmanı",heroDesc:"10.000+ orijinal ve eşdeğer parça. Aynı gün kargo, 12 taksit.",browseProducts:"Ürünleri İncele",
  byVehicle:"Araç Tipine Göre Alışveriş",bestSellers:"Çok Satanlar",seeAll:"Tümünü Gör →",discounted:"🔥 İndirimli Ürünler",
  sameDay:"Aynı Gün Kargo",sameDayDesc:"14:00'a kadar sipariş",origGuarantee:"Orijinal Garanti",origDesc:"ECE R-90 sertifikalı",
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
  description:"Açıklama",techSpecs:"Teknik Özellikler",compatVehicles:"Uyumlu Araçlar",similarProducts:"Benzer Ürünler",
  newsletter:"Bültenimize Abone Olun",newsletterDesc:"Yeni ürünler ve kampanyalar için katılın.",subscribe:"Abone Ol",
  filterTitle:"Filtreler",apply:"Uygula",close:"Kapat",menu:"Menü",
  truck:"Kamyon",trailer:"Tır / Çekici",bus:"Otobüs",semitrailer:"Dorse",allVehicles:"Tüm Araçlar",allBrands:"Tüm Markalar",
  product:"ürün",pieces:"ürün",reviews:"değerlendirme",inStock:"Stokta",
};
const EN = {
  search:"Search product, part code or OEM...",searchBtn:"Search",cart:"My Cart",login:"Sign In",favs:"Favorites",
  home:"Home",products:"Products",brands:"Brands",contact:"Contact",about:"About Us",faq:"FAQ",
  addToCart:"Add to Cart",outOfStock:"Sold Out",notifyMe:"🔔 Notify Me",buyAgain:"Reorder",
  heroTitle:"Brake Parts Expert",heroDesc:"10,000+ original and equivalent parts. Same day shipping, 12 installments.",browseProducts:"Browse Products",
  byVehicle:"Shop by Vehicle Type",bestSellers:"Best Sellers",seeAll:"See All →",discounted:"🔥 Discounted Products",
  sameDay:"Same Day Shipping",sameDayDesc:"Order before 2 PM",origGuarantee:"Original Guarantee",origDesc:"ECE R-90 certified",
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
  description:"Description",techSpecs:"Technical Specs",compatVehicles:"Compatible Vehicles",similarProducts:"Similar Products",
  newsletter:"Subscribe to Newsletter",newsletterDesc:"Join for new products and deals.",subscribe:"Subscribe",
  filterTitle:"Filters",apply:"Apply",close:"Close",menu:"Menu",
  truck:"Truck",trailer:"Tractor",bus:"Bus",semitrailer:"Trailer",allVehicles:"All Vehicles",allBrands:"All Brands",
  product:"product",pieces:"products",reviews:"reviews",inStock:"In Stock",
};
const LANGS = {tr:TR, en:EN};

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

const PRODUCTS = [
  {id:1,name:"Kampana Fren Balata Seti",cat:"balata",veh:["kamyon","tir"],price:1250,old:1500,brand:"Knorr-Bremse",stock:24,sku:"KB-BLT-4210",oem:"29108",rating:4.8,reviews:142,img:"https://placehold.co/400x400/2d1b1b/e8c4c4?text=BALATA%0ASET%C4%B0&font=montserrat",desc:"ECE R-90 sertifikalı seramik kompozit balata seti.",specs:{Malzeme:"Seramik Kompozit",Genişlik:"220mm",Kalınlık:"18mm",Adet:"4 Adet/Set",Ağırlık:"6.2 kg",Sertifika:"ECE R-90"},compat:["Mercedes Actros","MAN TGA/TGS","DAF XF","Volvo FH"]},
  {id:2,name:"Hava Kurutucusu Kartuşu",cat:"pnomatik",veh:["tir","kamyon"],price:890,old:null,brand:"Wabco",stock:18,sku:"WB-HK-3301",oem:"432 410 222 7",rating:4.6,reviews:87,img:"https://placehold.co/400x400/1a2332/a8c4e0?text=HAVA%0AKURUTUCU&font=montserrat",desc:"Pnömatik fren sistemi koalesans filtre kartuşu.",specs:{Tip:"Koalesans",Basınç:"12.5 bar",Bağlantı:"M39x1.5",Ağırlık:"1.8 kg"},compat:["Universal"]},
  {id:3,name:"Fren Diski Ø430 Havalandırmalı",cat:"disk",veh:["otobus"],price:3200,old:3800,brand:"SAF-Holland",stock:7,sku:"SF-DSK-430V",oem:"4079001300",rating:4.9,reviews:203,img:"https://placehold.co/400x400/1c1c1c/b0b0b0?text=FREN%0AD%C4%B0SK%C4%B0%0A%C3%98430&font=montserrat",desc:"Havalandırmalı yapı ile üstün ısı dağılımı.",specs:{Çap:"430mm",Kalınlık:"45mm",Tip:"Havalandırmalı",Ağırlık:"32 kg"},compat:["Mercedes Tourismo","MAN Lion's Coach","Setra 500"]},
  {id:4,name:"ABS Sensörü Komple",cat:"elektronik",veh:["kamyon","dorse"],price:450,old:null,brand:"Haldex",stock:35,sku:"HX-ABS-2201",oem:"441 032 578 0",rating:4.5,reviews:64,img:"https://placehold.co/400x400/0f2618/7bc8a4?text=ABS%0ASENS%C3%96R&font=montserrat",desc:"Dijital sinyal çıkışlı ABS tekerlek hız sensörü.",specs:{Kablo:"1200mm",Bağlantı:"Bayonet",Sinyal:"Dijital",Koruma:"IP69K"},compat:["SAF Dingil","BPW Dingil"]},
  {id:5,name:"Fren Kaliperi Sol",cat:"disk",veh:["dorse"],price:2800,old:3200,brand:"Knorr-Bremse",stock:0,sku:"KB-KLP-L910",oem:"SB/SN 7",rating:4.7,reviews:91,img:"https://placehold.co/400x400/1c1c1c/b0b0b0?text=FREN%0AKAL%C4%B0PER%C4%B0&font=montserrat",desc:"Çift pistonlu yüzen disk fren kaliperi.",specs:{Piston:"Ø68mm Çift",Tip:"Yüzen",Tork:"28 kNm"},compat:["BPW Disk","SAF INTRADISC"]},
  {id:6,name:"Körük Tamir Takımı",cat:"suspansiyon",veh:["tir","kamyon"],price:680,old:750,brand:"ContiTech",stock:42,sku:"CT-KRK-5501",oem:"81.43601.0078",rating:4.4,reviews:56,img:"https://placehold.co/400x400/1a2a2a/80bfbf?text=K%C3%96R%C3%9CK%0ATAKIM&font=montserrat",desc:"Haddeleme körüğü komple tamir seti.",specs:{Tip:"Haddeleme",Çap:"Ø270mm",Strok:"120mm"},compat:["MAN TGA/TGS/TGX"]},
  {id:7,name:"Otomatik Fren Ayar Kolu",cat:"mekanik",veh:["kamyon","tir"],price:1100,old:null,brand:"Haldex",stock:19,sku:"HX-AYR-7801",oem:"72523",rating:4.8,reviews:118,img:"https://placehold.co/400x400/2a2018/d4b896?text=AYAR%0AKOLU&font=montserrat",desc:"Kampana freni otomatik boşluk ayar kolu.",specs:{Tip:"Otomatik",Kol:"150mm",Spline:"10 Dişli"},compat:["Mercedes Actros","MAN TGA","DAF CF/XF"]},
  {id:8,name:"Fren Kampanası Ø410",cat:"mekanik",veh:["otobus","kamyon"],price:2450,old:2900,brand:"BPW",stock:11,sku:"BW-KMP-410",oem:"0310667290",rating:4.7,reviews:167,img:"https://placehold.co/400x400/2a2018/d4b896?text=KAMPANA%0A%C3%98410&font=montserrat",desc:"Yüksek karbon alaşımlı döküm kampana.",specs:{Çap:"410mm",Genişlik:"200mm",Malzeme:"GG25",Ağırlık:"48 kg"},compat:["BPW 12T","SAF 9T/11T"]},
  {id:9,name:"Fren Sibop Seti",cat:"pnomatik",veh:["dorse"],price:560,old:null,brand:"Wabco",stock:53,sku:"WB-SBP-4400",oem:"961 723 142 0",rating:4.3,reviews:45,img:"https://placehold.co/400x400/1a2332/a8c4e0?text=S%C4%B0BOP%0ASET%C4%B0&font=montserrat",desc:"Dorse rölanti valfı seti.",specs:{Tip:"Rölanti",Basınç:"10 bar",Adet:"4/Set"},compat:["Tüm Dorseler"]},
  {id:10,name:"Fren Silindir T24",cat:"pnomatik",veh:["tir","kamyon"],price:1750,old:2100,brand:"Knorr-Bremse",stock:15,sku:"KB-SLN-T24",oem:"BS 9404",rating:4.9,reviews:198,img:"https://placehold.co/400x400/1a2332/a8c4e0?text=FREN%0AS%C4%B0L%C4%B0ND%C4%B0R%0AT24&font=montserrat",desc:"T24 membran fren silindiri.",specs:{Tip:"T24",Strok:"76mm",Sertifika:"ECE R-13"},compat:["Mercedes Actros","MAN TGX","Volvo FH"]},
  {id:11,name:"EBS Modülatör Valfı",cat:"elektronik",veh:["tir","dorse"],price:4200,old:4800,brand:"Wabco",stock:5,sku:"WB-EBS-2210",oem:"480 102 070 0",rating:4.8,reviews:76,img:"https://placehold.co/400x400/0f2618/7bc8a4?text=EBS%0AMOD%C3%9CLAT%C3%96R&font=montserrat",desc:"2 kanallı CAN Bus aks modülatör.",specs:{Kanal:"2",Voltaj:"24V",Koruma:"IP67"},compat:["Wabco EBS","Dorse EBS"]},
  {id:12,name:"Disk Balata Seti Premium",cat:"balata",veh:["otobus","kamyon"],price:1680,old:1900,brand:"SAF-Holland",stock:28,sku:"SF-BLT-P770",oem:"3057008400",rating:4.6,reviews:134,img:"https://placehold.co/400x400/2d1b1b/e8c4c4?text=D%C4%B0SK%0ABALATA%0APREM%C4%B0UM&font=montserrat",desc:"Düşük metalik premium disk fren balatası.",specs:{Malzeme:"Düşük Metalik",Genişlik:"250mm",Adet:"4/Set"},compat:["SAF INTRADISC","BPW Disk"]},
];

const CATS = [{id:"all",name:"Tüm Ürünler"},{id:"disk",name:"Disk Fren"},{id:"mekanik",name:"Kampana & Mekanik"},{id:"pnomatik",name:"Pnömatik Sistem"},{id:"elektronik",name:"Elektronik"},{id:"balata",name:"Balatalar"},{id:"suspansiyon",name:"Süspansiyon"}];
const VEHS = [{id:"all",name:"Tüm Araçlar"},{id:"kamyon",name:"Kamyon"},{id:"tir",name:"Tır"},{id:"otobus",name:"Otobüs"},{id:"dorse",name:"Dorse"}];
const BRANDS = ["Knorr-Bremse","Wabco","SAF-Holland","Haldex","BPW","ContiTech","Mercedes OE","Vaden","Polmo"];

const Ctx = createContext();
const use$ = () => useContext(Ctx);

export default function App() {
  const isAdminMode = typeof window !== 'undefined' && window.__ADMIN_MODE__;
  const [page, setPage] = useState(isAdminMode ? "admin-login" : "home");
  const [params, setParams] = useState({});
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState([]);
  const [viewed, setViewed] = useState([]);
  const [user, setUser] = useState(null);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{from:"bot",text:"Merhaba! Size nasıl yardımcı olabilirim?",time:new Date()}]);
  const [pastOrders, setPastOrders] = useState([]);
  const [lang, setLang] = useState("tr");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [cookieOk, setCookieOk] = useState(false);
  const [socialMedia, setSocialMedia] = useState({facebook:"",instagram:"",twitter:"",youtube:""});
  const isMobile = useIsMobile();
  const t = useCallback((key) => LANGS[lang]?.[key] || key, [lang]);
  const fp = useCallback((price) => price ? `₺${price.toLocaleString("tr-TR")}` : "", []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = useCallback((p, pr={}) => { setPage(p); setParams(pr); window.scrollTo?.({top:0}); }, []);

  const addToCart = useCallback((product, qty=1) => {
    if(!product.stock) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if(existing) return prev.map(c => c.id === product.id ? {...c, qty: c.qty + qty} : c);
      return [...prev, {...product, qty}];
    });
    setToast(product.name);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const updateQty = useCallback((id, qty) => setCart(prev => qty < 1 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? {...c, qty} : c)), []);
  const removeItem = useCallback((id) => setCart(prev => prev.filter(c => c.id !== id)), []);
  const toggleFav = useCallback((id) => setFavs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);
  const addViewed = useCallback((id) => setViewed(prev => [id, ...prev.filter(v => v !== id)].slice(0, 8)), []);
  const addStockAlert = useCallback((productId, contact) => {
    setStockAlerts(prev => [...prev, {productId, contact, date: new Date()}]);
  }, []);
  const completePurchase = useCallback(() => {
    setPastOrders(prev => {
      const newItems = cart.map(c => ({id:c.id, name:c.name, brand:c.brand, sku:c.sku, price:c.price, img:c.img, qty:c.qty, date:new Date()}));
      return [...newItems, ...prev].slice(0, 20);
    });
  }, [cart]);

  const cartCount = cart.reduce((s,c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s,c) => s + c.price * c.qty, 0);
  const discount = couponApplied ? Math.round(cartTotal * 0.1) : 0;

  const ctx = useMemo(() => ({page, params, go, cart, addToCart, updateQty, removeItem, cartCount, cartTotal, q, setQ, favs, toggleFav, viewed, addViewed, user, setUser, coupon, setCoupon, couponApplied, setCouponApplied, discount, stockAlerts, addStockAlert, chatOpen, setChatOpen, chatMessages, setChatMessages, pastOrders, completePurchase, lang, setLang, t, isMobile, mobileMenuOpen, setMobileMenuOpen, mobileFilterOpen, setMobileFilterOpen, fp, admin, setAdmin, socialMedia, setSocialMedia}), [page, params, go, cart, addToCart, updateQty, removeItem, cartCount, cartTotal, q, favs, toggleFav, viewed, addViewed, user, coupon, couponApplied, discount, stockAlerts, addStockAlert, chatOpen, chatMessages, pastOrders, completePurchase, lang, t, isMobile, mobileMenuOpen, mobileFilterOpen, fp, admin]);

  return (
    <Ctx.Provider value={ctx}>
      <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background:"#fff", color:"#333", minHeight:"100vh"}}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          button { font-family: inherit; cursor: pointer; }
          input, select, textarea { font-family: inherit; }
          input:focus, textarea:focus, select:focus { outline: none; border-color: #ff6000 !important; }
          @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        `}</style>

        {/* Toast */}
        {toast && <div style={{position:"fixed",top:80,right:20,zIndex:9999,background:"#4caf50",color:"#fff",padding:"12px 20px",borderRadius:8,fontSize:14,fontWeight:500,boxShadow:"0 4px 12px rgba(0,0,0,.15)",animation:"slideUp .3s"}}>✓ {toast} sepete eklendi</div>}

        {/* Live Chat Widget */}
        <ChatWidget />

        {/* WhatsApp Button — moved up when chat is present */}
        <a href="https://wa.me/908508887881" target="_blank" rel="noopener noreferrer"
          style={{position:"fixed",bottom:chatOpen?420:90,right:24,zIndex:998,width:44,height:44,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(37,211,102,.3)",textDecoration:"none",fontSize:20,transition:"bottom .3s"}}
          title="WhatsApp ile yazın">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="#fff"><path d="M16.01 2.93A13.07 13.07 0 0 0 2.93 16a12.94 12.94 0 0 0 1.75 6.53L2.93 29.07l6.72-1.76A13.07 13.07 0 1 0 16.01 2.93Zm0 23.9a10.8 10.8 0 0 1-5.52-1.51l-.4-.23-3.98 1.04 1.06-3.88-.26-.41a10.83 10.83 0 1 1 9.1 5Z"/><path d="M22.36 18.76c-.35-.17-2.05-1.01-2.37-1.13-.32-.11-.55-.17-.78.17-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.18-1.47-.54-2.8-1.73-1.04-.92-1.73-2.06-1.94-2.41-.2-.35-.02-.54.15-.71.16-.16.35-.41.53-.61.17-.21.23-.35.35-.59.12-.23.06-.44-.03-.61-.09-.17-.78-1.88-1.07-2.57-.28-.68-.57-.59-.78-.6h-.67a1.28 1.28 0 0 0-.93.44 3.93 3.93 0 0 0-1.22 2.92c0 1.72 1.25 3.38 1.43 3.61.17.24 2.47 3.77 5.98 5.28.84.36 1.49.58 2 .74.84.27 1.6.23 2.2.14.67-.1 2.05-.84 2.34-1.65.29-.81.29-1.5.2-1.65-.08-.14-.32-.23-.67-.4Z"/></svg>
        </a>

        {/* Scroll to Top */}
        {showTop && <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}
          style={{position:"fixed",bottom:24,right:92,zIndex:999,width:44,height:44,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,.1)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn .3s"}}>↑</button>}

        {/* HEADER */}
        <header style={{background:"#fff",borderBottom:"1px solid #e0e0e0",position:"sticky",top:0,zIndex:100}}>
          <div style={{background:"#1a1a1a",padding:"6px 0"}}>
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#ccc",fontSize:12}}>Türkiye geneli kargo | 500₺ üzeri ücretsiz</span>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                {!isMobile && <span style={{color:"#ccc",fontSize:12}}>📞 0850 888 7881</span>}
                {/* Social media in header */}
                {!isMobile && (socialMedia.facebook||socialMedia.instagram) && <div style={{display:"flex",gap:6,marginLeft:4}}>
                  {socialMedia.facebook&&<a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:12,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>f</a>}
                  {socialMedia.instagram&&<a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:12,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>📷</a>}
                </div>}
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <a href="https://facebook.com/frenciniz" target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:14,textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#1877F2"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>f</a>
                  <a href="https://instagram.com/frenciniz" target="_blank" rel="noopener noreferrer" style={{color:"#888",fontSize:14,textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#E4405F"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>📷</a>
                </div>
                {/* Language toggle */}
                <div style={{display:"flex",gap:0,borderRadius:4,overflow:"hidden",border:"1px solid #444"}}>
                  <button onClick={()=>setLang("tr")} style={{padding:"2px 8px",background:lang==="tr"?"#ff6000":"transparent",color:lang==="tr"?"#fff":"#999",border:"none",fontSize:11,fontWeight:600,cursor:"pointer"}}>TR</button>
                  <button onClick={()=>setLang("en")} style={{padding:"2px 8px",background:lang==="en"?"#ff6000":"transparent",color:lang==="en"?"#fff":"#999",border:"none",fontSize:11,fontWeight:600,cursor:"pointer"}}>EN</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"12px 20px",display:"flex",alignItems:"center",gap:isMobile?12:20}}>
            {/* Mobile hamburger */}
            {isMobile && <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:"none",border:"none",fontSize:22,color:"#333",padding:4,cursor:"pointer"}}>☰</button>}
            
            <div style={{cursor:"pointer",flexShrink:0}} onClick={() => go("home")}>
              <div style={{fontSize:isMobile?20:24,fontWeight:800,color:"#ff6000"}}>frenciniz</div>
              {!isMobile && <div style={{fontSize:10,color:"#999",marginTop:-2}}>Fren Aksamları</div>}
            </div>
            
            {/* Search — full on desktop, compact on mobile */}
            <div style={{flex:1,maxWidth:isMobile?999:500,display:"flex",border:"2px solid #ff6000",borderRadius:8,overflow:"hidden"}}>
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => {if(e.key==="Enter" && q.trim()) go("products",{q})}}
                placeholder={t("search")}
                style={{flex:1,padding:isMobile?"8px 10px":"10px 14px",border:"none",fontSize:isMobile?13:14,outline:"none"}} />
              <button onClick={() => {if(q.trim()) go("products",{q})}} style={{padding:isMobile?"8px 14px":"10px 20px",background:"#ff6000",color:"#fff",border:"none",fontSize:14,fontWeight:600}}>{t("searchBtn")}</button>
            </div>
            
            {/* Desktop actions */}
            {!isMobile && <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
              <button onClick={() => go("favs")} style={{background:"none",border:"none",color:"#555",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                <span style={{fontSize:20}}>♡</span><span>{t("favs")}</span>
                {favs.length > 0 && <span style={{position:"absolute",top:-4,right:-8,background:"#ff6000",color:"#fff",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{favs.length}</span>}
              </button>
              <button onClick={() => go(user ? "account" : "auth")} style={{background:"none",border:"none",color:"#555",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <span style={{fontSize:20}}>👤</span><span>{user ? user.name : t("login")}</span>
              </button>
              <button onClick={() => go("cart")} style={{background:"none",border:"none",color:"#555",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                <span style={{fontSize:20}}>🛒</span><span>{t("cart")}</span>
                {cartCount > 0 && <span style={{position:"absolute",top:-4,right:-8,background:"#ff6000",color:"#fff",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
              </button>
            </div>}
            
            {/* Mobile icons */}
            {isMobile && <>
              <button onClick={() => go(user ? "account" : "auth")} style={{background:"none",border:"none",fontSize:22,color:"#333",padding:4,cursor:"pointer",flexShrink:0}}>👤</button>
              <button onClick={() => go("cart")} style={{background:"none",border:"none",fontSize:22,color:"#333",position:"relative",padding:4,cursor:"pointer",flexShrink:0}}>
                🛒{cartCount>0&&<span style={{position:"absolute",top:-2,right:-6,background:"#ff6000",color:"#fff",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
              </button>
            </>}
          </div>
          
          {/* Category nav — desktop only */}
          {!isMobile && <div style={{borderTop:"1px solid #eee",background:"#fafafa"}}>
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
              {[{l:t("home"),p:"home"},...CATS.filter(c=>c.id!=="all").map(c=>({l:c.name,p:"products",pr:{cat:c.id}})),{l:t("brands"),p:"brands"},{l:t("contact"),p:"contact"}].map((n,i) => (
                <button key={i} onClick={() => go(n.p, n.pr||{})}
                  style={{padding:"10px 14px",background:"none",border:"none",fontSize:13,color:page===n.p?"#ff6000":"#555",fontWeight:page===n.p?600:400,borderBottom:page===n.p?"2px solid #ff6000":"2px solid transparent",whiteSpace:"nowrap"}}>
                  {n.l}
                </button>
              ))}
            </div>
          </div>}
        </header>

        {/* CONTENT */}
        {mobileMenuOpen && <MobileMenu />}
        {mobileFilterOpen && <MobileFilterDrawer />}
        <main style={{minHeight:"60vh"}}>
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
          {page==="shipping-policy"&&<ShippingPolicyPage/>}
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
        </main>

        {/* Cookie Consent Banner */}
        {!cookieOk && (
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9998,background:"#1a1a1a",borderTop:"1px solid #333",padding:isMobile?"16px":"16px 0",animation:"slideUp .4s ease"}}>
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:isMobile?"flex-start":"center",gap:isMobile?12:20,flexDirection:isMobile?"column":"row"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:"#ccc",lineHeight:1.7}}>
                  🍪 Bu web sitesi, deneyiminizi iyileştirmek ve hizmetlerimizi sunmak için çerezler kullanmaktadır. Sitemizi kullanarak <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>Gizlilik Politikamızı</span> ve <span onClick={()=>go("kvkk")} style={{color:"#ff6000",cursor:"pointer",textDecoration:"underline"}}>KVKK Aydınlatma Metnimizi</span> kabul etmiş sayılırsınız.
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>setCookieOk(true)} style={{padding:"10px 24px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer"}}>Kabul Et</button>
                <button onClick={()=>setCookieOk(true)} style={{padding:"10px 24px",background:"transparent",color:"#999",border:"1px solid #555",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer"}}>Sadece Gerekli</button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer style={{background:"#1a1a1a",color:"#ccc",padding:"40px 0 20px",marginTop:40}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
            {/* Newsletter */}
            <div style={{background:"#252525",borderRadius:8,padding:isMobile?"20px":"24px 28px",marginBottom:32,display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"stretch":"center",gap:isMobile?16:20}}>
              <div>
                <div style={{fontSize:isMobile?16:18,fontWeight:700,color:"#fff",marginBottom:4}}>{t("newsletter")}</div>
                <div style={{fontSize:13,color:"#888"}}>{t("newsletterDesc")}</div>
              </div>
              <div style={{display:"flex",gap:0,flexShrink:0}}>
                <input placeholder="E-posta" style={{padding:"10px 14px",border:"1px solid #444",borderRight:"none",borderRadius:"6px 0 0 6px",background:"#333",color:"#fff",fontSize:13,width:isMobile?"100%":240,flex:isMobile?1:"none",outline:"none"}}/>
                <button style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:"0 6px 6px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("subscribe")}</button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:isMobile?20:32}}>
              <div style={isMobile?{gridColumn:"1 / -1"}:{}}>
                <div style={{fontSize:22,fontWeight:800,color:"#ff6000",marginBottom:12,cursor:"pointer"}} onClick={()=>go("home")}>frenciniz</div>
                <p style={{fontSize:13,color:"#888",lineHeight:1.7}}>Otobüs, kamyon, tır ve dorse için fren aksamı ürünleri.</p>
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <a href="https://facebook.com/frenciniz" target="_blank" rel="noopener noreferrer" style={{width:36,height:36,borderRadius:8,background:"#333",display:"flex",alignItems:"center",justifyContent:"center",color:"#888",fontSize:16,textDecoration:"none",transition:"background .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#1877F2";e.currentTarget.style.color="#fff"}} onMouseLeave={e=>{e.currentTarget.style.background="#333";e.currentTarget.style.color="#888"}}>f</a>
                  <a href="https://instagram.com/frenciniz" target="_blank" rel="noopener noreferrer" style={{width:36,height:36,borderRadius:8,background:"#333",display:"flex",alignItems:"center",justifyContent:"center",color:"#888",fontSize:16,textDecoration:"none",transition:"background .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#E4405F";e.currentTarget.style.color="#fff"}} onMouseLeave={e=>{e.currentTarget.style.background="#333";e.currentTarget.style.color="#888"}}>📷</a>
                </div>
                <div style={{marginTop:16,fontSize:13,color:"#888",lineHeight:2}}>📍 Hızırbey Mah. 1509 Sok. No:24, Isparta<br/>📞 0850 888 7881 – 0545 608 7008<br/>✉ info@frenciniz.com</div>
                {/* Social Media Icons */}
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  {[{key:"facebook",icon:"f",color:"#1877F2",label:"Facebook"},{key:"instagram",icon:"📷",color:"#E4405F",label:"Instagram"},{key:"twitter",icon:"𝕏",color:"#000",label:"X"},{key:"youtube",icon:"▶",color:"#FF0000",label:"YouTube"}]
                    .filter(s=>socialMedia[s.key])
                    .map(s=>(
                      <a key={s.key} href={socialMedia[s.key]} target="_blank" rel="noopener noreferrer"
                        style={{width:34,height:34,borderRadius:8,background:"#333",display:"flex",alignItems:"center",justifyContent:"center",color:"#999",fontSize:14,fontWeight:700,textDecoration:"none",transition:"background .2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=s.color;e.currentTarget.style.color="#fff"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#333";e.currentTarget.style.color="#999"}}
                        title={s.label}>{s.icon}</a>
                    ))}
                  {!socialMedia.facebook&&!socialMedia.instagram&&!socialMedia.twitter&&!socialMedia.youtube&&
                    <span style={{fontSize:11,color:"#555"}}>Sosyal medya hesapları admin panelinden eklenebilir.</span>}
                </div>
              </div>
              {/* Kategoriler */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Kategoriler</div>
                {[{l:"Disk Fren",p:"products",pr:{cat:"disk"}},{l:"Kampana",p:"products",pr:{cat:"mekanik"}},{l:"Pnömatik",p:"products",pr:{cat:"pnomatik"}},{l:"Elektronik",p:"products",pr:{cat:"elektronik"}},{l:"Balatalar",p:"products",pr:{cat:"balata"}}].map((item,j) => (
                  <div key={j} onClick={()=>go(item.p,item.pr)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
              {/* Bilgi */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Bilgi</div>
                {[{l:"Hakkımızda",p:"about"},{l:"Şirket Bilgileri",p:"company"},{l:"SSS",p:"faq"},{l:"Gönderim Politikası",p:"shipping-policy"},{l:"İade Politikası",p:"return-policy"},{l:"Şartlar ve Koşullar",p:"terms"},{l:"Gizlilik Politikası",p:"privacy"},{l:"KVKK Aydınlatma",p:"kvkk"},{l:"Erişilebilirlik",p:"accessibility"}].map((item,j) => (
                  <div key={j} onClick={()=>go(item.p)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
              {/* Hesap */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Hesap</div>
                {[{l:"Giriş Yap",p:"auth"},{l:"Kayıt Ol",p:"auth"},{l:"Siparişlerim",p:"account"},{l:"Favorilerim",p:"favs"}].map((item,j) => (
                  <div key={j} onClick={()=>go(item.p)} style={{fontSize:13,color:"#888",marginBottom:8,cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6000"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>{item.l}</div>
                ))}
              </div>
            </div>
            <div style={{marginTop:24,paddingTop:16,borderTop:"1px solid #333",display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",gap:8,fontSize:12,color:"#666"}}>
              <span>© 2026 <span onClick={()=>go("admin-login")} style={{cursor:"pointer"}}>Frenciniz</span> — Tüm hakları saklıdır.</span>
              <span>Visa · Mastercard · Troy · Havale/EFT</span>
            </div>
          </div>
        </footer>
      </div>
    </Ctx.Provider>
  );
}

// ===== PRODUCT CARD with Favorite =====
function ProductCard({p}) {
  const {go, addToCart, favs, toggleFav, fp} = use$();
  const [showAlert, setShowAlert] = useState(false);
  const disc = p.old ? Math.round((1 - p.price/p.old) * 100) : 0;
  const isFav = favs.includes(p.id);

  return (
    <div onClick={() => go("product",{id:p.id})}
      style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden",cursor:"pointer",background:"#fff",transition:"box-shadow .2s"}}
      onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
      <div style={{height:200,background:"#f9f9f9",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <img src={p.img} alt={p.name} style={{maxWidth:"80%",maxHeight:"80%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
        {disc > 0 && <span style={{position:"absolute",top:8,left:8,background:"#ff6000",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:4}}>%{disc}</span>}
        {/* Favorite button */}
        <button onClick={e => {e.stopPropagation(); toggleFav(p.id)}}
          style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:"50%",background:"#fff",border:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:isFav?"#ff6000":"#ccc",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
          {isFav ? "♥" : "♡"}
        </button>
        {!p.stock && <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.8)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{background:"#f0f0f0",padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,color:"#999"}}>Tükendi</span></div>}
      </div>
      <div style={{padding:"12px 14px 16px"}}>
        <div style={{fontSize:12,color:"#ff6000",fontWeight:600,marginBottom:4}}>{p.brand}</div>
        <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",lineHeight:1.35,marginBottom:4,minHeight:38}}>{p.name}</div>
        <div style={{fontSize:11,color:"#bbb",marginBottom:8}}>{p.sku}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}>
          <span style={{color:"#f5a623",fontSize:13}}>★</span>
          <span style={{fontSize:13,color:"#666"}}>{p.rating}</span>
          <span style={{fontSize:12,color:"#bbb"}}>({p.reviews})</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <span style={{fontSize:20,fontWeight:700,color:"#1a1a1a"}}>{fp(p.price)}</span>
            {p.old && <span style={{fontSize:13,color:"#bbb",textDecoration:"line-through",marginLeft:6}}>{fp(p.old)}</span>}
          </div>
          <button onClick={e => {e.stopPropagation(); p.stock ? addToCart(p) : setShowAlert(true)}}
            style={{padding:"8px 14px",background:p.stock?"#ff6000":"#fff",color:p.stock?"#fff":"#ff6000",border:p.stock?"none":"1px solid #ff6000",borderRadius:6,fontSize:p.stock?13:11,fontWeight:600}}>
            {p.stock ? "Sepete Ekle" : "🔔 Haber Ver"}
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
  const {viewed, go, fp} = use$();
  const items = viewed.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>Son Görüntülediğiniz Ürünler</h2>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
        {items.slice(0,6).map(p => (
          <div key={p.id} onClick={() => go("product",{id:p.id})}
            style={{minWidth:160,border:"1px solid #eee",borderRadius:8,padding:12,cursor:"pointer",background:"#fff",flexShrink:0}}>
            <img src={p.img} alt="" style={{width:"100%",height:100,objectFit:"contain",marginBottom:8}} onError={e=>{e.target.style.display="none"}}/>
            <div style={{fontSize:12,fontWeight:500,color:"#333",lineHeight:1.3,marginBottom:4}}>{p.name}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{fp(p.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== HOME =====
function HomePage() {
  const {go, isMobile, t} = use$();
  const popular = useMemo(() => [...PRODUCTS].sort((a,b) => b.reviews - a.reviews).slice(0,8), []);
  const discounted = PRODUCTS.filter(p => p.old);

  return <>
    {/* Banner */}
    <div style={{background:"linear-gradient(90deg, #ff6000, #ff8c00)",padding:"40px 0"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{fontSize:32,fontWeight:800,color:"#fff",marginBottom:8}}>Fren Aksamı Uzmanı</h1>
          <p style={{fontSize:16,color:"rgba(255,255,255,.85)",marginBottom:20}}>10.000+ orijinal ve eşdeğer parça. Aynı gün kargo, 12 taksit.</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#fff",color:"#ff6000",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer"}}>Ürünleri İncele</button>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[{n:"10.000+",l:"Ürün"},{n:"25+",l:"Marka"},{n:"5.000+",l:"Müşteri"}].map((s,i) => (
            <div key={i} style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:28,fontWeight:800}}>{s.n}</div><div style={{fontSize:12,opacity:.8}}>{s.l}</div></div>
          ))}
        </div>
      </div>
    </div>

    {/* Vehicles */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("byVehicle")}</h2>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
        {[{id:"kamyon",name:"Kamyon",emoji:"🚚",count:"4.200+"},{id:"tir",name:"Tır / Çekici",emoji:"🚛",count:"3.800+"},{id:"otobus",name:"Otobüs",emoji:"🚌",count:"2.900+"},{id:"dorse",name:"Dorse",emoji:"⬜",count:"1.600+"}].map(v => (
          <div key={v.id} onClick={() => go("products",{veh:v.id})}
            style={{padding:isMobile?"14px":"20px",border:"1px solid #eee",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e => e.currentTarget.style.borderColor="#eee"}>
            <span style={{fontSize:isMobile?24:32}}>{v.emoji}</span>
            <div><div style={{fontSize:isMobile?13:15,fontWeight:600}}>{v.name}</div><div style={{fontSize:12,color:"#999"}}>{v.count} {t("pieces")}</div></div>
          </div>
        ))}
      </div>
    </div>

    {/* Popular */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px 32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700}}>{t("bestSellers")}</h2>
        <button onClick={() => go("products")} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("seeAll")}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{popular.slice(0,4).map(p => <ProductCard key={p.id} p={p} />)}</div>
    </div>

    {/* Discounted */}
    {discounted.length > 0 && <div style={{background:"#fff8f0",padding:"32px 0"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("discounted")}</h2>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{discounted.slice(0,4).map(p => <ProductCard key={p.id} p={p} />)}</div>
      </div>
    </div>}

    {/* Brands */}
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>Markalar</h2>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {BRANDS.map(b => <button key={b} onClick={() => go("products",{brand:b})} style={{padding:"10px 20px",border:"1px solid #e0e0e0",borderRadius:6,background:"#fff",fontSize:13,fontWeight:600,color:"#444",cursor:"pointer"}}>{b}</button>)}
      </div>
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

// ===== PRODUCTS =====
function ProductsPage() {
  const {params, q, go, isMobile, t} = use$();
  const [cat, setCat] = useState(params?.cat || "all");
  const [veh, setVeh] = useState(params?.veh || "all");
  const [brand, setBrand] = useState(params?.brand || "all");
  const [sort, setSort] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {setCat(params?.cat||"all"); setVeh(params?.veh||"all"); setBrand(params?.brand||"all")}, [params]);

  const term = params?.q || q || "";
  const items = useMemo(() => {
    let r = PRODUCTS.filter(p => {
      if(cat!=="all" && p.cat!==cat) return false;
      if(veh!=="all" && !p.veh.includes(veh)) return false;
      if(brand!=="all" && p.brand!==brand) return false;
      if(term && ![p.name,p.brand,p.sku,p.oem].some(s=>s.toLowerCase().includes(term.toLowerCase()))) return false;
      return true;
    });
    if(sort==="price-asc") r=[...r].sort((a,b)=>a.price-b.price);
    else if(sort==="price-desc") r=[...r].sort((a,b)=>b.price-a.price);
    else r=[...r].sort((a,b)=>b.reviews-a.reviews);
    return r;
  }, [cat,veh,brand,sort,term]);

  const activeFilters = (cat!=="all"?1:0)+(veh!=="all"?1:0)+(brand!=="all"?1:0);

  const FilterPanel = () => (
    <>
      {[{t:t("category"),items:CATS,val:cat,set:setCat},{t:t("vehicleType"),items:VEHS,val:veh,set:setVeh}].map((sec,si) => (
        <div key={si} style={{border:"1px solid #eee",borderRadius:8,padding:16,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{sec.t}</div>
          {sec.items.map(item => <div key={item.id} onClick={() => sec.set(item.id)} style={{padding:"7px 0",fontSize:13,color:sec.val===item.id?"#ff6000":"#555",fontWeight:sec.val===item.id?600:400,cursor:"pointer"}}>{item.name}</div>)}
        </div>
      ))}
      <div style={{border:"1px solid #eee",borderRadius:8,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t("brand")}</div>
        <div onClick={() => setBrand("all")} style={{padding:"7px 0",fontSize:13,color:brand==="all"?"#ff6000":"#555",fontWeight:brand==="all"?600:400,cursor:"pointer"}}>{t("allBrands")}</div>
        {BRANDS.map(b => <div key={b} onClick={() => setBrand(b)} style={{padding:"7px 0",fontSize:13,color:brand===b?"#ff6000":"#555",fontWeight:brand===b?600:400,cursor:"pointer"}}>{b}</div>)}
      </div>
    </>
  );

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={() => go("home")}>{t("home")}</span> / <span style={{color:"#555"}}>{term ? `"${term}"` : cat!=="all" ? CATS.find(c=>c.id===cat)?.name : t("allProducts")}</span></div>
      
      <div style={{display:"flex",gap:20}}>
        {/* Desktop sidebar */}
        {!isMobile && <div style={{width:220,flexShrink:0}}><FilterPanel /></div>}

        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:10,flexWrap:"wrap"}}>
            <h1 style={{fontSize:isMobile?18:20,fontWeight:700}}>{term ? `"${term}"` : cat!=="all" ? CATS.find(c=>c.id===cat)?.name : t("allProducts")} <span style={{fontSize:14,fontWeight:400,color:"#999"}}>({items.length})</span></h1>
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
            <div style={{textAlign:"center",padding:"60px 0",color:"#999"}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div style={{fontSize:16,fontWeight:600}}>{t("noResults")}</div></div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:isMobile?10:16}}>{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
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
  );
}

// ===== PRODUCT DETAIL =====
function ProductDetailPage() {
  const {params, go, addToCart, addViewed, favs, toggleFav, addStockAlert, isMobile, t, fp} = use$();
  const p = PRODUCTS.find(x => x.id === params?.id);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => { if(p) addViewed(p.id); }, [p?.id]);

  if(!p) return <div style={{padding:"60px 20px",textAlign:"center",color:"#999"}}>Ürün bulunamadı.</div>;
  const disc = p.old ? Math.round((1-p.price/p.old)*100) : 0;
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0,4);
  const isFav = favs.includes(p.id);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <div style={{fontSize:13,color:"#999",marginBottom:20}}>
        <span style={{cursor:"pointer"}} onClick={() => go("home")}>Ana Sayfa</span> / <span style={{cursor:"pointer"}} onClick={() => go("products",{cat:p.cat})}>{CATS.find(c=>c.id===p.cat)?.name}</span> / <span style={{color:"#555"}}>{p.name}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?20:32,marginBottom:40}}>
        {/* Image Gallery */}
        <ImageGallery images={PROD_IMAGES[p.id] || [p.img]} discount={disc} />
        <div>
          <div style={{fontSize:13,color:"#ff6000",fontWeight:600,marginBottom:6}}>{p.brand}</div>
          <h1 style={{fontSize:24,fontWeight:700,marginBottom:8}}>{p.name}</h1>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <span style={{color:"#f5a623"}}>★ {p.rating}</span>
            <span style={{color:"#999",fontSize:13}}>{p.reviews} değerlendirme</span>
          </div>
          <div style={{fontSize:13,color:"#999",marginBottom:16}}>SKU: {p.sku} | OEM: {p.oem}</div>
          <p style={{fontSize:14,color:"#666",lineHeight:1.7,marginBottom:16}}>{p.desc}</p>
          <div style={{padding:"16px 20px",background:"#f9f9f9",borderRadius:8,marginBottom:20,border:"1px solid #eee"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:32,fontWeight:800}}>{fp(p.price)}</span>
              {p.old && <span style={{fontSize:16,color:"#bbb",textDecoration:"line-through"}}>{fp(p.old)}</span>}
              <span style={{fontSize:12,color:"#999"}}>+ KDV</span>
            </div>
            <div style={{marginTop:8,fontSize:13,color:p.stock?"#4caf50":"#e53935",fontWeight:600}}>{p.stock ? `Stokta (${p.stock} adet)` : "Stok Dışı"}</div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:p.stock?20:10}}>
            <div style={{display:"flex",border:"1px solid #ddd",borderRadius:6,overflow:"hidden"}}>
              <button onClick={() => setQty(Math.max(1,qty-1))} style={{width:40,height:44,background:"#f5f5f5",border:"none",fontSize:18,color:"#555"}}>−</button>
              <span style={{width:48,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600}}>{qty}</span>
              <button onClick={() => setQty(qty+1)} style={{width:40,height:44,background:"#f5f5f5",border:"none",fontSize:18,color:"#555"}}>+</button>
            </div>
            <button onClick={() => p.stock && addToCart(p, qty)} style={{flex:1,padding:"12px",background:p.stock?"#ff6000":"#eee",color:p.stock?"#fff":"#999",border:"none",borderRadius:6,fontSize:16,fontWeight:700,cursor:p.stock?"pointer":"default"}}>
              {p.stock ? "Sepete Ekle" : "Stok Dışı"}
            </button>
            <button onClick={() => toggleFav(p.id)} style={{width:48,height:48,border:"1px solid #eee",borderRadius:6,background:"#fff",fontSize:22,color:isFav?"#ff6000":"#ccc",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              {isFav ? "♥" : "♡"}
            </button>
          </div>
          {/* Stock Alert for out-of-stock */}
          {!p.stock && (
            <div style={{padding:"14px 16px",background:"#fffbf0",border:"1px solid #ffeeba",borderRadius:8,marginBottom:20}}>
              {alertSent ? (
                <div style={{fontSize:14,color:"#4caf50",fontWeight:600,display:"flex",alignItems:"center",gap:8}}>✓ Kayıt alındı! Stok gelince size haber vereceğiz.</div>
              ) : (
                <>
                  <div style={{fontSize:13,fontWeight:600,color:"#856404",marginBottom:8}}>🔔 Bu ürün şu anda stokta yok. Gelince haber verelim mi?</div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="E-posta veya telefon numaranız"
                      style={{flex:1,padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,outline:"none"}} />
                    <button onClick={() => {if(alertEmail.trim()){addStockAlert(p.id,alertEmail);setAlertSent(true)}}}
                      style={{padding:"9px 18px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Haber Ver</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{icon:"🚚",text:"Aynı gün kargo"},{icon:"🔄",text:"14 gün iade"},{icon:"🛡️",text:"Orijinal garanti"},{icon:"💳",text:"12 taksit"}].map((f,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f9f9f9",borderRadius:6,fontSize:12,color:"#666"}}><span>{f.icon}</span>{f.text}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{borderBottom:"1px solid #eee",display:"flex",gap:0,marginBottom:20}}>
        {[{id:"desc",l:"Açıklama"},{id:"specs",l:"Teknik Özellikler"},{id:"compat",l:"Uyumlu Araçlar"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{padding:"12px 24px",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#ff6000":"transparent"}`,color:tab===t.id?"#1a1a1a":"#999",fontSize:14,fontWeight:tab===t.id?600:400,cursor:"pointer",marginBottom:-1}}>{t.l}</button>
        ))}
      </div>
      {tab==="desc" && <p style={{fontSize:15,color:"#555",lineHeight:1.8,marginBottom:32}}>{p.desc}</p>}
      {tab==="specs" && <div style={{marginBottom:32}}>{Object.entries(p.specs).map(([k,v],i) => (<div key={k} style={{display:"flex",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{width:200,color:"#999"}}>{k}</span><span style={{fontWeight:500,color:"#333"}}>{v}</span></div>))}</div>}
      {tab==="compat" && <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:32}}>{p.compat.map((c,i) => <span key={i} style={{padding:"8px 16px",background:"#f5f5f5",borderRadius:6,fontSize:13,color:"#555"}}>{c}</span>)}</div>}
      {related.length > 0 && <div><h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{t("similarProducts")}</h2><div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{related.map(rp => <ProductCard key={rp.id} p={rp} />)}</div></div>}
      <RecentlyViewed />
    </div>
  );
}

// ===== CART with Coupon + Shipping Progress =====
function CartPage() {
  const {cart, updateQty, removeItem, cartTotal, go, coupon, setCoupon, couponApplied, setCouponApplied, discount, isMobile, t, fp} = use$();
  const ship = cartTotal >= 500 ? 0 : 45;
  const shippingProgress = Math.min((cartTotal / 500) * 100, 100);
  const remaining = Math.max(500 - cartTotal, 0);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Sepetim</h1>
      {cart.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><p style={{color:"#999",marginBottom:16}}>Sepetiniz boş</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Alışverişe Başla</button></div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 320px",gap:24,alignItems:"start"}}>
          <div>
            {/* Free shipping progress */}
            <div style={{padding:"14px 16px",background:cartTotal >= 500 ? "#e8f5e9" : "#fff8e1",borderRadius:8,marginBottom:16,border:`1px solid ${cartTotal >= 500 ? "#c8e6c9" : "#fff3c4"}`}}>
              {cartTotal >= 500 ? (
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
            <div style={{border:"1px solid #eee",borderRadius:8}}>
              {cart.map((item,i) => (
                <div key={item.id} style={{display:"flex",gap:16,padding:"16px",borderBottom:i<cart.length-1?"1px solid #f0f0f0":"none",alignItems:"center"}}>
                  <img src={item.img} alt="" style={{width:72,height:72,objectFit:"contain",borderRadius:6,background:"#f9f9f9"}} onError={e=>{e.target.style.display="none"}}/>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{item.name}</div><div style={{fontSize:12,color:"#999"}}>{item.brand} · {item.sku}</div></div>
                  <div style={{display:"flex",alignItems:"center",border:"1px solid #ddd",borderRadius:6,overflow:"hidden"}}>
                    <button onClick={() => updateQty(item.id, item.qty-1)} style={{width:32,height:32,background:"#f9f9f9",border:"none",fontSize:16,color:"#555",cursor:"pointer"}}>−</button>
                    <span style={{width:36,textAlign:"center",fontSize:13,fontWeight:600}}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty+1)} style={{width:32,height:32,background:"#f9f9f9",border:"none",fontSize:16,color:"#555",cursor:"pointer"}}>+</button>
                  </div>
                  <div style={{width:100,textAlign:"right",fontSize:16,fontWeight:700}}>{fp(item.price*item.qty)}</div>
                  <button onClick={() => removeItem(item.id)} style={{background:"none",border:"none",color:"#ccc",fontSize:18,cursor:"pointer"}}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{border:"1px solid #eee",borderRadius:8,padding:20,position:"sticky",top:120}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Sipariş Özeti</h3>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#666"}}>{t("subtotal")}</span><span style={{fontWeight:600}}>{fp(cartTotal)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#666"}}>{t("shipping")}</span><span style={{fontWeight:600,color:ship===0?"#4caf50":"inherit"}}>{ship===0?t("free"):`${fp(ship)}`}</span></div>
            {couponApplied && <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"#4caf50"}}>Kupon (%10)</span><span style={{fontWeight:600,color:"#4caf50"}}>-{fp(discount)}</span></div>}

            {/* Coupon code */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:0,marginTop:8}}>
                <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Kupon kodu"
                  style={{flex:1,padding:"8px 12px",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:13,outline:"none"}} disabled={couponApplied}/>
                <button onClick={() => {if(coupon.trim() && !couponApplied) setCouponApplied(true)}}
                  style={{padding:"8px 14px",background:couponApplied?"#4caf50":"#333",color:"#fff",border:"none",borderRadius:"0 6px 6px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {couponApplied ? "✓ Uygulandı" : "Uygula"}
                </button>
              </div>
              {!couponApplied && <div style={{fontSize:11,color:"#999",marginTop:4}}>Deneme için herhangi bir kod girin</div>}
            </div>

            <div style={{borderTop:"1px solid #eee",padding:"12px 0 0"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16,fontWeight:700}}>{t("total")}</span><span style={{fontSize:22,fontWeight:800,color:"#ff6000"}}>{fp(cartTotal + ship - discount)}</span></div>
            </div>
            <button onClick={() => go("checkout")} style={{width:"100%",padding:"14px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:16,fontWeight:700,cursor:"pointer",marginTop:16}}>Siparişi Tamamla</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CHECKOUT =====
function CheckoutPage() {
  const {cart, cartTotal, go, discount, completePurchase, isMobile, fp} = use$();
  const [step, setStep] = useState(1);
  const ship = cartTotal >= 500 ? 0 : 45;
  if(!cart.length) return <div style={{textAlign:"center",padding:"60px 20px"}}><p style={{color:"#999"}}>Sepetiniz boş.</p></div>;
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Sipariş</h1>
      <div style={{display:"flex",gap:16,marginBottom:28}}>
        {[{n:1,l:"Teslimat"},{n:2,l:"Ödeme"},{n:3,l:"Onay"}].map((s,i) => (
          <div key={s.n} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,background:step>=s.n?"#ff6000":"#eee",color:step>=s.n?"#fff":"#999"}}>{s.n}</div>
            <span style={{fontSize:14,fontWeight:step===s.n?700:400,color:step===s.n?"#1a1a1a":"#999"}}>{s.l}</span>
            {i<2 && <span style={{color:"#ddd",margin:"0 4px"}}>—</span>}
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:28}}>
        {step===1 && <>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>Teslimat Bilgileri</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[{l:"Ad",ph:"Adınız"},{l:"Soyad",ph:"Soyadınız"},{l:"E-posta",ph:"ornek@email.com"},{l:"Telefon",ph:"05xx xxx xx xx"}].map((f,i) => <div key={i}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{f.l}</label><input placeholder={f.ph} style={IS}/></div>)}
          </div>
          <div style={{marginTop:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Adres</label><textarea rows={3} placeholder="Teslimat adresi" style={{...IS,resize:"vertical"}}/></div>
          <button onClick={() => setStep(2)} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:20}}>Devam Et →</button>
        </>}
        {step===2 && <>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>Ödeme Bilgileri</h2>
          {/* Payment method selection */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:8}}>Ödeme Yöntemi</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {[{id:"card",icon:"💳",name:"Kredi / Banka Kartı",desc:"Garanti BBVA / PayTR / Param"},{id:"havale",icon:"🏦",name:"Havale / EFT",desc:"Banka havalesi ile ödeme"},{id:"kapida",icon:"🚚",name:"Kapıda Ödeme",desc:"Teslimat sırasında ödeme"},{id:"taksit",icon:"📊",name:"Taksitli Ödeme",desc:"2-12 taksit imkânı"}].map(m=>(
                <div key={m.id} style={{padding:"12px 14px",border:"2px solid #eee",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"border-color .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e=>e.currentTarget.style.borderColor="#eee"}>
                  <span style={{fontSize:22}}>{m.icon}</span>
                  <div><div style={{fontSize:13,fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:"#999"}}>{m.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          {/* Card logos */}
          <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
            {[{n:"Garanti BBVA",c:"#00854A"},{n:"PayTR",c:"#1a9c5b"},{n:"Param",c:"#0066cc"}].map(g=>(
              <span key={g.n} style={{padding:"4px 12px",borderRadius:4,fontSize:11,fontWeight:600,background:g.c+"15",color:g.c}}>{g.n}</span>
            ))}
            <span style={{fontSize:11,color:"#999",marginLeft:4}}>ile güvenli ödeme</span>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Kart Numarası</label><input placeholder="0000 0000 0000 0000" style={IS}/></div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:14}}>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>İsim</label><input placeholder="AD SOYAD" style={IS}/></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Tarih</label><input placeholder="AA/YY" style={IS}/></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>CVV</label><input placeholder="***" type="password" style={IS}/></div>
          </div>
          {/* 3D Secure notice */}
          <div style={{marginTop:14,padding:"10px 14px",background:"#f0fdf4",borderRadius:6,border:"1px solid #bbf7d0",fontSize:12,color:"#15803d",display:"flex",alignItems:"center",gap:8}}>
            🔒 Ödemeniz 3D Secure ile korunmaktadır.
          </div>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button onClick={() => setStep(1)} style={{padding:"12px 24px",background:"#f5f5f5",color:"#555",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>← Geri</button>
            <button onClick={() => {completePurchase(); setStep(3)}} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Siparişi Onayla</button>
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

// ===== AUTH — Phone Registration + SMS OTP + Forgot Password =====
function AuthPage() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [regData, setRegData] = useState({name:"",email:"",phone:"",password:""});
  const {go, setUser} = use$();

  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};

  if(mode === "forgot") return (
    <div style={{maxWidth:400,margin:"40px auto",padding:"0 20px"}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:28}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Şifremi Unuttum</h2>
        <p style={{fontSize:14,color:"#888",marginBottom:20}}>Kayıtlı e-posta adresinizi veya telefon numaranızı girin.</p>
        <input placeholder="E-posta veya telefon numarası" style={{...IS, marginBottom:14}}/>
        <button onClick={() => {setOtpSent(true)}}
          style={{width:"100%",padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:12}}>
          {otpSent ? "✓ Gönderildi" : "Sıfırlama Kodu Gönder"}
        </button>
        {otpSent && <div style={{padding:"12px",background:"#e8f5e9",borderRadius:6,fontSize:13,color:"#2e7d32",textAlign:"center",marginBottom:12}}>Şifre sıfırlama bağlantısı gönderildi.</div>}
        <button onClick={() => setMode("login")} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",display:"block",margin:"0 auto"}}>← Giriş ekranına dön</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:400,margin:"40px auto",padding:"0 20px"}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:28}}>
        {/* Tabs */}
        <div style={{display:"flex",marginBottom:24}}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{flex:1,padding:"10px",background:"none",border:"none",borderBottom:`2px solid ${mode===m?"#ff6000":"#eee"}`,color:mode===m?"#1a1a1a":"#999",fontSize:14,fontWeight:mode===m?700:400,cursor:"pointer"}}>
              {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>E-posta veya Telefon</label>
              <input placeholder="ornek@email.com veya 05xx xxx xx xx" style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Şifre</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} placeholder="••••••••" style={{...IS,paddingRight:44}}/>
                <button onClick={() => setShowPw(!showPw)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#999",fontSize:13,cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#666",cursor:"pointer"}}>
                <input type="checkbox" style={{accentColor:"#ff6000"}}/> Beni hatırla
              </label>
              <button onClick={() => {setMode("forgot"); setOtpSent(false)}} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer"}}>Şifremi unuttum</button>
            </div>
            <button onClick={() => {setUser({name:"Kullanıcı"}); go("account")}}
              style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>Giriş Yap</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Ad Soyad</label>
              <input value={regData.name} onChange={e => setRegData({...regData,name:e.target.value})} placeholder="Adınız Soyadınız" style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Telefon Numarası</label>
              <div style={{display:"flex",gap:0}}>
                <span style={{padding:"10px 12px",background:"#f5f5f5",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:14,color:"#555"}}>+90</span>
                <input value={regData.phone} onChange={e => setRegData({...regData,phone:e.target.value.replace(/\D/g,"")})} placeholder="5XX XXX XX XX" maxLength={10}
                  style={{...IS,borderRadius:"0 6px 6px 0",flex:1}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>E-posta</label>
              <input value={regData.email} onChange={e => setRegData({...regData,email:e.target.value})} type="email" placeholder="ornek@email.com" style={IS}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Şifre</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={regData.password} onChange={e => setRegData({...regData,password:e.target.value})} placeholder="En az 6 karakter" style={{...IS,paddingRight:44}}/>
                <button onClick={() => setShowPw(!showPw)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#999",fontSize:13,cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#888",cursor:"pointer"}}>
              <input type="checkbox" style={{accentColor:"#ff6000",marginTop:2}}/> 
              <span><span onClick={()=>go("terms")} style={{color:"#ff6000",cursor:"pointer"}}>Kullanım koşullarını</span> ve <span onClick={()=>go("privacy")} style={{color:"#ff6000",cursor:"pointer"}}>gizlilik politikasını</span> kabul ediyorum.</span>
            </label>
            <button onClick={() => {setUser({name:regData.name||"Kullanıcı"}); go("account")}}
              style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>Kayıt Ol</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ACCOUNT =====
function AccountPage() {
  const {user, setUser, go, pastOrders, addToCart, fp} = use$();
  if(!user) return <div style={{textAlign:"center",padding:"60px 20px"}}><p style={{color:"#999",marginBottom:16}}>Giriş yapmanız gerekiyor.</p><button onClick={() => go("auth")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Giriş Yap</button></div>;

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
        <h1 style={{fontSize:22,fontWeight:700}}>Hesabım</h1>
        <button onClick={() => {setUser(null); go("home")}} style={{padding:"8px 16px",background:"none",border:"1px solid #ddd",borderRadius:6,fontSize:13,color:"#999",cursor:"pointer"}}>Çıkış Yap</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:32}}>
        {[
          {icon:"📦",title:"Siparişlerim",desc:"Sipariş geçmişinizi takip edin",onClick:()=>go("orders")},
          {icon:"📍",title:"Adreslerim",desc:"Teslimat adreslerinizi yönetin",onClick:()=>go("addresses")},
          {icon:"👤",title:"Hesap Bilgileri",desc:"Kişisel bilgilerinizi güncelleyin",onClick:()=>go("profile")},
          {icon:"♥",title:"Favorilerim",desc:"Beğendiğiniz ürünleri görüntüleyin",onClick:()=>go("favs")},
          {icon:"🔔",title:"Bildirimler",desc:"E-posta ve SMS tercihleriniz",onClick:()=>go("notifications")},
          {icon:"🔑",title:"Şifre Değiştir",desc:"Hesap güvenliğinizi güncelleyin",onClick:()=>go("change-password")},
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
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>🔄 Sık Aldığınız Ürünler</h2>
          <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
            {frequentItems.map((item, i) => (
              <div key={item.id} style={{display:"flex",gap:14,padding:"14px 16px",borderBottom:i<frequentItems.length-1?"1px solid #f0f0f0":"none",alignItems:"center"}}>
                <img src={item.img} alt="" style={{width:52,height:52,objectFit:"contain",borderRadius:6,background:"#f9f9f9"}} onError={e=>{e.target.style.display="none"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{item.name}</div>
                  <div style={{fontSize:12,color:"#999"}}>{item.brand} · {item.sku}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:2}}>Toplam {item.totalQty} adet sipariş edildi</div>
                </div>
                <div style={{textAlign:"right",marginRight:12}}>
                  <div style={{fontSize:16,fontWeight:700}}>{fp(item.price)}</div>
                  {item.currentProduct && <div style={{fontSize:11,color:item.currentProduct.stock?"#4caf50":"#e53935"}}>{item.currentProduct.stock ? "Stokta" : "Tükendi"}</div>}
                </div>
                <button onClick={() => {if(item.currentProduct?.stock) addToCart(item.currentProduct)}}
                  style={{padding:"8px 16px",background:item.currentProduct?.stock?"#ff6000":"#eee",color:item.currentProduct?.stock?"#fff":"#999",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:item.currentProduct?.stock?"pointer":"default",whiteSpace:"nowrap"}}>
                  Tekrar Al
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
  const {favs, go, isMobile} = use$();
  const items = favs.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Favorilerim ({items.length})</h1>
      {items.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:12}}>♡</div><p style={{color:"#999",marginBottom:16}}>Henüz favori ürününüz yok</p>
          <button onClick={() => go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Ürünleri İncele</button></div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16}}>{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}

// ===== BRANDS / ABOUT / CONTACT / FAQ =====
function BrandsPage() {
  const {go}=use$();
  return <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Markalar</h1>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
      {BRANDS.map(b => <div key={b} onClick={() => go("products",{brand:b})} style={{padding:"24px 16px",border:"1px solid #eee",borderRadius:8,textAlign:"center",cursor:"pointer",fontSize:15,fontWeight:600,transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#ff6000"} onMouseLeave={e=>e.currentTarget.style.borderColor="#eee"}>{b}</div>)}
    </div></div>;
}

function AboutPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:16}}>Hakkımızda</h1>
    <div style={{color:"#555",fontSize:15,lineHeight:1.8}}>
      <p style={{marginBottom:14}}><strong>Frenciniz</strong>, Dumanlar Ticaret çatısı altında otobüs, kamyon, tır ve dorse fren aksamı ürünlerini sizlere güvenle sunar. Bizim için sadece ürün satmak değil, yolda güveninizi sağlamak en büyük önceliğimizdir.</p>
      <p style={{marginBottom:14}}>Her parçamızda kaliteyi, dayanıklılığı ve uyumu ön planda tutuyoruz. Çünkü biliyoruz ki, ağır vasıta dünyasında en önemli şey güvenli bir duruştur.</p>
      <p style={{marginBottom:14}}>Frenciniz olarak, müşterilerimizle uzun vadeli dostluklar kurmayı, doğru ürünü doğru zamanda ulaştırmayı ve alışverişinizi kolay, şeffaf ve keyifli hale getirmeyi hedefliyoruz.</p>
      <p style={{fontWeight:600,color:"#ff6000",fontSize:16}}>Yolda güven, Frenciniz ile mümkün.</p>
    </div></div>;
}

// ===== ACCOUNT SUB-PAGES =====
function OrdersPage() {
  const {go, pastOrders} = use$();
  return <div style={{maxWidth:800,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Siparişlerim</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Siparişlerim</h1>
    {pastOrders.length === 0 ? (
      <div style={{textAlign:"center",padding:"48px 0"}}>
        <div style={{fontSize:48,marginBottom:12}}>📦</div>
        <p style={{color:"#999",marginBottom:16}}>Henüz siparişiniz bulunmuyor.</p>
        <button onClick={()=>go("products")} style={{padding:"12px 28px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer"}}>Alışverişe Başla</button>
      </div>
    ) : (
      <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"10px 16px",background:"#fafafa",borderBottom:"1px solid #eee"}}>
          {["Ürün","Adet","Tutar","Tarih"].map((h,i) => <span key={i} style={{fontSize:12,fontWeight:700,color:"#999"}}>{h}</span>)}
        </div>
        {pastOrders.map((order,i) => (
          <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"12px 16px",borderBottom:i<pastOrders.length-1?"1px solid #f0f0f0":"none",alignItems:"center"}}>
            <div><div style={{fontSize:14,fontWeight:500}}>{order.name}</div><div style={{fontSize:12,color:"#999"}}>{order.brand} · {order.sku}</div></div>
            <span style={{fontSize:13}}>{order.qty} adet</span>
            <span style={{fontSize:14,fontWeight:600}}>₺{(order.price * order.qty).toLocaleString("tr-TR")}</span>
            <span style={{fontSize:12,color:"#999"}}>{new Date(order.date).toLocaleDateString("tr-TR")}</span>
          </div>
        ))}
      </div>
    )}
  </div>;
}

function AddressesPage() {
  const {go} = use$();
  const [addresses, setAddresses] = useState([{id:1,title:"Ev Adresi",name:"",address:"",city:"",phone:""}]);
  const [editing, setEditing] = useState(null);
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};

  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Adreslerim</span></div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h1 style={{fontSize:22,fontWeight:700}}>Adreslerim</h1>
      <button onClick={()=>setAddresses(p=>[...p,{id:Date.now(),title:"Yeni Adres",name:"",address:"",city:"",phone:""}])} style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Yeni Adres Ekle</button>
    </div>
    {addresses.map((addr,i) => (
      <div key={addr.id} style={{border:"1px solid #eee",borderRadius:8,padding:20,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:600}}>{addr.title}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditing(editing===addr.id?null:addr.id)} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"6px 14px",fontSize:12,color:"#555",cursor:"pointer"}}>{editing===addr.id?"Kapat":"Düzenle"}</button>
            {addresses.length>1&&<button onClick={()=>setAddresses(p=>p.filter(a=>a.id!==addr.id))} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"6px 14px",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>}
          </div>
        </div>
        {editing===addr.id ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input placeholder="Adres başlığı (Ev, İş...)" defaultValue={addr.title} style={IS}/>
            <input placeholder="Ad Soyad" defaultValue={addr.name} style={IS}/>
            <textarea placeholder="Adres" rows={2} defaultValue={addr.address} style={{...IS,resize:"vertical"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input placeholder="İl" defaultValue={addr.city} style={IS}/>
              <input placeholder="Telefon" defaultValue={addr.phone} style={IS}/>
            </div>
            <button onClick={()=>setEditing(null)} style={{padding:"10px 20px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>Kaydet</button>
          </div>
        ) : (
          <div style={{fontSize:13,color:"#888"}}>{addr.address || "Adres bilgisi girilmemiş"}{addr.city && ` — ${addr.city}`}</div>
        )}
      </div>
    ))}
  </div>;
}

function ProfilePage() {
  const {go, user} = use$();
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  const [saved, setSaved] = useState(false);

  return <div style={{maxWidth:500,margin:"0 auto",padding:"20px"}}>
    <div style={{fontSize:13,color:"#999",marginBottom:16}}><span style={{cursor:"pointer"}} onClick={()=>go("account")}>Hesabım</span> / <span style={{color:"#555"}}>Hesap Bilgileri</span></div>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Hesap Bilgileri</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,padding:24}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Ad Soyad</label><input defaultValue={user?.name||""} placeholder="Adınız Soyadınız" style={IS}/></div>
        <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>E-posta</label><input type="email" placeholder="ornek@email.com" style={IS}/></div>
        <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Telefon</label>
          <div style={{display:"flex",gap:0}}>
            <span style={{padding:"10px 12px",background:"#f5f5f5",border:"1px solid #ddd",borderRight:"none",borderRadius:"6px 0 0 6px",fontSize:14,color:"#555"}}>+90</span>
            <input placeholder="5XX XXX XX XX" style={{...IS,borderRadius:"0 6px 6px 0",flex:1}}/>
          </div>
        </div>
        <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Doğum Tarihi</label><input type="date" style={IS}/></div>
        <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}} style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>
          {saved ? "✓ Kaydedildi" : "Bilgileri Güncelle"}
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
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Erişilebilirlik Bildirimi</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
      <p style={{marginBottom:16}}>Frenciniz (Dumanlar Ticaret), herkesin web sitemizi ve hizmetlerimizi eşit şekilde kullanabilmesi için erişilebilirlik standartlarına uymayı taahhüt eder. Amacımız, otobüs, kamyon, tır ve dorse fren aksamı ürünlerimizi tüm kullanıcılarımız için erişilebilir hale getirmektir.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>1. Standartlara Uyum</h2>
      <p style={{marginBottom:16}}>Web sitemiz, uluslararası erişilebilirlik standartları (WCAG 2.1) dikkate alınarak tasarlanmıştır. Görsel, metin ve etkileşimli içeriklerin herkes tarafından kullanılabilir olması için gerekli düzenlemeler yapılmaktadır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>2. Sürekli İyileştirme</h2>
      <p style={{marginBottom:16}}>Erişilebilirlik, sürekli gelişen bir süreçtir. Kullanıcılarımızdan gelen geri bildirimler doğrultusunda web sitemizi düzenli olarak günceller ve iyileştiririz.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>3. Destek ve İletişim</h2>
      <p style={{marginBottom:16}}>Eğer web sitemizi kullanırken erişimle ilgili bir sorun yaşarsanız, bizimle iletişime geçebilirsiniz. Talebiniz en kısa sürede değerlendirilir ve çözüm için gerekli adımlar atılır.</p>

      <h2 style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>4. Taahhüt</h2>
      <p>Frenciniz olarak, tüm müşterilerimizin güvenli ve kolay bir alışveriş deneyimi yaşaması için erişilebilirlik konusunu öncelikli bir sorumluluk olarak kabul ediyoruz.</p>

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 0850 888 7881 – 0545 608 7008<br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function CompanyPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Şirket Bilgileri</h1>
    <div style={{border:"1px solid #eee",borderRadius:8,overflow:"hidden"}}>
      {[
        {label:"Şirket Ünvanı",value:"Dumanlar Ticaret"},
        {label:"Vergi Dairesi",value:"Kaymakkapı"},
        {label:"Vergi Numarası",value:"3140853144"},
        {label:"Adres",value:"Hızırbey Mahallesi, 1509 Sokak, No:24, Isparta Merkez"},
        {label:"KEP Adresi",value:"tarkan.duman.2@hs01.kep.tr"},
        {label:"Kurumsal E-posta",value:"info@frenciniz.com"},
        {label:"Telefon",value:"0850 888 7881 – 0545 608 7008"},
      ].map((row,i) => (
        <div key={i} style={{display:"flex",padding:"14px 20px",borderBottom:i<6?"1px solid #f0f0f0":"none",background:i%2===0?"#fafafa":"#fff"}}>
          <span style={{width:180,flexShrink:0,fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{row.label}</span>
          <span style={{fontSize:14,color:"#555"}}>{row.value}</span>
        </div>
      ))}
    </div>
  </div>;
}

function KvkkPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>KVKK Aydınlatma Metni</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
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

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 0850 888 7881 – 0545 608 7008<br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function ReturnPolicyPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>İade Politikası</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
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

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 0850 888 7881 – 0545 608 7008<br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function TermsPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Şartlar ve Koşullar</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
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
    </div>
  </div>;
}

function ShippingPolicyPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Gönderim Politikası</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
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
        <li style={{marginBottom:6}}>Kargo ücretleri, sipariş tutarına ve teslimat adresine göre değişiklik gösterebilir.</li>
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

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 0850 888 7881 – 0545 608 7008<br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function PrivacyPage() {
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Gizlilik Politikası</h1>
    <div style={{color:"#555",fontSize:14.5,lineHeight:1.85}}>
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

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9f9f9",borderRadius:8,border:"1px solid #eee",fontSize:13,color:"#888",lineHeight:2}}>
        📍 Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
        📞 0850 888 7881 – 0545 608 7008<br/>
        ✉ info@frenciniz.com
      </div>
    </div>
  </div>;
}

function ContactPage() {
  const IS = {width:"100%",padding:"10px 14px",border:"1px solid #ddd",borderRadius:6,fontSize:14};
  return <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>İletişim</h1>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:24}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="Ad Soyad" style={IS}/><input placeholder="E-posta" style={IS}/><input placeholder="Telefon" style={IS}/>
          <textarea rows={4} placeholder="Mesajınız..." style={{...IS,resize:"vertical"}}/>
          <button style={{padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>Gönder</button>
        </div>
      </div>
      <div>
        {[{icon:"📍",label:"Adres",value:"Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez"},{icon:"📞",label:"Telefon",value:"0850 888 7881 – 0545 608 7008"},{icon:"✉️",label:"E-posta",value:"info@frenciniz.com"},{icon:"⏰",label:"Çalışma",value:"Pzt–Cmt 08:00–18:00"},{icon:"💬",label:"WhatsApp",value:"0850 888 7881"}].map((c,i) => (
          <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:16,borderBottom:"1px solid #f0f0f0"}}>
            <span style={{fontSize:24}}>{c.icon}</span>
            <div><div style={{fontSize:12,color:"#999"}}>{c.label}</div><div style={{fontSize:15,fontWeight:600}}>{c.value}</div></div>
          </div>
        ))}
      </div>
    </div></div>;
}

function FaqPage() {
  const [open, setOpen] = useState(null);
  const faqs = [{q:"Kargo süresi nedir?",a:"14:00'a kadar verilen siparişler aynı gün kargoya verilir."},{q:"Ürünler orijinal mi?",a:"Orijinal ve sertifikalı eşdeğer parçalar sunuyoruz."},{q:"İade yapabilir miyim?",a:"Kullanılmamış ürünler 14 gün içinde iade edilebilir."},{q:"Toplu alım indirimi var mı?",a:"5.000₺ üzeri siparişlerde indirim. B2B teklif alabilirsiniz."},{q:"Taksit yapılıyor mu?",a:"Tüm kredi kartlarına 12 taksit imkânı mevcuttur."},{q:"Ürün aracıma uyar mı?",a:"Ürün sayfasında uyumlu araç listesi ve OEM referansları yer alır."}];
  return <div style={{maxWidth:700,margin:"0 auto",padding:"20px"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Sık Sorulan Sorular</h1>
    {faqs.map((f,i) => <div key={i} style={{borderBottom:"1px solid #eee"}}>
      <button onClick={() => setOpen(open===i?null:i)} style={{width:"100%",padding:"16px 0",background:"none",border:"none",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:15,fontWeight:600,cursor:"pointer"}}>{f.q}<span style={{color:"#999",transform:open===i?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span></button>
      {open===i && <div style={{padding:"0 0 16px",fontSize:14,color:"#666",lineHeight:1.7}}>{f.a}</div>}
    </div>)}</div>;
}

// ===== MOBILE MENU =====
function MobileMenu() {
  const {go, setMobileMenuOpen, t, user, favs} = use$();
  return (
    <div style={{position:"fixed",inset:0,zIndex:200}}>
      <div onClick={() => setMobileMenuOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)"}} />
      <div style={{position:"absolute",top:0,left:0,bottom:0,width:280,background:"#fff",overflowY:"auto",animation:"slideLeft .25s ease",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#ff6000"}}>frenciniz</div>
          <button onClick={() => setMobileMenuOpen(false)} style={{background:"none",border:"none",fontSize:20,color:"#999",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"12px 0"}}>
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
          <div style={{height:1,background:"#eee",margin:"8px 20px"}} />
          <div style={{padding:"8px 20px",fontSize:12,fontWeight:700,color:"#999",textTransform:"uppercase"}}>{t("category")}</div>
          {CATS.filter(c=>c.id!=="all").map(c => (
            <button key={c.id} onClick={() => {go("products",{cat:c.id});setMobileMenuOpen(false)}}
              style={{display:"block",width:"100%",padding:"10px 20px 10px 32px",background:"none",border:"none",fontSize:14,color:"#555",cursor:"pointer",textAlign:"left"}}>
              {c.name}
            </button>
          ))}
          <div style={{height:1,background:"#eee",margin:"8px 20px"}} />
          <button onClick={() => {go("favs");setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",background:"none",border:"none",fontSize:15,color:"#333",cursor:"pointer"}}>
            ♡ {t("favs")} {favs.length>0&&`(${favs.length})`}
          </button>
          <button onClick={() => {go(user?"account":"auth");setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",background:"none",border:"none",fontSize:15,color:"#333",cursor:"pointer"}}>
            👤 {user?user.name:t("login")}
          </button>
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

  return (
    <div>
      {/* Main image */}
      <div onClick={() => setZoomed(true)}
        style={{background:"#f9f9f9",borderRadius:8,height:400,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #eee",position:"relative",cursor:"zoom-in",overflow:"hidden"}}>
        <img src={images[active]} alt="" style={{maxWidth:"80%",maxHeight:"80%",objectFit:"contain",transition:"transform .3s"}} onError={e=>{e.target.style.display="none"}}/>
        {discount > 0 && <span style={{position:"absolute",top:16,left:16,background:"#ff6000",color:"#fff",fontSize:14,fontWeight:700,padding:"6px 14px",borderRadius:6}}>%{discount}</span>}
        <div style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.5)",color:"#fff",padding:"4px 10px",borderRadius:4,fontSize:11}}>🔍 Büyütmek için tıklayın</div>
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{display:"flex",gap:8,marginTop:10,overflowX:"auto",paddingBottom:4}}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{width:72,height:72,borderRadius:6,border:`2px solid ${active===i?"#ff6000":"#eee"}`,background:"#f9f9f9",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"border-color .2s"}}>
              <img src={img} alt="" style={{maxWidth:"85%",maxHeight:"85%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
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
          <img src={images[active]} alt="" style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
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
  const {chatOpen, setChatOpen, chatMessages, setChatMessages} = use$();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const autoReplies = [
    "Teşekkür ederiz, en kısa sürede size dönüş yapacağız.",
    "Bu konuda teknik ekibimiz size yardımcı olabilir. Araç bilgilerinizi paylaşır mısınız?",
    "OEM veya parça kodunu paylaşırsanız stok ve fiyat bilgisini hemen kontrol edebiliriz.",
    "Toplu alım için özel fiyat teklifi hazırlayabiliriz. Miktar ve ürün detaylarını iletir misiniz?",
    "Sipariş ve kargo takibi için sipariş numaranızı paylaşabilir misiniz?",
    "Çalışma saatlerimiz Pazartesi-Cumartesi 08:00-18:00 arasıdır. Size nasıl yardımcı olabiliriz?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [chatMessages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = {from:"user", text:input, time:new Date()};
    setChatMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      setChatMessages(prev => [...prev, {from:"bot", text:reply, time:new Date()}]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
  };

  return <>
    {/* Toggle button */}
    <button onClick={() => setChatOpen(!chatOpen)}
      style={{position:"fixed",bottom:24,right:24,zIndex:1000,width:56,height:56,borderRadius:"50%",background:chatOpen?"#333":"#ff6000",color:"#fff",border:"none",boxShadow:"0 4px 16px rgba(0,0,0,.2)",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background .2s"}}>
      {chatOpen ? "✕" : "💬"}
    </button>

    {/* Chat window */}
    {chatOpen && (
      <div style={{position:"fixed",bottom:92,right:24,zIndex:1000,width:360,height:460,background:"#fff",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,.15)",display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideUp .3s ease",border:"1px solid #e0e0e0"}}>
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
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:msg.from==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:msg.from==="user"?"#ff6000":"#fff",color:msg.from==="user"?"#fff":"#333",fontSize:13,lineHeight:1.5,boxShadow:msg.from==="bot"?"0 1px 3px rgba(0,0,0,.06)":"none"}}>
                {msg.text}
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
  const {go, setAdmin} = use$();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const handleLogin = () => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "tarkanduman4@gmail.com";
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || "123456_xx";
    if(email === adminEmail && pw === adminPass){setAdmin(true);go("admin")}else setErr(true);
  };
  return (
    <div style={{maxWidth:380,margin:"60px auto",padding:"0 20px"}}>
      <div style={{border:"1px solid #eee",borderRadius:8,padding:32,textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:800,color:"#ff6000",marginBottom:4}}>frenciniz</div>
        <div style={{fontSize:13,color:"#999",marginBottom:24}}>Yönetim Paneli Girişi</div>
        <input value={email} onChange={e=>{setEmail(e.target.value);setErr(false)}} type="email" placeholder="E-posta"
          style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#e53935":"#ddd"}`,borderRadius:6,fontSize:14,marginBottom:12,outline:"none"}}/>
        <input value={pw} onChange={e=>{setPw(e.target.value);setErr(false)}} type="password" placeholder="Şifre"
          onKeyDown={e=>{if(e.key==="Enter")handleLogin()}}
          style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#e53935":"#ddd"}`,borderRadius:6,fontSize:14,marginBottom:12,outline:"none"}}/>
        {err&&<div style={{fontSize:12,color:"#e53935",marginBottom:8}}>E-posta veya şifre yanlış.</div>}
        <button onClick={handleLogin}
          style={{width:"100%",padding:"12px",background:"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer"}}>Giriş Yap</button>
      </div>
    </div>
  );
}

function AdminPanel() {
  const {go, admin, setAdmin, stockAlerts} = use$();
  const [tab, setTab] = useState("dashboard");
  if(!admin) { go("admin-login"); return null; }

  const menu = [
    {id:"dashboard",label:"Dashboard",icon:"📊"},{id:"sales-chart",label:"Satış Grafikleri",icon:"📈"},
    {id:"products",label:"Ürünler",icon:"📦"},{id:"categories",label:"Kategoriler",icon:"🗂"},
    {id:"orders",label:"Siparişler",icon:"🛒"},{id:"returns",label:"İade Talepleri",icon:"↩️"},
    {id:"customers",label:"Müşteriler",icon:"👥"},{id:"coupons",label:"Kuponlar",icon:"🎟"},
    {id:"stock-alerts",label:"Stok Alarmları",icon:"🔔"},{id:"low-stock",label:"Düşük Stok",icon:"⚠️"},
    {id:"pricing",label:"Toplu Fiyat",icon:"💰"},{id:"import",label:"XML / Excel",icon:"📥"},
    {id:"banners",label:"Bannerlar",icon:"🖼"},{id:"pages",label:"Sayfalar",icon:"📄"},
    {id:"seo",label:"SEO Ayarları",icon:"🔍"},{id:"payment",label:"Ödeme Ayarları",icon:"💳"},
    {id:"email",label:"Mail Ayarları",icon:"✉️"},
    {id:"sms",label:"NetGSM",icon:"📱"},{id:"email-templates",label:"Mail Şablonları",icon:"📨"},
    {id:"chat-history",label:"Chat Geçmişi",icon:"💬"},{id:"revenue",label:"Gelir/Gider",icon:"📉"},
    {id:"admin-users",label:"Admin Yönetimi",icon:"🔐"},{id:"settings",label:"Site Ayarları",icon:"⚙️"},
    {id:"activity",label:"Aktivite Logu",icon:"📋"},{id:"backup",label:"Yedekleme",icon:"💾"},
  ];

  return (
    <div style={{display:"flex",minHeight:"80vh",background:"#f5f5f5"}}>
      <div style={{width:220,background:"#1a1a1a",padding:"20px 0",flexShrink:0}}>
        <div style={{padding:"0 16px 16px",borderBottom:"1px solid #333"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#ff6000"}}>frenciniz</div>
          <div style={{fontSize:10,color:"#666"}}>Admin Panel</div>
        </div>
        <div style={{padding:"12px 8px"}}>
          {menu.map(m=>(
            <button key={m.id} onClick={()=>setTab(m.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",border:"none",borderRadius:6,background:tab===m.id?"#333":"transparent",color:tab===m.id?"#fff":"#888",fontSize:13,fontWeight:tab===m.id?600:400,cursor:"pointer",textAlign:"left",marginBottom:2,fontFamily:"inherit"}}>
              <span style={{fontSize:14}}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #333",marginTop:8}}>
          <button onClick={()=>{setAdmin(false);go("home")}} style={{width:"100%",padding:"8px",background:"#333",color:"#999",border:"none",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Siteye Dön</button>
        </div>
      </div>
      <div style={{flex:1,padding:24,overflowY:"auto"}}>
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
        {tab==="banners"&&<ABanners/>}
        {tab==="pages"&&<APagesAdmin/>}
        {tab==="seo"&&<ASeo/>}
        {tab==="payment"&&<APaymentCfg/>}
        {tab==="email"&&<AEmailCfg/>}
        {tab==="sms"&&<ASMSCfg/>}
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

const ACard=({title,children,action})=>(<div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f0f0f0"}}><h2 style={{fontSize:16,fontWeight:700}}>{title}</h2>{action}</div><div style={{padding:20}}>{children}</div></div>);
const ABtn=({children,color,...p})=><button {...p} style={{padding:"8px 18px",background:color||"#ff6000",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",...(p.style||{})}}>{children}</button>;
const AIn=p=><input {...p} style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,fontFamily:"inherit",...(p.style||{})}}/>;

function ADash(){
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Dashboard</h1>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {[{n:"₺48.750",l:"Toplam Satış",c:"#ff6000",i:"💰"},{n:"127",l:"Sipariş",c:"#2563eb",i:"🛒"},{n:"84",l:"Müşteri",c:"#059669",i:"👥"},{n:"12",l:"Ürün",c:"#7c3aed",i:"📦"}].map((s,i)=>(
        <div key={i} style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.n}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>{s.l}</div></div>
            <span style={{fontSize:28}}>{s.i}</span></div></div>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <ACard title="Son Siparişler">
        {[{no:"FRN-4821",c:"Ahmet Y.",t:"₺3.450",s:"Hazırlanıyor"},{no:"FRN-4820",c:"Mehmet K.",t:"₺1.250",s:"Kargoda"},{no:"FRN-4819",c:"Ali D.",t:"₺6.800",s:"Teslim Edildi"},{no:"FRN-4818",c:"Veli S.",t:"₺890",s:"İptal"}].map((o,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<3?"1px solid #f0f0f0":"none"}}>
            <div><div style={{fontSize:13,fontWeight:600}}>{o.no}</div><div style={{fontSize:11,color:"#999"}}>{o.c}</div></div>
            <span style={{fontSize:14,fontWeight:600}}>{o.t}</span>
            <span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:o.s==="Kargoda"?"#dbeafe":o.s==="Teslim Edildi"?"#dcfce7":o.s==="İptal"?"#fee2e2":"#fef3c7",color:o.s==="Kargoda"?"#2563eb":o.s==="Teslim Edildi"?"#059669":o.s==="İptal"?"#dc2626":"#b45309"}}>{o.s}</span>
          </div>))}
      </ACard>
      <ACard title="Popüler Ürünler">
        {[...PRODUCTS].sort((a,b)=>b.reviews-a.reviews).slice(0,5).map((p,i)=>(
          <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<4?"1px solid #f0f0f0":"none"}}>
            <span style={{fontSize:13}}>{p.name}</span><span style={{fontSize:12,color:"#999"}}>{p.reviews}</span></div>))}
      </ACard>
    </div></>;
}

function AProds(){
  const [prods,setProds]=useState(PRODUCTS);
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
        <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} style={{padding:"9px",border:"1px solid #ddd",borderRadius:6,fontSize:13}}>{CATS.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
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
  const [cats,setCats]=useState(CATS.filter(c=>c.id!=="all"));
  const [n,setN]=useState("");
  return <ACard title="Kategoriler" action={<div style={{display:"flex",gap:6}}><AIn placeholder="Yeni kategori" value={n} onChange={e=>setN(e.target.value)} style={{width:200}}/><ABtn onClick={()=>{if(n.trim()){setCats(p=>[...p,{id:n.toLowerCase().replace(/\s/g,"-"),name:n}]);setN("")}}}>Ekle</ABtn></div>}>
    {cats.map((c,i)=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<cats.length-1?"1px solid #f0f0f0":"none"}}>
      <span style={{fontSize:14,fontWeight:500}}>{c.name}</span>
      <button onClick={()=>setCats(p=>p.filter(x=>x.id!==c.id))} style={{padding:"4px 12px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
    </div>)}
  </ACard>;
}

function AOrds(){
  const statuses=["Hazırlanıyor","Kargoda","Teslim Edildi","İptal"];
  const sc={"Hazırlanıyor":{bg:"#fef3c7",c:"#b45309"},"Kargoda":{bg:"#dbeafe",c:"#2563eb"},"Teslim Edildi":{bg:"#dcfce7",c:"#059669"},"İptal":{bg:"#fee2e2",c:"#dc2626"}};
  const [orders,setOrders]=useState([
    {id:"FRN-4821",c:"Ahmet Yılmaz",ph:"0532 111 22",t:3450,s:"Hazırlanıyor",d:"05.04.2026"},
    {id:"FRN-4820",c:"Mehmet Kaya",ph:"0545 222 33",t:1250,s:"Kargoda",d:"04.04.2026"},
    {id:"FRN-4819",c:"Ali Demir",ph:"0555 333 44",t:6800,s:"Teslim Edildi",d:"03.04.2026"},
    {id:"FRN-4818",c:"Veli Şahin",ph:"0542 444 55",t:890,s:"İptal",d:"02.04.2026"},
  ]);
  return <ACard title={`Siparişler (${orders.length})`}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{["No","Müşteri","Tutar","Tarih","Durum","İşlem"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{orders.map(o=><tr key={o.id} style={{borderBottom:"1px solid #f0f0f0"}}>
        <td style={{padding:"10px",fontWeight:600,fontFamily:"monospace"}}>{o.id}</td>
        <td style={{padding:"10px"}}><div style={{fontWeight:500}}>{o.c}</div><div style={{fontSize:11,color:"#999"}}>{o.ph}</div></td>
        <td style={{padding:"10px",fontWeight:600}}>₺{o.t.toLocaleString("tr-TR")}</td>
        <td style={{padding:"10px",fontSize:12,color:"#888"}}>{o.d}</td>
        <td style={{padding:"10px"}}><span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:sc[o.s]?.bg,color:sc[o.s]?.c}}>{o.s}</span></td>
        <td style={{padding:"10px"}}><select value={o.s} onChange={e=>setOrders(p=>p.map(x=>x.id===o.id?{...x,s:e.target.value}:x))} style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4,fontSize:12}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td>
      </tr>)}</tbody></table></ACard>;
}

function ACusts(){
  const cs=[{n:"Ahmet Yılmaz",e:"ahmet@mail.com",p:"0532 111 22",o:5,t:"₺12.450"},{n:"Mehmet Kaya",e:"mehmet@mail.com",p:"0545 222 33",o:3,t:"₺4.680"},{n:"Ali Demir",e:"ali@mail.com",p:"0555 333 44",o:8,t:"₺28.900"},{n:"Veli Şahin",e:"veli@mail.com",p:"0542 444 55",o:1,t:"₺890"},{n:"Hasan Çelik",e:"hasan@mail.com",p:"0537 555 66",o:12,t:"₺45.200"}];
  return <ACard title={`Müşteriler (${cs.length})`}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{["İsim","E-posta","Telefon","Sipariş","Toplam"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{cs.map((c,i)=><tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
        <td style={{padding:"10px",fontWeight:600}}>{c.n}</td><td style={{padding:"10px",color:"#888"}}>{c.e}</td>
        <td style={{padding:"10px",color:"#888"}}>{c.p}</td><td style={{padding:"10px",fontWeight:600}}>{c.o}</td>
        <td style={{padding:"10px",fontWeight:600,color:"#059669"}}>{c.t}</td></tr>)}</tbody></table></ACard>;
}

function ACoups(){
  const [cs,setCs]=useState([{id:1,code:"FREN10",disc:10,type:"%",min:500,used:34,active:true},{id:2,code:"HOSGELDIN",disc:50,type:"₺",min:0,used:0,active:true},{id:3,code:"YAZ2026",disc:15,type:"%",min:1000,used:12,active:false}]);
  const [show,setShow]=useState(false);
  const [f,setF]=useState({code:"",disc:"",type:"%",min:""});
  return <ACard title="Kuponlar" action={<ABtn onClick={()=>setShow(!show)}>+ Yeni Kupon</ABtn>}>
    {show&&<div style={{background:"#fafafa",borderRadius:8,padding:16,marginBottom:16,border:"1px solid #eee"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <AIn placeholder="Kupon Kodu" value={f.code} onChange={e=>setF({...f,code:e.target.value.toUpperCase()})}/>
        <div style={{display:"flex",gap:6}}><AIn placeholder="İndirim" type="number" value={f.disc} onChange={e=>setF({...f,disc:e.target.value})}/><select value={f.type} onChange={e=>setF({...f,type:e.target.value})} style={{padding:"8px",border:"1px solid #ddd",borderRadius:6}}><option>%</option><option>₺</option></select></div>
        <AIn placeholder="Min. Sipariş (₺)" type="number" value={f.min} onChange={e=>setF({...f,min:e.target.value})}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}><ABtn onClick={()=>{setCs(p=>[...p,{id:Date.now(),code:f.code,disc:Number(f.disc),type:f.type,min:Number(f.min),used:0,active:true}]);setShow(false);setF({code:"",disc:"",type:"%",min:""})}}>Oluştur</ABtn><ABtn color="#999" onClick={()=>setShow(false)}>İptal</ABtn></div>
    </div>}
    {cs.map((c,i)=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<cs.length-1?"1px solid #f0f0f0":"none"}}>
      <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:"#ff6000",background:"#fff5f0",padding:"4px 10px",borderRadius:4}}>{c.code}</span>
      <span style={{fontSize:13,fontWeight:600}}>{c.disc}{c.type}</span>
      <span style={{fontSize:12,color:"#888"}}>Min: ₺{c.min}</span>
      <span style={{fontSize:12,color:"#888"}}>{c.used} kull.</span>
      <button onClick={()=>setCs(p=>p.map(x=>x.id===c.id?{...x,active:!x.active}:x))} style={{padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:c.active?"#dcfce7":"#fee2e2",color:c.active?"#059669":"#dc2626"}}>{c.active?"Aktif":"Pasif"}</button>
      <button onClick={()=>setCs(p=>p.filter(x=>x.id!==c.id))} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
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

function ABanners(){
  const [bs,setBs]=useState([{id:1,title:"Ana Banner",active:true},{id:2,title:"İndirim Kampanyası",active:true},{id:3,title:"Yeni Sezon",active:false}]);
  return <ACard title="Banner Yönetimi" action={<ABtn onClick={()=>setBs(p=>[...p,{id:Date.now(),title:"Yeni Banner",active:true}])}>+ Banner Ekle</ABtn>}>
    {bs.map((b,i)=><div key={b.id} style={{display:"flex",alignItems:"center",gap:16,padding:"12px 0",borderBottom:i<bs.length-1?"1px solid #f0f0f0":"none"}}>
      <div style={{width:120,height:50,background:"#f0f0f0",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#999"}}>🖼 Banner</div>
      <div style={{flex:1,fontSize:14,fontWeight:600}}>{b.title}</div>
      <button onClick={()=>setBs(p=>p.map(x=>x.id===b.id?{...x,active:!x.active}:x))} style={{padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:b.active?"#dcfce7":"#fee2e2",color:b.active?"#059669":"#dc2626"}}>{b.active?"Aktif":"Pasif"}</button>
      <button onClick={()=>setBs(p=>p.filter(x=>x.id!==b.id))} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>
    </div>)}</ACard>;
}

function APagesAdmin(){
  const [sel,setSel]=useState(null);const [ok,setOk]=useState(false);
  const pgs=[{id:"about",n:"Hakkımızda"},{id:"privacy",n:"Gizlilik Politikası"},{id:"terms",n:"Şartlar ve Koşullar"},{id:"shipping",n:"Gönderim Politikası"},{id:"return",n:"İade Politikası"},{id:"kvkk",n:"KVKK"},{id:"accessibility",n:"Erişilebilirlik"}];
  return <ACard title="Sayfa İçerik Yönetimi">
    {!sel?pgs.map((p,i)=><div key={p.id} onClick={()=>setSel(p)} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:i<pgs.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
      <span style={{fontSize:14}}>📄 {p.n}</span><span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span></div>)
    :<div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:12}}>← Geri</button>
      <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{sel.n}</div>
      <textarea rows={12} defaultValue={`${sel.n} sayfa içeriği...`} style={{width:"100%",padding:14,border:"1px solid #ddd",borderRadius:6,fontSize:14,lineHeight:1.7,resize:"vertical"}}/>
      <ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}} style={{marginTop:12}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
    </div>}</ACard>;
}

function AEmailCfg(){
  const [ok,setOk]=useState(false);
  return <ACard title="Mail Entegrasyonu"><div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:12}}>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>SMTP Sunucu</label><AIn placeholder="mail.frenciniz.com"/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Port</label><AIn placeholder="587"/></div>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Güvenlik</label><select style={{width:"100%",padding:"9px",border:"1px solid #ddd",borderRadius:6,fontSize:13}}><option>TLS</option><option>SSL</option></select></div>
    </div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Kullanıcı</label><AIn placeholder="info@frenciniz.com"/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Şifre</label><AIn type="password" placeholder="••••••••"/></div>
    <div style={{display:"flex",gap:8,marginTop:8}}><ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn><ABtn color="#2563eb">Test Maili</ABtn></div>
  </div></ACard>;
}

function ASMSCfg(){
  const [ok,setOk]=useState(false);
  return <ACard title="NetGSM SMS Entegrasyonu"><div style={{maxWidth:500}}>
    <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 NetGSM API bilgilerinizi netgsm.com.tr adresinden alabilirsiniz.</div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Kullanıcı Kodu</label><AIn placeholder="850XXXXXXX"/></div>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>API Şifresi</label><AIn type="password" placeholder="API şifresi"/></div>
      <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Başlık</label><AIn placeholder="FRENCINIZ" defaultValue="FRENCINIZ"/></div>
      <div style={{border:"1px solid #eee",borderRadius:6,padding:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Otomatik SMS Bildirimleri</div>
        {["Yeni üye kayıt","Sipariş onay","Kargoya verildi","Stok bildirimi"].map(l=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:13}}>{l}</span><input type="checkbox" defaultChecked style={{accentColor:"#ff6000"}}/></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginTop:8}}><ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn><ABtn color="#2563eb">Test SMS</ABtn></div>
    </div>
  </div></ACard>;
}

function ASettingsCfg(){
  const {socialMedia, setSocialMedia} = use$();
  const [ok,setOk]=useState(false);
  return <ACard title="Site Ayarları"><div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:14}}>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Site Adı</label><AIn defaultValue="Frenciniz"/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Telefon</label><AIn defaultValue="0850 888 7881"/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>E-posta</label><AIn defaultValue="info@frenciniz.com"/></div>
    <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Adres</label><AIn defaultValue="Hızırbey Mah. 1509 Sok. No:24, Isparta"/></div>
    <div style={{borderTop:"1px solid #eee",paddingTop:14}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Sosyal Medya</div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>URL girildiğinde sitede otomatik görünür. Boş bırakılan gizlenir.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:11,color:"#888"}}>Facebook</label><AIn placeholder="https://facebook.com/..." value={socialMedia.facebook} onChange={e=>setSocialMedia(p=>({...p,facebook:e.target.value}))}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>Instagram</label><AIn placeholder="https://instagram.com/..." value={socialMedia.instagram} onChange={e=>setSocialMedia(p=>({...p,instagram:e.target.value}))}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>Twitter / X</label><AIn placeholder="https://x.com/..." value={socialMedia.twitter} onChange={e=>setSocialMedia(p=>({...p,twitter:e.target.value}))}/></div>
        <div><label style={{fontSize:11,color:"#888"}}>YouTube</label><AIn placeholder="https://youtube.com/..." value={socialMedia.youtube} onChange={e=>setSocialMedia(p=>({...p,youtube:e.target.value}))}/></div>
      </div>
    </div>
    <div style={{borderTop:"1px solid #eee",paddingTop:14}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Ücretsiz Kargo Limiti</div>
      <AIn type="number" defaultValue="500" style={{width:150}}/><div style={{fontSize:11,color:"#999",marginTop:4}}>Bu tutarın üzerinde kargo ücretsiz.</div>
    </div>
    <ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}} style={{alignSelf:"flex-start"}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
  </div></ACard>;
}

function ABackupCfg(){
  const [exp,setExp]=useState("");
  return <ACard title="Yedekleme & Dışa Aktarım">
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
      {[{t:"Ürünler",i:"📦"},{t:"Siparişler",i:"🛒"},{t:"Müşteriler",i:"👥"}].map((x,i)=>(
        <div key={i} style={{border:"1px solid #eee",borderRadius:8,padding:20,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{x.t}</div>
          <div style={{display:"flex",gap:6,justifyContent:"center"}}>
            <button onClick={()=>{setExp(x.t);setTimeout(()=>setExp(""),2000)}} style={{padding:"6px 14px",border:"1px solid #ddd",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer"}}>Excel</button>
            <button onClick={()=>{setExp(x.t);setTimeout(()=>setExp(""),2000)}} style={{padding:"6px 14px",border:"1px solid #ddd",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer"}}>JSON</button>
          </div></div>))}
    </div>
    {exp&&<div style={{padding:12,background:"#dcfce7",borderRadius:6,fontSize:13,color:"#059669",fontWeight:600,textAlign:"center"}}>✓ {exp} dışa aktarıldı!</div>}
    <div style={{marginTop:16,padding:16,background:"#fafafa",borderRadius:8,border:"1px solid #eee"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Tam Yedekleme</div>
      <div style={{fontSize:13,color:"#888",marginBottom:12}}>Tüm verileri tek dosyada yedekleyin.</div>
      <ABtn>💾 Tam Yedek Al</ABtn>
    </div>
  </ACard>;
}

// ── SALES CHART ──
function ASalesChart(){
  const [period,setPeriod]=useState("weekly");
  const data={daily:[12,8,15,22,18,9,14],weekly:[85,92,78,110,95,88,102,115],monthly:[2400,3100,2800,3500,4200,3900,4800,5100,4600,5200,4900,5500]};
  const labels={daily:["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],weekly:["1.H","2.H","3.H","4.H","5.H","6.H","7.H","8.H"],monthly:["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]};
  const d=data[period];const l=labels[period];const mx=Math.max(...d);
  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Satış Grafikleri</h1>
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      {[{id:"daily",l:"Günlük"},{id:"weekly",l:"Haftalık"},{id:"monthly",l:"Aylık"}].map(p=>(
        <button key={p.id} onClick={()=>setPeriod(p.id)} style={{padding:"8px 20px",border:`2px solid ${period===p.id?"#ff6000":"#ddd"}`,borderRadius:6,background:period===p.id?"#fff5f0":"#fff",color:period===p.id?"#ff6000":"#888",fontSize:13,fontWeight:600,cursor:"pointer"}}>{p.l}</button>
      ))}
    </div>
    <ACard title={`${period==="daily"?"Günlük":period==="weekly"?"Haftalık":"Aylık"} Satış`}>
      <div style={{display:"flex",alignItems:"flex-end",gap:period==="monthly"?6:10,height:220,padding:"10px 0"}}>
        {d.map((v,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,fontWeight:600,color:"#555"}}>{period==="monthly"?"₺"+v.toLocaleString("tr-TR"):v}</span>
            <div style={{width:"100%",height:`${(v/mx)*180}px`,background:"linear-gradient(180deg,#ff6000,#ff8c00)",borderRadius:"4px 4px 0 0",minHeight:4,transition:"height .3s"}}/>
            <span style={{fontSize:10,color:"#999"}}>{l[i]}</span>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20,paddingTop:16,borderTop:"1px solid #f0f0f0"}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#ff6000"}}>₺{(d.reduce((a,b)=>a+b,0)*(period==="monthly"?1:120)).toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999"}}>Toplam Satış</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#2563eb"}}>{d.reduce((a,b)=>a+b,0)}</div><div style={{fontSize:12,color:"#999"}}>Toplam Sipariş</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#059669"}}>₺{Math.round(d.reduce((a,b)=>a+b,0)/d.length*(period==="monthly"?1:120)).toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999"}}>Ortalama</div></div>
      </div>
    </ACard></>;
}

// ── RETURNS ──
function AReturns(){
  const statuses=["Beklemede","Onaylandı","Reddedildi","Tamamlandı"];
  const sc={"Beklemede":{bg:"#fef3c7",c:"#b45309"},"Onaylandı":{bg:"#dbeafe",c:"#2563eb"},"Reddedildi":{bg:"#fee2e2",c:"#dc2626"},"Tamamlandı":{bg:"#dcfce7",c:"#059669"}};
  const [returns,setReturns]=useState([
    {id:"IRT-001",order:"FRN-4815",customer:"Kemal A.",product:"Kampana Balata Seti",reason:"Yanlış ürün gönderildi",status:"Beklemede",date:"04.04.2026"},
    {id:"IRT-002",order:"FRN-4810",customer:"Serkan B.",product:"ABS Sensörü",reason:"Ürün hasarlı geldi",status:"Onaylandı",date:"03.04.2026"},
    {id:"IRT-003",order:"FRN-4798",customer:"Murat C.",product:"Fren Diski Ø430",reason:"Araca uymuyor",status:"Tamamlandı",date:"01.04.2026"},
  ]);
  return <ACard title={`İade Talepleri (${returns.length})`}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:"2px solid #eee"}}>{["İade No","Sipariş","Müşteri","Ürün","Sebep","Durum","İşlem"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{returns.map(r=><tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
        <td style={{padding:"10px",fontFamily:"monospace",fontWeight:600}}>{r.id}</td>
        <td style={{padding:"10px",fontSize:12,color:"#888"}}>{r.order}</td>
        <td style={{padding:"10px",fontWeight:500}}>{r.customer}</td>
        <td style={{padding:"10px",fontSize:12}}>{r.product}</td>
        <td style={{padding:"10px",fontSize:12,color:"#888",maxWidth:150}}>{r.reason}</td>
        <td style={{padding:"10px"}}><span style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,background:sc[r.status]?.bg,color:sc[r.status]?.c}}>{r.status}</span></td>
        <td style={{padding:"10px"}}><select value={r.status} onChange={e=>setReturns(p=>p.map(x=>x.id===r.id?{...x,status:e.target.value}:x))} style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4,fontSize:12}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td>
      </tr>)}</tbody>
    </table>
  </ACard>;
}

// ── LOW STOCK ──
function ALowStock(){
  const [threshold,setThreshold]=useState(10);
  const lowItems=PRODUCTS.filter(p=>p.stock<=threshold);
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
  const logs=[
    {time:"05.04.2026 14:32",user:"Admin",action:"Ürün eklendi",detail:"Kampana Balata Seti — KB-BLT-4210",type:"product"},
    {time:"05.04.2026 13:15",user:"Admin",action:"Sipariş durumu güncellendi",detail:"FRN-4821 → Hazırlanıyor",type:"order"},
    {time:"05.04.2026 11:48",user:"Sistem",action:"Yeni üye kaydı",detail:"ahmet@mail.com — 0532 111 2233",type:"user"},
    {time:"05.04.2026 10:22",user:"Admin",action:"Kupon oluşturuldu",detail:"FREN10 — %10 indirim",type:"coupon"},
    {time:"04.04.2026 16:45",user:"Admin",action:"Toplu fiyat güncellendi",detail:"%5 artış — tüm ürünler",type:"price"},
    {time:"04.04.2026 15:30",user:"Sistem",action:"Stok alarmı",detail:"Fren Kaliperi Sol — stok: 0",type:"stock"},
    {time:"04.04.2026 14:10",user:"Admin",action:"Sayfa düzenlendi",detail:"Hakkımızda sayfası güncellendi",type:"page"},
    {time:"04.04.2026 09:55",user:"Admin",action:"Banner eklendi",detail:"İndirim Kampanyası banner'ı",type:"banner"},
    {time:"03.04.2026 17:20",user:"Sistem",action:"Sipariş alındı",detail:"FRN-4819 — ₺6.800",type:"order"},
    {time:"03.04.2026 11:00",user:"Admin",action:"Ürün silindi",detail:"Eski model balata seti",type:"product"},
  ];
  const typeColors={product:"#7c3aed",order:"#2563eb",user:"#059669",coupon:"#d97706",price:"#dc2626",stock:"#b45309",page:"#0891b2",banner:"#be185d"};
  return <ACard title="Aktivite Logu">
    {logs.map((log,i)=>(
      <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<logs.length-1?"1px solid #f0f0f0":"none",alignItems:"flex-start"}}>
        <div style={{width:8,height:8,borderRadius:4,background:typeColors[log.type]||"#999",marginTop:6,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600}}>{log.action}</span>
            <span style={{fontSize:11,color:"#999"}}>{log.time}</span>
          </div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>{log.detail}</div>
          <div style={{fontSize:11,color:"#bbb",marginTop:2}}>👤 {log.user}</div>
        </div>
      </div>
    ))}
  </ACard>;
}

// ── SEO ──
function ASeo(){
  const [sel,setSel]=useState(null);const [ok,setOk]=useState(false);
  const pages=[{id:"home",n:"Ana Sayfa",title:"Frenciniz — Fren Aksamı Uzmanı",desc:"Otobüs, kamyon, tır ve dorse için orijinal fren aksamı ürünleri."},{id:"products",n:"Ürünler",title:"Ürünler — Frenciniz",desc:"10.000+ fren aksamı ürünü."},{id:"about",n:"Hakkımızda",title:"Hakkımızda — Frenciniz",desc:"Dumanlar Ticaret çatısı altında fren aksamı."},{id:"contact",n:"İletişim",title:"İletişim — Frenciniz",desc:"Frenciniz iletişim bilgileri."}];
  return <ACard title="SEO Ayarları">
    {!sel?<>
      <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 Her sayfa için meta başlık ve açıklama belirleyerek arama motorlarında görünürlüğünüzü artırın.</div>
      {pages.map((p,i)=><div key={p.id} onClick={()=>setSel(p)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<pages.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>{p.n}</div><div style={{fontSize:12,color:"#059669",marginTop:2}}>{p.title}</div><div style={{fontSize:11,color:"#999"}}>{p.desc}</div></div>
        <span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span>
      </div>)}
      <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #eee"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Ürün SEO</div>
        <div style={{fontSize:13,color:"#888"}}>Her ürün için SEO bilgileri ürün düzenleme ekranından ayarlanabilir. Ürün adı otomatik olarak meta başlık, açıklama ise meta description olarak kullanılır.</div>
      </div>
    </>:<div>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:16}}>← Geri</button>
      <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{sel.n} — SEO Ayarları</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:500}}>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Meta Başlık (Title)</label><AIn defaultValue={sel.title}/><div style={{fontSize:11,color:"#999",marginTop:4}}>{sel.title.length}/60 karakter</div></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Meta Açıklama (Description)</label><textarea defaultValue={sel.desc} rows={3} style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:13,resize:"vertical"}}/><div style={{fontSize:11,color:"#999",marginTop:4}}>{sel.desc.length}/160 karakter</div></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>Anahtar Kelimeler</label><AIn placeholder="fren, balata, disk, kamyon, tır..."/></div>
        <div style={{padding:14,background:"#fafafa",borderRadius:8,border:"1px solid #eee"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#888",marginBottom:6}}>Google Önizleme</div>
          <div style={{fontSize:16,color:"#1a0dab",fontWeight:500}}>{sel.title}</div>
          <div style={{fontSize:13,color:"#006621"}}>frenciniz.com/{sel.id==="home"?"":sel.id}</div>
          <div style={{fontSize:12,color:"#545454",marginTop:2}}>{sel.desc}</div>
        </div>
        <ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
      </div>
    </div>}
  </ACard>;
}

// ── EMAIL TEMPLATES ──
function AEmailTemplates(){
  const [sel,setSel]=useState(null);const [ok,setOk]=useState(false);
  const templates=[
    {id:"welcome",name:"Hoş Geldin",subject:"Frenciniz'e Hoş Geldiniz!",body:"Merhaba {{isim}},\n\nFrenciniz ailesine katıldığınız için teşekkür ederiz.\n\nFren aksamı ihtiyaçlarınız için her zaman yanınızdayız.\n\nSaygılarımızla,\nFrenciniz Ekibi"},
    {id:"order-confirm",name:"Sipariş Onayı",subject:"Siparişiniz Alındı — {{siparis_no}}",body:"Merhaba {{isim}},\n\n{{siparis_no}} numaralı siparişiniz başarıyla alınmıştır.\n\nSipariş Tutarı: {{tutar}}\nTahmini Kargo: 1-3 iş günü\n\nSiparişinizi hesabınızdan takip edebilirsiniz.\n\nSaygılarımızla,\nFrenciniz"},
    {id:"shipped",name:"Kargoya Verildi",subject:"Siparişiniz Kargoya Verildi — {{siparis_no}}",body:"Merhaba {{isim}},\n\n{{siparis_no}} numaralı siparişiniz kargoya verilmiştir.\n\nKargo Firması: {{kargo_firma}}\nTakip No: {{takip_no}}\n\nİyi günler dileriz,\nFrenciniz"},
    {id:"delivered",name:"Teslim Edildi",subject:"Siparişiniz Teslim Edildi — {{siparis_no}}",body:"Merhaba {{isim}},\n\n{{siparis_no}} numaralı siparişiniz teslim edilmiştir.\n\nAlışveriş deneyiminizi değerlendirmenizi rica ederiz.\n\nTeşekkürler,\nFrenciniz"},
    {id:"stock-notify",name:"Stok Bildirimi",subject:"İstediğiniz Ürün Stoğa Girdi!",body:"Merhaba,\n\nTakip ettiğiniz {{urun_adi}} ürünü tekrar stoklara girmiştir.\n\nHemen sipariş vermek için sitemizi ziyaret edin.\n\nFrenciniz"},
  ];
  return <ACard title="E-posta Şablonları">
    {!sel?<>
      <div style={{padding:12,background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1",marginBottom:16}}>💡 Şablonlarda {"{{isim}}"}, {"{{siparis_no}}"}, {"{{tutar}}"} gibi değişkenler otomatik doldurulur.</div>
      {templates.map((t,i)=><div key={t.id} onClick={()=>setSel(t)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:i<templates.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>📨 {t.name}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>Konu: {t.subject}</div></div>
        <span style={{color:"#ff6000",fontSize:13}}>Düzenle →</span>
      </div>)}
    </>:<div>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:16}}>← Geri</button>
      <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{sel.name} Şablonu</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:600}}>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>E-posta Konusu</label><AIn defaultValue={sel.subject}/></div>
        <div><label style={{fontSize:12,fontWeight:600,color:"#666",display:"block",marginBottom:4}}>İçerik</label><textarea defaultValue={sel.body} rows={10} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:6,fontSize:13,lineHeight:1.7,resize:"vertical",fontFamily:"inherit"}}/></div>
        <div style={{display:"flex",gap:8}}><ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn><ABtn color="#2563eb">Test Maili Gönder</ABtn></div>
      </div>
    </div>}
  </ACard>;
}

// ── CHAT HISTORY ──
function AChatHistory(){
  const chats=[
    {id:1,customer:"Ziyaretçi #1042",date:"05.04.2026 14:32",messages:[
      {from:"bot",text:"Merhaba! Size nasıl yardımcı olabilirim?",time:"14:32"},
      {from:"user",text:"ABS sensörü arıyorum, MAN TGA'ya uyar mı?",time:"14:33"},
      {from:"bot",text:"OEM veya parça kodunu paylaşırsanız stok ve fiyat bilgisini hemen kontrol edebiliriz.",time:"14:33"},
      {from:"user",text:"441 032 578 0 OEM numaralı",time:"14:34"},
      {from:"bot",text:"Bu konuda teknik ekibimiz size yardımcı olabilir. Araç bilgilerinizi paylaşır mısınız?",time:"14:35"},
    ]},
    {id:2,customer:"Ahmet Y.",date:"05.04.2026 11:15",messages:[
      {from:"bot",text:"Merhaba! Size nasıl yardımcı olabilirim?",time:"11:15"},
      {from:"user",text:"Sipariş FRN-4821 ne zaman kargoya verilecek?",time:"11:16"},
      {from:"bot",text:"Sipariş ve kargo takibi için sipariş numaranızı paylaşabilir misiniz?",time:"11:17"},
    ]},
    {id:3,customer:"Ziyaretçi #1038",date:"04.04.2026 16:48",messages:[
      {from:"bot",text:"Merhaba! Size nasıl yardımcı olabilirim?",time:"16:48"},
      {from:"user",text:"Toplu alım için fiyat alabilir miyim?",time:"16:49"},
      {from:"bot",text:"Toplu alım için özel fiyat teklifi hazırlayabiliriz. Miktar ve ürün detaylarını iletir misiniz?",time:"16:50"},
      {from:"user",text:"50 adet kampana balata ve 20 adet fren diski",time:"16:51"},
    ]},
  ];
  const [sel,setSel]=useState(null);
  return <ACard title={`Canlı Destek Geçmişi (${chats.length} sohbet)`}>
    {!sel?chats.map((ch,i)=>(
      <div key={ch.id} onClick={()=>setSel(ch)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:i<chats.length-1?"1px solid #f0f0f0":"none",cursor:"pointer"}}>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{ch.customer}</div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>{ch.messages[ch.messages.length-1]?.text?.slice(0,60)}...</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,color:"#999"}}>{ch.date}</div>
          <div style={{fontSize:11,color:"#ff6000",marginTop:2}}>{ch.messages.length} mesaj</div>
        </div>
      </div>
    )):<div>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#ff6000",fontSize:13,cursor:"pointer",marginBottom:16}}>← Geri</button>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:700}}>{sel.customer}</div>
        <span style={{fontSize:12,color:"#999"}}>{sel.date}</span>
      </div>
      <div style={{background:"#f9f9f9",borderRadius:8,padding:16}}>
        {sel.messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",marginBottom:10}}>
            <div style={{maxWidth:"70%",padding:"10px 14px",borderRadius:m.from==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.from==="user"?"#ff6000":"#fff",color:m.from==="user"?"#fff":"#333",fontSize:13,lineHeight:1.5}}>
              {m.text}
              <div style={{fontSize:10,opacity:.6,marginTop:4,textAlign:"right"}}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>}
  </ACard>;
}

// ── REVENUE REPORT ──
function ARevenue(){
  const [period,setPeriod]=useState("monthly");
  const data={
    monthly:[
      {month:"Ocak",revenue:24500,cost:16800,orders:32},
      {month:"Şubat",revenue:31200,cost:21400,orders:41},
      {month:"Mart",revenue:28800,cost:19600,orders:38},
      {month:"Nisan",revenue:35400,cost:24200,orders:47},
    ],
    quarterly:[
      {month:"Q1 2026",revenue:84500,cost:57800,orders:111},
      {month:"Q4 2025",revenue:92300,cost:63100,orders:128},
      {month:"Q3 2025",revenue:78600,cost:53700,orders:105},
    ]
  };
  const rows=data[period]||data.monthly;
  const totRev=rows.reduce((a,r)=>a+r.revenue,0);
  const totCost=rows.reduce((a,r)=>a+r.cost,0);
  const totProfit=totRev-totCost;
  const margin=Math.round((totProfit/totRev)*100);

  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Gelir / Gider Raporu</h1>
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      {[{id:"monthly",l:"Aylık"},{id:"quarterly",l:"Çeyreklik"}].map(p=>(
        <button key={p.id} onClick={()=>setPeriod(p.id)} style={{padding:"8px 20px",border:`2px solid ${period===p.id?"#ff6000":"#ddd"}`,borderRadius:6,background:period===p.id?"#fff5f0":"#fff",color:period===p.id?"#ff6000":"#888",fontSize:13,fontWeight:600,cursor:"pointer"}}>{p.l}</button>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#059669"}}>₺{totRev.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Toplam Gelir</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#dc2626"}}>₺{totCost.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Toplam Gider</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>₺{totProfit.toLocaleString("tr-TR")}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Net Kâr</div></div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:8,padding:20}}><div style={{fontSize:22,fontWeight:800,color:"#7c3aed"}}>%{margin}</div><div style={{fontSize:12,color:"#999",marginTop:2}}>Kâr Marjı</div></div>
    </div>
    <ACard title="Detaylı Tablo">
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{borderBottom:"2px solid #eee"}}>{["Dönem","Gelir","Gider","Kâr","Marj","Sipariş"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:12,color:"#999",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>{const profit=r.revenue-r.cost;const m=Math.round((profit/r.revenue)*100);return(
          <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
            <td style={{padding:"10px",fontWeight:600}}>{r.month}</td>
            <td style={{padding:"10px",color:"#059669",fontWeight:600}}>₺{r.revenue.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px",color:"#dc2626"}}>₺{r.cost.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px",color:"#2563eb",fontWeight:600}}>₺{profit.toLocaleString("tr-TR")}</td>
            <td style={{padding:"10px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:50,height:6,background:"#eee",borderRadius:3}}><div style={{width:`${m}%`,height:6,background:m>30?"#059669":"#b45309",borderRadius:3}}/></div><span style={{fontSize:12,fontWeight:600}}>%{m}</span></div></td>
            <td style={{padding:"10px"}}>{r.orders}</td>
          </tr>)})}</tbody>
      </table>
    </ACard></>;
}

// ── ADMIN USER MANAGEMENT ──
function AAdminUsers(){
  const [users,setUsers]=useState([
    {id:1,name:"Tarkan Duman",email:"tarkan@frenciniz.com",role:"Süper Admin",active:true,lastLogin:"05.04.2026 09:15"},
    {id:2,name:"Yönetici 2",email:"yonetici@frenciniz.com",role:"Yönetici",active:true,lastLogin:"04.04.2026 14:30"},
    {id:3,name:"Operatör",email:"operator@frenciniz.com",role:"Operatör",active:false,lastLogin:"01.04.2026 11:00"},
  ]);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",email:"",role:"Operatör",password:""});
  const roles=["Süper Admin","Yönetici","Operatör","Görüntüleyici"];
  const rolePerms={"Süper Admin":"Tüm yetkiler","Yönetici":"Ürün, sipariş, müşteri yönetimi","Operatör":"Sipariş ve stok yönetimi","Görüntüleyici":"Sadece görüntüleme"};

  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Admin Kullanıcı Yönetimi</h1>
    <ACard title={`Admin Kullanıcıları (${users.length})`} action={<ABtn onClick={()=>setShowAdd(!showAdd)}>+ Yeni Admin</ABtn>}>
      {showAdd&&<div style={{background:"#fafafa",borderRadius:8,padding:16,marginBottom:16,border:"1px solid #eee"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Yeni Admin Ekle</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <AIn placeholder="Ad Soyad" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <AIn placeholder="E-posta" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          <AIn placeholder="Şifre" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
          <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{padding:"9px",border:"1px solid #ddd",borderRadius:6,fontSize:13}}>
            {roles.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}><ABtn onClick={()=>{setUsers(p=>[...p,{id:Date.now(),name:form.name,email:form.email,role:form.role,active:true,lastLogin:"—"}]);setShowAdd(false);setForm({name:"",email:"",role:"Operatör",password:""})}}>Ekle</ABtn><ABtn color="#999" onClick={()=>setShowAdd(false)}>İptal</ABtn></div>
      </div>}
      {users.map((u,i)=>(
        <div key={u.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:i<users.length-1?"1px solid #f0f0f0":"none"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:u.active?"#ff6000":"#ddd",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:700}}>{u.name.charAt(0)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
            <div style={{fontSize:12,color:"#888"}}>{u.email}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <span style={{padding:"4px 12px",borderRadius:4,fontSize:11,fontWeight:600,background:u.role==="Süper Admin"?"#fef3c7":u.role==="Yönetici"?"#dbeafe":"#f0f0f0",color:u.role==="Süper Admin"?"#b45309":u.role==="Yönetici"?"#2563eb":"#666"}}>{u.role}</span>
          </div>
          <div style={{fontSize:11,color:"#999",textAlign:"right",minWidth:100}}>Son giriş:<br/>{u.lastLogin}</div>
          <button onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x))} style={{padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:u.active?"#dcfce7":"#fee2e2",color:u.active?"#059669":"#dc2626"}}>{u.active?"Aktif":"Pasif"}</button>
          {u.role!=="Süper Admin"&&<button onClick={()=>setUsers(p=>p.filter(x=>x.id!==u.id))} style={{padding:"4px 10px",border:"1px solid #fcc",borderRadius:4,background:"#fff",fontSize:12,color:"#e53935",cursor:"pointer"}}>Sil</button>}
        </div>
      ))}
    </ACard>
    <ACard title="Yetki Rolleri">
      {roles.map((r,i)=>(
        <div key={r} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<roles.length-1?"1px solid #f0f0f0":"none"}}>
          <span style={{fontSize:14,fontWeight:600}}>{r}</span>
          <span style={{fontSize:13,color:"#888"}}>{rolePerms[r]}</span>
        </div>
      ))}
    </ACard></>;
}

// ── PAYMENT GATEWAY SETTINGS ──
function APaymentCfg(){
  const [activeGw,setActiveGw]=useState("garanti");
  const [ok,setOk]=useState(false);
  const [gateways,setGateways]=useState({
    garanti:{enabled:false,mode:"test",merchantId:"",terminalId:"",provUserId:"",provPass:"",storeKey:""},
    paytr:{enabled:false,mode:"test",merchantId:"",merchantKey:"",merchantSalt:"",successUrl:"",failUrl:""},
    param:{enabled:false,mode:"test",clientCode:"",clientUsername:"",clientPassword:"",guid:""},
  });

  const updateGw=(gw,field,val)=>setGateways(p=>({...p,[gw]:{...p[gw],[field]:val}}));
  const gwInfo={
    garanti:{name:"Garanti BBVA",logo:"🏦",color:"#00854A",docs:"https://dev.garantibbva.com.tr",fields:[
      {key:"merchantId",label:"Üye İşyeri No (Merchant ID)",ph:"7000XXXX"},
      {key:"terminalId",label:"Terminal No",ph:"30691XXX"},
      {key:"provUserId",label:"Prov. Kullanıcı Adı",ph:"PROVAUT"},
      {key:"provPass",label:"Prov. Şifresi",ph:"••••••••",type:"password"},
      {key:"storeKey",label:"3D Secure Store Key",ph:"••••••••",type:"password"},
    ]},
    paytr:{name:"PayTR",logo:"💰",color:"#1a9c5b",docs:"https://dev.paytr.com",fields:[
      {key:"merchantId",label:"Mağaza No (Merchant ID)",ph:"XXXXXX"},
      {key:"merchantKey",label:"Mağaza Anahtarı (Merchant Key)",ph:"••••••••",type:"password"},
      {key:"merchantSalt",label:"Mağaza Gizli Anahtar (Salt)",ph:"••••••••",type:"password"},
      {key:"successUrl",label:"Başarılı Ödeme URL",ph:"https://frenciniz.com/odeme-basarili"},
      {key:"failUrl",label:"Başarısız Ödeme URL",ph:"https://frenciniz.com/odeme-basarisiz"},
    ]},
    param:{name:"Param",logo:"🔷",color:"#0066cc",docs:"https://dev.param.com.tr",fields:[
      {key:"clientCode",label:"Client Code",ph:"1XXXX"},
      {key:"clientUsername",label:"Client Username",ph:"Test"},
      {key:"clientPassword",label:"Client Password",ph:"••••••••",type:"password"},
      {key:"guid",label:"GUID",ph:"0c13d406-873b-XXXX-XXXX"},
    ]},
  };

  const gw=gwInfo[activeGw];
  const gwState=gateways[activeGw];
  const enabledCount=Object.values(gateways).filter(g=>g.enabled).length;

  return <><h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Ödeme Ayarları</h1>

    {/* Summary cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
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
          <ABtn onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000)}}>{ok?"✓ Kaydedildi":"Kaydet"}</ABtn>
          <ABtn color="#2563eb">Bağlantıyı Test Et</ABtn>
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}>
          <div><div style={{fontSize:14,fontWeight:600}}>Havale / EFT</div><div style={{fontSize:12,color:"#888"}}>Manuel havale ile ödeme seçeneği</div></div>
          <input type="checkbox" defaultChecked style={{accentColor:"#ff6000"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
          <div><div style={{fontSize:14,fontWeight:600}}>Kapıda Ödeme</div><div style={{fontSize:12,color:"#888"}}>Kapıda nakit veya kart ile ödeme</div></div>
          <input type="checkbox" style={{accentColor:"#ff6000"}}/>
        </div>
      </div>
    </ACard>
  </>;
}
