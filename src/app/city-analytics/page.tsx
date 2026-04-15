/**
 * City Analytics — Admin Page
 *
 * Strateji: Sadece profiles tablosunu kullan (city_analytic tablosu RLS/cache sorunu olabilir).
 * 1. profiles tablosundan TÜM kayıtları çek (city + district + expenditures_object)
 * 2. `city` (= il/province) alanına göre grupla → tüm iller dropdown'da görünsün
 * 3. `district` yoksa il geneline yaz (tek grup)
 * 4. expenditures_object SUM'la
 */

import { supabase } from "@/lib/supabase"
import { CityAnalytics, CityData } from "@/components/dashboard/CityAnalytics"
import { Shield } from "lucide-react"

export const revalidate = 60

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ZERO_EXP = () => ({
    housing: 0,
    market_food: 0,
    transport: 0,
    misc: 0,
    health: 0,
    education: 0,
    clothing: 0,
    culture: 0,
    communication: 0,
})

type ExpMap = ReturnType<typeof ZERO_EXP>

const FIELD_ALIASES: Record<keyof ExpMap, string[]> = {
    housing:       ["housing", "kira"],
    market_food:   ["market_food", "mutfak", "food"],
    transport:     ["transport", "ulasim", "ulaşım"],
    misc:          ["misc", "mobilya", "ev"],
    health:        ["health", "saglik", "sağlık"],
    education:     ["education", "egitim", "eğitim"],
    clothing:      ["clothing", "giyim"],
    culture:       ["culture", "eglence", "eğlence"],
    communication: ["communication", "iletisim", "iletişim"],
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function getCityMatrixData(): Promise<CityData[]> {
    // Fetch every profile that has at least a `city` (il) value
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("city, district, expenditures_object")
        .not("city", "is", null)

    if (error) {
        console.error("[CityAnalytics] profiles error:", error.message)
        return []
    }

    if (!profiles || profiles.length === 0) return []

    // Group by (il , district) — if district is null/empty use "Genel" as bucket
    const map = new Map<string, CityData>()

    for (const profile of profiles) {
        const il = (profile.city as string)?.trim() || "Bilinmiyor"
        const rawDistrict = (profile.district as string)?.trim()
        const district = rawDistrict || "Genel"  // fallback when district is not filled

        const key = `${il}__${district}`

        if (!map.has(key)) {
            map.set(key, {
                il,
                city: district,
                user_count: 0,
                expenditures: ZERO_EXP(),
            })
        }

        const entry = map.get(key)!
        entry.user_count += 1

        const raw = (profile.expenditures_object as Record<string, number>) ?? {}

        for (const [catKey, aliases] of Object.entries(FIELD_ALIASES) as [keyof ExpMap, string[]][]) {
            const sum = aliases.reduce((acc, alias) => acc + (Number(raw[alias]) || 0), 0)
            entry.expenditures[catKey] += sum
        }
    }

    // Sort: by il (TR locale), then by district
    return Array.from(map.values()).sort((a, b) =>
        a.il.localeCompare(b.il, "tr") || a.city.localeCompare(b.city, "tr")
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityAnalyticsPage() {
    const cities = await getCityMatrixData()

    return (
        <div>
            {/* Admin watermark strip */}
            <div className="flex items-center gap-2 px-8 pt-4 pb-0">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-indigo-400">
                    Admin · Harcama Matrisi
                </span>
            </div>

            <CityAnalytics cities={cities} />
        </div>
    )
}
