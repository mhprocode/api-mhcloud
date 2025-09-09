import express from 'express';
import authApiKey from '../middleware/authApiKey.js'; // Impor Middleware Proteksi
import { getRukunData, getAllSoalAsahOtak, getRandomSoalAsahOtak } from '../controllers/apiController.js';

const router = express.Router();

router.get('/rukun-islam', authApiKey, getRukunData);
router.get('/asah-otak/all', authApiKey, getAllSoalAsahOtak);
router.get('/asah-otak/random', authApiKey, getRandomSoalAsahOtak);


export default router;