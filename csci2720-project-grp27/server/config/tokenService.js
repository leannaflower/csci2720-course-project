import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessTtl = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTtl = process.env.REFRESH_TOKEN_TTL || "7d";
const baseOptions = { issuer: "cultural-spa" };

export function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { ...baseOptions, expiresIn: accessTtl });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { ...baseOptions, expiresIn: refreshTtl });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret, baseOptions);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret, baseOptions);
}
