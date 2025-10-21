"use client";

import useSWR from "swr";

const fetcher = async (url: string): Promise<boolean> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return false;
  return (await res.json()) as boolean;
};

export function useFeatureFlag(featureName: string) {
  const { data, isLoading, error } = useSWR<boolean>(
    `/api/feature-flags/${featureName}`,
    fetcher,
  );
  return { enabled: data ?? false, isLoading, error };
}
