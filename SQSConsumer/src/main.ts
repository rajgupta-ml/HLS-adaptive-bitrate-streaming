import dotenv from "dotenv"
import { SQSService } from "./services/Sqs.service";
dotenv.config();




async function init() {
	try {
		const service = new SQSService();
		await service.SQSConsumer()

	} catch (error) {
		console.log(error)

	}
}


init()
