import crypto from 'node:crypto';

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
      throw new Error('Tenant name is required');
    }

    if (!slug || slug.trim().length === 0) {
      throw new Error('Tenant slug is required');
    }

    const normalizedDomain =
      typeof domain === 'string' && domain.trim().length > 0 ? domain.trim() : null;

    return new Tenant({
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      domain: normalizedDomain,
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

  update(name: string, slug: string, domain?: string | null) {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (!slug || slug.trim().length === 0) {
      throw new Error('Tenant slug is required');
    }

    const normalizedDomain =
      typeof domain === 'string' && domain.trim().length > 0 ? domain.trim() : null;

    this.props.name = name.trim();
    this.props.slug = slug.trim().toLowerCase();
    this.props.domain = normalizedDomain;
    this.props.updatedAt = new Date();
  }

  /* =========================================
     Getters
  ========================================= */

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  /* =========================================
     Serialization
  ========================================= */

  toJSON() {
    return { ...this.props };
  }
}
