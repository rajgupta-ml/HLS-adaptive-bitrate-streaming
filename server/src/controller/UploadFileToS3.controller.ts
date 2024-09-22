import express from "express";
import { IAwsServiceController } from "../interface/IAwsServiceController.interface";
import multer from "multer";

export class AwsServiceController implements IAwsServiceController {
	private uploadService: multer.Multer;

	constructor(uploadService: multer.Multer) {
		this.uploadService = uploadService;
	}

	uploadFileToS3 = async (request: express.Request, response: express.Response): Promise<void> => {
		const uploadMiddleware = this.uploadService.single('file');

		try {
			await new Promise<void>((resolve, reject) => {
				uploadMiddleware(request, response, (err: any) => {
					if (err instanceof multer.MulterError) {
						reject(new Error(`Multer error: ${err.message}`));
					} else if (err) {
						reject(new Error(err.message || 'An unknown error occurred during upload'));
					} else {
						resolve();
					}
				});
			});

			if (!request.file) {
				response.status(400).json({ error: 'No file uploaded' });
				return;
			}


			response.status(200).json({
				ok: true,
				message: 'File uploaded successfully',
			});
		} catch (error) {
			console.error('Error in uploadFileToS3:', error);
			response.status(error instanceof multer.MulterError ? 400 : 500).json({
				error: 'An error occurred while uploading the file',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
}
