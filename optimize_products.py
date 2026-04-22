"""
products.json'u compact'le ve gereksiz alanları sil.
- desc == name ise desc'i çıkar (duplicate)
- specs = {} ise çıkar (her zaman boş)
- vat_rate = 20 ise çıkar (sabit, frontend default kullanır)
- old: null ise çıkar
- compat: [] ise çıkar
- images: [] ise çıkar
- img_lg == img ise çıkar (cache_images sonrası farklı boyut yoksa)
- separators=(",",":")  → minimal whitespace

Kazanç: ~640KB → ~250KB açık (gzip 65KB → ~30KB)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PATH = ROOT / "public" / "data" / "products.json"

data = json.loads(PATH.read_text(encoding="utf-8"))
print(f"Önce: {len(data)} ürün, {PATH.stat().st_size/1024:.1f} KB")

cleaned = 0
for p in data:
    # desc == name → sil (duplicate)
    if p.get("desc") and p.get("name") and p["desc"].strip() == p["name"].strip():
        del p["desc"]
        cleaned += 1
    # specs boş object → sil
    if p.get("specs") == {} or p.get("specs") is None:
        p.pop("specs", None)
    # vat_rate default → sil
    if p.get("vat_rate") == 20:
        p.pop("vat_rate", None)
    # old null → sil
    if p.get("old") is None:
        p.pop("old", None)
    # compat boş → sil
    if p.get("compat") == []:
        p.pop("compat", None)
    # images boş → sil
    if p.get("images") == []:
        p.pop("images", None)
    # img_lg img ile aynı → sil
    if p.get("img_lg") and p.get("img_lg") == p.get("img"):
        p.pop("img_lg", None)
    # rating default 4.5 → sil
    if p.get("rating") == 4.5:
        p.pop("rating", None)
    # reviews 0 → sil
    if p.get("reviews") == 0:
        p.pop("reviews", None)

# Compact yaz (no whitespace, no indent)
PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Sonra: {len(data)} ürün, {PATH.stat().st_size/1024:.1f} KB")
print(f"desc duplicate temizlenen: {cleaned}")
