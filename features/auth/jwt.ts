import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export interface JwtPayload {
  sub: string;
  role: string;
}

export function signToken(payload: JwtPayload, expiresInSecs?: number): string {
  const maxAge: number = expiresInSecs ?? 604800;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: maxAge });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
