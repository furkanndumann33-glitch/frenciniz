"""
Ürün görsellerini S3'ten indir, 2 boyutta (320, 800) webp'ye dönüştür ve
public/img/ altına kaydet. Sonra products.json'da img/images alanlarını
yerel path'e (/img/{id}_320.webp, /img/{id}_800.webp) güncelle.

Çıktı boyutu: ~20-40 MB toplam (1071 ürün × 2 boyut). Vercel statik CDN
üzerinden anında servis edilir, cold start veya proxy yok.
"""

from __future__ import annotations
import io
import json
import os
import sys
import time
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
PRODUCTS_PATH = ROOT / "public" / "data" / "products.json"
IMG_DIR = ROOT / "public" / "img"
IMG_DIR.mkdir(parents=True, exist_ok=True)

# 320 = ürün kartı (mobil 2x ve desktop 1x); 800 = detay sayfası
SIZES = [
    ("320", 320, 60),  # liste/kart
    ("800", 800, 70),  # detay/galeri
]

PARALLEL = 12
TIMEOUT = 20

session = requests.Session()
session.headers.update({"User-Agent": "frenciniz-image-cache/1.0"})


def slug_from_url(url: str) -> str:
    return hashlib.md5(url.encode("utf-8")).hexdigest()[:10]


def download(url: str) -> bytes | None:
    try:
        r = session.get(url, timeout=TIMEOUT)
        if r.status_code != 200 or not r.content:
            return None
        return r.content
    except Exception as e:
        print(f"  ! İndirme hatası {url[:80]}: {e}")
        return None


def to_webp(data: bytes, target_w: int, quality: int) -> bytes | None:
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            try:
                bg.paste(img, mask=img.split()[-1])
            except Exception:
                bg.paste(img)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        # En boya göre orantılı küçült (max boyut target_w)
        w, h = img.size
        if max(w, h) > target_w:
            ratio = target_w / max(w, h)
            new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
            img = img.resize(new_size, Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="WEBP", quality=quality, method=6)
        return out.getvalue()
    except Exception as e:
        print(f"  ! Dönüştürme hatası: {e}")
        return None


def cache_one(pid, url) -> tuple[int, dict]:
    """Tek bir ürün için tüm boyutları üretir. Returns (id, {size_label: webpath})."""
    out = {}
    # Eğer url zaten lokal /img/* ise atla
    if not url or url.startswith("/img/") or url.startswith("/logo"):
        return pid, out

    # Cache key dosya adı: id + url hash
    base = f"{pid}_{slug_from_url(url)}"
    paths_needed = []
    for label, w, q in SIZES:
        fname = f"{base}_{label}.webp"
        fpath = IMG_DIR / fname
        webpath = f"/img/{fname}"
        if fpath.exists() and fpath.stat().st_size > 100:
            out[label] = webpath
        else:
            paths_needed.append((label, w, q, fpath, webpath))
    if not paths_needed:
        return pid, out
    raw = download(url)
    if not raw:
        return pid, out
    for label, w, q, fpath, webpath in paths_needed:
        webp = to_webp(raw, w, q)
        if webp:
            try:
                fpath.write_bytes(webp)
                out[label] = webpath
            except Exception as e:
                print(f"  ! Yazma hatası {fpath.name}: {e}")
    return pid, out


def main():
    if not PRODUCTS_PATH.exists():
        print(f"products.json yok: {PRODUCTS_PATH}")
        sys.exit(1)
    data = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    print(f"Toplam ürün: {len(data)}")

    # İndirilecek görsel listesini hazırla (img + images dizisi)
    jobs = []  # (pid, url, slot) slot = "main" veya idx
    for p in data:
        pid = p.get("id")
        if pid is None:
            continue
        img = p.get("img")
        if img and "placehold" not in img and not img.startswith("/img/") and not img.startswith("/logo"):
            jobs.append((pid, img, "main"))
        for i, gimg in enumerate(p.get("images") or []):
            if gimg and "placehold" not in gimg and not gimg.startswith("/img/") and not gimg.startswith("/logo"):
                jobs.append((pid, gimg, f"g{i}"))

    print(f"İşlenecek görsel: {len(jobs)}")
    print(f"Boyutlar: {[s[0] for s in SIZES]}, paralel: {PARALLEL}")

    # Url bazında dedup (aynı url'i 2 kez indirme)
    url_results = {}
    unique_jobs = {}
    for pid, url, slot in jobs:
        if url not in unique_jobs:
            unique_jobs[url] = pid

    start = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=PARALLEL) as ex:
        futures = {ex.submit(cache_one, pid, url): url for url, pid in unique_jobs.items()}
        for fut in as_completed(futures):
            url = futures[fut]
            try:
                pid, paths = fut.result()
                url_results[url] = paths
            except Exception as e:
                print(f"  ! İş hatası: {e}")
                url_results[url] = {}
            done += 1
            if done % 50 == 0 or done == len(unique_jobs):
                elapsed = time.time() - start
                rate = done / max(elapsed, 0.001)
                remain = (len(unique_jobs) - done) / max(rate, 0.001)
                print(f"  [{done}/{len(unique_jobs)}] {rate:.1f}/sn  kalan ~{remain:.0f}sn")

    print("\nproducts.json güncelleniyor...")
    updated = 0
    for p in data:
        img = p.get("img")
        if img and img in url_results and url_results[img]:
            paths = url_results[img]
            # ANA img = 320 (ürün kartında kullanılır, küçük dosya)
            new_thumb = paths.get("320") or paths.get("800")
            new_full = paths.get("800") or paths.get("320")
            if new_thumb:
                p["img"] = new_thumb
                # Detay/galeri için büyük versiyon
                p["img_lg"] = new_full
                updated += 1
        # Galeri: 800 versiyonu (detay sayfası için)
        new_gallery = []
        for gimg in (p.get("images") or []):
            if gimg in url_results and url_results[gimg]:
                paths = url_results[gimg]
                new_gallery.append(paths.get("800") or paths.get("320") or gimg)
            else:
                new_gallery.append(gimg)
        if new_gallery:
            p["images"] = new_gallery

    # indent=None - dosya boyutu icin kritik (sync.py de indent=None kullaniyor)
    PRODUCTS_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    elapsed = time.time() - start
    print(f"\nOK {updated} urun guncellendi.")
    print(f"OK /public/img altina {len(list(IMG_DIR.glob('*.webp')))} webp dosya")
    total_mb = sum(f.stat().st_size for f in IMG_DIR.glob('*.webp')) / 1024 / 1024
    print(f"OK Toplam boyut: {total_mb:.1f} MB")
    print(f"OK Sure: {elapsed:.0f} sn")


if __name__ == "__main__":
    main()
