import jwt from "jsonwebtoken";

const accessTtl = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTtl = process.env.REFRESH_TOKEN_TTL || "7d";
const baseOptions = { issuer: "cultural-spa" };

function getAccessSecret() {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("JWT_ACCESS_SECRET is missing. Check server/.env and dotenv loading.");
  return s;
}

function getRefreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is missing. Check server/.env and dotenv loading.");
  return s;
}

export function signAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), { ...baseOptions, expiresIn: accessTtl });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, getRefreshSecret(), { ...baseOptions, expiresIn: refreshTtl });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret(), baseOptions);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret(), baseOptions);
}
