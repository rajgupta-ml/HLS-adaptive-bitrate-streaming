import { S3Client } from "@aws-sdk/client-s3";



const credentials = {
	accessKeyId: process.env.S3_ACCESS_KEY || "",
	secretAccessKey: process.env.S3_ACCESS_SECRET || ""
}

let s3: S3Client;
try {
	s3 = new S3Client({
		region: 'ap-south-1',
		credentials
	});
	console.log("S3 client initialized successfully");
} catch (error) {
	console.error("Error initializing S3 client:", error);
}
export { s3 };
