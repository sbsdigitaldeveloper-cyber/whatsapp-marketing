"use client";

import { useState, useEffect } from "react";

export function useDashboardData(dateRange: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    setLoading(true);

    fetch(`/api/dashboard?range=${dateRange}`)
      .then((res) => res.json())
      .then((res) => {
        console.log("DASHBOARD DATA:", res); // 🔥 DEBUG
        if (!cancel) setData(res);
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [dateRange]);

  return { data, isLoading, error };
}