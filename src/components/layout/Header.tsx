"use client"

import { Bell } from "lucide-react"

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-gray-50/40 px-6 dark:bg-gray-800/40">
            <div className="flex flex-1 items-center justify-between">
                <h2 className="text-lg font-semibold">Dashboard</h2>
                <div className="flex items-center gap-4">
                    <button className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-800">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <span className="sr-only">Notifications</span>
                    </button>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
        </header>
    )
}
