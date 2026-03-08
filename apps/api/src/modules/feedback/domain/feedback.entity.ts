import crypto from "node:crypto";
import { AppError } from "../../../shared/errors/app-error";

/* =========================================
   TYPES
========================================= */

export type FeedbackType = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export type FeedbackStatus =
  | "PUBLISHED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

interface TenantFeedbackConfig {
  feedbackAllowsRating: boolean;
  feedbackRequiresApproval: boolean;
}

interface FeedbackProps {
  id: string;
  tenantId: string;
  leadId: string;

  comment: string;
  type: FeedbackType;

  rating?: number | null;
  status: FeedbackStatus;

  approvedBy?: string | null;
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

interface CreateFeedbackProps {
  tenantId: string;
  leadId: string;
  comment: string;
  type: FeedbackType;
  rating?: number;
  createdBy: string;
  tenantConfig: TenantFeedbackConfig;
}

/* =========================================
   ENTITY
========================================= */

export class Feedback {
  private readonly props: FeedbackProps;

  private constructor(props: FeedbackProps) {
    this.props = props;
  }

  /* =========================================
     FACTORY
  ========================================= */

  static create(props: CreateFeedbackProps): Feedback {
    if (!props.tenantId) {
      throw new AppError("tenantId is required", 400);
    }

    if (!props.leadId) {
      throw new AppError("leadId is required", 400);
    }

    if (!props.comment || props.comment.trim().length === 0) {
      throw new AppError("Comment is required", 400);
    }

    if (!props.createdBy) {
      throw new AppError("createdBy is required", 400);
    }

    let rating: number | null = null;

    if (props.tenantConfig.feedbackAllowsRating) {
      if (props.rating !== undefined) {
        if (props.rating < 1 || props.rating > 5) {
          throw new AppError("Rating must be between 1 and 5", 400);
        }
        rating = props.rating;
      }
    }

    const status: FeedbackStatus = props.tenantConfig.feedbackRequiresApproval
      ? "PENDING"
      : "PUBLISHED";

    const now = new Date();

    return new Feedback({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      leadId: props.leadId,
      comment: props.comment.trim(),
      type: props.type,
      rating,
      status,
      approvedBy: null,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  /* =========================================
     MODERATION
  ========================================= */

  approve(userId: string) {
    if (this.props.status !== "PENDING") {
      throw new AppError("Only pending feedback can be approved", 400);
    }

    this.props.status = "APPROVED";
    this.props.approvedBy = userId;
    this.props.updatedAt = new Date();
  }

  reject(userId: string) {
    if (this.props.status !== "PENDING") {
      throw new AppError("Only pending feedback can be rejected", 400);
    }

    this.props.status = "REJECTED";
    this.props.approvedBy = userId;
    this.props.updatedAt = new Date();
  }

  /* =========================================
     REHYDRATE
  ========================================= */

  static fromPersistence(props: FeedbackProps): Feedback {
    return new Feedback(props);
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

  get leadId() {
    return this.props.leadId;
  }

  get status() {
    return this.props.status;
  }

  /* =========================================
     SERIALIZE
  ========================================= */

  toJSON(): FeedbackProps {
    return { ...this.props };
  }
}