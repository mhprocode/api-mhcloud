# API MhCloud
Selamat datang di MhCloud API, sebuah platform API yang dibangun dengan arsitektur modern Node.js. Proyek ini dirancang sebagai layanan SaaS (Software as a Service) yang memungkinkan pengguna mendaftar, mendapatkan API key, dan mengakses berbagai data yang di-scrape, lengkap dengan limit (Gratis/Premium) dan panel admin penuh untuk manajemen.

# Fitur Utama ✨
Proyek ini dibangun dari awal untuk menjadi terstruktur dan mudah dikembangkan.
- Sistem SaaS Multi-User: User dapat mendaftar untuk akun Gratis (limit 100/bulan) atau Premium.
- API Key Otomatis: API Key dibuat secara otomatis saat registrasi dan terikat langsung ke akun pengguna.
- Manajemen User (Admin): Panel admin penuh untuk melihat, mengedit (role, limit, expired), mem-banned, dan menghapus user.
- Keamanan & Logging (Admin):
    1. IP Logging: Setiap request API dicatat IP address-nya.
    2. Manajemen Ban IP: Admin dapat memblokir IP tertentu agar tidak bisa mengakses API.
    3. Histori Request: Log lengkap setiap panggilan API (endpoint, user, IP, status code).
- Middleware Cerdas: Satu middleware (authApiKey) secara otomatis menangani semua validasi keamanan untuk setiap endpoint baru:
    1. Cek IP Banned
    2. Cek User Banned
    3. Cek Validitas API Key
    4. Cek Tanggal Expired (untuk Premium)
    5. Cek Rate Limit (Hit vs Limit Bulanan)
- Dokumentasi Dinamis: Sistem dokumentasi modular. Cukup tambahkan satu file .md baru dan halaman dokumentasi publik akan otomatis ter-update.

# Teknologi yang Digunakan 🛠️
- Backend: Node.js, Express.js
- Database: SQLite (via Prisma Client)
- ORM: Prisma (Untuk migrasi, skema, dan query type-safe)
- Frontend/View Engine: EJS (Embedded JavaScript)
- Styling: TailwindCSS (dengan plugin Typography untuk docs)
- Autentikasi: express-session, connect-sqlite3, bcrypt.js
- Scraping: (Dipersiapkan untuk axios & cheerio)
- Lain-lain: request-ip (IP Logging), marked (Dynamic Markdown Docs)

# stuktur file
```bash
├── db.js
├── index.js
├── package.json
├── package-lock.json
├── prisma
│   ├── dev.db
│   ├── migrations
│   │   ├── 20250909065855_init
│   │   │   └── migration.sql
│   │   ├── 20250909073548_add_users_roles_limits
│   │   │   └── migration.sql
│   │   ├── 20250909074852_add_user_ban_status
│   │   │   └── migration.sql
│   │   ├── 20250909080737_add_user_name_phone
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── README.MD
├── registerAdmin.js
├── src
│   ├── api
│   │   ├── admin.js
│   │   ├── publicRoutes.js
│   │   └── v1.js
│   ├── controllers
│   │   ├── adminController.js
│   │   ├── apiController.js
│   │   └── userController.js
│   ├── docs_src
│   │   ├── 1_rukun-islam.md
│   │   └── 2_asah-otak.md
│   ├── input.css
│   ├── middleware
│   │   ├── authAdmin.js
│   │   ├── authApiKey.js
│   │   └── authUser.js
│   ├── output.css
│   ├── public
│   │   └── css
│   │       └── style.css
│   ├── scrapers
│   │   ├── asahOtakService.js
│   │   └── rukunIslamScraper.js
│   └── views
│       ├── pages
│       │   ├── dashboard.ejs
│       │   ├── edit-user.ejs
│       │   ├── history.ejs
│       │   ├── ip-bans.ejs
│       │   ├── keys.ejs
│       │   ├── login.ejs
│       │   ├── public
│       │   │   ├── docs.ejs
│       │   │   ├── landing.ejs
│       │   │   ├── login.ejs
│       │   │   └── register.ejs
│       │   ├── user
│       │   │   └── dashboard.ejs
│       │   └── users.ejs
│       └── partials
│           ├── footer.ejs
│           ├── header.ejs
│           └── navbar.ejs
└── tailwind.config.js
```


