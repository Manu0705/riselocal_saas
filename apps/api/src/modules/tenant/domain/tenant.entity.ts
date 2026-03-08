export interface TenantProps {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  private constructor(private readonly props: TenantProps) {}

  /* =========================================
     Factory
  ========================================= */

  static create(name: string, slug: string, domain?: string) {
    if (!name || name.trim().length === 0) {
      throw new Error("Tenant name is required");
    }

    if (!slug || slug.trim().length === 0) {
      throw new Error("Tenant slug is required");
    }

    return new Tenant({
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      domain: domain ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: TenantProps) {
    return new Tenant(props);
  }

  /* =========================================
     Business Logic
  ========================================= */

  /* =========================================
     Serialization
  ========================================= */

  toJSON() {
    return { ...this.props };
  }
}