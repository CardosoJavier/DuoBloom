export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  pairCode?: string;
}

export interface SyncData {
  partnerCode: string;
}
