import { S3Client } from "@aws-sdk/client-s3";


export async function initializeS3() {
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

	return new S3Client(config);
}

