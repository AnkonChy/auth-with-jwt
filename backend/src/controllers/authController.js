import bcrypt from "bcrypt";
import Joi from "joi";
import User from "../models/User.js";

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const signup = async (req, res) => {
  // 1. Validate request body
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
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