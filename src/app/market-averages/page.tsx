
import { supabase } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

export const revalidate = 0

import { Search } from "@/components/search"

export default async function MarketAveragesPage(props: {
    searchParams: Promise<{ q?: string }>
}) {
    const searchParams = await props.searchParams
    const query = supabase
        .from('market_averages')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(100)

    if (searchParams.q) {
        query.ilike('item_name', `%${searchParams.q}%`)
    }

    const { data: marketData } = await query

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Market Averages</h2>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search items..." />
                </div>
            </div>
            <div className="rounded-md border bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Average Price</TableHead>
                            <TableHead>Range (Min-Max)</TableHead>
                            <TableHead>City / District</TableHead>
                            <TableHead>Data Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {marketData?.map((item: any) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell className="capitalize">{item.category?.replace(/_/g, ' ')}</TableCell>
                                <TableCell>₺{parseFloat(item.average_price).toFixed(2)}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    ₺{item.min_price} - ₺{item.max_price}
                                </TableCell>
                                <TableCell>{item.city} / {item.district}</TableCell>
                                <TableCell>{item.data_count}</TableCell>
                            </TableRow>
                        ))}
                        {(!marketData || marketData.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No market data found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
