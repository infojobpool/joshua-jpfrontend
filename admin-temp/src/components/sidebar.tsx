"use client"

import Link from "next/link"
import { BarChart3, Users, Tags, CreditCard, CheckSquare, User2Icon } from "lucide-react"
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
    title: "Bids",
    href: "/bids",
    icon: Users,
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
        const res = await axiosInstance.get("/get-all-jobs-admin/")
        const jobs = res.data?.data?.jobs || []
        const open = jobs.filter((j: any) => !j.status)
        const seen = loadSeen()
        let added = 0
        for (const job of open) {
          const bidsRes = await axiosInstance.get(`/get-bids/${job.job_id}/`)
          const rows: any[] = bidsRes.data?.data?.bids || bidsRes.data?.data || []
          for (const r of rows) {
            const id = String(r.bid_id ?? r.id ?? `${job.job_id}-${r.user_id ?? r.tasker_id ?? r.bidder_id ?? "?"}`)
            if (!seen.has(id)) { seen.add(id); added++ }
          }
        }
        if (added > 0) { saveSeen(seen); setNewBids((c) => c + added) }
      } catch {}
    }
    poll()
    timer = setInterval(poll, 45000)
    return () => clearInterval(timer)
  }, [])

  return (
    <aside className="hidden w-64 border-r bg-muted/40 md:block">
      <nav className="grid items-start px-4 py-4 text-sm font-medium">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
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