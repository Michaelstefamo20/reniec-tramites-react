import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRoutes } from "./routes/authRoutes.js";
import { assistantController, assistantRateLimit } from "./controllers/assistantController.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { supportRoutes } from "./routes/supportRoutes.js";
import { noStore, parseCookies, requireDatabase } from "./middleware/request.js";

const app = express();
if (process.env.VERCEL) app.set("trust proxy", 1);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "12kb", type: "application/json" }));
app.use(parseCookies);
app.use("/api", noStore);
app.use("/api/health", healthRoutes);
app.post("/api/assistant", assistantRateLimit, assistantController);
app.use("/api/auth", requireDatabase(), authRoutes);
app.use("/api/support", requireDatabase(), supportRoutes);
app.use(express.static(path.join(root, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
app.use((error, _req, res, _next) => {
  console.error("Request failure", error.message);
  res.status(error.status || 500).json({ error: error.status ? error.message : "Error interno del servidor." });
});
export default app;
