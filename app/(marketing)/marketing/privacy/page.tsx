// NOT: Hukuki gözden geçirme gerekir. Yayına almadan önce metin bir hukuk danışmanı tarafından onaylanmalıdır.
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: { absolute: "Gizlilik Politikası | RestaurantPOS" },
  description: "RestaurantPOS gizlilik politikası: topladığımız veriler, çerezler, analitik ve altyapı güvenliği.",
}

const cookieTypes = [
  {
    name: "Zorunlu çerezler",
    description: "Oturum açma, güvenlik ve temel platform işlevleri için gereklidir; devre dışı bırakılamaz.",
  },
  {
    name: "Tercih çerezleri",
    description: "Dil, tema ve panel yerleşimi gibi tercihlerinizi hatırlamak için kullanılır.",
  },
  {
    name: "Analitik çerezler",
    description:
      "Sayfa kullanımını anonimleştirilmiş biçimde ölçmek için yalnızca açık rızanızla kullanılır; kimliğinizi tespit etmez.",
  },
]

const securityMeasures = [
  "Tüm bağlantılar TLS ile şifrelenir; veriler şifreli kanallar üzerinden taşınır.",
  "Her işletmenin verisi satır düzeyinde erişim kurallarıyla (row level security) diğer işletmelerden izole edilir.",
  "Ekip üyeleri rol bazlı yetkilendirmeyle yalnızca görevlerinin gerektirdiği kayıtlara erişir.",
  "Erişim ve işlem kayıtları güvenlik denetimi amacıyla loglanır.",
]

export default function PrivacyPage() {
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
            Gizlilik Politikası
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
            Bu politika, RestaurantPOS web sitesi ve panelini kullanırken verilerinizin nasıl toplandığını ve
            korunduğunu açıklar. Son güncelleme: 16 Temmuz 2026
          </p>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <article className="mx-auto max-w-3xl space-y-12 px-5 sm:px-8">
          <section aria-labelledby="privacy-kapsam">
            <h2 id="privacy-kapsam" className="font-display text-2xl font-semibold">
              1. Kapsam
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Bu politika; RestaurantPOS tanıtım sitesi, yönetim paneli ve müşterilere sunulan sipariş takip sayfaları
              için geçerlidir. Kişisel verilerin işlenmesine ilişkin ayrıntılı bilgilendirme için{" "}
              <Link href="/kvkk" className="font-medium text-gray-950 underline underline-offset-2">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni inceleyebilirsiniz.
            </p>
          </section>

          <section aria-labelledby="privacy-toplanan-veriler">
            <h2 id="privacy-toplanan-veriler" className="font-display text-2xl font-semibold">
              2. Topladığımız veriler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Hesap oluştururken ad, e-posta ve işletme bilgilerinizi; platformu kullanırken sipariş, menü, stok ve
              ekip kayıtlarınızı; teknik düzeyde ise IP adresi, tarayıcı bilgisi ve oturum kayıtlarını işleriz. Ödeme
              kartı bilgileri sistemlerimizde saklanmaz.
            </p>
          </section>

          <section aria-labelledby="privacy-cerezler">
            <h2 id="privacy-cerezler" className="font-display text-2xl font-semibold">
              3. Çerezler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Platformda amaçlarına göre üç grup çerez kullanılır:
            </p>
            <div className="mt-5 grid gap-px border border-gray-200 bg-gray-200">
              {cookieTypes.map((cookie) => (
                <div key={cookie.name} className="bg-white p-5">
                  <p className="text-sm font-semibold text-gray-950">{cookie.name}</p>
                  <p className="mt-1.5 text-sm leading-6 text-gray-600">{cookie.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Zorunlu olmayan çerezleri tarayıcı ayarlarınızdan dilediğiniz zaman silebilir veya engelleyebilirsiniz;
              bu durumda bazı tercihleriniz hatırlanmayabilir.
            </p>
          </section>

          <section aria-labelledby="privacy-analitik">
            <h2 id="privacy-analitik" className="font-display text-2xl font-semibold">
              4. Analitik
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Ürünü iyileştirmek için sayfa görüntüleme ve özellik kullanımını toplu ve anonimleştirilmiş metrikler
              hâlinde ölçebiliriz. Analitik veriler bireysel kullanıcı profili oluşturmak veya reklam hedeflemesi
              yapmak için kullanılmaz, üçüncü taraflara satılmaz.
            </p>
          </section>

          <section aria-labelledby="privacy-altyapi">
            <h2 id="privacy-altyapi" className="font-display text-2xl font-semibold">
              5. Altyapı ve veri güvenliği
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Veritabanı, kimlik doğrulama ve dosya depolama hizmetleri Supabase altyapısı üzerinde çalışır. Supabase
              sunucularının bulunduğu bölgeye göre verileriniz yurt dışında barındırılabilir; bu durumda aktarım,
              yürürlükteki mevzuata uygun güvencelerle yapılır.
            </p>
            <ul className="mt-5 space-y-3">
              {securityMeasures.map((measure) => (
                <li key={measure} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2.5 h-1 w-3 shrink-0 bg-green-700" aria-hidden="true" />
                  {measure}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="privacy-saklama">
            <h2 id="privacy-saklama" className="font-display text-2xl font-semibold">
              6. Saklama süresi
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Verileriniz, üyeliğiniz devam ettiği sürece ve mevzuatın öngördüğü saklama süreleri boyunca tutulur.
              Hesabınızı kapattığınızda, yasal saklama yükümlülüğü bulunmayan veriler makul süre içinde silinir veya
              anonimleştirilir.
            </p>
          </section>

          <section aria-labelledby="privacy-degisiklik">
            <h2 id="privacy-degisiklik" className="font-display text-2xl font-semibold">
              7. Değişiklikler ve iletişim
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Bu politikada yapılacak önemli değişiklikler bu sayfada yayımlanır. Gizlilik uygulamalarımızla ilgili
              sorularınız için bize ulaşabilirsiniz.
            </p>
            <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gizlilik soruları için</p>
              <a
                href={`mailto:${contactEmail}?subject=Gizlilik%20hakk%C4%B1nda`}
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
