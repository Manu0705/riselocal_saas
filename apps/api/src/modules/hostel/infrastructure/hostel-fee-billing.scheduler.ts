import { HostelPropertyPrismaRepository } from './hostel-property.prisma.repository';

const BILLING_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startHostelFeeBillingScheduler() {
  const repository = new HostelPropertyPrismaRepository();
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;

    try {
      const generatedCount = await repository.generateCurrentFeeInvoices();
      if (generatedCount > 0) {
        console.info(`[hostel-billing] Issued ${generatedCount} automatic fee invoice(s).`);
      }
    } catch (error) {
      console.error('[hostel-billing] Automatic invoice generation failed.', error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), BILLING_INTERVAL_MS);
  timer.unref();

  return () => clearInterval(timer);
}
