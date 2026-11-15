import { Router } from "express";
import rateLimit from "express-rate-limit";
import { forgotPasswordController, loginController, logoutController, meController, registerController, resetPasswordController, setupPasswordController, verifyEmailController } from "../controllers/authController.js";
import { requireSession } from "../middleware/auth.js";

export const authRoutes = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Demasiados intentos. Espera unos minutos y vuelve a probar." } });
authRoutes.use(limiter);
authRoutes.post("/register", registerController);
authRoutes.post("/setup-password", setupPasswordController);
authRoutes.post("/verify-email", verifyEmailController);
authRoutes.post("/login", loginController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.get("/me", requireSession, meController);
authRoutes.post("/logout", logoutController);
