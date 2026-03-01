import * as bip39 from "bip39";
import { Buffer } from "node:buffer";
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
    return bip39.generateMnemonic();
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
  sealPrivateKey(privateKey: string, mnemonic: string): SealedPrivateKey {
    if (!this.validateRecoveryCode(mnemonic)) {
      throw new Error("Invalid recovery mnemonic");
    }

    // 1. Generate random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    // 2. Derive 32-byte Master Key using PBKDF2
    const masterKey = crypto.pbkdf2Sync(
      mnemonic, // password
      salt, // salt
      100000, // iterations
      32, // keylen
      "sha256", // digest
    );

    // 3. Encrypt the Private Key using AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);

    // PEM private key might be a string, convert to buffer
    const pkBuffer = Buffer.from(privateKey, "utf8");
    const encryptedBuffer = Buffer.concat([
      cipher.update(pkBuffer),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedPrivateKey: encryptedBuffer.toString("base64"),
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  /**
   * Unseals a private key using the recovery code and vaulted metadata.
   */
  unsealPrivateKey(vault: SealedPrivateKey, mnemonic: string): string {
    if (!this.validateRecoveryCode(mnemonic)) {
      throw new Error("Invalid recovery mnemonic");
    }

    const salt = Buffer.from(vault.salt, "hex");
    const iv = Buffer.from(vault.iv, "hex");
    const authTag = Buffer.from(vault.authTag, "hex");
    const encryptedBuffer = Buffer.from(vault.encryptedPrivateKey, "base64");

    // 1. Re-derive the Master Key securely
    const masterKey = crypto.pbkdf2Sync(mnemonic, salt, 100000, 32, "sha256");

    // 2. Decrypt the Private Key
    const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
    decipher.setAuthTag(authTag as any); // Type override for arrayBuffer Buffer vs quick-crypto Buffer

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decryptedBuffer.toString("utf8");
  }
}

export const recoveryService = new RecoveryService();
