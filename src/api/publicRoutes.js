import express from 'express';
import * as UserController from '../controllers/userController.js';
import authUser from '../middleware/authUser.js'; // Middleware proteksi user

const router = express.Router();

// --- Halaman Publik Statis ---

// Halaman Utama (Landing Page)
router.get('/', UserController.getLandingPage);

// Halaman Dokumentasi
router.get('/docs', UserController.getDocsPage);


// --- Autentikasi User (Customer) ---
router.get('/register', UserController.getRegisterPage);
router.post('/register', UserController.postRegister);
router.get('/login', UserController.getLoginPage); // Ini login USER, BUKAN ADMIN
router.post('/login', UserController.postLogin);
router.get('/logout', UserController.postLogout);


// --- Area Khusus User (Wajib Login sebagai User) ---
router.get('/dashboard', authUser, UserController.getDashboard); 
// 'authUser' akan memproteksi halaman ini. Jika belum login, akan dilempar ke /login
// Rute untuk form "Update Profil" (Nama, Email, Telepon)
router.post('/dashboard/update-profile', authUser, UserController.postUpdateProfile);
// Rute untuk form "Ganti Password"
router.post('/dashboard/change-password', authUser, UserController.postChangePassword);

export default router;