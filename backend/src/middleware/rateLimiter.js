import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 3,
  message: "Too many requests, wait 1 min"
});