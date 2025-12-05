const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessTtl = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTtl = process.env.REFRESH_TOKEN_TTL || "7d";
const baseOptions = { issuer: "cultural-spa" };

function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { ...baseOptions, expiresIn: accessTtl });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { ...baseOptions, expiresIn: refreshTtl });
}

function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret, baseOptions);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret, baseOptions);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
