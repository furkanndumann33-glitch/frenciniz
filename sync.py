#!/usr/bin/env python3
"""
Ekersan B2B -> Frenciniz otomatik ürün senkronizasyonu
Her çalıştığında Ekersan'dan ürünleri çeker, JSON'a yazar ve GitHub'a push eder.
Vercel otomatik deploy alır.
"""

import json
import subprocess
import os
import sys
import time
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from http.cookiejar import CookieJar
from urllib.request import HTTPCookieProcessor, build_opener

EKERSAN_API = "https://bayi.ekersan.com/api/tr/v1"
EKERSAN_USER = "DUMANLAR"
EKERSAN_PASS = "320043"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_PATH = os.path.join(BASE_DIR, "public", "data", "products.json")
CATEGORIES_PATH = os.path.join(BASE_DIR, "public", "data", "categories.json")

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def main():
    log("Ekersan sync başlatılıyor...")

    # Cookie destekli opener
    cj = CookieJar()
    opener = build_opener(HTTPCookieProcessor(cj))

    # 1. Login
    log("Ekersan'a giriş yapılıyor...")
    login_data = json.dumps({"username": EKERSAN_USER, "password": EKERSAN_PASS}).encode("utf-8")
    req = Request(
        f"{EKERSAN_API}/data/b2b_signin.json",
        data=login_data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    resp = opener.open(req)
    login_resp = json.loads(resp.read().decode("utf-8"))
    csrf = login_resp.get("csrf", "")
    user_name = login_resp.get("b2bUserData", {}).get("name", "?")
    log(f"Giriş başarılı: {user_name}")

    # 2. Tüm ürünleri çek
    all_products = []
    all_included = []
    page = 1

    while True:
        url = f"{EKERSAN_API}/data/b2b/products.json?page={page}"
        req = Request(url, headers={"Accept": "application/json", "X-CSRF-TOKEN": csrf})
        try:
            resp = opener.open(req)
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
        except Exception as e:
            log(f"Sayfa {page} hatası: {e}")
            break

        if "error" in data:
            log(f"API hatası: {data['error']}")
            break

        prods = data.get("products", {}).get("data", [])
        incl = data.get("products", {}).get("included", [])

        if not prods:
            break

        all_products.extend(prods)
        all_included.extend(incl)

        sys.stdout.write(f"\r[{datetime.now().strftime('%H:%M:%S')}] Sayfa {page}: {len(all_products)} ürün çekildi")
        sys.stdout.flush()

        if len(prods) < 20:
            break
        page += 1
        time.sleep(0.3)  # Rate limit aşmamak için

    print()
    log(f"Toplam: {len(all_products)} ürün, {len(all_included)} birim")

    # 3. İşle
    units_map = {}
    for inc in all_included:
        if inc.get("type") == "unit":
            units_map[str(inc["id"])] = inc.get("attributes", {})

    final = []
    cats_set = set()
    pid = 1

    for p in all_products:
        a = p.get("attributes", {})
        if not a.get("b2b_in_stock", False):
            continue

        uid_list = [str(u["id"]) for u in p.get("relationships", {}).get("units", {}).get("data", [])]
        price = 0
        for uid in uid_list:
            u = units_map.get(uid, {})
            if u.get("b2b_price"):
                price = u["b2b_price"]
                break
        if price <= 0:
            continue

        cat = (a.get("field10", "") or "").strip() or "Diğer"
        cats_set.add(cat)

        final.append({
            "id": pid,
            "name": a.get("name", ""),
            "sku": a.get("sku", ""),
            "price": round(price, 2),
            "old": None,
            "vat_rate": a.get("vat_rate", 0),
            "stock": int(a.get("b2b_stock_qty", 0)),
            "oem": a.get("field1", ""),
            "cat": cat,
            "brand": "Ekersan",
            "rating": 4.5,
            "reviews": 0,
            "img": "https://placehold.co/400x400/1c1c1c/b0b0b0?text=" + (a.get("sku", "URUN") or "URUN").replace(" ", "+"),
            "desc": a.get("name", ""),
            "specs": {},
            "compat": [],
            "veh": ["kamyon", "tir"],
        })
        pid += 1

    cats_list = [{"id": "all", "name": "Tüm Ürünler"}]
    for c in sorted(cats_set):
        cid = c.lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-")
        cats_list.append({"id": cid, "name": c})

    log(f"Stokta: {len(final)} ürün, {len(cats_list)-1} kategori")

    # 4. Mevcut veriyle karşılaştır
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
                if not op or op["price"] != p["price"] or op["stock"] != p["stock"]:
                    changed = True
                    if op:
                        log(f"Değişiklik: {p['sku']} fiyat:{op['price']}->{p['price']} stok:{op['stock']}->{p['stock']}")
                    break
    except FileNotFoundError:
        changed = True
        log("İlk çalıştırma, tüm veriler yeni")

    if not changed:
        log("Değişiklik yok, güncelleme gerekmez.")
        return

    # 5. Kaydet
    os.makedirs(os.path.dirname(PRODUCTS_PATH), exist_ok=True)
    with open(PRODUCTS_PATH, "wb") as f:
        f.write(json.dumps(final, ensure_ascii=False).encode("utf-8"))
    with open(CATEGORIES_PATH, "wb") as f:
        f.write(json.dumps(cats_list, ensure_ascii=False).encode("utf-8"))
    log("JSON dosyaları güncellendi")

    # 6. Git commit & push
    log("GitHub'a push ediliyor...")
    os.chdir(BASE_DIR)
    subprocess.run(["git", "add", "public/data/products.json", "public/data/categories.json"], check=True)

    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    msg = f"Otomatik ürün sync - {len(final)} ürün, {len(cats_list)-1} kategori ({now})"
    subprocess.run(["git", "commit", "-m", msg], check=True)
    subprocess.run(["git", "push", "origin", "master"], check=True)

    log(f"Tamamlandı! {len(final)} ürün senkronize edildi ve deploy tetiklendi.")

if __name__ == "__main__":
    main()
