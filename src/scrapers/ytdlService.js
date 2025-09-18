import  youtubedl  from 'youtube-dl-exec';

export const getYoutubeInfo = async (videoUrl) => {
    try {
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        };

        const result = await youtubedl(videoUrl, options);

        const cleanFormats = [];
        for (const format of result.formats) {
            if (format.url) {
                cleanFormats.push({
                    format_id: format.format_id,
                    ext: format.ext,
                    resolution: format.resolution,
                    vcodec: format.vcodec,
                    acodec: format.acodec,
                    filesize: format.filesize ? (format.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
                    url: format.url
                });
            }
        }

        const videoWithAudio = cleanFormats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
        const videoOnly = cleanFormats.filter(f => f.vcodec !== 'none' && f.acodec === 'none');
        const audioOnly = cleanFormats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
        return {
            title: result.title,
            thumbnail: result.thumbnail,
            duration: result.duration_string,
            channel: result.channel,
            view_count: result.view_count.toLocaleString('id-ID'), 
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