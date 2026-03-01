import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import { encryptionService } from "../services/EncryptionService";
import { recoveryService } from "../services/RecoveryService";
import { supabase } from "../util/supabase"; // Assuming supabase instance is exported from util/supabase

const PRIVATE_KEY_ALIAS = "__user_private_key";

interface OnboardingResult {
  mnemonic: string;
}

export function useOnboarding() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Main onboarding sequence for E2EE setup
   */
  const setupEncryption =
    useCallback(async (): Promise<OnboardingResult | void> => {
      setIsProcessing(true);
      setError(null);

      try {
        // 1. Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("User not authenticated");
        }
        const userId = session.user.id;

        // 2. Check Secure Store availability
        const isAvailable = await SecureStore.isAvailableAsync();
        if (!isAvailable) {
          throw new Error(
            "Secure storage is unavailable. Please ensure your device has a passcode/biometric lock.",
          );
        }

        // 3. Generate RSA Keys (Identity) and Recovery Code
        const { publicKey, privateKey } =
          await encryptionService.generateIdentityKeys();
        const mnemonic = recoveryService.generateRecoveryCode();

        // 4. Test storing the hardware lock (Private Key)
        // Use WHEN_UNLOCKED_THIS_DEVICE_ONLY string to maximize platform isolation
        await SecureStore.setItemAsync(PRIVATE_KEY_ALIAS, privateKey, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });

        // 5. Build the Recovery Vault Payload (AES seal of the Private key)
        const vaultPayload = await recoveryService.sealPrivateKey(
          privateKey,
          mnemonic,
        );

        // 6. Update user's profile with Public Key via Supabase
        const { error: profileError } = await supabase
          .from("users")
          .update({ public_key: publicKey })
          .eq("id", userId);

        if (profileError) throw profileError;

        // 7. Store the Vault in user_recovery table
        const { error: vaultError } = await supabase
          .from("user_recovery")
          .insert({
            user_id: userId,
            encrypted_private_key: vaultPayload.encryptedPrivateKey,
            salt: vaultPayload.salt,
            iv: vaultPayload.iv,
            auth_tag: vaultPayload.authTag,
          });

        if (vaultError) throw vaultError;

        return { mnemonic };
      } catch (err: any) {
        console.error("[Onboarding] Encryption setup failed: ", err);
        setError(err.message || "An error occurred during secure setup.");
        throw err;
      } finally {
        setIsProcessing(false);
      }
    }, []);

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
    setupEncryption,
    verifyMnemonic,
    isProcessing,
    error,
  };
}
