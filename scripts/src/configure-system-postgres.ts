import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const schemaPath = path.resolve(scriptDir, "../init-schema.sql");
const envEmbeddedPath = path.resolve(projectRoot, "config/env.embedded");
const envPath = path.resolve(projectRoot, ".env");
const backupsDir = path.resolve(projectRoot, "config/backups");

const host = process.env.PG_HOST ?? "127.0.0.1";
const port = process.env.PG_PORT ?? "5432";
const user = process.env.PG_USER ?? "postgres";
const password = process.env.PG_PASSWORD;
const database = process.env.PG_DATABASE ?? "arc_portal";

function buildConnectionString(dbName: string, pwd: string): string {
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(pwd);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}`;
}

function backupEnvFile() {
  if (!fs.existsSync(envPath)) {
    return null;
  }

  fs.mkdirSync(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\..+$/, "");
  const backupPath = path.join(backupsDir, `.env.backup-${stamp}`);
  fs.copyFileSync(envPath, backupPath);
  return backupPath;
}

function writeSystemEnv(appUrl: string) {
  const base = fs.readFileSync(envEmbeddedPath, "utf8");
  const lines = base
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("DATABASE_URL=") && !line.startsWith("EMBEDDED_PG_PORT="))
    .filter((line) => !line.startsWith("# Restore point"));

  const header = [
    "# System PostgreSQL (pgAdmin on port 5432)",
    "# Restore embedded mode with: pnpm env:restore-embedded",
    `DATABASE_URL=${appUrl}`,
    "DATABASE_MODE=system",
    "",
  ];

  fs.writeFileSync(envPath, [...header, ...lines].join("\n").trimEnd() + "\n", "utf8");
}

async function main() {
  if (!password) {
    console.error("PG_PASSWORD is required.");
    console.error("Run: pnpm env:setup-pgadmin");
    console.error("Or:  $env:PG_PASSWORD=\"your-postgres-password\"; pnpm db:configure-system");
    process.exit(1);
  }

  const adminUrl = buildConnectionString("postgres", password);
  const appUrl = buildConnectionString(database, password);

  console.log(`Testing connection to ${host}:${port} as user "${user}"...`);
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  console.log("Connected to PostgreSQL.");

  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (exists.rows.length === 0) {
    await admin.query(`CREATE DATABASE ${database}`);
    console.log(`Created database "${database}"`);
  } else {
    console.log(`Database "${database}" already exists`);
  }
  await admin.end();

  const app = new pg.Client({ connectionString: appUrl });
  await app.connect();
  const sql = fs.readFileSync(schemaPath, "utf8");
  await app.query(sql);
  await app.end();
  console.log("Schema applied.");

  const backupPath = backupEnvFile();
  if (backupPath) {
    console.log(`Previous .env backed up to: ${backupPath}`);
  }

  writeSystemEnv(appUrl);
  console.log("Updated .env for system PostgreSQL.");
  console.log("");
  console.log("pgAdmin connection (Role and Service fields: leave empty):");
  console.log(`  Host:     ${host}`);
  console.log(`  Port:     ${port}`);
  console.log(`  Database: ${database}`);
  console.log(`  Username: ${user}`);
  console.log(`  Password: (the password you just entered)`);
  console.log("");
  console.log("Restart the API server, then run: pnpm seed:all");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Setup failed:", message);
  if (message.includes("password authentication failed")) {
    console.error("");
    console.error("Your PostgreSQL password is not 'postgres'.");
    console.error("Use the password you chose when installing PostgreSQL.");
    console.error("Run: pnpm env:setup-pgadmin");
    console.error("");
    console.error("To keep using the embedded database instead: pnpm env:restore-embedded");
  }
  process.exit(1);
});
