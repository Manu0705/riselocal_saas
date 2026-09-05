import { Router } from 'express';
import { roleGuard } from '../../../middleware/role-guard.middleware';
import { HostelController } from './hostel.controller';

const router = Router();
const controller = new HostelController();

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

router.get('/hostel/rooms', controller.listRooms.bind(controller));
router.post(
  '/hostel/rooms',
  roleGuard('owner', 'manager', 'staff'),
  controller.createRoom.bind(controller),
);
router.get('/hostel/rooms/vacancies', controller.listVacancies.bind(controller));
router.get('/hostel/rooms/vacancy-summary', controller.vacancySummary.bind(controller));
router.get('/hostel/rooms/:id', controller.getRoom.bind(controller));
router.patch(
  '/hostel/rooms/:id',
  roleGuard('owner', 'manager', 'staff'),
  controller.updateRoom.bind(controller),
);
router.delete(
  '/hostel/rooms/:id',
  roleGuard('owner', 'manager'),
  controller.deleteRoom.bind(controller),
);
router.get('/hostel/rooms/:id/history', controller.allocationHistory.bind(controller));
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
router.get('/hostel/staff', controller.listStaff.bind(controller));
router.post(
  '/hostel/staff',
  roleGuard('owner', 'manager'),
  controller.createStaff.bind(controller),
);
router.post(
  '/payments/initiate',
  roleGuard('owner', 'manager', 'staff', 'student', 'admin', 'super_admin'),
  controller.initiatePayment.bind(controller),
);
router.get('/payments', controller.listPayments.bind(controller));
router.get('/payments/:id', controller.getPayment.bind(controller));
router.post('/payments/:id/submit', controller.submitPayment.bind(controller));
router.post(
  '/payments/:id/verify',
  roleGuard('owner', 'manager', 'staff'),
  controller.verifyPayment.bind(controller),
);
router.post(
  '/payments/:id/reject',
  roleGuard('owner', 'manager', 'staff'),
  controller.rejectPayment.bind(controller),
);

export default router;