# Instalasi & Menjalankan Proyek
Panduan ini untuk menjalankan server secara lokal (development).
### 1. Clone repositori ini
### 2. Instal semua dependensi:
```bash
npm install
```
## 3. Setup Database (Prisma):
Jalankan migrasi Prisma untuk membuat database SQLite (dev.db) dan semua tabel (User, Admin, ApiKey, BannedIP, dll).
```bash
npx prisma migrate dev
```
## 4. Buat Super Admin Pertama Anda:
Data user dan admin kini kosong. Jalankan skrip ini sekali untuk membuat akun Super Admin pertama Anda (untuk mengakses /admin):
```bash
node registerAdmin.js
```
(Ikuti prompt untuk membuat username dan password admin Anda).
## 5. Jalankan Server Development:
Skrip ini akan menjalankan server nodemon (backend) DAN compiler tailwindcss (frontend) secara bersamaan.
```bash
npm run dev
```
# server running
Server Anda sekarang berjalan di http://localhost:3000.
- Web Publik & Registrasi: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

# Cara Menambah API Scraper Baru (Workflow)
Cara Menambah API Scraper Baru (Workflow)
Ini adalah bagian terpenting. Arsitektur proyek ini dibuat agar penambahan endpoint baru sangat mudah dan hanya perlu 4 langkah (Pola: Service -> Controller -> Route -> Docs).

Misalnya Anda ingin menambahkan API Scraper baru: "Quotes Motivasi".

langkah - langkah
## 1. Buat Service (Logika Scraper/Data)
Buat file baru di src/scrapers/ yang berisi logika inti untuk mengambil data.
- File Baru: src/scrapers/quotesService.js
```bash
// File: src/scrapers/quotesService.js
// (Anda bisa pakai axios/cheerio di sini untuk scrape, atau kembalikan data statis)

const quotesData = [
    { author: "Nelson Mandela", quote: "Pendidikan adalah senjata paling ampuh..." },
    { author: "Soekarno", quote: "Beri aku 10 pemuda..." }
];

const apiInfo = {
    api_name: "API Quotes Motivasi",
    version: "1.0",
    author: "mhcode"
};

// Fungsi untuk mengambil data (kita buat async agar polanya sama)
export const getRandomQuote = async () => {
    const randomData = quotesData[Math.floor(Math.random() * quotesData.length)];
    return Promise.resolve(randomData);
};

export const quoteApiInfo = apiInfo;
```

## 2. Buat Fungsi Controller
Edit file controller API untuk "menyiapkan" data dari service agar siap dikirim sebagai JSON.
- Edit File: src/controllers/apiController.js
Tambahkan import baru di atas:
```bash
// ... (impor lain)
import { getRandomQuote, quoteApiInfo } from '../scrapers/quotesService.js';
```
tambahkan fungsi export baru di akhir file:
```bash
// Fungsi baru untuk endpoint quotes
export const getQuote = async (req, res) => {
    try {
        const data = await getRandomQuote();
        res.status(200).json({
            api_info: quoteApiInfo,
            data: data
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Gagal mengambil quote', error: error.message });
    }
};
```
## 3. Daftarkan Rute (Endpoint)
Jadikan endpoint Anda "live" dengan menambahkannya ke router API.
- Edit File: src/api/v1.js
Tambahkan controller baru ke daftar impor di atas:
```bash
// ... (impor controller lain seperti getRukunData, getBerita...)
import { ..., getQuote } from '../controllers/apiController.js';
```
Tambahkan rute baru di file tersebut (WAJIB sisipkan middleware authApiKey):
```bash
// ... (rute lain seperti /rukun-islam, /asah-otak ...)

// Rute baru Anda
router.get('/quote', authApiKey, getQuote);

// ...
export default router;
```
Selesai (Backend)! Endpoint baru Anda (GET /api/v1/quote) sekarang aktif dan secara otomatis sudah dilindungi oleh semua sistem keamanan kita (Ban IP, Ban User, Cek Limit, dan Logging).

## 4. Buat Dokumentasi (Frontend)
Ini adalah langkah termudah berkat sistem dokumentasi dinamis kita.
- Buat File Baru: src/docs_src/4_quotes.md (Gunakan nomor berikutnya agar urut).
```bash
## API Quotes Motivasi

Mengembalikan satu kutipan (quote) motivasi secara acak.

```html
GET /api/v1/quote
Contoh Response (Sukses 200):
{
    "api_info": {
        "api_name": "API Quotes Motivasi",
        "version": "1.0",
        "author": "mhcode"
    },
    "data": {
        "author": "Nelson Mandela",
        "quote": "Pendidikan adalah senjata paling ampuh..."
    }
}
```

# Developer
- instagram : @nata_wfc
- github : mhprocode