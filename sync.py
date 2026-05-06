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

# Tüm B2B fiyatlarına uygulanacak satış çarpanı (kâr marjı).
# Örn: 1.20 → B2B alış fiyatının %20 üstüne sat. Sync her çalıştığında uygulanır.
PRICE_MULTIPLIER = 1.20
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
    # Disk Bijonu özel (peş peşe yazılan format: "DISK BIJON", "BIJON DISK", "DISK CIVATA")
    (r"D[İI]SK\s*B[İI]JON|B[İI]JON\s*D[İI]SK\b|D[İI]SK\s*C[İI]VATA", "Disk Bijonu/Civatası"),
    # "BİJON ..." ile başlayanlar DİSK kelimesi geçse bile bijon (örn: "BİJON RENAULT 440 ÖN DİSK")
    (r"^B[İI]JON\s", "Bijon"),
    # Körük (DISK fallback'inden ÖNCE — "DİSK TİPİ İMDAT FREN KÖRÜK" gibi isimler DISK'e düşmesin)
    # KÖRÜK / KÖRÜĞÜ / KORUGU varyasyonlarını + SÜSPANSİYON/SÜSPANSYON yazım hatalarını yakala
    (r"D[İI]NG[İI]L\s*KALDIRMA\s*K[ÖO]R|HAVA\s*YASTI[GĞ]|S[ÜU]SPANS[İIY]+ON\s*K[ÖO]R", "Süspansiyon Körüğü"),
    (r"FREN\s*KÖR[ÜU]K|FREN\s*KÖR[ÜU][GĞ]|[İI]MD.*FREN\s*KÖR|SERV[İI]S\s*FREN\s*KÖR|D[İI]SK\s*[İI]MDAT\s*FREN\s*KÖR|D[İI]SK\s*FREN\s*KÖR|D[İI]SK\s*T[İI]P[İI].*KÖR|D[İI]SK.*KÖR[ÜU][GĞ]|D[İI]SK\s*KÖR[ÜU]K", "Fren Körüğü"),
    (r"DORSE\s*KÖR[ÜU]K|^KÖR[ÜU]K|\bKÖR[ÜU]K\b|KÖRUGU|KORUGU|KOMPLE\s*KÖR|P[İI]STONSUZ\s*KÖR|KATLI\s*KÖR", "Fren Körüğü"),
    # SKU bazlı: 42xxxx.S/.C/.CP/.KP/.S## suffix'li ürünler (S=set/pistonsuz, C=ceker, CP=ceker plastik, KP=kalın plastik) — fren körüğü çeşitleri
    (r"\b42\d{4}\.(S|C|CP|KP|S\d+)\b", "Fren Körüğü"),
    # Fren Diski
    (r"FREN\s*D[İI]SK[İI]\s*ABS", "Fren Diski ABS'li"),
    (r"FREN\s*D[İI]SK[İI]|\bFREN-D[İI]SK[İI]|D[İI]SK[İI]?\s*ISUZU|D[İI]SK[İI]?\s*KRONE|GOBEKL[İI]\s*D[İI]SK", "Fren Diski"),
    (r"\bD[İI]SK\b|\bDISK\b", "Fren Diski"),
    # Kampana
    (r"FREN\s*KAMPANAS|^KAMPANA|\bKAMPANA\b", "Fren Kampanası"),
    # Kızak (BALATA pattern'inden önce — "TAŞIYICI KIZAK ... BALATA" gibi karma isimleri yakala)
    (r"TAŞIYICI\s*KIZA[KĞG]|\bKIZA[KĞG]|^KIZA[KĞG]", "Kızak"),
    # Balata
    (r"FREN\s*BALATA|^BALATA|\bBALATA\b", "Fren Balatası"),
    (r"D[İI]SK\s*BALATA", "Disk Balatası"),
    # Cırcır
    (r"OTOMAT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMOT[İI]K\s*FREN\s*C[İI]RC[İI]R|OTOMAT[İI]K-FREN-C[İI]RC[İI]R", "Otomatik Fren Cırcırı"),
    (r"MEKAN[İI]K\s*FREN\s*C[İI]RC[İI]R|MEKAN[İI]K-FREN-C[İI]RC[İI]R", "Mekanik Fren Cırcırı"),
    (r"FREN\s*C[İI]RC[İI]R|\bCIRCIR\b|FREN-C[İI]RC[İI]R|AKILLI\s*C[İI]RC[İI]R|\bC[İI]RC[İI]R\b", "Fren Cırcırı"),
    # Pabuç
    (r"FREN\s*PABUC|\bPABUC", "Fren Pabucu"),
    # Ayna
    (r"FREN\s*AYNAS|\bAYNA\b", "Fren Aynası"),
    # Silindir
    (r"FREN\s*S[İI]L[İI]ND[İI]R|FREN-S[İI]L[İI]ND[İI]R", "Fren Silindiri"),
    # Kaliper alt parçaları (KL[İI]PER yazım hatasını da yakala)
    # Spesifik alt kategoriler önce — sonunda fallback "Kaliper"
    (r"K[AL]?L[İI]PER\s*PERNO|PERNO\s*TAM[İI]R|PERNO\s*TM\s*TK", "Kaliper Perno Tamir Takımı"),
    (r"K[AL]?L[İI]PER.*KAPA[KĞG]|K[AL]?L[İI]PER.*CONTA|SENS[ÖO]RLÜ\s*KAPA[KĞG]|SENS[ÖO]RSÜZ\s*KAPA[KĞG]", "Kaliper Kapak/Conta"),
    (r"K[AL]?L[İI]PER.*MEKAN[İI]ZMA|K[AL]?L[İI]PER.*AYAR|AYAR\s*MEKAN[İI]ZMA|AYAR\s*D[İI]ŞL[İI]|AYAR\s*TAŞIYIC", "Kaliper Ayar Mekanizması"),
    (r"K[AL]?L[İI]PER.*TOZ\s*LAST[İI]|TOZ\s*LAST[İI][GĞ][İI]", "Kaliper Toz Lastiği"),
    (r"K[AL]?L[İI]PER.*DURBUN|DÜRBÜN\s*TAKIM", "Kaliper Dürbün Takımı"),
    # Kaliper Tamir Takımı: TM.TK., MASURA, BİLYA YATAĞI, P[İI]ST(ON)? KAPAĞI
    (r"K[AL]?L[İI]PER.*TM\.?\s*TK|K[AL]?L[İI]PER.*MASURA|MASURA\s*B[İI]LYA|B[İI]LYA\s*YATA[ĞG]|K[AL]?L[İI]PER.*P[İI]STON\s*KAPA|RULMAN\s*YATA[ĞG]|MEK\.?\s*KOMPLE\s*SET", "Kaliper Tamir Takımı"),
    # Kaliper Taşıyıcı (kapak pattern'inden sonra geliyor ama spesifik bir alt kategori değil — Kaliper Ayar Mek altına alalım)
    (r"K[AL]?L[İI]PER\s*TAŞIYIC|TAŞIYIC.*K[AL]?L[İI]PER|CAL[İI]PER\s*TAŞIYIC", "Kaliper Ayar Mekanizması"),
    # Genel "Kaliper" fallback - en son
    (r"\bK[AL]?L[İI]PER|\bCAL[İI]PER", "Kaliper"),
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
    # Fren Ayar Parçaları (KAPAK + KAPAĞI varyasyonu)
    (r"FREN\s*AYAR\s*(KAMA|P[İI]STON|SOMUN|P[İI]M|P[İI]NYON|MANDAL|K[İI]L[İI]T|ÇAPRAZ|V[İI]DA|C[İI]VATA|KAPA[KĞG]|TOZ|C\s*YAY|MEKAN|TAM)", "Fren Ayar Parçaları"),
    (r"AYAR\s*KAMA|AYAR\s*P[İI]NYON|AYAR\s*SOMUN|AYAR\s*P[İI]STON|AYAR\s*K[İI]L[İI]T|AYAR\s*MANDAL|AYAR\s*KAPA[KĞG]", "Fren Ayar Parçaları"),
    (r"\d+\s*AYAR\s*C[İI]VATA|\bPRO\s*\d+\s*KAMA\b|KROM\s*D[İI]ŞL[İI]|PARK\s*BUTONU", "Fren Ayar Parçaları"),
    # Kaliper Tamir Takımı: ESKOL, ARCS SET, BPW.*TM\.?\s*TK
    (r"\bESKOL\b|\bARCS\s*SET|BPW.*TM\.?\s*TK|AXOR\s*SET\s*Y", "Kaliper Tamir Takımı"),
    # Porya / Bijon ek: JANT FLANŞ
    (r"JANT\s*FLAN[ŞS]", "Porya"),
    # Kompresör segman
    (r"REKOR\s*SEGMAN|PLS\s*REKOR", "Kompresör Piston/Segman"),
    # Keçe ek pattern: NBR + ARKA DIŞ formatı (boyutlu)
    (r"NBR\s*ARKA\s*DI[ŞS]|NBR\s*ÖN\s*DI[ŞS]|\d+\*\d+\*+\d+/\d+\s*NBR", "Keçe"),
    # Fren yayı / dorse yayı / kol yayı / askı yayı
    (r"FREN\s*YAY|DORSE\s*YAY|KOL\s*YAY|ASKI\s*YAY|^YAY|\bYAY[IİL]?\b", "Yay"),
    (r"\bMAKAS\b", "Makas"),
    # Somun (jant, döner pullu, ispit) — SOMUN, SOMUNU, SOMUNLU varyasyonları
    (r"D[ÖO]NER\s*PULLU\s*SOMUN|JANT\s*SOMUN|[İI]SP[İI]T\s*SOMUN|\bSOMUN", "Somun / Cıvata"),
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
    # Kızak yukarıda balata'dan önce yakalanıyor
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

