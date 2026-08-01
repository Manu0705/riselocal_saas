// packages/domain-core/lead/lead.aggregate.ts
// Legacy aggregate kept for domain modeling. Canonical statuses live in lead.contract.ts.

import {
  type LeadStatus,
  canTransitionLeadStatus,
  normalizeLeadStatus,
} from '../lead.contract';

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  LINKEDIN = 'LINKEDIN',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER',
  ORGANIC = 'ORGANIC',
}

export type CreateLeadProps = {
  name: string;
  email?: string;
  phone: string;
  source?: LeadSource;
};

export class Lead {
  private _id?: string;
  private _name: string;
  private _email?: string;
  private _phone: string;
  private _status: LeadStatus;
  private _source: LeadSource;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id?: string;
    name: string;
    email?: string;
    phone: string;
    status: LeadStatus;
    source: LeadSource;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._name = props.name;
    this._email = props.email;
    this._phone = props.phone;
    this._status = props.status;
    this._source = props.source;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: CreateLeadProps): Lead {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Lead name must be at least 2 characters');
    }

    if (!props.phone || props.phone.trim().length < 8) {
      throw new Error('Lead phone is required');
    }

    if (props.email && !props.email.includes('@')) {
      throw new Error('Invalid email address');
    }

    return new Lead({
      name: props.name.trim(),
      email: props.email?.trim().toLowerCase(),
      phone: props.phone.trim(),
      status: normalizeLeadStatus('NEW'),
      source: props.source ?? LeadSource.ORGANIC,
    });
  }

  updateContactInfo(name: string, email: string | undefined, phone: string) {
    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (email && !email.includes('@')) {
      throw new Error('Invalid email');
    }

    if (!phone || phone.trim().length < 8) {
      throw new Error('Phone is required');
    }

    this._name = name;
    this._email = email;
    this._phone = phone;
    this.touch();
  }

  changeStatus(status: LeadStatus) {
    const next = normalizeLeadStatus(status);
    if (!canTransitionLeadStatus(this._status, next)) {
      throw new Error(`Invalid lead status transition: ${this._status} -> ${next}`);
    }

    this._status = next;
    this.touch();
  }

  private touch() {
    this._updatedAt = new Date();
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get email() {
    return this._email;
  }

  get phone() {
    return this._phone;
  }

  get status() {
    return this._status;
  }

  get source() {
    return this._source;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      status: this._status,
      source: this._source,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
