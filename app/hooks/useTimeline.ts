"use client";

import { useState, useEffect, useRef } from "react";

export interface TimelineItem {
  id: string;
  timestamp: string;
  icon: string;
  title: string;
  description: string;
}

const timelineCache = new Map<number, TimelineItem[]>();

export function useTimeline(districtId: number, open: boolean): { items: TimelineItem[]; loading: boolean } {
  const [items, setItems] = useState<TimelineItem[]>(() => timelineCache.get(districtId) || []);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    if (fetchedRef.current.has(districtId)) {
      setItems(timelineCache.get(districtId) || []);
      return;
    }

    setLoading(true);
    fetch(`/api/data/timeline?district=${districtId}`)
      .then(r => r.json())
      .then((data: TimelineItem[]) => {
        timelineCache.set(districtId, data);
        fetchedRef.current.add(districtId);
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [districtId, open]);

  return { items, loading };
}
