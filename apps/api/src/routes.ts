import { Router } from "express";
import tenantRoutes from "./modules/tenant/presentation/tenant.routes";
import leadRoutes from "./modules/lead/presentation/lead.routes";
import feedbackRoutes from "./modules/feedback/presentation/feedback.routes";
import { authMiddleware } from "./modules/auth/presentation/auth.middleware";
import authRoutes from "./modules/auth/presentation/auth.routes";
import { tenantContextMiddleware } from "./middleware/tenant-context.middleware";
import { tenantAccessMiddleware } from "./middleware/tenant-access.middleware";


const router = Router();

/* =========================================
   PUBLIC ROUTES
========================================= */

router.use("/auth", authRoutes);
router.use(tenantRoutes);

/* =========================================
   AUTH PROTECTED ROUTES
========================================= */

router.use(authMiddleware);
router.use(tenantContextMiddleware);
router.use(tenantAccessMiddleware);

/* =========================================
   MODULE ROUTES
========================================= */

router.use(leadRoutes);
router.use(feedbackRoutes);

export default router;