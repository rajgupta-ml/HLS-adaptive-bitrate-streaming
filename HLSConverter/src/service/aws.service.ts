import { GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import path from "path"
export class awsService {
	private client?: S3Client;



	private async init() {
		if (!this.client) {
			const region = process.env.S3_REGION;
			const accessKeyId = process.env.S3_ACCESS_KEY_ID;
			const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
			if (!region || !accessKeyId || !secretAccessKey) throw new Error("The Enviorment are required");
			const config = {
				region,
				credentials: {
					accessKeyId,
					secretAccessKey,
				}
			}

			this.client = new S3Client(config);

		}
	}

	async downloadFileFromS3(bucketName: string, bucketKey: string) {
		try {
			await this.init()
			if (!this.client) throw new Error("S3 has not been initalized")
			const input = {
				Bucket: bucketName,
				Key: bucketKey,
			}
			const command = new GetObjectCommand(input);
			const response = await this.client.send(command);
			const byteArray = await response.Body?.transformToByteArray();
			console.log("Video Download is complete")
			return byteArray

		} catch (error) {
			console.log(error);
			throw new Error("Unknow error")

		}

	}
	async uploadFileToS3(Key: string, Body: string) {
		const Bucket = process.env.UPLOAD_BUCKET_NAME;
		const FOLDER = process.env.FOLDER;
		await this.init()
		if (!Bucket || !FOLDER) throw new Error("Upload Bucket should not be empty");
		// Ensure client is initialized
		if (!this.client) throw new Error("Client has not been initalized");
		const input: PutObjectCommandInput = {
			Bucket,
			Key: `${FOLDER}/${Key}`,
			Body: fs.createReadStream(path.resolve(Body)),
		};

		const command = new PutObjectCommand(input);

		try {
			await this.client.send(command);
			console.log(`File uploaded successfully: ${Key}`);
		} catch (error) {
			console.error('Upload error:', error);
			throw new Error(`Upload failed: ${(error as Error).message}`);
		}
	}


	async uploadDirToS3(dir: string) {
		const dirFiles = await fs.promises.readdir(dir);
		await Promise.all(dirFiles.map(async (value) => {
			const newPath = path.join(dir, value)
			const stat = await fs.promises.lstat(newPath);

			if (stat.isDirectory()) {
				await this.uploadDirToS3(newPath);
			} else {
				await this.uploadFileToS3(value, newPath)
			}
		}))


	}

}








