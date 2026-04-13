#!/usr/bin/env python3
"""
Ekersan B2B -> Frenciniz otomatik ürün senkronizasyonu (v2)
- Görselleri included image map ile çıkarır
- Kategori: önce field10, yoksa ürün adından heuristik
- Brand: brand_id mapping (bilinmeyen -> "Ekersan")
- Rate limit dostu (sleep + retry)
"""

import json
import re
import subprocess
import os
import sys
import time
import unicodedata
from datetime import datetime
from urllib.request import Request, build_opener, HTTPCookieProcessor
from urllib.error import HTTPError
from http.cookiejar import CookieJar

EKERSAN_API = "https://bayi.ekersan.com/api/tr/v1"
EKERSAN_USER = "DUMANLAR"
EKERSAN_PASS = "320043"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_PATH = os.path.join(BASE_DIR, "public", "data", "products.json")
CATEGORIES_PATH = os.path.join(BASE_DIR, "public", "data", "categories.json")
RAW_CACHE_PATH = os.path.join(BASE_DIR, "raw_cache.json")

# Brand id -> name. brand_id=1 baskın (Ekersan'ın kendi ürünleri).
BRAND_MAP = {
    1: "Ekersan",
}

# Kategori heuristic — name + path birlikte taranır (UPPER case için).
# (regex, kategori_adı). Daha spesifik önce.
# i regex flag kullanılıyor — büyük/küçük harf duyarsız.
CATEGORY_PATTERNS = [
    # Disk Bijonu özel
    (r"D[İI]SK\s*B[İI]JON|B[İI]JON\s*D[İI]SK|D[İI]SK\s*C[İI]VATA", "Disk Bijonu/Civatası"),
    # Fren Diski
    (r"FREN\s*D[İI]SK[İI]\s*ABS", "Fren Diski ABS'li"),
    (r"FREN\s*D[İI]SK[İI]|\bFREN-D[İI]SK[İI]|D[İI]SK[İI]?\s*ISUZU|D[İI]SK[İI]?\s*KRONE|GOBEKL[İI]\s*D[İI]SK", "Fren Diski"),
    (r"\bD[İI]SK\b|\bDISK\b", "Fren Diski"),
    # Kampana
    (r"FREN\s*KAMPANAS|^KAMPANA|\bKAMPANA\b", "Fren Kampanası"),
    # Balata
    (r"FREN\s*BALATA|^BALATA|\bBALATA\b", "Fren Balatası"),
    (r"D[İI]SK\s*BALATA", "Disk Balatası"),
    # Cırcır
    (r"OTOMAT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMOT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMAT[İI]K-FREN-C[İI]RC[İI]R", "Otomatik Fren Cırcırı"),
    (r"MEKAN[İI]K\s*FREN\s*C[İI]RC[İI]R|MEKAN[İI]K-FREN-C[İI]RC[İI]R", "Mekanik Fren Cırcırı"),
    (r"FREN\s*C[İI]RC[İI]R|\bCIRCIR\b|FREN-C[İI]RC[İI]R|AKILLI\s*C[İI]RC[İI]R|\bC[İI]RC[İI]R\b", "Fren Cırcırı"),
    # Körük (fren / dingil / süspansiyon ayır)
    (r"D[İI]NG[İI]L\s*KALDIRMA\s*KÖR[ÜU]K|HAVA\s*YASTI[GĞ]|SÜSPANS[İI]YON\s*KÖR[ÜU]K", "Süspansiyon Körüğü"),
    (r"FREN\s*KÖR[ÜU]K|[İI]MD.*FREN\s*KÖR|SERV[İI]S\s*FREN\s*KÖR", "Fren Körüğü"),
    (r"DORSE\s*KÖR[ÜU]K|^KÖR[ÜU]K|\bKÖR[ÜU]K\b|KÖRUGU|KORUGU|KOMPLE\s*KÖR|P[İI]STONSUZ\s*KÖR|KATLI\s*KÖR", "Fren Körüğü"),
    # Pabuç
    (r"FREN\s*PABUC|\bPABUC", "Fren Pabucu"),
    # Ayna
    (r"FREN\s*AYNAS|\bAYNA\b", "Fren Aynası"),
    # Silindir
    (r"FREN\s*S[İI]L[İI]ND[İI]R|FREN-S[İI]L[İI]ND[İI]R", "Fren Silindiri"),
    # Kaliper alt parçaları
    (r"KAL[İI]PER\s*PERNO|PERNO\s*TAM[İI]R|PERNO\s*TM\s*TK", "Kaliper Perno Tamir Takımı"),
    (r"KAL[İI]PER\s*KAPAK|KAL[İI]PER.*CONTA|SENS[ÖO]RLÜ\s*KAPAK|SENS[ÖO]RSÜZ\s*KAPAK", "Kaliper Kapak/Conta"),
    (r"KAL[İI]PER.*MEKAN[İI]ZMA|KAL[İI]PER.*AYAR|AYAR\s*MEKAN[İI]ZMA|AYAR\s*D[İI]ŞL[İI]|AYAR\s*TAŞIYIC", "Kaliper Ayar Mekanizması"),
    (r"KAL[İI]PER.*TOZ\s*LAST[İI]|TOZ\s*LAST[İI]G[İI]", "Kaliper Toz Lastiği"),
    (r"KAL[İI]PER.*DURBUN|DÜRBÜN\s*TAKIM", "Kaliper Dürbün Takımı"),
    (r"\bKAL[İI]PER", "Kaliper"),
    # Kaliper modelleri (Knorr/Wabco)
    (r"\bELSA\b.*\d|\bELSA[\d-]+|ELSA-?2|ELSA195|ELSA225", "Kaliper Tamir Takımı (Elsa)"),
    (r"\bSB\d|\bSB-\d|\bSB[5-7]|\bSN[6-7]|\bSK[6-7]|\bNA[6-7]|\bST[6-7]|\bSL[5-7]|\bSM[5-7]", "Kaliper Tamir Takımı (Wabco)"),
    (r"MAXX\s*22|MAXX22", "Kaliper Tamir Takımı (Maxx22)"),
    (r"PAN[\s-]?19|PAN[\s-]?22|PAN-19", "Kaliper Tamir Takımı (PAN)"),
    (r"MODULX|MODUL\s*X", "Kaliper Tamir Takımı (Modulx)"),
    (r"FRENCO+\b|FRENCOO", "Kaliper Tamir Takımı (Frenco)"),
    (r"\bDUCO\b", "Kaliper Tamir Takımı (Duco)"),
    (r"DX\s*195|DX195|D3\b", "Kaliper Tamir Takımı"),
    (r"\bB\.V\b|^B\.V|MARK\s*[IV]+", "Kaliper Tamir Takımı"),
    # Bijon / Disk Bijonu
    (r"\bB[İI]JON\s*DPS\b", "Bijon DPS"),
    (r"\bB[İI]JON|D[İI]NG[İI]L\s*SOMUN", "Bijon"),
    # Porya
    (r"\bPORYA|PORYA\s*KAPAK|PORYA\s*FLANŞ|D[İI]SKL[İI]\s*PORYA|EUROCARGO.*PORYA", "Porya"),
    (r"\bD[İI]NG[İI]L\b", "Dingil"),
    # Ayar Kolu
    (r"AYAR\s*KOLU|EL\s*FREN\s*KOLU", "Ayar Kolu / El Fren"),
    # Sensör/Kablo/ABS
    (r"ABS\s*SENS[ÖO]R|ABS\s*MOD|ABS\s*UZATMA|ABS\s*KABLO|\bABS\b.*D[İI]ŞL[İI]", "ABS Sensörü/Modülü/Kablo"),
    (r"EBS\s*MOD|\bEBS\b", "EBS Modülatör"),
    (r"\bSENS[ÖO]R", "Sensör"),
    # Hava Kurutucu / Tahliye
    (r"HAVA\s*KURUTUC|KURUTUCU\s*HAVA|\bKURUTUCU|HAVA\s*[İI]ŞLEME|EAC|HAVA\s*TAHL", "Hava Kurutucu"),
    # Hava Tüpü / Tank
    (r"HAVA\s*T[ÜU]P|HAVA\s*TANK|\d+\s*LT\s*HAVA", "Hava Tüpü"),
    # Kompresör
    (r"KOMPRES[ÖO]R\s*S[İI]L[İI]ND[İI]R", "Kompresör Silindiri"),
    (r"KOMPRES[ÖO]R\s*P[İI]STON|KOMPRES[ÖO]R.*SEGMAN", "Kompresör Piston/Segman"),
    (r"KOMPRES[ÖO]R\s*KAPAK", "Kompresör Kapak"),
    (r"KOMPRES[ÖO]R\s*TAM[İI]R", "Kompresör Tamir Takımı"),
    (r"\bKOMPRES[ÖO]R", "Kompresör"),
    # Sibop
    (r"\bS[İI]BOP", "Sibop"),
    # Filtre / Kartuş
    (r"KARTUŞ\s*F[İI]LTRE|\bF[İI]LTRE\b", "Filtre / Kartuş"),
    # Valf / Ventil
    (r"R[ÖO]LE\s*VENT[İI]L|R[ÖO]LE\s*VALF", "Röle Ventili"),
    (r"DAGITICI\s*VENT[İI]L|DA[ĞG]ITICI\s*VENT[İI]L|D[ÖO]RTL[ÜU]\s*DA[GĞ]", "Dağıtıcı Ventil"),
    (r"BASIN[CÇ]\s*AYAR\s*VAL|S[ÜU]SPANS[İI]YON\s*VENT|YÜKSEKL[İI]K\s*AYAR\s*VAL", "Süspansiyon/Basınç Ventili"),
    (r"ŞANZIMAN\s*VENT|ŞANZIMAN\s*VAL", "Şanzıman Ventili"),
    (r"\bVENT[İI]L|\bVALF|VANAS|\bVANA\b", "Valf / Ventil"),
    # Hortum / Adaptör / Bağlantı
    (r"HORTUM\s*ADAPT|ADAPT[ÖO]R[ÜU]?\s*HORTUM|Ç[İI]FT\s*Y[ÖO]NL[ÜU]\s*HORTUM", "Hortum Adaptörü"),
    (r"\bHORTUM", "Hortum"),
    (r"\bN[İI]PEL\b", "Nipel"),
    (r"REDÜKS[İI]YON|YÜKSELT[İI]C[İI]|D[ÜU]Ş[ÜU]R[ÜU]C[ÜU]|ŞAS[İI]\s*GE[ÇC][İI]Ş|K[ÖO]R\s*TAPA|TEST\s*APARAT|T[ÜU]P\s*TAHL[İI]YE|ARA\s*D[İI]RSEK|\bD[İI]RSEK\b", "Bağlantı Elemanları"),
    # Süspansiyon ekleri
    (r"DORSE\s*Y[ÜU]KSEKL[İI]K|RAMPA\s*KOLU", "Süspansiyon"),
    # Fren Ayar Parçaları (kama, piston, somun, pim, pinyon, mandal, kilit, çapraz, vida, civata)
    (r"FREN\s*AYAR\s*(KAMA|P[İI]STON|SOMUN|P[İI]M|P[İI]NYON|MANDAL|K[İI]L[İI]T|ÇAPRAZ|V[İI]DA|C[İI]VATA|KAPAK|TOZ|C\s*YAY|MEKAN|TAM)", "Fren Ayar Parçaları"),
    (r"AYAR\s*KAMA|AYAR\s*P[İI]NYON|AYAR\s*SOMUN|AYAR\s*P[İI]STON|AYAR\s*K[İI]L[İI]T|AYAR\s*MANDAL", "Fren Ayar Parçaları"),
    # Fren yayı / dorse yayı / kol yayı / askı yayı
    (r"FREN\s*YAY|DORSE\s*YAY|KOL\s*YAY|ASKI\s*YAY|^YAY|\bYAY[IİL]?\b", "Yay"),
    (r"\bMAKAS\b", "Makas"),
    # Somun (jant, döner pullu, ispit)
    (r"D[ÖO]NER\s*PULLU\s*SOMUN|JANT\s*SOMUN|[İI]SP[İI]T\s*SOMUN|\bSOMUN\b", "Somun / Cıvata"),
    # Perno
    (r"\bPERNO\b|PERNO\s*KL[İI]PS|PERNO\s*P[İI]ML|PERNO\s*TAPAS|PERNO\s*STANDART", "Perno"),
    # Perçin
    (r"PER[ÇC][İI]N", "Perçin"),
    # Lastik (kaplin, kaldırma)
    (r"KAPL[İI]N\s*LAST[İI][GĞ]|KALDIRMA\s*LAST[İI][GĞ]|\bLAST[İI]K\b", "Lastik"),
    # Aks/Pompa/Rotül/Amortisör
    (r"\bAKS\b", "Aks"),
    (r"P[ÖO]MPALAR|\bPOMPA", "Pompa"),
    (r"R[ÖO]T[ÜU]L|\bR[ÖO]T\b", "Rotül"),
    (r"AMORT[İI]S[ÖO]R", "Amortisör"),
    # Burç/Keçe/Muylu
    (r"\bBURÇ|\bMUYLU", "Burç / Muylu"),
    (r"\bKEÇE", "Keçe"),
    # Volan / Debriyaj
    (r"\bVOLAN|DEBR[İI]YAJ", "Volan / Debriyaj"),
    # Rulman
    (r"RULMAN", "Rulman"),
    # Kızak
    (r"TAŞIYICI\s*KIZAK|\bKIZAK\b|^KIZAK", "Kızak"),
    # Cam Set (Z-CAM, S-CAM)
    (r"Z-?CAM\s*SET|S-?CAM\s*SET", "Cam Set"),
    # Çamurluk
    (r"ÇAMURLUK|CAMURLUK", "Çamurluk"),
    # Kompresör'ün altında kategoriler aşağıda var
    # Genel makara
    (r"\bMAKARA", "Makara"),
    # Stop / lamba / elektrik
    (r"24V\s*ELEKTR[İI]K|ELEKTR[İI]K\s*KABLO", "Elektrik Kablosu"),
    # Tamir takımı (genel) - en sona
    (r"TAM[İI]R\s*TAKIM", "Tamir Takımı"),
    # Set komple (kaliper set fallback)
    (r"\bSET\s*KOMPLE\b|^SET\s|SET\s*SOL|SET\s*SAĞ", "Kaliper Tamir Seti"),
]

