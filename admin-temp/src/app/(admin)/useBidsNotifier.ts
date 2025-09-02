"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

interface JobLite {
  job_id: string;
  status: boolean;
}

export function useBidsNotifier(pollMs: number = 45000) {
  const [newBidsCount, setNewBidsCount] = useState<number>(0);
  const [lastNewBids, setLastNewBids] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cacheKey = "admin_seen_bid_ids";

  const loadSeen = (): Set<string> => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  };

  const saveSeen = (setIds: Set<string>) => {
    localStorage.setItem(cacheKey, JSON.stringify(Array.from(setIds)));
  };

  const tick = async () => {
    try {
      // 1) fetch all jobs for admin
      const jobsRes = await axiosInstance.get("/get-all-jobs-admin/");
      const jobs: JobLite[] = jobsRes.data?.data?.jobs || [];
      const openJobs = jobs.filter((j) => !j.status); // status false -> open

      const seen = loadSeen();
      const newIds: string[] = [];

      // 2) fetch bids per job
      for (const job of openJobs) {
        const bidsRes = await axiosInstance.get(`/get-bids/${job.job_id}/`);
        const rows: any[] = bidsRes.data?.data?.bids || bidsRes.data?.data || [];
        for (const r of rows) {
          const id = String(r.bid_id ?? r.id ?? `${job.job_id}-${r.user_id ?? r.tasker_id ?? r.bidder_id ?? "?"}`);
          if (!seen.has(id)) {
            seen.add(id);
            newIds.push(id);
          }
        }
      }

      if (newIds.length > 0) {
        saveSeen(seen);
        setNewBidsCount((c) => c + newIds.length);
        setLastNewBids(newIds);
      }
    } catch {
      // ignore failures
    }
  };

  useEffect(() => {
    tick();
    timerRef.current = setInterval(tick, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => setNewBidsCount(0);

  return { newBidsCount, lastNewBids, reset };
}
