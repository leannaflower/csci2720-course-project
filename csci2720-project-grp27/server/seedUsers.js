import dotenv from "dotenv";
import bcrypt from "bcrypt";

import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();
await connectDB();

async function seedUsers() {
  // Don’t create duplicates
  const adminExists = await User.exists({ role: "admin" });
  if (adminExists) {
    console.log("Admin already exists. Skipping user seed.");
    process.exit(0);
  }

  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const userPasswordHash = await bcrypt.hash("user123", 12);

  await User.create([
    { username: "admin", passwordHash: adminPasswordHash, role: "admin" },
    { username: "user1", passwordHash: userPasswordHash, role: "user" },
  ]);

  console.log("Seeded users: admin/admin123, user1/user123");
  process.exit(0);
}

seedUsers().catch((e) => {
  console.error("seedUsers failed:", e);
  process.exit(1);
});