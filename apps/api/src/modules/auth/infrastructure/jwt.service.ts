import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn = "1h";

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    this.secret = process.env.JWT_SECRET;
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}