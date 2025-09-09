import prisma from '../../db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs'; // <--- INI YANG MENYEBABKAN ERROR (KARENA HILANG)
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import requestIp from 'request-ip';
// Helper ini juga penting untuk 'path.join'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definisi Role (penting agar konsisten)
const ROLES_POLICY = {
    FREE: {
        monthlyLimit: 100, // 1000 hits/bulan
        expiresAt: null // Gratis selamanya
    },
    PREMIUM: {
        monthlyLimit: 50000, // 50.000 hits/bulan
        // Di dunia nyata, tanggal expired di-set saat pembayaran berhasil
        // Ini contoh: Premium valid selama 1 tahun dari sekarang
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
    }
};


// --- GET PAGES ---
// Menampilkan halaman Register
export const getRegisterPage = (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/dashboard'); // Jika sudah login, lempar ke dashboard
    res.render('pages/public/register', { error: null, layout: 'public' });
};

// Menampilkan halaman Login User
export const getLoginPage = (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/dashboard'); // Jika sudah login, lempar ke dashboard
    res.render('pages/public/login', { error: null, layout: 'public' });
};

// Menampilkan dashboard User (setelah login)
export const getDashboard = async (req, res) => {
    // Ambil data user dari DB. Kita membutuhkannya untuk TAB PROFIL,
    // bahkan jika query API Key gagal.
    let user;
    try {
        user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user) {
            // Jika user di session tidak ada di DB, paksa logout
            return req.session.destroy(() => res.redirect('/login'));
        }
    } catch (e) {
         // Jika DB error saat ambil user, kita tidak bisa lanjut
         console.error("Dashboard Error (gagal ambil user):", e);
         return res.render('pages/public/login', { error: 'Gagal memuat data user. Silakan login ulang.' });
    }

    // Sekarang coba ambil API Key
    try {
        const apiKeyData = await prisma.apiKey.findUnique({
            where: { userId: req.session.userId }
            // Kita tidak perlu "include: { user: true }" lagi, karena kita sudah ambil data user di atas
        });
        
        if (!apiKeyData) {
           // Jika user ada tapi key tidak ada (seharusnya tidak terjadi jika register benar)
           return res.render('pages/user/dashboard', { 
               error: 'API Key tidak ditemukan. Hubungi admin.', 
               key: null, 
               user: user, // Kirim data user yang sudah kita ambil
               query: req.query // <-- PERBAIKAN UTAMA: Kirim query object
           });
        }
        
        // Cek reset bulanan
        const daysSinceReset = (new Date() - new Date(apiKeyData.lastReset)) / (1000 * 60 * 60 * 24);
        let keyToRender = apiKeyData;

        if (daysSinceReset > 30) {
             // Sudah waktunya reset bulanan. Update DB.
             keyToRender = await prisma.apiKey.update({
                where: { id: apiKeyData.id },
                data: { 
                    hitCount: 0, 
                    lastReset: new Date() 
                }
             });
        } 
        
        res.render('pages/user/dashboard', { 
            key: keyToRender, 
            user: user, // Kirim data user
            error: null, // Tidak ada error
            query: req.query // <-- PERBAIKAN UTAMA: Kirim query object
        });
        
    } catch (error) {
         console.error("Dashboard Error (gagal ambil key):", error);
         // Jika GAGAL ambil key, setidaknya render halaman (TAB PROFIL masih bisa diakses)
         res.render('pages/user/dashboard', { 
             error: 'Gagal memuat data API Key.', 
             key: null, 
             user: user, // Tetap kirim data user
             query: req.query // <-- PERBAIKAN UTAMA: Kirim query object
         });
    }
};

// --- POST ACTIONS ---

