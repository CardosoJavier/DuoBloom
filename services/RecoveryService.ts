import { Buffer } from "@craftzdog/react-native-buffer";
import * as bip39 from "bip39";
import crypto from "react-native-quick-crypto";

export interface SealedPrivateKey {
  encryptedPrivateKey: string; // Base64
  salt: string; // Hex
  iv: string; // Hex
  authTag: string; // Hex
}

class RecoveryService {
  /**
   * Generates a 12-word BIP39 recovery mnemonic.
   */
  generateRecoveryCode(): string {
    // Inject custom RNG using react-native-quick-crypto
    // to bypass React Native's missing global.crypto.getRandomValues
    return bip39.generateMnemonic(
      128,
      (size) => Buffer.from(crypto.randomBytes(size)) as any,
    );
  }

  /**
   * Validates a mnemonic recovery code.
   */
  validateRecoveryCode(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * Seals a private key using a derived master key from the mnemonic.
   */
  async sealPrivateKey(
    privateKey: string,
    mnemonic: string,
  ): Promise<SealedPrivateKey> {
    if (!this.validateRecoveryCode(mnemonic)) {
      throw new Error("Invalid recovery mnemonic");
    }

    // 1. Generate random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    // 2. Derive 32-byte Master Key using PBKDF2
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        mnemonic, // password
        salt, // salt
        100000, // iterations
        32, // keylen
        "sha256", // digest
        (err, masterKey) => {
          if (err) {
            reject(err);
            return;
          }
          if (!masterKey) {
            reject(new Error("Failed to derive master key"));
            return;
          }

          try {
            // 3. Encrypt the Private Key using AES-256-GCM
            const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);

            // React Native Quick Crypto allows passing encoding to output strings directly
            let encryptedBase64 = cipher.update(
              privateKey,
              "utf8",
              "base64",
            ) as unknown as string;
            encryptedBase64 += cipher.final("base64") as unknown as string;
            const authTag = cipher.getAuthTag();

            resolve({
              encryptedPrivateKey: encryptedBase64,
              salt: salt.toString("hex"),
              iv: iv.toString("hex"),
              authTag: authTag.toString("hex"),
            });
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  }

  /**
   * Unseals a private key using the recovery code and vaulted metadata.
   */
  async unsealPrivateKey(
    vault: SealedPrivateKey,
    mnemonic: string,
  ): Promise<string> {
    if (!this.validateRecoveryCode(mnemonic)) {
      throw new Error("Invalid recovery mnemonic");
    }

    const salt = Buffer.from(vault.salt, "hex");
    const iv = Buffer.from(vault.iv, "hex");
    const authTag = Buffer.from(vault.authTag, "hex");
    const encryptedBuffer = Buffer.from(vault.encryptedPrivateKey, "base64");

    // 1. Re-derive the Master Key securely
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(mnemonic, salt, 100000, 32, "sha256", (err, masterKey) => {
        if (err) {
          reject(err);
          return;
        }
        if (!masterKey) {
          reject(new Error("Failed to derive master key"));
          return;
        }

        try {
          // 2. Decrypt the Private Key
          const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            masterKey,
            iv,
          );
          decipher.setAuthTag(authTag as any); // Type override for arrayBuffer Buffer vs quick-crypto Buffer

          let decryptedUtf8 = decipher.update(
            vault.encryptedPrivateKey,
            "base64",
            "utf8",
          ) as unknown as string;
          decryptedUtf8 += decipher.final("utf8") as unknown as string;

          resolve(decryptedUtf8);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

export const recoveryService = new RecoveryService();
