import { Router } from "express";
import { login, signup, getProfile, refreshToken, logout } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup",authLimiter, signup);

router.post("/login", login)

router.get("/profile", authenticate, getProfile);

router.get("/refresh", refreshToken);

router.post("/logout", logout);

export default router;