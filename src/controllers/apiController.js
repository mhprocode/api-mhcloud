import { getRukunDataStatic } from '../scrapers/rukunIslamScraper.js';
import { getAllAsahOtak, getRandomAsahOtak, asahOtakApiInfo } from '../scrapers/asahOtakService.js';

export const getRukunData = async (req, res) => {
    try {
        const data = await getRukunDataStatic(); 

        const responseFormat = {
            api_info: {
                api_name: "API Rukun Islam & Rukun Iman",
                version: "1.0",
                author: "mhcode" // Ganti nama Anda
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