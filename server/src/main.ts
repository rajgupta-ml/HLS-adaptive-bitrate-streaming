import dotenv from "dotenv";
import http, { Server } from "http"
dotenv.config()

import express from "express";
import cors from "cors"
import v1Router from "./router/v1Router";
import { WebSocketManager } from "./manager/websocket.manager";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }))
app.use("/api/v1", v1Router);

app.get("/healthCheck", (request: express.Request, response: express.Response) => {
	response.status(200).json({ success: true })
})

const server: Server = http.createServer(app)
const PORT = process.env.PORT;
server.listen(PORT, () => {
	console.log(`the server is running on port : ${PORT}`)
	const ws = WebSocketManager.getInstance(server);
	ws.init();
})
