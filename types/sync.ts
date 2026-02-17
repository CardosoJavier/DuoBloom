export type SyncRequestStatus = "PENDING" | "MATCHED";

export interface SyncRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: SyncRequestStatus;
  requester_confirmed: boolean;
  target_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  status?: SyncRequestStatus | "SYNC_COMPLETED" | "WAITING_FOR_PARTNER";
  request_id?: string;
  error?: string;
}

export interface Relationship {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string;
}

export type SyncStep = "input" | "waiting" | "found";