// Logika untuk memproses registrasi
export const postRegister = async (req, res) => {
    // Ambil field baru dari body
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !password) {
         return res.render('pages/public/register', { error: 'Nama, Email, dan Password wajib diisi.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.render('pages/public/register', { error: 'Email sudah terdaftar. Silakan login.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tentukan role (default FREE)
        const role = 'FREE';
        const policy = ROLES_POLICY[role];
        
        // Buat User DAN ApiKey dalam satu transaksi database
        const newUser = await prisma.user.create({
            data: {
                name: name,         // <-- DATA BARU
                email: email,
                phone: phone || null, // <-- DATA BARU (null jika kosong)
                password: hashedPassword,
                role: role,
                apiKey: { // Buat ApiKey yang terhubung secara otomatis
                    create: {
                        key: `API-USER-${uuidv4()}`, // Key unik baru
                        monthlyLimit: policy.monthlyLimit,
                        expiresAt: policy.expiresAt,
                        lastReset: new Date()
                    }
                }
            }
        });

        // Setelah sukses register, langsung loginkan user
        req.session.userId = newUser.id;
        req.session.userEmail = newUser.email; // Simpan email di session (penting untuk update profil)
        res.redirect('/dashboard'); // Arahkan ke dashboard USER

    } catch (error) {
        console.error("Register Error:", error);
        res.render('pages/public/register', { error: 'Gagal melakukan registrasi.' });
    }
};

// Logika untuk memproses login user
export const postLogin = async (req, res) => {
     const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.render('pages/public/login', { error: 'Email tidak ditemukan' });
        }

        // --- TAMBAHAN BARU: CEK BAN ---
        if (user.isBanned) {
             return res.render('pages/public/login', { error: 'Akun Anda telah diblokir. Silakan hubungi support.' });
        }
        // --- AKHIR TAMBAHAN ---

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.render('pages/public/login', { error: 'Password salah' });
        }

        // Sukses Login: Simpan di Session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        res.redirect('/dashboard'); // Redirect ke dashboard user

    } catch (error) {
        res.render('pages/public/login', { error: 'Server error saat login.' });
    }
};

// Logika logout user
export const postLogout = (req, res) => {
     req.session.destroy(err => {
        if (err) { 
            // Jika gagal destroy, setidaknya redirect
            return res.redirect('/dashboard'); 
        }
        res.clearCookie('connect.sid'); // Hapus cookie session di browser
        res.redirect('/'); // Arahkan ke Landing Page (halaman utama)
    });
};

export const postUpdateProfile = async (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.session.userId; // Ambil ID dari session yang sedang login

    // Cek jika email diganti, apakah email baru sudah dipakai orang lain
    try {
        if (email !== req.session.userEmail) { // Cek jika emailnya diganti
             const emailExists = await prisma.user.findUnique({
                where: { email: email }
            });
            if (emailExists) {
                 // Gagal, email sudah dipakai. Kirim pesan error kembali ke dashboard.
                return res.redirect('/dashboard?tab=profil&error=Email tersebut sudah terdaftar');
            }
        }

        // Lolos validasi, update data user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name,
                email: email,
                phone: phone
            }
        });

        // Update juga data di session
        req.session.userEmail = updatedUser.email; 

        // Sukses, kirim pesan sukses kembali ke dashboard
        res.redirect('/dashboard?tab=profil&success=Profil berhasil diperbarui');

    } catch (e) {
        console.error("Update Profil Error:", e);
        res.redirect('/dashboard?tab=profil&error=Terjadi kesalahan saat memperbarui profil');
    }
};


export const postChangePassword = async (req, res) => {
    const { password_lama, password_baru, konfirmasi_password } = req.body;
    const userId = req.session.userId;

    try {
        // 1. Cek apakah password baru cocok dengan konfirmasi
        if (password_baru !== konfirmasi_password) {
            return res.redirect('/dashboard?tab=password&error=Password baru dan konfirmasi tidak cocok');
        }

        // 2. Ambil data user (termasuk hash password lama) dari DB
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
             return res.redirect('/login'); // Session aneh, paksa login ulang
        }

        // 3. Validasi password lama
        const validPassLama = await bcrypt.compare(password_lama, user.password);
        if (!validPassLama) {
            return res.redirect('/dashboard?tab=password&error=Password lama Anda salah');
        }

        // 4. Hash password baru dan simpan ke DB
        const hashedPasswordBaru = await bcrypt.hash(password_baru, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPasswordBaru }
        });

        // 5. Sukses
        res.redirect('/dashboard?tab=password&success=Password berhasil diubah');

    } catch (e) {
         console.error("Ganti Password Error:", e);
         res.redirect('/dashboard?tab=password&error=Terjadi kesalahan server');
    }
};

