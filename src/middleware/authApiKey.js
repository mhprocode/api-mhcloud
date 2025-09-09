import prisma from '../../db.js';
import requestIp from 'request-ip'; // Paket yang sudah diinstal tadi

// Fungsi helper untuk logging (sudah termasuk IP)
function logRequest(apiKeyId, endpoint, statusCode, ipAddress) {
    prisma.requestLog.create({
        data: {
            apiKeyId: apiKeyId,
            endpoint: endpoint,
            statusCode: statusCode,
            ipAddress: ipAddress, // Catat IP
        },
    }).catch(err => {
        console.error("Gagal mencatat log request:", err);
    });
}

// ===================================
// MIDDLEWARE UTAMA (VERSI FINAL DENGAN USER BAN)
// ===================================
const authApiKey = async (req, res, next) => {
    const clientIp = requestIp.getClientIp(req); 
    const endpoint = req.originalUrl.split('?')[0];

    // --- 1. CEK IP BANNED (Dari langkah sebelumnya) ---
    try {
        const isBanned = await prisma.bannedIP.findUnique({
            where: { ipAddress: clientIp }
        });
        if (isBanned) {
            return res.status(403).json({ status: 403, message: 'Akses ditolak.' });
        }
    } catch (error) {
         return res.status(500).json({ status: 500, message: 'Server Error saat validasi IP.' });
    }
   
    // --- 2. CEK API KEY ---
    const apiKey = req.query.apikey || req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ status: 401, message: 'Akses ditolak. API Key tidak disediakan.' });
    }

    let keyData;
    try {
        // Cari key DAN data user (untuk role, limit, DAN STATUS BAN)
        keyData = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true } // WAJIB ambil data user
        });

        if (!keyData || !keyData.user) { // Pastikan key ada DAN terhubung ke user
            return res.status(401).json({ status: 401, message: 'API Key tidak valid.' });
        }

        // --- 3. BARU: CEK STATUS BAN USER ---
        // Ini adalah fitur baru yang Anda minta.
        if (keyData.user.isBanned) {
            logRequest(keyData.id, endpoint, 403, clientIp); // Catat log (gagal)
            return res.status(403).json({ status: 403, message: 'Akses ditolak. Akun Anda telah diblokir.' });
        }

        // --- 4. CEK EXPIRED (Dari langkah sebelumnya) ---
        if (keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
            logRequest(keyData.id, endpoint, 403, clientIp); 
            return res.status(403).json({ status: 403, message: 'Akses ditolak. API Key Anda telah berakhir (expired).' });
        }
        
        // --- 5. CEK LIMIT BULANAN (Dari langkah sebelumnya) ---
        if (keyData.hitCount >= keyData.monthlyLimit) {
             logRequest(keyData.id, endpoint, 429, clientIp);
            return res.status(429).json({ 
                status: 429, 
                message: 'Limit request bulanan Anda telah tercapai.',
                limit: keyData.monthlyLimit
            });
        }

        // --- 6. SUKSES ---
        logRequest(keyData.id, endpoint, 200, clientIp); // Log sukses
        
        prisma.apiKey.update({
            where: { id: keyData.id },
            data: { hitCount: { increment: 1 } },
        }).catch(err => console.error("Gagal update hit count:", err));

        next();

    } catch (error) {
        console.error("Server Error saat validasi key:", error);
        return res.status(500).json({ status: 500, message: 'Server Error Validasi Key.' });
    }
};

export default authApiKey;