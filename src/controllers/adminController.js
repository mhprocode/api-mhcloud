import prisma from '../../db.js';
import bcrypt from 'bcryptjs';

// Definisi Role (penting agar konsisten)
const ROLES_POLICY = {
    FREE: {
        monthlyLimit: 100, 
        expiresAt: null 
    },
    PREMIUM: {
        monthlyLimit: 50000, 
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Premium 1 tahun
    }
};


// --- Halaman (GET) ---

export const getLoginPage = (req, res) => {
    if (req.session && req.session.isAdmin) return res.redirect('/admin/dashboard');
    res.render('pages/login', { error: null });
};

export const getDashboard = (req, res) => {
    res.render('pages/dashboard', { username: req.session.username });
};

export const getHistoryPage = async (req, res) => {
    try {
        const logs = await prisma.requestLog.findMany({
            orderBy: { requestedAt: 'desc' },
            take: 100, // Ambil 100 log terbaru
            include: { 
                apiKey: { // Ambil data API Key yang terkait dengan log ini
                    select: { 
                        key: true, 
                        user: { // Ambil data User yang memiliki API Key tersebut
                            select: { 
                                email: true,
                                name: true,      // <-- KITA AMBIL DATA BARU (NAMA)
                                role: true,      // <-- KITA AMBIL DATA BARU (ROLE)
                                isBanned: true   // <-- KITA AMBIL DATA BARU (STATUS BAN)
                            } 
                        } 
                    } 
                } 
            }
        });
        
        res.render('pages/history', { 
            logs: logs, 
            error: req.query.error || null, 
            success: req.query.success || null 
        });

    } catch (error) {
        console.error("Gagal memuat histori:", error);
        res.render('pages/history', { logs: [], error: 'Gagal memuat histori', success: null });
    }
};


// Halaman ini sekarang USANG (sudah tidak relevan), karena keys dibuat oleh user. 
// Tapi kita biarkan jika Anda ingin melihat daftar semua key.
export const getKeysPage = async (req, res) => {
     try {
        const keys = await prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, role: true } } } // Tampilkan user pemiliknya
        });
        res.render('pages/keys', { keys: keys });
    } catch (error) {
        res.render('pages/keys', { keys: [] });
    }
};


// --- Aksi (POST/DELETE) Admin ---

export const postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (!admin) {
            return res.render('pages/login', { error: 'Username tidak ditemukan' });
        }
        const validPass = await bcrypt.compare(password, admin.password);
        if (!validPass) {
            return res.render('pages/login', { error: 'Password salah' });
        }
        req.session.isAdmin = true;
        req.session.username = admin.username;
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.render('pages/login', { error: 'Server error' });
    }
};

export const postLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) { return res.redirect('/admin/dashboard'); }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    });
};

// Fungsi ini seharusnya tidak dipakai lagi, tapi kita biarkan (tanpa relasi user)
export const createApiKey = async (req, res) => {
     // Ini akan GAGAL karena skema baru WAJIB punya userId.
     // Admin seharusnya tidak membuat key manual, tapi mengelola USER.
    res.redirect('/admin/keys');
};

// Ini juga akan menghapus user-nya jika onDelete: Cascade aktif di relasi User
export const deleteApiKey = async (req, res) => {
    // Cara teraman adalah menghapus USER, dan biarkan cascade menghapus key.
    // Kita biarkan logic ini (mungkin gagal), fokus ke manajemen user.
    res.redirect('/admin/keys');
};


// ===========================================
// KONTROLER MANAJEMEN USER (YANG HILANG)
// ===========================================

export const getUserManagementPage = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { apiKey: { select: { key: true, hitCount: true, monthlyLimit: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.render('pages/users', { 
            users: users, 
            error: req.query.error || null, 
            success: req.query.success || null 
        });
    } catch (e) {
        res.render('pages/users', { users: [], error: 'Gagal memuat user.', success: null });
    }
};

export const getEditUserPage = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
             where: { id: parseInt(req.params.id) },
             include: { apiKey: true }
        });
        if (!user) return res.redirect('/admin/users');
        
        // Kirimkan daftar Role yang tersedia (dari Enum)
        res.render('pages/edit-user', { user: user, roles: ['FREE', 'PREMIUM'], error: null });
    } catch (e) {
        res.redirect('/admin/users');
    }
};

