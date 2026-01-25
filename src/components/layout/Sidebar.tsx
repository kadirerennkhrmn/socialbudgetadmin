"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Map,
    TrendingUp,
    Target,
} from "lucide-react"

const sidebarItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Profiles", href: "/profiles", icon: Users },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "City Analytics", href: "/city-analytics", icon: Map },
    { name: "Market Averages", href: "/market-averages", icon: TrendingUp },
    { name: "Saving Goals", href: "/saving-goals", icon: Target },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card p-4">
            <div className="mb-8 flex items-center px-2">
                <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
            </div>
            <nav className="flex-1 space-y-1">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
