## **Daftar Kota untuk jadwal sholat**

Mengambil **seluruh daftar ID dan Nama Lokasi** yang didukung oleh API Jadwal Sholat. Gunakan endpoint ini untuk menemukan `id` kota yang Anda butuhkan untuk endpoint `/jadwal-sholat`.

**GET /api/v1/daftar-kota**
```html

Parameter (Query)
Endpoint ini tidak memerlukan parameter apapun.

Contoh Response (Sukses 200):
JSON

{
    "api_info": {
        "api_name": "API Scraper Daftar Kota (ID Jadwal Sholat)",
        "version": "1.0",
        "author": "mhcode",
        "source": "jadwalsholat.org"
    },
    "data": [
        {
            "id": "301",
            "lokasi": "Watampone"
        },
        {
            "id": "302",
            "lokasi": "Watansoppeng"
        },
        {
            "id": "303",
            "lokasi": "Wates"
        },
        {
            "id": "304",
            "lokasi": "Wonogiri"
        },
        // ... (dan seterusnya, ratusan kota lainnya)
    ]
}
```