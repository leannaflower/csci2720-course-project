import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../config/tokenService.js";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/users/refresh"
};

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role
});

const normalizeUsername = (value) => value.trim().toLowerCase();

// login controller
export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const username = normalizeUsername(parsed.data.username);
    const { password } = parsed.data;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return res
      .cookie("rtk", refreshToken, refreshCookieOptions)
      .json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
};

// register controller
export const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const username = normalizeUsername(parsed.data.username);
    const { password } = parsed.data;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash, role: "user" });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return res
      .status(201)
      .cookie("rtk", refreshToken, refreshCookieOptions)
      .json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ error: "Register failed" });
  }
};

export const logout = (_req, res) => {
  res.clearCookie("rtk", { path: "/api/users/refresh" }).status(204).send();
};

export const refresh = (req, res) => {
  const token = req.cookies?.rtk;
  if (!token) {
    return res.status(401).json({ error: "Missing refresh token" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload);
    return res.json({
      accessToken,
      user: {
        id: payload.sub,
        username: payload.username,
        role: payload.role
      }
    });
  } catch (error) {
    console.error("refresh error:", error);
    res.clearCookie("rtk", { path: "/api/users/refresh" });
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username role createdAt");
    return res.json(user);
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({ error: "Failed to load profile" });
  }
};

export const listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("username role createdAt");
    return res.json(users);
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ error: "Failed to load users" });
  }
};

export const createUser = async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const { password, role = "user" } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash, role });
    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.password) {
      updates.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const schema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { currentPassword, newPassword } = parsed.data;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Current password is incorrect" });

    const same = await bcrypt.compare(newPassword, user.passwordHash);
    if (same) return res.status(400).json({ error: "New password must be different from the current password" });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
};