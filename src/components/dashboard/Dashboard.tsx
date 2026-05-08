import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query } from '../../lib/firebase';
import { Income, Expense } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { formatCurrency, cn } from '../../lib/utils';
import { startOfMonth, subMonths, format, isWithinInterval, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qIncome = query(collection(db, 'incomes'));
    const qExpense = query(collection(db, 'expenses'));

    const unsubIncome = onSnapshot(qIncome, (snapshot) => {
      setIncomes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income)));
    });

    const unsubExpense = onSnapshot(qExpense, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      setLoading(false);
    });

    return () => {
      unsubIncome();
      unsubExpense();
    };
  }, []);

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const profitLoss = totalIncome - totalExpense;

  // Monthly stats
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const thisMonthIncome = incomes
    .filter(i => isWithinInterval(new Date(i.date), { start: currentMonthStart, end: currentMonthEnd }))
    .reduce((sum, i) => sum + i.amount, 0);

  const thisMonthExpense = expenses
    .filter(e => isWithinInterval(new Date(e.date), { start: currentMonthStart, end: currentMonthEnd }))
    .reduce((sum, e) => sum + e.amount, 0);

  // Prepare chart data (last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthName = format(monthDate, 'MMM');

    const mIncome = incomes
      .filter(inc => isWithinInterval(new Date(inc.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, inc) => sum + inc.amount, 0);

    const mExpense = expenses
      .filter(exp => isWithinInterval(new Date(exp.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      name: monthName,
      income: mIncome,
      expense: mExpense,
      profit: mIncome - mExpense
    };
  });

  if (loading) {
    return <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">Financial Overview</h1>
          <p className="text-stone-500 font-medium mt-2">Real-time tracking of hotel performance metrics.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Income" 
          value={totalIncome} 
          icon={TrendingUp} 
          trend="+12%" 
          color="indigo" 
        />
        <StatCard 
          title="Total Expenses" 
          value={totalExpense} 
          icon={TrendingDown} 
          trend="+5%" 
          color="red" 
        />
        <StatCard 
          title="Profit/Loss" 
          value={profitLoss} 
          icon={IndianRupee} 
          trend="+18%" 
          color={profitLoss >= 0 ? 'emerald' : 'rose'} 
        />
        <StatCard 
          title="This Month" 
          value={thisMonthIncome - thisMonthExpense} 
          icon={Wallet} 
          color="cyan" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <div className="rounded-sm border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2 font-serif">Income vs Expenses</h3>
            <div className="flex items-center gap-5 text-[11px] font-bold uppercase tracking-widest text-stone-500">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-stone-900"></span> Income</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-800"></span> Expense</span>
            </div>
          </div>
          <div className="h-80 w-full min-w-[0]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4', opacity: 0.5 }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 500, color: '#1c1917' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Bar dataKey="income" fill="#1c1917" radius={[2, 2, 0, 0]} barSize={24} />
                <Bar dataKey="expense" fill="#991b1b" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="rounded-sm border border-stone-200 bg-white p-8 shadow-sm">
          <h3 className="mb-8 text-lg font-bold text-stone-900 flex items-center gap-2 font-serif">Profit Trend</h3>
          <div className="h-80 w-full min-w-[0]">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 500, color: '#1c1917' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Area type="monotone" dataKey="profit" stroke="#059669" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-sm border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-bottom border-stone-100 bg-stone-50/50">
          <h3 className="text-xl font-bold text-stone-900 font-serif">Mission Control: Recent Transactions</h3>
          <p className="text-sm font-medium text-stone-500 mt-1 uppercase tracking-wider">Live raw data feed from historical logs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
                <th className="px-8 py-4">ID</th>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Origin / Category</th>
                <th className="px-8 py-4 text-right">Magnitude</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...incomes, ...expenses]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((item, idx) => {
                  const isIncome = 'source' in item;
                  return (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-900 hover:text-white transition-all cursor-crosshair group">
                      <td className="px-8 py-5 font-mono text-[11px] opacity-40">0{idx + 1}</td>
                      <td className="px-8 py-5 text-sm font-medium">
                        {format(new Date(item.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-tight">
                            {isIncome ? (item as Income).source : (item as Expense).category}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-80 font-bold mt-1">
                            {isIncome ? "Inward Remittance" : "Outward Disbursement"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold">
                        <span className={cn(isIncome ? "text-emerald-700 group-hover:text-emerald-400" : "text-red-800 group-hover:text-red-400")}>
                          {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isIncome ? "bg-emerald-500" : "bg-red-500")} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Verified</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Total processed entries: {[...incomes, ...expenses].length}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colors = {
    indigo: "bg-stone-900 text-stone-50 border border-stone-800 shadow-sm",
    red: "bg-white text-stone-900 border border-stone-200 shadow-sm",
    emerald: "bg-white text-stone-900 border border-stone-200 shadow-sm",
    cyan: "bg-white text-stone-900 border border-stone-200 shadow-sm",
    rose: "bg-white text-stone-900 border border-stone-200 shadow-sm"
  };

  const iconColors = {
    indigo: "text-stone-300",
    red: "text-red-800",
    emerald: "text-emerald-700",
    cyan: "text-cyan-700",
    rose: "text-rose-800"
  };

  return (
    <div className={cn("group rounded-sm p-6 transition-all hover:-translate-y-1 relative overflow-hidden", colors[color as keyof typeof colors])}>
      <div className="flex items-start justify-between relative z-10">
        <div className={cn("p-1", iconColors[color as keyof typeof iconColors])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-1 border rounded-sm",
            color === 'indigo' ? "text-stone-200 border-stone-700 bg-stone-800/50" :
            trend.startsWith('+') ? "text-emerald-700 border-emerald-200 bg-emerald-50/50" : "text-red-800 border-red-200 bg-red-50/50"
          )}>
            {trend.startsWith('+') ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-8 relative z-10">
        <p className={cn("text-xs uppercase tracking-widest font-semibold", color === 'indigo' ? "text-stone-400" : "text-stone-500")}>{title}</p>
        <p className="mt-2 text-[1.75rem] font-bold font-serif">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
