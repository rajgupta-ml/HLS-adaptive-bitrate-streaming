import { DeleteMessageCommand, DeleteMessageCommandInput, ReceiveMessageCommand, ReceiveMessageCommandInput, ReceiveMessageCommandOutput, SQSClient, SQSClientConfig, SQSServiceException } from "@aws-sdk/client-sqs";
import { getEncodingLadders } from "./getLadder.service";
import { ecsService } from "./Ecs.service";
import { RunTaskCommandOutput } from "@aws-sdk/client-ecs";


export class SQSService {

	private readonly config: SQSClientConfig
	private readonly input: ReceiveMessageCommandInput;
	private ecs: ecsService;
	private client?: SQSClient;
	constructor(ecs: ecsService) {
		const { REGION, ACCESS_KEY, ACCESS_SECRET, SQS_QUEUE_URL } = process.env;

		if (!REGION || !ACCESS_KEY || !ACCESS_SECRET || !SQS_QUEUE_URL) {
			throw new Error("Environment variables REGION, SQS_ACCESS_KEY, SQS_ACCESS_SECRET, and SQS_QUEUE_URL must be set.");
		}

		this.config = {
			region: REGION,
			credentials: {
				accessKeyId: ACCESS_KEY,
				secretAccessKey: ACCESS_SECRET
			}
		}

		this.input = {
			QueueUrl: SQS_QUEUE_URL,
			MaxNumberOfMessages: 1,
			WaitTimeSeconds: 20,
		}


		if (!this.config || !this.input) throw new Error("Enviorment variable should be set")

		this.ecs = ecs;
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
				const promise: Promise<RunTaskCommandOutput>[] = [];
				const { bucket, object } = JSON.parse(Messages[0].Body).Records[0].s3;
				const bucketName = bucket.name;
				const objectName = object.key;
				const resolution = (object.key).toString().split("_")[0];
				const [width, height] = resolution.split("x");
				const ladders = getEncodingLadders({ width, height })
				// Now Running the docker's parallel and deleting the event from sqs;
				const regex = /\d+x\d+_(.*?)\.mp4/; // Correct regex definition
				const match = objectName.match(regex);
				const folder = match ? match[1] : ''; // Ensure match is valid

				if (folder === "") throw new Error("Folder Cannot be empty");
				ladders.map((ladder) => {
					console.log(ladder);
					const [width, height] = ladder.resolution.split("x");
					promise.push(this.ecs.runTask(objectName, width, height, folder, bucketName));
				})

				await Promise.all(promise);
				await this.sqsDelete(Messages[0].ReceiptHandle, this.input.QueueUrl);
			} catch (error) {
				console.error(error);
			}

		}

	}


	private sqsDelete(ReceiptHandle?: string, QueueUrl?: string): Promise<void> {

		if (!ReceiptHandle || !QueueUrl) throw new Error("SQS Delete ERROR, ReceiptHandle and QueueUrl cannot be empty")
		console.log(QueueUrl);
		return new Promise(async (resolve, reject) => {
			const deleteCommand: DeleteMessageCommandInput = {
				QueueUrl,
				ReceiptHandle,
			}


			try {
				const command = new DeleteMessageCommand(deleteCommand);
				await this.client?.send(command);
				resolve()
			} catch (error) {
				console.log("error: ", error);
				reject(error);
			}



		})
	}



}
