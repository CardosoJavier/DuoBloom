/**
 * HealthSyncService
 *
 * Platform-aware wrapper around Apple HealthKit (iOS) and Android Health Connect.
 * Only handles Weight and Body Fat data for the current user.
 *
 * Privacy rules enforced here:
 * - Never read or write partner data.
 * - Partner stats are always sourced from Supabase only.
 */

import { ProgressStat } from "@/types/progress";
import { Platform } from "react-native";

// ── iOS ───────────────────────────────────────────────────────────────────────

let AppleHealthKit: any = null;
let HKPermissions: any = null;

if (Platform.OS === "ios") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("react-native-health");
  AppleHealthKit = mod.default;
  HKPermissions = mod.HealthKitPermissions;
}

// ── Android ───────────────────────────────────────────────────────────────────

let HealthConnect: any = null;

if (Platform.OS === "android") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  HealthConnect = require("react-native-health-connect");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HealthWeightEntry {
  weightKg: number;
  date: string; // 'YYYY-MM-DD'
}

export interface HealthBodyFatEntry {
  percentage: number;
  date: string; // 'YYYY-MM-DD'
}

// ── Service ───────────────────────────────────────────────────────────────────

export const HealthSyncService = {
  /**
   * Requests read/write permissions for Weight and Body Fat on both platforms.
   * Safe to call on every tab focus — re-prompts only if not yet determined.
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return false;
      return new Promise((resolve) => {
        const permissions = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.Weight,
              AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            ],
            write: [
              AppleHealthKit.Constants.Permissions.Weight,
              AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            ],
          },
        };
        AppleHealthKit.initHealthKit(permissions, (err: any) => {
          resolve(!err);
        });
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return false;
      try {
        await HealthConnect.initialize();
        const result = await HealthConnect.requestPermission([
          { accessType: "read", recordType: "Weight" },
          { accessType: "write", recordType: "Weight" },
          { accessType: "read", recordType: "BodyFat" },
          { accessType: "write", recordType: "BodyFat" },
        ]);
        return result.length > 0;
      } catch {
        return false;
      }
    }

    return false;
  },

  /** Returns the single most-recent Weight entry from the native SDK. */
  getLatestWeightEntry: async (): Promise<HealthWeightEntry | null> => {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return null;
      return new Promise((resolve) => {
        const opts = { unit: "gram" };
        AppleHealthKit.getLatestWeight(opts, (err: any, result: any) => {
          if (err || !result) return resolve(null);
          // HealthKit returns grams; convert to kg
          const kg = (result.value ?? 0) / 1000;
          resolve({ weightKg: kg, date: result.endDate?.slice(0, 10) ?? "" });
        });
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return null;
      try {
        const result = await HealthConnect.readRecords("Weight", {
          timeRangeFilter: {
            operator: "between",
            startTime: new Date(
              Date.now() - 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            endTime: new Date().toISOString(),
          },
        });
        const records: any[] = result.records ?? [];
        if (records.length === 0) return null;
        const latest = records.at(-1);
        return {
          weightKg: latest.weight?.inKilograms ?? 0,
          date: latest.time?.slice(0, 10) ?? "",
        };
      } catch {
        return null;
      }
    }

    return null;
  },

  /** Returns the single most-recent Body Fat entry from the native SDK. */
  getLatestBodyFatEntry: async (): Promise<HealthBodyFatEntry | null> => {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return null;
      return new Promise((resolve) => {
        AppleHealthKit.getLatestBodyFatPercentage(
          {},
          (err: any, result: any) => {
            if (err || !result) return resolve(null);
            resolve({
              percentage: result.value ?? 0,
              date: result.endDate?.slice(0, 10) ?? "",
            });
          },
        );
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return null;
      try {
        const result = await HealthConnect.readRecords("BodyFat", {
          timeRangeFilter: {
            operator: "between",
            startTime: new Date(
              Date.now() - 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            endTime: new Date().toISOString(),
          },
        });
        const records: any[] = result.records ?? [];
        if (records.length === 0) return null;
        const latest = records.at(-1);
        return {
          percentage: (latest.percentage ?? 0) * 100,
          date: latest.time?.slice(0, 10) ?? "",
        };
      } catch {
        return null;
      }
    }

    return null;
  },

  /** Writes a weight measurement to the native Health SDK. */
  writeWeightEntry: async (weightKg: number, date: string): Promise<void> => {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return;
      await new Promise<void>((resolve) => {
        const sample = {
          value: weightKg * 1000, // HealthKit expects grams
          unit: "gram",
          startDate: new Date(date).toISOString(),
          endDate: new Date(date).toISOString(),
        };
        AppleHealthKit.saveWeight(sample, () => resolve());
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return;
      try {
        await HealthConnect.insertRecords([
          {
            recordType: "Weight",
            weight: { inKilograms: weightKg },
            time: new Date(date).toISOString(),
          },
        ]);
      } catch {
        // Non-fatal: cloud save already succeeded
      }
    }
  },

  /** Writes a body fat percentage measurement to the native Health SDK. */
  writeBodyFatEntry: async (
    percentage: number,
    date: string,
  ): Promise<void> => {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return;
      await new Promise<void>((resolve) => {
        const sample = {
          value: percentage,
          startDate: new Date(date).toISOString(),
          endDate: new Date(date).toISOString(),
        };
        AppleHealthKit.saveBodyFatPercentage(sample, () => resolve());
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return;
      try {
        await HealthConnect.insertRecords([
          {
            recordType: "BodyFat",
            percentage: percentage / 100, // Health Connect expects 0–1
            time: new Date(date).toISOString(),
          },
        ]);
      } catch {
        // Non-fatal
      }
    }
  },

  /**
   * Returns true if the native SDK has a record newer than the most-recent
   * Supabase entry — meaning there is unsynchronised data to offer the user.
   */
  checkNeedsSync: (
    latestSdkDate: string | null,
    latestSupabaseStat: ProgressStat | null,
  ): boolean => {
    if (!latestSdkDate) return false;
    if (!latestSupabaseStat) return true;
    return latestSdkDate > latestSupabaseStat.recordedDate;
  },
};
