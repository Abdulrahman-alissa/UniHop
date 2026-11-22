import { config } from "./config.js";
import { createApp } from "./app.js";
import { migrate, pool } from "./db/pool.js";
import { seed } from "./db/seed.js";

async function start() {
  await migrate(); // create tables on first run
  if (config.autoSeed) await seed(); // demo users/rides so a fresh deployment is not empty
  const server = createApp().listen(config.port, () => console.log(`UniHop API on :${config.port}  (docs: /api/docs)`));
  const stop = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

start().catch((err) => { console.error("Failed to start:", err); process.exit(1); });
