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
import { Linking, Platform } from "react-native";

// ── iOS ───────────────────────────────────────────────────────────────────────

let _appleHealthKit: any = undefined;

function getAppleHealthKit(): any {
  if (_appleHealthKit !== undefined) return _appleHealthKit;
  if (Platform.OS !== "ios") {
    _appleHealthKit = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require("react-native");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const libMod = require("react-native-health");

    // react-native-health uses Object.assign({}, NativeModules.AppleHealthKit, { Constants })
    // but with New Architecture (JSI), native module methods are non-enumerable prototype
    // properties that Object.assign silently skips. Access the native module directly and
    // attach the JS-side Constants that the library provides correctly.
    const nativeKit = NativeModules?.AppleHealthKit;
    const constants = libMod.Constants;
    if (nativeKit && constants) {
      nativeKit.Constants = constants;
      _appleHealthKit = nativeKit;
    } else {
      _appleHealthKit = null;
    }
  } catch {
    _appleHealthKit = null;
  }
  return _appleHealthKit;
}
// ── Android ───────────────────────────────────────────────────────────────────

let HealthConnect: any = null;

if (Platform.OS === "android") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    HealthConnect = require("react-native-health-connect");
  } catch {
    // Module failed to link — treat Health Connect as unavailable.
  }
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

export interface HealthStepsEntry {
  steps: number;
  date: string; // 'YYYY-MM-DD'
}

/** Reason why health permission was not granted. */
export type HealthConnectionError = "SDK_UNAVAILABLE" | "PERMISSION_DENIED";

export interface HealthPermissionResult {
  granted: boolean;
  error?: HealthConnectionError;
}

// ── Service ───────────────────────────────────────────────────────────────────

function requestIosPermissions(): Promise<HealthPermissionResult> {
  const kit = getAppleHealthKit();
  if (!kit)
    return Promise.resolve({ granted: false, error: "SDK_UNAVAILABLE" });
  return new Promise((resolve) => {
    kit.isAvailable((_availErr: any, available: boolean) => {
      if (!available) {
        resolve({ granted: false, error: "SDK_UNAVAILABLE" });
        return;
      }
      const permissions = {
        permissions: {
          read: [
            kit.Constants.Permissions.Weight,
            kit.Constants.Permissions.BodyFatPercentage,
            kit.Constants.Permissions.Steps,
          ],
          write: [
            kit.Constants.Permissions.Weight,
            kit.Constants.Permissions.BodyFatPercentage,
          ],
        },
      };
      kit.initHealthKit(permissions, (err: any) => {
        if (err) {
          resolve({ granted: false, error: "PERMISSION_DENIED" });
        } else {
          resolve({ granted: true });
        }
      });
    });
  });
}

