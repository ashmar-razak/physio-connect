import { execSync } from "child_process";

// Runs once before the whole test suite. DATABASE_URL is set by the "test"
// npm script (via cross-env) to an isolated SQLite file — never the dev db.
export default function globalSetup() {
  if (!process.env.DATABASE_URL?.includes("test.db")) {
    throw new Error(
      `Refusing to run tests against DATABASE_URL="${process.env.DATABASE_URL}" — expected the isolated test.db. Run tests via "npm test".`
    );
  }

  execSync("npx prisma migrate deploy", {
    cwd: __dirname + "/../..",
    env: process.env,
    stdio: "inherit",
  });
}
