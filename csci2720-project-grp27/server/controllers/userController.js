import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/tokenService.js";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth/refresh",
};

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { username, password } = parsed.data;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const payload = { sub: user.id, username: user.username, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return res
    .cookie("rtk", refreshToken, cookieOptions)
    .json({ accessToken, user: { id: user.id, username: user.username, role: user.role } });
}

export function logout(_req, res) {
  res.clearCookie("rtk", { path: "/api/auth/refresh" }).status(204).send();
}

export function refresh(req, res) {
  const token = req.cookies?.rtk;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload);
    return res.json({
      accessToken,
      user: { id: payload.sub, username: payload.username, role: payload.role },
    });
  } catch {
    res.clearCookie("rtk", { path: "/api/auth/refresh" });
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).select("username role createdAt");
  return res.json(user);
}
