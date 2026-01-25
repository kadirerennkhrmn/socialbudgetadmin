import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/Overview"
import { supabase } from "@/lib/supabase"
import { CreditCard, Users, DollarSign, Activity } from "lucide-react"

async function getStats() {
  // Parallel fetching of counts
  const [
    { count: profilesCount },
    { count: transactionsCount },
    { data: recentTransactions }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(5)
  ])

  return {
    profilesCount: profilesCount || 0,
    transactionsCount: transactionsCount || 0,
    recentTransactions: recentTransactions || []
  }
}

export default async function DashboardPage() {
  const { profilesCount, transactionsCount, recentTransactions } = await getStats()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{profilesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{transactionsCount}</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Now
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{tx.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.category}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    +${tx.amount}
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent transactions found (or no connection)</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
