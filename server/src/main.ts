import dotenv from "dotenv";
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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
	const ws = WebSocketManager.getInstance();
	ws.init();
})
