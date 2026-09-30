import "dotenv/config";
import express from "express";
import jobsRouter from "./routes/jobs.js";
import dlqRouter from "./routes/dlq.js";
import agentRouter from "./routes/agent.js";

const app = express();

app.use(express.json());

// Mount routers
app.use("/jobs", jobsRouter);
app.use("/dead-jobs", dlqRouter);
app.use("/agent", agentRouter);

// Root health & meta
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "beastMQ", timestamp: new Date() });
});

export { app };
export default app;
