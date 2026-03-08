import { NextFunction, Request, Response } from "express"

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "").trim()
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item))
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = sanitize(entry)
    }
    return output
  }

  return value
}

export function inputSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body)
  }

  next()
}
