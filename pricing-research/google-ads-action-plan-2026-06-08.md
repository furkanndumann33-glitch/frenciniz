# Frenciniz Google Ads Aksiyon Plani - 2026-06-08

## Mevcut Durum

- Google Ads etiketi sitede kurulu: `AW-18146656139`.
- Site WhatsApp, telefon ve e-posta tiklamalarini `generate_lead`, `whatsapp_click`, `phone_click`, `email_click` olarak gtag ile gonderiyor.
- Google Ads'te gercek donusum sayilmasi icin Google Ads donusum aksiyonundaki `CONVERSION_LABEL` gerekli. Label olmadan `gtag('event', 'conversion', { send_to: 'AW-.../LABEL' })` eklemek dogru olmaz.
- Butce onayi olmadan kampanya yayinlanmamali. Su an hazirlik, olcum ve anahtar kelime seti hazirlandi.

## Reklam Acilinca Ilk Kampanya

- Kampanya tipi: Search.
- Hedef: WhatsApp / telefon lead.
- Ag: Sadece Google Search, Search Partners kapali.
- Konum: Turkiye geneli. Ilk optimizasyon icin Isparta, Konya, Antalya, Ankara, Izmir, Istanbul, Bursa, Adana, Mersin raporlanmali.
- Teklif: Ilk gunlerde manuel CPC veya Maximize Clicks icin dusuk limit. Donusum verisi birikince Maximize Conversions.
- Acilis sayfasi: Genel ana sayfa degil, ilgili SEO landing URL.

## En Oncelikli Reklam Gruplari

- Mercedes Actros/Axor fren diski: en sicak long-tail niyet.
- Dorse fren diski/kampana: BPW, SAF, Krone, Kogel, Schmitz, Tirsan.
- Kaliper tamir takimi: Knorr, Wabco, Meritor aramalari.
- Fren korugu ve suspansiyon korugu: agir vasita parca aramalari.
- Bijon, somun, porya kapagi: fiyat aramasi yuksek, sepete donme ihtimali iyi.

## Negatif Anahtar Kelimeler

- ucretsiz
- bedava
- nasil yapilir
- ariza
- sema
- pdf
- katalog pdf
- ikinci el
- sahibinden
- is ilani
- oyun
- oyuncak
- bisiklet
- otomobil
- binek

## Donusum Takibi

1. Google Ads panelinde `Tools > Goals > Conversions` bolumunden WhatsApp/telefon lead donusum aksiyonu bulunur veya olusturulur.
2. Aksiyonun `AW-18146656139/CONVERSION_LABEL` send_to degeri alinip siteye eklenir.
3. WhatsApp ve telefon tiklamalarinda hem `generate_lead`, hem de Google Ads `conversion` eventi gonderilir.
4. Tag Assistant ile test edilir.
5. Ilk 48 saat "Recording conversions" durumu beklenir.

## Para Harcamadan Yapilacaklar

- Search Console'da yeni sitemap tekrar gonder.
- Merchant Center urun feedini tekrar cektir.
- Google Business Profile varsa urun/kategori postlari ve WhatsApp linkleri gir.
- Instagram/Facebook organik postlarini yeni landing URL'lerle paylas.
- Tedarikci/usta WhatsApp gruplarina parca-kod odakli post paylas.
