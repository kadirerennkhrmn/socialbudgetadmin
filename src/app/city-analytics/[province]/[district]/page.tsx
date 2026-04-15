import { supabase } from "@/lib/supabase"
import { ArrowLeft, Home, ShoppingCart, Car, Heart, GraduationCap, Shirt, Ticket, Smartphone, Globe, Clock, Briefcase, TrendingUp, Users2, Info, LayoutTemplate, Wifi } from "lucide-react"
import Link from "next/link"

export const revalidate = 0

export default async function CityDetailAnalyticsPage(props: {
    params: Promise<{ province: string, district: string }>
}) {
    const params = await props.params;
    const province = decodeURIComponent(params.province)
    const district = decodeURIComponent(params.district)

    // Fetch all profiles in this district to calculate identity metrics
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('city', province)
        .eq('district', district)

    let userCount = profiles?.length || 0
    let averages: Record<string, number> = {
        housing: 0,
        market_food: 0,
        transport: 0,
        misc: 0, // Mapped to EV/MOBİLYA
        health: 0,
        education: 0,
        clothing: 0,
        culture: 0,
        communication: 0,
    }

    let stats = {
        avgSalary: 0,
        mostCommonJob: 'N/A',
        mostCommonAge: 'N/A',
    }

    if (userCount > 0 && profiles) {
        let sums: Record<string, number> = { ...averages }
        let totalSalary = 0
        let jobCounts: Record<string, number> = {}
        let ageCounts: Record<string, number> = {}

        profiles.forEach(profile => {
            // Spending
            const exp = profile.expenditures_object || {}
            Object.keys(sums).forEach(key => {
                sums[key] += Number(exp[key] || 0)
            })

            // Meta
            totalSalary += Number(profile.salary || 0)
            if (profile.job) jobCounts[profile.job] = (jobCounts[profile.job] || 0) + 1
            if (profile.age_group) ageCounts[profile.age_group] = (ageCounts[profile.age_group] || 0) + 1
        })
        
        Object.keys(averages).forEach(key => {
            averages[key] = Math.round(sums[key] / userCount)
        })

        stats.avgSalary = Math.round(totalSalary / userCount)
        
        // Find most common
        stats.mostCommonJob = Object.entries(jobCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belirtilmedi'
        stats.mostCommonAge = Object.entries(ageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belirtilmedi'
    }

    const identitySummary = `Bu bölge, ağırlıklı olarak ${stats.mostCommonJob} profesyonellerinden oluşan, ${stats.mostCommonAge} yaş grubunun yoğunlukta olduğu bir profil çizmektedir. Ortalama ${stats.avgSalary.toLocaleString('tr-TR')} ₺ gelir seviyesi ile ekonomik canlılığını koruyan ${district}, harcama alışkanlıkları bakımından dengeli bir yapı sergilemektedir.`

    const categories = [
        { key: 'housing', label: 'KİRA / BARINMA', icon: Home, color: '#3B82F6', max: 25000 },
        { key: 'market_food', label: 'MUTFAK / MARKET', icon: ShoppingCart, color: '#10B981', max: 20000 },
        { key: 'transport', label: 'ULAŞIM / AKARYAKIT', icon: Car, color: '#F59E0B', max: 15000 },
        { key: 'misc', label: 'EV / MOBİLYA', icon: LayoutTemplate, color: '#6366F1', max: 15000 },
        { key: 'health', label: 'SAĞLIK', icon: Heart, color: '#EF4444', max: 8000 },
        { key: 'education', label: 'EĞİTİM', icon: GraduationCap, color: '#8B5CF6', max: 15000 },
        { key: 'clothing', label: 'GİYİM', icon: Shirt, color: '#EC4899', max: 7000 },
        { key: 'culture', label: 'EĞLENCE / KÜLTÜR', icon: Ticket, color: '#0EA5E9', max: 10000 },
        { key: 'communication', label: 'İLETİŞİM / İNTERNET', icon: Wifi, color: '#14B8A6', max: 5000 },
    ]

    const todayDate = new Date().toLocaleDateString('tr-TR')

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 bg-[#F8FAFC] min-h-screen">
            {/* Header Section */}
            <div className="flex items-center space-x-6">
                <Link href="/city-analytics" className="group p-3 bg-white hover:bg-indigo-50 rounded-2xl shadow-sm border border-slate-200 transition-all">
                    <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:text-indigo-600" />
                </Link>
                
                <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <Globe className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight mb-1">
                                {district.toUpperCase()}, {province.toUpperCase()}
                            </h1>
                            <p className="text-slate-400 text-sm font-semibold tracking-[0.2em] uppercase">HARCAMA MATRİSİ</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                        <div className="bg-[#E0E7FF] text-[#4F46E5] px-5 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center space-x-2">
                            <span className="opacity-80 font-medium">{userCount}</span>
                            <span>KATILIMCI</span>
                        </div>
                        <div className="flex items-center text-slate-400 text-sm font-medium space-x-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span>{todayDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat) => {
                    const val = averages[cat.key] || 0
                    const widthPercent = Math.min(100, (val / cat.max) * 100)
                    const Icon = cat.icon
                    
                    return (
                        <div key={cat.key} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col space-y-5 hover:shadow-xl transition-all duration-300 group cursor-default">
                            <div className="flex items-center space-x-4">
                                <div className="bg-[#F8FAFC] p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                    <Icon className="w-6 h-6 text-[#94A3B8] group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <span className="text-xs font-bold text-[#64748B] tracking-widest uppercase">{cat.label}</span>
                            </div>
                            
                            <div className="py-1">
                                <span className="text-3xl font-black text-[#1E293B]">
                                    {val.toLocaleString('tr-TR')} <span className="text-[0.6em] font-medium opacity-60">₺</span>
                                </span>
                            </div>
                            
                            <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-auto">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ 
                                        width: `${widthPercent}%`,
                                        backgroundColor: cat.color,
                                        boxShadow: `0 0 10px ${cat.color}40`
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* City Identity / Analytics Details */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <h2 className="text-2xl font-bold text-[#1E293B]">Bölge Kimliği</h2>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex items-start space-x-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl">
                        <Info className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1E293B] mb-2">Özet Analiz</h3>
                        <p className="text-slate-500 leading-relaxed text-lg">
                            {identitySummary}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profession Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-lg -rotate-1 hover:rotate-0 transition-transform cursor-default">
                        <div className="bg-white/10 p-3 rounded-xl w-fit mb-6">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h3 className="text-white/70 text-sm font-bold tracking-widest uppercase mb-2">En Yaygın Meslek</h3>
                        <p className="text-2xl font-black tracking-tight">{stats.mostCommonJob}</p>
                    </div>

                    {/* Salary Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                        <div className="bg-emerald-50 p-3 rounded-xl w-fit mb-6">
                            <TrendingUp className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2">Ortalama Gelir</h3>
                        <p className="text-3xl font-black text-[#1E293B]">
                            {stats.avgSalary.toLocaleString('tr-TR')} <span className="text-[0.6em] font-medium opacity-60">₺</span>
                        </p>
                    </div>

                    {/* Age/Demographics Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                        <div className="bg-amber-50 p-3 rounded-xl w-fit mb-6">
                            <Users2 className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2">Demografik Odak</h3>
                        <p className="text-3xl font-black text-[#1E293B]">{stats.mostCommonAge} Yaş Grubu</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