export const HealthSyncService = {
  /**
   * Requests read/write permissions for Weight, Body Fat, and Steps on both
   * platforms. Safe to call on every tab focus — re-prompts only if not yet
   * determined.
   *
   * Never throws. Returns a structured result so callers can surface the right
   * error message without crashing.
   */
  requestPermissions: async (): Promise<HealthPermissionResult> => {
    if (Platform.OS === "ios") {
      return requestIosPermissions();
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return { granted: false, error: "SDK_UNAVAILABLE" };
      try {
        // Guard 1: Health Connect requires Android API 28+.
        if (Platform.Version < 28) {
          return { granted: false, error: "SDK_UNAVAILABLE" };
        }

        // Guard 2: OS-level check via Linking — does NOT invoke the SDK.
        // On emulators and devices without Health Connect the healthconnect://
        // scheme is unregistered, so canOpenURL returns false and we exit
        // safely before any JVM-level SDK call that could bypass try/catch.
        const isInstalled = await Linking.canOpenURL("healthconnect://");
        if (!isInstalled) return { granted: false, error: "SDK_UNAVAILABLE" };

        // Guard 3: SDK availability status (safe — HC is confirmed installed).
        // SdkAvailabilityStatus: 1 = UNAVAILABLE, 2 = UPDATE_REQUIRED, 3 = AVAILABLE
        const sdkStatus = await HealthConnect.getSdkStatus();
        if (sdkStatus !== 3) {
          return { granted: false, error: "SDK_UNAVAILABLE" };
        }
        await HealthConnect.initialize();
        const result = await HealthConnect.requestPermission([
          { accessType: "read", recordType: "Weight" },
          { accessType: "write", recordType: "Weight" },
          { accessType: "read", recordType: "BodyFat" },
          { accessType: "write", recordType: "BodyFat" },
          { accessType: "read", recordType: "Steps" },
        ]);
        if (result.length > 0) return { granted: true };
        return { granted: false, error: "PERMISSION_DENIED" };
      } catch {
        return { granted: false, error: "SDK_UNAVAILABLE" };
      }
    }

    // Unsupported platform
    return { granted: false, error: "SDK_UNAVAILABLE" };
  },

  /** Returns the single most-recent Weight entry from the native SDK. */
  getLatestWeightEntry: async (): Promise<HealthWeightEntry | null> => {
    if (Platform.OS === "ios") {
      const kit = getAppleHealthKit();
      if (!kit) return null;
      return new Promise((resolve) => {
        const opts = { unit: "gram" };
        kit.getLatestWeight(opts, (err: any, result: any) => {
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
      const kit = getAppleHealthKit();
      if (!kit) return null;
      return new Promise((resolve) => {
        kit.getLatestBodyFatPercentage({}, (err: any, result: any) => {
          if (err || !result) return resolve(null);
          resolve({
            percentage: result.value ?? 0,
            date: result.endDate?.slice(0, 10) ?? "",
          });
        });
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
      const kit = getAppleHealthKit();
      if (!kit) return;
      await new Promise<void>((resolve) => {
        const sample = {
          value: weightKg * 1000, // HealthKit expects grams
          unit: "gram",
          startDate: new Date(date).toISOString(),
          endDate: new Date(date).toISOString(),
        };
        kit.saveWeight(sample, () => resolve());
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
      const kit = getAppleHealthKit();
      if (!kit) return;
      await new Promise<void>((resolve) => {
        const sample = {
          value: percentage,
          startDate: new Date(date).toISOString(),
          endDate: new Date(date).toISOString(),
        };
        kit.saveBodyFatPercentage(sample, () => resolve());
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

  /** Returns the total step count for a given calendar day (YYYY-MM-DD). */
  getStepsForDate: async (date: string): Promise<number> => {
    if (Platform.OS === "ios") {
      const kit = getAppleHealthKit();
      if (!kit) return 0;
      return new Promise((resolve) => {
        const opts = {
          date: new Date(date).toISOString(),
          includeManuallyAdded: false,
        };
        kit.getStepCount(opts, (err: any, result: any) => {
          if (err || !result) return resolve(0);
          resolve(Math.round(result.value ?? 0));
        });
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return 0;
      try {
        const d = new Date(date);
        const start = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
        ).toISOString();
        const end = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + 1,
        ).toISOString();
        const result = await HealthConnect.readRecords("Steps", {
          timeRangeFilter: {
            operator: "between",
            startTime: start,
            endTime: end,
          },
        });
        const records: any[] = result.records ?? [];
        const total = records.reduce(
          (sum: number, r: any) => sum + (r.count ?? 0),
          0,
        );
        return Math.round(total);
      } catch {
        return 0;
      }
    }

    return 0;
  },

  /**
   * Returns step counts aggregated by calendar day for the given date range.
   * Suitable for feeding charts directly.
   */
  getStepsForRange: async (
    startDate: string,
    endDate: string,
  ): Promise<HealthStepsEntry[]> => {
    if (Platform.OS === "ios") {
      const kit = getAppleHealthKit();
      if (!kit) return [];
      return new Promise((resolve) => {
        const opts = {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          includeManuallyAdded: false,
        };
        kit.getDailyStepCountSamples(opts, (err: any, results: any[]) => {
          if (err || !Array.isArray(results)) return resolve([]);
          resolve(
            results.map((r) => ({
              steps: Math.round(r.value ?? 0),
              date: r.startDate?.slice(0, 10) ?? "",
            })),
          );
        });
      });
    }

    if (Platform.OS === "android") {
      if (!HealthConnect) return [];
      try {
        const result = await HealthConnect.readRecords("Steps", {
          timeRangeFilter: {
            operator: "between",
            startTime: new Date(startDate).toISOString(),
            endTime: new Date(endDate).toISOString(),
          },
        });
        const records: any[] = result.records ?? [];
        // Aggregate individual intervals into calendar-day buckets
        const byDay: Record<string, number> = {};
        for (const r of records) {
          const day = (r.startTime as string | undefined)?.slice(0, 10) ?? "";
          if (!day) continue;
          byDay[day] = (byDay[day] ?? 0) + (r.count ?? 0);
        }
        return Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([d, steps]) => ({ date: d, steps: Math.round(steps) }));
      } catch {
        return [];
      }
    }

    return [];
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
