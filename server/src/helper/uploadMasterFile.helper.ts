import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import * as fs from "fs";
import path from "path";
import { s3 } from "../config/S3Client.config";

export async function uploadMasterFile(key: string): Promise<void> {
	const { MASTER_FILE_BUCKET } = process.env;

	if (!MASTER_FILE_BUCKET) {
		throw new Error("Environment variable MASTER_FILE_BUCKET needs to be set");
	}

	try {
		const config: PutObjectCommandInput = {
			Bucket: MASTER_FILE_BUCKET,
			Body: fs.createReadStream(path.resolve(__dirname, "../temp/master.m3u8")),
			Key: `${key}/master.m3u8`,
		};

		const command = new PutObjectCommand(config);
		await s3.send(command);
		console.log("File uploaded successfully.");
	} catch (error) {
		console.error("Error uploading master file:", error);
		throw error; // Rethrow the error after logging it
	}
}
