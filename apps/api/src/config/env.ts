import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"

type AppEnv = "development" | "qa" | "production"

function normalizeAppEnv(value?: string): AppEnv {
  if (value === "qa") return "qa"
  if (value === "production") return "production"
  return "development"
}

const APP_ENV = normalizeAppEnv(process.env.APP_ENV ?? process.env.NODE_ENV)

const workspaceRoot = process.cwd()
const envFiles = [
  path.join(workspaceRoot, `.env.${APP_ENV}`),
  path.join(workspaceRoot, ".env"),
]

for (const filePath of envFiles) {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false })
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value : fallback
}

function parseOrigins(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const frontendOrigins = parseOrigins(
  optional(
    "FRONTEND_URL",
    "http://localhost:3000,https://riselocal.in,https://qa.riselocal.in"
  )
)

export const env = {
  APP_ENV,
  NODE_ENV: optional("NODE_ENV", APP_ENV === "production" ? "production" : "development"),
  PORT: Number(optional("PORT", "4000")),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  FRONTEND_ORIGINS: frontendOrigins,
  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
}

export const isProd = env.APP_ENV === "production"
