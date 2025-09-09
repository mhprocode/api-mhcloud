const data = {
    rukun_islam: [
        { nomor: 1, nama: "Syahadat", keterangan: "Mengucapkan dua kalimat syahadat." },
        { nomor: 2, nama: "Sholat", keterangan: "Mendirikan sholat lima waktu." },
        { nomor: 3, nama: "Zakat", keterangan: "Menunaikan zakat." },
        { nomor: 4, nama: "Puasa Ramadhan", keterangan: "Berpuasa di bulan Ramadhan." },
        { nomor: 5, nama: "Haji", keterangan: "Menunaikan ibadah haji bagi yang mampu." }
    ],
    rukun_iman: [
        { nomor: 1, nama: "Iman kepada Allah", keterangan: "Percaya bahwa Allah SWT adalah satu-satunya Tuhan." },
        { nomor: 2, nama: "Iman kepada Malaikat", keterangan: "Percaya kepada malaikat-malaikat ciptaan Allah." },
        { nomor: 3, nama: "Iman kepada Kitab", keterangan: "Percaya kepada kitab-kitab suci yang diturunkan Allah." },
        { nomor: 4, nama: "Iman kepada Nabi & Rasul", keterangan: "Percaya kepada nabi dan rasul utusan Allah." },
        { nomor: 5, nama: "Iman kepada Hari Akhir", keterangan: "Percaya kepada hari kiamat." },
        { nomor: 6, nama: "Iman kepada Qada & Qadar", keterangan: "Percaya kepada takdir baik dan buruk dari Allah." }
    ]
};

export const getRukunDataStatic = async () => {
    return Promise.resolve(data);
};