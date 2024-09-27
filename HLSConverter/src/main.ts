import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { awsService } from "./service/aws.service";
import { fileSystemService } from "./service/filesystem.service";
import { ffmpegTranscoder } from "./service/ffmpegTranscoder";
import { ws } from "./service/websocket.service";

async function init() {
	const tempDir = path.join(__dirname, "../temp");

	const { DOWNLOAD_BUCKET_NAME, KEY, UPLOAD_BUCKET_NAME, FOLDER } = process.env
	const tempFileDir = `${tempDir}/temp`;
	const outputDir = path.join(__dirname, "../m3u8");

	if (!DOWNLOAD_BUCKET_NAME || !KEY || !UPLOAD_BUCKET_NAME || !FOLDER) {
		console.error("Environment variables cannot be empty");
		return;
	}

	const service = new awsService();
	const fsService = new fileSystemService();
	const wsInstance = new ws(FOLDER);
	try {
		await wsInstance.connect();
		wsInstance.sendMessage({ status: "started", percentage: 0 });
		const unit8Array = await service.downloadFileFromS3(DOWNLOAD_BUCKET_NAME, KEY);
		if (!unit8Array) throw new Error("Downloaded array is empty");

		await fsService.saveFileTemp(unit8Array, tempDir);
		await ffmpegTranscoder(outputDir, tempFileDir, fsService.ensureDirOrFile.bind(fsService), wsInstance);

		console.log("Upload has started");
		await service.uploadDirToS3(outputDir);
		console.log("Upload finished");

		wsInstance.sendMessage({ status: "completed", percentage: 100 })

	} catch (error) {
		console.error("Error during processing:", error);
	} finally {
		// Cleanup stage
		try {
			await fsService.dirDelete(tempDir);
			await fsService.dirDelete(outputDir);
		} catch (cleanupError) {
			console.error("Error during cleanup:", cleanupError);
		} finally {
			wsInstance.close()
		}
	}
}

init();