export const postUpdateUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { email, role, monthlyLimit, expiresAt } = req.body; // Ambil data dari form

    try {
        const newRole = (role === 'FREE' || role === 'PREMIUM') ? role : 'FREE';
        const policy = ROLES_POLICY[newRole];

        // Tentukan limit dan expired. Jika admin mengisi manual, gunakan itu. Jika tidak, gunakan policy.
        const newLimit = parseInt(monthlyLimit) || policy.monthlyLimit;
        let newExpiry = expiresAt ? new Date(expiresAt) : policy.expiresAt;
        if (newRole === 'FREE') {
            newExpiry = null;
        }

        // Update User (role, email) dan ApiKey (limit, expired)
        await prisma.user.update({
            where: { id: userId },
            data: {
                email: email,
                role: newRole,
                apiKey: {
                    update: { // Update data ApiKey yang terhubung
                        monthlyLimit: newLimit,
                        expiresAt: newExpiry,
                    }
                }
            }
        });

        res.redirect('/admin/users?success=User berhasil diupdate');
    } catch (e) {
        console.error(e);
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { apiKey: true }});
        res.render('pages/edit-user', { user: user, roles: ['FREE', 'PREMIUM'], error: 'Gagal update user' });
    }
};

export const postDeleteUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        // Karena onDelete: Cascade, saat User dihapus,
        // ApiKey mereka dan semua RequestLog mereka akan ikut terhapus.
        await prisma.user.delete({
            where: { id: userId }
        });
        res.redirect('/admin/users?success=User berhasil dihapus');
    } catch (e) {
         res.redirect('/admin/users?error=Gagal menghapus user');
    }
};

// ===========================================
// FUNGSI BAN / UNBAN USER (TAMBAHAN TERBARU)
// ===========================================

export const postBanUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: true } // Set status ban ke true
        });
        res.redirect('/admin/users?success=User berhasil diblokir');
    } catch (e) {
        res.redirect('/admin/users?error=Gagal memblokir user');
    }
};

export const postUnbanUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: false } // Set status ban ke false
        });
        res.redirect('/admin/users?success=Blokir user berhasil dibuka');
    } catch (e) {
        res.redirect('/admin/users?error=Gagal membuka blokir');
    }
};


// ===========================================
// KONTROLER MANAJEMEN IP BAN
// ===========================================

export const getIpBanPage = async (req, res) => {
     try {
        const ips = await prisma.bannedIP.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('pages/ip-bans', { 
            ips: ips, 
            error: req.query.error || null, 
            success: req.query.success || null 
        });
    } catch (e) {
        res.render('pages/ip-bans', { ips: [], error: 'Gagal memuat daftar IP Ban', success: null });
    }
};

export const postBanIp = async (req, res) => {
    const { ipAddress, reason } = req.body;
    if (!ipAddress) {
         return res.redirect('/admin/ip-bans?error=IP Address tidak boleh kosong');
    }

    try {
        await prisma.bannedIP.create({
            data: {
                ipAddress: ipAddress,
                reason: reason || null
            }
        });
        res.redirect('/admin/ip-bans?success=IP berhasil diblokir');
    } catch (e) {
        // Jika error karena IP sudah ada (Unique constraint)
        if (e.code === 'P2002') {
             return res.redirect('/admin/ip-bans?error=IP tersebut sudah diblokir sebelumnya');
        }
        res.redirect('/admin/ip-bans?error=Gagal memblokir IP');
    }
};

// Ini adalah shortcut dari halaman Histori
export const postQuickBanIp = async (req, res) => {
     const { ipAddress } = req.body;
     if (!ipAddress) {
         return res.redirect('/admin/history?error=IP tidak valid');
     }
      try {
        await prisma.bannedIP.create({
            data: {
                ipAddress: ipAddress,
                reason: "Quick ban dari halaman histori"
            }
        });
        res.redirect('/admin/history?success=IP ' + ipAddress + ' berhasil diblokir');
    } catch (e) {
        if (e.code === 'P2002') {
           return res.redirect('/admin/history?error=IP ' + ipAddress + ' sudah diblokir');
        }
        res.redirect('/admin/history?error=Gagal memblokir IP');
    }
};


export const postUnbanIp = async (req, res) => {
    const banId = parseInt(req.params.id);
    try {
        await prisma.bannedIP.delete({
            where: { id: banId }
        });
         res.redirect('/admin/ip-bans?success=Blokir IP telah dibuka');
    } catch (e) {
         res.redirect('/admin/ip-bans?error=Gagal membuka blokir');
    }
};