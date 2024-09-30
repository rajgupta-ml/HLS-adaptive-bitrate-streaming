import express from "express";
import { IAwsServiceController } from "../interface/IAwsServiceController.interface";
import multer from "multer";
import { extractInformation } from "../helper/extractResolution.helper";
import { uploadMasterFile } from "../helper/uploadMasterFile.helper";
import { generateMasterM3U8 } from "../helper/masterFileCreator.helper";
import * as fs from "fs";
import path from "path";
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

			const file = request.file as Express.MulterS3.File;


			console.log("Reaching")
			if (file && file) {
				const uploadDetails = {
					fileName: file.originalname,
					fileSize: file.size,
					mimeType: file.mimetype,
					fileDestination: file.destination,
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


	async uploadMasterFileToS3(request: express.Request, response: express.Response) {

		try {
			const { fileName } = request.body;
			console.log(fileName)
			if (!fileName) {
				response.status(400).json({ error: 'Master File Could not be uploaded' });
				return;
			}

			const informationExtraction: { uuid: string, width: string, height: string } | null = extractInformation(fileName);
			if (!informationExtraction) {
				response.status(400).json({ error: 'Master File could not be created' });
				return;

			}
			console.log(informationExtraction)
			await generateMasterM3U8(Number(informationExtraction.height));
			await uploadMasterFile(informationExtraction.uuid)
			const masterFileUri = new URL(`https://hls-processed-files.s3.ap-south-1.amazonaws.com/${informationExtraction.uuid}/master.m3u8`);
			response.status(200).json({
				success: true,
				masterFileUri,
			})
		} catch (error) {
			console.error('Error in uploadFileMasterFileToS3:', error);
			response.status(500).json({
				error: 'An error occurred while uploading the master file',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		} finally {
			try {
				await fs.promises.rm(path.join(__dirname, "../temp"), { recursive: true });
			} catch (error) {
				console.error("Clean up could not be complete")
			}
		}

	}


}