# Alt kategori → ana kategori grup eşlemesi (Ekersan B2B yapısına uygun)
CATEGORY_HIERARCHY = {
    # DİSK
    "Fren Diski":               {"group_id": "disk", "group_name": "DİSK"},
    "Fren Diski ABS'li":        {"group_id": "disk", "group_name": "DİSK"},
    # KAMPANA
    "Fren Kampanası":           {"group_id": "kampana", "group_name": "KAMPANA"},
    # BALATA
    "Fren Balatası":            {"group_id": "balata", "group_name": "BALATA"},
    # FREN PABUÇLARI
    "Fren Pabucu":              {"group_id": "fren-pabuclari", "group_name": "FREN PABUÇLARI"},
    "Perçin":                   {"group_id": "fren-pabuclari", "group_name": "FREN PABUÇLARI"},
    # CIRCIR
    "Fren Cırcırı":             {"group_id": "circir", "group_name": "CIRCIR"},
    "Mekanik Fren Cırcırı":     {"group_id": "circir", "group_name": "CIRCIR"},
    "Otomatik Fren Cırcırı":    {"group_id": "circir", "group_name": "CIRCIR"},
    # FREN AYAR PARÇALARI
    "Fren Ayar Parçaları":      {"group_id": "fren-ayar", "group_name": "FREN AYAR PARÇALARI"},
    "Ayar Kolu / El Fren":      {"group_id": "fren-ayar", "group_name": "FREN AYAR PARÇALARI"},
    "Cam Set":                  {"group_id": "fren-ayar", "group_name": "FREN AYAR PARÇALARI"},
    # KALİPER ÜRÜNLERİ
    "Kaliper":                       {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Ayar Mekanizması":      {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Dürbün Takımı":         {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Kapak/Conta":           {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Perno Tamir Takımı":    {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Seti":            {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı":          {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Duco)":   {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Elsa)":   {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Frenco)": {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Maxx22)": {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Modulx)": {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (PAN)":    {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Tamir Takımı (Wabco)":  {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kaliper Toz Lastiği":           {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Kızak":                         {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    "Perno":                         {"group_id": "kaliper-urunleri", "group_name": "KALİPER ÜRÜNLERİ"},
    # FREN KÖRÜKLERİ
    "Fren Körüğü":              {"group_id": "fren-korukleri", "group_name": "FREN KÖRÜKLERİ"},
    "Lastik":                   {"group_id": "fren-korukleri", "group_name": "FREN KÖRÜKLERİ"},
    # BİJON
    "Bijon":                    {"group_id": "bijon-grup", "group_name": "BİJON"},
    "Bijon DPS":                {"group_id": "bijon-grup", "group_name": "BİJON"},
    "Disk Bijonu/Civatası":     {"group_id": "bijon-grup", "group_name": "BİJON"},
    "Somun / Cıvata":           {"group_id": "bijon-grup", "group_name": "BİJON"},
    # PORYA
    "Porya":                    {"group_id": "porya-grup", "group_name": "PORYA"},
    "Rulman":                   {"group_id": "porya-grup", "group_name": "PORYA"},
    "Keçe":                     {"group_id": "porya-grup", "group_name": "PORYA"},
    # SENSÖR VE UZATMALAR
    "ABS Sensörü/Modülü/Kablo": {"group_id": "sensor-uzatma", "group_name": "SENSÖR VE UZATMALAR"},
    "EBS Modülatör":            {"group_id": "sensor-uzatma", "group_name": "SENSÖR VE UZATMALAR"},
    "Sensör":                   {"group_id": "sensor-uzatma", "group_name": "SENSÖR VE UZATMALAR"},
    "Elektrik Kablosu":         {"group_id": "sensor-uzatma", "group_name": "SENSÖR VE UZATMALAR"},
    # FREN YAYLARI
    "Yay":                      {"group_id": "fren-yaylari", "group_name": "FREN YAYLARI"},
    # SÜSP. KÖRÜĞÜ
    "Süspansiyon Körüğü":       {"group_id": "susp-korugu", "group_name": "SÜSP. KÖRÜĞÜ"},
    "Dingil":                   {"group_id": "susp-korugu", "group_name": "SÜSP. KÖRÜĞÜ"},
    "Burç / Muylu":             {"group_id": "susp-korugu", "group_name": "SÜSP. KÖRÜĞÜ"},
}
# CATEGORY_HIERARCHY'de olmayanlar otomatik olarak "DİĞER" grubuna düşer.

# Sitede satılmayan kategoriler — bu kategorilere düşen ürünler products.json'a yazılmaz
REJECTED_CATEGORIES = {
    # HAVALI FREN PARÇALARI grubu
    "Valf / Ventil", "Dağıtıcı Ventil", "Röle Ventili",
    "Süspansiyon/Basınç Ventili", "Şanzıman Ventili",
    "Hava Kurutucu", "Filtre / Kartuş", "Hava Tüpü",
    # KOMPRESÖR grubu
    "Kompresör Piston/Segman", "Kompresör Silindiri",
    "Kompresör Tamir Takımı", "Kompresör Kapak", "Kompresör",
    # REKOR / HORTUM grubu
    "Bağlantı Elemanları", "Nipel", "Hortum", "Hortum Adaptörü",
}

# Araç marka tespiti (ürün adı + OEM'den)
VEHICLE_PATTERNS = {
    "Mercedes": [r"MERCEDES", r"\bMB\b", r"\bACTROS\b", r"\bATEGO\b", r"\bAXOR\b", r"\bSPRINTER\b", r"TRAVEGO", r"TOURISMO"],
    "MAN": [r"\bMAN\b", r"\bTGA\b", r"\bTGS\b", r"\bTGX\b", r"\bTGM\b", r"\bTGL\b"],
    "Volvo": [r"\bVOLVO\b", r"\bFH\d", r"\bFM\d"],
    "Scania": [r"\bSCANIA\b"],
    "DAF": [r"\bDAF\b", r"\bCF\d", r"\bXF\d"],
    "Renault": [r"\bRENAULT\b", r"\bPREMIUM\b", r"\bMAGNUM\b", r"\bKERAX\b"],
    "Iveco": [r"\bIVECO\b", r"\bEUROCARGO\b", r"\bSTRALIS\b", r"\bEUROBUS\b"],
    "Ford": [r"\bFORD\b", r"\bCARGO\b"],
    "BMC": [r"\bBMC\b", r"\bFATIH\b"],
    "Dodge": [r"\bDODGE\b"],
    "Isuzu": [r"\bISUZU\b", r"\bNPR\b"],
    "Mitsubishi": [r"\bMITSUBISHI\b", r"\bCANTER\b"],
    "BPW": [r"\bBPW\b"],
    "SAF": [r"\bSAF\b"],
    "ROR": [r"\bROR\b"],
    "Knorr": [r"\bKNORR\b", r"\bSB[5-7]\b", r"\bSN[6-7]\b"],
    "Wabco": [r"\bWABCO\b", r"\bMAXX\b"],
}

def detect_compat(name, oem):
    haystack = ((name or "") + " " + (oem or "")).upper()
    found = []
    for brand, patterns in VEHICLE_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, haystack, re.IGNORECASE):
                found.append(brand)
                break
    return found

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

# field10 fallback: SADECE pattern eşleşmediğinde devreye girer.
# field10 genelde varyant/model adı tutuyor (memory'de güvenilmez işaretli) ama
# bazı ürünlerde net kategori adı var. Whitelist ile kısıtlı kullanım güvenli.
FIELD10_FALLBACK = [
    ("OTOMATIK", "Otomatik Fren Cırcırı"),
    ("MEKANIK", "Mekanik Fren Cırcırı"),
    ("CIRCIR", "Fren Cırcırı"),
    ("KAMPANA", "Fren Kampanası"),
    ("BALATA", "Fren Balatası"),
    ("DISKI", "Fren Diski"),
    ("KÖRÜK", "Fren Körüğü"),
    ("KORUK", "Fren Körüğü"),
    ("DPS", "Bijon DPS"),
    ("BIJON", "Bijon"),
    ("PORYA", "Porya"),
    ("KALIPER", "Kaliper"),
    ("KALİPER", "Kaliper"),
    ("VOLANT", "Volan / Debriyaj"),
    ("PABUC", "Fren Pabucu"),
    ("PABUÇ", "Fren Pabucu"),
]

def detect_category(name, path, sku=None, field10=None):
    """name + path + sku'yu birlikte tara, ilk eşleşen pattern → kategori.
    Pattern eşleşmezse field10 whitelist ile son şans."""
    haystack = ((name or "") + " " + (path or "").replace("-", " ") + " " + (sku or "")).upper()
    for pat, cat in CATEGORY_PATTERNS:
        if re.search(pat, haystack, re.IGNORECASE):
            return cat
    if field10:
        f10 = field10.upper().strip()
        for key, cat in FIELD10_FALLBACK:
            if key in f10:
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

        # Kategori (name + path birlikte; pattern eşleşmezse field10 fallback)
        cat_name = detect_category(a.get("name", ""), a.get("path", ""), a.get("sku"), a.get("field10"))
        # Sitede satılmayan kategoriler — havalı fren, kompresör, rekor/hortum grupları kaldırıldı
        if cat_name in REJECTED_CATEGORIES:
            continue
        cat_id = slug(cat_name)
        cats_set[cat_id] = cat_name

        # Brand
        brand = BRAND_MAP.get(a.get("brand_id"), "Ekersan")

        final.append({
            "id": pid,
            "name": a.get("name", ""),
            "sku": a.get("sku", ""),
            "price": round(price * PRICE_MULTIPLIER, 2),
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
            "compat": detect_compat(a.get("name", ""), a.get("field1", "")),
            "veh": ["kamyon", "tir"],
        })
        pid += 1

    # Hiyerarşik kategori listesi oluştur
    cats_list = [{"id": "all", "name": "Tüm Ürünler", "parent": None}]
    # Üst sırada gösterilecek öncelikli gruplar (ana satış kategorileri).
    # Bu listede olmayan gruplar bu liste bittikten sonra alfabetik gelir.
    GROUP_PRIORITY = [
        "disk",            # DİSK
        "kampana",         # KAMPANA
        "balata",          # BALATA
        "circir",          # CIRCIR
        "bijon-grup",      # BİJON
        "porya-grup",      # PORYA
        "kaliper-urunleri",# KALİPER ÜRÜNLERİ
    ]
    group_children = {}  # group_id -> [{cat_id, cat_name, parent}]
    group_names = {}     # group_id -> group_name
    ungrouped = []
    for cid in sorted(cats_set.keys(), key=lambda k: cats_set[k].lower()):
        cat_name = cats_set[cid]
        hier = CATEGORY_HIERARCHY.get(cat_name)
        if hier:
            gid = hier["group_id"]
            gname = hier["group_name"]
            if gid not in group_children:
                group_children[gid] = []
                group_names[gid] = gname
            group_children[gid].append({"id": cid, "name": cat_name, "parent": gid})
        else:
            ungrouped.append({"id": cid, "name": cat_name, "parent": "diger-parcalar"})
    # Önce öncelikli gruplar (PRIORITY sırasında), sonra kalanlar alfabetik,
    # "Diğer Parçalar" her zaman en sonda
    seen = set()
    final_group_order = []
    for gid in GROUP_PRIORITY:
        if gid in group_children:
            final_group_order.append(gid)
            seen.add(gid)
    middle = [gid for gid in sorted(group_children.keys(), key=lambda g: group_names[g].lower())
              if gid not in seen and gid != "diger-parcalar"]
    final_group_order.extend(middle)
    if "diger-parcalar" in group_children:
        final_group_order.append("diger-parcalar")
    for gid in final_group_order:
        cats_list.append({"id": gid, "name": group_names[gid], "parent": None, "isGroup": True})
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

    # ───── Görsel cache ─────
    # cache_images.py products.json'u okur, S3 URL'lerini /img/*.webp'ye
    # dönüştürür ve products.json'u tekrar yazar. Yeni eklenen ürünlerin
    # görselleri indirilir, mevcut olanlar atlanır.
    cache_script = os.path.join(BASE_DIR, "cache_images.py")
    if os.path.exists(cache_script):
        log("Görseller indiriliyor (cache_images.py)...")
        try:
            subprocess.run([sys.executable, cache_script], check=True)
            log("Görsel cache tamamlandı")
        except subprocess.CalledProcessError as e:
            log(f"UYARI: Görsel cache hatası, devam ediliyor: {e}")

    # Push (DRY_RUN env ile atla)
    if os.environ.get("DRY_RUN"):
        log(f"DRY_RUN: push atlandı. {len(final)} ürün hazır.")
        return
    log("GitHub'a push ediliyor...")
    os.chdir(BASE_DIR)
    subprocess.run(["git", "add",
        "public/data/products.json",
        "public/data/categories.json",
        "public/img"], check=True)
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    sub_count = len([c for c in cats_list if c.get("parent") and not c.get("isGroup")])
    grp_count = len([c for c in cats_list if c.get("isGroup")])
    msg = f"Otomatik ürün sync - {len(final)} ürün, {grp_count} ana kategori, {sub_count} alt kategori ({now})"
    subprocess.run(["git", "commit", "-m", msg], check=True)
    subprocess.run(["git", "push", "origin", "master"], check=True)
    log(f"Tamamlandı! {len(final)} ürün senkronize edildi.")

if __name__ == "__main__":
    main()
