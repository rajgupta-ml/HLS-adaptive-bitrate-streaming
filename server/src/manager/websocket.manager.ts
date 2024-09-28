import WebSocket, { WebSocketServer } from "ws";

interface IDocker {
	progress: number;
	noOfDockerInit: number;
	dockers_uuids: string[];
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
	private readonly wsPORT: number;
	private static wsInstance: WebSocketManager;
	private clientSockets: Map<string, WebSocket>;
	private dockerSockets: Map<string, WebSocket>;
	private progressManager: Map<string, IDocker>;

	private constructor() {
		this.wsPORT = Number(process.env.WS_PORT) || 8001;
		this.wss = new WebSocketServer({ port: this.wsPORT });
		this.clientSockets = new Map<string, WebSocket>();
		this.dockerSockets = new Map<string, WebSocket>();
		this.progressManager = new Map<string, IDocker>();
	}

	public static getInstance(): WebSocketManager {
		if (!WebSocketManager.wsInstance) {
			WebSocketManager.wsInstance = new WebSocketManager();
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

		console.log(`WebSocket server is running on port ${this.wsPORT}`);
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
				progress: 0,
				noOfDockerInit: 0,
				dockers_uuids: []
			};
			this.progressManager.set(clientUuid, dockerInfo);
		}


		if (!dockerInfo.dockers_uuids.includes(dockerUuid)) {
			dockerInfo.dockers_uuids.push(dockerUuid);
			dockerInfo.noOfDockerInit = dockerInfo.dockers_uuids.length;
		}

		dockerInfo.progress = Math.max(dockerInfo.progress, percentage);

		const overallProgress = Math.floor(dockerInfo.progress / dockerInfo.noOfDockerInit);

		console.log(dockerInfo);

		const clientWs = this.clientSockets.get(clientUuid);
		if (clientWs) {
			console.log(clientWs);
			clientWs.send(JSON.stringify({
				type: overallProgress === 100 ? "completed" : "progress",
				progress: overallProgress
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

// Usage:
// const wsManager = WebSocketManager.getInstance();
// wsManager.init();
