# Katkıda Bulunma Rehberi

Restaurant POS projesine katkıda bulunmayı düşündüğünüz için teşekkür ederiz! Bu rehber, projeye nasıl katkıda bulunabileceğinizi açıklamaktadır.

## 📋 İçindekiler

- [Davranış Kuralları](#davranış-kuralları)
- [Nasıl Katkıda Bulunabilirim?](#nasıl-katkıda-bulunabilirim)
- [Geliştirme Süreci](#geliştirme-süreci)
- [Kod Standartları](#kod-standartları)
- [Commit Mesajları](#commit-mesajları)
- [Pull Request Süreci](#pull-request-süreci)
- [Hata Raporlama](#hata-raporlama)
- [Özellik İstekleri](#özellik-istekleri)

## 🤝 Davranış Kuralları

Bu proje ve topluluğu açık ve misafirperver tutmak için, katılımcıların aşağıdaki davranış kurallarına uyması beklenir:

- Diğer katılımcılara saygılı ve yapıcı olun
- Farklı bakış açılarını ve deneyimleri hoş karşılayın
- Yapıcı eleştirileri nezaketle kabul edin
- Topluluk için en iyisine odaklanın
- Diğer topluluk üyelerine empati gösterin

## 💡 Nasıl Katkıda Bulunabilirim?

### Hata Bildirimi

Bir hata buldunuz mu? Lütfen GitHub Issues'da yeni bir issue açın ve aşağıdaki bilgileri ekleyin:

- Hatanın açık ve detaylı açıklaması
- Hatayı yeniden oluşturma adımları
- Beklenen davranış
- Gerçekleşen davranış
- Ekran görüntüleri (varsa)
- Tarayıcı/işletim sistemi bilgileri
- İlgili log kayıtları

### Özellik Önerisi

Yeni bir özellik önermek için:

1. Önce mevcut issues'ları kontrol edin
2. Benzer bir öneri yoksa yeni issue açın
3. Özelliği detaylı açıklayın
4. Kullanım senaryolarını belirtin
5. Varsa mockup veya örnek ekleyin

### Dokümantasyon

Dokümantasyonu geliştirmek için:

- README.md'yi güncelleyin
- Kod yorumları ekleyin
- Örnekler oluşturun
- Kullanım kılavuzları yazın

### Kod Katkısı

1. Issue'ları kontrol edin veya yeni issue açın
2. Issue'ya yorum yaparak üzerinde çalışacağınızı bildirin
3. Geliştirme sürecini takip edin (aşağıya bakın)

## 🔧 Geliştirme Süreci

### 1. Repository'yi Fork Edin

```bash
# GitHub üzerinden fork butonuna tıklayın
# Sonra local'e klonlayın
git clone https://github.com/YOUR_USERNAME/restoranpos.git
cd restoranpos
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
pnpm install
```

### 3. Branch Oluşturun

```bash
git checkout -b feature/your-feature-name
# veya
git checkout -b fix/your-bug-fix
```

Branch isimlendirme kuralları:
- `feature/` - Yeni özellikler için
- `fix/` - Hata düzeltmeleri için
- `docs/` - Dokümantasyon güncellemeleri için
- `refactor/` - Kod refactoring için
- `test/` - Test eklemeleri için
- `chore/` - Diğer değişiklikler için

### 4. Geliştirme Yapın

```bash
# Development server'ı başlatın
npm run dev

# Testleri çalıştırın
npm test

# Linting kontrolü
npm run lint
```

### 5. Değişiklikleri Commit Edin

```bash
git add .
git commit -m "feat: Add new feature description"
```

### 6. Push ve Pull Request

```bash
git push origin feature/your-feature-name
```

GitHub'da pull request oluşturun.

## 📝 Kod Standartları

### TypeScript

- Strict mode kullanın
- Type safety'e dikkat edin
- `any` tipinden kaçının
- Interface'leri tercih edin

```typescript
// İyi ✅
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): User {
  // ...
}

// Kötü ❌
function getUser(id: any): any {
  // ...
}
```

### React Components

- Functional components kullanın
- Custom hooks oluşturun
- Props tiplerini tanımlayın
- Memoization kullanın (gerektiğinde)

```typescript
// İyi ✅
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// Kötü ❌
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

### Styling

- Tailwind CSS utility classes kullanın
- Custom CSS gerektiğinde module.css kullanın
- Responsive design prensiplerini takip edin
- Dark mode desteği ekleyin

```typescript
// İyi ✅
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
  {/* ... */}
</div>

// Kötü ❌
<div style={{ display: 'flex', padding: '16px' }}>
  {/* ... */}
</div>
```

### File Organization

```
component-name/
├── ComponentName.tsx        # Ana component
├── ComponentName.test.tsx   # Test dosyası
├── ComponentName.module.css # CSS (gerekirse)
└── index.ts                # Export
```

## 📝 Commit Mesajları

Conventional Commits formatını kullanıyoruz:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Yeni özellik
- `fix`: Hata düzeltmesi
- `docs`: Dokümantasyon
- `style`: Kod formatı
- `refactor`: Kod refactoring
- `test`: Test ekleme/güncelleme
- `chore`: Diğer değişiklikler
- `perf`: Performans iyileştirmesi

### Örnekler

```bash
# Yeni özellik
feat(orders): Add real-time order tracking

# Hata düzeltmesi
fix(cart): Fix total calculation error

# Dokümantasyon
docs(readme): Update installation instructions

# Refactoring
refactor(api): Simplify error handling logic

# Test
test(utils): Add tests for formatCurrency function
```

## 🔍 Pull Request Süreci

### PR Oluşturmadan Önce

- [ ] Kodunuz test edildi mi?
- [ ] Linting hataları var mı?
- [ ] Dokümantasyon güncellendi mi?
- [ ] Commit mesajları uygun mu?
- [ ] Branch güncel mi?

### PR Şablonu

```markdown
## Açıklama
Bu PR'ın amacını kısaca açıklayın.

## Değişiklik Tipi
- [ ] Hata düzeltmesi (bug fix)
- [ ] Yeni özellik (feature)
- [ ] Breaking change
- [ ] Dokümantasyon

## Yapılan Değişiklikler
- Değişiklik 1
- Değişiklik 2

## Test Edildi Mi?
- [ ] Evet
- [ ] Hayır

## Test Senaryoları
1. Senaryo 1
2. Senaryo 2

## Ekran Görüntüleri
(Varsa ekleyin)

## İlgili Issue
Closes #123
```

### Review Süreci

1. En az bir onay gereklidir
2. Tüm testler başarılı olmalıdır
3. Kod standartlarına uygun olmalıdır
4. Çakışmalar çözülmüş olmalıdır

## 🐛 Hata Raporlama

Hata raporu oluştururken [GitHub Issues](https://github.com/uorta22/restoranpos/issues) kullanın.

### Issue Şablonu

```markdown
## Hata Açıklaması
Hatanın net ve öz açıklaması.

## Yeniden Oluşturma Adımları
1. '...' sayfasına git
2. '...' butonuna tıkla
3. Aşağı kaydır
4. Hatayı gör

## Beklenen Davranış
Olmasını beklediğiniz davranış.

## Gerçekleşen Davranış
Gerçekte ne oldu.

## Ekran Görüntüleri
Varsa ekleyin.

## Ortam Bilgileri
- İşletim Sistemi: [örn. macOS 13.0]
- Tarayıcı: [örn. Chrome 120]
- Sürüm: [örn. 1.0.0]

## Ek Bilgiler
Diğer önemli detaylar.
```

## ✨ Özellik İstekleri

Yeni özellik önerileriniz için:

```markdown
## Özellik Açıklaması
Özelliği detaylı açıklayın.

## Motivasyon
Bu özellik neden gerekli?

## Önerilen Çözüm
Özelliğin nasıl çalışmasını istiyorsunuz?

## Alternatifler
Düşündüğünüz diğer çözümler var mı?

## Ek Bilgiler
Mockup, wireframe, vb.
```

## 🧪 Test Yazma

Her yeni özellik için test yazın:

```typescript
import { describe, it, expect } from '@jest/globals'
import { yourFunction } from '@/lib/your-module'

describe('YourFunction', () => {
  it('should do something', () => {
    const result = yourFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(yourFunction('')).toBe('')
    expect(yourFunction(null)).toBe(null)
  })
})
```

## 📚 Kaynaklar

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## ❓ Sorular

Sorularınız için:

- GitHub Discussions kullanın
- Issue açın
- E-posta gönderin

## 🙏 Teşekkürler

Katkılarınız için teşekkür ederiz! Her katkı, projeyi daha iyi hale getirir.

---

Mutlu kodlamalar! 🚀
