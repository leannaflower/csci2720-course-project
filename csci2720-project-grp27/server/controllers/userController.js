const bcrypt = require("bcrypt");
const { z } = require("zod");
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../config/tokenService");

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/users/refresh",
};

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
});

const normalizeUsername = (value) => value.trim().toLowerCase();

exports.login = async (req, res) => {
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

exports.logout = (_req, res) => {
  res.clearCookie("rtk", { path: "/api/users/refresh" }).status(204).send();
};

exports.refresh = (req, res) => {
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
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("refresh error:", error);
    res.clearCookie("rtk", { path: "/api/users/refresh" });
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username role createdAt");
    return res.json(user);
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({ error: "Failed to load profile" });
  }
};

/** ------- admin-only helpers ------- */

exports.listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("username role createdAt");
    return res.json(users);
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ error: "Failed to load users" });
  }
};

exports.createUser = async (req, res) => {
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

exports.updateUser = async (req, res) => {
  try {
    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.password) {
      updates.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true,
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

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    return res.status(204).send();
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};
