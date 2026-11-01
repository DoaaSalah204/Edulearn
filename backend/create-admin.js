const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const file = path.join(__dirname, "data", "db.json");
if (!fs.existsSync(file)) {
  console.log("Start server.js once first so the database file is created, then run this script again.");
  process.exit(1);
}
function createAdmin(name, email, password) {
  name = String(name || "").trim();
  email = String(email || "").trim().toLowerCase();
  password = String(password || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    console.log("Invalid details. Name must be 2+ chars, email valid, password 8+ chars.");
    process.exitCode = 1; return;
  }
  const db = JSON.parse(fs.readFileSync(file, "utf8"));
  if (db.users.some(u => u.email === email)) {
    console.log("That email already exists. Use a different email.");
    process.exitCode = 1; return;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  db.users.push({
    id: "admin_" + crypto.randomBytes(8).toString("hex"), name, email,
    role: "admin", status: "active", bio: "", avatar: "",
    createdAt: new Date().toISOString(), passwordSalt: salt, passwordHash
  });
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
  console.log(`Admin account created: ${email}`);
}

if (!process.stdin.isTTY) {
  const lines = fs.readFileSync(0, "utf8").split(/\r?\n/);
  createAdmin(lines[0], lines[1], lines[2]);
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(resolve => rl.question(q, resolve));
  (async () => {
    const name = await ask("Admin name: ");
    const email = await ask("Admin email: ");
    const password = await ask("Admin password (8+ characters): ");
    createAdmin(name, email, password);
    rl.close();
  })().catch(err => { console.error(err); rl.close(); process.exitCode = 1; });
}
