// NOT: Hukuki gözden geçirme gerekir. Bu metin bir şablondur; köşeli parantezli
// alanlar doldurulmadan ve bir hukuk danışmanı onaylamadan yayına alınmamalıdır.
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: { absolute: "KVKK Aydınlatma Metni | RestaurantPOS" },
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında RestaurantPOS kişisel veri işleme süreçlerine ilişkin aydınlatma metni.",
}

const processedDataCategories = [
  { category: "Kimlik", examples: "Ad, soyad" },
  { category: "İletişim", examples: "E-posta adresi, telefon numarası" },
  { category: "Müşteri işlem", examples: "Abonelik planı, sipariş ve fatura kayıtları, destek talepleri" },
  { category: "İşlem güvenliği", examples: "IP adresi, oturum ve erişim kayıtları (log), cihaz/tarayıcı bilgisi" },
  { category: "Pazarlama", examples: "Çerez kayıtları, iletişim tercihi (yalnızca açık rıza ile)" },
]

const processingPurposes = [
  "Üyelik, abonelik ve sözleşme süreçlerinin kurulması ve yürütülmesi",
  "Platform hizmetlerinin sunulması, işletme ve operasyon kayıtlarının tutulması",
  "Faturalandırma, tahsilat ve finansal mutabakat süreçlerinin yürütülmesi",
  "Destek taleplerinin karşılanması ve kullanıcı iletişiminin yönetilmesi",
  "Bilgi güvenliğinin sağlanması, yetkisiz erişimin önlenmesi ve kayıt altına alınması",
  "Mevzuattan doğan saklama, bildirim ve bilgi verme yükümlülüklerinin yerine getirilmesi",
]

const legalBases = [
  { basis: "KVKK m.5/2-c", detail: "Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması" },
  { basis: "KVKK m.5/2-ç", detail: "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi" },
  { basis: "KVKK m.5/2-e", detail: "Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması" },
  { basis: "KVKK m.5/2-f", detail: "Temel hak ve özgürlüklere zarar vermemek kaydıyla meşru menfaat" },
  { basis: "KVKK m.5/1", detail: "Açık rıza (pazarlama iletişimi ve zorunlu olmayan çerezler için)" },
]

const dataSubjectRights = [
  "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
  "İşlenmişse buna ilişkin bilgi talep etme",
  "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
  "Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme",
  "Eksik veya yanlış işlenmişse düzeltilmesini isteme",
  "KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme",
  "Düzeltme, silme ve yok etme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme",
  "Münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme",
  "Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme",
]

