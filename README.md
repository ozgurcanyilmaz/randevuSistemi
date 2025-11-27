# Randevu Sistemi

Modern ve kapsamlı bir randevu yönetim sistemi. Bu sistem, sağlık kuruluşları, danışmanlık merkezleri ve benzeri işletmeler için randevu takibi, kullanıcı yönetimi ve operasyonel süreçleri yönetmek üzere tasarlanmıştır.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [API Dokümantasyonu](#api-dokümantasyonu)

## ✨ Özellikler

### Kullanıcı Rolleri ve Yetkileri

- **Admin**: Sistem yöneticisi, tüm yetkilere sahip
  - Departman ve şube yönetimi
  - Kullanıcı rolleri atama
  - Provider ve Operator'leri şubelere atama
  - Sistem geneli veri görüntüleme

- **Operator**: Operasyonel işlemler
  - Atandığı şubenin randevularını görüntüleme ve yönetme
  - Walk-in (gelişigüzel) randevu oluşturma
  - Dashboard ile istatistik görüntüleme
  - Kullanıcı arama ve bilgilerini görüntüleme

- **Provider (İlgili)**: Hizmet sağlayıcı
  - Çalışma saatleri ve mola saatleri ayarlama
  - Oturum süresi belirleme
  - Randevularını görüntüleme ve yönetme
  - Oturum (session) oluşturma ve takibi
  - Bekleyen kullanıcıları görüntüleme

- **User (Kullanıcı)**: Randevu alan kişi
  - Randevu oluşturma ve görüntüleme
  - Profil bilgilerini güncelleme
  - Randevu geçmişi

### Temel Özellikler

- 🔐 **JWT Token Tabanlı Kimlik Doğrulama**: Güvenli oturum yönetimi
- 🏢 **Çoklu Şube Desteği**: Departman ve şube bazlı organizasyon
- 📅 **Esnek Randevu Sistemi**: Tarih ve saat bazlı randevu oluşturma
- ⏰ **Çalışma Saatleri Yönetimi**: Haftalık çalışma saatleri ve mola tanımlama
- 📊 **Dashboard ve İstatistikler**: Grafiklerle görsel veri analizi
- 📱 **Responsive Tasarım**: Mobil ve tablet uyumlu arayüz
- 🔄 **Otomatik Token Yenileme**: Token süresi dolduğunda otomatik çıkış
- 🔒 **Rol Bazlı Erişim Kontrolü**: Her kullanıcı sadece yetkili olduğu verilere erişebilir
- 📝 **Oturum Yönetimi**: Provider'lar için detaylı oturum takibi

## 🛠 Teknolojiler

### Frontend
- **React 19.1.1**: Kullanıcı arayüzü kütüphanesi
- **TypeScript**: Tip güvenliği
- **Vite**: Hızlı geliştirme ortamı ve build aracı
- **React Router DOM**: Sayfa yönlendirme
- **Axios**: HTTP istekleri
- **React Hook Form**: Form yönetimi
- **Yup**: Form validasyonu
- **Recharts**: Grafik ve görselleştirme
- **Bootstrap 5**: CSS framework
- **AdminLTE**: Admin panel teması

### Backend
- **.NET 9.0**: Web API framework
- **ASP.NET Core MVC**: RESTful API
- **Entity Framework Core 8.0.8**: ORM
- **PostgreSQL**: Veritabanı
- **JWT Bearer Authentication**: Token tabanlı kimlik doğrulama
- **ASP.NET Core Identity**: Kullanıcı yönetimi
- **Swagger/OpenAPI**: API dokümantasyonu

## 📖 Kullanım

### İlk Kullanım

1. Backend ve frontend'i başlatın (yukarıdaki kurulum adımlarını takip edin).

2. Tarayıcınızda `http://localhost:5173` adresine gidin.

3. Yeni bir kullanıcı oluşturmak için "Kayıt Ol" sayfasına gidin.

4. İlk admin kullanıcısını oluşturmak için:
   - Kayıt olun
   - Veritabanında kullanıcınızın rolünü "Admin" olarak güncelleyin (veya seed data kullanın)

5. Admin olarak giriş yaptıktan sonra:
   - Departman ve şubeler oluşturun
   - Kullanıcılara roller atayın
   - Provider'ları ve Operator'leri şubelere atayın

### Migration Çalıştırma

Yeni migration'lar oluşturduğunuzda:

```bash
cd RandevuSistemi.Api
dotnet ef migrations add MigrationAdi
dotnet ef database update
```

## 📁 Proje Yapısı

```
randevuSistemi/
├── frontend/                 # React frontend uygulaması
│   ├── src/
│   │   ├── components/       # Yeniden kullanılabilir bileşenler
│   │   │   ├── AppLayout.tsx    # Ana layout ve sidebar
│   │   │   └── common/          # Ortak UI bileşenleri
│   │   ├── pages/           # Sayfa bileşenleri
│   │   │   ├── admin/       # Admin sayfaları
│   │   │   ├── operator/    # Operator sayfaları
│   │   │   ├── provider/    # Provider sayfaları
│   │   │   └── user/        # Kullanıcı sayfaları
│   │   ├── services/        # API servisleri
│   │   │   ├── api.ts       # Axios konfigürasyonu
│   │   │   └── auth.ts      # Kimlik doğrulama
│   │   ├── schemas/         # Form validasyon şemaları
│   │   ├── styles/          # Stil dosyaları
│   │   └── utils/           # Yardımcı fonksiyonlar
│   └── package.json
│
└── RandevuSistemi.Api/      # .NET backend API
    ├── Controllers/         # API controller'ları
    │   ├── AdminController.cs
    │   ├── AuthController.cs
    │   ├── OperatorController.cs
    │   ├── ProviderController.cs
    │   ├── SessionController.cs
    │   └── UserController.cs
    ├── Data/                # Veritabanı bağlamı
    │   ├── AppDbContext.cs
    │   └── SeedData.cs
    ├── Models/              # Veri modelleri
    │   ├── ApplicationUser.cs
    │   ├── DomainEntities.cs
    │   └── Session.cs
    ├── Services/            # Servis sınıfları
    │   └── ReCaptchaService.cs
    ├── Migrations/          # Entity Framework migrations
    └── Program.cs           # Uygulama giriş noktası
```

## 📚 API Dokümantasyonu

Backend çalıştığında, Swagger UI üzerinden tüm API endpoint'lerini görüntüleyebilirsiniz:

- **URL**: `http://localhost:5000`
- **Kimlik Doğrulama**: JWT Bearer token gerekli (çoğu endpoint için)

### Ana Endpoint'ler

- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi
- `GET /user/profile` - Kullanıcı profili
- `GET /admin/*` - Admin işlemleri
- `GET /operator/*` - Operator işlemleri
- `GET /provider/*` - Provider işlemleri

## 🔧 Geliştirme

### Frontend Geliştirme

```bash
cd frontend
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run lint     # Linting
```

### Backend Geliştirme

```bash
cd RandevuSistemi.Api
dotnet watch run  # Hot reload ile çalıştırma
dotnet build      # Projeyi derleme
```

### Veritabanı Migration'ları

Yeni bir migration oluşturma:
```bash
cd RandevuSistemi.Api
dotnet ef migrations add MigrationAdi --startup-project .
```

Migration'ları uygulama:
```bash
dotnet ef database update
```

## 🔒 Güvenlik

- JWT token'lar otomatik olarak süresi dolduğunda geçersiz hale gelir
- Token süresi dolduğunda kullanıcı otomatik olarak çıkış yapar
- Rol bazlı erişim kontrolü (RBAC) tüm endpoint'lerde uygulanır
- Operator'ler sadece atandıkları şubenin verilerine erişebilir
- CORS politikaları yapılandırılmıştır

**Not**: Bu README dosyası projenin mevcut durumunu yansıtmaktadır. Geliştirme sürecinde güncellenebilir.
