"use client"

import Link from "next/link"
import { BarChart3, Users, Tags, CreditCard, CheckSquare, User2Icon } from "lucide-react"
import { cn } from "../lib/utils"

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
          </Link>
        ))}
      </nav>
    </aside>
  )
}