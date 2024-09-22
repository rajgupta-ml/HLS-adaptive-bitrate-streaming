import express from "express";
import { AwsServiceController } from "../controller/UploadFileToS3.controller";
import { upload } from "../config/multer.config";
const v1Router = express.Router()
const awsServiceController = new AwsServiceController(upload);
v1Router.post("/uploadFileToS3", awsServiceController.uploadFileToS3.bind(awsServiceController));


export default v1Router
