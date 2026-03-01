import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import { encryptionService } from "../services/EncryptionService";
import { recoveryService } from "../services/RecoveryService";
import { supabase } from "../util/supabase"; // Assuming supabase instance is exported from util/supabase

const PRIVATE_KEY_ALIAS = "__user_private_key";

interface OnboardingResult {
  mnemonic: string;
  publicKey: string;
}

export function useOnboarding() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Main onboarding sequence part 1: Generate keys locally
   */
  const generateKeysLocally = useCallback(async (): Promise<
    any | undefined
  > => {
    setIsProcessing(true);
    setError(null);

    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) {
        throw new Error(
          "Secure storage is unavailable. Please ensure your device has a passcode/biometric lock.",
        );
      }

      const { publicKey, privateKey } =
        await encryptionService.generateIdentityKeys();
      const mnemonic = recoveryService.generateRecoveryCode();

      const vaultPayload = await recoveryService.sealPrivateKey(
        privateKey,
        mnemonic,
      );

      return {
        mnemonic,
        publicKey,
        privateKey,
        vaultPayload,
      };
    } catch (err: any) {
      console.error("[Onboarding] Key Generation failed: ", err);
      setError(err.message || "An error occurred generating keys.");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Main onboarding sequence part 2: Save metadata to DB
   */
  const finalizeEncryption = useCallback(
    async (securityData: any): Promise<void> => {
      setIsProcessing(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("User not authenticated");
        }
        const userId = session.user.id;

        // Save hardware lock
        await SecureStore.setItemAsync(
          PRIVATE_KEY_ALIAS,
          securityData.privateKey,
          {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          },
        );

        // Update public key
        const { error: profileError } = await supabase
          .from("users")
          .update({ public_key: securityData.publicKey })
          .eq("id", userId);

        if (profileError) throw profileError;

        // Upsert vault
        const { error: vaultError } = await supabase
          .from("user_recovery")
          .upsert(
            {
              user_id: userId,
              encrypted_private_key:
                securityData.vaultPayload.encryptedPrivateKey,
              salt: securityData.vaultPayload.salt,
              iv: securityData.vaultPayload.iv,
              auth_tag: securityData.vaultPayload.authTag,
            },
            { onConflict: "user_id" },
          );

        if (vaultError) throw vaultError;
      } catch (err: any) {
        console.error("[Onboarding] Encryption save failed: ", err);
        setError(err.message || "An error occurred during secure setup.");
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  /**
   * Helper to re-verify mnemonic manually if needed before continuing
   */
  const verifyMnemonic = useCallback(
    (originalCode: string, userAttempt: string): boolean => {
      // Basic structural check and simple exact match for array sets
      const cleanOriginal = originalCode
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .join(" ");
      const cleanAttempt = userAttempt
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .join(" ");
      return cleanOriginal === cleanAttempt;
    },
    [],
  );

  return {
    generateKeysLocally,
    finalizeEncryption,
    verifyMnemonic,
    isProcessing,
    error,
  };
}
