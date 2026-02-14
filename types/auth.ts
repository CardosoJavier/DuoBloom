import { User } from "./user";

export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null;
}
