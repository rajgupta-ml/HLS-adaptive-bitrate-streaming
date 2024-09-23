import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function downloadFileFromS3(bucketName: string, bucketKey: string, client: S3Client) {
	const input = {
		Bucket: bucketName,
		Key: bucketKey,
	}
	const command = new GetObjectCommand(input);
	const response = await client.send(command);
	const byteArray = await response.Body?.transformToByteArray();
	return byteArray
}
