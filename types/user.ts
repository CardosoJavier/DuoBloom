export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  pairCode?: string;
  publicKey?: string;
}

export interface BloomData {
  partnerCode: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  privacyMode: boolean;
  createdAt: string;
  updatedAt: string;
}
