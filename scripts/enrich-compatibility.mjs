import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS_PATH = path.join(ROOT, "public", "data", "products.json");
const CATEGORIES_PATH = path.join(ROOT, "public", "data", "categories.json");
const REPORT_PATH = path.join(ROOT, "pricing-research", "compatibility-enrichment-report.json");
const RULE_SOURCE = "name_oem_rules_v3_model_seo";

let catById = {};

const PRIORITY_GROUPS = new Set([
  "disk",
  "kampana",
  "balata",
  "circir",
  "bijon-grup",
  "porya-grup",
  "fren-pabuclari",
  "susp-korugu",
  "fren-korukleri",
]);
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
    compat: ["Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 2528", "Mercedes-Benz Axor 3228", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140"],
  },
  {
    key: "mercedes-actros",
    regex: /\bACTROS\b|AXOR-ACTROS/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 1841", "Mercedes-Benz Actros 1844", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140"],
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
    regex: /TRAVEGO|TOURISMO|TOURINO|INTOURO|O ?403|O ?404|O ?500|SETRA|MERCEDES.*(OTOB|BUS|V-8)|0302|0303|0304|0305|0307|0309/i,
    compat: ["Mercedes-Benz Travego", "Mercedes-Benz Tourismo", "Mercedes-Benz Tourino/Intouro", "Mercedes-Benz O403/O404/O500 otobüs", "Setra S300/S400/S500"],
  },
  {
    key: "mercedes-general",
    regex: /\bMERCEDES\b|\bMB\b|\bARCS\b|A0{3}421|640915|624\.?420|620\.?420|393\.?420/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140", "Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140", "Mercedes-Benz Atego", "Mercedes-Benz Arocs"],
  },
  {
    key: "man-bus",
    regex: /\bMAN\b.*(OTOB|BUS|FORTUNA|LION'?S|LION|NEOPLAN)|\bFORTUNA\b|\bLION'?S\b|\bNEOPLAN\b/i,
    compat: ["MAN Fortuna otobüs", "MAN Lion's Coach", "MAN Lion's City", "Neoplan otobüs"],
  },
  {
    key: "man-tg",
    regex: /\bMAN\b|\bTGA\b|\bTGS\b|\bTGX\b|\bTGM\b|815080|8150\.?803|8150\.?11|8143|8135|814550|819980|835700/i,
    compat: ["MAN TGA", "MAN TGA 18.430", "MAN TGA 18.460", "MAN TGS", "MAN TGX", "MAN TGM", "MAN TGL", "MAN TGS/TGX 40.360", "MAN TGS/TGX 40.460"],
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
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140", "Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140"],
    note: "OEM 3014210801 Mercedes-Benz Actros/Axor ağır vasıta fren kampanası referansı olarak kullanılır; araç yıl, aks ve şaseye göre teyit edilmelidir.",
  },
  {
    regex: /20700508|5010598308|20931249/i,
    compat: ["Renault Trucks Midlum", "Volvo FL II/FL III"],
    note: "OEM 20700508 / 5010598308 / 20931249 referansı Renault Midlum ve Volvo FL fren diski kataloglarında geçer.",
  },
  {
    regex: /0003270101|0003270201|3073270101|1134445/i,
    compat: ["Mercedes-Benz Travego", "Mercedes-Benz Tourismo", "Mercedes-Benz O403/O404/O500 otobüs", "Setra S200/S300/S400/S500"],
    note: "OEM 0003270101 / 0003270201 / 3073270101 referansı Mercedes-Benz Travego/Tourismo/O500 ve Setra otobüs süspansiyon körüğü kataloglarında geçer.",
  },
  {
    regex: /3873280101|81436010033|1629193|0220024100|51436010039/i,
    compat: ["MAN TGA/TGS/TGX", "MAN Fortuna otobüs", "Mercedes-Benz Actros/Axor", "Mercedes-Benz Travego/Tourismo", "Volvo kamyon/otobüs", "BPW dorse dingili"],
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
    regex: /310977340|3106775|310946|310967|032963|329623|329633/i,
    compat: ["BPW dorse dingili", "BPW treyler"],
    note: "OEM 310977 / 310677 / 310946 / 032963 / 3296xx referansları BPW dorse fren kampanası ve bijon gruplarında listelenir.",
  },
  {
    regex: /1064010801|1064012801|106402600/i,
    compat: ["SAF dorse dingili", "SAF Holland treyler"],
    note: "OEM 106401 / 106402 referansları SAF Holland dorse fren kampanası gruplarında listelenir.",
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
    regex: /85103803|85103804|85110495|85110496|20515093|20582213|20582214|20582209|20582206|20531986|21961448|21961374|21961456|21222442|2229000300|2229210300|20757541|1379392|1379393|1440294|7421575117|7422025556|20524942|3963997|1573081|1573082/i,
    compat: ["Volvo FH", "Volvo FM", "Volvo FL", "Volvo otobüs / ağır vasıta"],
    note: "8510 / 2058 / 2196 / 7422 / 3963997 / 157308x Volvo-Renault referansları Volvo FH/FM/FL ve ilgili ağır vasıta fren, bijon ve süspansiyon kataloglarında kullanılır.",
  },
  {
    regex: /1386686|1402272|1852817|1726138|1387439|1640561|1723416|1528655|1528712|1368690|1368692|1368693|1411980|337559/i,
    compat: ["Scania 4 serisi", "Scania P/G/R serisi", "Scania G420", "Scania R420/R440"],
    note: "Scania 13/14/17/18 ile başlayan OEM referansları Scania 4 ve P/G/R serisi fren parça kataloglarında geçer.",
  },
  {
    regex: /7189476|7185503|7183050|7182682|7182772|7182305|7179778|7192305|7173317|7172079|7172329|7168333|7168838|7168580|7168257|7168346|7161201|2995812|2996328|2992470|2996329|2991979|1906461|1906438|1907631|1908614|1908729|421174|421184|420648|42541412|42562856|5006028005/i,
    compat: ["Iveco Eurocargo", "Iveco Eurotech", "Iveco Stralis", "Otoyol / Iveco otobüs"],
    note: "716/717/718/299/190 ve 421174 / 421184 referansları Iveco-Otoyol ağır vasıta fren, kampana ve bijon kataloglarında kullanılır.",
  },
  {
    regex: /942421|943421|946356|960421|970421|970423|975423|942990|000\s?420|305421|305423|301421|301423|346420|348420|346423|355423|360423|617423|624421|623420|619420|658420|658421|381401|381402|371401|371402|327401|327402|346401|355401|393420/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140", "Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140", "Mercedes-Benz Atego", "Mercedes-Benz SK/NG"],
    note: "Mercedes-Benz 000420 / 3xx401 / 3xx421 / 3xx423 / 9xx421 OEM referansları Actros, Axor, Atego ve SK/NG ağır vasıta fren, kampana, bijon, porya ve balata gruplarında kullanılır.",
  },
  {
    regex: /815011|815061|815082|814360|814430|814550|813570|819980|81\.50822|81\.50820|81\.50803/i,
    compat: ["MAN TGA", "MAN TGA 18.430", "MAN TGA 18.460", "MAN TGS", "MAN TGX", "MAN TGM", "MAN TGL", "MAN TGS/TGX 40.360", "MAN TGS/TGX 40.460"],
    note: "MAN 81.x / 814 / 815 OEM referansları MAN TGA, TGS, TGX, TGM, TGL ve 40.360/40.460 ağır vasıta fren parça kataloglarında geçer.",
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
    regex: /21020977|21020997|21022167|21023036|21018963|21209701|21209723|21211030|21021114|21021164|22222978|22224179/i,
    compat: ["ROR dorse dingili", "Meritor/ROR treyler", "Dorse / treyler"],
    note: "2102 / 2120 / 2222 ROR-Meritor referansları dorse kampana ve bijon gruplarında kullanılır.",
  },
  {
    regex: /99717|99720|99730|99731|1308038|1309190|1309191|1373007|1337020|1356736|620646|620648|620649/i,
    compat: ["DAF CF/XF", "DAF ağır vasıta bijon grubu"],
    note: "997xx / 6206xx / 1308-1309 referansları DAF ağır vasıta bijon ve somun gruplarında karşılık olarak kullanılır.",
  },
  {
    regex: /82135830|501315228|501316953|4200172|1415147|234110|II371910061/i,
    compat: ["Mercedes-Benz Travego/Tourismo", "MAN Fortuna otobüs", "Neoplan otobüs", "Scania otobüs", "Volvo otobüs / ağır vasıta"],
    note: "82135830 / 501315228 / 1415147 referansları otobüs ve ağır vasıta fren diski kataloglarında geçer; Travego, Tourismo, Fortuna, Neoplan ve Scania/Volvo otobüs uygulamalarında ölçü/şase teyidi gerekir.",
  },
  {
    regex: /5010098949|5010098861|5010098860|5010098832|5010098831|5010439317|5010439406|5010260028|5010260117|5000791212|5021172204|5021172197/i,
    compat: ["Renault Trucks Midlum", "Renault Trucks Premium", "Renault Trucks Magnum", "Renault Trucks Kerax"],
    note: "5010 / 5000 Renault Trucks referansları Midlum, Premium, Magnum ve Kerax fren parçalarında sık kullanılır.",
  },
  {
    regex: /\b29087\b|\b29108\b|\b29106\b|\b29109\b|\b29163\b|\b29179\b|\b29201\b|\b29202\b|\b29061\b/i,
    compat: ["Mercedes-Benz Actros/Axor", "Mercedes-Benz Actros 1840/3340/4140", "Mercedes-Benz Axor 1840/3340/4140", "BPW dorse dingili", "Scania P/G/R serisi", "Scania G420", "DAF CF/XF", "Iveco Stralis", "MAN TGA/TGS/TGX"],
    note: "WVA 29087 ailesi çok markalı ağır vasıta disk fren balatası olarak Mercedes, BPW, Scania, DAF, Iveco ve MAN uygulamalarında listelenir.",
  },
  {
    regex: /\b29173\b|\b29203\b|\b29272\b|\b29174\b|\b29244\b|\b29094\b|\b29095\b|\b29197\b/i,
    compat: ["Mercedes-Benz Actros/Axor", "Mercedes-Benz Actros 1840/3340/4140", "Mercedes-Benz Axor 1840/3340/4140", "Renault Trucks Premium/Magnum", "Volvo FH/FM", "Ağır vasıta disk fren balata sistemi"],
    note: "WVA 29173 / 29203 / 29244 / 29174 referansları ağır vasıta disk fren balatası kataloglarında Mercedes, Renault ve Volvo uygulamalarıyla geçer.",
  },
  {
    regex: /942401|943401|970401|960401|942328|942320|624\.?420|620\.?420|393\.?420|A0{3}421|640915/i,
    compat: ["Mercedes-Benz Actros", "Mercedes-Benz Actros 1840", "Mercedes-Benz Actros 3340", "Mercedes-Benz Actros 4140", "Mercedes-Benz Axor", "Mercedes-Benz Axor 1840", "Mercedes-Benz Axor 3340", "Mercedes-Benz Axor 4140", "Mercedes-Benz Atego", "Mercedes-Benz Arocs"],
    note: "Mercedes-Benz 942/943/970/960 ve A000421 referansları Mercedes Actros/Axor ağır vasıta fren, porya, bijon ve kaliper parçalarında kullanılır.",
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
  ["BIJON DPS", "Bijon"],
  ["BIJON", "Bijon"],
  ["DISK BIJONU", "Disk Bijonu"],
  ["DISK BIJONU CIVATASI", "Disk Bijonu"],
  ["BIJON SOMUNU", "Bijon Somunu"],
  ["DONER PULLU SOMUN", "Döner Pullu Somun"],
  ["BUYUK DONER PULLU SOMUN", "Büyük Döner Pullu Somun"],
  ["FREN CIRCIRI", "Fren Cırcırı"],
  ["OTOMATIK FREN CIRCIRI", "Otomatik Fren Cırcırı"],
  ["MEKANIK FREN CIRCIRI", "Mekanik Fren Cırcırı"],
  ["CIRCIR TAMIR TAKIM", "Fren Cırcırı Tamir Takımı"],
  ["PORYA", "Porya"],
  ["PORYA KAPAGI", "Porya Kapağı"],
  ["FREN KORUGU", "Fren Körüğü"],
  ["SUSPANSIYON KORUGU", "Süspansiyon Körüğü"],
  ["PISTONSUZ KORUK", "Pistonsuz Körük"],
  ["ROLL KORUK", "Roll Körük"],
  ["KOMPLE KORUK METAL PISTON", "Komple Körük Metal Piston"],
  ["KOMPLE KORUK PLASTIK PISTON", "Komple Körük Plastik Piston"],
  ["KALIPER PERNO TAMIR TAKIMI", "Kaliper Perno Tamir Takımı"],
  ["KALIPER KILAVUZ PIM TAKIMI", "Kaliper Kılavuz Pim Takımı"],
  ["KALIPER MASURA BILYA YATAGI", "Kaliper Masura Bilya Yatağı"],
  ["KALIPER MASURA BILYA TAKIMI", "Kaliper Masura Bilya Takımı"],
]);

