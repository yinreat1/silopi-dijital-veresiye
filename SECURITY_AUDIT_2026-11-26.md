# SilopiDijital Veresiye — Güvenlik İnceleme Raporu
Tarih: 26 Kasım 2026
İncelenen yayın: https://silopidijitalveresiye.vercel.app/
Kaynak depo: yinreat1/silopi-dijital-veresiye
İncelenen Supabase projesi: ukfeuojhigxxxlnhsmls (kişisel Yunus ProPOS)

## Yönetici özeti
Portalın kaynak kodu ve canlı Supabase Edge Function sürümleri incelendi. Uygulama, müşteri kodlarını HMAC ile doğruluyor; müşteri oturumlarını imzalıyor; yönetici PIN'ini ProPOS personel kaydı üzerinden doğruluyor ve yönetici oturumunu 30 dakika ile sınırlıyor. Portal API'si yalnızca iki izinli Edge Function'a yönlendiriliyor ve müşteri yanıtına tahsilat hareketleri eklenmiyor.

Önemli bulgu: Müşteri alışveriş geçmişi ve yönetici son aktivite alanı, kimliği olmayan eski satışları müşteri adıyla eşleştirebiliyordu. Aynı ada sahip iki müşteri veya silinip yeniden açılmış müşteri kayıtları arasında veri karışması riski vardır. Bu branch'te isim tabanlı eşleştirme kaldırıldı; yalnızca doğrulanmış customer_id üzerinden kayıt döndürülür.

## Bulgu ve riskler
1. Yüksek — Kimliksiz eski satışların adla eşleştirilmesi
   - Önceki login Edge Function, customer_id NULL olan satışları customer_name ile eşleştiriyordu.
   - Yönetici son aktivite hesabı da isim -> müşteri ID haritası kullanıyordu.
   - Canlı veritabanı salt-okunur sayımında 233 kimliksiz veresiye/karmalı satış, bunların 7'sinde mevcut müşteri adı eşleşmesi görüldü. Bu 7 kayıt yanlış kişiye ait olabilir; sahiplik kanıtı yoktur.
   - Düzeltme: Müşteri geçmişi ve yönetici son aktivite alanı yalnızca customer_id kullanır. Kimliği belirsiz eski satışlar otomatik olarak hiçbir müşteriye bağlanmaz.

2. Orta — Giriş deneme sınırlamasının IP kaynağı
   - Edge Function, x-veresiye-client-ip başlığını doğrudan okuyordu.
   - Vercel proxy kodu istemciden gelen aynı isimli başlığı yok sayıp x-forwarded-for ilk değerini aktarıyor; bu davranışın regresyon testi mevcut.
   - Ancak Edge Function URL'si doğrudan erişilebilir ve platform proxy zinciri dışından özel başlık gönderme/başlık güveni ayrıca sertleştirilmelidir. Şu an bu riskin tam kapandığı iddia edilmez.

3. Orta/Yüksek — Ortak ProPOS Supabase anonim Data API izinleri
   - Önceki canlı denetim, anon rolünün customers, sales, sale_items ve customer_payments gibi ProPOS tablolarında SELECT izinleri olduğunu gösterdi.
   - Portal frontend'i bu tablolara doğrudan bağlanmaz; kendi sunucu tarafı Edge Function'larını kullanır. Ancak aynı Supabase projesindeki mevcut anonim izinler portal dışında da veri erişimi riski oluşturur.
   - Bu izinler ProPOS masaüstü uygulamasının mevcut çalışma biçimini etkileyebileceği için bu branch'te revoke edilmedi. ProPOS personel oturumu/server API mimarisi tamamlanmadan kapatılmamalıdır.

4. Orta — CORS
   - Supabase Edge Function ortak HTTP yanıtları Access-Control-Allow-Origin: * döndürüyor.
   - CORS kimlik doğrulama yerine geçmez; aynı-origin Vercel proxy kullanımıyla daraltılabilir. Ancak ProPOS yönetici istemcisi Edge Function'ı doğrudan çağırıyor olabilir; çağrı kaynağı doğrulanmadan CORS değiştirilmedi.

5. Düşük/İyileştirme — Giriş token boyutu
   - Müşteri oturum token'ı için makul bir üst boyut sınırı eklendi (4096 karakter).

## Bu branch'te yapılan kod değişiklikleri
- Login Edge Function: alışveriş geçmişi sorgusu sadece doğrulanmış customer_id ile yapılır; customer_name üzerinden arama kaldırıldı.
- Admin Edge Function: son aktivite yalnızca customer_id üzerinden hesaplanır; isim haritası kaldırıldı.
- Güvenlik statik denetimi: isim tabanlı eşleştirme yeniden eklenirse kontrol başarısız olur.
- Regresyon testi: login/admin isim tabanlı eşleştirme yapamaz; login müşteri ID'siyle sınırlandırılmalıdır.
- Uzun müşteri oturum token'ları reddedilir.

## Test ve doğrulama durumu
- GitHub ana dalındaki kaynaklar ve canlı Edge Function sürümleri karşılaştırıldı. Canlı fonksiyonlar ACTIVE idi: login v6, admin v3.
- Kaynak değişiklikleri ayrı güvenlik branch'ine işlendi: security/portal-customer-isolation-2026-11-26.
- Değişen dosyalar: login Edge Function, admin Edge Function, scripts/check-security.mjs, tests/edge-routing-regression.cjs.
- Canlı DB'de yalnızca SELECT sayımları yapıldı; 233 kimliksiz veresiye/karmalı satış ve 7 ad eşleşmesi bulundu. Hiçbir müşteri, satış, bakiye veya tahsilat değiştirilmedi.
- Tam npm run check, Deno typecheck, Vercel Preview ve gerçek test müşteri girişi bu ortamda çalıştırılamadı. Canlı Vercel URL'sine dış ağdan erişim bu oturumda DNS çözümleme hatası verdi. Bu nedenle değişiklikler henüz production'a deploy edilmedi ve tam uçtan uca test edildiği iddia edilmez.

## Yayına alma öncesi zorunlu adımlar
1. GitHub PR üzerinde CI/typecheck/security regresyon testlerini çalıştır.
2. Vercel Preview dağıtımında /api/veresiye/health, yanlış kod (401), aşırı gövde (413), tanımsız fonksiyon (404), geçerli kontrollü test müşteri girişi ve yönetici PIN akışını test et.
3. Aynı ada sahip iki test müşterisi oluşturup geçmişlerin karışmadığını doğrula.
4. ProPOS uygulamasının anonim Data API bağımlılıklarını envanterle; ardından personel oturumu + server-side API geçişi ile anonim tablo izinlerini güvenle kapat.
5. Edge Function IP deneme sınırlamasını yalnızca güvenilir platform/proxy IP kaynağına bağla; doğrudan erişim ve sahte header testleri yap.
6. CORS allow-list'i ProPOS istemci akışı doğrulandıktan sonra daralt.
7. Bu adımlar geçmeden gerçek müşterilere portal QR kodu dağıtma.

## Veri güvenliği
Bu inceleme ve branch değişiklikleri müşteri finansal verilerini değiştirmedi. Canlı Edge Function'lar henüz değiştirilmedi. Production yayını yapılmadı.
