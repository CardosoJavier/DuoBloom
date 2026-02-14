import { User } from "./user";

export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null;
  error?: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

export interface LoginData {
  email: string;
  password?: string;
}
