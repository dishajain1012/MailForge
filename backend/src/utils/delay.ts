import { redisConnection } from '../config/redis';
import { config } from '../config';

const LOCK_KEY = 'global_email_send_lock';

/**
 * Enforces a global minimum delay between email sends across all workers.
 * It uses Redis SET NX PX to atomically acquire a lock that automatically expires
 * after the configured delay.
 * 
 * If another worker holds the lock, this function will sleep and poll until
 * the lock is available.
 */
export const enforceGlobalMinimumDelay = async (): Promise<void> => {
  const delayMs = config.minEmailDelayMs;
  
  if (delayMs <= 0) return;

  while (true) {
    // Attempt to set the key. 
    // NX = Only set if it doesn't exist
    // PX = Expiration time in milliseconds
    const acquired = await redisConnection.set(LOCK_KEY, 'locked', 'PX', delayMs, 'NX');
    
    if (acquired === 'OK') {
      // Successfully acquired the lock. No other worker can acquire it for `delayMs`.
      return;
    }

    // Wait 100ms before trying again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
