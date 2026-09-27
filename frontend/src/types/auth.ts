export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  message?: string;
}
