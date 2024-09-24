import express from "express";
import { IAwsServiceController } from "../interface/IAwsServiceController.interface";
import multer from "multer";
import { CustomFile } from "../interface/ICustomData.interface";

export class AwsServiceController implements IAwsServiceController {
	private uploadService: multer.Multer;

	constructor(uploadService: multer.Multer) {
		this.uploadService = uploadService;
	}

	uploadFileToS3 = async (request: express.Request, response: express.Response): Promise<void> => {
		const uploadMiddleware = this.uploadService.single('fileToUpload');

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

			const file = request.file as CustomFile;
			
			if(file && file.s3){
				const uploadDetails = {
					fileName: file.originalname,
					fileSize: file.size,
					mimeType: file.mimetype,// S3 URL of the uploaded file
				};
	
				response.status(200).json({
					message: 'File uploaded successfully',
					file: uploadDetails
				});

			}
		} catch (error) {
			console.error('Error in uploadFileToS3:', error);
			response.status(error instanceof multer.MulterError ? 400 : 500).json({
				error: 'An error occurred while uploading the file',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}


	deleteFileFromS3 = async (request: Express.Request, response: Express.Response): Promise<void> => {

	}


}
