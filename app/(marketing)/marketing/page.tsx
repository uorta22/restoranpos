import Image from "next/image"
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChefHat,
  ClipboardList,
  Clock3,
  Mail,
  PackageCheck,
  ShieldCheck,
  TableProperties,
  Users,
  UtensilsCrossed,
} from "lucide-react"
import { PricingSection } from "@/components/marketing/pricing-section"
import { getPanelHref } from "@/lib/marketing-links"

const operationalModules = [
  {
    name: "Siparişten kasaya tek akış",
    description: "Salon, gel-al ve paket siparişlerini aynı kayıtta yönetin; durum ve ödeme bilgisini birlikte izleyin.",
    icon: ClipboardList,
  },
  {
    name: "Masa ve rezervasyon kontrolü",
    description: "Masa doluluğunu, açık adisyonları ve yaklaşan rezervasyonları tek görünümde yönetin.",
    icon: TableProperties,
  },
  {
    name: "Mutfakla senkron servis",
    description: "Yeni, hazırlanan ve servise hazır siparişleri istasyonların çalışma sırasına taşıyın.",
    icon: ChefHat,
  },
  {
    name: "Stok ve maliyet görünürlüğü",
    description: "Kritik seviyeleri, stok hareketlerini ve tedarikçi kayıtlarını günlük operasyonla birlikte takip edin.",
    icon: Boxes,
  },
  {
    name: "Rolüne uygun ekip ekranları",
    description: "Yönetici, kasiyer, garson, mutfak ve kurye rollerine uygun erişim alanları tanımlayın.",
    icon: Users,
  },
  {
    name: "Rapor ve teslimat takibi",
    description: "Satış performansını karşılaştırın; kurye atama ve teslimat durumlarını panelden yönetin.",
    icon: BarChart3,
  },
]

const operationBenefits = [
  {
    title: "Masadan mutfağa aynı kayıt",
    description: "Servis, kasa ve mutfak siparişin güncel durumunu ortak akıştan izler.",
    icon: UtensilsCrossed,
  },
  {
    title: "Stok hareketlerinde görünürlük",
    description: "Satış ve tedarik hareketleri günlük operasyonun dışında kaybolmaz.",
    icon: Boxes,
  },
  {
    title: "Karar için güncel veri",
    description: "Yönetici operasyon ve performans bilgisini tek panelden değerlendirir.",
    icon: BarChart3,
  },
]

const steps = [
  {
    number: "01",
    title: "İşletmenizi tanımlayın",
    description: "Servis modellerinizi, masa sayınızı, vergi oranınızı ve işletme bilgilerinizi kaydedin.",
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
    answer: "Masada servis, gel-al veya paket servis yapan restoran, kafe ve benzeri yiyecek-içecek işletmeleri için yapılandırılmıştır.",
  },
  {
    question: "Ekip erişimleri birbirinden ayrılıyor mu?",
    answer: "Evet. İşletme sahibi, yönetici, kasiyer, garson, mutfak ve kurye rolleri farklı menü ve işlem yetkileriyle çalışır.",
  },
  {
    question: "Ek bir cihaz almak zorunda mıyım?",
    answer: "Panel modern web tarayıcısı bulunan bilgisayar ve tabletlerde çalışır. Özel yazıcı ve kasa entegrasyonları ayrıca planlanır.",
  },
]

