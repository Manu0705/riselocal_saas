declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      tenantSlug?: string;
      tenant?: {
        id: string;
        slug: string;
        name: string;
        domain?: string | null;
      };
      user?: {
        id: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

export {};