# Aplikasi Buat Satu Aplikasi Enterprise

Platform pembangun aplikasi enterprise. Cepat, kuat, kustomisasi tinggi.

## Deskripsi

"Aplikasi Buat Satu Aplikasi Enterprise" adalah platform low-code/no-code untuk membangun aplikasi enterprise. Desain visual, editor kode kustom, integrasi API, dan deployment satu klik.

## Fitur Utama

*   **Visual Drag-and-Drop Builder**: Antarmuka intuitif. Bangun UI cepat.
*   **Custom Code Editor**: Fleksibilitas kode. Kustomisasi mendalam.
*   **Database Schema Designer**: Desain skema database mudah.
*   **API Integration Tools**: Hubungkan API eksternal.
*   **Role-Based Access Control (RBAC)**: Atur izin pengguna.
*   **One-Click Deployment**: Deploy aplikasi ke produksi cepat.
*   **Version Control**: Lacak perubahan. Kelola versi.
*   **Template Library**: Mulai proyek dari template siap pakai.
*   **Multi-Tenant Support**: Isolasi data antar tenant.
*   **Pagination**: Kelola data besar efisien.
*   **Error Handling**: Penanganan kesalahan robust.

## Teknologi Digunakan

*   **Backend**: Express.js
*   **Database**: Turso (SQLite)
*   **Frontend Styling**: Tailwind CSS

## Struktur Proyek (Ringkas)

```
.
├── public/                # File statis
├── src/
│   ├── api/               # Endpoint API
│   ├── components/        # Komponen UI
│   ├── config/            # Konfigurasi aplikasi
│   ├── db/                # Setup database & migrasi
│   ├── middleware/        # Middleware Express
│   ├── models/            # Model data
│   ├── routes/            # Definisi rute API
│   ├── services/          # Logika bisnis
│   ├── views/             # Template HTML (jika ada SSR)
│   └── app.js             # Entry point Express
├── .env.example           # Contoh variabel lingkungan
├── package.json           # Dependensi proyek
├── README.md              # Dokumentasi proyek
└── tailwind.config.js     # Konfigurasi Tailwind
```

## Instalasi & Setup

### Prasyarat

*   Node.js (v18 atau lebih baru)
*   npm atau yarn
*   Akun Turso (untuk database)

### Kloning Repositori

```bash
git clone <URL_REPOSITORI_ANDA>
cd aplikasi-buat-satu-aplikasi-enterprise
```

### Instal Dependensi

```bash
npm install
# atau
yarn install
```

### Variabel Lingkungan

Buat file `.env` di root proyek. Salin konten dari `.env.example`. Isi nilai:

```env
PORT=3000
DATABASE_URL="libsql://<your-db-name>-<your-org-name>.turso.io"
DATABASE_AUTH_TOKEN="<your-turso-auth-token>"
JWT_SECRET="supersecretkey" # Ganti dengan kunci kuat
TENANT_HEADER_KEY="X-Tenant-ID" # Header untuk identifikasi tenant
```

*   **DATABASE_URL**: Dapatkan dari konsol Turso Anda.
*   **DATABASE_AUTH_TOKEN**: Dapatkan dari konsol Turso Anda.
*   **JWT_SECRET**: Penting untuk keamanan. Gunakan string acak panjang.

### Setup Database (Turso)

1.  Buat database baru di Turso.
2.  Dapatkan `DATABASE_URL` dan `DATABASE_AUTH_TOKEN`.
3.  Jalankan migrasi database:

    ```bash
    npm run db:migrate
    # atau
    yarn db:migrate
    ```

    Ini akan membuat tabel `applications`, `components`, dan `users`.

### Menjalankan Aplikasi

#### Mode Pengembangan

```bash
npm run dev
# atau
yarn dev
```

Aplikasi berjalan di `http://localhost:3000`.

#### Mode Produksi

```bash
npm start
# atau
yarn start
```

## Penggunaan

Akses API melalui `http://localhost:3000/api`.

### Contoh Endpoint

*   `GET /api/applications`
*   `POST /api/applications`
*   `GET /api/components`
*   `GET /api/users`

Autentikasi JWT diperlukan untuk sebagian besar endpoint. Sertakan header `Authorization: Bearer <token>`.
Header `X-Tenant-ID` diperlukan untuk operasi multi-tenant.

## Pola Enterprise

Aplikasi ini mengimplementasikan pola-pola enterprise seperti:
*   **Domain-Driven Design (DDD)**: Entitas terdefinisi jelas.
*   **Multi-Tenancy**: Isolasi data per pelanggan.
*   **Role-Based Access Control (RBAC)**: Kontrol akses granular.
*   **Pagination**: Efisiensi data query.

## Kontribusi

Kontribusi diterima. Fork repo, buat branch, kirim PR.

## Lisensi

MIT License.