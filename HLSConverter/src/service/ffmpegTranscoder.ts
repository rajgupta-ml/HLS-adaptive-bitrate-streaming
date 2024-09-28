import Ffmpeg from "fluent-ffmpeg";
import { ws } from "./websocket.service";



export async function ffmpegTranscoder(outputDir: string, inputPath: string, ensureDirOrFile: Function, ws: ws) {

	try {
		await ensureDirOrFile(outputDir);
		const { WIDTH, HEIGHT } = process.env

		if (!WIDTH || !HEIGHT) {
			console.error("Environment variables cannot be empty");
			return
		}
		const outputPath = `${outputDir}/${WIDTH}x${HEIGHT}playlist.m3u8`

		return new Promise<string>((resolve, reject) => {
			Ffmpeg(inputPath)
				.size(`${WIDTH}x${HEIGHT}`)
				.outputOptions([
					'-codec:v libx264',
					'-codec:a aac',
					'-hls_time 10',
					'-hls_playlist_type vod',
					`-hls_segment_filename ${outputDir}/${WIDTH}x${HEIGHT}%03d.ts`,
					'-start_number 0'
				])
				.on('progress', (progress) => {
					if (!progress.percent) {
						console.error("percentage is undefiend");
					} else {
						ws.sendMessage({ status: "progress", percentage: Math.round(progress.percent) });
					}
				})
				.on('end', () => {
					resolve('HLS conversion finished successfully');
				})
				.on('error', (err) => {
					reject(`Error during HLS conversion: ${err}`);
				})
				.output(outputPath)
				.run();
		});
	} catch (error) {
		console.error(error)
	}
}
