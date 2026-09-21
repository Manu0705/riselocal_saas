import { Router } from 'express';

import { HostelController } from './hostel.controller';

import { authMiddleware } from '../../auth/presentation/auth.middleware';

import { roleGuard } from '../../../middleware/role-guard.middleware';

const router = Router();

const controller = new HostelController();

// Public student login
// router.post(
//   '/hostel/student/login',
//   hostelController.studentLogin.bind(hostelController),
// );

/*
 * Everything below requires authentication
 */

router.use('/hostel', authMiddleware);

// Hostels / Properties

router.get('/hostel/hostels', controller.listHostels.bind(controller));

router.get('/hostel/properties', controller.listHostels.bind(controller));

router.post(
  '/hostel/hostels',
  roleGuard('owner', 'manager'),
  controller.createHostel.bind(controller),
);

router.post(
  '/hostel/properties',
  roleGuard('owner', 'manager'),
  controller.createHostel.bind(controller),
);

// Fees

router.get('/hostel/fees', controller.listFees.bind(controller));

router.post(
  '/hostel/fees',
  roleGuard('owner', 'manager'),
  controller.createFee.bind(controller),
);

router.get('/hostel/fees/:id', controller.getFee.bind(controller));

router.patch(
  '/hostel/fees/:id',
  roleGuard('owner', 'manager'),
  controller.updateFee.bind(controller),
);

router.post(
  '/hostel/fees/:id/deactivate',
  roleGuard('owner', 'manager'),
  controller.deactivateFee.bind(controller),
);

// Fee Assignments

router.get(
  '/hostel/fee-assignments',
  controller.listFeeAssignments.bind(controller),
);

router.post(
  '/hostel/fee-assignments',
  roleGuard('owner', 'manager', 'staff'),
  controller.createFeeAssignment.bind(controller),
);

router.get(
  '/hostel/fee-assignments/:id',
  controller.getFeeAssignment.bind(controller),
);

router.patch(
  '/hostel/fee-assignments/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateFeeAssignment.bind(controller),
);

router.post(
  '/hostel/fee-assignments/:id/cancel',
  roleGuard('owner', 'manager'),
  controller.cancelFeeAssignment.bind(controller),
);

// Rooms

router.get('/hostel/rooms', controller.listRooms.bind(controller));

router.post(
  '/hostel/rooms',
  roleGuard('owner', 'manager', 'staff'),
  controller.createRoom.bind(controller),
);

router.get(
  '/hostel/rooms/vacancies',
  controller.listVacancies.bind(controller),
);

router.get(
  '/hostel/rooms/vacancy-summary',
  controller.vacancySummary.bind(controller),
);

router.get(
  '/hostel/rooms/recent-activity',
  controller.recentAllocationActivity.bind(controller),
);

router.get(
  '/hostel/rooms/:id/history',
  controller.allocationHistory.bind(controller),
);

router.post(
  '/hostel/rooms/allocate',
  roleGuard('owner', 'manager', 'staff'),
  controller.allocateStudent.bind(controller),
);

router.post(
  '/hostel/rooms/deallocate',
  roleGuard('owner', 'manager', 'staff'),
  controller.deallocateStudent.bind(controller),
);

router.post(
  '/hostel/rooms/auto-assign',
  roleGuard('owner', 'manager', 'staff'),
  controller.autoAllocateStudent.bind(controller),
);

router.get('/hostel/rooms/:id', controller.getRoom.bind(controller));

router.patch(
  '/hostel/rooms/:id',
  roleGuard('owner', 'manager'),
  controller.updateRoom.bind(controller),
);

router.delete(
  '/hostel/rooms/:id',
  roleGuard('owner', 'manager'),
  controller.deleteRoom.bind(controller),
);

// Students

router.get('/hostel/students', controller.listStudents.bind(controller));

router.post(
  '/hostel/students',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.createStudent.bind(controller),
);

router.get('/hostel/students/:id', controller.getStudent.bind(controller));

router.patch(
  '/hostel/students/:id',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.updateStudent.bind(controller),
);

// Staff

router.get('/hostel/staff', controller.listStaff.bind(controller));

router.get(
  '/hostel/staff/available-users',
  roleGuard('owner', 'manager'),
  controller.listAvailableStaffUsers.bind(controller),
);

router.post(
  '/hostel/staff',
  roleGuard('owner', 'manager'),
  controller.createStaff.bind(controller),
);

router.patch(
  '/hostel/staff/:id',
  roleGuard('owner', 'manager'),
  controller.updateStaffAssignment.bind(controller),
);

router.delete(
  '/hostel/staff/:id',
  roleGuard('owner', 'manager'),
  controller.deleteStaffAssignment.bind(controller),
);

// Hostel dashboard

router.get(
  '/hostel/dashboard-summary',
  controller.hostelDashboardSummary.bind(controller),
);

// Payments

