import { getRukunDataStatic } from '../scrapers/rukunIslamScraper.js';
import { getAllAsahOtak, getRandomAsahOtak, asahOtakApiInfo, } from '../scrapers/asahOtakService.js';
import { scrapeJadwalSholat } from '../scrapers/jadwalSholatScraper.js';
import { scrapeDaftarKota } from '../scrapers/daftarKotaScraper.js';
import { getSemuaSurah, getDetailSurah, getDetailAyat } from '../scrapers/quranService.js';

export const getRukunData = async (req, res) => {
    try {
        const data = await getRukunDataStatic(); 

        const responseFormat = {
            api_info: {
                api_name: "API Rukun Islam & Rukun Iman",
                version: "1.0",
                author: "mhcode" 
            },
            data: data
        };
        res.status(200).json(responseFormat);

    } catch (error) {
        res.status(500).json({ status: 500, message: 'Gagal memproses data.' });
    }
};
export const getAllSoalAsahOtak = async (req, res) => {
    try {
        const data = await getAllAsahOtak();
        res.status(200).json({
            api_info: asahOtakApiInfo, 
            data: data
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Gagal memproses data.', error: error.message });
    }
};
export const getRandomSoalAsahOtak = async (req, res) => {
     try {
        const data = await getRandomAsahOtak();
        res.status(200).json({
            api_info: asahOtakApiInfo,
            data: data 
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Gagal memproses data.', error: error.message });
    }
};
export const getJadwalSholat = async (req, res) => {
    const { kota, tahun, bulan } = req.query;

    if (!kota) {
        return res.status(400).json({ 
            status: 400,
            message: 'Parameter "kota" (ID Kota) wajib diisi. Contoh: ?kota=207' 
        });
    }

    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || (new Date().getMonth() + 1); 

    try {
        const data = await scrapeJadwalSholat(kota, currentYear, currentMonth);

        const responseFormat = {
            api_info: {
                api_name: 'API Scraper Jadwal Sholat',
                version: '1.0',
                author: 'mhcode',
                source: 'jadwalsholat.org'
            },
            data: data
        };

        res.status(200).json(responseFormat);

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Gagal memproses data scraper.',
            error: error.message
        });
    }
};
export const getDaftarKota = async (req, res) => {
    try {
        const data = await scrapeDaftarKota();

        const responseFormat = {
            api_info: {
                api_name: 'API Scraper Daftar Kota (ID Jadwal Sholat)',
                version: '1.0',
                author: 'mhcode',
                source: 'jadwalsholat.org'
            },
            data: data
        };

        res.status(200).json(responseFormat);

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Gagal memproses data scraper.',
            error: error.message
        });
    }
};
export const getDaftarSurah = async (req, res) => {
    try {
        const data = await getSemuaSurah();
        res.status(200).json({ status: 200, message: "Sukses", data: data });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Gagal mengambil daftar surah.' });
    }
};

export const getSurahByNomor = async (req, res) => {
    try {
        const nomorSurah = req.params.nomorSurah;
        const data = await getDetailSurah(nomorSurah);
        res.status(200).json({ status: 200, message: "Sukses", data: data });
    } catch (error) {
        res.status(404).json({ status: 404, message: error.message });
    }
};

export const getAyatSpesifik = async (req, res) => {
    try {
        const { nomorSurah, nomorAyat } = req.params;
        const data = await getDetailAyat(nomorSurah, nomorAyat);
        res.status(200).json({ status: 200, message: "Sukses", data: data });
    } catch (error) {
        res.status(404).json({ status: 404, message: error.message });
    }
};