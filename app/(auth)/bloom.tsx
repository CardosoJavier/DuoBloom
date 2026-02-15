import React from "react";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { VStack } from "@/components/ui/vstack";
import { usePartnerSync } from "@/hooks/usePartnerSync";
import { SyncInput } from "@/components/auth/sync/SyncInput";
import { SyncWaiting } from "@/components/auth/sync/SyncWaiting";
import { SyncFound } from "@/components/auth/sync/SyncFound";

export default function BloomScreen() {
  const {
    step,
    isLoading,
    isConfirmed,
    partnerName,
    myCode,
    connect,
    confirm,
  } = usePartnerSync();

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center w-full">
        {step === "input" && (
          <SyncInput
            myCode={myCode}
            onConnect={connect}
            isLoading={isLoading}
          />
        )}

        {step === "waiting" && <SyncWaiting myCode={myCode} />}

        {step === "found" && (
          <SyncFound
            onConfirm={confirm}
            isLoading={isLoading}
            isConfirmed={isConfirmed}
            partnerName={partnerName}
          />
        )}
      </VStack>
    </AuthContainer>
  );
}
