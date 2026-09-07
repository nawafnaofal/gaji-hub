<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wallet.svg" width="80" height="80" alt="Gaji-Hub Logo" />
</p>

<h1 align="center">Gaji-Hub</h1>

<p align="center">
  <strong>Enterprise Human Resource Information System (HRIS) & Smart Payroll Management</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" />
</p>

---

## 📌 Ringkasan Proyek

**Gaji-Hub** adalah platform HRIS (Human Resource Information System) dan Penggajian (*Payroll*) terintegrasi modern berbasis Web & PWA yang dirancang untuk menyederhanakan tata kelola SDM perusahaan secara akurat, aman, transparan, dan efisien.

Aplikasi ini mendukung operasional menyeluruh mulai dari absensi berbasis GPS & foto selfie (geofencing), manajemen cuti dan lembur dengan multi-tier approval, pengajuan klaim/reimbursement, kasbon & pinjaman, evaluasi performa (OKR & Performance Review), rekrutmen pelamar (ATS), hingga generate slip gaji otomatis serta ekspor PDF resmi.

---

## 🚀 Fitur Utama

### 🕒 1. Presensi & Absensi Cerdas (Smart Attendance)
- **Live Selfie & Kamera**: Validasi kehadiran masuk (*Clock In*) dan pulang (*Clock Out*) dilengkapi tangkapan foto langsung.
- **Geofencing GPS Presisi**: Pembatasan radius absensi kantor secara dinamis dengan feedback jarak meter langsung.
- **Deteksi Keterlambatan Otomatis**: Integrasi toleransi keterlambatan shift kerja dan perhitungan otomatis status absensi (*Present*, *Late*, *Leave*, *Sick*, *Absent*).

### 👥 2. Manajemen Data Induk Karyawan
- **Employee Directory & Profil Lengkap**: Kelola identitas karyawan, NIK/Kode Karyawan, jabatan, departemen, kontak, bank, NPWP, hingga nomor BPJS Kesehatan & Ketenagakerjaan.
- **Pencarian Real-Time & Filter Status**: Filter cepat karyawan berdasarkan status *Permanent*, *Contract*, *Internship*, atau *Resigned*.
- **Peringatan Masa Kontrak**: Notifikasi otomatis untuk masa kontrak karyawan yang akan segera berakhir.
- **Manajemen Dokumen Karyawan & Import CSV**: Pengunggahan berkas digital karyawan serta import data massal via CSV.

### 💰 3. Payroll & Slip Gaji Terstandar
- **Kalkulasi Gaji Otomatis**: Perhitungan otomatis komponen gaji pokok, tunjangan jabatan, lembur, bonus, denda keterlambatan/mangkir, cicilan kasbon, serta potongan pajak PPh 21 (TER) dan BPJS (Kesehatan & Ketenagakerjaan).
- **Portal Slip Gaji Karyawan (My Payslips)**: Karyawan dapat melihat riwayat slip gaji per periode dan rincian penghasilan bruto serta potongan secara transparan.
- **Cetak Dokumen PDF Resmi**: Ekspor slip gaji ke dalam format PDF resmi perusahaan dengan tata letak profesional siap cetak.

### 🏖️ 4. Pengajuan Mandiri Karyawan (Employee Self-Service)
- **Manajemen Cuti (Leave Request)**: Pengajuan cuti tahunan, sakit, dan tanpa upah dengan sistem kuota cuti serta kalender cuti tim bersama.
- **Klaim & Reimbursement**: Pengajuan klaim pengeluaran operasional dilengkapi unggah struk/nota digital dan tinjauan persetujuan HR.
- **Kasbon & Pinjaman (Cash Advance & Loans)**: Pengajuan pinjaman darurat dengan batas plafon (maks. 50% gaji pokok) yang terhubung langsung sebagai potongan payroll bulanan.
- **Pengajuan Lembur (Overtime)**: Pencatatan jam kerja lembur dengan kalkulasi estimasi durasi dan verifikasi bertingkat.

### 🎯 5. Kinerja & Pengembangan (OKR & Performance Review)
- **Objectives & Key Results (OKR)**: Penetapan target divisi/individu dan pelacakan persentase progres secara visual.
- **Performance Reviews**: Penilaian kinerja berkala berbasis kriteria KPI dan feedback objektif karyawan.

### 💼 6. Rekrutmen & Pelamar (Applicant Tracking System / ATS)
- **Halaman Karir Publik (`/careers`)**: Portal lowongan kerja perusahaan yang dapat diakses publik tanpa login.
- **Pelacakan Kandidat**: Pemrosesan status pelamar dari tahap *Applied*, *Screening*, *Interview*, *Offered*, hingga *Hired*.