export default function MarketingHomePage() {
  const heroSignupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=hero")
  const pricingSignupHref = getPanelHref("/signup")
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

  return (
    <main className="overflow-hidden">
      <section className="relative isolate min-h-[620px] border-b border-gray-200 lg:min-h-[660px]">
        <Image
          src="/images/restaurant-pos-hero-generated.jpg"
          alt="Tablet üzerinden siparişleri takip eden servis görevlisi ve açık mutfak ekibi"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[60%_center] sm:object-[55%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-black/60" />

        <div className="mx-auto flex min-h-[620px] max-w-7xl items-center px-5 py-8 sm:px-8 sm:py-12 lg:min-h-[660px] lg:py-16">
          <div className="min-w-0 max-w-3xl text-white">
            <p className="text-sm font-semibold uppercase text-orange-300">Restoran operasyon platformu</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">RestaurantPOS</h1>
            <p className="mt-5 max-w-2xl text-2xl font-medium leading-tight sm:text-4xl">
              Servisten mutfağa, restoranınızın tüm akışı tek panelde.
            </p>
            <p className="mt-6 max-w-xl text-base leading-7 text-gray-200 sm:text-lg">
              Sipariş, masa, mutfak, ekip, stok ve raporlama süreçlerini günlük kullanıma uygun merkezi bir çalışma alanında yönetin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={heroSignupHref}
                className="inline-flex h-12 items-center gap-2 bg-orange-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
              >
                14 gün ücretsiz deneyin
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#fiyatlandirma"
                className="inline-flex h-12 items-center border border-white/70 px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-gray-950"
              >
                Planları inceleyin
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-200">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" aria-hidden="true" /> Kredi kartı gerekmez
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" aria-hidden="true" /> Kuruluma kaldığınız yerden devam edin
              </span>
            </div>
          </div>
        </div>

      </section>

      <section className="border-b border-gray-200 bg-white py-16 sm:py-20" aria-labelledby="restaurant-flow-title">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase text-green-800">Restoran yönetimi, tek akış</p>
            <h2 id="restaurant-flow-title" className="mt-3 text-3xl font-semibold sm:text-4xl">
              Kopuk araçlar yerine herkesin gördüğü ortak operasyon
            </h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-7 text-gray-600">
              Adisyon, mutfak, stok ve raporlama ayrı ekranlarda kaldığında servis yavaşlar ve bilgi güncelliğini kaybeder. RestaurantPOS, siparişin açılmasından teslimata kadar ekipleri aynı iş akışında buluşturur.
            </p>
            <ul className="mt-7 border-t border-gray-200">
              {operationBenefits.map((benefit) => (
                <li key={benefit.title} className="grid gap-3 border-b border-gray-200 py-5 sm:grid-cols-[2.5rem_0.8fr_1.2fr] sm:items-center">
                  <span className="grid h-10 w-10 place-items-center bg-green-50 text-green-800">
                    <benefit.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="font-semibold">{benefit.title}</p>
                  <p className="text-sm leading-6 text-gray-600">{benefit.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="ozellikler" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-orange-700">Operasyonun tamamı</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Günlük işi yavaşlatmadan her ekibi birbirine bağlayın</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Dağınık ekranlar ve kopuk takip listeleri yerine, günlük kararları tek veri kaynağı üzerinden yönetin.
            </p>
          </div>

          <div className="mt-10 grid border-l border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {operationalModules.map((module) => (
              <article key={module.name} className="min-h-64 border-b border-r border-gray-200 p-6 sm:p-7">
                <span className="grid h-10 w-10 place-items-center bg-orange-50 text-orange-700">
                  <module.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{module.name}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{module.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-20 text-white sm:py-24" aria-labelledby="product-preview-title">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-orange-300">Canlı operasyon görünümü</p>
            <h2 id="product-preview-title" className="mt-3 text-3xl font-semibold sm:text-4xl">
              Ne oluyor, sırada ne var, kim ilgileniyor?
            </h2>
            <p className="mt-5 text-base leading-7 text-gray-300">
              Sipariş durumları, mutfak sırası ve teslimat akışı ekip rolüne uygun ekranlarda güncel kalır.
            </p>
            <ul className="mt-7 space-y-4 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" aria-hidden="true" />
                Bekleyen ve geciken siparişleri hızlıca ayırt edin.
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-300" aria-hidden="true" />
                Her rol yalnızca ihtiyaç duyduğu menü ve işlemlere erişsin.
              </li>
              <li className="flex items-start gap-3">
                <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                Hazırlıktan teslimata kadar durum geçmişini koruyun.
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-md border border-white/15 bg-[#151719] shadow-2xl" aria-label="Sipariş paneli önizlemesi">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UtensilsCrossed className="h-4 w-4 text-orange-400" aria-hidden="true" />
                Akşam servisi
              </div>
              <span className="text-xs text-gray-400">12 aktif sipariş</span>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              {[
                {
                  title: "Yeni",
                  count: "4",
                  color: "text-orange-300",
                  orders: ["Masa 04 · 6 ürün", "Gel-al #184 · 3 ürün"],
                },
                {
                  title: "Hazırlanıyor",
                  count: "5",
                  color: "text-amber-200",
                  orders: ["Masa 11 · 4 ürün", "Paket #182 · 2 ürün"],
                },
                {
                  title: "Hazır",
                  count: "3",
                  color: "text-green-300",
                  orders: ["Masa 07 · 5 ürün", "Paket #179 · 4 ürün"],
                },
              ].map((column) => (
                <div key={column.title} className="min-h-72 bg-[#151719] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${column.color}`}>{column.title}</p>
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/10 px-1 text-xs">{column.count}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.orders.map((order, orderIndex) => (
                      <div key={order} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs font-medium text-white">{order}</p>
                        <p className="mt-2 text-[11px] text-gray-400">{orderIndex === 0 ? "8 dk" : "3 dk"} önce</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="nasil-calisir" className="scroll-mt-20 border-b border-gray-200 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-orange-700">Nasıl çalışır?</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">İlk siparişe giden kısa yol</h2>
          </div>
          <ol className="mt-10 grid border-t border-gray-200 lg:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="border-b border-gray-200 py-7 lg:border-b-0 lg:border-r lg:px-7 first:pl-0 last:border-r-0">
                <span className="text-sm font-semibold text-orange-700">{step.number}</span>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="hakkimizda" className="scroll-mt-20 bg-[#edf5f1] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase text-green-800">Hakkımızda</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Teknolojiyi servis akışının önüne değil, arkasına koyuyoruz</h2>
          </div>
          <div>
            <p className="text-base leading-7 text-gray-700">
              RestaurantPOS; restoran sahiplerinin, servis ekibinin, mutfağın ve kuryelerin aynı operasyon resmi üzerinde çalışabilmesi için geliştirilen web tabanlı bir yönetim platformudur.
            </p>
            <p className="mt-5 text-base leading-7 text-gray-700">
              Amacımız, günlük işi gereksiz ekranlarla ağırlaştırmadan sipariş, stok, ekip ve raporlama süreçlerini izlenebilir ve yönetilebilir hale getirmektir.
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

      <section className="border-t border-gray-200 py-20 sm:py-24" aria-labelledby="faq-title">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-orange-700">Sık sorulanlar</p>
            <h2 id="faq-title" className="mt-3 text-3xl font-semibold">Başlamadan önce merak edilenler</h2>
          </div>
          <div className="border-t border-gray-200">
            {frequentlyAskedQuestions.map((item) => (
              <details key={item.question} className="group border-b border-gray-200 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.question}
                  <span className="text-xl font-normal text-orange-700 group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="max-w-2xl pt-4 text-sm leading-6 text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="iletisim" className="scroll-mt-20 bg-orange-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-orange-100">İletişim</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Restoranınızın akışını birlikte değerlendirelim</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Plan seçimi, kurulum veya ürün kapsamı hakkında sorularınız için bize ulaşın; denemeye hazır olduğunuzda hesabınızı doğrudan oluşturun.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${contactEmail}?subject=RestaurantPOS%20hakkında%20bilgi`}
              className="inline-flex h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-orange-700 transition-colors hover:bg-gray-950 hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {contactEmail}
            </a>
            <a
              href={heroSignupHref}
              className="inline-flex h-12 items-center justify-center gap-2 border border-white px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-orange-700"
            >
              Ücretsiz hesap oluştur
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
