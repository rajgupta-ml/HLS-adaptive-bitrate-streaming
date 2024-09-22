import express from "express"

export interface IAwsServiceController {

	uploadFileToS3(request: express.Request, response: express.Response, next: express.NextFunction): Promise<void>
}
