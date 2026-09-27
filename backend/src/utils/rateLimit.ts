import { redisConnection } from '../config/redis';
import { config } from '../config';

export const claimHourlyRateLimit = async (userId: string, customLimit?: number): Promise<{ allowed: boolean; nextAvailableTimestamp?: number }> => {
  // Use custom limit if provided and > 0, otherwise use global limit
  const limit = customLimit && customLimit > 0 
    ? Math.min(customLimit, config.maxEmailsPerHour) 
    : config.maxEmailsPerHour;

  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const key = `email-rate:${userId}:${hourWindow}`;

  // Atomic Lua script to check limit and only increment if under limit
  const luaScript = `
    local current = redis.call("GET", KEYS[1])
    if current and tonumber(current) >= tonumber(ARGV[1]) then
      return -1
    end
    local count = redis.call("INCR", KEYS[1])
    if tonumber(count) == 1 then
      redis.call("EXPIRE", KEYS[1], 3600)
    end
    return count
  `;

  const result = await redisConnection.eval(luaScript, 1, key, limit);

  if (result === -1) {
    // Limit reached. Calculate start of the NEXT hour.
    const nextHour = new Date(now);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1);
    nextHour.setUTCMinutes(0, 0, 0); // start of the next hour
    
    return {
      allowed: false,
      nextAvailableTimestamp: nextHour.getTime()
    };
  }

  return { allowed: true };
};