export const getDocsPage = async (req, res) => {
    
    const docsDir = path.join(__dirname, '../docs_src'); // Path ke folder .md kita

    try {
        // 1. Baca semua file .md, urutkan
        const files = fs.readdirSync(docsDir)
            .filter(file => file.endsWith('.md'))
            .sort();

        if (files.length === 0) {
             // Jika tidak ada file .md sama sekali
             return res.render('pages/public/docs', { 
                 docMenu: [], 
                 activeDocHtml: '<p>Tidak ada dokumentasi ditemukan.</p>', 
                 activeSlug: '' 
             });
        }

        // 2. Buat "Menu" dari nama file
        // Kita ubah '1_rukun-islam.md' menjadi objek { nama: 'Rukun Islam', slug: 'rukun-islam' }
        const docMenu = files.map(file => {
            const slug = file.replace(/^\d+_/, '').replace(/\.md$/, ''); // Hapus '1_' dan '.md'
            const nama = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Ubah 'rukun-islam' -> 'Rukun Islam'
            return { nama, slug };
        });

        // 3. Tentukan dokumen mana yang harus ditampilkan
        // Ambil dari query param (?doc=...) ATAU tampilkan dokumen pertama jika tidak ada query
        const activeSlug = req.query.doc || docMenu[0].slug; // Default ke item menu pertama
        
        // Cari nama file .md yang sesuai dengan slug yang aktif
        const activeFileName = files.find(file => file.includes(activeSlug));

        let activeDocHtml = `<p class="text-red-500">Dokumen untuk '${activeSlug}' tidak ditemukan.</p>`;

        // 4. Jika file ditemukan, baca dan parse ke HTML
        if (activeFileName) {
            const filePath = path.join(docsDir, activeFileName);
            const markdownContent = fs.readFileSync(filePath, 'utf-8');
            activeDocHtml = marked.parse(markdownContent); // Ubah MD ke HTML
        }

        // 5. Render view, kirimkan SEMUA data yang dibutuhkan
        res.render('pages/public/docs', {
             docMenu: docMenu,          // Daftar menu (untuk sidebar/dropdown)
             activeDocHtml: activeDocHtml,  // Konten HTML yang aktif
             activeSlug: activeSlug       // Slug yang aktif (untuk menandai menu)
        });

    } catch (error) {
        console.error("Gagal membaca dokumentasi:", error);
        res.render('pages/public/docs', { 
            docMenu: [], 
            activeDocHtml: `<p class="text-red-500">Gagal memuat sistem dokumentasi. Error: ${error.message}</p>`,
            activeSlug: ''
        });
    }
};
export const getLandingPage = async (req, res) => {
    // Jika user sudah login, lempar langsung ke dashboard mereka
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }

    try {
        // 1. Ambil IP visitor saat ini
        const visitorIp = requestIp.getClientIp(req) || 'IP Tidak Dikenali';

        // 2. Ambil statistik (jalankan query secara paralel agar cepat)
        const [totalUsers, totalRequests] = await Promise.all([
            prisma.user.count(),          // Menghitung jumlah baris di tabel User
            prisma.requestLog.count()     // Menghitung jumlah baris di tabel RequestLog
        ]);

        // 3. Render landing page dan kirimkan semua datanya
        res.render('pages/public/landing', {
            stats: {
                users: totalUsers,
                requests: totalRequests
            },
            visitorIp: visitorIp
        });

    } catch (error) {
        console.error("Gagal memuat landing page stats:", error);
        // Jika gagal ambil data DB, setidaknya render halaman dengan data default
        res.render('pages/public/landing', {
            stats: {
                users: 0,
                requests: 0
            },
            visitorIp: 'N/A'
        });
    }
};