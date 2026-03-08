import crypto from "node:crypto";

/* =========================================
   TYPES
========================================= */

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CONVERTED"
  | "CLOSED";

interface LeadProps {
  id: string;
  tenantId: string;

  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  location?: string | null;

  status: LeadStatus;

  createdAt: Date;
  updatedAt: Date;
}

interface CreateLeadProps {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  location?: string;
}

/* =========================================
   ENTITY
========================================= */

export class Lead {
  private readonly props: LeadProps;

  private constructor(props: LeadProps) {
    this.props = props;
  }

  /* =========================================
     FACTORY
  ========================================= */

  static create(props: CreateLeadProps): Lead {
    if (!props.tenantId) {
      throw new Error("tenantId is required");
    }

    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Lead name is required");
    }

    if (!props.phone || props.phone.trim().length === 0) {
      throw new Error("Phone is required");
    }

    const now = new Date();

    return new Lead({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      name: props.name.trim(),
      phone: props.phone.trim(),
      email: props.email ?? null,
      source: props.source ?? null,
      location: props.location ?? null,
      status: "NEW",
      createdAt: now,
      updatedAt: now,
    });
  }

  /* =========================================
     STATUS TRANSITION LOGIC
  ========================================= */

  updateStatus(newStatus: LeadStatus) {
    if (this.props.status === newStatus) {
      return;
    }

    const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
      NEW: ["CONTACTED", "CLOSED"],
      CONTACTED: ["QUALIFIED", "CLOSED"],
      QUALIFIED: ["CONVERTED", "CLOSED"],
      CONVERTED: [],
      CLOSED: [],
    };

    const isAllowed =
      allowedTransitions[this.props.status].includes(newStatus);

    if (!isAllowed) {
      throw new Error(
        `Invalid status transition from ${this.props.status} to ${newStatus}`
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /* =========================================
     REHYDRATE (FROM DB)
  ========================================= */

  static fromPersistence(props: LeadProps): Lead {
    return new Lead(props);
  }

  /* =========================================
     GETTERS
  ========================================= */

  get id() {
    return this.props.id;
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get status() {
    return this.props.status;
  }

  /* =========================================
     SERIALIZE
  ========================================= */

  toJSON(): LeadProps {
    return { ...this.props };
  }
}