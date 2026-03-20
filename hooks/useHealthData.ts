import {
  HealthBodyFatEntry,
  HealthSyncService,
  HealthWeightEntry,
} from "@/services/HealthSyncService";
import { useCallback, useEffect, useState } from "react";

export interface UseHealthDataResult {
  hasPermission: boolean;
  isLoading: boolean;
  latestWeightEntry: HealthWeightEntry | null;
  latestBodyFatEntry: HealthBodyFatEntry | null;
  refresh: () => Promise<void>;
  writeWeightEntry: (weightKg: number, date: string) => Promise<void>;
  writeBodyFatEntry: (percentage: number, date: string) => Promise<void>;
}

export function useHealthData(): UseHealthDataResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestWeightEntry, setLatestWeightEntry] =
    useState<HealthWeightEntry | null>(null);
  const [latestBodyFatEntry, setLatestBodyFatEntry] =
    useState<HealthBodyFatEntry | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await HealthSyncService.requestPermissions();
      setHasPermission(granted);
      if (!granted) return;
      const [weight, fat] = await Promise.all([
        HealthSyncService.getLatestWeightEntry(),
        HealthSyncService.getLatestBodyFatEntry(),
      ]);
      setLatestWeightEntry(weight);
      setLatestBodyFatEntry(fat);
    } finally {
      setIsLoading(false);
    }
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

  return {
    hasPermission,
    isLoading,
    latestWeightEntry,
    latestBodyFatEntry,
    refresh: fetchData,
    writeWeightEntry,
    writeBodyFatEntry,
  };
}
