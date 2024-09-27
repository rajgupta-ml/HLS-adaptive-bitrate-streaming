import { ReceiveMessageCommand, ReceiveMessageCommandInput, ReceiveMessageCommandOutput, SQSClient, SQSClientConfig, SQSServiceException } from "@aws-sdk/client-sqs";
import { getEncodingLadders } from "./getLadder.service";

//TODO: Spin-up multiple ECS containers and this conntainers would connect to the main-server using websocket so that logs could be streamed back to the client 
//TODO: The SQSConsumer would generate the folder and upload a master file onto the folder. This folder will be used to upload all the m3u8 and .ts files.
//TODO: The server would return the link for the master file.
//TODO: Create the UI for the logs to be watched

export class SQSService {

	private readonly config: SQSClientConfig
	private readonly input: ReceiveMessageCommandInput;
	private client?: SQSClient;
	constructor() {
		const { SQS_REGION, SQS_ACCESS_KEY, SQS_ACCESS_SECRET, SQS_QUEUE_URL } = process.env;

		if (!SQS_REGION || !SQS_ACCESS_KEY || !SQS_ACCESS_SECRET || !SQS_QUEUE_URL) {
			throw new Error("Environment variables REGION, SQS_ACCESS_KEY, SQS_ACCESS_SECRET, and SQS_QUEUE_URL must be set.");
		}

		this.config = {
			region: SQS_REGION,
			credentials: {
				accessKeyId: SQS_ACCESS_KEY,
				secretAccessKey: SQS_ACCESS_SECRET
			}
		}

		this.input = {
			QueueUrl: SQS_QUEUE_URL,
			MaxNumberOfMessages: 1,
			WaitTimeSeconds: 20,
		}


		if (!this.config || !this.input) throw new Error("Enviorment variable should be set")
	}



	private async initialize() {
		if (!this.client) {
			try {
				this.client = new SQSClient(this.config);
				console.log("SQS Client initialized successfully.");
			} catch (error) {
				if (error instanceof SQSServiceException) {
					throw new Error(`SQS Service error: ${error.message}`);
				}
				throw new Error(`Unknown Error: ${error}`);
			}
		} else {
			console.log("The client is already initialized");
		}
	}


	async SQSConsumer() {
		const command = new ReceiveMessageCommand(this.input);
		while (true) {
			try {
				await this.initialize()
				const { Messages }: ReceiveMessageCommandOutput = await this.client!.send(command);
				if (!Messages || Messages.length === 0 || !Messages[0].Body) {
					console.log("No message in the queue");
					continue;
				}
				const { bucket, object } = JSON.parse(Messages[0].Body).Records[0].s3;
				const bucketName = bucket.name;
				const objectName = object.key;
				const resolution = (object.key).toString().split("_")[0];
				const [width, height] = resolution.split("x");
				const ladders = getEncodingLadders({ width, height })
				const obj = { bucketName, objectName, resolution, ladders };
				// Now Running the docker's parallel and deleting the event from sqs;


			} catch (error) {
				console.error(error);
			}

		}



	}



}
