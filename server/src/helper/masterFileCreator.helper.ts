import * as fs from 'fs';
import path from "path"
interface ResolutionInfo {
	width: number;
	height: number;
	bandwidth: number;
}

const resolutions: Record<number, ResolutionInfo> = {
	720: { width: 1280, height: 720, bandwidth: 3000000 },
	480: { width: 854, height: 480, bandwidth: 1000000 },
	360: { width: 640, height: 360, bandwidth: 1500000 },
	144: { width: 256, height: 144, bandwidth: 250000 }
};

export async function generateMasterM3U8(topResolution: number): Promise<void> {
	const tempDir = path.join(__dirname, "../temp")
	const availableResolutions = Object.keys(resolutions)
		.map(Number)
		.filter(res => res <= topResolution)
		.sort((a, b) => b - a);


	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true });
	}

	const content: string[] = [
		"#EXTM3U",
		"#EXT-X-VERSION:3"
	];

	for (const res of availableResolutions) {
		const info = resolutions[res];
		content.push(
			`# Variant stream for ${info.width}x${info.height}`,
			`#EXT-X-STREAM-INF:BANDWIDTH=${info.bandwidth},RESOLUTION=${info.width}x${info.height}`,
			`${info.width}x${info.height}playlist.m3u8`
		);
	}

	fs.writeFileSync(path.join(tempDir, "master.m3u8"), content.join("\n"));
	console.log(`master.m3u8 file has been created with top resolution ${topResolution}p`);
}


