
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
import { Progress } from "@/components/ui/progress"

export const revalidate = 0

import { Search } from "@/components/search"

export default async function SavingGoalsPage(props: {
    searchParams: Promise<{ q?: string }>
}) {
    const searchParams = await props.searchParams
    const query = supabase
        .from('saving_goals')
        .select('*')
        .order('created_at', { ascending: false })

    if (searchParams.q) {
        query.ilike('title', `%${searchParams.q}%`)
    }

    const { data: goals } = await query

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Saving Goals</h2>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search goals..." />
                </div>
            </div>
            <div className="rounded-md border bg-card text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="w-[300px]">Progress</TableHead>
                            <TableHead>Monthly Contrib.</TableHead>
                            <TableHead>Deadline</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {goals?.map((goal: any) => {
                            const current = parseFloat(goal.current_amount)
                            const target = parseFloat(goal.target_amount)
                            const percentage = target > 0 ? (current / target) * 100 : 0

                            return (
                                <TableRow key={goal.id}>
                                    <TableCell className="font-medium">{goal.title}</TableCell>
                                    <TableCell className="capitalize">{goal.category}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={percentage} className="h-2" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {percentage.toFixed(0)}% (₺{current} / ₺{target})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>₺{goal.monthly_contribution}</TableCell>
                                    <TableCell>
                                        {goal.deadline
                                            ? format(new Date(goal.deadline), 'MMM d, yyyy')
                                            : <span className="text-muted-foreground italic">No deadline</span>
                                        }
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {(!goals || goals.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No goals found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
