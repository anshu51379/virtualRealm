import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../backend/", import.meta.url));
const file = fileURLToPath(new URL("../backend/.env", import.meta.url));
mkdirSync(directory, { recursive: true });
if (existsSync(file)) {
  console.log("backend/.env already exists; your settings were preserved.");
} else {
  writeFileSync(file, [
    "PORT=5000",
    "MONGO_URL=mongodb://127.0.0.1:27017/virtualrealm",
    `SECRET_KEY=${randomBytes(48).toString("hex")}`,
    "CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000",
    "AI_API_KEY=",
    "AI_MODEL=",
    "AI_BASE_URL=https://api.openai.com/v1",
    "",
  ].join("\n"), { mode: 0o600, flag: "wx" });
  console.log("Created backend/.env with a unique local authentication secret.");
}
console.log("Start MongoDB (docker compose up -d mongo), then run npm run dev.");
