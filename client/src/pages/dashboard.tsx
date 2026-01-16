import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Folder,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardData {
  summary: {
    totalReceivables: { totalUnpaid: number; current: number; overdue: number };
    totalPayables: { totalUnpaid: number; current: number; overdue: number };
    cashOnHand: number;
    bankBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  cashFlow: Array<{ month: string; value: number; incoming: number; outgoing: number }>;
  incomeExpense: Array<{ month: string; income: number; expense: number }>;
  topExpenses: Array<{ category: string; amount: number; percentage: number }>;
  projects: Array<{ id: string; name: string; client: string; progress: number; budget: number; spent: number }>;
  bankAccounts: Array<{ id: string; name: string; balance: number; type: string }>;
  accountWatchlist: Array<{ id: string; name: string; balance: number; change: number }>;
}

const EXPENSE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomeExpenseMode, setIncomeExpenseMode] = useState<"accrual" | "cash">("accrual");
  const [fiscalYear] = useState("This Fiscal Year");

  const { data: dashboardResponse, isLoading } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['/api/dashboard'],
  });

  const dashboard = dashboardResponse?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalIncoming = dashboard?.cashFlow?.reduce((sum, item) => sum + (item.incoming || 0), 0) || 0;
  const totalOutgoing = dashboard?.cashFlow?.reduce((sum, item) => sum + (item.outgoing || 0), 0) || 0;
  const totalIncome = dashboard?.incomeExpense?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
  const totalExpenseAmount = dashboard?.incomeExpense?.reduce((sum, item) => sum + (item.expense || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
          <span className="text-slate-500 dark:text-slate-300 text-lg font-medium">AD</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-greeting">Hello, Admin</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-company">Billing Accounting</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-dashboard"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="getting-started"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-getting-started"
          >
            Getting Started
          </TabsTrigger>
          <TabsTrigger
            value="recent-updates"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-recent-updates"
          >
            Recent Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-lg font-semibold">Total Receivables</CardTitle>
                <Link href="/invoices/new">
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1">
                    <Plus className="h-4 w-4" /> New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Unpaid Invoices <span className="font-medium">{formatCurrency(dashboard?.summary?.totalReceivables?.totalUnpaid || 0)}</span>
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${((dashboard?.summary?.totalReceivables?.current || 0) / (dashboard?.summary?.totalReceivables?.totalUnpaid || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Current</p>
                    <p className="text-xl font-semibold mt-1" data-testid="value-receivables-current">
                      {formatCurrency(dashboard?.summary?.totalReceivables?.current || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide">Overdue</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-xl font-semibold" data-testid="value-receivables-overdue">
                        {formatCurrency(dashboard?.summary?.totalReceivables?.overdue || 0)}
                      </p>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-lg font-semibold">Total Payables</CardTitle>
                <Link href="/bills">
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1">
                    <Plus className="h-4 w-4" /> New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Unpaid Bills <span className="font-medium">{formatCurrency(dashboard?.summary?.totalPayables?.totalUnpaid || 0)}</span>
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${((dashboard?.summary?.totalPayables?.current || 0) / (dashboard?.summary?.totalPayables?.totalUnpaid || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Current</p>
                    <p className="text-xl font-semibold mt-1" data-testid="value-payables-current">
                      {formatCurrency(dashboard?.summary?.totalPayables?.current || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide">Overdue</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-xl font-semibold" data-testid="value-payables-overdue">
                        {formatCurrency(dashboard?.summary?.totalPayables?.overdue || 0)}
                      </p>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Cash Flow</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1">
                    {fiscalYear} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>This Fiscal Year</DropdownMenuItem>
                  <DropdownMenuItem>Last Fiscal Year</DropdownMenuItem>
                  <DropdownMenuItem>This Quarter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.cashFlow || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => value.split(' ')[0]}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#eef2ff"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cash as on 01/04/2025</p>
                    <p className="text-2xl font-semibold" data-testid="value-cash-start">
                      {formatCurrency(dashboard?.summary?.cashOnHand || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-teal-600">Incoming</p>
                    <p className="text-xl font-semibold text-teal-600 flex items-center justify-end gap-1" data-testid="value-incoming">
                      {formatCurrency(totalIncoming)} <TrendingUp className="h-4 w-4" />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-500">Outgoing</p>
                    <p className="text-xl font-semibold text-red-500 flex items-center justify-end gap-1" data-testid="value-outgoing">
                      {formatCurrency(totalOutgoing)} <TrendingDown className="h-4 w-4" />
                    </p>
                  </div>
                  <div className="text-right pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Cash as on 31/03/2026</p>
                    <p className="text-xl font-semibold" data-testid="value-cash-end">
                      {formatCurrency((dashboard?.summary?.cashOnHand || 0) + totalIncoming - totalOutgoing)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Income and Expense</CardTitle>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1">
                        {fiscalYear} <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>This Fiscal Year</DropdownMenuItem>
                      <DropdownMenuItem>Last Fiscal Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <div className="inline-flex rounded-md border overflow-hidden">
                    <button
                      onClick={() => setIncomeExpenseMode("accrual")}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${incomeExpenseMode === "accrual"
                          ? "bg-muted"
                          : "bg-background hover:bg-muted/50"
                        }`}
                      data-testid="button-accrual"
                    >
                      Accrual
                    </button>
                    <button
                      onClick={() => setIncomeExpenseMode("cash")}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${incomeExpenseMode === "cash"
                          ? "bg-muted"
                          : "bg-background hover:bg-muted/50"
                        }`}
                      data-testid="button-cash"
                    >
                      Cash
                    </button>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.incomeExpense || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => value.split(' ')[0]}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 pt-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-green-500 rounded" />
                    <span className="text-sm text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500 rounded" />
                    <span className="text-sm text-muted-foreground">Expense</span>
                  </div>
                  <div className="ml-auto flex items-center gap-6 text-sm flex-wrap">
                    <div>
                      <span className="text-green-600 font-medium">Total Income</span>
                      <span className="ml-2 font-semibold" data-testid="value-total-income">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-red-500 font-medium">Total Expenses</span>
                      <span className="ml-2 font-semibold" data-testid="value-total-expense">{formatCurrency(totalExpenseAmount)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">* Income and expense values displayed are exclusive of taxes.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Top Expenses</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1">
                      {fiscalYear} <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>This Fiscal Year</DropdownMenuItem>
                    <DropdownMenuItem>Last Fiscal Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {dashboard?.topExpenses && dashboard.topExpenses.length > 0 ? (
                  <div className="flex gap-4">
                    <div className="w-40 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboard.topExpenses}
                            dataKey="percentage"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                          >
                            {dashboard.topExpenses.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
                      {dashboard.topExpenses.slice(0, 5).map((expense, index) => (
                        <div key={expense.category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                            />
                            <span className="truncate max-w-32">{expense.category}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No expenses recorded for this fiscal year</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.projects && dashboard.projects.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.projects.map((project) => (
                      <div key={project.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground">{project.client}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{project.progress}% Complete</span>
                          <span>{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    <Link href="/time-tracking" className="text-indigo-600 hover:text-indigo-700 text-sm hover:underline">
                      Add Project(s) to this watchlist
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Bank and Credit Cards</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.bankAccounts && dashboard.bankAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.bankAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{account.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                          </div>
                        </div>
                        <p className="font-semibold">{formatCurrency(account.balance)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Yet to add Bank and Credit Card details</p>
                    <Link href="/banking" className="text-indigo-600 hover:text-indigo-700 text-sm hover:underline">
                      Add Bank Account
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Account Watchlist</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
                    Accrual <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Accrual</DropdownMenuItem>
                  <DropdownMenuItem>Cash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {dashboard?.accountWatchlist && dashboard.accountWatchlist.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.accountWatchlist.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{account.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(account.balance)}</span>
                        <span className={`text-sm ${account.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {account.change >= 0 ? '+' : ''}{account.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">No accounts in watchlist</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center md:text-left">
                <h3 className="font-semibold mb-3">Account on the go!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download the Billing app for Android and iOS to manage your finances from anywhere, anytime!
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Smartphone className="h-4 w-4" />
                    Learn More
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">OTHER APPS</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-indigo-600 cursor-pointer">Ecommerce Software</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Expense Reporting</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Subscription Billing</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Inventory Management</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">HELP & SUPPORT</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-indigo-600 cursor-pointer">Contact Support</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Knowledge Base</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Help Documentation</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Webinar</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">QUICK LINKS</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-indigo-600 cursor-pointer">Getting Started</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Mobile apps</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Add-ons</li>
                  <li className="hover:text-indigo-600 cursor-pointer">What's New?</li>
                  <li className="hover:text-indigo-600 cursor-pointer">Developers API</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground">2025, Billing Accounting. All Rights Reserved.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="getting-started" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Getting Started Guide</h3>
              <p className="text-muted-foreground mb-6">Learn how to set up your accounting and start managing your business finances.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer">
                  <p className="font-medium">1. Add Customers</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your customer list</p>
                </div>
                <div className="p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer">
                  <p className="font-medium">2. Create Invoice</p>
                  <p className="text-sm text-muted-foreground mt-1">Send your first invoice</p>
                </div>
                <div className="p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer">
                  <p className="font-medium">3. Record Expense</p>
                  <p className="text-sm text-muted-foreground mt-1">Track your expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-updates" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Recent Updates</h3>
              <p className="text-muted-foreground">Stay updated with the latest features and improvements.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
