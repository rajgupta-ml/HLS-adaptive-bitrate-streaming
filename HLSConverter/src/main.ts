// Download the file on the machine
// Use ffmeg to convert the data 
// Upload the data to s3 bucket
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { ffmpegTranscoder } from "./ffmpegTranscoder";
import { awsService } from "./service/aws.service";
import { fileSystemService } from "./service/filesystem.service";
async function init() {
	const tempDir = path.join(__dirname, "../temp");
	const downloadBucketName = process.env.DOWNLOAD_BUCKET_NAME;
	const key = process.env.KEY;
	const uploadBucketName = process.env.UPLOAD_BUCKET_NAME;
	const tempFileDir = `${tempDir}/temp`
	const outputDir = path.join(__dirname, "../m3u8");
	try {

		if (!downloadBucketName || !key || !uploadBucketName) throw new Error("This env key's cannot be empty");
		//Intialize the S3 client
		const service = new awsService();
		const fsService = new fileSystemService();
		//Download the file onto the machine
		const unit8Array = await service.downloadFileFromS3(downloadBucketName, key);


		if (!unit8Array) throw new Error("Array Empty")
		//saving the unit8Arry temporally
		await fsService.saveFileTemp(unit8Array, tempDir);
		//transcoder the file into m3u8
		await ffmpegTranscoder(outputDir, tempFileDir);
		//Upload the whole folder onto s3 bucket
		console.log("Upload has started");
		await service.uploadDirToS3(outputDir);
		console.log("Upload finished");

		// Cleanup stage
		await fsService.dirDelete(tempFileDir);
		await fsService.dirDelete(outputDir);
	} catch (error) {
		console.log(error);
	}

}

init();
