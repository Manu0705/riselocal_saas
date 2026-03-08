export type UserRole = "ADMIN" | "USER"

export interface AuthUser {
  id: string
  role: UserRole
}