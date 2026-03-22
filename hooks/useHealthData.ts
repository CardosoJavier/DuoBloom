import { useAppToast } from "@/hooks/use-app-toast";
import {
  HealthBodyFatEntry,
  HealthConnectionError,
  HealthStepsEntry,
  HealthSyncService,
  HealthWeightEntry,
} from "@/services/HealthSyncService";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface UseHealthDataResult {
  hasPermission: boolean;
  isLoading: boolean;
  connectionError: HealthConnectionError | null;
  latestWeightEntry: HealthWeightEntry | null;
  latestBodyFatEntry: HealthBodyFatEntry | null;
  stepsToday: number | null;
  refresh: () => Promise<void>;
  writeWeightEntry: (weightKg: number, date: string) => Promise<void>;
  writeBodyFatEntry: (percentage: number, date: string) => Promise<void>;
  getStepsForDate: (date: string) => Promise<number>;
  getStepsForRange: (start: string, end: string) => Promise<HealthStepsEntry[]>;
}

export function useHealthData(): UseHealthDataResult {
  const { t } = useTranslation();
  const toast = useAppToast();

  // Stable refs so fetchData can have an empty dep array.
  // useAppToast() returns a new plain object on every render (its shorthand
  // methods are not memoised), so putting `toast` in useCallback deps causes
  // an infinite loop: toast changes → fetchData recreated → useEffect fires
  // → setState → re-render → new toast object → repeat.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const tRef = useRef(t);
  tRef.current = t;

  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] =
    useState<HealthConnectionError | null>(null);
  const [latestWeightEntry, setLatestWeightEntry] =
    useState<HealthWeightEntry | null>(null);
  const [latestBodyFatEntry, setLatestBodyFatEntry] =
    useState<HealthBodyFatEntry | null>(null);
  const [stepsToday, setStepsToday] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { granted, error } = await HealthSyncService.requestPermissions();
      setHasPermission(granted);
      setConnectionError(error ?? null);

      if (error === "SDK_UNAVAILABLE") {
        toastRef.current.warning(tRef.current("stats.health_unavailable"));
      } else if (error === "PERMISSION_DENIED") {
        toastRef.current.info(tRef.current("stats.health_permission_denied"));
      }

      if (!granted) return;

      const today = new Date().toISOString().slice(0, 10);
      const [weight, fat, steps] = await Promise.all([
        HealthSyncService.getLatestWeightEntry(),
        HealthSyncService.getLatestBodyFatEntry(),
        HealthSyncService.getStepsForDate(today),
      ]);
      setLatestWeightEntry(weight);
      setLatestBodyFatEntry(fat);
      setStepsToday(steps);
    } finally {
      setIsLoading(false);
    }
    // toast and t are accessed via refs — intentionally omitted from deps
    // to prevent the infinite re-render loop described above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const writeWeightEntry = useCallback(
    (kg: number, date: string) => HealthSyncService.writeWeightEntry(kg, date),
    [],
  );

  const writeBodyFatEntry = useCallback(
    (pct: number, date: string) =>
      HealthSyncService.writeBodyFatEntry(pct, date),
    [],
  );

  const getStepsForDate = useCallback(
    (date: string) => HealthSyncService.getStepsForDate(date),
    [],
  );

  const getStepsForRange = useCallback(
    (start: string, end: string) =>
      HealthSyncService.getStepsForRange(start, end),
    [],
  );

  return {
    hasPermission,
    isLoading,
    connectionError,
    latestWeightEntry,
    latestBodyFatEntry,
    stepsToday,
    refresh: fetchData,
    writeWeightEntry,
    writeBodyFatEntry,
    getStepsForDate,
    getStepsForRange,
  };
}
