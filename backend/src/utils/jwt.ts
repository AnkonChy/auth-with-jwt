import jwt, { JwtPayload } from "jsonwebtoken";

interface UserPayload {
  id: number;
  email: string;
}

export const generateToken = (user: UserPayload) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user: UserPayload) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token: string): JwtPayload | string | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | string | null => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
  } catch (error) {
    return null;
  }
};