
# **API Al-Qur'an**
```html

Menyediakan data Al-Qur'an lengkap dengan teks Arab,
 Latin, dan terjemahan Bahasa Indonesia. Data diambil dari database JSON open-source.
Daftar Semua Surah
Mengembalikan daftar 114 surah beserta informasinya (tanpa ayat).


```
**GET /api/v1/quran/surah**
```html
Detail Surah
Mengembalikan informasi lengkap satu surah,
termasuk semua ayat di dalamnya. Ganti :nomorSurah dengan nomor
surah yang diinginkan (1-114).


```

**GET /api/v1/quran/surah/nomorSurah**
Contoh: /api/v1/quran/surah/1 (Untuk Al-Fatihah)
```html

Ayat Spesifik
Mengembalikan satu ayat spesifik dari surah tertentu.

```

**GET /api/v1/quran/surah/:nomorSurah/nomorAyat**
```html
Contoh: /api/v1/quran/surah/1/2 (Untuk ayat ke-2 dari Al-Fatihah)
```
```json
Contoh Response (Sukses 200) untuk Ayat Spesifik:


{
    "status": 200,
    "message": "Sukses",
    "data": {
        "surah": {
            "nomor": "1",
            "nama_latin": "Al-Fatihah"
        },
        "ayat": {
            "nomor_ayat": "2",
            "teks_arab": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            "terjemahan": "Segala puji bagi Allah, Tuhan seluruh alam,",
            "tafsir_kemenag": "Pada ayat di atas, Allah memulai firman-Nya..."
        }
    }
}

```