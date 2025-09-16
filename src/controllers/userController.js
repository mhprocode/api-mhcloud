import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import requestIp from 'request-ip';
import prisma from '../../db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Helper untuk path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definisi Role (penting agar konsisten)
const ROLES_POLICY = {
    FREE: {
        monthlyLimit: 100, 
        expiresAt: null 
    },
    PREMIUM: {
        monthlyLimit: 50000, 
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
    }
};

// --- HELPER FUNCTIONS (untuk data OS di Admin & Landing Page) ---
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}
function getServerIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// =======================================================================
// --- FUNGSI-FUNGSI CONTROLLER ---
// =======================================================================

export const getLandingPage = async (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }

    const defaultStats = {
        db_stats: {
            total_users: 0,
            total_requests: 0,
            requests_today: 0,
            banned_ips: 0,
            roles: { FREE: 100, PREMIUM: 50000 }
        },
        server_stats: null 
    };

    try {
        const visitorIp = requestIp.getClientIp(req) || 'IP Tidak Dikenali';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers, 
            totalRequests, 
            requestsToday, 
            bannedIPs, 
            userRoles 
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.requestLog.count(),
            prisma.requestLog.count({ where: { requestedAt: { gte: today } } }),
            prisma.bannedIP.count(),
            prisma.user.groupBy({
                by: ['role'],
                _count: { role: true },
            })
        ]);

        const rolesCount = {
            FREE: userRoles.find(r => r.role === 'FREE')?._count.role || 0,
            PREMIUM: userRoles.find(r => r.role === 'PREMIUM')?._count.role || 0,
        };
        
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = (usedMem / totalMem) * 100;
        const cpus = os.cpus();

        const serverStats = {
            os_platform: os.platform(),
            os_type: os.type(),
            cpu_model: cpus[0].model,
            cpu_cores: cpus.length,
            node_version: process.version,
            app_uptime: formatUptime(process.uptime()),
            ram_total: formatBytes(totalMem),
            ram_used: formatBytes(usedMem),
            ram_free: formatBytes(freeMem),
            ram_usage_percent: memUsagePercent.toFixed(2),
            server_ip: getServerIp(),
            hostname: os.hostname()
        };

        const landingPageData = {
            db_stats: {
                total_users: totalUsers,
                total_requests: totalRequests,
                requests_today: requestsToday,
                banned_ips: bannedIPs,
                roles: rolesCount
            },
            server_stats: serverStats
        };

        res.render('pages/public/landing', {
            stats: landingPageData,
            visitorIp: visitorIp
        });

    } catch (error) {
        console.error("Gagal memuat landing page stats:", error);
        res.render('pages/public/landing', {
            stats: defaultStats, 
            visitorIp: 'N/A'
        });
    }
};

export const getRegisterPage = (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/dashboard'); 
    res.render('pages/public/register', { error: null });
};

export const getLoginPage = (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/dashboard');
    res.render('pages/public/login', { error: null });
};

export const getDashboard = async (req, res) => {
    let user;
    try {
        user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user) {
            return req.session.destroy(() => res.redirect('/login'));
        }
    } catch (e) {
        console.error("Dashboard Error (gagal ambil user):", e);
        return res.render('pages/public/login', { error: 'Gagal memuat data user. Silakan login ulang.' });
    }

    try {
        const apiKeyData = await prisma.apiKey.findUnique({
            where: { userId: req.session.userId }
        });
        
        if (!apiKeyData) {
           return res.render('pages/user/dashboard', { 
               error: 'API Key tidak ditemukan. Hubungi admin.', 
               key: null, 
               user: user,
               query: req.query 
           });
        }
        
        const daysSinceReset = (new Date() - new Date(apiKeyData.lastReset)) / (1000 * 60 * 60 * 24);
        let keyToRender = apiKeyData;

        if (daysSinceReset > 30) {
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
            user: user,
            error: null, 
            query: req.query 
        });
        
    } catch (error) {
       console.error("Dashboard Error (gagal ambil key):", error);
       res.render('pages/user/dashboard', { 
           error: 'Gagal memuat data API Key.', 
           key: null, 
           user: user,
           query: req.query
       });
    }
};

