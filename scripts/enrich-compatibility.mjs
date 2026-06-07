import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "public", "data", "products.json");
const CATEGORIES_PATH = path.join(ROOT, "public", "data", "categories.json");
const REPORT_PATH = path.join(ROOT, "pricing-research", "compatibility-enrichment-report.json");
const RULE_SOURCE = "name_oem_rules_v2";

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
    title: "Freenco K000472 caliper guides and seals repair kit",
    url: "https://www.freenco.com/en/product/caliper-guides-seals-repair-kit-20",
    usedFor: "Knorr SN6/SN7/SK7 and Mercedes/MAN/Scania caliper repair kit reference",
  },
  {
    title: "TTT-Caliper K000472 caliper pin repair kit",
    url: "https://www.ttt-caliper.com/caliper-pin-repair-kit-264",
    usedFor: "Knorr SN/SK/SL/SM caliper and multi-brand vehicle references",
  },
  {
    title: "Alcan K000132 caliper repair kit",
    url: "https://alcanotomotiv.com/index.php/product/knorr/3002-k000132",
    usedFor: "Knorr SB6/SB7 and Mercedes Atego caliper repair kit reference",
  },
  {
    title: "Strans WABCO PAN19/PAN22 adjustment mechanism kit",
    url: "https://strans-shop.com.ua/en/shop/product/517516",
    usedFor: "WABCO PAN19-1 / PAN22-1 caliper mechanism reference",
  },
  {
    title: "Partstock Meritor DUCO MCK1116 guide pin kit",
    url: "https://partstock.eu/products/gk88002-meritor-b-duco-c-duco-d-duco-caliper-guide-pin-and-seal-kit-1489197-cmsk-3-1-5021202776-85102094-mck1116",
    usedFor: "Meritor DUCO / MCK1116 caliper repair kit reference",
  },
  {
    title: "Victor Truck brake drum catalogue",
    url: "https://www.victortruck.com/upload/2018100909170679.pdf",
    usedFor: "SAF 1064010801 brake drum reference",
  },
  {
    title: "REATON 3092710 / 8551042 Volvo brake disc",
    url: "https://www.reatonbrake.com/product/3092710/",
    usedFor: "Volvo 3092710 / 8551042 brake disc reference",
  },
  {
    title: "Aurora Meritor trailer brake disc 21227349 / MBR9018",
    url: "https://www.auroraproparts.com/products/meritor-trailer-brake-disc-21225115-21227349-22227349/",
    usedFor: "ROR / Meritor trailer brake disc reference",
  },
  {
    title: "Uz-Par Gigant ROR 6604261 / 9267086 brake disc",
    url: "https://www.uz-par.com/urun/gigant-ror-dingil-fren-diski-kogel-krone-ed22002-6604261-9267086",
    usedFor: "Gigant / ROR / Kögel / Krone trailer brake disc reference",
  },
  {
    title: "Zohama WVA 29087 brake pad",
    url: "https://zohama.com/brake-pad-wva-29087/",
    usedFor: "WVA 29087 multi-brand heavy vehicle brake pad reference",
  },
  {
    title: "CEI WVA 29244 brake pad",
    url: "https://www.cei.it/parts/products-details/brake-pads/wva/29244.html",
    usedFor: "Mercedes Axor / Actros / Econic WVA 29244 brake pad reference",
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
    key: "mercedes-general",
    regex: /\bMERCEDES\b|\bMB\b|\bARCS\b|A0{3}421|640915|624\.?420|620\.?420|393\.?420/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Axor", "Mercedes-Benz Atego", "Mercedes-Benz Arocs"],
  },
  {
    key: "man-tg",
    regex: /\bMAN\b|\bTGA\b|\bTGS\b|\bTGX\b|\bTGM\b|815080|8150\.?803|8150\.?11|8143|8135|814550|819980|835700/i,
    compat: ["MAN TGA", "MAN TGS", "MAN TGX", "MAN TGM", "MAN TGS/TGX 40.360", "MAN TGS/TGX 40.460"],
  },
  {
    key: "scania",
    regex: /\bSCANIA\b|\bSCANI\b|\bSCAN\b|\bG420\b|\bR420\b|\bR440\b/i,
    compat: ["Scania P/G/R serisi", "Scania G420", "Scania R420/R440"],
  },
  {
    key: "volvo-fh-fm",
    regex: /\bVOLVO\b|\bFH\b|\bFH12\b|\bFM\b/i,
    compat: ["Volvo FH", "Volvo FH12", "Volvo FM", "Volvo FL II/FL III"],
  },
  {
    key: "renault",
    regex: /\bRENAULT\b|\bRENO\b|\bRVI\b|\bPREMIUM\b|\bMAGNUM\b|\bKERAX\b|\bMIDLUM\b/i,
    compat: ["Renault Trucks Premium", "Renault Trucks Magnum", "Renault Trucks Kerax", "Renault Trucks Midlum"],
  },
  {
    key: "ford-cargo",
    regex: /\bFORD\b|\bCARGO\b|9C46|DC46|7C46|85DB|13C33|FC46|A333K/i,
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
    regex: /\bBMC\b|57RS|\bFAT[İI]H\b|\bPROF(?:ESYONEL)?\b|\bPRO\s?(?:522|940)\b|\b822\b|\b827\b|\bAS\s?(?:26|32|900|950)\b|\bDODGE\b|\bMARATON\b|7K|5K|K8C|K5C/i,
    compat: ["BMC Probus", "BMC Profesyonel", "BMC Fatih", "BMC Pro 522/827", "Askam / Dodge ağır vasıta"],
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
    regex: /\bBPW\b|\bBP\b|BPV|03\.272|0327|030883|3109(?:46|67|77)|05\.091/i,
    compat: ["BPW dorse dingili", "BPW ECOPlus dingil", "BPW treyler"],
  },
  {
    key: "saf",
    regex: /\bSAF\b|10640|407900|054294|3434381200|SFAX|SF AXLE|SF HDX|\bSFK\b/i,
    compat: ["SAF dorse dingili", "SAF Holland treyler"],
  },
  {
    key: "ror",
    regex: /\bROR\b|\bMERITOR\b|\bGIGANT\b|\bK[ÖO]GEL\b|MBR|M069018|M200135/i,
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
  {
    key: "wabco-pan-maxx",
    regex: /\bPAN ?(?:17|19|22)|PAN19|PAN22|MAXX ?22T|MAXX22|WABCO/i,
    compat: ["WABCO PAN17/PAN19/PAN22 kaliper sistemi", "WABCO MAXX22T kaliper sistemi", "Dorse disk fren sistemi"],
  },
  {
    key: "knorr-sb-sn-sk",
    regex: /\bKNORR?\b|\bSIMITS\b|\b(?:SB5|SB6|SB7|SN6|SN7|SK7|NA7|ST7|SL7|SM7)\b|K000132|K000472|K017707|K105599|K000129|K000133|CKSK|CH10(?:19|25|39|42|70|71|78)/i,
    compat: ["Knorr-Bremse SB/SN/SK kaliper sistemi", "MAN TGA/TGS/TGX", "Mercedes-Benz Actros/Atego", "Scania 4/P/G/R serisi", "DAF CF/XF", "Iveco Eurocargo/Stralis"],
  },
  {
    key: "meritor-elsa-duco",
    regex: /ELSA|DUCO|MCK1116|MCK1139|MCK1289|MCK1298|8510209|85107913|1489197|1487339|5021202776|CMSK/i,
    compat: ["Meritor ELSA/DUCO kaliper sistemi", "Volvo FH/FM", "Renault Trucks Premium/Magnum", "DAF CF/XF"],
  },
  {
    key: "haldex-modulx",
    regex: /MODULX|HALDEX/i,
    compat: ["Haldex ModulX kaliper sistemi", "Dorse disk fren sistemi"],
  },
  {
    key: "wabco-ebs-abs",
    regex: /\bEBS\b|\bABS\b|441032|4497|463084|971002|027832|W449/i,
    compat: ["WABCO ABS/EBS sistemi", "Dorse EBS sistemi", "Kamyon / treyler ABS sensör hattı"],
  },
  {
    key: "local-trailer-axles",
    regex: /SERTEL|SER[İI]N|OSMAN\s?KO[ÇC]|MUSTAFA\s?CEYLAN|ÖZKO[ÇC]|OZKO[ÇC]|AYDIN|AXL|AK-?KAR|YEKSAN|PIRLANTA|NURMEK|SEMI|SEM[İI]|TDS|COS|SE[ÇC]K[İI]NSAN|ALTINORDU|EFE\s?DORSE|PILOT\s?DORSE|P[İI]LOT\s?DORSE|EF\s?42/i,
    compat: ["Yerel dorse dingil grubu", "Dorse / treyler", "Ağır vasıta dorse dingili"],
  },
  {
    key: "fruehauf-smb",
    regex: /FRUEHAUF|FRUHAUF|\bSMB\b/i,
    compat: ["Fruehauf dorse dingili", "SMB dorse dingili", "Dorse / treyler"],
  },
  {
    key: "york-valx-yte",
    regex: /\bYORK\b|\bVALX\b|\bYTE\b|ÖZTREYLER|OZTREYLER/i,
    compat: ["York / Valx dorse dingili", "YTE / Öztreyler dorse dingili", "Dorse / treyler"],
  },
  {
    key: "brake-chamber-systems",
    regex: /ARFESAN|BAYKAR|FREN K[ÖO]R[ÜU][ĞG][ÜU]|SERV[İI]S.*K[ÖO]R[ÜU][ĞG][ÜU]|K[ÖO]R[ÜU]KSAN|KAPL[İI]N|KALDIRMA LAST[İI][ĞG][İI]|[İI]MDAT|IMDAT|D\/P|D\/D|KAMPANA T[İI]P[İI]|D[İI]SK T[İI]P[İI]/i,
    compat: ["Disk fren imdatlı fren körüğü", "Kampana fren imdatlı fren körüğü", "Dorse fren körüğü"],
  },
  {
    key: "caliper-generic-system",
    regex: /KAL[İI]PER|BALATA TUTUCU|[İI]T[İI]C[İI]\s?PLEYT|PLEYT|D[İI]SK MONTAJ SET[İI]|MASURA|RULMAN YATA[ĞG]I/i,
    compat: ["Ağır vasıta kaliper sistemi", "Knorr / WABCO / Meritor kaliper uygulamaları", "Disk fren montaj sistemi"],
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
  {
    regex: /5010525326|5010598305|5010525362|5010525015|5010422593|5010216437|5010422363|5006172150|504134958|5010260218|5010488071|5010557355|5010294307|5001832067/i,
    compat: ["Renault Trucks Midlum", "Renault Trucks Premium", "Renault Trucks Magnum"],
    note: "5010 / 5001 Renault Trucks OEM referansları Midlum, Premium ve Magnum ağır vasıta fren/süspansiyon kataloglarında sık kullanılır.",
  },
  {
    regex: /85103803|85103804|85110495|85110496|20515093|20582213|20582214|20582209|20582206|20531986|21961448|21961374|21961456|21222442|2229000300|2229210300|20757541|1379392|1379393|1440294|7421575117|7422025556/i,
    compat: ["Volvo FH", "Volvo FM", "Volvo FL", "Volvo otobüs / ağır vasıta"],
    note: "8510 / 2058 / 2196 / 7422 Volvo-Renault referansları Volvo FH/FM/FL ve ilgili ağır vasıta fren-süspansiyon kataloglarında kullanılır.",
  },
  {
    regex: /1386686|1402272|1852817|1726138|1387439|1640561|1723416|1528655|1528712|1368690|1368692|1368693|1411980|337559/i,
    compat: ["Scania 4 serisi", "Scania P/G/R serisi", "Scania G420", "Scania R420/R440"],
    note: "Scania 13/14/17/18 ile başlayan OEM referansları Scania 4 ve P/G/R serisi fren parça kataloglarında geçer.",
  },
  {
    regex: /7189476|7185503|7182682|7182772|7182305|7179778|7192305|7173317|7172079|7172329|7168333|7168838|7168580|7168257|7168346|7161201|2995812|2996328|2992470|2996329|2991979|1906461|1906438|1907631|1908614|1908729|421174|420648|42541412|42562856|5006028005/i,
    compat: ["Iveco Eurocargo", "Iveco Eurotech", "Iveco Stralis", "Otoyol / Iveco otobüs"],
    note: "716/717/718/299/190 ve 421174 referansları Iveco-Otoyol ağır vasıta fren ve bijon kataloglarında kullanılır.",
  },
  {
    regex: /942421|943421|946356|960421|970421|970423|975423|942990|000\s?420|305421|301423|346423|360423|617423|624421|623420|619420|658420|658421|381401|381402|371401|371402|327401|327402|346401|355401|393420/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Axor", "Mercedes-Benz Atego", "Mercedes-Benz SK/NG", "Mercedes-Benz 2517/2521/2524/2622"],
    note: "Mercedes-Benz 000420 / 3xx401 / 3xx421 / 9xx421 OEM referansları Actros, Axor, Atego ve SK/NG ağır vasıta gruplarında kullanılır.",
  },
  {
    regex: /815011|815061|815082|814360|814430|814550|813570|819980|81\.50822|81\.50820|81\.50803/i,
    compat: ["MAN TGA", "MAN TGS", "MAN TGX", "MAN TGM", "MAN TGL"],
    note: "MAN 81.x / 814 / 815 OEM referansları MAN TGA, TGS, TGX, TGM ve TGL ağır vasıta fren parça kataloglarında geçer.",
  },
  {
    regex: /7C46|85DB|13C33|FC46|A333K4561/i,
    compat: ["Ford Cargo", "Ford Cargo 2520/2524/3227/3230", "Ford Cargo çekici"],
    note: "7C46 / 85DB / 13C33 / A333K referansları Ford Cargo ağır vasıta fren ve porya parçalarında kullanılır.",
  },
  {
    regex: /MC\s?828|MK\s?321|MC808846|MB\s?060500|894121376107/i,
    compat: ["Mitsubishi Canter", "Mitsubishi Fuso", "Isuzu NPR/NQR"],
    note: "MC/MK/MB060 ve 894121 referansları Mitsubishi Fuso/Canter ve Isuzu NPR-NQR hafif/ağır ticari fren parçalarında kullanılır.",
  },
  {
    regex: /K000472|K017707|K000132|000\s?420\s?3482|81\.?50822\.?6019|1723416|09\.801\.06\.33\.0/i,
    compat: ["Knorr-Bremse SN6/SN7/SK7 kaliper", "MAN TGA/TGS/TGX", "Mercedes-Benz Actros", "Scania 4/P/G/R serisi", "BPW dorse dingili"],
    note: "K000472 / K017707 / K000132 referansları Knorr SB/SN/SK kaliper tamir setlerinde Mercedes, MAN, Scania ve BPW uygulamalarıyla listelenir.",
  },
  {
    regex: /MCK1116|MCK1139|MCK1289|MCK1298|85102094|85107913|1489197|1487339|5021202776/i,
    compat: ["Meritor ELSA/DUCO kaliper sistemi", "Volvo FH/FM", "Renault Trucks Premium/Magnum", "DAF CF/XF"],
    note: "MCK1116 / MCK1139 / MCK1289 referansları Meritor ELSA-DUCO kaliper tamir setlerinde geçer.",
  },
  {
    regex: /\b29158\b|\b29171\b|\b29175\b|\b29195\b|\b29228\b|\b29403\b|\b29256\b|\b29246\b|\b29159\b|\b29126\b|\b29167\b|\b29216\b|\b29270\b|\b29011\b/i,
    compat: ["Ağır vasıta disk fren balata sistemi", "Knorr / WABCO / Meritor kaliper uygulamaları", "Kamyon / tır / otobüs"],
    note: "WVA 29xxx referansları ağır vasıta disk fren balatalarında kaliper sistemi ve ölçüye göre eşleştirilir.",
  },
  {
    regex: /8551042|3092710/i,
    compat: ["Volvo FH", "Volvo FM", "Volvo FL"],
    note: "OEM 3092710 / 8551042 Volvo ağır vasıta fren diski referansı olarak kataloglarda geçer.",
  },
  {
    regex: /9267086|6604261/i,
    compat: ["Gigant dorse dingili", "ROR dorse dingili", "Kögel dorse", "Krone dorse"],
    note: "OEM 9267086 / 6604261 Gigant-ROR dorse fren diski referansı olarak listelenir.",
  },
  {
    regex: /21227349|MBR9018|68323825|MBR5124|MBR9004|M069018|M200135|MBR9007|1176816|17870|MBR5143|1088133/i,
    compat: ["ROR dorse dingili", "Meritor/ROR treyler", "Dorse disk fren sistemi"],
    note: "MBR / ROR / Meritor referansları treyler ve dorse disk fren uygulamalarında kullanılır.",
  },
  {
    regex: /82135830|501315228|501316953|4200172|1415147|234110|II371910061/i,
    compat: ["Neoplan otobüs", "Scania otobüs", "Volvo otobüs / ağır vasıta"],
    note: "82135830 / 501315228 / 1415147 referansları otobüs ve ağır vasıta fren diski kataloglarında geçer.",
  },
  {
    regex: /5010098949|5010098861|5010098860|5010098832|5010098831|5010439317|5010439406|5010260028|5010260117|5000791212|5021172204|5021172197/i,
    compat: ["Renault Trucks Midlum", "Renault Trucks Premium", "Renault Trucks Magnum", "Renault Trucks Kerax"],
    note: "5010 / 5000 Renault Trucks referansları Midlum, Premium, Magnum ve Kerax fren parçalarında sık kullanılır.",
  },
  {
    regex: /\b29087\b|\b29108\b|\b29106\b|\b29109\b|\b29163\b|\b29179\b|\b29201\b|\b29202\b|\b29061\b/i,
    compat: ["Mercedes-Benz Actros/Axor", "BPW dorse dingili", "Scania P/G/R serisi", "DAF CF/XF", "Iveco Stralis", "MAN TGA/TGS/TGX"],
    note: "WVA 29087 ailesi çok markalı ağır vasıta disk fren balatası olarak Mercedes, BPW, Scania, DAF, Iveco ve MAN uygulamalarında listelenir.",
  },
  {
    regex: /\b29173\b|\b29203\b|\b29272\b|\b29174\b|\b29244\b|\b29094\b|\b29095\b|\b29197\b/i,
    compat: ["Mercedes-Benz Actros/Axor", "Renault Trucks Premium/Magnum", "Volvo FH/FM", "Ağır vasıta disk fren balata sistemi"],
    note: "WVA 29173 / 29203 / 29244 / 29174 referansları ağır vasıta disk fren balatası kataloglarında Mercedes, Renault ve Volvo uygulamalarıyla geçer.",
  },
  {
    regex: /942401|943401|970401|960401|942328|942320|624\.?420|620\.?420|393\.?420|A0{3}421|640915/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Axor", "Mercedes-Benz Atego", "Mercedes-Benz Arocs"],
    note: "Mercedes-Benz 942/943/970/960 ve A000421 referansları Mercedes ağır vasıta fren, porya ve kaliper parçalarında kullanılır.",
  },
  {
    regex: /2285275|1868665|20515519|20515515|1391617|1388906|1818003|2019853|2120485/i,
    compat: ["Scania P/G/R serisi", "Volvo FH/FM", "Ağır vasıta porya / bijon grubu"],
    note: "2285275 / 20515519 / 1391617 benzeri referanslar Scania-Volvo ağır vasıta bijon ve porya gruplarında karşılık olarak kullanılır.",
  },
  {
    regex: /330730|130730|330211|130311|330210|130310/i,
    compat: ["SAF dorse dingili", "SAF Holland treyler", "Dorse porya / bijon grubu"],
    note: "330/130 ile başlayan dorse porya-bijon referansları SAF Holland treyler dingil gruplarında sık görülür.",
  },
  {
    regex: /AJA|AJB|M003176|M006891|M003133|A1561800|1561800|489001|489002|465002/i,
    compat: ["Dorse dingil grubu", "Treyler fren kampanası", "Yerel dorse dingil uygulamaları"],
    note: "AJA/AJB/M kodlu referanslar dorse ve treyler dingil fren kampanası-bijon gruplarında karşılık olarak kullanılır.",
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
for (const label of ["Ağır vasıta", "Dorse / treyler", "Ağır vasıta dorse dingili"]) {
  GENERIC_LABELS.add(label);
}

const GENERIC_PRODUCT_TITLES = new Map([
  ["FREN DISKI", "Fren Diski"],
  ["FREN DISK", "Fren Diski"],
  ["DISK", "Fren Diski"],
  ["FREN KAMPANASI", "Fren Kampanası"],
  ["KAMPANA", "Fren Kampanası"],
  ["DISK BALATASI", "Disk Balatası"],
  ["FREN DISK BALATASI", "Fren Disk Balatası"],
  ["FREN BALATASI", "Fren Balatası"],
]);

const TITLE_RULES = [
  { regex: /9267086|6604261/i, suffix: "Kögel Krone" },
  { regex: /8551042|3092710/i, suffix: "Volvo FH FM FL" },
  { regex: /21227349|MBR9018|68323825|MBR5124|MBR9004|M069018|M200135|MBR9007|1176816|17870|MBR5143|1088133/i, suffix: "ROR Meritor" },
];

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

function titleCaseBase(productName) {
  return GENERIC_PRODUCT_TITLES.get(normalize(productName).replace(/\s+/g, " ").trim());
}

function cleanTitlePart(value) {
  return String(value || "")
    .replace(/\b(?:dorse dingili|dorse|treyler|disk fren sistemi|kaliper sistemi|ağır vasıta|araç grubu|serisi)\b/gi, "")
    .replace(/Mercedes-Benz/g, "Mercedes")
    .replace(/Renault Trucks/g, "Renault")
    .replace(/Meritor\/ROR/g, "Meritor ROR")
    .replace(/[()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactTitleSuffix(parts) {
  const cleaned = uniq(parts.filter((part) => !GENERIC_LABELS.has(part)).map(cleanTitlePart)).filter((part) => {
    if (!part || GENERIC_LABELS.has(part)) return false;
    return !/^(Kamyon|T[ıi]r|Çekici|Otobüs|Dorse|Treyler)$/i.test(part);
  });
  if (!cleaned.length) return "";

  const volvo = cleaned.filter((part) => /^Volvo\s/i.test(part));
  if (volvo.length >= 2) {
    return `Volvo ${uniq(volvo.map((part) => part.replace(/^Volvo\s+/i, ""))).slice(0, 4).join(" ")}`;
  }

  const mercedes = cleaned.filter((part) => /^Mercedes\s/i.test(part));
  if (mercedes.length >= 2) {
    return `Mercedes ${uniq(mercedes.map((part) => part.replace(/^Mercedes\s+/i, ""))).slice(0, 4).join(" ")}`;
  }

  return cleaned.slice(0, 3).join(" ");
}

function makeProductName(product, compat) {
  const currentName = String(product.name || "").trim();
  const text = `${currentName} ${product.sku || ""} ${product.oem || ""}`;
  const titleRule = TITLE_RULES.find((rule) => rule.regex.test(text));
  const suffix = titleRule?.suffix || compactTitleSuffix(compat);
  const generatedGeneric = currentName.match(/^(Fren Diski|Fren Kampanası|Disk Balatası|Fren Balatası|Fren Disk Balatası) (?:Kamyon|T[ıi]r çekici|Otobüs|Dorse|Treyler)$/i);
  if (!suffix && generatedGeneric) return generatedGeneric[1];

  const generatedBase = suffix
    ? [...new Set(GENERIC_PRODUCT_TITLES.values())].find((baseName) => currentName === `${baseName} ${suffix}`)
    : "";
  const base = titleCaseBase(currentName) || generatedBase;
  if (!base) return currentName;
  if (!suffix) return currentName;

  const nextName = `${base} ${suffix}`.replace(/\s+/g, " ").trim();
  return nextName.length > 90 ? nextName.slice(0, 90).trim() : nextName;
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

  if (!String(product.compat_source || "").startsWith("name_oem_rules_")) {
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
  const name = makeProductName(product, compat);
  const desc = makeDescription({ ...product, name }, compat, notes);
  const group = groupId(product);
  summary.byGroup[group] = summary.byGroup[group] || {
    total: 0,
    changed: 0,
    withDescription: 0,
    withCompatibility: 0,
    specificCompatibility: 0,
  };
  summary.byGroup[group].total += 1;

  const nextNotes = notes.length ? notes : undefined;
  const before = JSON.stringify({
    name: product.name,
    desc: product.desc,
    compat: product.compat,
    compat_notes: product.compat_notes,
    compat_source: product.compat_source,
  });
  const after = JSON.stringify({
    name,
    desc,
    compat,
    compat_notes: nextNotes,
    compat_source: RULE_SOURCE,
  });
  product.name = name;
  product.desc = desc;
  product.compat = compat;
  product.compat_source = RULE_SOURCE;
  if (after !== before || !product.compat_updated_at) {
    product.compat_updated_at = summary.generatedAt;
  }
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

  if (after !== before) {
    summary.changed += 1;
    summary.byGroup[group].changed += 1;
  }
}

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products));
if (process.env.COMPAT_SKIP_REPORT !== "1") {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

console.log(JSON.stringify(summary, null, 2));
