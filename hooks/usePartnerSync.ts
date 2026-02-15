import { syncApi } from "@/api/sync-api";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { SyncStep } from "@/types/sync";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const usePartnerSync = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useAppToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<SyncStep>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [partnerName, setPartnerName] = useState<string>("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Poll interval ref
  const pollInterval = useRef<NodeJS.Timeout | number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!user?.id) return;

    // 1. Check if already synced (Relationship exists)
    const relRes = await syncApi.getRelationship(user.id);
    if (relRes.success && relRes.data) {
      stopPolling();
      router.replace("/(tabs)");
      return;
    }

    // 2. Check active request
    const reqRes = await syncApi.getActiveSyncRequest(user.id);
    if (reqRes.success && reqRes.data) {
      const req = reqRes.data;
      setRequestId(req.id);

      if (req.status === "MATCHED") {
        setStep("found");
        // Determine if I have already confirmed
        const myConfirmation =
          req.requester_id === user.id
            ? req.requester_confirmed
            : req.target_confirmed;
        setIsConfirmed(myConfirmation);
      } else if (req.requester_id === user.id) {
        // Only show waiting if I initiated the request
        setStep("waiting");
      } else {
        // I am target, but status is PENDING. Wait for me to enter code.
        setStep("input");
      }
    } else {
      // No active request found.
      // If we were in 'waiting' or 'found', it might have been cancelled or completed.
      // Since we already checked getRelationship, if we are here, it means no relationship exists.
      // So we should be in input state.
      // FIX: Ensure we only reset to input if we are not loading to prevent flickering
      if (step !== "input" && !isLoading) {
        setStep("input");
        setRequestId(null);
      }
    }
  }, [user?.id, router, step, isLoading, stopPolling]);

  // Initial check and polling
  useEffect(() => {
    // Start polling immediately
    checkStatus();
    pollInterval.current = setInterval(checkStatus, 3000);

    return () => stopPolling();
  }, [checkStatus, stopPolling]);

  const connect = async (partnerCode: string) => {
    if (!user?.id) return;
    setIsLoading(true);

    const res = await syncApi.attemptPartnerSync(user.id, partnerCode);
    setIsLoading(false);

    if (res.success && res.data) {
      // Immediate state update, polling will confirm/refresh
      if (res.data.status === "MATCHED") {
        setStep("found");
      } else if (res.data.status === "PENDING") {
        setStep("waiting");
      }

      if (res.data.request_id) {
        setRequestId(res.data.request_id);
      }
    } else {
      toast.error(t("common.error"), res.error?.message || "Failed to connect");
    }
  };

  const confirm = async () => {
    if (!user?.id || !requestId) return;
    setIsLoading(true);

    const res = await syncApi.confirmPartnerSync(requestId, user.id);
    setIsLoading(false);

    if (res.success && res.data) {
      if (res.data.status === "SYNC_COMPLETED") {
        toast.success(t("common.success"), "Sync completed!");
        stopPolling();
        router.replace("/(tabs)");
      } else {
        setIsConfirmed(true);
        toast.info(t("common.info"), "Waiting for partner to confirm...");
      }
    } else {
      toast.error(t("common.error"), res.error?.message || "Failed to confirm");
    }
  };

  return {
    step,
    isLoading,
    isConfirmed,
    partnerName,
    myCode: user?.pairCode,
    connect,
    confirm,
    checkStatus,
  };
};
