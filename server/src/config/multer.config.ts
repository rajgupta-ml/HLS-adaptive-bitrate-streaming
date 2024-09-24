import multer from "multer";
import multerS3 from "multer-s3";
import express from "express";
import { s3 } from "./S3Client.config";
const storage = multerS3({
	s3: s3,
	bucket: process.env.S3_BUCKET_NAME || "",
	key: (req, file, cb) => {
		cb(null, file.originalname);
	},
	contentType: multerS3.AUTO_CONTENT_TYPE,
})
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	// List of common video MIME types
	const allowedVideoMimeTypes = [
		'video/mp4',
		'video/mpeg',
		'video/ogg',
		'video/webm',
		'video/x-msvideo',  // AVI
		'video/quicktime',  // MOV
		'video/x-ms-wmv',   // WMV
		'video/x-flv',      // FLV
		'video/3gpp',
		'video/3gpp2',
	];
	if (allowedVideoMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type. Only video files are allowed.'));
	}
};
export const upload = multer({ storage, fileFilter })
