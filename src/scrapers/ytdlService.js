import  youtubedl  from 'youtube-dl-exec';

export const getYoutubeInfo = async (videoUrl) => {
    try {
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        };

        const result = await youtubedl(videoUrl, options);
        
        // --- LOGIKA BARU DIMULAI DARI SINI ---

        const cleanFormats = [];
        for (const format of result.formats) {
            // Kita hanya ambil format yang punya link download
            if (format.url) {
                cleanFormats.push({
                    format_id: format.format_id,
                    ext: format.ext,
                    resolution: format.resolution,
                    vcodec: format.vcodec,
                    acodec: format.acodec,
                    // Beberapa format tidak memiliki filesize, beri nilai default
                    filesize: format.filesize ? (format.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
                    url: format.url
                });
            }
        }

        // 1. Video LENGKAP (ada video DAN audio)
        // Ini biasanya hanya tersedia di kualitas 720p ke bawah
        const videoWithAudio = cleanFormats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');

        // 2. Video SAJA (tanpa audio)
        // Ini biasanya untuk kualitas HD (1080p, 4K)
        const videoOnly = cleanFormats.filter(f => f.vcodec !== 'none' && f.acodec === 'none');

        // 3. Audio SAJA (tanpa video)
        const audioOnly = cleanFormats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');


        // Kembalikan data yang sudah dipisahkan dengan benar
        return {
            title: result.title,
            thumbnail: result.thumbnail,
            duration: result.duration_string,
            channel: result.channel,
            view_count: result.view_count.toLocaleString('id-ID'), // Format angka
            // Ganti nama 'video' menjadi 'videoWithAudio' agar lebih jelas
            videoWithAudio: videoWithAudio,
            videoOnly: videoOnly,
            audioOnly: audioOnly,
        };

    } catch (error) {
        console.error("YTDL Service Error:", error.message);
        if (error.stderr && error.stderr.includes('Unsupported URL')) {
             throw new Error('URL YouTube tidak valid atau tidak didukung.');
        }
        throw new Error('Gagal mengambil data dari YouTube.');
    }
};