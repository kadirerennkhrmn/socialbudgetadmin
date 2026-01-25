"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Search as SearchIcon } from "lucide-react"

export function Search({ placeholder }: { placeholder: string }) {
    const { replace } = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set("q", term)
        } else {
            params.delete("q")
        }

        startTransition(() => {
            replace(`${pathname}?${params.toString()}`)
        })
    }

    return (
        <div className="relative flex flex-1 flex-shrink-0">
            <label htmlFor="search" className="sr-only">
                Search
            </label>
            <Input
                className="pl-8 sm:w-[300px] md:w-[300px]"
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("q")?.toString()}
            />
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
    )
}
