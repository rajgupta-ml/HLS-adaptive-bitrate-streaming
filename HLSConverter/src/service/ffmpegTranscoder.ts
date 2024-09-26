import Ffmpeg from "fluent-ffmpeg";



export async function ffmpegTranscoder(outputDir: string, inputPath: string, ensureDirOrFile : Function) {
	await ensureDirOrFile(outputDir);
	const { WIDTH, HEIGHT } = process.env
	const outputPath = `${outputDir}/playlist.m3u8`

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
			.on("stderr", (err) => console.log(err))
			.on('end', () => {
				resolve('HLS conversion finished successfully');
			})
			.on('error', (err) => {
				reject(`Error during HLS conversion: ${err}`);
			})
			.output(outputPath)
			.run();
	});
}
