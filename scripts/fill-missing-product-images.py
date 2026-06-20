import csv
import json
import math
import re
from pathlib import Path
from collections import deque

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = ROOT / "public" / "data" / "products.json"
OUT_DIR = ROOT / "public" / "img" / "frenciniz-generated"
REPORT_PATH = ROOT / "pricing-research" / "missing-image-fill-report-2026-06-12.csv"


STOP_WORDS = {
    "fren",
    "korugu",
    "koruk",
    "korlugu",
    "körüğü",
    "suspansiyon",
    "süspansiyon",
    "bijon",
    "somun",
    "somunu",
    "porya",
    "kapagi",
    "kapağı",
    "ekersan",
    "sol",
    "sag",
    "sağ",
    "arka",
    "on",
    "ön",
    "ym",
    "em",
}


def is_missing_image(value):
    img = str(value or "").lower()
    return not img or "missing-product" in img or "placehold" in img or "/logo" in img or "logo." in img or "/frenciniz-generated/" in img


def local_image_path(value):
    raw = str(value or "").strip()
    if not raw.startswith("/img/"):
        return None
    if "/frenciniz-generated/" in raw:
        return None
    rel = raw.lstrip("/")
    path = ROOT / "public" / rel
    if path.exists():
        return path
    hi = path.with_name(path.name.replace("_320.", "_800."))
    if hi.exists():
        return hi
    return None


def prefer_large(path):
    if not path:
        return None
    hi = path.with_name(path.name.replace("_320.", "_800."))
    return hi if hi.exists() else path


def tokens(*values):
    text = " ".join(str(v or "") for v in values).lower()
    text = text.replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")
    raw = re.findall(r"[a-z0-9]+", text)
    out = set()
    for token in raw:
        if len(token) < 2 or token in STOP_WORDS:
            continue
        out.add(token)
        if len(token) >= 6 and any(ch.isdigit() for ch in token):
            out.add(re.sub(r"[^0-9]", "", token))
    return {t for t in out if t}


def code_tokens(*values):
    text = " ".join(str(v or "") for v in values).upper()
    return {t for t in re.findall(r"[A-Z0-9]{3,}", text) if len(t) >= 3}


def score_match(missing, candidate):
    mt = tokens(missing.get("name"), missing.get("sku"), missing.get("oem"))
    ct = tokens(candidate.get("name"), candidate.get("sku"), candidate.get("oem"))
    mc = code_tokens(missing.get("sku"), missing.get("oem"))
    cc = code_tokens(candidate.get("sku"), candidate.get("oem"))
    score = 0
    score += len(mt & ct) * 12
    score += len(mc & cc) * 28
    score += 18 if str(missing.get("sku", "")).split(" ")[0:1] == str(candidate.get("sku", "")).split(" ")[0:1] else 0
    score += 12 if missing.get("cat") == candidate.get("cat") else 0
    if missing.get("oem") and candidate.get("oem"):
        mo = re.sub(r"[^0-9A-Z]", "", str(missing.get("oem")).upper())
        co = re.sub(r"[^0-9A-Z]", "", str(candidate.get("oem")).upper())
        if mo and co and (mo in co or co in mo):
            score += 120
    return score


def best_source(product, products):
    candidates = []
    for candidate in products:
        if candidate.get("id") == product.get("id"):
            continue
        path = prefer_large(local_image_path(candidate.get("img")) or local_image_path((candidate.get("images") or [""])[0]))
        if not path:
            continue
        if candidate.get("cat") != product.get("cat"):
            continue
        candidates.append((score_match(product, candidate), candidate, path))
    if not candidates:
        for candidate in products:
            path = prefer_large(local_image_path(candidate.get("img")) or local_image_path((candidate.get("images") or [""])[0]))
            if path:
                candidates.append((score_match(product, candidate), candidate, path))
    candidates.sort(key=lambda row: (row[0], int(row[1].get("stock") or 0)), reverse=True)
    return candidates[0]


def find_font(size, bold=True):
    names = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for name in names:
        path = Path(name)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def trim_white(image):
    rgb = image.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if not (r > 242 and g > 242 and b > 242 and max(r, g, b) - min(r, g, b) < 18):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x or max_y <= min_y:
        return image
    pad = 12
    return image.crop((max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + pad), min(h, max_y + pad)))