const CATEGORY_TITLE_BASES = {
  "fren-diski": "Fren Diski",
  "fren-diski-abs-li": "ABS'li Fren Diski",
  "fren-kampanasi": "Fren Kampanası",
  "fren-balatasi": "Fren Balatası",
  "fren-circiri": "Fren Cırcırı",
  "otomatik-fren-circiri": "Otomatik Fren Cırcırı",
  "mekanik-fren-circiri": "Mekanik Fren Cırcırı",
  bijon: "Bijon",
  "disk-bijonu-civatasi": "Disk Bijonu",
  "somun-civata": "Bijon Somunu",
  porya: "Porya",
  "fren-pabucu": "Fren Pabucu",
  "suspansiyon-korugu": "Süspansiyon Körüğü",
  "fren-korugu": "Fren Körüğü",
  lastik: "Körük Lastiği",
};

const TITLE_RULES = [
  { regex: /TRAVEGO|TOURISMO|TOURINO|INTOURO|O ?403|O ?404|O ?500|000327|307327/i, suffix: "Mercedes Travego Tourismo" },
  { regex: /\bFORTUNA\b|LION'?S|NEOPLAN/i, suffix: "MAN Fortuna Otobüs" },
  { regex: /\bAXOR\b|\bACTROS\b|942401|943401|970401|960401|381401|327401|305401|305423|346420|348420|000 ?420|301421|A0{3}421/i, suffix: "Mercedes Actros Axor 1840 3340 4140" },
  { regex: /815061|815080|815082|814550|814360|\bTGA\b|\bTGS\b|\bTGX\b/i, suffix: "MAN TGA TGS TGX 40.360 40.460" },
  { regex: /136869|1411980|1528655|1528712|1847739|2285275|2051551|20524942|1391617|3963997|1573081|1573082/i, suffix: "Scania G420 R420" },
  { regex: /7C46|85DB|13C33|FC46|A333K|\bCARGO\b/i, suffix: "Ford Cargo 1833 1846 2532 3232" },
  { regex: /9267086|6604261/i, suffix: "Kögel Krone" },
  { regex: /8551042|3092710/i, suffix: "Volvo FH FM FL" },
  { regex: /21227349|MBR9018|68323825|MBR5124|MBR9004|M069018|M200135|MBR9007|1176816|17870|MBR5143|1088133/i, suffix: "ROR Meritor" },
  { regex: /421174|421184|4211 ?74|4212 ?72|7168|7189|718305|7179|7192|42117459|42117447|42117463/i, suffix: "Iveco Eurocargo Stralis" },
  { regex: /942401|943401|970401|960401|381401|327401|305401|305423|346420|348420|000 ?420|301421|A0{3}421/i, suffix: "Mercedes Actros Axor Atego" },
  { regex: /815061|815080|815082|814550|814360/i, suffix: "MAN TGA TGS TGX" },
  { regex: /136869|1411980|1528655|1528712|2285275|2051551|20524942|1391617|3963997|1573081|1573082/i, suffix: "Scania Volvo" },
  { regex: /7C46|85DB|13C33|FC46|A333K/i, suffix: "Ford Cargo" },
  { regex: /10640|330730|330211|330210|130310|130311/i, suffix: "SAF Holland" },
  { regex: /03\.?27|0327|032963|329623|329633|310677|310977|3109(?:46|67|77)/i, suffix: "BPW ECOPlus" },
  { regex: /21020977|21020997|21022167|21023036|21018963|21209701|21209723|21211030|21021114|21021164|22222978|22224179/i, suffix: "ROR Meritor" },
  { regex: /99717|99720|99730|99731|1308038|1309190|1309191|1373007|1337020|1356736|620646|620648|620649/i, suffix: "DAF CF XF" },
  { regex: /501009|501026|501052|501059|500079|500183/i, suffix: "Renault Midlum Premium Magnum" },
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

function looksLikeGeneratedSuffix(tail) {
  if (!tail || /[:()]/.test(tail)) return false;
  if (/(^|\s)(?:SOL|SAĞ|SAG|ÖN|ON|ARKA)(?=\s|$)|\b(?:R-?L|DELİK|DELIK|KANAL|ÇIKIŞ|CIKIS|SAPLAMALI|LASTİK|LASTIK|MM|CM)\b|G[ÖO]BEKL[İI]|\b\d{2,4}\b/i.test(tail)) return false;
  return /\b(?:BPW|ECOPlus|SAF|Holland|Mercedes|Actros|Axor|Atego|Arocs|SK|NG|MAN|TGA|TGS|TGX|Renault|Midlum|Premium|Magnum|Kerax|Volvo|FH|FM|FL|ROR|Meritor|DAF|CF|XF|Iveco|Eurocargo|Eurotech|Stralis|Mitsubishi|Canter|Fuso|Isuzu|NPR|NQR|Ford|Cargo|Scania|Kögel|Krone|Knorr|WABCO|Haldex|otobüs|dingil|dorse|treyler|Yerel|uygulamaları|fren|kampanası|grubu)\b/i.test(tail);
}

function generatedBaseFromCurrentName(currentName, genericBases, suffix) {
  if (!suffix) return "";

  const exact = genericBases.find((baseName) => currentName === `${baseName} ${suffix}`);
  if (exact) return exact;

  return genericBases.find((baseName) => {
    if (!currentName.startsWith(`${baseName} `)) return false;
    const tail = currentName.slice(baseName.length).trim();
    return looksLikeGeneratedSuffix(tail);
  }) || "";
}

function stripGeneratedProductName(productName) {
  const currentName = String(productName || "").trim();
  const genericBases = [...new Set(GENERIC_PRODUCT_TITLES.values())];
  const base = genericBases.find((baseName) => {
    if (!currentName.startsWith(`${baseName} `)) return false;
    return looksLikeGeneratedSuffix(currentName.slice(baseName.length).trim());
  });
  return base || currentName;
}

function categoryTitleBase(product) {
  const currentName = stripGeneratedProductName(product.name);
  const normalized = normalize(currentName);
  if (product.cat === "fren-balatasi" && /\bDISK\b/.test(normalized)) return "Disk Balatası";
  if (product.cat === "porya" && /KAPAK|KAPAGI/.test(normalized)) return "Porya Kapağı";
  return CATEGORY_TITLE_BASES[product.cat] || "";
}

function normalizeTitleToken(value) {
  return normalize(value).replace(/[^A-Z0-9]+/g, "");
}

function formatDetail(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?<=\d)\s*MM\b/gi, " mm")
    .replace(/(?<=\d)\s*CM\b/gi, " cm")
    .replace(/G[ÖO]BEKL[İI]/gi, "Göbekli")
    .replace(/\bDAKROMATLI\b/gi, "Dakromatlı")
    .replace(/\bÖZEL\b/gi, "Özel")
    .replace(/\bARKA\b/gi, "Arka")
    .replace(/ÖN/gi, "Ön")
    .replace(/^ON$/gi, "Ön")
    .replace(/\bSAĞ\b/gi, "Sağ")
    .replace(/\bSAG\b/gi, "Sağ")
    .replace(/\bSOL\b/gi, "Sol")
    .replace(/\bMM\b/gi, "mm")
    .replace(/\bCM\b/gi, "cm")
    .replace(/\bDEL[İI]K\b/gi, "Delik")
    .replace(/\bKANAL\b/gi, "Kanal");
}

