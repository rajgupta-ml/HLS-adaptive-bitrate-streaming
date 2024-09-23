import Ffmpeg from "fluent-ffmpeg";
import { ILadder } from "./interface/ILadder.interface";
import { ensureDirOrFile } from "./saveFileTemp";

export async function ffmpegTranscoder(outputDir: string, ladder: ILadder[], inputPath: string) {
	await ensureDirOrFile(outputDir);
	const variantPlaylists = ladder.map(rung => {
		const [width, height] = rung.resolution.split('x').map(Number);
		const outputPath = `${outputDir}/${width}p.m3u8`

		return new Promise<string>((resolve, reject) => {
			Ffmpeg(inputPath)
				.output(outputPath)
				.withVideoCodec("libx264")
				.withSize(`${width}x${height}`)
				.withAudioCodec("aac")
				.on('start', command => console.log('FFmpeg command:', command))
				.on('stderr', stderr => console.error('FFmpeg stderr:', stderr))
				.on('end', () => resolve(outputPath))
				.on('error', (err) => reject(err))
				.run();
		});
	});
	try {
		await Promise.all(variantPlaylists);
		console.log("transcoding is complete");
	} catch (error) {
		console.log(error);
	}

}
