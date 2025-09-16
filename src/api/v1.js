import express from 'express';
import authApiKey from '../middleware/authApiKey.js'; 
import { getRukunData, getAllSoalAsahOtak, getRandomSoalAsahOtak, getJadwalSholat, getDaftarKota, getDaftarSurah, getSurahByNomor, getAyatSpesifik, getYoutubeVideo, getYoutubeAudio  } from '../controllers/apiController.js';

const router = express.Router();

router.get('/rukun-islam', authApiKey, getRukunData);
router.get('/asah-otak/all', authApiKey, getAllSoalAsahOtak);
router.get('/asah-otak/random', authApiKey, getRandomSoalAsahOtak);
router.get('/jadwal-sholat', authApiKey, getJadwalSholat);
router.get('/daftar-kota', authApiKey, getDaftarKota);
router.get('/quran/surah', authApiKey, getDaftarSurah); 
router.get('/quran/surah/:nomorSurah', authApiKey, getSurahByNomor); 
router.get('/quran/surah/:nomorSurah/:nomorAyat', authApiKey, getAyatSpesifik);
router.get('/ytmp4', authApiKey, getYoutubeVideo); 
router.get('/ytmp3', authApiKey, getYoutubeAudio);


export default router;