import { Router } from 'express';
import { 
  scheduleEmails, 
  getScheduledEmails, 
  getSentEmails, 
  getEmailJob 
} from '../controllers/email.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all email routes
router.use(requireAuth);

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/:id', getEmailJob);

export default router;
