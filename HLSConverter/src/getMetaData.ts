import Ffmpeg from "fluent-ffmpeg";
import { ensureDirOrFile } from "./saveFileTemp";
import { IMetaData } from "./interface/IMetaData.interface";

export async function getMetaData(dir: string): Promise<IMetaData> {
	const flag = await ensureDirOrFile(dir, "FILE");
	if (!flag) throw new Error("video file is not created");


	return new Promise((resolve, reject) => {
		Ffmpeg.ffprobe(dir, (err, metadata) => {
			if (err) reject(`Meta data error + ${err.message}`);
			const { width, height } = metadata.streams[0]
			const bitrate = metadata.format.bit_rate

			if (!width || !height || !bitrate) reject("Missing col")
			resolve({ width: Number(width), height: Number(height), bitrate: Number(bitrate) })
		})



	})
}
