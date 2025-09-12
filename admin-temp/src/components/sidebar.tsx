"use client"

import Link from "next/link"
import { BarChart3, Users, Tags, CreditCard, CheckSquare, User2Icon, Ban, MessageSquare } from "lucide-react"
import { cn } from "../lib/utils"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axiosInstance"

interface SidebarProps {
  pathname: string
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: User2Icon,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Cancelled Tasks",
    href: "/tasks-cancelled",
    icon: Ban,
  },
  {
    title: "Tasker Cancellations",
    href: "/tasker-cancellations",
    icon: MessageSquare,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Payouts",
    href: "/payouts",
    icon: CreditCard,
  },
]

export function Sidebar({ pathname }: SidebarProps) {
  const [newBids, setNewBids] = useState(0)

  useEffect(() => {
    let timer: any
    const cacheKey = "admin_seen_bid_ids"
    const loadSeen = (): Set<string> => {
      try { return new Set(JSON.parse(localStorage.getItem(cacheKey) || "[]")) } catch { return new Set() }
    }
    const saveSeen = (s: Set<string>) => localStorage.setItem(cacheKey, JSON.stringify(Array.from(s)))

    const poll = async () => {
      try {
        // Use the same cache key as useBidsNotifier to avoid duplicate work
        const cacheKey = "admin_seen_bid_ids"
        const loadSeen = (): Set<string> => {
          try { return new Set(JSON.parse(localStorage.getItem(cacheKey) || "[]")) } catch { return new Set() }
        }
        const saveSeen = (s: Set<string>) => localStorage.setItem(cacheKey, JSON.stringify(Array.from(s)))
        
        // Check if we already have recent data from useBidsNotifier
        const lastPollTime = localStorage.getItem("admin_last_poll_time")
        const now = Date.now()
        if (lastPollTime && (now - parseInt(lastPollTime)) < 60000) { // Less than 1 minute ago
          console.log("Sidebar: Skipping poll, recent data available")
          return
        }
        
        const res = await axiosInstance.get("/get-all-jobs-admin/")
        const jobs = res.data?.data?.jobs || []
        const open = jobs.filter((j: any) => !j.status)
        
        // Limit to first 5 jobs to reduce API load
        const limitedJobs = open.slice(0, 5)
        
        const seen = loadSeen()
        let added = 0
        for (const job of limitedJobs) {
          try {
            const bidsRes = await axiosInstance.get(`/get-bids/${job.job_id}/`)
            const rows: any[] = bidsRes.data?.data?.bids || bidsRes.data?.data || []
            for (const r of rows) {
              const id = String(r.bid_id ?? r.id ?? `${job.job_id}-${r.user_id ?? r.tasker_id ?? r.bidder_id ?? "?"}`)
              if (!seen.has(id)) { seen.add(id); added++ }
            }
          } catch (error: any) {
            console.warn(`Sidebar: Failed to fetch bids for job ${job.job_id}:`, error.message)
          }
        }
        if (added > 0) { saveSeen(seen); setNewBids((c) => c + added) }
        
        // Update last poll time
        localStorage.setItem("admin_last_poll_time", now.toString())
      } catch (error: any) {
        console.warn("Sidebar: Polling failed:", error.message)
      }
    }
    poll()
    timer = setInterval(poll, 600000) // Reduced to 10 minutes to prevent DB overload
    return () => clearInterval(timer)
  }, [])

  return (
    <aside className="hidden w-64 border-r bg-white/90 backdrop-blur-sm md:block">
      <nav className="grid items-start px-4 py-4 text-sm font-medium">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-blue-50 hover:text-blue-700",
              pathname === item.href ? "bg-blue-50 text-blue-700" : "text-gray-600",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
            {(item.title === "Tasks" || item.title === "Bids") && newBids > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                {newBids}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}