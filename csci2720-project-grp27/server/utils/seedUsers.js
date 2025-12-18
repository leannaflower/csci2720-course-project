import bcrypt from "bcrypt";
import User from "../models/User.js";

export async function seedUsersIfNeeded() {
  const adminExists = await User.exists({ role: "admin" });
  if (adminExists) {
    console.log("[seed] Admin exists. Skipping user seed.");
    return false;
  }

  console.log("[seed] No admin found. Seeding default users…");
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const userPasswordHash = await bcrypt.hash("user123", 12);

  await User.create([
    { username: "admin", passwordHash: adminPasswordHash, role: "admin" },
    { username: "user1", passwordHash: userPasswordHash, role: "user" },
  ]);

  console.log("[seed] Seeded users: admin/admin123, user1/user123");
  return true;
}