function extractProductDetails(product, base, suffix) {
  const raw = stripGeneratedProductName(product.name).replace(/[_/]+/g, " ");
  const group = groupId(product);
  const allowLooseNumbers = new Set(["disk", "kampana", "balata", "fren-pabuclari"]).has(group);
  const patterns = [
    /\b\d{2,4}\s*MM\b/gi,
    /\b\d{1,2}\s*CM\b/gi,
    /\b\d+\s*DEL[İI]K\b/gi,
    /\b\d+\s*KANAL\b/gi,
    /G[ÖO]BEKL[İI]/gi,
    /\bDPS'?L?[İI]?\b/gi,
    /\bDAKROMATLI\b/gi,
    /\bÖZEL\b/gi,
    /(?<![A-ZÇĞİÖŞÜ])(?:SAĞ|SAG|SOL|ÖN|ON|ARKA)(?![A-ZÇĞİÖŞÜ])/gi,
    /\bR-?L\b/gi,
    /\bY\.?M\.?\b/gi,
    /\bE\.?M\.?\b/gi,
    /\bEUR\b/gi,
    /\b\d{4}(?:[-\s]\d{4}){1,3}\b/g,
  ];
  if (allowLooseNumbers) patterns.push(/\b\d{3,4}\b/g);

  const forbidden = normalizeTitleToken(`${base} ${suffix}`);
  const details = [];
  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      const value = formatDetail(match[0]);
      const key = normalizeTitleToken(value);
      if (!key || forbidden.includes(key)) continue;
      if (details.some((item) => {
        const existingKey = normalizeTitleToken(item);
        return existingKey === key || existingKey.includes(key) || key.includes(existingKey);
      })) continue;
      details.push(value);
    }
  }
  return details.slice(0, 4).join(" ");
}

