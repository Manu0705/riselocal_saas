import { Router } from 'express';
import { FeedbackController } from './feedback.controller';

const router = Router();
const controller = new FeedbackController();

// Public feedback form (can create lead via name+phone when leadId is not provided).
router.post('/public/tenant/:tenantSlug/feedback', controller.publicCreate.bind(controller));

// Public review form (requires leadId + rating/comment and is intended for converted leads).
router.post('/public/tenant/:tenantSlug/review', controller.publicCreateReview.bind(controller));

export default router;