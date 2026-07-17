// NOT: Hukuki gözden geçirme gerekir. Yayına almadan önce köşeli parantezli alanlar
// doldurulmalı ve metin bir hukuk danışmanı tarafından onaylanmalıdır.
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: { absolute: "Kullanım Koşulları | RestaurantPOS" },
  description: "RestaurantPOS SaaS aboneliği kullanım koşulları: deneme süresi, ücretlendirme, sorumluluk ve fesih.",
}

const userObligations = [
  "Hesap ve ekip üyesi kimlik bilgilerinin gizliliğini korumak",
  "Platformu yürürlükteki mevzuata ve işletme faaliyetine uygun kullanmak",
  "Panele girilen menü, fiyat ve işletme bilgilerinin doğruluğunu sağlamak",
  "Platformun güvenliğini tehdit edecek girişimlerde bulunmamak",
]

export default function TermsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

  return (
    <main>
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Yasal
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Kullanım Koşulları
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
            RestaurantPOS hizmetlerini kullanarak bu koşulları kabul etmiş sayılırsınız. Son güncelleme: 16 Temmuz 2026
          </p>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <article className="mx-auto max-w-3xl space-y-12 px-5 sm:px-8">
          <section aria-labelledby="terms-taraflar">
            <h2 id="terms-taraflar" className="font-display text-2xl font-semibold">
              1. Taraflar ve kabul
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Bu koşullar, <strong>[Şirket Unvanı]</strong> (&ldquo;Şirket&rdquo;) ile RestaurantPOS platformunda
              (&ldquo;Platform&rdquo;) işletme hesabı oluşturan kullanıcı (&ldquo;Müşteri&rdquo;) arasında geçerlidir.
              Hesap oluşturarak veya Platformu kullanarak bu koşulları kabul etmiş olursunuz.
            </p>
          </section>

          <section aria-labelledby="terms-hizmet">
            <h2 id="terms-hizmet" className="font-display text-2xl font-semibold">
              2. Hizmetin tanımı
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              RestaurantPOS; sipariş, masa, mutfak, teslimat, stok, ekip ve raporlama süreçlerinin yönetildiği,
              abonelik esasıyla sunulan web tabanlı bir yazılım hizmetidir (SaaS). Hizmet, modern web tarayıcısı
              bulunan cihazlar üzerinden çevrimiçi olarak sunulur; yazılımın kopyası Müşteri&apos;ye devredilmez.
            </p>
          </section>

          <section aria-labelledby="terms-abonelik">
            <h2 id="terms-abonelik" className="font-display text-2xl font-semibold">
              3. Abonelik ve deneme süresi
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Yeni işletme hesapları, kredi kartı bilgisi istenmeksizin <strong>14 günlük ücretsiz deneme</strong>{" "}
              süresiyle başlar. Deneme süresi sonunda ücretli bir plana geçilmediği takdirde hesap erişimi
              kısıtlanabilir; deneme süresi için herhangi bir ücret tahakkuk etmez.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Ücretli abonelikler seçilen plana göre aylık veya yıllık dönemlerle faturalandırılır. Plan içerikleri ve
              güncel fiyatlar{" "}
              <Link href="/#fiyatlandirma" className="font-medium text-gray-950 underline underline-offset-2">
                fiyatlandırma sayfasında
              </Link>{" "}
              yayımlanır. Fiyat değişiklikleri mevcut fatura döneminizi etkilemez; bir sonraki dönemden itibaren
              uygulanır ve önceden duyurulur.
            </p>
          </section>

          <section aria-labelledby="terms-yukumlulukler">
            <h2 id="terms-yukumlulukler" className="font-display text-2xl font-semibold">
              4. Müşterinin yükümlülükleri
            </h2>
            <ul className="mt-4 space-y-3">
              {userObligations.map((obligation) => (
                <li key={obligation} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2.5 h-1 w-3 shrink-0 bg-orange-600" aria-hidden="true" />
                  {obligation}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Müşteri, kendi ekip üyelerinin Platform üzerindeki işlemlerinden sorumludur.
            </p>
          </section>

          <section aria-labelledby="terms-fikri-mulkiyet">
            <h2 id="terms-fikri-mulkiyet" className="font-display text-2xl font-semibold">
              5. Fikri mülkiyet ve veriler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Platforma ilişkin tüm fikri mülkiyet hakları Şirket&apos;e aittir. Müşteri&apos;nin Platforma girdiği
              menü, sipariş ve işletme verileri Müşteri&apos;ye aittir; Şirket bu verileri yalnızca hizmetin sunulması
              ve bu koşullar ile{" "}
              <Link href="/kvkk" className="font-medium text-gray-950 underline underline-offset-2">
                KVKK Aydınlatma Metni
              </Link>
              &apos;nde belirtilen amaçlarla işler.
            </p>
          </section>

          <section aria-labelledby="terms-hizmet-seviyesi">
            <h2 id="terms-hizmet-seviyesi" className="font-display text-2xl font-semibold">
              6. Hizmet seviyesi ve değişiklikler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Şirket, hizmeti kesintisiz sunmak için makul çabayı gösterir; ancak planlı bakım, altyapı sağlayıcı
              kesintileri veya mücbir sebeplerden kaynaklanan erişim kesintileri olabilir. Şirket, Platform
              özelliklerini geliştirebilir, değiştirebilir veya önceden duyurmak kaydıyla kaldırabilir.
            </p>
          </section>

          <section aria-labelledby="terms-sorumluluk">
            <h2 id="terms-sorumluluk" className="font-display text-2xl font-semibold">
              7. Sorumluluğun sınırlandırılması
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Platform &ldquo;olduğu gibi&rdquo; sunulur. Şirket; kâr kaybı, itibar kaybı veya dolaylı zararlardan
              sorumlu tutulamaz. Şirket&apos;in bu koşullardan doğan toplam sorumluluğu, her hâlükârda
              Müşteri&apos;nin zarara yol açan olaydan önceki <strong>son 12 ayda ödediği abonelik bedeliyle</strong>{" "}
              sınırlıdır. Kasıt veya ağır kusur hâlleri ile emredici mevzuattan doğan sorumluluk bu sınırlamanın
              dışındadır.
            </p>
          </section>

          <section aria-labelledby="terms-fesih">
            <h2 id="terms-fesih" className="font-display text-2xl font-semibold">
              8. Fesih
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Müşteri, aboneliğini dilediği zaman panel üzerinden veya yazılı bildirimle sonlandırabilir; fesih,
              içinde bulunulan fatura döneminin sonunda hüküm doğurur ve kalan döneme ilişkin ücret iadesi yapılmaz.
              Şirket, bu koşulların ihlali veya ödeme yükümlülüğünün yerine getirilmemesi hâlinde hesabı askıya
              alabilir veya feshedebilir. Fesih sonrasında Müşteri&apos;ye, verilerini dışa aktarması için makul bir
              süre tanınır; bu sürenin sonunda veriler silinir veya anonimleştirilir.
            </p>
          </section>

          <section aria-labelledby="terms-hukuk">
            <h2 id="terms-hukuk" className="font-display text-2xl font-semibold">
              9. Uygulanacak hukuk ve yetki
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda <strong>[Şehir]</strong> mahkemeleri
              ve icra daireleri yetkilidir.
            </p>
            <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Koşullarla ilgili sorular için</p>
              <a
                href={`mailto:${contactEmail}?subject=Kullan%C4%B1m%20ko%C5%9Fullar%C4%B1%20hakk%C4%B1nda`}
                className="mt-2 inline-block border-b border-orange-600/40 pb-0.5 text-sm font-medium text-orange-700 transition-colors hover:border-orange-600"
              >
                {contactEmail}
              </a>
            </div>
          </section>
        </article>
      </section>
    </main>
  )
}
