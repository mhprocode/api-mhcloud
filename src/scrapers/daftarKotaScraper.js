import axios from 'axios';
import * as cheerio from 'cheerio';

const URL_TARGET = 'https://www.jadwalsholat.org/widget-jadwal-sholat';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
};

export const scrapeDaftarKota = async () => {
    try {
        const { data } = await axios.get(URL_TARGET, { headers: BROWSER_HEADERS });
        const $ = cheerio.load(data);

        const daftarKota = []; 
        
        $('table#tablepress-2 tbody tr').each((index, element) => {
            const row = $(element);
            
            const id = row.find('td.column-1').text().trim();
            const nama = row.find('td.column-2').text().trim();

            if (id && nama) {
                daftarKota.push({
                    id: id,
                    lokasi: nama
                });
            }
        });

        if (daftarKota.length === 0) {
            throw new Error('Gagal mem-parsing daftar kota. Selector atau struktur web target mungkin berubah.');
        }

        return daftarKota;

    } catch (error) {
        console.error("Scraping Daftar Kota Gagal:", error.message);
        throw new Error('Gagal mengambil data dari sumber (jadwalsholat.org).');
    }
};