function cleanTitlePart(value) {
  return String(value || "")
    .replace(/\b(?:dorse dingili|dorse|treyler|dingil grubu|dingili|dingil|disk fren sistemi|kaliper sistemi|ağır vasıta|araç grubu|serisi|uygulamaları)\b/gi, "")
    .replace(/Mercedes-Benz/g, "Mercedes")
    .replace(/Renault Trucks/g, "Renault")
    .replace(/Meritor\/ROR/g, "Meritor ROR")
    .replace(/\b(?:porya|bijon|fren|kampanası|grubu|sistemi|hattı)\b/gi, "")
    .replace(/[()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TITLE_BRAND_GROUPS = [
  { label: "Mercedes", regex: /^Mercedes\b/i },
  { label: "Renault", regex: /^Renault\b/i },
  { label: "Iveco", regex: /^Iveco\b/i },
  { label: "MAN", regex: /^MAN\b/i },
  { label: "Scania", regex: /^Scania\b/i },
  { label: "Volvo", regex: /^Volvo\b/i },
  { label: "Ford Cargo", regex: /^Ford Cargo\b/i },
  { label: "DAF", regex: /^DAF\b/i },
  { label: "BMC", regex: /^BMC\b/i },
  { label: "Mitsubishi", regex: /^Mitsubishi\b/i },
  { label: "Isuzu", regex: /^Isuzu\b/i },
  { label: "Otokar", regex: /^Otokar\b/i },
  { label: "BPW", regex: /^BPW\b/i },
  { label: "SAF", regex: /^SAF\b/i },
  { label: "Knorr", regex: /^Knorr/i },
  { label: "WABCO", regex: /^WABCO\b/i },
  { label: "Meritor", regex: /^Meritor\b/i },
  { label: "Haldex", regex: /^Haldex\b/i },
];

function compactBrandGroup(label, values) {
  const details = uniq(
    values
      .map((value) => value.replace(new RegExp(`^${label}\\s*`, "i"), ""))
      .flatMap((value) => value.split(/\s+/))
      .map((value) => value.replace(/^[-/]+|[-/]+$/g, ""))
      .filter((value) => value && !/^(ve|and|otobüs|kamyon)$/i.test(value))
  );
  return `${label} ${details.slice(0, 4).join(" ")}`.trim();
}

function compactTitleSuffix(parts) {
  const cleaned = uniq(parts.filter((part) => !GENERIC_LABELS.has(part)).map(cleanTitlePart)).filter((part) => {
    if (!part || GENERIC_LABELS.has(part)) return false;
    return !/^(Kamyon|T[ıi]r|Çekici|Otobüs|Dorse|Treyler|Yerel|grubu|sistemi)$/i.test(part);
  });
  if (!cleaned.length) return "";

  const hasPart = (pattern) => parts.some((part) => pattern.test(part));
  if (hasPart(/Travego|Tourismo|Tourino|Intouro|O403|O404|O500|Setra/i)) {
    return "Mercedes Travego Tourismo";
  }
  if (hasPart(/Fortuna|Lion'?s|Neoplan/i)) {
    return "MAN Fortuna Otobüs";
  }
  const hasActros = hasPart(/Actros/i);
  const hasAxor = hasPart(/Axor/i);
  if (hasActros && hasAxor) {
    return "Mercedes Actros Axor 1840 3340 4140";
  }
  if (hasActros) {
    return "Mercedes Actros 1840 3340 4140";
  }
  if (hasAxor) {
    return "Mercedes Axor 1840 3340 4140";
  }
  if (hasPart(/MAN TGA|MAN TGS|MAN TGX|40\.360|40\.460/i)) {
    return "MAN TGA TGS TGX 40.360 40.460";
  }
  if (hasPart(/Scania/i)) {
    return "Scania G420 R420";
  }

  const trailerSignals = parts.filter((part) => /dorse|treyler|trailer|fruehauf|smb|york|valx|yte|öztreyler|oztreyler/i.test(part));
  const trailerBrands = [
    trailerSignals.some((part) => /K[öo]gel/i.test(part)) ? "Kögel" : "",
    trailerSignals.some((part) => /Krone/i.test(part)) ? "Krone" : "",
    trailerSignals.some((part) => /Fruehauf|SMB/i.test(part)) ? "Fruehauf SMB" : "",
    trailerSignals.some((part) => /York|Valx|YTE|Öztreyler|Otreyler|Oztreyler/i.test(part)) ? "York Valx" : "",
  ].filter(Boolean);
  if (trailerBrands.length) {
    return trailerBrands.slice(0, 2).join(" ");
  }
  if (trailerSignals.some((part) => /yerel dorse dingil|dorse dingil grubu|treyler fren kampanası/i.test(part))) {
    return "Dorse Treyler";
  }

  const brandMatches = TITLE_BRAND_GROUPS.map((group) => ({
    label: group.label,
    values: cleaned.filter((part) => group.regex.test(part)),
  })).filter((group) => group.values.length);

  if (cleaned.some((part) => /Knorr.*WABCO.*Meritor|WABCO.*Knorr|Meritor.*DUCO|Meritor.*ELSA/i.test(part))) {
    return "Knorr WABCO Meritor";
  }

  if (brandMatches.length === 1) {
    return compactBrandGroup(brandMatches[0].label, brandMatches[0].values);
  }

  if (brandMatches.length > 1) {
    return brandMatches.slice(0, 3).map((group) => compactBrandGroup(group.label, group.values).replace(/\s+$/g, "")).join(" ");
  }

  return cleaned.slice(0, 3).join(" ");
}

function makeProductName(product, compat) {
  const currentName = String(product.name || "").trim();
  const text = `${currentName} ${product.sku || ""} ${product.oem || ""}`;
  const titleRule = TITLE_RULES.find((rule) => rule.regex.test(text));
  const suffix = titleRule?.suffix || compactTitleSuffix(compat);
  const genericBases = [...new Set(GENERIC_PRODUCT_TITLES.values())];
  const generatedGeneric = currentName.match(new RegExp(`^(${genericBases.map((base) => base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}) (?:Kamyon|T[ıi]r çekici|Otobüs|Dorse|Treyler)$`, "i"));
  if (!suffix && generatedGeneric) return generatedGeneric[1];

  const generatedBase = generatedBaseFromCurrentName(currentName, genericBases, suffix);
  const categoryBase = PRIORITY_GROUPS.has(groupId(product)) ? categoryTitleBase(product) : "";
  const base = titleCaseBase(currentName) || generatedBase || categoryBase;
  if (!base) return currentName;
  const detail = extractProductDetails(product, base, suffix);
  if (!suffix) return `${base} ${detail}`.replace(/\s+/g, " ").trim();

  const nextName = `${base} ${suffix} ${detail}`.replace(/\s+/g, " ").trim();
  return nextName.length > 90 ? nextName.slice(0, 90).trim() : nextName;
}

function groupId(product) {
  return catById[product.cat]?.parent || product.cat || "";
}

function categoryLabel(product) {
  return CATEGORY_LABELS[product.cat] || (catById[product.cat]?.name || "ağır vasıta fren parçası");
}

function detectCompatibility(product) {
  const text = `${stripGeneratedProductName(product.name) || ""} ${product.sku || ""} ${product.oem || ""}`;
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

  compat.push(...(product.compat || []));

  if (compat.length === 0) {
    compat.push(...(GENERIC_BY_GROUP[groupId(product)] || ["Ağır vasıta"]));
  }

  return { compat: uniq(compat).slice(0, 16), notes: uniq(notes) };
}

function makeDescription(product, compat, notes) {
  const group = groupId(product);
  const label = categoryLabel(product);
  const oem = cleanOem(product.oem);
  const baseName = String(product.name || "").trim();
  const priority = PRIORITY_GROUPS.has(group);
  const modelText = compat.slice(0, priority ? 12 : 8).join(", ");

  const intro = priority
    ? `${baseName} ${label} ürünüdür. OEM, ürün adı ve kategori referansına göre özellikle ${modelText} araç gruplarında kullanılan ağır vasıta fren parçası olarak listelenmiştir.`
    : `${baseName} ${label} ürünüdür. ${modelText} araç grupları ve ağır vasıta fren sistemleri için uyumluluk kontrolü yapılabilir.`;

  const oemLine = oem ? `OEM / muadil referans: ${oem}.` : "OEM / muadil referans için ürün kodu ve eski parça numarasıyla teyit önerilir.";
  const noteLine = notes.length ? `${notes.join(" ")}` : "";
  const safetyLine = "Uyumluluk model, aks tipi, ölçü, üretim yılı ve şaseye göre değişebilir; kesin sipariş öncesi şase numarası, eski parça fotoğrafı veya OEM numarasıyla Frenciniz'den teyit alın.";

  return [intro, oemLine, noteLine, safetyLine].filter(Boolean).join("\n");
}

export function enrichProducts(products, categories, options = {}) {
  catById = Object.fromEntries((categories || []).map((category) => [category.id, category]));

  const summary = {
    total: products.length,
    changed: 0,
    withDescription: 0,
    withCompatibility: 0,
    specificCompatibility: 0,
    byGroup: {},
    referenceSources: REFERENCE_SOURCES,
    generatedAt: options.generatedAt || new Date().toISOString(),
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

  return { products, categories, summary };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
  const { summary } = enrichProducts(products, categories);

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products));
  if (process.env.COMPAT_SKIP_REPORT !== "1") {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  }

  console.log(JSON.stringify(summary, null, 2));
}
