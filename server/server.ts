import "dotenv/config";
import express from "express";
import cors from "cors";
import { taskRouter } from "routes/tasks.js";
import { analyzeRouter } from "./routes/analyze.js";

const app = express();
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "*").split(",") }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/task", taskRouter);
app.use("/api/analyze", analyzeRouter);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`ConfigGuardian backend running at http://localhost:${port}`);
});
