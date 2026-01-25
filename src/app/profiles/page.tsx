
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

export default async function ProfilesPage(props: {
    searchParams: Promise<{ q?: string }>
}) {
    const searchParams = await props.searchParams
    const query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (searchParams.q) {
        query.ilike('name', `%${searchParams.q}%`)
    }

    const { data: profiles } = await query

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Profiles</h2>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search profiles..." />
                </div>
            </div>
            <div className="rounded-md border bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((profile: any) => (
                            <TableRow key={profile.id}>
                                <TableCell className="font-medium">{profile.name}</TableCell>
                                <TableCell>{profile.city}</TableCell>
                                <TableCell>{profile.job}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.plan === 'PREMIUM'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        }`}>
                                        {profile.plan}
                                    </span>
                                </TableCell>
                                <TableCell>{format(new Date(profile.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                        ))}
                        {(!profiles || profiles.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No profiles found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
