// Central place for every environment variable the API reads.
import "dotenv/config";

const env = process.env;
const isProd = env.NODE_ENV === "production";
const isTest = env.NODE_ENV === "test";

// A weak/default secret is only tolerated outside production.
if (isProd && !env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production.");
}

export const config = {
  isProd,
  isTest,
  port: Number(env.PORT) || 4000,
  databaseUrl: env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/unihop",
  // Hosted Postgres (Render, Neon, Supabase) needs TLS.
  databaseSsl: env.DATABASE_SSL === "true" || /sslmode=require/.test(env.DATABASE_URL || ""),
  jwtSecret: env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(env.BCRYPT_ROUNDS) || (isTest ? 4 : 10),
  // Comma separated list of allowed frontend origins. "*" = any (dev only).
  corsOrigins: (env.CORS_ORIGIN || "*").split(",").map((s) => s.trim()).filter(Boolean),
  // Registration is limited to this e-mail domain, matching the Phase 1 form. Set to "" to allow any.
  emailDomain: env.ALLOWED_EMAIL_DOMAIN === undefined ? "lau.edu" : env.ALLOWED_EMAIL_DOMAIN,
  autoSeed: env.AUTO_SEED !== "false" && !isTest,
};
