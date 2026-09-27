import { Router } from 'express';
import healthRoutes from './health.routes';
import emailRoutes from './email.routes';
import slackRoutes from './slack.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/slack', slackRoutes);

export default router;
