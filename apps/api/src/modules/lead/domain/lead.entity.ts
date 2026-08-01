import crypto from 'node:crypto';
import {
  type LeadStatus,
  LEAD_STATUS_TRANSITIONS,
  normalizeLeadStatus,
} from '@saas/domain-core/lead.contract';

export type { LeadStatus };

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
      throw new Error('tenantId is required');
    }

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Lead name is required');
    }

    if (!props.phone || props.phone.trim().length === 0) {
      throw new Error('Phone is required');
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
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    });
  }

  /* =========================================
     STATUS TRANSITION LOGIC
  ========================================= */

  updateStatus(newStatus: LeadStatus) {
    const next = normalizeLeadStatus(newStatus);
    if (this.props.status === next) {
      return;
    }

    const isAllowed = LEAD_STATUS_TRANSITIONS[this.props.status].includes(next);

    if (!isAllowed) {
      throw new Error(`Invalid status transition from ${this.props.status} to ${next}`);
    }

    this.props.status = next;
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
