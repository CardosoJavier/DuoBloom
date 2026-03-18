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

export interface BloomData {
  partnerCode: string;
}

export type UnitSystem = "KG" | "LB";

export interface UserSettings {
  id: string;
  userId: string;
  privacyMode: boolean;
  preferredUnitSystem: UnitSystem;
  createdAt: string;
  updatedAt: string;
}
