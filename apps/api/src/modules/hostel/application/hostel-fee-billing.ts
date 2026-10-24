export type HostelFeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'ONE_TIME';

export type FeeBillingPeriod = {
  start: Date;
  end: Date;
  dueDate: Date;
};

const MONTHS_PER_PERIOD: Partial<Record<HostelFeeFrequency, number>> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
};

export function getCurrentFeeBillingPeriod(
  frequency: HostelFeeFrequency,
  issuedAt: Date,
): FeeBillingPeriod | null {
  const periodMonths = MONTHS_PER_PERIOD[frequency];
  if (!periodMonths) return null;

  const year = issuedAt.getUTCFullYear();
  const month = issuedAt.getUTCMonth();
  const firstMonth = Math.floor(month / periodMonths) * periodMonths;
  const start = new Date(Date.UTC(year, firstMonth, 1));
  const nextStart = new Date(Date.UTC(year, firstMonth + periodMonths, 1));
  const end = new Date(nextStart.getTime() - 1);
  const scheduledDueDate = new Date(Date.UTC(year, firstMonth, 5));

  return {
    start,
    end,
    dueDate: scheduledDueDate < issuedAt ? issuedAt : scheduledDueDate,
  };
}

export function getOneTimeFeePeriod(feeCreatedAt: Date, issuedAt = feeCreatedAt): FeeBillingPeriod {
  const start = new Date(
    Date.UTC(feeCreatedAt.getUTCFullYear(), feeCreatedAt.getUTCMonth(), feeCreatedAt.getUTCDate()),
  );
  return {
    start,
    end: start,
    dueDate: feeCreatedAt > issuedAt ? feeCreatedAt : issuedAt,
  };
}