def remove_connected_light_background(image):
    rgba = image.convert("RGBA")
    rgb = rgba.convert("RGB")
    pix = rgb.load()
    alpha = rgba.getchannel("A")
    a_pix = alpha.load()
    w, h = rgba.size

    def is_background_like(x, y):
        r, g, b = pix[x, y]
        bright = (r + g + b) / 3
        chroma = max(r, g, b) - min(r, g, b)
        return (bright > 238 and chroma < 24) or (bright > 178 and chroma < 42)

    seen = set()
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        if not is_background_like(x, y):
            continue
        a_pix[x, y] = 0
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    rgba.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.35)))
    bbox = rgba.getbbox()
    if bbox:
        return rgba.crop(bbox)
    return image


def make_background(size=800):
    bg = Image.new("RGB", (size, size), "#f7f8fa")
    draw = ImageDraw.Draw(bg)
    for y in range(size):
        shade = 247 - int((y / size) * 12)
        draw.line([(0, y), (size, y)], fill=(shade, shade + 1, shade + 3))
    draw.ellipse((-120, -90, 460, 310), fill=(255, 255, 255))
    return bg.convert("RGBA")


def add_frenciniz_label(base, product_box):
    draw = ImageDraw.Draw(base)
    size = base.size[0]
    font = find_font(42, bold=True)
    small = find_font(17, bold=False)
    text = "FRENCINIZ"
    sub = "AGIR VASITA FREN AKSAMI"
    x1, y1, x2, y2 = product_box
    band_w = min(500, max(315, int((x2 - x1) * 0.88)))
    band_h = 104
    cx = int((x1 + x2) / 2)
    cy = int(y1 + (y2 - y1) * 0.53)
    bx1 = max(22, min(size - band_w - 22, cx - band_w // 2))
    by1 = max(30, min(size - band_h - 34, cy - band_h // 2))
    bx2 = bx1 + band_w
    by2 = by1 + band_h
    draw.rounded_rectangle((bx1 + 7, by1 + 7, bx2 + 7, by2 + 7), radius=20, fill=(0, 0, 0, 70))
    draw.rounded_rectangle((bx1, by1, bx2, by2), radius=20, fill=(15, 18, 24, 242), outline=(218, 20, 28, 255), width=4)
    draw.rectangle((bx1, by1, bx1 + 12, by2), fill=(218, 20, 28, 255))
    tw = draw.textlength(text, font=font)
    sw = draw.textlength(sub, font=small)
    draw.text((bx1 + (band_w - tw) / 2, by1 + 19), text, font=font, fill=(255, 255, 255, 255))
    draw.text((bx1 + (band_w - sw) / 2, by1 + 66), sub, font=small, fill=(240, 240, 240, 230))


def render_product_image(source_path, product, out_path):
    base = make_background(800)
    src = Image.open(source_path).convert("RGBA")
    src = trim_white(src)
    src = remove_connected_light_background(src)
    max_side = 610
    scale = min(max_side / src.width, max_side / src.height)
    new_size = (max(1, int(src.width * scale)), max(1, int(src.height * scale)))
    src = src.resize(new_size, Image.Resampling.LANCZOS)

    x = (800 - src.width) // 2
    y = int((800 - src.height) * 0.43)
    shadow = Image.new("RGBA", (src.width + 60, src.height + 60), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((30, src.height + 12, src.width + 30, src.height + 42), fill=(0, 0, 0, 52))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(shadow, (x - 30, y - 30))
    base.alpha_composite(src, (x, y))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(out_path, "WEBP", quality=88, method=6)


def main():
    products = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    missing = [p for p in products if is_missing_image(p.get("img"))]
    rows = []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for product in missing:
        score, source, source_path = best_source(product, products)
        out_rel = f"/img/frenciniz-generated/{product['id']}_frenciniz.webp"
        out_path = ROOT / "public" / out_rel.lstrip("/")
        render_product_image(source_path, product, out_path)
        product["img"] = out_rel
        product["img_lg"] = out_rel
        product["images"] = [out_rel]
        rows.append({
            "id": product.get("id"),
            "name": product.get("name"),
            "sku": product.get("sku"),
            "oem": product.get("oem"),
            "category": product.get("cat"),
            "new_image": out_rel,
            "source_product_id": source.get("id"),
            "source_name": source.get("name"),
            "source_sku": source.get("sku"),
            "source_oem": source.get("oem"),
            "source_image": str(source.get("img") or ""),
            "match_score": score,
        })

    PRODUCTS_PATH.write_text(json.dumps(products, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    if rows:
        with REPORT_PATH.open("w", newline="", encoding="utf-8-sig") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
    print(json.dumps({"updated": len(rows), "report": str(REPORT_PATH)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
