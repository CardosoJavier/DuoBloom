import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "node:buffer";
import crypto from "react-native-quick-crypto";

export interface EncryptionMetadata {
  iv: string;
  authTag: string;
  wrappedKeys: Record<string, string>; // userId -> encrypted AES key (base64)
}

export interface EncryptedPayload {
  encryptedData: string; // Base64 of the encrypted image
  metadata: EncryptionMetadata;
}

class EncryptionService {
  /**
   * Generates an RSA-2048 identity key pair.
   * Returns keys in PEM format.
   */
  async generateIdentityKeys(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            publicKey:
              (publicKey as any).export?.({ format: "pem", type: "spki" }) ||
              "",
            privateKey:
              (privateKey as any).export?.({ format: "pem", type: "pkcs8" }) ||
              "",
          });
        },
      );
    });
  }

  /**
   * Encrypts a file for a list of recipient public keys.
   */
  async encryptImage(
    fileUri: string,
    recipientMap: Record<string, string>, // userId -> publicKey (PEM)
  ): Promise<EncryptedPayload> {
    // 1. Generate AES-256-GCM symmetric key and 12-byte IV
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // 2. Read the file into a buffer
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileBuffer = Buffer.from(fileBase64, "base64");

    // 3. Encrypt the file content with AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    const encryptedBuffer = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // 4. Wrap the AES key for each recipient
    const wrappedKeys: Record<string, string> = {};
    for (const [userId, publicKey] of Object.entries(recipientMap)) {
      if (!publicKey) continue;

      const encryptedAesKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey,
      );
      wrappedKeys[userId] = encryptedAesKey.toString("base64");
    }

    return {
      encryptedData: encryptedBuffer.toString("base64"),
      metadata: {
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        wrappedKeys,
      },
    };
  }

  /**
   * Decrypts an encrypted image file payload.
   */
  async decryptImage(
    encryptedData: string,
    metadata: EncryptionMetadata,
    userId: string,
    privateKey: string,
  ): Promise<string> {
    // 1. Extract the user's wrapped AES key
    const wrappedKeyBase64 = metadata.wrappedKeys[userId];
    if (!wrappedKeyBase64) {
      throw new Error(`No wrapped key found for user ${userId}`);
    }

    const wrappedKeyBuffer = Buffer.from(wrappedKeyBase64, "base64");

    // 2. Unwrap the AES key using our RSA private key
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      wrappedKeyBuffer,
    );

    // 3. Decrypt the image data using AES-256-GCM
    const iv = Buffer.from(metadata.iv, "base64");
    const authTag = Buffer.from(metadata.authTag, "base64");
    const encryptedBuffer = Buffer.from(encryptedData, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(authTag as any); // Type override for setAuthTag Buffer vs Buffer<ArrayBuffer>

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    // 4. Write back to a temporary file
    const tempDir = `${FileSystem.cacheDirectory}decrypted_images/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

    const fileName = `dec_${Date.now()}.jpg`;
    const destUri = `${tempDir}${fileName}`;

    await FileSystem.writeAsStringAsync(
      destUri,
      decryptedBuffer.toString("base64"),
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    return destUri;
  }
}

export const encryptionService = new EncryptionService();
