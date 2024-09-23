// Download the file on the machine
// Use ffmeg to convert the data 
// Upload the data to s3 bucket
import dotenv from "dotenv";
dotenv.config();

import { initializeS3 } from "./initializeS3"
import { downloadFileFromS3 } from "./downloadFileFromS3";
import path from "path";
import { saveFileTemp } from "./saveFileTemp";
import { getMetaData } from "./getMetaData";
import { getEncodingLadders } from "./getEncodingLadder";
import { IMetaData } from "./interface/IMetaData.interface";
import { ffmpegTranscoder } from "./ffmpegTranscoder";
import { ILadder } from "./interface/ILadder.interface";
async function init() {
	const tempDir = path.join(__dirname, "../temp");
	const downloadBucketName = process.env.DOWNLOAD_BUCKET_NAME;
	const key = process.env.KEY;
	const uploadBucketName = process.env.UPLOAD_BUCKET_NAME;
	const tempFileDir = `${tempDir}/temp`
	const m3u8OutputDir = path.join(__dirname, "../m3u8Output");
	try {

		if (!downloadBucketName || !key || !uploadBucketName) throw new Error("This env key's cannot be empty");
		//Intialize the S3 client
		const client = await initializeS3()
		//Download the file onto the machine
		const unit8Array = await downloadFileFromS3(downloadBucketName, key, client);


		if (!unit8Array) throw new Error("Array Empty")
		//saving the unit8Arry temporally
		await saveFileTemp(unit8Array, tempDir);
		//Get the metaData about the video
		const metadata: IMetaData = await getMetaData(tempFileDir);
		// get Encoding ladders
		const ladder: ILadder[] = getEncodingLadders(metadata);
		//transcoder the file into m3u8
		await ffmpegTranscoder(m3u8OutputDir, ladder, tempFileDir);
		//Upload the file onto s3 bucket
		// await uploadFileToS3(uploadBucketName, transcodeFile);
	} catch (error) {
		console.log(error);
	}

}

init();
