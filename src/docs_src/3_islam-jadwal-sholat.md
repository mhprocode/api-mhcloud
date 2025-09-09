**Jadwal Sholat**

Mengambil data jadwal sholat bulanan dari **jadwalsholat.org** berdasarkan ID Kota, Tahun, dan Bulan.


**GET /api/v1/jadwal-sholat**
```json
Parameter (Query)
kota (Wajib): string - ID unik untuk setiap kota. Untuk menemukan ID kota Anda,
 buka api kota jadwal sholat, cari kota Anda,

tahun (Opsional): number - Tahun yang diinginkan (misal: 2025). 
Jika dikosongkan, akan menggunakan tahun saat ini.

bulan (Opsional): number - Bulan yang diinginkan (1-12). 
Jika dikosongkan, akan menggunakan bulan saat ini.

Contoh Penggunaan:

/api/v1/jadwal-sholat?kota=207
/api/v1/jadwal-sholat?kota=207&tahun=2025&bulan=12

Contoh Response (Sukses 200):

{
    "api_info": {
        "api_name": "API Scraper Jadwal Sholat",
        "version": "1.0",
        "author": "mhcode",
        "source": "jadwalsholat.org"
    },
    "data": {
        "lokasi": "KAB. BOGOR",
        "bulan": "September 2025",
        "jadwal": [
            {
                "tanggal": {
                    "masehi": "01",
                    "hijriyah": "08 Rabi'ul Awal"
                },
                "waktu": {
                    "imsyak": "04:03",
                    "shubuh": "04:13",
                    "terbit": "05:27",
                    "dhuha": "05:51",
                    "dzuhur": "11:30",
                    "ashr": "14:49",
                    "maghrib": "17:28",
                    "isya": "18:38"
                }
            },
            // ... (data untuk hari-hari berikutnya)
        ]
    }
}

```