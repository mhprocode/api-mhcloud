import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import ConnectSqlite3 from 'connect-sqlite3';

// --- Impor Rute ---
import v1ApiRoutes from './src/api/v1.js'; 
import adminRoutes from './src/api/admin.js';
import publicRoutes from './src/api/publicRoutes.js'; // <-- TAMBAHKAN INI

// Setup path helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON & Form Data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup EJS (View Engine)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Setup folder Public (untuk file statis seperti CSS Tailwind)
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Setup Session (SUDAH ADA, TIDAK BERUBAH)
const SQLiteStore = ConnectSqlite3(session);
app.use(session({
    store: new SQLiteStore({
        db: 'dev.db', 
        dir: './prisma', 
        table: 'sessions' 
    }),
    secret: 'rahasia-admin-panel-anda', // Ganti dengan secret Anda
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session 1 hari
}));


// === Setup Rute ===

// Gunakan Rute baru (Landing Page, Docs, Register, Login User)
app.use('/', publicRoutes); // <-- TAMBAHKAN INI

// Rute API Publik (akan diproteksi API Key)
app.use('/api/v1', v1ApiRoutes); // (Sudah Ada)

// Rute Admin Panel (akan diproteksi Session Login Admin)
app.use('/admin', adminRoutes); // (Sudah Ada)

// HAPUS RUTE LAMA DI BAWAH INI:
/*
app.get('/', (req, res) => {
    res.redirect('/admin/login'); 
});
*/
// (Baris di atas harus dihapus atau dikomentari karena rute '/' sekarang ditangani oleh publicRoutes.js)


app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});