import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http"
interface IDocker {
	progress: Map<string, number>;
	noOfDockerInit: number;
	dockers_uuids: string[];
	totalProgress: number;
}

interface IMessage {
	type: 'client' | 'docker_server';
	uuid: string;
	client_uuid?: string;
	percentage?: number;
	status?: string;
}

export class WebSocketManager {
	private readonly wss: WebSocketServer;
	private static wsInstance: WebSocketManager;
	private clientSockets: Map<string, WebSocket>;
	private dockerSockets: Map<string, WebSocket>;
	private progressManager: Map<string, IDocker>;

	private constructor(app: Server) {
		this.wss = new WebSocketServer({ server: app });
		this.clientSockets = new Map<string, WebSocket>();
		this.dockerSockets = new Map<string, WebSocket>();
		this.progressManager = new Map<string, IDocker>();
	}

	public static getInstance(app: Server): WebSocketManager {
		if (!WebSocketManager.wsInstance) {
			WebSocketManager.wsInstance = new WebSocketManager(app);
		}
		return WebSocketManager.wsInstance;
	}

	public init(): void {
		this.wss.on("connection", (ws: WebSocket) => {
			console.log("New WebSocket connection established");

			ws.on("message", (data: Buffer) => {
				try {
					const message: IMessage = JSON.parse(data.toString());
					this.handleMessage(ws, message);
				} catch (error) {
					console.error("Error parsing message:", error);
				}
			});

			ws.on("close", () => {
				this.handleDisconnection(ws);
			});
		});

	}

	private handleMessage(ws: WebSocket, message: IMessage): void {
		switch (message.type) {
			case "client":
				this.handleClientMessage(ws, message);
				break;
			case "docker_server":
				this.handleDockerMessage(ws, message);
				break;
			default:
				console.warn("Unknown message type:", message.type);
		}
	}

	private handleClientMessage(ws: WebSocket, message: IMessage): void {
		this.clientSockets.set(message.uuid, ws);
		console.log(`Client connected: ${message.uuid}`);
	}

	private handleDockerMessage(ws: WebSocket, message: IMessage): void {
		if (message.client_uuid && !this.dockerSockets.has(message.client_uuid)) {
			this.dockerSockets.set(message.client_uuid, ws);
			console.log(`Docker container connected: ${message.uuid}`);
		}

		if (message.client_uuid && message.percentage) {
			this.updateProgress(message.client_uuid, message.uuid, message.percentage);
		}
	}


	private updateProgress(dockerUuid: string, clientUuid: string, percentage: number): void {
		let dockerInfo = this.progressManager.get(clientUuid);
		if (!dockerInfo) {
			dockerInfo = {
				progress: new Map<string, number>(),
				noOfDockerInit: 0,
				dockers_uuids: [],
				totalProgress: 0
			};
			this.progressManager.set(clientUuid, dockerInfo);
		}


		if (!dockerInfo.dockers_uuids.includes(dockerUuid)) {
			dockerInfo.dockers_uuids.push(dockerUuid);
			dockerInfo.noOfDockerInit++;
		}

		const oldProgress = dockerInfo.progress.get(dockerUuid) || 0;
		dockerInfo.progress.set(dockerUuid, percentage);
		dockerInfo.totalProgress += percentage - oldProgress;


		const averageProgress = Math.floor(dockerInfo.totalProgress / dockerInfo.noOfDockerInit);
		const allCompleted = dockerInfo.totalProgress === 100 * dockerInfo.noOfDockerInit;


		console.log(dockerInfo);

		const clientWs = this.clientSockets.get(clientUuid);
		if (clientWs) {
			console.log(clientWs);
			clientWs.send(JSON.stringify({
				type: allCompleted ? "completed" : "progress",
				progress: averageProgress
			}));
		}
	}

	private handleDisconnection(ws: WebSocket): void {
		for (const [uuid, socket] of this.clientSockets.entries()) {
			if (socket === ws) {
				this.clientSockets.delete(uuid);
				console.log(`Client disconnected: ${uuid}`);
				return;
			}
		}

		for (const [uuid, socket] of this.dockerSockets.entries()) {
			if (socket === ws) {
				this.dockerSockets.delete(uuid);
				console.log(`Docker container disconnected: ${uuid}`);
				return;
			}
		}
	}

	public getClientSocket(uuid: string): WebSocket | undefined {
		return this.clientSockets.get(uuid);
	}

	public getDockerSocket(uuid: string): WebSocket | undefined {
		return this.dockerSockets.get(uuid);
	}
}

