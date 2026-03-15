/** Caller-provided input for a single progress photo upload session. */
export interface ProgressPhotoInput {
  frontUri: string; // local file URI
  sideUri: string;
  backUri: string;
  capturedDate: string; // ISO date 'YYYY-MM-DD'
  weightKg?: number;
  weightLb?: number;
  bodyFat?: number;
}

/** A progress_photos DB row as returned from the API. */
export interface ProgressPhoto {
  id: string;
  userId: string;
  frontPhotoUrl: string;
  sidePhotoUrl: string;
  backPhotoUrl: string;
  capturedDate: string;
  weightKg: number | null;
  weightLb: number | null;
  bodyFat: number | null;
  createdAt: string;
  updatedAt: string;
}
