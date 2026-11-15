import { Router } from "express";

export const healthRoutes = Router();
healthRoutes.get("/", (req, res) => {
  const { databaseReady, emailConfigured } = req.app.locals;
  res.status(databaseReady ? 200 : 503).json({
    api: "up",
    database: databaseReady ? "up" : "not-configured-or-unavailable",
    email: emailConfigured ? "configured" : "not-configured",
  });
});
