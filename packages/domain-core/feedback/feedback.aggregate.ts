export type FeedbackStatus = "PENDING" | "APPROVED" | "REJECTED";

interface FeedbackProps {
  id: string;
  message: string;
  rating: number;
  createdBy: string;
  status: FeedbackStatus;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateFeedbackProps {
  message: string;
  rating: number;
  createdBy: string;
}

export class Feedback {
  private props: FeedbackProps;

  private constructor(props: FeedbackProps) {
    this.props = props;
  }

  /* ==============================
     FACTORY METHOD
  ============================== */

  static create(props: CreateFeedbackProps): Feedback {
    if (!props.message) {
      throw new Error("Feedback message is required");
    }

    if (props.rating < 1 || props.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const now = new Date();

    return new Feedback({
      id: crypto.randomUUID(),
      message: props.message,
      rating: props.rating,
      createdBy: props.createdBy,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
  }

  /* ==============================
     REHYDRATE FROM DATABASE
  ============================== */

  static fromPersistence(props: FeedbackProps): Feedback {
    return new Feedback(props);
  }

  /* ==============================
     BUSINESS METHODS
  ============================== */

  approve(approvedBy: string) {
    if (this.props.status === "APPROVED") {
      throw new Error("Feedback already approved");
    }

    this.props.status = "APPROVED";
    this.props.approvedBy = approvedBy;
    this.props.updatedAt = new Date();
  }

  reject() {
    this.props.status = "REJECTED";
    this.props.updatedAt = new Date();
  }

  /* ==============================
     GETTERS
  ============================== */

  get id() {
    return this.props.id;
  }

  get message() {
    return this.props.message;
  }

  get rating() {
    return this.props.rating;
  }

  get status() {
    return this.props.status;
  }

  /* ==============================
     SERIALIZE
  ============================== */

  toJSON() {
    return { ...this.props };
  }
}