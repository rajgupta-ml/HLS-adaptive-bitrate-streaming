import express from "express";
import cors from "cors"
const app = express();
app.use(cors({
	origin: "*"
}))

app.post("/api/v1/uploadFileToS3", (request: express.Request, response: express.Response) => {
	console.log(request);
	response.status(200).json({ success: "ok" });
})

app.listen(8080, () => console.log("The server is running"))
