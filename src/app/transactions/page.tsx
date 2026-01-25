
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

export default async function TransactionsPage(props: {
    searchParams: Promise<{ q?: string }>
}) {
    const searchParams = await props.searchParams
    const query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // improved performance

    if (searchParams.q) {
        query.ilike('title', `%${searchParams.q}%`)
    }

    const { data: transactions } = await query

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search transactions..." />
                </div>
            </div>
            <div className="rounded-md border bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions?.map((tx: any) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-medium">{tx.title}</TableCell>
                                <TableCell className="capitalize">{tx.category.replace('_', ' ')}</TableCell>
                                <TableCell className="font-bold">₺{tx.amount}</TableCell>
                                <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                            </TableRow>
                        ))}
                        {(!transactions || transactions.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