router.post(
  '/hostel/payments',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin', 'student'),
  controller.initiatePayment.bind(controller),
);

router.get('/hostel/payments', controller.listPayments.bind(controller));

router.get('/hostel/payments/:id', controller.getPayment.bind(controller));

router.post(
  '/hostel/payments/:id/submit',
  controller.submitPayment.bind(controller),
);

router.post(
  '/hostel/payments/:id/verify',
  roleGuard('owner', 'manager', 'admin', 'super_admin'),
  controller.verifyPayment.bind(controller),
);

router.post(
  '/hostel/payments/:id/reject',
  roleGuard('owner', 'manager', 'admin', 'super_admin'),
  controller.rejectPayment.bind(controller),
);

// ============================================================
// INVOICES
// ============================================================

router.get(
  '/hostel/invoices',
  controller.listInvoices.bind(controller),
);

router.get(
  '/hostel/invoices/:id',
  controller.getInvoice.bind(controller),
);

router.post(
  '/hostel/invoices',
  roleGuard('owner', 'manager', 'staff'),
  controller.createInvoice.bind(controller),
);

router.patch(
  '/hostel/invoices/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateInvoice.bind(controller),
);

router.post(
  '/hostel/invoices/:id/issue',
  roleGuard('owner', 'manager', 'staff'),
  controller.issueInvoice.bind(controller),
);

router.post(
  '/hostel/invoices/:id/cancel',
  roleGuard('owner', 'manager'),
  controller.cancelInvoice.bind(controller),
);

// ============================================================
// RECEIPTS
// ============================================================

router.get(
  '/hostel/receipts',
  controller.listReceipts.bind(controller),
);

router.get(
  '/hostel/receipts/:id',
  controller.getReceipt.bind(controller),
);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

router.get(
  '/hostel/reports/fee-collection-summary',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.getFeeCollectionSummary.bind(controller),
);

router.get(
  '/hostel/reports/student-outstanding',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listStudentOutstandingReport.bind(controller),
);

router.get(
  '/hostel/reports/invoices',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listInvoiceReport.bind(controller),
);

router.get(
  '/hostel/reports/payments',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listPaymentReport.bind(controller),
);

router.get(
  '/hostel/reports/receipts',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listReceiptReport.bind(controller),
);

router.get(
  '/hostel/reconciliation/payments',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listPaymentReconciliation.bind(controller),
);

// ============================================================
// DEPOSITS
// ============================================================

router.get(
  '/hostel/deposits',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listDeposits.bind(controller),
);

router.get(
  '/hostel/deposits/:id',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.getDeposit.bind(controller),
);

router.post(
  '/hostel/deposits',
  roleGuard('owner', 'manager', 'staff'),
  controller.createDeposit.bind(controller),
);

router.patch(
  '/hostel/deposits/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateDeposit.bind(controller),
);

router.post(
  '/hostel/deposits/:id/reconcile',
  roleGuard('owner', 'manager'),
  controller.reconcileDeposit.bind(controller),
);

router.post(
  '/hostel/deposits/:id/cancel',
  roleGuard('owner', 'manager'),
  controller.cancelDeposit.bind(controller),
);

// ============================================================
// LEDGER
// ============================================================

router.get(
  '/hostel/ledger',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.listLedgerEntries.bind(controller),
);

router.get(
  '/hostel/ledger/:id',
  roleGuard('owner', 'manager', 'staff', 'admin', 'super_admin'),
  controller.getLedgerEntry.bind(controller),
);

router.post(
  '/hostel/ledger',
  roleGuard('owner', 'manager', 'staff'),
  controller.createLedgerEntry.bind(controller),
);

// ============================================================
// COMPLAINTS
// ============================================================

router.get(
  '/hostel/complaints',
  controller.listComplaints.bind(controller),
);

router.get(
  '/hostel/complaints/:id',
  controller.getComplaint.bind(controller),
);

router.post(
  '/hostel/complaints',
  roleGuard('owner', 'manager', 'staff', 'student'),
  controller.createComplaint.bind(controller),
);

router.patch(
  '/hostel/complaints/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateComplaint.bind(controller),
);

// ============================================================
// ANNOUNCEMENTS
// ============================================================

router.get(
  '/hostel/announcements',
  controller.listAnnouncements.bind(controller),
);

router.get(
  '/hostel/announcements/:id',
  controller.getAnnouncement.bind(controller),
);

router.post(
  '/hostel/announcements',
  roleGuard('owner', 'manager', 'staff'),
  controller.createAnnouncement.bind(controller),
);

router.patch(
  '/hostel/announcements/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateAnnouncement.bind(controller),
);

router.post(
  '/hostel/announcements/:id/publish',
  roleGuard('owner', 'manager'),
  controller.publishAnnouncement.bind(controller),
);

router.post(
  '/hostel/announcements/:id/archive',
  roleGuard('owner', 'manager'),
  controller.archiveAnnouncement.bind(controller),
);

export default router;
