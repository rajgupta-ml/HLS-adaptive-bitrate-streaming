import dotenv from "dotenv"
dotenv.config();
import { ReceiveMessageCommand, ReceiveMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";

const config = {
	region: process.env.SQS_REGION || "",
	credentials: {
		accessKeyId: process.env.SQS_ACCESS_KEY || "",
		secretAccessKey: process.env.SQS_ACCESS_SECRET || ""

	}

}



console.log(process.env.SQS_QUEUE_URL)
const client = new SQSClient(config);
const input: ReceiveMessageCommandInput = {
	QueueUrl: process.env.SQS_QUEUE_URL || "",
	MaxNumberOfMessages: 1,
	WaitTimeSeconds: 20,
};

const command = new ReceiveMessageCommand(input);
(async () => {
	while (true) {
		try {
			const { Messages } = await client.send(command);
			if (!Messages) {
				console.log("No message in the queue");
				continue;
			}
			console.log(JSON.parse(Messages[0].Body as string).s3);


		} catch (error) {
			console.error(error);
		}
	}
})()

