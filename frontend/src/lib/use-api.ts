"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";

// A single-endpoint fetch-on-mount hook for simple list/detail pages.
// Anything that needs to combine several endpoints (the dashboard's
// aggregation, for instance) fetches directly with apiFetch instead —
// this is for the common case, not every case.
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!path) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    apiFetch<T>(path)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong"))
      .finally(() => setIsLoading(false));
  }, [path]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, error, isLoading, refetch };
}
