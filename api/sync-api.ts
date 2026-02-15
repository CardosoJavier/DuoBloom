import { ApiResult } from "@/types/api";
import { ErrorCode } from "@/types/error";
import { Relationship, SyncRequest, SyncResult } from "@/types/sync";
import { supabase } from "@/util/supabase";

export const syncApi = {
  /**
   * Attempts to sync with a partner using their pair code.
   * Calls the `attempt_partner_sync` RPC function.
   */
  attemptPartnerSync: async (
    userId: string,
    partnerCode: string
  ): Promise<ApiResult<SyncResult>> => {
    try {
      const { data, error } = await supabase.rpc("attempt_partner_sync", {
        p_requester_id: userId,
        p_target_code: partnerCode,
      });

      if (error) {
        console.error("Sync Attempt Error:", error.message);
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            originalError: error,
          },
        };
      }

      // The RPC returns a JSON object, we cast it to SyncResult
      // But based on the SQL function, it returns jsonb which matches SyncResult structure
      const result = data as SyncResult;
      
      if (!result.success) {
         return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR, // Or a more specific code if we had one
            message: result.error || "Sync attempt failed",
          }
         }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during sync attempt",
          originalError: error,
        },
      };
    }
  },

  /**
   * Confirms the sync request.
   * Calls the `confirm_partner_sync` RPC function.
   */
  confirmPartnerSync: async (
    requestId: string,
    userId: string
  ): Promise<ApiResult<SyncResult>> => {
    try {
      const { data, error } = await supabase.rpc("confirm_partner_sync", {
        p_request_id: requestId,
        p_user_id: userId,
      });

      if (error) {
        console.error("Sync Confirm Error:", error.message);
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            originalError: error,
          },
        };
      }

      const result = data as SyncResult;

       if (!result.success) {
         return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: result.error || "Sync confirmation failed",
          }
         }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error during confirmation",
          originalError: error,
        },
      };
    }
  },

  /**
   * Gets the current active sync request for the user.
   * Useful for polling the status.
   */
  getActiveSyncRequest: async (
    userId: string
  ): Promise<ApiResult<SyncRequest | null>> => {
    try {
      const { data, error } = await supabase
        .from("partner_sync_requests")
        .select("*")
        .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Get Active Request Error:", error.message);
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            originalError: error,
          },
        };
      }

      return { success: true, data: data as SyncRequest | null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error fetching active request",
          originalError: error,
        },
      };
    }
  },

  /**
   * Checks if the user already has a relationship (synced partner).
   */
  getRelationship: async (
    userId: string
  ): Promise<ApiResult<Relationship | null>> => {
    try {
      const { data, error } = await supabase
        .from("relationships")
        .select("*")
        .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Get Relationship Error:", error.message);
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            originalError: error,
          },
        };
      }

      return { success: true, data: data as Relationship | null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || "Unexpected error fetching relationship",
          originalError: error,
        },
      };
    }
  },
};
