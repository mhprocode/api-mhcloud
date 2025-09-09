import express from 'express';
import authAdmin from '../middleware/authAdmin.js'; 
import * as Admin from '../controllers/adminController.js'; 

const router = express.Router();

// --- Auth Admin ---
router.get('/login', Admin.getLoginPage);
router.post('/login', Admin.postLogin);
router.get('/logout', Admin.postLogout);

// --- Halaman Utama Admin (Diproteksi) ---
router.get('/dashboard', authAdmin, Admin.getDashboard);
router.get('/history', authAdmin, Admin.getHistoryPage);
router.get('/keys', authAdmin, Admin.getKeysPage); // (Halaman Key usang)

// --- BARU: Manajemen User (Customer) ---
router.get('/users', authAdmin, Admin.getUserManagementPage);
router.get('/users/edit/:id', authAdmin, Admin.getEditUserPage);
router.post('/users/update/:id', authAdmin, Admin.postUpdateUser);
router.post('/users/delete/:id', authAdmin, Admin.postDeleteUser);
router.post('/users/ban/:id', authAdmin, Admin.postBanUser);       // <-- RUTE BARU DITAMBAHKAN
router.post('/users/unban/:id', authAdmin, Admin.postUnbanUser);   // <-- RUTE BARU DITAMBAHKAN

// --- BARU: Manajemen IP Ban ---
router.get('/ip-bans', authAdmin, Admin.getIpBanPage);
router.post('/ip-bans/add', authAdmin, Admin.postBanIp);
router.post('/ip-bans/unban/:id', authAdmin, Admin.postUnbanIp);
router.post('/ip-bans/quick-ban', authAdmin, Admin.postQuickBanIp);


export default router;