### 📱 7. Desain & Aksesibilitas Modern
- **Progressive Web App (PWA)**: Dapat di-install langsung di perangkat seluler / desktop sebagai aplikasi mandiri.
- **Dark Mode Konsisten**: Tampilan tema gelap (*dark mode*) dan terang (*light mode*) yang terintegrasi di seluruh modul.
- **Responsif & Aman**: Dilengkapi *Role-Based Access Control* (Super Admin, HR, Employee) serta perlindungan registrasi enterprise tertutup.

---

## 🛠️ Arsitektur & Teknologi

| Layer | Teknologi yang Digunakan |
| :--- | :--- |
| **Backend Framework** | [Laravel 12](https://laravel.com/) (PHP 8.2+) |
| **Frontend UI** | [React 18](https://react.dev/) & [Inertia.js v2](https://inertiajs.com/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) & Headless UI |
| **Icons & Charts** | [Lucide Icons](https://lucide.dev/) & [Recharts](https://recharts.org/) |
| **PDF Generation** | [Barryvdh Laravel DomPDF](https://github.com/barryvdh/laravel-dompdf) |
| **Build Tool** | [Vite 7](https://vitejs.dev/) |
| **PWA Engine** | [Vite Plugin PWA](https://vite-pwa-org.netlify.app/) & Workbox |
| **Database** | MySQL / MariaDB / PostgreSQL / SQLite |

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terinstal:
- **PHP** >= 8.2 (dengan ekstensi `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `gd`)
- **Composer** >= 2.x
- **Node.js** >= 18.x & **NPM**
- **Database Server** (MySQL/MariaDB)

### 2. Kloning Repository
```bash
git clone https://github.com/nawafnaofal/gaji-hub.git
cd gaji-hub
```

### 3. Instalasi Dependensi Backend & Frontend
```bash
# Instal dependensi PHP
composer install

# Instal dependensi JavaScript
npm install
```

### 4. Konfigurasi Lingkungan (.env)
Salin file konfigurasi dan generate app key:
```bash
cp .env.example .env
php artisan key:generate
```
Sesuaikan konfigurasi database pada file `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gaji_hub
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Migrasi & Seeder Database
Jalankan migrasi tabel dan isi data awal percontohan:
```bash
php artisan migrate --seed
```

Buat symbolic link untuk penyimpanan berkas (foto absensi & lampiran klaim):
```bash
php artisan storage:link
```

### 6. Menjalankan Server Pengembangan
Jalankan frontend compiler dan local server Laravel:

**Terminal 1 (Vite Dev Server):**
```bash
npm run dev
```

**Terminal 2 (Laravel Server):**
```bash
php artisan serve
```

Buka browser Anda di `http://127.0.0.1:8000`.

---

## 🔑 Akun Demo / Default Pengujian

Aplikasi telah dilengkapi seeder akun untuk mempermudah pengujian seluruh fitur:

| Peran (Role) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@gajihub.com` | `password` | Akses penuh sistem, master data, konfigurasi kantor & seluruh data payroll |
| **HR Manager** | `hr@gajihub.com` | `password` | Manajemen karyawan, persetujuan cuti/klaim/lembur, payroll & recruitment |
| **Karyawan 1** | `emp1@gajihub.com` | `password` | Portal karyawan: absensi, pengajuan cuti, klaim reimbursement, kasbon & slip gaji |
| **Karyawan 2** | `emp2@gajihub.com` | `password` | Portal karyawan |
| **Karyawan 3** | `emp3@gajihub.com` | `password` | Portal karyawan |
| **Karyawan 4** | `emp4@gajihub.com` | `password` | Portal karyawan |
| **Karyawan 5** | `emp5@gajihub.com` | `password` | Portal karyawan |

---

## 📂 Struktur Direktori Utama

```
gaji-hub/
├── app/
│   ├── Http/Controllers/Api/   # Controller endpoint API (Attendance, Payroll, Leaves, dll.)
│   ├── Models/                 # Model Eloquent (Employee, Attendance, Payroll, Leave, dll.)
│   └── Services/               # Logika bisnis payroll & kalkulasi pajak/BPJS
├── config/                     # Konfigurasi aplikasi & paket
├── database/
│   ├── migrations/             # Struktur skema tabel database
│   └── seeders/                # Data default pengujian
├── resources/
│   ├── js/
│   │   ├── Components/         # Komponen reusable React
│   │   ├── Layouts/            # AuthenticatedLayout & GuestLayout
│   │   └── Pages/              # Halaman Inertia (Dashboard, Employee, Payroll, Attendance, dll.)
│   └── views/
│       ├── app.blade.php       # Layout HTML induk
│       └── slip.blade.php      # Template cetak PDF Slip Gaji
├── routes/
│   ├── api.php                 # Rute API v1
│   ├── web.php                 # Rute Web & Inertia
│   └── auth.php                # Rute autentikasi Breeze
└── public/                     # Aset build publik & manifest PWA
```

---

## 📄 Lisensi

Proyek ini dikembangkan di bawah lisensi [MIT License](LICENSE).
