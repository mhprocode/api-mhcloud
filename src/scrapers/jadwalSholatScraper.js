import axios from 'axios';
import * as cheerio from 'cheerio';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
};

export const scrapeJadwalSholat = async (kotaId, tahun, bulan) => {
    const targetUrl = `https://jadwalsholat.org/adzan/monthly.php?id=${kotaId}&m=${bulan}&y=${tahun}`;

    try {
        const { data } = await axios.get(targetUrl, { headers: BROWSER_HEADERS });
        const $ = cheerio.load(data);

        const jadwalPerHari = [];
        
        $('table#schedule-table tbody tr').each((i, el) => {
            const row = $(el);
            const columns = row.find('td');

            const tanggal = {
                masehi: columns.eq(0).find('.masehi-date-text').text().trim(),
                hijriyah: columns.eq(0).find('.hijri-date-text').text().trim()
            };

            const waktu = {
                imsyak: columns.eq(2).text().trim(),
                shubuh: columns.eq(3).text().trim(),
                terbit: columns.eq(4).text().trim(),
                dhuha: columns.eq(5).text().trim(),
                dzuhur: columns.eq(6).text().trim(),
                ashr: columns.eq(7).text().trim(),
                maghrib: columns.eq(8).text().trim(),
                isya: columns.eq(9).text().trim()
            };

            jadwalPerHari.push({
                tanggal: tanggal,
                waktu: waktu
            });
        });

        const lokasi = $('input#inlineFormInputName').val() || "Lokasi tidak ditemukan";
        const bulanTahun = $('#schedule-content h2').text().trim();
        
        if (jadwalPerHari.length === 0) {
            throw new Error('Gagal mem-parsing jadwal. Struktur HTML target mungkin berubah.');
        }

        return {
            lokasi: lokasi,
            bulan: bulanTahun,
            jadwal: jadwalPerHari
        };

    } catch (error) {
        console.error("Scraping Jadwal Sholat Gagal:", error.message);
        throw new Error(`Gagal mengambil data untuk ID Kota ${kotaId}. Mungkin ID tidak valid atau terjadi masalah jaringan.`);
    }
};