"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
    Home,
    ShoppingCart,
    Car,
    Heart,
    GraduationCap,
    Shirt,
    Ticket,
    Wifi,
    LayoutTemplate,
    ChevronDown,
    Users,
    BarChart3,
    Globe,
    Clock,
    Shield,
    Search,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CityData {
    il: string              // province (il)
    city: string            // district (ilçe)
    user_count: number
    expenditures: {
        housing: number
        market_food: number
        transport: number
        misc: number
        health: number
        education: number
        clothing: number
        culture: number
        communication: number
    }
    updated_at?: string
}

interface Props {
    cities: CityData[]
}

// ─── Category Config ───────────────────────────────────────────────────────────

const CATEGORIES = [
    { key: "housing",       label: "KİRA / BARINMA",      icon: Home,          color: "#3B82F6", maxRef: 25000 },
    { key: "market_food",   label: "MUTFAK / MARKET",     icon: ShoppingCart,  color: "#10B981", maxRef: 20000 },
    { key: "transport",     label: "ULAŞIM / AKARYAKIT",  icon: Car,           color: "#F59E0B", maxRef: 15000 },
    { key: "misc",          label: "EV / MOBİLYA",        icon: LayoutTemplate, color: "#6366F1", maxRef: 15000 },
    { key: "health",        label: "SAĞLIK",              icon: Heart,         color: "#EF4444", maxRef: 8000  },
    { key: "education",     label: "EĞİTİM",              icon: GraduationCap, color: "#8B5CF6", maxRef: 15000 },
    { key: "clothing",      label: "GİYİM",               icon: Shirt,         color: "#EC4899", maxRef: 7000  },
    { key: "culture",       label: "EĞLENCE / KÜLTÜR",    icon: Ticket,        color: "#0EA5E9", maxRef: 10000 },
    { key: "communication", label: "İLETİŞİM / İNTERNET", icon: Wifi,          color: "#14B8A6", maxRef: 5000  },
] as const