# Alt kategori → ana kategori grup eşlemesi
# Her alt kategori adı (detect_category çıktısı) hangi gruba ait
CATEGORY_HIERARCHY = {
    # Fren Diskleri & Kampanaları
    "Fren Diski":               {"group_id": "fren-diskleri-kampanalari", "group_name": "Fren Diskleri & Kampanaları"},
    "Fren Diski ABS'li":        {"group_id": "fren-diskleri-kampanalari", "group_name": "Fren Diskleri & Kampanaları"},
    "Fren Kampanası":           {"group_id": "fren-diskleri-kampanalari", "group_name": "Fren Diskleri & Kampanaları"},
    "Disk Bijonu/Civatası":     {"group_id": "fren-diskleri-kampanalari", "group_name": "Fren Diskleri & Kampanaları"},
    # Fren Balatası & Pabucu
    "Fren Balatası":            {"group_id": "fren-balata-pabucu", "group_name": "Fren Balatası & Pabucu"},
    "Fren Pabucu":              {"group_id": "fren-balata-pabucu", "group_name": "Fren Balatası & Pabucu"},
    "Perçin":                   {"group_id": "fren-balata-pabucu", "group_name": "Fren Balatası & Pabucu"},
    # Kaliper
    "Kaliper":                       {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Ayar Mekanizması":      {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Dürbün Takımı":         {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Kapak/Conta":           {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Perno Tamir Takımı":    {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Seti":            {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı":          {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Duco)":   {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Elsa)":   {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Frenco)": {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Maxx22)": {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Modulx)": {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (PAN)":    {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Tamir Takımı (Wabco)":  {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kaliper Toz Lastiği":           {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Kızak":                         {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    "Perno":                         {"group_id": "kaliper-grubu", "group_name": "Kaliper"},
    # Fren Cırcırı & Ayar
    "Fren Cırcırı":             {"group_id": "fren-circiri-grubu", "group_name": "Fren Cırcırı & Ayar"},
    "Mekanik Fren Cırcırı":     {"group_id": "fren-circiri-grubu", "group_name": "Fren Cırcırı & Ayar"},
    "Otomatik Fren Cırcırı":    {"group_id": "fren-circiri-grubu", "group_name": "Fren Cırcırı & Ayar"},
    "Fren Ayar Parçaları":      {"group_id": "fren-circiri-grubu", "group_name": "Fren Cırcırı & Ayar"},
    "Ayar Kolu / El Fren":      {"group_id": "fren-circiri-grubu", "group_name": "Fren Cırcırı & Ayar"},
    # Fren Körüğü & Hava Sistemi
    "Fren Körüğü":              {"group_id": "fren-korugu-hava", "group_name": "Fren Körüğü & Hava Sistemi"},
    "Hava Kurutucu":            {"group_id": "fren-korugu-hava", "group_name": "Fren Körüğü & Hava Sistemi"},
    "Hava Tüpü":                {"group_id": "fren-korugu-hava", "group_name": "Fren Körüğü & Hava Sistemi"},
    "Filtre / Kartuş":          {"group_id": "fren-korugu-hava", "group_name": "Fren Körüğü & Hava Sistemi"},
    # Valf & Ventil
    "Valf / Ventil":                 {"group_id": "valf-ventil-grubu", "group_name": "Valf & Ventil"},
    "Dağıtıcı Ventil":              {"group_id": "valf-ventil-grubu", "group_name": "Valf & Ventil"},
    "Röle Ventili":                  {"group_id": "valf-ventil-grubu", "group_name": "Valf & Ventil"},
    "Süspansiyon/Basınç Ventili":    {"group_id": "valf-ventil-grubu", "group_name": "Valf & Ventil"},
    "Şanzıman Ventili":              {"group_id": "valf-ventil-grubu", "group_name": "Valf & Ventil"},
    # ABS & EBS & Sensör
    "ABS Sensörü/Modülü/Kablo":     {"group_id": "abs-ebs-grubu", "group_name": "ABS & EBS & Sensör"},
    "EBS Modülatör":                 {"group_id": "abs-ebs-grubu", "group_name": "ABS & EBS & Sensör"},
    "Sensör":                        {"group_id": "abs-ebs-grubu", "group_name": "ABS & EBS & Sensör"},
    "Elektrik Kablosu":              {"group_id": "abs-ebs-grubu", "group_name": "ABS & EBS & Sensör"},
    # Kompresör
    "Kompresör Piston/Segman":       {"group_id": "kompresor-grubu", "group_name": "Kompresör"},
    "Kompresör Silindiri":           {"group_id": "kompresor-grubu", "group_name": "Kompresör"},
    "Kompresör Tamir Takımı":        {"group_id": "kompresor-grubu", "group_name": "Kompresör"},
    # Porya & Bijon
    "Porya":                    {"group_id": "porya-bijon-grubu", "group_name": "Porya & Bijon"},
    "Bijon":                    {"group_id": "porya-bijon-grubu", "group_name": "Porya & Bijon"},
    "Bijon DPS":                {"group_id": "porya-bijon-grubu", "group_name": "Porya & Bijon"},
    "Rulman":                   {"group_id": "porya-bijon-grubu", "group_name": "Porya & Bijon"},
    "Somun / Cıvata":           {"group_id": "porya-bijon-grubu", "group_name": "Porya & Bijon"},
    # Süspansiyon & Dingil
    "Süspansiyon Körüğü":       {"group_id": "suspansiyon-grubu", "group_name": "Süspansiyon & Dingil"},
    "Dingil":                   {"group_id": "suspansiyon-grubu", "group_name": "Süspansiyon & Dingil"},
    "Yay":                      {"group_id": "suspansiyon-grubu", "group_name": "Süspansiyon & Dingil"},
    "Burç / Muylu":             {"group_id": "suspansiyon-grubu", "group_name": "Süspansiyon & Dingil"},
}
# CATEGORY_HIERARCHY'de olmayanlar otomatik olarak "Diğer Parçalar" grubuna düşer.

def slug(name):
    if not name:
        return "diger"
    s = name
    # Türkçe → ascii
    repl = {'ı':'i','İ':'i','ş':'s','Ş':'s','ç':'c','Ç':'c',
            'ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o',
            'â':'a','Â':'a','î':'i','Î':'i','û':'u','Û':'u'}
    for k,v in repl.items(): s = s.replace(k,v)
    # Combining marks (NFD)
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "diger"

def detect_category(name, path):
    """name + path'i birlikte tara, ilk eşleşen pattern → kategori."""
    haystack = ((name or "") + " " + (path or "").replace("-", " ")).upper()
    for pat, cat in CATEGORY_PATTERNS:
        if re.search(pat, haystack, re.IGNORECASE):
            return cat
    return "Diğer"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def fetch_with_resume():
    """Tüm ürünleri çek, raw_cache.json'a checkpoint yaz, kaldığı yerden devam et."""
    all_products, all_included, start_page = [], [], 1
    if os.path.exists(RAW_CACHE_PATH):
        try:
            with open(RAW_CACHE_PATH, "r", encoding="utf-8") as f:
                d = json.load(f)
            all_products = d.get("products", [])
            all_included = d.get("included", [])
            start_page = d.get("next_page", 1)
            done = d.get("done", False)
            if done:
                log(f"Cache complete: {len(all_products)} ürün")
                return all_products, all_included
            log(f"Cache resume: {len(all_products)} ürün, sayfa {start_page}'den devam")
        except Exception as e:
            log(f"Cache okuma hatası: {e}")

    cj = CookieJar()
    opener = build_opener(HTTPCookieProcessor(cj))

    log("Ekersan'a giriş yapılıyor...")
    csrf = None
    for attempt in range(10):
        try:
            req = Request(
                f"{EKERSAN_API}/data/b2b_signin.json",
                data=json.dumps({"username": EKERSAN_USER, "password": EKERSAN_PASS}).encode(),
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST",
            )
            csrf = json.loads(opener.open(req).read())["csrf"]
            break
        except HTTPError as e:
            wait = 60 + attempt * 30
            log(f"Login {e.code}, {wait}s bekleniyor (try {attempt+1})")
            time.sleep(wait)
    if not csrf:
        log("Login başarısız"); sys.exit(1)
    log("Giriş başarılı")

    def save_cache(next_page, done=False):
        with open(RAW_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump({
                "products": all_products,
                "included": all_included,
                "next_page": next_page,
                "done": done,
            }, f, ensure_ascii=False)

    page = start_page
    while True:
        url = f"{EKERSAN_API}/data/b2b/products.json?page={page}"
        req = Request(url, headers={"Accept": "application/json", "X-CSRF-TOKEN": csrf})
        tries = 0
        data = None
        while True:
            try:
                data = json.loads(opener.open(req).read().decode("utf-8"))
                break
            except HTTPError as e:
                tries += 1
                if e.code == 429 and tries < 12:
                    wait = 30 * tries
                    log(f"  page {page} 429, {wait}s sleep (try {tries})")
                    time.sleep(wait)
                    continue
                log(f"FATAL page {page}: {e}")
                save_cache(page)
                sys.exit(1)
            except Exception as e:
                tries += 1
                if tries < 6:
                    log(f"  page {page} err: {e}, 30s sleep")
                    time.sleep(30)
                    continue
                save_cache(page)
                sys.exit(1)

        prods = data.get("products", {}).get("data", [])
        incl = data.get("products", {}).get("included", [])
        if not prods:
            break
        all_products.extend(prods)
        all_included.extend(incl)
        log(f"Sayfa {page}: toplam {len(all_products)} ürün")
        if page % 10 == 0:
            save_cache(page + 1)
        if len(prods) < 20:
            break
        page += 1
        time.sleep(2.5)

    save_cache(page + 1, done=True)
    log(f"Raw fetch tamam: {len(all_products)} ürün, {len(all_included)} included")
    return all_products, all_included


def main():
    log("Ekersan sync v2 başlatılıyor...")
    all_products, all_included = fetch_with_resume()

    # Maps
    units_map = {}
    image_url_map = {}  # image_id -> url
    for inc in all_included:
        t = inc.get("type")
        if t == "unit":
            units_map[str(inc["id"])] = inc.get("attributes", {})
        elif t == "image":
            image_url_map[str(inc["id"])] = inc.get("attributes", {}).get("url")

    # İşle
    final = []
    cats_set = {}  # slug -> name
    pid = 1

    for p in all_products:
        a = p.get("attributes", {})
        if not a.get("b2b_in_stock", False):
            continue

        # Fiyat
        unit_ids = [str(u["id"]) for u in p.get("relationships", {}).get("units", {}).get("data", [])]
        price = 0
        for uid in unit_ids:
            u = units_map.get(uid, {})
            if u.get("b2b_price"):
                price = u["b2b_price"]
                break
        if price <= 0:
            continue

        # Görseller
        img_ids = [str(i["id"]) for i in p.get("relationships", {}).get("images", {}).get("data", [])]
        images = [image_url_map[iid] for iid in img_ids if image_url_map.get(iid)]
        main_img = images[0] if images else (
            "https://placehold.co/600x600/1c1c1c/b0b0b0?text=" +
            (a.get("sku", "URUN") or "URUN").replace(" ", "+")
        )

        # Kategori (name + path birlikte)
        cat_name = detect_category(a.get("name", ""), a.get("path", ""))
        cat_id = slug(cat_name)
        cats_set[cat_id] = cat_name

        # Brand
        brand = BRAND_MAP.get(a.get("brand_id"), "Ekersan")

        final.append({
            "id": pid,
            "name": a.get("name", ""),
            "sku": a.get("sku", ""),
            "price": round(price, 2),
            "old": None,
            "vat_rate": a.get("vat_rate", 0),
            "stock": int(a.get("b2b_stock_qty", 0)),
            "oem": a.get("field1", ""),
            "cat": cat_id,
            "brand": brand,
            "rating": 4.5,
            "reviews": 0,
            "img": main_img,
            "images": images,  # YENİ: galeri için
            "desc": a.get("name", ""),
            "specs": {},
            "compat": [],
            "veh": ["kamyon", "tir"],
        })
        pid += 1

    # Hiyerarşik kategori listesi oluştur
    cats_list = [{"id": "all", "name": "Tüm Ürünler", "parent": None}]
    # Grup sırasını koru, her grubun alt kategorilerini topla
    group_order = []
    group_children = {}  # group_id -> [(cat_id, cat_name)]
    ungrouped = []  # CATEGORY_HIERARCHY'de olmayan kategoriler
    for cid in sorted(cats_set.keys(), key=lambda k: cats_set[k].lower()):
        cat_name = cats_set[cid]
        hier = CATEGORY_HIERARCHY.get(cat_name)
        if hier:
            gid = hier["group_id"]
            gname = hier["group_name"]
            if gid not in group_children:
                group_order.append((gid, gname))
                group_children[gid] = []
            group_children[gid].append({"id": cid, "name": cat_name, "parent": gid})
        else:
            ungrouped.append({"id": cid, "name": cat_name, "parent": "diger-parcalar"})
    # Grup başlıkları + alt kategoriler
    for gid, gname in group_order:
        cats_list.append({"id": gid, "name": gname, "parent": None, "isGroup": True})
        cats_list.extend(group_children[gid])
    # Diğer Parçalar grubu
    if ungrouped:
        cats_list.append({"id": "diger-parcalar", "name": "Diğer Parçalar", "parent": None, "isGroup": True})
        cats_list.extend(ungrouped)

    log(f"Stokta: {len(final)} ürün, {len(cats_list)-1} kategori")

    # Diff
    changed = False
    try:
        with open(PRODUCTS_PATH, "rb") as f:
            old = json.loads(f.read().decode("utf-8"))
        if len(old) != len(final):
            changed = True
            log(f"Ürün sayısı değişti: {len(old)} -> {len(final)}")
        else:
            old_map = {p["sku"]: p for p in old}
            for p in final:
                op = old_map.get(p["sku"])
                if (not op or op["price"] != p["price"] or op["stock"] != p["stock"]
                    or op.get("img") != p["img"] or op.get("cat") != p["cat"]):
                    changed = True
                    break
    except FileNotFoundError:
        changed = True
        log("İlk çalıştırma")

    if not changed:
        log("Değişiklik yok.")
        return

    os.makedirs(os.path.dirname(PRODUCTS_PATH), exist_ok=True)
    with open(PRODUCTS_PATH, "wb") as f:
        f.write(json.dumps(final, ensure_ascii=False).encode("utf-8"))
    with open(CATEGORIES_PATH, "wb") as f:
        f.write(json.dumps(cats_list, ensure_ascii=False).encode("utf-8"))
    log("JSON dosyaları güncellendi")

    # Push (DRY_RUN env ile atla)
    if os.environ.get("DRY_RUN"):
        log(f"DRY_RUN: push atlandı. {len(final)} ürün hazır.")
        return
    log("GitHub'a push ediliyor...")
    os.chdir(BASE_DIR)
    subprocess.run(["git", "add", "public/data/products.json", "public/data/categories.json"], check=True)
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    sub_count = len([c for c in cats_list if c.get("parent") and not c.get("isGroup")])
    grp_count = len([c for c in cats_list if c.get("isGroup")])
    msg = f"Otomatik ürün sync - {len(final)} ürün, {grp_count} ana kategori, {sub_count} alt kategori ({now})"
    subprocess.run(["git", "commit", "-m", msg], check=True)
    subprocess.run(["git", "push", "origin", "master"], check=True)
    log(f"Tamamlandı! {len(final)} ürün senkronize edildi.")

if __name__ == "__main__":
    main()
