"use client"

import Link from "next/link"
import { BarChart3, Users, Tags, CreditCard, X, LogOut, CheckSquare, User2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  pathname: string
  setIsMobileNavOpen: (open: boolean) => void
  handleLogout: () => void
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
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

export function MobileNav({ pathname, setIsMobileNavOpen, handleLogout }: MobileNavProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <span>TaskMaster Admin</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileNavOpen(false)}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <nav className="grid items-start px-4 py-4 text-sm font-medium">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileNavOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
        <div className="mt-auto pt-4">
          <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </nav>
    </div>
  )
}