type CategoryKey = typeof CATEGORIES[number]["key"]

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTRY(val: number): string {
    return val.toLocaleString("tr-TR")
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CityAnalytics({ cities }: Props) {
    // Build province list (unique `il` values)
    const provinces = useMemo(() => {
        const set = new Set(cities.map((c) => c.il))
        return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))
    }, [cities])

    const [selectedProvince, setSelectedProvince] = useState<string>(provinces[0] ?? "")
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const searchRef = useRef<HTMLInputElement>(null)

    // Filter provinces by search query
    const filteredProvinces = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return provinces
        return provinces.filter((p) => p.toLowerCase().includes(q))
    }, [provinces, searchQuery])

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if (dropdownOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50)
        } else {
            setSearchQuery("")
        }
    }, [dropdownOpen])

    // Close dropdown on outside click
    const dropdownRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleOutside)
        return () => document.removeEventListener("mousedown", handleOutside)
    }, [])

    // Filter districts under selected province
    const districtsInProvince = useMemo(
        () => cities.filter((c) => c.il === selectedProvince),
        [cities, selectedProvince]
    )

    // Aggregate: sum expenditures + count participants across all districts in province
    const { totals, totalParticipants, grandTotal } = useMemo(() => {
        const sums: Record<string, number> = {}
        CATEGORIES.forEach((cat) => (sums[cat.key] = 0))
        let participants = 0

        districtsInProvince.forEach((c) => {
            participants += c.user_count
            CATEGORIES.forEach((cat) => {
                sums[cat.key] += c.expenditures[cat.key as CategoryKey] ?? 0
            })
        })

        const grand = Object.values(sums).reduce((a, b) => a + b, 0)
        return { totals: sums, totalParticipants: participants, grandTotal: grand }
    }, [districtsInProvince])

    // Today's date
    const todayDate = new Date().toLocaleDateString("tr-TR")

    if (cities.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="bg-slate-100 rounded-2xl p-6">
                    <BarChart3 className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg font-medium">Henüz şehir verisi bulunamadı.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 bg-[#F8FAFC] min-h-screen">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                        <BarChart3 className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">
                            City Analytics
                        </h1>
                        <p className="text-slate-400 text-sm font-semibold tracking-[0.15em] uppercase mt-0.5">
                            Harcama Matrisi
                        </p>
                    </div>
                </div>

                {/* Admin badge */}
                <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                    <Shield className="w-4 h-4 opacity-80" />
                    <span>Admin Görünümü</span>
                </div>
            </div>

            {/* ── Controls Row ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.04)] p-6 flex items-center justify-between flex-wrap gap-4">

                {/* Province Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">
                        Şehir Seç
                        <span className="ml-2 text-indigo-400 normal-case font-medium tracking-normal">
                            ({provinces.length} şehir)
                        </span>
                    </p>
                    <button
                        id="province-dropdown-btn"
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="flex items-center gap-3 bg-[#F8FAFC] hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[#1E293B] font-semibold px-5 py-3 rounded-xl transition-all min-w-[240px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <span>{selectedProvince || "Seçiniz..."}</span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full min-w-[260px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="p-3 border-b border-slate-100">
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-400 transition-colors">
                                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Şehir ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full font-medium"
                                    />
                                </div>
                            </div>
                            {/* Province list */}
                            <div className="max-h-60 overflow-y-auto">
                                {filteredProvinces.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-slate-400 text-sm">
                                        Sonuç bulunamadı
                                    </div>
                                ) : (
                                    filteredProvinces.map((prov) => (
                                        <button
                                            key={prov}
                                            onClick={() => {
                                                setSelectedProvince(prov)
                                                setDropdownOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                                                prov === selectedProvince
                                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{prov}</span>
                                            {prov === selectedProvince && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 flex-wrap">
                    {/* Participant Badge */}
                    <div
                        id="participant-badge"
                        className="flex items-center gap-2 bg-[#E0E7FF] text-[#4F46E5] px-5 py-3 rounded-xl font-bold text-sm shadow-sm"
                    >
                        <Users className="w-4 h-4" />
                        <span>{totalParticipants}</span>
                        <span className="font-medium opacity-80">Katılımcı</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{todayDate}</span>
                    </div>
                </div>
            </div>

            {/* ── Spending Matrix Grid ──────────────────────────────────────── */}
            {districtsInProvince.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                    <Globe className="w-10 h-10 opacity-40" />
                    <p className="font-medium">Bu il için veri bulunamadı.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const val = totals[cat.key] ?? 0
                        // Width relative to maxRef; fallback to grandTotal share for flexibility
                        const shareOfTotal = grandTotal > 0 ? (val / grandTotal) * 100 : 0
                        const absPercent = Math.min(100, (val / cat.maxRef) * 100)

                        return (
                            <div
                                key={cat.key}
                                id={`category-card-${cat.key}`}
                                className="group bg-white p-7 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col space-y-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                            >
                                {/* Icon + Label */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-200"
                                            style={{ backgroundColor: `${cat.color}18` }}
                                        >
                                            <Icon
                                                className="w-5 h-5 transition-colors"
                                                style={{ color: cat.color }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-[#64748B] tracking-widest uppercase">
                                            {cat.label}
                                        </span>
                                    </div>

                                    {/* Share badge */}
                                    <span
                                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                        style={{
                                            backgroundColor: `${cat.color}18`,
                                            color: cat.color,
                                        }}
                                    >
                                        %{shareOfTotal.toFixed(1)}
                                    </span>
                                </div>

                                {/* Amount */}
                                <div>
                                    <span className="text-3xl font-black text-[#1E293B]">
                                        {formatTRY(val)}{" "}
                                        <span className="text-[0.55em] font-medium opacity-50">₺</span>
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5 mt-auto">
                                    <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${absPercent}%`,
                                                backgroundColor: cat.color,
                                                boxShadow: `0 0 8px ${cat.color}50`,
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                        <span>0 ₺</span>
                                        <span>{formatTRY(cat.maxRef)} ₺</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Districts Summary Table ──────────────────────────────────── */}
            {districtsInProvince.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="h-7 w-1.5 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-bold text-[#1E293B]">
                            {selectedProvince} — İlçe Dağılımı
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500">
                                    <th className="text-left px-8 py-4 font-semibold tracking-wide text-xs uppercase">İlçe</th>
                                    <th className="text-right px-6 py-4 font-semibold tracking-wide text-xs uppercase">Katılımcı</th>
                                    <th className="text-right px-6 py-4 font-semibold tracking-wide text-xs uppercase">Kira</th>
                                    <th className="text-right px-6 py-4 font-semibold tracking-wide text-xs uppercase">Mutfak</th>
                                    <th className="text-right px-6 py-4 font-semibold tracking-wide text-xs uppercase">Ulaşım</th>
                                    <th className="text-right px-8 py-4 font-semibold tracking-wide text-xs uppercase">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {districtsInProvince.map((d, i) => {
                                    const rowTotal = Object.values(d.expenditures).reduce((a, b) => a + b, 0)
                                    return (
                                        <tr
                                            key={`${d.il}-${d.city}`}
                                            className={`border-t border-slate-50 hover:bg-slate-50/60 transition-colors ${
                                                i % 2 === 0 ? "" : "bg-slate-50/30"
                                            }`}
                                        >
                                            <td className="px-8 py-4 font-semibold text-[#1E293B]">{d.city}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {d.user_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatTRY(d.expenditures.housing)} ₺</td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatTRY(d.expenditures.market_food)} ₺</td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatTRY(d.expenditures.transport)} ₺</td>
                                            <td className="px-8 py-4 text-right font-bold text-[#1E293B]">{formatTRY(rowTotal)} ₺</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50">
                                    <td className="px-8 py-4 font-bold text-indigo-700">Toplam ({selectedProvince})</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                                            <Users className="w-3.5 h-3.5" />
                                            {totalParticipants}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-700">{formatTRY(totals.housing)} ₺</td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-700">{formatTRY(totals.market_food)} ₺</td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-700">{formatTRY(totals.transport)} ₺</td>
                                    <td className="px-8 py-4 text-right font-black text-indigo-700">{formatTRY(grandTotal)} ₺</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
