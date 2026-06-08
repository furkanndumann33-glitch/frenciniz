import { productSeoUrl } from "./product-seo.js";

const DEFAULT_SITE = "https://frenciniz.com";
const DEFAULT_IMAGE = "/img/site/missing-product.webp";

function cleanText(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/\s+/g, " ")
    .trim();
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .map(stripUndefined)
      .filter(item => item !== undefined && item !== null && item !== "");
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, stripUndefined(item)])
        .filter(([, item]) => item !== undefined && item !== null && item !== "")
    );
  }

  return value;
}

function absoluteUrl(site, value) {
  const root = String(site || DEFAULT_SITE).replace(/\/+$/g, "");
  const raw = cleanText(value);
  if (!raw) return `${root}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${root}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function findCategory(categories, product) {
  return Array.isArray(categories) ? categories.find(category => category.id === product?.cat) : null;
}

function categoryLabel(categories, product, fallback) {
  return cleanText(fallback || findCategory(categories, product)?.name || product?.cat || "Fren Aksami");
}

function sanitizeSku(product) {
  return cleanText(product?.sku || product?.id || product?.oem || "frenciniz-urun")
    .replace(/[^\p{L}\p{N}\-_. /]/gu, "")
    .slice(0, 100);
}

export function buildProductDescription(product, categories = [], options = {}) {
  const category = categoryLabel(categories, product, options.categoryName);
  const name = cleanText(product?.name, "Fren aksami urunu");
  const brand = cleanText(product?.brand, "Ekersan");
  const compat = Array.isArray(product?.compat) ? product.compat.slice(0, 8).join(", ") : "";
  const existing = cleanText(product?.desc);

  if (existing.length >= 80) return existing.slice(0, 5000);

  return cleanText([
    `${name} - ${category} kategorisinde ${brand} marka agir vasita fren parcasi.`,
    product?.sku ? `Stok kodu: ${product.sku}.` : "",
    product?.oem ? `OEM / muadil kod: ${product.oem}.` : "",
    compat ? `Uyumlu araclar: ${compat}.` : "",
    "Kamyon, tir, otobus ve dorse icin parca kodu ile uyumluluk teyidi yapilir.",
    "Stoklu urunlerde hizli kargo, 12 taksit ve 14 gun iade destegi vardir.",
  ].filter(Boolean).join(" ")).slice(0, 5000);
}

export function buildMerchantReturnPolicy(site = DEFAULT_SITE) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    merchantReturnLink: `${String(site || DEFAULT_SITE).replace(/\/+$/g, "")}/return-policy`,
  };
}

export function buildOfferShippingDetails(product) {
  const price = Number(product?.price || 0);

  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: price >= 3000 ? "0.00" : "150.00",
      currency: "TRY",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "TR",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
    },
  };
}

export function buildOfferJsonLd(product, options = {}) {
  const site = String(options.site || DEFAULT_SITE).replace(/\/+$/g, "");
  const url = options.url || productSeoUrl(site, product);
  const price = Number(product?.price || 0);
  const validUntil = options.priceValidUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return stripUndefined({
    "@type": "Offer",
    url,
    priceCurrency: "TRY",
    price: price.toFixed(2),
    priceValidUntil: validUntil,
    itemCondition: "https://schema.org/NewCondition",
    availability: Number(product?.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: "Frenciniz",
      url: site,
    },
    hasMerchantReturnPolicy: buildMerchantReturnPolicy(site),
    shippingDetails: buildOfferShippingDetails(product),
  });
}

export function buildProductJsonLd(product, categories = [], options = {}) {
  const site = String(options.site || DEFAULT_SITE).replace(/\/+$/g, "");
  const url = options.url || productSeoUrl(site, product);
  const images = (Array.isArray(options.images) && options.images.length ? options.images : [
    product?.img_lg,
    product?.img,
    DEFAULT_IMAGE,
  ])
    .filter(Boolean)
    .map(image => absoluteUrl(site, image));
  const category = categoryLabel(categories, product, options.categoryName);
  const ratingValue = Number(product?.rating || 0);
  const reviewCount = Number(product?.reviews || 0);

  return stripUndefined({
    ...(options.includeContext === false ? {} : { "@context": "https://schema.org" }),
    "@type": "Product",
    "@id": `${url}#product`,
    name: cleanText(product?.name, "Frenciniz urunu"),
    image: [...new Set(images)],
    description: buildProductDescription(product, categories, { categoryName: category }),
    sku: sanitizeSku(product),
    mpn: cleanText(product?.oem || product?.sku || product?.id),
    gtin: cleanText(product?.gtin),
    productID: cleanText(product?.id),
    url,
    brand: {
      "@type": "Brand",
      name: cleanText(product?.brand, "Ekersan"),
    },
    category,
    additionalProperty: [
      product?.sku ? { "@type": "PropertyValue", name: "SKU", value: cleanText(product.sku) } : null,
      product?.oem ? { "@type": "PropertyValue", name: "OEM / Muadil", value: cleanText(product.oem) } : null,
      Array.isArray(product?.compat) && product.compat.length
        ? { "@type": "PropertyValue", name: "Uyumlu Araclar", value: product.compat.slice(0, 10).join(", ") }
        : null,
      { "@type": "PropertyValue", name: "Stok", value: String(Math.max(0, Number(product?.stock || 0))) },
    ].filter(Boolean),
    aggregateRating: ratingValue > 0 ? {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: Math.max(1, reviewCount || 1),
      bestRating: "5",
      worstRating: "1",
    } : undefined,
    offers: buildOfferJsonLd(product, { site, url, priceValidUntil: options.priceValidUntil }),
  });
}

export function buildOrganizationJsonLd(site = DEFAULT_SITE, options = {}) {
  const root = String(site || DEFAULT_SITE).replace(/\/+$/g, "");

  return stripUndefined({
    ...(options.includeContext === false ? {} : { "@context": "https://schema.org" }),
    "@type": "Organization",
    "@id": `${root}#organization`,
    name: "Frenciniz",
    alternateName: "Dumanlar Ticaret",
    url: root,
    logo: `${root}/img/site/frenciniz-logo-real.png`,
    image: `${root}/img/site/frenciniz-logo-real-og.jpg`,
    description: "Kamyon, tir, otobus ve dorse icin agir vasita fren aksami ve yedek parca satisi.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hizirbey Mah. 1509 Sok. No:24",
      addressLocality: "Isparta",
      addressRegion: "Isparta",
      addressCountry: "TR",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+90-545-608-7008",
        contactType: "customer service",
        areaServed: "TR",
        availableLanguage: ["Turkish"],
      },
      {
        "@type": "ContactPoint",
        telephone: "+90-850-888-7881",
        contactType: "sales",
        areaServed: "TR",
        availableLanguage: ["Turkish"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/profile.php?id=61573354240573",
      "https://www.instagram.com/frenciniz.co",
    ],
    hasMerchantReturnPolicy: buildMerchantReturnPolicy(root),
  });
}
