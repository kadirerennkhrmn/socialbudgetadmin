"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { adminService } from '@/lib/adminService'
import { CATEGORY_COLORS, CATEGORY_LABELS, ALL_TURKISH_CITIES, METRO_DISTRICTS } from '@/lib/constants'
import {
  Users, Building2, Wallet, Database,
  Search, RefreshCw, ChevronRight,
  BarChart3, ShieldCheck, UserCircle, Globe,
  Activity, TrendingUp, Tag,
  ShoppingCart, Info, Clock, Heart,
  GraduationCap, Smartphone, Sparkles, Home,
  Coffee, Wine, Repeat, Package, Sofa, Car,
  Plus, Trash2, Settings, X, Crown, ShieldAlert
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'STATS' | 'USERS' | 'CITIES' | 'PRICES'

// ─── Category Icon Helper ─────────────────────────────────────────────────────

function getCategoryIcon(key: string) {
  switch (key) {
    case 'housing': return <Home size={14} />
    case 'market_food': return <ShoppingCart size={14} />
    case 'transport': return <Car size={14} />
    case 'health': return <Heart size={14} />
    case 'education': return <GraduationCap size={14} />
    case 'clothing': return <Tag size={14} />
    case 'culture': return <Sparkles size={14} />
    case 'communication': return <Smartphone size={14} />
    case 'personal_care': return <UserCircle size={14} />
    case 'restaurants': return <Coffee size={14} />
    case 'alcohol_tobacco': return <Wine size={14} />
    case 'subscriptions': return <Repeat size={14} />
    case 'furniture': return <Sofa size={14} />
    case 'misc': return <Package size={14} />
    default: return <Info size={14} />
  }
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm">
      <div className={`p-2 rounded-xl bg-slate-50 mb-4 inline-block ${color}`}>{icon}</div>
      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">{label}</span>
      <div className="text-2xl font-black text-slate-800 tracking-tighter">{value}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [cityData, setCityData] = useState<any[]>([])
  const [pricesData, setPricesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('STATS')
  const [search, setSearch] = useState('')
  const [visibleCities, setVisibleCities] = useState(20)

  // City Analysis Filters
  const [filterCity, setFilterCity] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')

  // Price Management
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL')
  const [editModal, setEditModal] = useState<{ open: boolean; mode: 'ADD' | 'EDIT' | 'BULK'; data?: any }>({ open: false, mode: 'ADD' })
  const [selectedExpenseUser, setSelectedExpenseUser] = useState<any | null>(null)

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true)
    const [p, c, ma] = await Promise.all([
      adminService.getAllProfiles(),
      adminService.getAllCityAnalytics(),
      adminService.getAllMarketAverages()
    ])
    if (p.data) setProfiles(p.data)
    if (c.data) setCityData(c.data)

    if (ma.data) {
      const mappedData = (ma.data as any[]).map((row: any) => ({
        id: row.id,
        item: row.item_name,
        city: row.district ? `${row.district}, ${row.city}` : row.city,
        raw_city: row.city,
        raw_district: row.district,
        count: row.data_count,
        avg_price: row.average_price,
        last_price: row.max_price,
        category: row.category
      }))
      setPricesData(mappedData)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // ─── Computed Stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalUsers = profiles.length
    const totalSalaryVolume = profiles.reduce((acc, p) => acc + (p.salary || 0), 0)
    const avgSalary = totalUsers > 0 ? totalSalaryVolume / totalUsers : 0
    const citiesWithUsers = cityData.length
    return { totalUsers, totalSalaryVolume, avgSalary, citiesWithUsers }
  }, [profiles, cityData])

  const calculateAvg = (arr: any) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0
    return Math.round(arr.reduce((a: number, b: any) => a + (b || 0), 0) / arr.length)
  }

  const filteredPrices = useMemo(() =>
    pricesData.filter(p =>
      p.item?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
    ), [pricesData, search])

  const filteredCityData = useMemo(() =>
    cityData.filter(c => {
      const matchesSearch = c.city?.toLowerCase().includes(search.toLowerCase())
      const matchesCity = filterCity ? c.il === filterCity : true
      let matchesDistrict = true
      if (filterDistrict) {
        const expectedKey = `${filterDistrict}, ${filterCity}`
        matchesDistrict = c.city === expectedKey
      }
      return matchesSearch && matchesCity && matchesDistrict
    }), [cityData, search, filterCity, filterDistrict])

  const chartData = useMemo(() =>
    cityData
      .sort((a, b) => b.user_count - a.user_count)
      .slice(0, 10)
      .map(c => ({ name: c.city, users: c.user_count }))
    , [cityData])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveModal = async () => {
    if (editModal.mode === 'BULK') return

    const { item, city, district, category, price } = editModal.data || {}
    if (!item || !city || !price) {
      alert('Lütfen tüm alanları doldurun (Ürün, Şehir, Fiyat).')
      return
    }

    setLoading(true)

    if (editModal.mode === 'ADD') {
      const { error } = await adminService.addCommunityPrice(
        category || 'other',
        item,
        price,
        city,
        district || undefined
      )
      if (error) alert('Ekleme başarısız: ' + JSON.stringify(error))
    } else {
      const analyticKey = district ? `${district}, ${city}` : city
      const { error } = await adminService.adminUpdatePrice(analyticKey, category || 'other', item, price)
      if (error) alert('Güncelleme başarısız: ' + JSON.stringify(error))
    }

    setEditModal({ open: false, mode: 'ADD' })
    await fetchData()
  }

  const handleToggleLeader = async (userId: string, currentStatus: boolean, city: string, district?: string) => {
    const newStatus = !currentStatus
    const region = district ? `${district}, ${city}` : city

    setLoading(true)
    const { error } = await adminService.updateLeaderStatus(userId, newStatus, newStatus ? region : undefined)

    if (error) {
      alert('Liderlik durumu güncellenemedi: ' + JSON.stringify(error))
    } else {
      await fetchData()
    }
    setLoading(false)
  }

  const handleDeleteItem = async (target: any) => {
    if (confirm(`${target.city} için ${target.item} kaydını silmek istediğinize emin misiniz?`)) {
      setLoading(true)
      await adminService.adminDeleteItem(target.city, target.category, target.item)
      await fetchData()
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <div className="p-6 pt-8 bg-white border-b border-indigo-100 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-800">
              Sistem<span className="text-indigo-600">Yönetimi</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Canlı Veritabanı Erişimi</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className={`p-3 bg-slate-100 rounded-2xl text-indigo-500 hover:bg-indigo-50 transition-colors ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-6 bg-white border-b border-slate-100 overflow-x-auto">
        {[
          { id: 'STATS', label: 'GENEL BAKIŞ', icon: Activity },
          { id: 'USERS', label: 'KULLANICILAR', icon: Users },
          { id: 'CITIES', label: 'ŞEHİR ANALİZİ', icon: Globe },
          { id: 'PRICES', label: 'TOPLULUK FİYATLARI', icon: Tag }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setSearch('') }}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black tracking-widest transition-all relative shrink-0 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">

        {/* ── STATS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'STATS' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<Users />} label="TOPLAM KULLANICI" value={stats.totalUsers} color="text-blue-400" />
              <StatCard icon={<Building2 />} label="AKTİF ŞEHİR" value={stats.citiesWithUsers} color="text-emerald-400" />
              <StatCard icon={<Wallet />} label="AYLIK PARA HACMİ" value={`${(stats.totalSalaryVolume / 1000000).toFixed(1)}M ₺`} color="text-indigo-400" />
              <StatCard icon={<ShoppingCart />} label="TOPLULUK FİYATI" value={pricesData.length} color="text-amber-400" />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                ŞEHİR BAZLI KULLANICI DAĞILIMI (TOP 10)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#4f46e5' }}
                    />
                    <Bar dataKey="users" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                placeholder="Kullanıcı, Şehir veya Meslek Ara..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {profiles
                .filter(p =>
                  p.name?.toLowerCase().includes(search.toLowerCase()) ||
                  p.city?.toLowerCase().includes(search.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className={`bg-white p-5 rounded-[28px] border-2 flex items-center justify-between group hover:bg-slate-50 transition-all shadow-sm ${user.is_leader ? 'border-purple-200' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-xs ${user.is_leader ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                          {user.name?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        {user.is_leader && (
                          <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white p-1 rounded-full shadow-lg border-2 border-white">
                            <Crown size={10} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-slate-800 font-black text-base flex items-center gap-2">
                          {user.name}
                          {user.is_leader && (
                            <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black shadow-sm shadow-purple-200">
                              LİDER
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {user.job} • {user.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-base font-black text-slate-800 font-mono">
                          {user.salary?.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">
                          {user.plan} PLAN
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-6 border-l border-slate-100">
                        <button
                          onClick={() => setSelectedExpenseUser(user)}
                          className="px-3 py-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                        >
                          <BarChart3 size={14} /> DETAY
                        </button>
                        {user.is_leader ? (
                          <button
                            onClick={() => handleToggleLeader(user.id, true, user.city, user.district)}
                            className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                          >
                            <ShieldAlert size={14} /> LİDERLİĞİ BİTİR
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleLeader(user.id, false, user.city, user.district)}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl border border-purple-500 hover:bg-purple-700 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-200"
                          >
                            <Crown size={14} /> LİDER YAP
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {profiles.filter(p =>
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.city?.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && (
                  <div className="text-center py-20 opacity-20">
                    <Users size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-bold">Kullanıcı bulunamadı.</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── CITIES TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'CITIES' && (
          <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <div className="mb-2 text-[10px] uppercase font-bold text-indigo-400">
                  Veritabanı: {cityData.length} Kayıt (Görüntülenen: {filteredCityData.length})
                </div>
                <Search className="absolute left-4 top-[calc(50%+10px)] -translate-y-1/2 text-gray-600" size={18} />
                <input
                  type="text"
                  placeholder="Şehir Ara..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="relative w-full md:w-48">
                <select
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 appearance-none text-sm shadow-sm"
                  value={filterCity}
                  onChange={e => {
                    setFilterCity(e.target.value)
                    setFilterDistrict('')
                    setVisibleCities(20)
                  }}
                >
                  <option value="">Tüm İller</option>
                  {ALL_TURKISH_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 rotate-90" size={14} />
              </div>

              <div className="relative w-full md:w-48">
                <select
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 appearance-none text-sm disabled:opacity-50 shadow-sm"
                  value={filterDistrict}
                  onChange={e => {
                    setFilterDistrict(e.target.value)
                    setVisibleCities(20)
                  }}
                  disabled={!filterCity || !METRO_DISTRICTS[filterCity]}
                >
                  <option value="">Tüm İlçeler</option>
                  {filterCity && METRO_DISTRICTS[filterCity]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 rotate-90" size={14} />
              </div>
            </div>

            {filteredCityData.slice(0, visibleCities).map(city => (
              <div key={city.city} className="bg-white p-6 rounded-[32px] border border-slate-200 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-500 shadow-sm">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{city.city}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Harcama Matrisi</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/20 text-[10px] font-black text-indigo-400">
                      {city.user_count} KATILIMCI
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[8px] text-gray-600 font-bold uppercase">
                      <Clock size={10} /> {new Date(city.updated_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(CATEGORY_LABELS).map(key => {
                    const avg = calculateAvg(city[key])
                    return (
                      <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 group hover:bg-white transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white text-indigo-500 group-hover:scale-110 transition-transform shadow-sm">
                            {getCategoryIcon(key)}
                          </div>
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter truncate">
                            {CATEGORY_LABELS[key]}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <div className="text-sm font-black text-slate-800 font-mono">{avg.toLocaleString('tr-TR')}</div>
                          <span className="text-[9px] text-slate-500 font-bold">₺</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: (CATEGORY_COLORS as any)[key] || '#94a3b8',
                              width: `${Math.min(100, (avg / 25000) * 100)}%`,
                              opacity: 0.8
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredCityData.length > visibleCities && (
              <button
                onClick={() => setVisibleCities(prev => prev + 20)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Daha Fazla Göster ({filteredCityData.length - visibleCities} Kalan)
              </button>
            )}

            {filteredCityData.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <Globe size={64} className="mx-auto mb-4" />
                <p className="text-sm font-bold">Henüz analitik veri toplanmış bir şehir bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PRICES TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'PRICES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Ürün Yönetimi</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fiyat veritabanını düzenleyin</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditModal({ open: true, mode: 'BULK' })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Database size={16} /> Toplu Ekle
                </button>
                <button
                  onClick={() => setEditModal({ open: true, mode: 'ADD' })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={16} /> Yeni Ekle
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-[24px] mb-6 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Ürün veya Şehirde Ara..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 transition-all text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-slate-800 font-bold text-xs focus:outline-none appearance-none min-w-[200px]"
                  value={selectedCityFilter}
                  onChange={e => setSelectedCityFilter(e.target.value)}
                >
                  <option value="ALL">Tüm Şehirler</option>
                  {Array.from(new Set(pricesData.map(p => p.city))).sort().map(city => (
                    <option key={city as string} value={city as string}>{city as string}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 rotate-90" size={14} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="col-span-4">Ürün / Lokasyon</div>
                <div className="col-span-2 text-right">Ortalama</div>
                <div className="col-span-2 text-right">Son Fiyat</div>
                <div className="col-span-2 text-right">Veri Sayısı</div>
                <div className="col-span-2 text-right">İşlem</div>
              </div>

              {filteredPrices
                .filter(p => selectedCityFilter === 'ALL' || p.city === selectedCityFilter)
                .map((price, i) => (
                  <div key={i} className="bg-white p-4 rounded-[20px] border border-slate-200 grid grid-cols-12 gap-4 items-center group hover:bg-slate-50 transition-all shadow-sm">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <ShoppingCart size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-800 font-bold text-sm truncate" title={price.item}>{price.item}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{price.city}</p>
                        <span className="text-[8px] text-slate-500 font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                          {CATEGORY_LABELS[price.category] || price.category}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono text-emerald-600 font-bold">
                      {Math.round(price.avg_price).toLocaleString('tr-TR')} ₺
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-400 text-xs">{price.last_price} ₺</div>
                    <div className="col-span-2 text-right">
                      <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">{price.count}</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditModal({ open: true, mode: 'EDIT', data: price })}
                        className="p-2 hover:bg-slate-100 rounded-lg text-indigo-500 transition-colors"
                        title="Düzenle"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(price)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

              {filteredPrices.length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <Database size={48} className="mx-auto mb-4" />
                  <p className="text-sm font-bold">Herhangi bir fiyat verisi bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit/Bulk Modal ────────────────────────────────────────────── */}
      {editModal.open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] border border-slate-200 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModal({ open: false, mode: 'ADD' })}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6">
              {editModal.mode === 'ADD' ? 'Yeni Fiyat Ekle' : editModal.mode === 'EDIT' ? 'Fiyatı Düzenle' : 'Toplu Veri Yükle'}
            </h3>

            {editModal.mode === 'BULK' ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-600 leading-relaxed">
                  <p className="font-bold mb-2">FORMAT TALİMATI:</p>
                  <code className="block bg-white p-2 rounded text-indigo-500 font-mono mb-2 border border-indigo-100">
                    &lt;&lt;&lt;İl---İlçe---Kategori---Ürün---Fiyat&gt;&gt;&gt;
                  </code>
                  <p>Örnek:</p>
                  <p className="font-mono text-slate-500 opacity-80">&lt;&lt;&lt;İstanbul---Kadıköy---Gıda---Ekmek---15&gt;&gt;&gt;</p>
                  <p className="font-mono text-slate-500 opacity-80">&lt;&lt;&lt;Ankara---Çankaya---Ulaşım---Taksi---100&gt;&gt;&gt;</p>
                </div>
                <textarea
                  className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs focus:border-indigo-500 outline-none resize-none"
                  placeholder="Verileri buraya yapıştırın..."
                  value={editModal.data?.bulkText || ''}
                  onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, bulkText: e.target.value } })}
                />
                <button
                  onClick={async () => {
                    const text = editModal.data?.bulkText || ''
                    const lines = text.split('\n')
                    setLoading(true)
                    let processed = 0

                    for (const line of lines) {
                      const match = line.match(/<<<(.+?)---(.+?)---(.+?)---(.+?)---(.+?)>>>/)
                      if (match) {
                        const [_, city, district, catRaw, item, priceStr] = match
                        let dbCat: any = 'other'
                        const c = catRaw.trim().toLowerCase()
                        if (c.includes('gıda') || c.includes('market') || c.includes('yiyecek')) dbCat = 'food_non_alcoholic'
                        else if (c.includes('alkol') || c.includes('tütün') || c.includes('sigara')) dbCat = 'tobacco_alcohol'
                        else if (c.includes('fatura') || c.includes('ulaşım') || c.includes('kira') || c.includes('yakıt')) dbCat = 'bills'
                        const analyticKey = `${district.trim()}, ${city.trim()}`
                        await adminService.addCommunityPrice(dbCat, item.trim(), Number(priceStr.trim()), analyticKey)
                        processed++
                      }
                    }

                    alert(`${processed} kayıt başarıyla işlendi.`)
                    setEditModal({ open: false, mode: 'ADD' })
                    await fetchData()
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-white text-sm uppercase tracking-widest mt-4 shadow-lg shadow-emerald-500/20"
                >
                  YÜKLE VE İŞLE
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Ürün Adı</label>
                  <input
                    type="text"
                    disabled={editModal.mode === 'EDIT'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-indigo-500 outline-none disabled:opacity-60"
                    value={editModal.data?.item || ''}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, item: e.target.value } })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Şehir</label>
                    {editModal.mode === 'ADD' ? (
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-indigo-500 outline-none text-xs"
                        value={editModal.data?.city || ''}
                        onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, city: e.target.value, district: '' } })}
                      >
                        <option value="">Seçiniz</option>
                        {ALL_TURKISH_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={editModal.data?.city ? editModal.data.city.split(',').pop()?.trim() : ''}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400 font-bold text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">İlçe</label>
                    {editModal.mode === 'ADD' ? (
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-indigo-500 outline-none text-xs"
                        value={editModal.data?.district || ''}
                        disabled={!editModal.data?.city || !METRO_DISTRICTS[editModal.data.city]}
                        onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, district: e.target.value } })}
                      >
                        <option value="">{METRO_DISTRICTS[editModal.data?.city] ? 'Seçiniz' : '-'}</option>
                        {editModal.data?.city && METRO_DISTRICTS[editModal.data.city]?.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={editModal.data?.city && editModal.data.city.includes(',') ? editModal.data.city.split(',')[0].trim() : '-'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400 font-bold text-xs"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kategori</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-indigo-500 outline-none text-xs"
                    value={editModal.data?.category || 'other'}
                    disabled={editModal.mode === 'EDIT'}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, category: e.target.value } })}
                  >
                    <option value="food_non_alcoholic">Gıda & Market</option>
                    <option value="tobacco_alcohol">Alkol & Tütün</option>
                    <option value="bills">Faturalar & Ulaşım</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div className="mt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fiyat (TL)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-indigo-500 outline-none"
                    value={editModal.data?.price || ''}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, price: Number(e.target.value) } })}
                  />
                  {editModal.mode === 'EDIT' && (
                    <p className="text-[9px] text-indigo-400 mt-2 font-bold px-1">
                      <Info size={10} className="inline mr-1" />
                      Bu işlem mevcut fiyat dizisini siler ve tek bir sabit fiyat atar (Admin Override).
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSaveModal}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-white text-sm uppercase tracking-widest mt-4 shadow-lg shadow-indigo-500/20"
                >
                  {editModal.mode === 'ADD' ? 'EKLE' : 'GÜNCELLE'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Expense Detail Modal ───────────────────────────────────────────── */}
      {selectedExpenseUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] border border-slate-200 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedExpenseUser(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600">
                {selectedExpenseUser.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedExpenseUser.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {selectedExpenseUser.job} • {selectedExpenseUser.city}
                </p>
              </div>
            </div>

            <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Net Maaş</span>
                <span className="text-sm font-black text-slate-800 font-mono">
                  {selectedExpenseUser.salary?.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tahmini Harcama</span>
                <span className="text-sm font-black text-rose-600 font-mono">
                  {Object.entries(selectedExpenseUser.expenditures_object || {})
                    .filter(([k]) => k !== 'savings')
                    .reduce((acc, [, val]) => acc + (Number(val) || 0), 0)
                    .toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sistem Harcama Matrisi</h4>
              {Object.entries(selectedExpenseUser.expenditures_object || {})
                .filter(([k]) => k !== 'savings' && k !== 'family_size' && k !== 'OTHER')
                .map(([k, v]) => {
                  const val = Number(v) || 0
                  if (val <= 0) return null
                  return (
                    <div key={k} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all shadow-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{
                            backgroundColor: (CATEGORY_COLORS as any)[k] ? `${(CATEGORY_COLORS as any)[k]}20` : '#f1f5f9',
                            color: (CATEGORY_COLORS as any)[k] || '#64748b'
                          }}
                        >
                          {getCategoryIcon(k)}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          {(CATEGORY_LABELS as any)[k] || k}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-800">
                        {val.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  )
                })}
              <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 rounded-xl mt-4 shadow-sm">
                <span className="text-[11px] font-black text-emerald-600 uppercase flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Tasarruf & Birikim Skoru
                </span>
                <span className="font-mono text-sm font-black text-emerald-600">
                  {(Number(selectedExpenseUser.expenditures_object?.savings) || 0).toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-center gap-2 shrink-0">
        <ShieldCheck className="text-indigo-500" size={14} />
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Süpervizör Paneli v5.0.0</p>
      </div>
    </div>
  )
}
