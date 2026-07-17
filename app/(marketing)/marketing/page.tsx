import Image from "next/image"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Mail,
  PackageCheck,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react"
import { ModuleShowcase } from "@/components/marketing/module-showcase"
import { PricingSection } from "@/components/marketing/pricing-section"
import { getPanelHref } from "@/lib/marketing-links"

const productFacts = [
  { value: "7", label: "Operasyon modülü", detail: "Sipariş, masa, mutfak, teslimat, stok, rapor, ekip" },
  { value: "6", label: "Ekip rolü", detail: "Sahipten kuryeye ayrı yetki ve ekranlar" },
  { value: "3", label: "Servis modeli", detail: "Masada servis, gel-al ve paket servis" },
  { value: "14 gün", label: "Ücretsiz deneme", detail: "Kredi kartı bilgisi istemeden" },
]

const segments = [
  {
    name: "Restoran & lokanta",
    description: "Masada servis, adisyon ve mutfak koordinasyonu ağırlıklı işletmeler.",
    modules: ["Masa & adisyon", "Mutfak ekranı", "Rezervasyon", "Raporlama"],
  },
  {
    name: "Kafe & kahveci",
    description: "Hızlı sipariş dönüşü ve gel-al yoğunluklu, kompakt ekipli işletmeler.",
    modules: ["Hızlı sipariş", "Gel-al kuyruğu", "Stok takibi", "Ekip rolleri"],
  },
  {
    name: "Paket servis odaklı",
    description: "Kuryeyle çalışan, teslimat hızının ciroya doğrudan yansıdığı işletmeler.",
    modules: ["Kurye yönetimi", "Teslimat takibi", "Müşteri takip sayfası", "Sipariş akışı"],
  },
  {
    name: "Büfe & gel-al",
    description: "Tezgahtan teslim, yüksek adetli ve kısa süreli sipariş operasyonları.",
    modules: ["Kasa ekranı", "Sipariş numarası", "Günlük rapor", "Stok uyarıları"],
  },
]

const steps = [
  {
    number: "01",
    title: "İşletmenizi tanımlayın",
    description: "Servis modellerinizi, masa sayınızı, vergi oranınızı ve işletme bilgilerinizi 4 adımlık kurulumda kaydedin.",
  },
  {
    number: "02",
    title: "Menü ve ekibi hazırlayın",
    description: "Başlangıç kategorilerini oluşturun, ürünlerinizi ekleyin ve ekip üyelerini rollerine göre davet edin.",
  },
  {
    number: "03",
    title: "Operasyonu canlı izleyin",
    description: "Siparişten mutfağa, stoktan rapora kadar günlük akışı ortak panel üzerinden takip edin.",
  },
]

const frequentlyAskedQuestions = [
  {
    question: "Deneme süresinde kredi kartı gerekiyor mu?",
    answer: "Hayır. İşletme hesabınızı kredi kartı eklemeden oluşturabilir ve 14 günlük deneme süresini başlatabilirsiniz.",
  },
  {
    question: "Hangi restoran türleri kullanabilir?",
    answer:
      "Masada servis, gel-al veya paket servis yapan restoran, kafe ve benzeri yiyecek-içecek işletmeleri için yapılandırılmıştır.",
  },
  {
    question: "Ekip erişimleri birbirinden ayrılıyor mu?",
    answer:
      "Evet. İşletme sahibi, yönetici, kasiyer, garson, mutfak ve kurye rolleri farklı menü ve işlem yetkileriyle çalışır.",
  },
  {
    question: "Ek bir cihaz almak zorunda mıyım?",
    answer:
      "Panel modern web tarayıcısı bulunan bilgisayar ve tabletlerde çalışır. Özel yazıcı ve kasa entegrasyonları ayrıca planlanır.",
  },
  {
    question: "Verilerim diğer işletmelerden ayrı mı tutuluyor?",
    answer:
      "Evet. Her işletmenin verisi satır düzeyinde erişim kurallarıyla izole edilir; ekip üyeleri yalnızca kendi işletmesinin kayıtlarını görür.",
  },
]

