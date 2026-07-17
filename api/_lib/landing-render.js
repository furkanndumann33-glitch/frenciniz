import {
  SITE,
  LANDING_PAGES,
  absoluteImage,
  categoryName,
  filterProductsForLanding,
  getRelatedLandingPages,
  htmlEscape,
  landingSearchPhrases,
  landingWhatsappUrl,
} from "./seo-landing.js";
import { productSearchName, productSeoUrl } from "../../shared/product-seo.js";
import { buildOrganizationJsonLd } from "../../shared/structured-data.js";

function productUrl(product) {
  return productSeoUrl(SITE, product);
}

function money(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

function landingCouponWhatsAppUrl(page) {
  const text = [
    "Merhaba Frenciniz, indirim kuponu almak istiyorum.",
    `Sayfa: ${page?.heading || page?.slug || "Fren aksami"}`,
    "Ilgilendigim urun / OEM kodu:",
    "Arac marka-model / sase:",
    "Bugun siparis icin uygun kupon ve fiyat rica ederim.",
  ].join("\n");
  return `https://wa.me/908508887881?text=${encodeURIComponent(text)}`;
}

function renderProductCard(product, categories) {
  const img = absoluteImage(product);
  const cat = categoryName(categories, product.cat);
  const stock = Number(product.stock || 0);
  const displayName = productSearchName(product, categories, 140) || product.name;
  const oem = product.oem ? `<div class="muted">OEM: ${htmlEscape(String(product.oem).slice(0, 90))}</div>` : "";
  const quoteText = [
    "Merhaba Frenciniz, bu landing sayfasindaki urun icin fiyat, stok ve uyumluluk teyidi istiyorum.",
    `Urun: ${displayName || product.name || "-"}`,
    `SKU: ${product.sku || "-"}`,
    `OEM: ${product.oem || "-"}`,
    `Link: ${productUrl(product)}`,
    "Arac marka/model:",
    "Sase no:",
  ].join("\n");
  const quoteUrl = `https://wa.me/908508887881?text=${encodeURIComponent(quoteText)}`;
  return `
    <article class="product-card">
      <a href="${productUrl(product)}" class="image-link" aria-label="${htmlEscape(displayName)}">
        <img src="${htmlEscape(img)}" alt="${htmlEscape(displayName)}" loading="lazy" decoding="async">
      </a>
      <div class="product-body">
        <a href="${productUrl(product)}" class="product-title">${htmlEscape(displayName)}</a>
        <div class="meta">${htmlEscape(product.brand || "Ekersan")} · ${htmlEscape(product.sku || "")}</div>
        <div class="muted">${htmlEscape(cat)}</div>
        ${oem}
        <div class="row">
          <strong>${money(product.price)}</strong>
          <span class="${stock > 0 ? "stock" : "nostock"}">${stock > 0 ? `Stokta ${stock} adet` : "Stok sorunuz"}</span>
        </div>
        <a class="mini-cta" href="${productUrl(product)}">Ürünü incele</a>
        <a class="mini-cta wa" href="${htmlEscape(quoteUrl)}" data-lead-source="landing_product_card" data-lead-product-id="${htmlEscape(product.id)}" data-lead-sku="${htmlEscape(product.sku || "")}" data-lead-category="${htmlEscape(product.cat || "")}" data-lead-value="${htmlEscape(product.price || 0)}">WhatsApp teklif</a>
      </div>
    </article>`;
}

export function renderLanding(page, products, categories, seoState = null, selectedSlugs = null) {
  const matched = filterProductsForLanding(products, page, 24);
  const canonical = seoState?.canonical || `${SITE}/${page.slug}`;
  const robots = seoState?.reason === "insufficient-exact-products"
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1";
  const firstImage = matched[0] ? absoluteImage(matched[0]) : `${SITE}/img/site/frenciniz-logo-real-og.jpg`;
  const searchPhrases = landingSearchPhrases(page);
  const relatedPages = getRelatedLandingPages(page, 14, selectedSlugs);
  const categoryLinks = [...new Set(page.cats || [])]
    .map(cat => `<a href="${SITE}/${cat}">${htmlEscape(categoryName(categories, cat))}</a>`)
    .join("");
  const couponHref = landingCouponWhatsAppUrl(page);
  const relatedLinks = relatedPages
    .map(related => `<a href="${SITE}/${related.slug}">${htmlEscape(related.heading)}</a>`)
    .join("");
  const phraseLinks = searchPhrases
    .map(phrase => `<span>${htmlEscape(phrase)}</span>`)
    .join("");
  const itemList = matched.slice(0, 12).map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: productUrl(product),
    name: productSearchName(product, categories, 140) || product.name,
  }));
  const schema = [
    buildOrganizationJsonLd(SITE),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.heading,
      description: page.description,
      url: canonical,
      keywords: searchPhrases.join(", "),
      isPartOf: { "@type": "WebSite", name: "Frenciniz", url: SITE },
      mainEntity: { "@type": "ItemList", itemListElement: itemList },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `${page.heading} aracıma uyar mı?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "Uyumluluk için ürün üzerindeki parça kodu, OEM numarası veya araç şase/model bilgisini WhatsApp hattımıza gönderebilirsiniz. Frenciniz ekibi stok ve uyumluluk teyidi yapar.",
          },
        },
        {
          "@type": "Question",
          name: "Aynı gün kargo var mı?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Stoklu ürünlerde mesai ve kargo teslim saatine göre aynı gün kargo yapılabilir. 3000 TL üzeri siparişlerde standart kargo ücretsizdir.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Frenciniz", item: SITE },
        { "@type": "ListItem", position: 2, name: page.heading, item: canonical },
      ],
    },
  ];

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(page.title)}</title>
  <meta name="description" content="${htmlEscape(page.description)}">
  <meta name="keywords" content="${htmlEscape(searchPhrases.join(", "))}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Frenciniz">
  <meta property="og:title" content="${htmlEscape(page.title)}">
  <meta property="og:description" content="${htmlEscape(page.description)}">
  <meta property="og:image" content="${htmlEscape(firstImage)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18146656139"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-18146656139');
    window.FRENCINIZ_ADS = {
      accountId: 'AW-18146656139',
      leadConversion: 'AW-18146656139/3fAcCJ6-s7scEIv__8xD',
      phoneConversion: 'AW-18146656139/n0u1CJu-s7scEIv__8xD',
      purchaseConversion: ''
    };
    window.frencinizTrackAdsConversion = function (kind, payload) {
      if (!window.gtag) return;
      var data = payload || {};
      var label = kind === 'phone' ? window.FRENCINIZ_ADS.phoneConversion
        : kind === 'purchase' ? (window.FRENCINIZ_ADS.purchaseConversion || window.FRENCINIZ_ADS.leadConversion)
        : window.FRENCINIZ_ADS.leadConversion;
      if (!label) return;
      var eventData = {
        send_to: label,
        value: Number(data.value) || 1,
        currency: data.currency || 'TRY',
        event_category: data.category || 'lead',
        event_label: data.label || data.kind || kind,
        transport_type: 'beacon'
      };
      if (data.transaction_id) eventData.transaction_id = data.transaction_id;
      window.gtag('event', 'conversion', eventData);
    };
  </script>
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1732623911519380');
    fbq('track', 'PageView');
  </script>
  <script>
    (function () {
      try {
        var payload = JSON.stringify({
          path: window.location.pathname || '/',
          search: window.location.search || '',
          ref: document.referrer || ''
        });
        if (navigator.sendBeacon) {
          var blob = new Blob([payload], { type: 'application/json' });
          if (navigator.sendBeacon('/api/auth/track', blob)) return;
        }
        fetch('/api/auth/track', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    })();
  </script>
  <script>
    (function () {
      function sendLeadPayload(payload) {
        try {
          var json = JSON.stringify(payload);
          if (navigator.sendBeacon) {
            var blob = new Blob([json], { type: 'application/json' });
            if (navigator.sendBeacon('/api/auth/lead', blob)) return;
          }
          fetch('/api/auth/lead', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: json,
            keepalive: true
          }).catch(function () {});
        } catch (e) {}
      }

      function sendInternalLead(kind, href, link) {
        try {
          var data = link && link.dataset ? link.dataset : {};
          var path = window.location.pathname || '/';
          var inferredSource = data.leadSource || (path.indexOf('/urun/') === 0 ? 'product_detail' : (path === '/cart' ? 'cart' : (path === '/contact' ? 'contact' : kind + '_site')));
          sendLeadPayload({
            type: kind,
            source: inferredSource,
            href: href || '',
            path: path,
            ref: document.referrer || '',
            productId: data.leadProductId || '',
            sku: data.leadSku || '',
            category: data.leadCategory || '',
            value: Number(data.leadValue || 0) || 0,
            items: Number(data.leadItems || 0) || 0
          });
        } catch (e) {}
      }

      function trackLead(kind, href, link) {
        sendInternalLead(kind, href, link);
        if (window.gtag) {
          window.gtag('event', 'generate_lead', {
            event_category: 'lead',
            event_label: kind,
            transport_type: 'beacon'
          });
          window.gtag('event', kind + '_click', {
            event_category: 'contact',
            event_label: href || window.location.pathname,
            transport_type: 'beacon'
          });
        }
        if (window.frencinizTrackAdsConversion) {
          window.frencinizTrackAdsConversion(kind === 'phone' ? 'phone' : 'lead', {
            kind: kind,
            label: href || kind,
            value: 1
          });
        }
        if (window.fbq) {
          window.fbq('track', 'Contact', {
            content_name: kind,
            content_category: 'lead'
          });
        }
      }

      document.addEventListener('click', function (event) {
        var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link) return;
        var href = link.getAttribute('href') || '';
        var normalized = href.toLowerCase();
        if (normalized.indexOf('wa.me') !== -1 || normalized.indexOf('whatsapp') !== -1) trackLead('whatsapp', href, link);
        else if (normalized.indexOf('tel:') === 0) trackLead('phone', href, link);
        else if (normalized.indexOf('mailto:') === 0) trackLead('email', href, link);
      }, true);

      document.addEventListener('submit', function (event) {
        var form = event.target && event.target.closest ? event.target.closest('form[data-landing-callback]') : null;
        if (!form) return;
        event.preventDefault();
        var phone = form.elements.phone ? String(form.elements.phone.value || '').trim() : '';
        var status = form.querySelector('[data-callback-status]');
        if (phone.replace(/\\D/g, '').length < 10) {
          if (status) status.textContent = 'Arama icin telefon numarasi gerekli.';
          return;
        }
        sendLeadPayload({
          type: 'phone',
          source: form.dataset.leadSource || 'landing_callback_form',
          href: '',
          path: window.location.pathname || '/',
          ref: document.referrer || '',
          category: form.dataset.leadCategory || '',
          contactPhone: phone,
          code: form.elements.code ? String(form.elements.code.value || '').trim() : '',
          vehicle: form.elements.vehicle ? String(form.elements.vehicle.value || '').trim() : '',
          note: form.elements.note ? String(form.elements.note.value || '').trim() : 'SEO landing sayfasindan geri arama talebi'
        });
        if (window.frencinizTrackAdsConversion) {
          window.frencinizTrackAdsConversion('phone', { kind: 'phone', label: 'landing_callback_form', value: 1 });
        }
        if (window.fbq) {
          window.fbq('track', 'Contact', { content_name: 'landing_callback_form', content_category: 'lead' });
        }
        if (status) status.textContent = 'Arama talebi kaydedildi.';
        form.reset();
      }, true);
    })();
  </script>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    :root{--orange:#ff6000;--dark:#171717;--muted:#666;--line:#e8e8e8;--soft:#f7f7f7}
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#222;background:#fff;line-height:1.55;padding-bottom:74px}
    a{color:inherit}
    .top{background:#111;color:#fff}
    .bar{max-width:1180px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    .brand{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:800}
    .brand img{width:210px;height:auto;display:block}
    .bar-actions{display:flex;gap:10px;align-items:center;font-size:14px}
    .bar-actions a{color:#fff;text-decoration:none}
    .hero{background:#fafafa;border-bottom:1px solid var(--line)}
    .hero-inner{max-width:1180px;margin:0 auto;padding:42px 20px 34px;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:32px;align-items:center}
    .eyebrow{font-size:13px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
    h1{font-size:38px;line-height:1.12;margin:0 0 14px;color:#111;letter-spacing:0}
    .lead{font-size:18px;color:#444;margin:0 0 22px;max-width:760px}
    .cta-row{display:flex;flex-wrap:wrap;gap:10px}
    .cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:800;background:var(--orange);color:#fff}
    .cta.secondary{background:#111}
    .trust{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .trust div{background:#fff;border:1px solid var(--line);border-radius:8px;padding:14px;font-size:14px}
    .trust strong{display:block;color:#111;font-size:16px;margin-bottom:2px}
    main{max-width:1180px;margin:0 auto;padding:28px 20px 44px}
    .section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:16px}
    h2{font-size:24px;margin:0;color:#111}
    .muted{color:var(--muted);font-size:13px}
    .products{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
    .product-card{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff;display:flex;flex-direction:column;min-height:100%}
    .image-link{display:flex;align-items:center;justify-content:center;height:180px;background:#f8f8f8}
    .image-link img{max-width:100%;max-height:100%;object-fit:contain}
    .product-body{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}
    .product-title{font-size:14px;font-weight:800;text-decoration:none;color:#151515;min-height:42px}
    .meta{font-size:12px;color:#555}
    .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:8px}
    .stock{font-size:12px;color:#087f3d;font-weight:700}.nostock{font-size:12px;color:#a33;font-weight:700}
    .mini-cta{display:block;text-align:center;text-decoration:none;margin-top:8px;border:1px solid var(--orange);color:var(--orange);border-radius:6px;padding:8px;font-size:13px;font-weight:800}
    .mini-cta.wa{border-color:#16a34a;background:#16a34a;color:#fff}
    .coupon-strip{background:linear-gradient(90deg,#fff7ed,#fef3c7 54%,#dcfce7);border-bottom:1px solid #fed7aa;color:#111827}
    .coupon-inner{max-width:1180px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .coupon-copy{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:900}.coupon-badge{background:var(--orange);color:#fff;font-size:11px;font-weight:950;padding:5px 8px;border-radius:999px;white-space:nowrap}
    .coupon-strip a{min-height:38px;padding:9px 14px;border-radius:8px;background:#16a34a;color:#fff;text-decoration:none;font-size:13px;font-weight:950;display:inline-flex;align-items:center;justify-content:center}
    .callback-box{grid-column:1/-1;margin:0 0 18px;padding:15px;border:1px solid #dbe3ef;border-radius:8px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.05)}
    .callback-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
    .callback-head strong{display:block;color:#111;font-size:16px}.callback-badge{font-size:12px;font-weight:900;color:#087f3d;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:6px 9px}
    .callback-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;align-items:stretch}.callback-grid input{width:100%;min-height:42px;border:1px solid #d1d5db;border-radius:7px;padding:0 11px;font-size:13px;font-weight:700}.callback-grid button{min-height:42px;border:none;border-radius:7px;background:var(--orange);color:#fff;font-size:13px;font-weight:950;padding:0 14px;white-space:nowrap}.callback-status{margin-top:8px;font-size:12px;font-weight:800;color:#15803d}
    .content{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:34px}
    .panel{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:20px}
    .links{display:flex;flex-wrap:wrap;gap:8px}.links a{padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px}
    .phrase-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.phrase-grid span{padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:6px;font-size:13px;color:#333}
    .related-panel{margin-top:22px}.related-panel h2{font-size:20px}.related-panel .links a{font-weight:700}
    .footer{border-top:1px solid var(--line);padding:20px;color:#666;font-size:13px;text-align:center}
    .sticky-lead{position:fixed;left:0;right:0;bottom:0;z-index:50;background:#111;color:#fff;border-top:3px solid var(--orange);box-shadow:0 -8px 24px rgba(0,0,0,.18)}
    .sticky-lead-inner{max-width:1180px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px}
    .sticky-copy{font-size:13px;color:#ddd}.sticky-copy strong{display:block;color:#fff;font-size:15px}
    .sticky-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}.sticky-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:850;font-size:13px}.sticky-wa{background:#16a34a;color:#fff}.sticky-phone{background:#fff;color:#111}
    @media(max-width:900px){.hero-inner{grid-template-columns:1fr}.products{grid-template-columns:repeat(2,minmax(0,1fr))}.content{grid-template-columns:1fr}h1{font-size:30px}.trust{grid-template-columns:1fr 1fr}}
    @media(max-width:560px){body{padding-bottom:118px}.bar{align-items:flex-start;flex-direction:column}.coupon-inner{align-items:stretch;flex-direction:column}.coupon-copy{align-items:flex-start;flex-direction:column}.coupon-strip a{text-align:center}.hero-inner{padding-top:28px}.products{grid-template-columns:1fr}.trust{grid-template-columns:1fr}.lead{font-size:16px}.sticky-lead-inner{align-items:stretch;flex-direction:column;padding:10px 12px}.sticky-actions{display:grid;grid-template-columns:1fr 1fr}.sticky-actions a{width:100%}}
  </style>
</head>
<body>
  <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1732623911519380&ev=PageView&noscript=1"></noscript>
  <header class="top">
    <div class="bar">
      <a class="brand" href="${SITE}"><img src="${SITE}/img/site/frenciniz-logo-real.webp?v=1" alt="Frenciniz"></a>
      <div class="bar-actions">
        <a href="tel:+905456087008">0545 608 7008</a>
        <a href="https://wa.me/908508887881">WhatsApp</a>
      </div>
    </div>
  </header>
  <section class="coupon-strip"><div class="coupon-inner"><div class="coupon-copy"><span class="coupon-badge">INDIRIM KUPONU</span><strong>Indirim kuponu icin WhatsApp ile iletisime gecin; urun kodunu yazin, uygun kuponu netlestirelim.</strong></div><a href="${htmlEscape(couponHref)}" data-lead-source="landing_coupon_banner" data-lead-category="${htmlEscape(page.slug)}">WhatsApp'tan kupon iste</a></div></section>
  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="eyebrow">Stoklu ürün · OEM kodu ile teyit</div>
        <h1>${htmlEscape(page.heading)}</h1>
        <p class="lead">${htmlEscape(page.description)} Parça kodu, OEM numarası veya araç modelini gönderin; doğru ürünü hızlıca teyit edelim.</p>
        <div class="cta-row">
          <a class="cta" href="${landingWhatsappUrl(page)}" data-lead-source="landing_hero" data-lead-category="${htmlEscape(page.slug)}">WhatsApp'tan fiyat al</a>
          <a class="cta secondary" href="tel:+905456087008">Hemen ara</a>
        </div>
      </div>
      <div class="trust">
        <div><strong>${matched.length || products.length} ürün</strong>İlgili stok ve alternatifler</div>
        <div><strong>14:00'a kadar</strong>Stoklu üründe aynı gün kargo</div>
        <div><strong>3000 TL üzeri</strong>Standart kargo ücretsiz</div>
        <div><strong>OEM</strong>Şase ile uyumluluk teyidi</div>
      </div>
    </div>
  </section>
  <main>
    <div class="section-head">
      <div>
        <h2>${htmlEscape(page.heading)} Ürünleri</h2>
        <div class="muted">Fiyat, stok ve uyumluluk bilgisi için ürün sayfasını açabilir veya WhatsApp'tan kod gönderebilirsiniz.</div>
      </div>
    </div>
    <section class="products">
      <form class="callback-box" data-landing-callback data-lead-source="landing_callback_form" data-lead-category="${htmlEscape(page.slug)}">
        <div class="callback-head">
          <div><strong>Telefonunuzu birakin, ${htmlEscape(page.heading)} icin sizi arayalim.</strong><span class="muted">OEM/parca kodu ve arac bilgisini yazin; stok, fiyat ve uyumlulugu netlestirelim.</span></div>
          <span class="callback-badge">WhatsApp sart degil</span>
        </div>
        <div class="callback-grid">
          <input name="phone" inputmode="tel" autocomplete="tel" placeholder="Telefon: 05xx xxx xx xx">
          <input name="code" placeholder="OEM / parca kodu">
          <input name="vehicle" placeholder="Arac / sase notu">
          <input name="note" placeholder="Not / adet">
          <button type="submit">Beni arayin</button>
        </div>
        <div class="callback-status" data-callback-status></div>
      </form>
      ${matched.map(product => renderProductCard(product, categories)).join("\n")}
    </section>
    <section class="content">
      <div class="panel">
        <h2>${htmlEscape(page.heading)} seçerken nelere bakılır?</h2>
        <p>${htmlEscape(page.primaryTerm)} için ${htmlEscape(page.part)} seçerken ürün kodu, OEM numarası, araç modeli, dingil tipi ve ölçü uyumluluğu beraber kontrol edilmelidir. Yanlış parça hem montaj süresini uzatır hem de aracın fren güvenliğini riske atar.</p>
        <p>Frenciniz, Dumanlar Ticaret çatısı altında ağır vasıta fren aksamında stoklu ürün, hızlı teyit ve Türkiye geneli kargo desteği sunar. Elinizdeki eski parçanın kodunu veya fotoğrafını WhatsApp hattımıza göndererek doğru ürünü hızlıca bulabilirsiniz.</p>
        <h2 style="font-size:20px;margin-top:22px">Bu sayfanın cevap verdiği aramalar</h2>
        <div class="phrase-grid">${phraseLinks}</div>
        ${relatedLinks ? `<div class="related-panel"><h2>Yakın model ve parça sayfaları</h2><div class="links">${relatedLinks}</div></div>` : ""}
      </div>
      <aside class="panel">
        <h2>İlgili Kategoriler</h2>
        <div class="links">${categoryLinks}</div>
        <p class="muted" style="margin-top:16px">Uyumluluk teyidi için parça kodu veya OEM numarası göndermeniz yeterli.</p>
        <a class="cta" href="${landingWhatsappUrl(page)}" data-lead-source="landing_sidebar" data-lead-category="${htmlEscape(page.slug)}" style="width:100%;margin-top:6px">Kod gönder, teklif al</a>
      </aside>
    </section>
  </main>
  <footer class="footer">
    Frenciniz · Dumanlar Ticaret · Hızırbey Mah. 1509 Sok. No:24, Isparta · info@frenciniz.com
  </footer>
  <div class="sticky-lead" role="region" aria-label="Hizli teklif">
    <div class="sticky-lead-inner">
      <div class="sticky-copy"><strong>${htmlEscape(page.heading)} icin hizli teklif</strong>OEM kodu, sase veya eski parca fotografi ile uyumluluk teyidi.</div>
      <div class="sticky-actions">
        <a class="sticky-wa" href="${landingWhatsappUrl(page)}" data-lead-source="landing_sticky" data-lead-category="${htmlEscape(page.slug)}">WhatsApp Teklif</a>
        <a class="sticky-phone" href="tel:+905456087008" data-lead-source="landing_sticky_phone" data-lead-category="${htmlEscape(page.slug)}">Hemen Ara</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderLandingIndex(pages = LANDING_PAGES) {
  const links = pages.map(page => `<li><a href="${SITE}/${page.slug}">${htmlEscape(page.heading)}</a></li>`).join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Frenciniz SEO Sayfaları</title><meta name="robots" content="noindex"></head><body><h1>Frenciniz SEO Sayfaları</h1><ul>${links}</ul></body></html>`;
}
