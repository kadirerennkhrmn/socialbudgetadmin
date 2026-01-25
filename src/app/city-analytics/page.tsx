
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

export default async function CityAnalyticsPage(props: {
    searchParams: Promise<{ q?: string }>
}) {
    const searchParams = await props.searchParams
    const query = supabase
        .from('city_analytic')
        .select('*')
        .order('updated_at', { ascending: false })

    if (searchParams.q) {
        query.ilike('city', `%${searchParams.q}%`)
    }

    const { data: cities } = await query

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">City Analytics</h2>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search cities..." />
                </div>
            </div>
            <div className="rounded-md border bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>City</TableHead>
                            <TableHead>Province</TableHead>
                            <TableHead>User Count</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cities?.map((city: any) => (
                            <TableRow key={city.idx}>
                                <TableCell className="font-medium">{city.city}</TableCell>
                                <TableCell>{city.il}</TableCell>
                                <TableCell>{city.user_count}</TableCell>
                                <TableCell>{city.updated_at ? format(new Date(city.updated_at), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {(!cities || cities.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No city data found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
