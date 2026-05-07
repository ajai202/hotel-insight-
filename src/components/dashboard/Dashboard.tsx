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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 italic serif font-serif">Financial Overview</h1>
          <p className="text-gray-500">Real-time tracking of hotel performance metrics.</p>
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
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 underline underline-offset-8 decoration-gray-200">Income vs Expenses</h3>
            <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Expense</span>
            </div>
          </div>
          <div className="h-80 w-full min-w-[0]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Bar dataKey="income" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-900 underline underline-offset-8 decoration-gray-200">Profit Trend</h3>
          <div className="h-80 w-full min-w-[0]">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-3 border", colors[color as keyof typeof colors])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend.startsWith('+') ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
          )}>
            {trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
