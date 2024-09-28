import dotenv from "dotenv"
import { SQSService } from "./services/Sqs.service";
import { ecsService } from "./services/Ecs.service";
dotenv.config();




async function init() {
	try {
		const ecs = new ecsService();
		const service = new SQSService(ecs);
		await service.SQSConsumer()

	} catch (error) {
		console.log(error)

	}
}


init()
