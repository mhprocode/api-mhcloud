import express from 'express';
import authApiKey from '../middleware/authApiKey.js'; // Impor Middleware Proteksi
import { getRukunData, getAllSoalAsahOtak, getRandomSoalAsahOtak, getJadwalSholat, getDaftarKota, getDaftarSurah, getSurahByNomor, getAyatSpesifik } from '../controllers/apiController.js';

const router = express.Router();

router.get('/rukun-islam', authApiKey, getRukunData);
router.get('/asah-otak/all', authApiKey, getAllSoalAsahOtak);
router.get('/asah-otak/random', authApiKey, getRandomSoalAsahOtak);
router.get('/jadwal-sholat', authApiKey, getJadwalSholat);
router.get('/daftar-kota', authApiKey, getDaftarKota);
router.get('/quran/surah', authApiKey, getDaftarSurah); 
router.get('/quran/surah/:nomorSurah', authApiKey, getSurahByNomor); 
router.get('/quran/surah/:nomorSurah/:nomorAyat', authApiKey, getAyatSpesifik); 


export default router;