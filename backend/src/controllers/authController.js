import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: "Login successfully",
      token,
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
