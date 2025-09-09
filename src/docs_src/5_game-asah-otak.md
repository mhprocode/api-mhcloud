## **game Asah Otak**

Menyediakan kumpulan data soal dan jawaban untuk permainan asah otak.
 API ini menyediakan dua endpoint: satu untuk mengambil semua data, 
 dan satu lagi untuk mengambil satu soal secara acak.

### Ambil Soal Acak (Random)
Endpoint ini adalah yang paling umum digunakan. Ia akan mengembalikan satu objek JSON berisi soal 
dan jawaban yang dipilih secara acak.

**GET /api/v1/asah-otak/random**
```html
Contoh Response (Sukses 200):
JSON

{
    "api_info": {
        "api_name": "API Asah Otak",
        "version": "1.0",
        "author": "mhcode",
        "description": "Kumpulan soal dan jawaban untuk permainan asah otak."
    },
    "data": {
        "index": 42,
        "soal": "Makhluk halus mitos Jawa, berwujud manusia mirip kera, bertubuh besar dan berbulu?",
        "jawaban": "Genderuwo"
    }
}


Ambil Semua Soal (All)
Endpoint ini mengembalikan seluruh database soal dalam satu array. (Hati-hati, data besar).


ENDPOINT:
GET /api/v1/asah-otak/all
Contoh Response (Sukses 200):
JSON

{
    "api_info": { ... },
    "data": [
        { "index": 1, "soal": "...", "jawaban": "..." },
        { "index": 2, "soal": "...", "jawaban": "..." }
    ]
}