import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signup = async (req, res) => {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    const errors = {};

    result.error.issues.forEach((err) => {
      console.log(err);
      const field = err.path[0];
      errors[field] = err.message;
    });
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors });
  }

  const { name, email, password } = req.body;

  try {
    // 2. Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // 3. Hash the password (10 = salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user into DB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Return success (never return password)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    console.log(req.body);

    if (!result.success) {
      const errors = {};

      result.error.issues.forEach((err) => {
        console.log(err);
        const field = err.path[0];
        errors[field] = err.message;
      });
      return res.status(400).json({ message: "Login failed", errors: errors });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    console.log(user.toJSON());

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Hash the refresh token before saving to DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refresh_token = hashedRefreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "Login successfully",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getProfile = (req, res) => {
  res.status(200).json({
    message: "Profile data fetched successfully",
    user: req.user,
  });
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.refresh_token) {
      return res.status(401).json({ message: "User not found or token revoked" });
    }

    // Compare the token from cookie with the hashed token in DB
    const isMatch = await bcrypt.compare(token, user.refresh_token);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateToken({ id: user.id, email: user.email });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      if (decoded) {
        const user = await User.findByPk(decoded.id);
        if (user) {
          user.refresh_token = null;
          await user.save();
        }
      }
    } catch (error) {
      // If token is invalid or expired, just proceed to clear cookie
      console.log("Logout token verification failed:", error.message);
    }
  }

  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
};
