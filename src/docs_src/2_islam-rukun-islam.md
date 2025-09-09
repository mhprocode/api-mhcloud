
# **Rukun Islam dan Rukun Iman.**

Mengembalikan data JSON terstruktur
mengenai Rukun Islam dan Rukun Iman.

**GET /api/v1/rukun-islam**
```json
Contoh Response (Sukses 200):

{
    "api_info": {
        "api_name": "API Rukun Islam & Rukun Iman",
        "version": "1.0",
        "author": "mhcode"
    },
    "data": {
        "rukun_islam": [
            { "nomor": 1, "nama": "Syahadat", ... },
            { "nomor": 2, "nama": "Sholat", ... }
        ],
        "rukun_iman": [ ... ]
    }
}
```