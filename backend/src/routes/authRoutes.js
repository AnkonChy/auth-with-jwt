import { Router } from "express";
import { login, signup } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/signup",authLimiter, signup);

router.post("/login", login)

export default router;