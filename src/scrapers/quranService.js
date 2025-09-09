import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quranDataDir = path.join(__dirname, '../data/data-quran');

let quranData = []; 

function loadAndMergeQuranData() {
    console.log("Membaca dan menggabungkan data Al-Qur'an dari file...");
    try {
        const files = fs.readdirSync(quranDataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a) - parseInt(b)); 

        const allSurahs = [];
        for (const file of files) {
            const filePath = path.join(quranDataDir, file);
            const jsonData = fs.readFileSync(filePath, 'utf-8');
            const surahData = JSON.parse(jsonData);
            
            const surahKey = Object.keys(surahData)[0];
            if (surahData[surahKey]) {
                allSurahs.push(surahData[surahKey]);
            }
        }
        
        quranData = allSurahs;
        console.log(`Sukses! ${quranData.length} surah berhasil dimuat ke memori.`);

    } catch (error) {
        console.error("KRITIS: Gagal membaca atau menggabungkan file-file quran!", error);
    }
}

loadAndMergeQuranData();


export const getSemuaSurah = async () => {
    if (quranData.length === 0) throw new Error("Data Al-Qur'an tidak berhasil dimuat.");
    
    const daftarSurah = quranData.map(surah => {
        return {
            nomor: surah.number,
            nama: surah.name,
            nama_latin: surah.name_latin,
            jumlah_ayat: surah.number_of_ayah,
            arti: surah.translations.id.name
        };
    });
    return Promise.resolve(daftarSurah);
};

export const getDetailSurah = async (nomorSurah) => {
    if (quranData.length === 0) throw new Error("Data Al-Qur'an tidak berhasil dimuat.");

    const surah = quranData.find(s => s.number == nomorSurah);
    if (!surah) {
        throw new Error(`Surah dengan nomor ${nomorSurah} tidak ditemukan.`);
    }
    return Promise.resolve(surah);
};

export const getDetailAyat = async (nomorSurah, nomorAyat) => {
    if (quranData.length === 0) throw new Error("Data Al-Qur'an tidak berhasil dimuat.");

    const surah = quranData.find(s => s.number == nomorSurah);
    if (!surah) {
        throw new Error(`Surah dengan nomor ${nomorSurah} tidak ditemukan.`);
    }
    
    if (!surah.text[nomorAyat]) {
         throw new Error(`Ayat ${nomorAyat} di surah ${nomorSurah} tidak ditemukan.`);
    }

    const ayatData = {
        nomor_ayat: nomorAyat,
        teks_arab: surah.text[nomorAyat],
        terjemahan: surah.translations.id.text[nomorAyat],
        tafsir_kemenag: surah.tafsir.id.kemenag.text[nomorAyat] || "Tafsir tidak tersedia."
    };

    return Promise.resolve({
        surah: {
            nomor: surah.number,
            nama_latin: surah.name_latin,
        },
        ayat: ayatData
    });
};