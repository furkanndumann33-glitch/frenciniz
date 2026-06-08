# Frenciniz Google Ads Duzeltme Raporu - 2026-06-08

## Bulunan sorunlar

- Google Ads'teki eski `Satın alma işlemi` donusumu gercek satis/odeme yerine `www.frenciniz.com/urunler` sayfa yuklemesine bagliydi.
- Sitede `gtag('event', 'conversion', { send_to: 'AW-18146656139' })` labelsiz calisiyordu; Google Ads donusum aksiyonu icin `AW-ID/LABEL` gerekir.
- Hesapta WhatsApp/e-posta lead ve telefon tiklamasi icin ayri birincil donusum yoktu.
- Merchant Center oncelikli duzeltmeler sayfasinda feed kaynakli agir hata gorunmedi.

## Yapilan Google Ads islemleri

- `Kişi` hedefi altinda web sitesindeki telefon tiklamalari icin yeni birincil donusum olusturuldu.
- `Potansiyel müşteri formu gönderimi` hedefi altinda manuel web sitesi lead donusumu olusturuldu.
- Eski `Satın alma işlemi` donusumu ikincil isleme alindi; teklif optimizasyonu icin kullanilmamali.

## Siteye baglanan conversion label'lari

- WhatsApp / e-posta / genel lead: `AW-18146656139/3fAcCJ6-s7scEIv__8xD`
- Telefon tiklama: `AW-18146656139/n0u1CJu-s7scEIv__8xD`

## Beklenen durum

- Kod deploy edildikten sonra Google Ads yeni donusumleri once `Hatalı yapılandırılmış` veya `Etiket etkin değil` gibi gosterebilir.
- Canli sitede bir telefon/WhatsApp tiklamasi geldikten sonra durumun Google Ads'te oturmasi 3-24 saat surebilir.
- Reklam harcamasi artirilmayacak; once donusum olcumu, Merchant feed ve organik trafik saglam tutulacak.

## Sabah kontrol listesi

- Google Ads > Donusumler sayfasinda `Potansiyel müşteri formu gönderimi` ve `Kişi` hedeflerinin durumunu kontrol et.
- Reklam kampanyasinda teklif hedefi olarak lead/telefon donusumlerinin kullanildigini kontrol et.
- Merchant Center feed: `https://www.frenciniz.com/google-merchant-feed.xml`
- Meta katalog feed: `https://www.frenciniz.com/meta-catalog-feed.csv`