export default function MarketingHomePage() {
  const heroSignupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=hero")
  const pricingSignupHref = getPanelHref("/signup")
  const finalSignupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=footer-cta")
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative isolate bg-gray-950 text-white">
        <Image
          src="/images/restaurant-pos-hero-generated.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[70%_center] opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/40" />

        <div className="mx-auto max-w-7xl px-5 pb-40 pt-16 sm:px-8 sm:pb-48 sm:pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Restoran operasyon platformu
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">
              Servisten mutfağa,
              <br />
              tüm akış tek panelde.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Sipariş, masa, mutfak, teslimat, stok ve raporlama süreçlerini günlük kullanıma uygun merkezi bir çalışma
              alanında yönetin. Ekipteki herkes aynı güncel resmi görür.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={heroSignupHref}
                className="inline-flex h-12 items-center gap-2 bg-orange-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
              >
                14 gün ücretsiz deneyin
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#ozellikler"
                className="inline-flex h-12 items-center gap-2 border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-gray-950"
              >
                Modülleri inceleyin
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" aria-hidden="true" /> Kredi kartı gerekmez
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" aria-hidden="true" /> Kuruluma kaldığınız yerden devam edin
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid'i kıran ürün önizlemesi: hero ile istatistik şeridi arasında köprü */}
      <section className="relative z-10 -mt-28 sm:-mt-32" aria-label="Sipariş paneli önizlemesi">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="overflow-hidden border border-gray-200 bg-white shadow-[0_24px_80px_-24px_rgba(3,7,18,0.35)]">
            <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 sm:px-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UtensilsCrossed className="h-4 w-4 text-orange-600" aria-hidden="true" />
                Akşam servisi
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="hidden sm:inline">12 aktif sipariş</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Canlı
                </span>
              </div>
            </div>
            <div className="grid gap-px bg-gray-200 sm:grid-cols-3">
              {[
                {
                  title: "Yeni",
                  count: "4",
                  color: "text-orange-700",
                  orders: [
                    { name: "Masa 04 · 6 ürün", time: "8 dk önce" },
                    { name: "Gel-al #184 · 3 ürün", time: "3 dk önce" },
                  ],
                },
                {
                  title: "Hazırlanıyor",
                  count: "5",
                  color: "text-amber-700",
                  orders: [
                    { name: "Masa 11 · 4 ürün", time: "6 dk önce" },
                    { name: "Paket #182 · 2 ürün", time: "4 dk önce" },
                  ],
                },
                {
                  title: "Hazır",
                  count: "3",
                  color: "text-green-700",
                  orders: [
                    { name: "Masa 07 · 5 ürün", time: "1 dk önce" },
                    { name: "Paket #179 · 4 ürün", time: "şimdi" },
                  ],
                },
              ].map((column) => (
                <div key={column.title} className="bg-white p-4 sm:min-h-56 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${column.color}`}>{column.title}</p>
                    <span className="grid h-6 min-w-6 place-items-center bg-gray-100 px-1 text-xs font-medium">
                      {column.count}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {column.orders.map((order) => (
                      <div key={order.name} className="border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-950">{order.name}</p>
                        <p className="mt-1.5 text-[11px] text-gray-500">{order.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ürün gerçekleri şeridi */}
      <section className="border-b border-gray-200 bg-white pb-16 pt-14 sm:pb-20" aria-label="Ürün kapsamı">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <dl className="grid gap-px border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {productFacts.map((fact) => (
              <div key={fact.label} className="bg-white p-6 sm:p-7">
                <dd className="font-display text-4xl font-semibold text-gray-950">{fact.value}</dd>
                <dt className="mt-2 text-sm font-semibold text-gray-950">{fact.label}</dt>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">{fact.detail}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Modül vitrini */}
      <section id="ozellikler" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Modüller</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
                Operasyonun her parçası, tek veri kaynağı
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-gray-600">
              Kopuk araçlar yerine ortak akış: sipariş açıldığı anda mutfak, kasa, stok ve raporlar aynı kaydı izler.
            </p>
          </div>
          <ModuleShowcase />
        </div>
      </section>

      {/* Segmentler */}
      <section id="segmentler" className="scroll-mt-20 border-y border-gray-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-800">Kimler için?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Servis modelinize göre şekillenir
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Kurulumda seçtiğiniz servis modellerine göre panel yalnızca kullandığınız akışları öne çıkarır.
            </p>
          </div>

          <div className="mt-12 grid gap-px border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment) => (
              <article key={segment.name} className="flex min-h-72 flex-col bg-white p-6 transition-colors hover:bg-gray-50 sm:p-7">
                <h3 className="font-display text-xl font-semibold">{segment.name}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{segment.description}</p>
                <ul className="mt-auto space-y-2 pt-6">
                  {segment.modules.map((module) => (
                    <li key={module} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <span className="h-1 w-3 bg-orange-600" aria-hidden="true" />
                      {module}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Canlı operasyon (koyu bölüm) */}
      <section className="bg-gray-950 py-20 text-white sm:py-24" aria-labelledby="product-preview-title">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-300">Canlı operasyon görünümü</p>
            <h2 id="product-preview-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Ne oluyor, sırada ne var, kim ilgileniyor?
            </h2>
            <p className="mt-5 text-base leading-7 text-gray-300">
              Sipariş durumları, mutfak sırası ve teslimat akışı ekip rolüne uygun ekranlarda güncel kalır. Kağıt fiş,
              telsiz ve tahmin devre dışı.
            </p>
            <ul className="mt-8 space-y-5 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center border border-orange-400/40 text-orange-300">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">Bekleyen ve geciken siparişleri hızlıca ayırt edin.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center border border-green-400/40 text-green-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">Her rol yalnızca ihtiyaç duyduğu menü ve işlemlere erişsin.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center border border-sky-400/40 text-sky-300">
                  <PackageCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">Hazırlıktan teslimata kadar durum geçmişini koruyun.</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2" aria-hidden="true">
            {[
              { title: "Mutfak ekranı", metric: "6 sipariş sırada", note: "En eski 9 dk" },
              { title: "Teslimat", metric: "3 kurye yolda", note: "Ort. 24 dk" },
              { title: "Masalar", metric: "11 / 16 dolu", note: "2 rezervasyon yaklaşıyor" },
              { title: "Kasa", metric: "₺18.420 bugün", note: "62 sipariş kapandı" },
            ].map((tile) => (
              <div key={tile.title} className="bg-gray-950 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{tile.title}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-white">{tile.metric}</p>
                <p className="mt-2 text-xs text-gray-400">{tile.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil-calisir" className="scroll-mt-20 border-b border-gray-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Nasıl çalışır?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">İlk siparişe giden kısa yol</h2>
          </div>
          <ol className="mt-12 grid gap-px border border-gray-200 bg-gray-200 lg:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="bg-white p-7 sm:p-8">
                <span className="font-display text-5xl font-semibold text-gray-200">{step.number}</span>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="scroll-mt-20 bg-[#eef4f0] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-800">Hakkımızda</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Teknolojiyi servis akışının önüne değil, arkasına koyuyoruz
            </h2>
          </div>
          <div>
            <p className="text-base leading-7 text-gray-700">
              RestaurantPOS; restoran sahiplerinin, servis ekibinin, mutfağın ve kuryelerin aynı operasyon resmi üzerinde
              çalışabilmesi için geliştirilen web tabanlı bir yönetim platformudur.
            </p>
            <p className="mt-5 text-base leading-7 text-gray-700">
              Amacımız, günlük işi gereksiz ekranlarla ağırlaştırmadan sipariş, stok, ekip ve raporlama süreçlerini
              izlenebilir ve yönetilebilir hale getirmektir.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-green-700 pl-4">
                <p className="font-semibold">Operasyon odaklı</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">Gösterişten önce hız, netlik ve tekrar eden işlerin ergonomisi.</p>
              </div>
              <div className="border-l-2 border-orange-600 pl-4">
                <p className="font-semibold">Güvenli temelde</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">Rol bazlı erişim, izole işletme verisi ve kontrollü yetkiler.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection signupHref={pricingSignupHref} />

      {/* SSS */}
      <section id="sss" className="scroll-mt-20 border-t border-gray-200 py-20 sm:py-24" aria-labelledby="faq-title">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Sık sorulanlar</p>
            <h2 id="faq-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Başlamadan önce merak edilenler
            </h2>
          </div>
          <div className="border-t border-gray-200">
            {frequentlyAskedQuestions.map((item) => (
              <details key={item.question} className="group border-b border-gray-200 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.question}
                  <span className="text-xl font-normal text-orange-700 transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pt-4 text-sm leading-6 text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Son CTA */}
      <section id="iletisim" className="scroll-mt-20 bg-orange-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-100">İletişim</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Restoranınızın akışını birlikte değerlendirelim
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Plan seçimi, kurulum veya ürün kapsamı hakkında sorularınız için bize ulaşın; denemeye hazır olduğunuzda
              hesabınızı doğrudan oluşturun.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${contactEmail}?subject=RestaurantPOS%20hakkında%20bilgi`}
              className="inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-orange-700 transition-colors hover:bg-gray-950 hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {contactEmail}
            </a>
            <a
              href={finalSignupHref}
              className="inline-flex h-12 items-center justify-center gap-2 border border-white px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-orange-700"
            >
              Ücretsiz hesap oluştur
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
