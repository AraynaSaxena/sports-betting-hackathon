// src/hooks/useBetAnalytics.js
import { useEffect, useMemo, useState } from "react";
import { BetAnalytics } from "../utils/BetAnalytics";

export function useBetAnalytics(options) {
  const [tick, setTick] = useState(0);

  // Subscribe once; bump tick when analytics change
  useEffect(() => {
    const unsub = BetAnalytics.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  // Stable key for options so we don't recompute every render
  const optsKey = useMemo(() => JSON.stringify(options || {}), [options]);

  // Recompute stats only when store changes or options change
  return useMemo(() => BetAnalytics.stats(options), [tick, optsKey]);
}
