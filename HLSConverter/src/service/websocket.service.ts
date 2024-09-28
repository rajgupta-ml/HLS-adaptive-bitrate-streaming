import { randomUUID } from "crypto";
import WebSocket from "ws";

interface MessageData {
	uuid?: string;
	type?: string;
	client_uuid?: string;
	[key: string]: any; // Allow additional properties
}

export class ws {
	private ws: WebSocket | null = null;
	private readonly wsURI: string;
	private readonly uuid: string;
	private readonly client_uuid: string;

	constructor(uuid: string, wsURI: string = "ws://65.0.76.111") {
		this.uuid = uuid;
		this.wsURI = wsURI;
		this.client_uuid = randomUUID();
	}

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.ws = new WebSocket(this.wsURI);

			this.ws.on("open", () => {
				resolve();
			});

			this.ws.on("message", (data) => this.handleMessage(data));

			this.ws.on("error", (error) => {
				console.error("Connection Failed: ", error);
				reject(error);
			});

			this.ws.on("close", () => {
				this.close();
			});
		});
	}

	sendMessage(data: MessageData) {
		if (!this.ws) {
			console.error("WebSocket is not connected.");
			return;
		}
		data.uuid = this.uuid;
		data.type = "docker_server";
		data.client_uuid = this.client_uuid;
		this.ws.send(JSON.stringify(data));
	}

	private handleMessage(data: WebSocket.Data) {
		try {
			const parsedData = JSON.parse(data.toString());
			console.log("Received message:", parsedData);
			// Handle incoming messages here
		} catch (error) {
			console.error("Failed to parse incoming message:", error);
		}
	}


	close() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}
}
