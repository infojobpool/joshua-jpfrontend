"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

interface JobLite {
  job_id: string;
  status: boolean;
}

export function useBidsNotifier(pollMs: number = 600000) { // Reduced to 10 minutes to prevent DB overload
  const [newBidsCount, setNewBidsCount] = useState<number>(0);
  const [lastNewBids, setLastNewBids] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false); // Prevent concurrent polling

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
    // Prevent concurrent polling
    if (isPollingRef.current) {
      console.log("useBidsNotifier: Polling already in progress, skipping...");
      return;
    }
    
    isPollingRef.current = true;
    
    try {
      console.log("useBidsNotifier: Starting poll...");
      
      // 1) fetch all jobs for admin with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const jobsRes = await axiosInstance.get("/get-all-jobs-admin/", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const jobs: JobLite[] = jobsRes.data?.data?.jobs || [];
      const openJobs = jobs.filter((j) => !j.status); // status false -> open
      
      // Limit to first 10 jobs to reduce API calls
      const limitedJobs = openJobs.slice(0, 10);

      const seen = loadSeen();
      const newIds: string[] = [];

      // 2) fetch bids per job with better error handling
      for (const job of limitedJobs) {
        try {
          const bidsController = new AbortController();
          const bidsTimeoutId = setTimeout(() => bidsController.abort(), 5000); // 5s timeout per bid request
          
          const bidsRes = await axiosInstance.get(`/get-bids/${job.job_id}/`, {
            signal: bidsController.signal
          });
          clearTimeout(bidsTimeoutId);
          
          const rows: any[] = bidsRes.data?.data?.bids || bidsRes.data?.data || [];
          for (const r of rows) {
            const id = String(r.bid_id ?? r.id ?? `${job.job_id}-${r.user_id ?? r.tasker_id ?? r.bidder_id ?? "?"}`);
            if (!seen.has(id)) {
              seen.add(id);
              newIds.push(id);
            }
          }
        } catch (error: any) {
          // Skip individual job bid failures but continue with others
          if (error.name !== 'AbortError') {
            console.warn(`useBidsNotifier: Failed to fetch bids for job ${job.job_id}:`, error.message);
          }
        }
      }

      if (newIds.length > 0) {
        saveSeen(seen);
        setNewBidsCount((c) => c + newIds.length);
        setLastNewBids(newIds);
        console.log(`useBidsNotifier: Found ${newIds.length} new bids`);
      } else {
        console.log("useBidsNotifier: No new bids found");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn("useBidsNotifier: Polling failed:", error.message);
      }
    } finally {
      isPollingRef.current = false;
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
