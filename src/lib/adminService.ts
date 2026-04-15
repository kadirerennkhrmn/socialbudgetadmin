import { supabase } from './supabase'

export const adminService = {

  async getAllProfiles() {
    return await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  },

  async getAllCityAnalytics() {
    const { data, error } = await supabase.from('city_analytics').select('*').range(0, 999)
    return { data, error }
  },

  async getAllMarketAverages() {
    return await supabase.from('market_averages').select('*').order('last_updated', { ascending: false })
  },

  async updateLeaderStatus(userId: string, isLeader: boolean, region?: string) {
    return await supabase.from('profiles').update({
      is_leader: isLeader,
      leader_region: region ?? null
    }).eq('id', userId)
  },

  async addCommunityPrice(
    category: 'food_non_alcoholic' | 'tobacco_alcohol' | 'bills' | 'other',
    itemName: string,
    price: number,
    city: string,
    district?: string
  ) {
    // Update market_averages via RPC
    try {
      await supabase.rpc('update_market_average', {
        p_city: city,
        p_district: district || null,
        p_category: category,
        p_item_name: itemName,
        p_price: price
      })
    } catch (e) {
      console.warn('RPC error, falling back to community_prices', e)
    }

    // Also update community_prices (legacy)
    const analyticKey = district ? `${district}, ${city}` : city
    try {
      let { data: row } = await supabase
        .from('community_prices')
        .select('*')
        .eq('city', analyticKey)
        .maybeSingle()

      if (!row) {
        row = {
          city: analyticKey,
          il: city,
          district: district || null,
          food_non_alcoholic: [],
          tobacco_alcohol: [],
          bills: [],
          other: []
        }
      }

      const categoryArray: any[] = row[category] || []
      const existingIdx = categoryArray.findIndex((i: any) => i.name.toLowerCase() === itemName.toLowerCase())

      if (existingIdx >= 0) {
        categoryArray[existingIdx].prices.push(Number(price))
      } else {
        categoryArray.push({ name: itemName, prices: [Number(price)] })
      }

      const payload: any = {
        city: analyticKey,
        il: city,
        district: district || null,
        updated_at: new Date().toISOString(),
        food_non_alcoholic: category === 'food_non_alcoholic' ? categoryArray : (row.food_non_alcoholic || []),
        tobacco_alcohol: category === 'tobacco_alcohol' ? categoryArray : (row.tobacco_alcohol || []),
        bills: category === 'bills' ? categoryArray : (row.bills || []),
        other: category === 'other' ? categoryArray : (row.other || [])
      }

      const { error } = await supabase.from('community_prices').upsert(payload, { onConflict: 'city' })
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  },

  async adminUpdatePrice(city: string, category: string, itemName: string, newPrice: number) {
    try {
      const { data: row } = await supabase.from('community_prices').select('*').eq('city', city).maybeSingle()
      if (!row) return { error: 'Şehir kaydı bulunamadı' }

      const items = row[category] || []
      const idx = items.findIndex((i: any) => i.name === itemName)
      if (idx >= 0) {
        items[idx].prices = [Number(newPrice)]
      } else {
        items.push({ name: itemName, prices: [Number(newPrice)] })
      }
      return await supabase.from('community_prices').update({ [category]: items }).eq('city', city)
    } catch (err: any) {
      return { error: err }
    }
  },

  async adminDeleteItem(city: string, category: string, itemName: string) {
    try {
      const { data: row } = await supabase.from('community_prices').select('*').eq('city', city).maybeSingle()
      if (!row) return { error: 'Şehir kaydı bulunamadı' }

      let items = row[category] || []
      items = items.filter((i: any) => i.name !== itemName)
      return await supabase.from('community_prices').update({ [category]: items }).eq('city', city)
    } catch (err: any) {
      return { error: err }
    }
  }
}
