import prisma from '../../db.js';
import requestIp from 'request-ip'; 
function logRequest(apiKeyId, endpoint, statusCode, ipAddress) {
    prisma.requestLog.create({
        data: {
            apiKeyId: apiKeyId,
            endpoint: endpoint,
            statusCode: statusCode,
            ipAddress: ipAddress, 
        },
    }).catch(err => {
        console.error("Gagal mencatat log request:", err);
    });
}

const authApiKey = async (req, res, next) => {
    const clientIp = requestIp.getClientIp(req); 
    const endpoint = req.originalUrl.split('?')[0];

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
   
    const apiKey = req.query.apikey || req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ status: 401, message: 'Akses ditolak. API Key tidak disediakan.' });
    }

    let keyData;
    try {
        keyData = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true } 
        });

        if (!keyData || !keyData.user) { 
            return res.status(401).json({ status: 401, message: 'API Key tidak valid.' });
        }

        if (keyData.user.isBanned) {
            logRequest(keyData.id, endpoint, 403, clientIp); 
            return res.status(403).json({ status: 403, message: 'Akses ditolak. Akun Anda telah diblokir.' });
        }

        if (keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
            logRequest(keyData.id, endpoint, 403, clientIp); 
            return res.status(403).json({ status: 403, message: 'Akses ditolak. API Key Anda telah berakhir (expired).' });
        }
        
        if (keyData.hitCount >= keyData.monthlyLimit) {
             logRequest(keyData.id, endpoint, 429, clientIp);
            return res.status(429).json({ 
                status: 429, 
                message: 'Limit request bulanan Anda telah tercapai.',
                limit: keyData.monthlyLimit
            });
        }

        logRequest(keyData.id, endpoint, 200, clientIp); 
        
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