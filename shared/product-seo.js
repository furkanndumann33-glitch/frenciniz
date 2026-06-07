const TR_MAP = {
  "ı": "i",
  "İ": "i",
  "ğ": "g",
  "Ğ": "g",
  "ü": "u",
  "Ü": "u",
  "ş": "s",
  "Ş": "s",
  "ö": "o",
  "Ö": "o",
  "ç": "c",
  "Ç": "c",
};

export function slugifyProductText(value, maxLength = 96) {
  const slug = String(value || "")
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, char => TR_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length <= maxLength) return slug || "urun";

  const trimmed = slug.slice(0, maxLength).replace(/-[^-]*$/, "").replace(/^-+|-+$/g, "");
  return trimmed || slug.slice(0, maxLength).replace(/^-+|-+$/g, "") || "urun";
}

export function productSeoSlug(product) {
  if (!product) return "urun";
  const parts = [
    product.name,
    product.sku,
    product.brand,
  ].filter(Boolean);
  return slugifyProductText(parts.join(" "));
}

export function productSeoPath(product) {
  if (!product?.id) return "/urunler";
  return `/urun/${encodeURIComponent(product.id)}/${productSeoSlug(product)}`;
}

export function productSeoUrl(site, product) {
  const root = String(site || "").replace(/\/+$/g, "");
  return `${root}${productSeoPath(product)}`;
}

export function productIdFromRoute(value) {
  const first = String(value || "").replace(/^\/+|\/+$/g, "").split("/")[0];
  const numeric = Number(first);
  return Number.isFinite(numeric) && first !== "" ? numeric : first;
}
