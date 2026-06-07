import {
  SITE,
  LANDING_PAGES,
  absoluteImage,
  categoryName,
  filterProductsForLanding,
  htmlEscape,
  landingWhatsappUrl,
} from "./seo-landing.js";
import { productSeoUrl } from "../../shared/product-seo.js";

function productUrl(product) {
  return productSeoUrl(SITE, product);
}

function money(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

function renderProductCard(product, categories) {
  const img = absoluteImage(product);
  const cat = categoryName(categories, product.cat);
  const stock = Number(product.stock || 0);
  const oem = product.oem ? `<div class="muted">OEM: ${htmlEscape(String(product.oem).slice(0, 90))}</div>` : "";
  return `
    <article class="product-card">
      <a href="${productUrl(product)}" class="image-link" aria-label="${htmlEscape(product.name)}">
        <img src="${htmlEscape(img)}" alt="${htmlEscape(product.name)}" loading="lazy" decoding="async">
      </a>
      <div class="product-body">
        <a href="${productUrl(product)}" class="product-title">${htmlEscape(product.name)}</a>
        <div class="meta">${htmlEscape(product.brand || "Ekersan")} · ${htmlEscape(product.sku || "")}</div>
        <div class="muted">${htmlEscape(cat)}</div>
        ${oem}
        <div class="row">
          <strong>${money(product.price)}</strong>
          <span class="${stock > 0 ? "stock" : "nostock"}">${stock > 0 ? `Stokta ${stock} adet` : "Stok sorunuz"}</span>
        </div>
        <a class="mini-cta" href="${productUrl(product)}">Ürünü incele</a>
      </div>
    </article>`;
}

export function renderLanding(page, products, categories) {
  const matched = filterProductsForLanding(products, page, 24);
  const canonical = `${SITE}/${page.slug}`;
  const firstImage = matched[0] ? absoluteImage(matched[0]) : `${SITE}/img/site/frenciniz-logo-real-og.jpg`;
  const categoryLinks = [...new Set(page.cats || [])]
    .map(cat => `<a href="${SITE}/${cat}">${htmlEscape(categoryName(categories, cat))}</a>`)
    .join("");
  const itemList = matched.slice(0, 12).map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: productUrl(product),
    name: product.name,
  }));
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.heading,
      description: page.description,
      url: canonical,
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
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
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
      function trackLead(kind, href) {
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
        if (normalized.indexOf('wa.me') !== -1 || normalized.indexOf('whatsapp') !== -1) trackLead('whatsapp', href);
        else if (normalized.indexOf('tel:') === 0) trackLead('phone', href);
        else if (normalized.indexOf('mailto:') === 0) trackLead('email', href);
      }, true);
    })();
  </script>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    :root{--orange:#ff6000;--dark:#171717;--muted:#666;--line:#e8e8e8;--soft:#f7f7f7}
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#222;background:#fff;line-height:1.55}
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
    .content{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:34px}
    .panel{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:20px}
    .links{display:flex;flex-wrap:wrap;gap:8px}.links a{padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px}
    .footer{border-top:1px solid var(--line);padding:20px;color:#666;font-size:13px;text-align:center}
    @media(max-width:900px){.hero-inner{grid-template-columns:1fr}.products{grid-template-columns:repeat(2,minmax(0,1fr))}.content{grid-template-columns:1fr}h1{font-size:30px}.trust{grid-template-columns:1fr 1fr}}
    @media(max-width:560px){.bar{align-items:flex-start;flex-direction:column}.hero-inner{padding-top:28px}.products{grid-template-columns:1fr}.trust{grid-template-columns:1fr}.lead{font-size:16px}}
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
  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="eyebrow">Stoklu ürün · OEM kodu ile teyit</div>
        <h1>${htmlEscape(page.heading)}</h1>
        <p class="lead">${htmlEscape(page.description)} Parça kodu, OEM numarası veya araç modelini gönderin; doğru ürünü hızlıca teyit edelim.</p>
        <div class="cta-row">
          <a class="cta" href="${landingWhatsappUrl(page)}">WhatsApp'tan fiyat al</a>
          <a class="cta secondary" href="tel:+905456087008">Hemen ara</a>
        </div>
      </div>
      <div class="trust">
        <div><strong>${matched.length || products.length} ürün</strong>İlgili stok ve alternatifler</div>
        <div><strong>14:00'a kadar</strong>Stoklu üründe aynı gün kargo</div>
        <div><strong>3000 TL üzeri</strong>Standart kargo ücretsiz</div>
        <div><strong>ECE R-90</strong>Üretici garantili fren aksamı</div>
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
      ${matched.map(product => renderProductCard(product, categories)).join("\n")}
    </section>
    <section class="content">
      <div class="panel">
        <h2>${htmlEscape(page.heading)} seçerken nelere bakılır?</h2>
        <p>${htmlEscape(page.primaryTerm)} için ${htmlEscape(page.part)} seçerken ürün kodu, OEM numarası, araç modeli, dingil tipi ve ölçü uyumluluğu beraber kontrol edilmelidir. Yanlış parça hem montaj süresini uzatır hem de aracın fren güvenliğini riske atar.</p>
        <p>Frenciniz, Dumanlar Ticaret çatısı altında ağır vasıta fren aksamında stoklu ürün, hızlı teyit ve Türkiye geneli kargo desteği sunar. Elinizdeki eski parçanın kodunu veya fotoğrafını WhatsApp hattımıza göndererek doğru ürünü hızlıca bulabilirsiniz.</p>
      </div>
      <aside class="panel">
        <h2>İlgili Kategoriler</h2>
        <div class="links">${categoryLinks}</div>
        <p class="muted" style="margin-top:16px">Uyumluluk teyidi için parça kodu veya OEM numarası göndermeniz yeterli.</p>
        <a class="cta" href="${landingWhatsappUrl(page)}" style="width:100%;margin-top:6px">Kod gönder, teklif al</a>
      </aside>
    </section>
  </main>
  <footer class="footer">
    Frenciniz · Dumanlar Ticaret · Hızırbey Mah. 1509 Sok. No:24, Isparta · info@frenciniz.com
  </footer>
</body>
</html>`;
}

export function renderLandingIndex() {
  const links = LANDING_PAGES.map(page => `<li><a href="${SITE}/${page.slug}">${htmlEscape(page.heading)}</a></li>`).join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Frenciniz SEO Sayfaları</title><meta name="robots" content="noindex"></head><body><h1>Frenciniz SEO Sayfaları</h1><ul>${links}</ul></body></html>`;
}
