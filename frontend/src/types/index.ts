export interface ServiceStatus {
  server: 'UP' | 'DOWN';
  database: string;
  redis: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: ServiceStatus;
  environment: string;
}

export interface Job {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}