export const postRegister = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
         return res.render('pages/public/register', { error: 'Nama, Email, dan Password wajib diisi.' });
    }
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) { return res.render('pages/public/register', { error: 'Email sudah terdaftar. Silakan login.' }); }
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'FREE'; const policy = ROLES_POLICY[role];
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                phone: phone || null,
                password: hashedPassword,
                role: role,
                apiKey: {
                    create: {
                        key: `API-MhCloud-${uuidv4()}`,
                        monthlyLimit: policy.monthlyLimit,
                        expiresAt: policy.expiresAt,
                        lastReset: new Date()
                    }
                }
            }
        });
        req.session.userId = newUser.id;
        req.session.userEmail = newUser.email;
        req.session.userName = newUser.name;
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Register Error:", error);
        res.render('pages/public/register', { error: 'Gagal melakukan registrasi.' });
    }
};

export const postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) { return res.render('pages/public/login', { error: 'Email tidak ditemukan' }); }
        if (user.isBanned) { return res.render('pages/public/login', { error: 'Akun Anda telah diblokir. Silakan hubungi support.' }); }
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) { return res.render('pages/public/login', { error: 'Password salah' }); }
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        res.redirect('/dashboard');
    } catch (error) {
        res.render('pages/public/login', { error: 'Server error saat login.' });
    }
};

export const postLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) { return res.redirect('/dashboard'); }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
};

export const postUpdateProfile = async (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.session.userId;
    try {
        if (email !== req.session.userEmail) {
            const emailExists = await prisma.user.findUnique({ where: { email: email } });
            if (emailExists) {
                return res.redirect('/dashboard?tab=profil&error=Email tersebut sudah terdaftar');
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, email, phone }
        });
        req.session.userEmail = updatedUser.email;
        req.session.userName = updatedUser.name;
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
        if (password_baru !== konfirmasi_password) { return res.redirect('/dashboard?tab=password&error=Password baru dan konfirmasi tidak cocok'); }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) { return res.redirect('/login'); }
        const validPassLama = await bcrypt.compare(password_lama, user.password);
        if (!validPassLama) { return res.redirect('/dashboard?tab=password&error=Password lama Anda salah'); }
        const hashedPasswordBaru = await bcrypt.hash(password_baru, 10);
        await prisma.user.update({ where: { id: userId }, data: { password: hashedPasswordBaru } });
        res.redirect('/dashboard?tab=password&success=Password berhasil diubah');
    } catch (e) {
        console.error("Ganti Password Error:", e);
        res.redirect('/dashboard?tab=password&error=Terjadi kesalahan server');
    }
};

export const getDocsIndexPage = async (req, res) => {
    const docsDir = path.join(__dirname, '../views/partials/docs');
    try {
        const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.ejs')).sort();
        const docMenu = files.map(file => {
            const slug = file.replace(/^\d+_/, '').replace(/\.ejs$/, '');
            const nama = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const description = `Dokumentasi untuk endpoint ${nama}.`;
            return { nama, slug, description };
        });
        res.render('pages/public/docs-index', { docMenu: docMenu });
    } catch (error) {
        console.error("Gagal memuat daftar isi dokumentasi:", error);
        res.render('pages/public/docs-index', { docMenu: [] });
    }
};



export const getDocsDetailPage = async (req, res) => {
    const { slug } = req.params;
    const docsDir = path.join(__dirname, '../views/partials/docs');

    try {
        const files = fs.readdirSync(docsDir);
        const fileName = files.find(file => file.includes(slug));

        if (!fileName) {
            return res.redirect('/docs');
        }

    
        const partialPath = path.join(__dirname, '../views/partials/docs', fileName);
        
        const docTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        
        res.render('pages/public/docs-detail', { 
            partialPath: partialPath,
            docTitle: docTitle
        });

    } catch (error) {
        console.error(`Gagal memuat dokumen '${slug}':`, error);
        res.redirect('/docs');
    }
};