export default function KvkkPage() {
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
            KVKK Aydınlatma Metni
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) m.10 uyarınca hazırlanmıştır. Son
            güncelleme: 16 Temmuz 2026
          </p>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <article className="mx-auto max-w-3xl space-y-12 px-5 sm:px-8">
          <section aria-labelledby="kvkk-veri-sorumlusu">
            <h2 id="kvkk-veri-sorumlusu" className="font-display text-2xl font-semibold">
              1. Veri sorumlusu
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Kişisel verileriniz; <strong>[Şirket Unvanı]</strong> (&ldquo;Şirket&rdquo;) tarafından,{" "}
              <strong>[Ticaret Sicil No / MERSİS No]</strong> sicil numarasıyla kayıtlı{" "}
              <strong>[Şirket Adresi]</strong> adresinde, RestaurantPOS restoran yönetim platformunun
              (&ldquo;Platform&rdquo;) işletilmesi kapsamında veri sorumlusu sıfatıyla işlenmektedir.
            </p>
          </section>

          <section aria-labelledby="kvkk-islenen-veriler">
            <h2 id="kvkk-islenen-veriler" className="font-display text-2xl font-semibold">
              2. İşlenen kişisel veriler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Platforma üye olmanız, işletme hesabı oluşturmanız veya bizimle iletişime geçmeniz hâlinde aşağıdaki veri
              kategorileri işlenebilmektedir:
            </p>
            <div className="mt-5 grid gap-px border border-gray-200 bg-gray-200">
              {processedDataCategories.map((item) => (
                <div key={item.category} className="grid gap-1 bg-white p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <p className="text-sm font-semibold text-gray-950">{item.category}</p>
                  <p className="text-sm leading-6 text-gray-600">{item.examples}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Ödeme kartı bilgileri Şirket sistemlerinde saklanmaz; ödeme işlemleri yetkili ödeme kuruluşları
              aracılığıyla gerçekleştirilir.
            </p>
          </section>

          <section aria-labelledby="kvkk-amaclar">
            <h2 id="kvkk-amaclar" className="font-display text-2xl font-semibold">
              3. İşleme amaçları
            </h2>
            <ul className="mt-4 space-y-3">
              {processingPurposes.map((purpose) => (
                <li key={purpose} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2.5 h-1 w-3 shrink-0 bg-orange-600" aria-hidden="true" />
                  {purpose}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="kvkk-hukuki-sebepler">
            <h2 id="kvkk-hukuki-sebepler" className="font-display text-2xl font-semibold">
              4. Hukuki sebepler
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Kişisel verileriniz, KVKK m.5&apos;te öngörülen aşağıdaki hukuki sebeplere dayanılarak işlenir:
            </p>
            <div className="mt-5 grid gap-px border border-gray-200 bg-gray-200">
              {legalBases.map((item) => (
                <div key={item.basis} className="grid gap-1 bg-white p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <p className="text-sm font-semibold text-gray-950">{item.basis}</p>
                  <p className="text-sm leading-6 text-gray-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="kvkk-aktarim">
            <h2 id="kvkk-aktarim" className="font-display text-2xl font-semibold">
              5. Kişisel verilerin aktarılması
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Kişisel verileriniz; yukarıda sayılan amaçlarla sınırlı olmak üzere, KVKK m.8 ve m.9&apos;daki şartlara
              uygun şekilde barındırma ve bulut altyapı sağlayıcılarına (veritabanı ve kimlik doğrulama hizmeti sunan
              Supabase dâhil), ödeme kuruluşlarına, hukuk ve mali müşavirlik hizmeti alınan iş ortaklarına ve talep
              hâlinde yetkili kamu kurum ve kuruluşlarına aktarılabilir. Bulut altyapı sağlayıcılarının sunucularının
              yurt dışında bulunması hâlinde aktarım, KVKK m.9&apos;da öngörülen güvencelere uygun olarak yapılır.
            </p>
          </section>

          <section aria-labelledby="kvkk-toplama-yontemi">
            <h2 id="kvkk-toplama-yontemi" className="font-display text-2xl font-semibold">
              6. Toplama yöntemi
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Kişisel verileriniz; Platform üzerindeki kayıt ve iletişim formları, çerezler ve benzeri teknolojiler,
              e-posta yazışmaları ve destek kanalları aracılığıyla tamamen veya kısmen otomatik yollarla toplanır.
            </p>
          </section>

          <section aria-labelledby="kvkk-haklar">
            <h2 id="kvkk-haklar" className="font-display text-2xl font-semibold">
              7. İlgili kişi olarak haklarınız
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">KVKK m.11 uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="mt-4 space-y-3">
              {dataSubjectRights.map((right) => (
                <li key={right} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2.5 h-1 w-3 shrink-0 bg-orange-600" aria-hidden="true" />
                  {right}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="kvkk-basvuru">
            <h2 id="kvkk-basvuru" className="font-display text-2xl font-semibold">
              8. Başvuru yolu
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              Haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ&apos;e uygun
              olarak; yazılı şekilde <strong>[Şirket Adresi]</strong> adresine veya kayıtlı elektronik posta (KEP)
              adresimiz <strong>[KEP Adresi]</strong> üzerinden iletebilirsiniz. Başvurularınız, talebin niteliğine
              göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
            </p>
            <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sorularınız için</p>
              <a
                href={`mailto:${contactEmail}?subject=KVKK%20ba%C5%9Fvurusu`}
                className="mt-2 inline-block border-b border-orange-600/40 pb-0.5 text-sm font-medium text-orange-700 transition-colors hover:border-orange-600"
              >
                {contactEmail}
              </a>
            </div>
          </section>

          <p className="border-t border-gray-200 pt-6 text-xs leading-5 text-gray-500">
            Çerez kullanımı ve altyapı güvenliğine ilişkin ayrıntılar için{" "}
            <Link href="/privacy" className="font-medium text-gray-950 underline underline-offset-2">
              Gizlilik Politikası
            </Link>
            &apos;nı inceleyebilirsiniz.
          </p>
        </article>
      </section>
    </main>
  )
}
