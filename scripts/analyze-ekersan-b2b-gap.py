#!/usr/bin/env python3
"""Read-only Ekersan B2B vs Frenciniz catalog gap report.

This script intentionally does not edit public/data/products.json, images,
git state, or deployment settings. It creates a dated markdown report and CSVs
under pricing-research/.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import sync  # noqa: E402


REPORT_DIR = ROOT / "pricing-research"
TMP_DIR = ROOT / "tmp"


def norm_code(value: object) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def clean(value: object) -> str:
    return " ".join(str(value or "").split())


def login():
    cj = CookieJar()
    opener = build_opener(HTTPCookieProcessor(cj))
    req = Request(
        f"{sync.EKERSAN_API}/data/b2b_signin.json",
        data=json.dumps({"username": sync.EKERSAN_USER, "password": sync.EKERSAN_PASS}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    payload = json.loads(opener.open(req, timeout=45).read().decode("utf-8"))
    csrf = payload.get("csrf")
    if not csrf:
        raise RuntimeError("B2B login failed: csrf missing")
    return opener, csrf


def fetch_b2b_snapshot(delay: float, cache_path: Path, force: bool) -> dict:
    if cache_path.exists() and not force:
        with cache_path.open("r", encoding="utf-8") as f:
            cached = json.load(f)
        if cached.get("done"):
            return cached
        products = cached.get("products", [])
        included = cached.get("included", [])
        page = int(cached.get("next_page") or 1)
        print(f"resume cache: page {page}, {len(products)} urun", flush=True)
    else:
        products = []
        included = []
        page = 1

    opener, csrf = login()

    def save_checkpoint(next_page: int, done: bool = False) -> None:
        snapshot = {
            "fetched_at": datetime.now().isoformat(timespec="seconds"),
            "products": products,
            "included": included,
            "pages": page,
            "next_page": next_page,
            "done": done,
        }
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with cache_path.open("w", encoding="utf-8") as f:
            json.dump(snapshot, f, ensure_ascii=False)

    while True:
        req = Request(
            f"{sync.EKERSAN_API}/data/b2b/products.json?page={page}",
            headers={"Accept": "application/json", "X-CSRF-TOKEN": csrf},
        )
        tries = 0
        while True:
            try:
                payload = json.loads(opener.open(req, timeout=60).read().decode("utf-8"))
                break
            except HTTPError as exc:
                tries += 1
                if exc.code == 429 and tries < 10:
                    wait = max(20, 20 * tries)
                    print(f"page {page}: 429, {wait}s bekleniyor", flush=True)
                    time.sleep(wait)
                    continue
                raise
            except Exception:
                tries += 1
                if tries < 5:
                    wait = 20 * tries
                    print(f"page {page}: gecici hata, {wait}s bekleniyor", flush=True)
                    time.sleep(wait)
                    continue
                raise

        root = payload.get("products", {})
        data = root.get("data", []) or []
        inc = root.get("included", []) or []
        if not data:
            break

        products.extend(data)
        included.extend(inc)
        if page == 1 or page % 25 == 0:
            print(f"page {page}: {len(products)} urun okundu", flush=True)
            save_checkpoint(page + 1)
        if len(data) < 20:
            break

        page += 1
        if delay:
            time.sleep(delay)

    save_checkpoint(page + 1, done=True)
    with cache_path.open("r", encoding="utf-8") as f:
        snapshot = json.load(f)
    return snapshot


def build_included_maps(included: list[dict]) -> tuple[dict, dict]:
    units = {}
    images = {}
    for item in included:
        item_id = str(item.get("id", ""))
        attrs = item.get("attributes", {}) or {}
        if item.get("type") == "unit":
            units[item_id] = attrs
        elif item.get("type") == "image":
            images[item_id] = attrs.get("url") or ""
    return units, images


def b2b_price(product: dict, units: dict) -> float:
    for unit_ref in product.get("relationships", {}).get("units", {}).get("data", []) or []:
        attrs = units.get(str(unit_ref.get("id")), {})
        price = attrs.get("b2b_price")
        if price:
            try:
                return float(price)
            except (TypeError, ValueError):
                return 0.0
    return 0.0


def b2b_images(product: dict, images: dict) -> list[str]:
    refs = product.get("relationships", {}).get("images", {}).get("data", []) or []
    return [images.get(str(ref.get("id")), "") for ref in refs if images.get(str(ref.get("id")), "")]


def load_site_products() -> list[dict]:
    with (ROOT / "public" / "data" / "products.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def convert_candidate(raw: dict, units: dict, images: dict) -> dict:
    attrs = raw.get("attributes", {}) or {}
    price = b2b_price(raw, units)
    cat_name = sync.detect_category(attrs.get("name", ""), attrs.get("path", ""), attrs.get("sku"), attrs.get("field10"))
    cat_id = sync.slug(cat_name)
    img_list = b2b_images(raw, images)
    display_name = sync.clean_product_name_for_google(attrs.get("name", ""), cat_name)
    sales_count = attrs.get("b2b_sales_count") or 0
    try:
        sales_count = float(sales_count)
    except (TypeError, ValueError):
        sales_count = 0
    return {
        "source_id": raw.get("id", ""),
        "sku": clean(attrs.get("sku", "")),
        "sku_norm": norm_code(attrs.get("sku", "")),
        "name": clean(display_name),
        "raw_name": clean(attrs.get("name", "")),
        "path": clean(attrs.get("path", "")),
        "oem": clean(attrs.get("field1", "")),
        "raw_category": clean(attrs.get("field10", "")),
        "category_name": clean(cat_name),
        "category_id": cat_id,
        "b2b_price": price,
        "site_price_est": round(price * sync.PRICE_MULTIPLIER, 2) if price else 0,
        "stock": int(float(attrs.get("b2b_stock_qty") or 0)),
        "in_stock": bool(attrs.get("b2b_in_stock")),
        "sales_count": sales_count,
        "image_count": len(img_list),
        "has_image": bool(img_list),
        "first_image": img_list[0] if img_list else "",
        "rejected": cat_name in sync.REJECTED_CATEGORIES,
    }


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def markdown_table(rows: list[dict], fields: list[tuple[str, str]], limit: int = 20) -> str:
    rows = rows[:limit]
    if not rows:
        return "_Yok._"
    header = "| " + " | ".join(label for _, label in fields) + " |"
    sep = "| " + " | ".join("---" for _ in fields) + " |"
    body = []
    for row in rows:
        vals = []
        for key, _ in fields:
            val = clean(row.get(key, ""))
            vals.append(val.replace("|", "/"))
        body.append("| " + " | ".join(vals) + " |")
    return "\n".join([header, sep, *body])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--delay", type=float, default=0.8, help="Delay between B2B pages in seconds")
    parser.add_argument("--force", action="store_true", help="Ignore cached tmp snapshot")
    parser.add_argument("--cache", default=str(TMP_DIR / f"ekersan-b2b-snapshot-{datetime.now():%Y-%m-%d}.json"))
    args = parser.parse_args()

    snapshot = fetch_b2b_snapshot(args.delay, Path(args.cache), args.force)
    units, images = build_included_maps(snapshot.get("included", []))
    site_products = load_site_products()

    site_by_sku = defaultdict(list)
    for product in site_products:
        sku_key = norm_code(product.get("sku", ""))
        if sku_key:
            site_by_sku[sku_key].append(product)

    converted = [convert_candidate(raw, units, images) for raw in snapshot.get("products", [])]
    sellable = [p for p in converted if p["in_stock"] and p["b2b_price"] > 0 and not p["rejected"]]
    missing = [p for p in sellable if p["sku_norm"] and p["sku_norm"] not in site_by_sku]
    existing_sellable = [p for p in sellable if p["sku_norm"] in site_by_sku]
    no_image_missing = [p for p in missing if not p["has_image"]]
    image_missing = [p for p in missing if p["has_image"]]

    current_sku_norms = {norm_code(p.get("sku", "")) for p in site_products if norm_code(p.get("sku", ""))}
    b2b_sku_norms = {p["sku_norm"] for p in sellable if p["sku_norm"]}
    site_not_in_b2b = [p for p in site_products if norm_code(p.get("sku", "")) and norm_code(p.get("sku", "")) not in b2b_sku_norms]

    missing_sorted = sorted(missing, key=lambda p: (p["sales_count"], p["stock"], p["has_image"]), reverse=True)
    priority_cats = {
        "fren-diski", "fren-diski-abs-li", "fren-kampanasi", "fren-balatasi",
        "fren-circiri", "otomatik-fren-circiri", "mekanik-fren-circiri",
        "fren-korugu", "suspansiyon-korugu", "porya", "bijon", "disk-bijonu-civatasi",
    }
    priority_missing = [p for p in missing_sorted if p["category_id"] in priority_cats]

    date = datetime.now().strftime("%Y-%m-%d")
    csv_missing = REPORT_DIR / f"ekersan-b2b-missing-products-{date}.csv"
    csv_existing = REPORT_DIR / f"ekersan-b2b-existing-products-{date}.csv"
    csv_obsolete = REPORT_DIR / f"frenciniz-products-not-in-b2b-{date}.csv"
    report_path = REPORT_DIR / f"ekersan-b2b-gap-report-{date}.md"

    fields = [
        "sku", "name", "category_id", "category_name", "stock", "b2b_price",
        "site_price_est", "sales_count", "oem", "has_image", "image_count", "path", "source_id",
    ]
    write_csv(csv_missing, missing_sorted, fields)
    write_csv(csv_existing, existing_sellable, fields)
    write_csv(
        csv_obsolete,
        [
            {
                "sku": p.get("sku", ""),
                "name": p.get("name", ""),
                "category_id": p.get("cat", ""),
                "stock": p.get("stock", ""),
                "site_price": p.get("price", ""),
                "oem": p.get("oem", ""),
                "id": p.get("id", ""),
            }
            for p in site_not_in_b2b
        ],
        ["id", "sku", "name", "category_id", "stock", "site_price", "oem"],
    )

    cat_counts = Counter(p["category_id"] for p in missing)
    rejected_counts = Counter(p["category_id"] for p in converted if p["in_stock"] and p["b2b_price"] > 0 and p["rejected"])
    esc_80172 = [p for p in converted if norm_code(p["sku"]) == norm_code("ESC 80172")]

    top_fields = [
        ("sku", "SKU"),
        ("name", "Urun"),
        ("category_id", "Kategori"),
        ("stock", "Stok"),
        ("site_price_est", "Tahmini Site Fiyati"),
        ("sales_count", "B2B Satis"),
        ("oem", "OEM"),
    ]

    report = []
    report.append(f"# Ekersan B2B Eksik Urun Analizi - {date}")
    report.append("")
    report.append(f"- B2B cekim zamani: `{snapshot.get('fetched_at')}`")
    report.append(f"- B2B okunan ham urun: **{len(converted)}**")
    report.append(f"- Frenciniz mevcut urun: **{len(site_products)}**")
    report.append(f"- B2B satilabilir aday: **{len(sellable)}**")
    report.append(f"- Frenciniz'de SKU bazli gorunen B2B aday: **{len(existing_sellable)}**")
    report.append(f"- Frenciniz'de eksik gorunen B2B aday: **{len(missing)}**")
    report.append(f"- Eksiklerden gorselli urun: **{len(image_missing)}**")
    report.append(f"- Eksiklerden gorselsiz/placeholder gerekecek urun: **{len(no_image_missing)}**")
    report.append(f"- Frenciniz'de olup bugunku B2B satilabilir listesinde olmayan SKU: **{len(site_not_in_b2b)}**")
    report.append("")
    report.append("## ESC 80172 Kontrolu")
    if esc_80172:
        esc_fields = [
            ("sku", "SKU"),
            ("name", "Urun"),
            ("category_id", "Kategori"),
            ("stock", "Stok"),
            ("in_stock", "B2B Stokta"),
            ("site_price_est", "Tahmini Site Fiyati"),
            ("oem", "OEM"),
            ("has_image", "Gorsel"),
        ]
        report.append(markdown_table(esc_80172, esc_fields, 5))
        report.append("")
        if any(not item["in_stock"] or item["stock"] <= 0 for item in esc_80172):
            report.append("ESC 80172 B2B listesinde kayit olarak var; ancak stokta degil veya stok adedi 0/negatif. Bu nedenle otomatik yukleme adayina alinmadi.")
        else:
            report.append("ESC 80172 B2B listesinde stoklu gorunuyor; CSV'de eksik/var durumuna gore yer aldi.")
    else:
        report.append("ESC 80172 bugunku B2B products API listesinde SKU olarak bulunmadi. Public Ekersan sayfasi var, fakat B2B stok/fiyat listesine gelmiyor olabilir.")
    report.append("")
    report.append("## En Oncelikli Eksikler")
    report.append(markdown_table(priority_missing, top_fields, 30))
    report.append("")
    report.append("## B2B Satis/Stok Sinyaline Gore En Guclu Eksikler")
    report.append(markdown_table(missing_sorted, top_fields, 30))
    report.append("")
    report.append("## Eksik Kategori Dagilimi")
    for cat, count in cat_counts.most_common():
        report.append(f"- `{cat}`: {count}")
    report.append("")
    report.append("## Sitede Bilerek Elenen Satilabilir Kategori Dagilimi")
    if rejected_counts:
        for cat, count in rejected_counts.most_common():
            report.append(f"- `{cat}`: {count}")
    else:
        report.append("- Yok")
    report.append("")
    report.append("## Cikti Dosyalari")
    report.append(f"- Eksik urun CSV: `{csv_missing.relative_to(ROOT)}`")
    report.append(f"- Mevcut eslesen B2B CSV: `{csv_existing.relative_to(ROOT)}`")
    report.append(f"- Sitede olup B2B satilabilir listesinde olmayan CSV: `{csv_obsolete.relative_to(ROOT)}`")
    report.append("")
    report.append("## Karar")
    report.append("Onay gelmeden urun katalogu guncellenmedi. Onaylanirsa once eksik CSV'den oncelikli kategoriler eklenmeli; gorselsiz urunler icin placeholder veya tedarikci gorseli ayrica kontrol edilmeli.")

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")

    print(json.dumps({
        "report": str(report_path),
        "missing_csv": str(csv_missing),
        "existing_csv": str(csv_existing),
        "obsolete_csv": str(csv_obsolete),
        "b2b_raw": len(converted),
        "site_products": len(site_products),
        "sellable": len(sellable),
        "missing": len(missing),
        "missing_with_image": len(image_missing),
        "missing_no_image": len(no_image_missing),
        "site_not_in_b2b": len(site_not_in_b2b),
        "esc_80172_found": bool(esc_80172),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
