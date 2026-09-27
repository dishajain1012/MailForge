import { Router } from 'express';
import { 
  connectSlack, 
  slackCallback, 
  disconnectSlack, 
  getSlackStatus 
} from '../controllers/slack.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Callback does not have auth header, we use state param to identify user
router.get('/callback', slackCallback);

// Other routes require auth
router.use(requireAuth);

router.get('/connect', connectSlack);
router.post('/disconnect', disconnectSlack);
router.get('/status', getSlackStatus);

export default router;
