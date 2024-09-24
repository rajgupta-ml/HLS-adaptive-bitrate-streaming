import { IMetaData } from "./IMetaData.interface";

export interface CustomFile extends Express.Multer.File {
	s3?: any;
	metadata?: IMetaData;
	filename: string;
}