import { ECSClient, ECSClientConfig, RunTaskCommand, RunTaskCommandInput, RunTaskCommandOutput } from "@aws-sdk/client-ecs";

export class ecsService {
	private readonly config: ECSClientConfig;


	constructor() {
		const { REGION, ACCESS_KEY, ACCESS_SECRET } = process.env;
		if (!REGION || !ACCESS_KEY || !ACCESS_SECRET) {
			throw new Error("Environment variables REGION, SQS_ACCESS_KEY, SQS_ACCESS_SECRET, and SQS_QUEUE_URL must be set.");
		}

		this.config = {
			region: REGION,
			credentials: {
				accessKeyId: ACCESS_KEY,
				secretAccessKey: ACCESS_SECRET
			}
		}

	}



	async runTask(KEY: string, WIDTH: string, HEIGHT: string, FOLDER: string, BUCKET_NAME: string): Promise<RunTaskCommandOutput> {
		if (!KEY || !WIDTH || !HEIGHT || !FOLDER || !BUCKET_NAME) throw new Error("RunTaskError : Env cannot be empty");
		return new Promise(async (resolve, reject) => {
			const command: RunTaskCommandInput = {
				taskDefinition: "arn:aws:ecs:ap-south-1:061039808029:task-definition/hls-task",
				cluster: "arn:aws:ecs:ap-south-1:061039808029:cluster/hls_cluster",
				launchType: "FARGATE",
				networkConfiguration: {
					awsvpcConfiguration: {
						assignPublicIp: "ENABLED",
						securityGroups: ["sg-07d1f3bd1ef5651d6"],
						subnets: ["subnet-005f86724b1603d99", "subnet-001c1cf63e575b4dc", "subnet-0c3e866cc7f90be2a"]
					},
				},

				overrides: {
					containerOverrides: [{
						name: "hls",
						environment: [
							{ "name": "DOWNLOAD_BUCKET_NAME", "value": `${BUCKET_NAME}` },
							{ "name": "KEY", "value": `${KEY}` },
							{ "name": "UPLOAD_BUCKET_NAME", "value": "hls-processed-files" },
							{ "name": "WIDTH", "value": `${WIDTH}` },
							{ "name": "HEIGHT", "value": `${HEIGHT}` },
							{ "name": "FOLDER", "value": `${FOLDER}` }
						]
					}]
				}
			}

			try {
				const client = new ECSClient(this.config);
				const runCommnad = new RunTaskCommand(command);
				const response: RunTaskCommandOutput = await client.send(runCommnad);
				resolve(response);
			} catch (error) {
				reject(error)
				console.log("this is the error : ", error)

			}

		})

	}

}
