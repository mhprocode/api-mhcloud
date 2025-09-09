import prisma from '../../db.js';
import bcrypt from 'bcryptjs';
import os from 'os';

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


export const getLoginPage = (req, res) => {
    if (req.session && req.session.isAdmin) return res.redirect('/admin/dashboard');
    res.render('pages/login', { error: null });
};

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

export const getDashboard = async (req, res) => {
    try {
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

        const dashboardData = {
            db_stats: {
                total_users: totalUsers,
                total_requests: totalRequests,
                requests_today: requestsToday,
                banned_ips: bannedIPs,
                roles: rolesCount
            },
            server_stats: serverStats
        };

        res.render('pages/dashboard', { 
            username: req.session.username,
            stats: dashboardData
        });

    } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
        res.render('pages/dashboard', { 
            username: req.session.username, 
            stats: null,
            error: "Gagal memuat data statistik."
        });
    }
};


export const getHistoryPage = async (req, res) => {
    try {
        const logs = await prisma.requestLog.findMany({
            orderBy: { requestedAt: 'desc' },
            take: 100, 
            include: { 
                apiKey: {
                    select: { 
                        key: true, 
                        user: {
                            select: { 
                                email: true,
                                name: true,
                                role: true,
                                isBanned: true 
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


export const getKeysPage = async (req, res) => {
     try {
        const keys = await prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, role: true } } } 
        });
        res.render('pages/keys', { keys: keys });
    } catch (error) {
        res.render('pages/keys', { keys: [] });
    }
};



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

export const createApiKey = async (req, res) => {
    res.redirect('/admin/keys');
};

export const deleteApiKey = async (req, res) => {
    res.redirect('/admin/keys');
};


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
        res.render('pages/edit-user', { user: user, roles: ['FREE', 'PREMIUM'], error: null });
    } catch (e) {
        res.redirect('/admin/users');
    }
};

export const postUpdateUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { email, role, monthlyLimit, expiresAt } = req.body; 

    try {
        const newRole = (role === 'FREE' || role === 'PREMIUM') ? role : 'FREE';
        const policy = ROLES_POLICY[newRole];

        const newLimit = parseInt(monthlyLimit) || policy.monthlyLimit;
        let newExpiry = expiresAt ? new Date(expiresAt) : policy.expiresAt;
        if (newRole === 'FREE') {
            newExpiry = null;
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                email: email,
                role: newRole,
                apiKey: {
                    update: { 
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
        await prisma.user.delete({
            where: { id: userId }
        });
        res.redirect('/admin/users?success=User berhasil dihapus');
    } catch (e) {
         res.redirect('/admin/users?error=Gagal menghapus user');
    }
};


export const postBanUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: true } 
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
            data: { isBanned: false } 
        });
        res.redirect('/admin/users?success=Blokir user berhasil dibuka');
    } catch (e) {
        res.redirect('/admin/users?error=Gagal membuka blokir');
    }
};



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
        if (e.code === 'P2002') {
             return res.redirect('/admin/ip-bans?error=IP tersebut sudah diblokir sebelumnya');
        }
        res.redirect('/admin/ip-bans?error=Gagal memblokir IP');
    }
};

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