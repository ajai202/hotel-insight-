import { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../../lib/firebase';
import { Income, Expense } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatCurrency, cn } from '../../lib/utils';
import { BrainCircuit, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

export default function PredictionView() {
  const [data, setData] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const incomeSnap = await getDocs(collection(db, 'incomes'));
      const expenseSnap = await getDocs(collection(db, 'expenses'));
      
      const incomes = incomeSnap.docs.map(doc => doc.data() as Income);
      const expenses = expenseSnap.docs.map(doc => doc.data() as Expense);

      const now = new Date();
      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(now, 5 - i);
        return {
          date: d,
          name: format(d, 'MMM yyyy'),
          index: i
        };
      });

      const aggregated = months.map(m => {
        const mStart = startOfMonth(m.date);
        const mEnd = endOfMonth(m.date);
        
        const mIncome = incomes
          .filter(inc => isWithinInterval(new Date(inc.date), { start: mStart, end: mEnd }))
          .reduce((sum, inc) => sum + inc.amount, 0);
          
        const mExpense = expenses
          .filter(exp => isWithinInterval(new Date(exp.date), { start: mStart, end: mEnd }))
          .reduce((sum, exp) => sum + exp.amount, 0);

        return {
          name: m.name,
          income: mIncome,
          expense: mExpense,
          profit: mIncome - mExpense,
          x: m.index
        };
      });

      setData(aggregated);
      
      // Call prediction API for Income
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: aggregated.map(d => ({ x: d.x, y: d.income })) })
        });
        const incomePredict = await response.json();

        // Call prediction API for Expenses
        const expResponse = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: aggregated.map(d => ({ x: d.x, y: d.expense })) })
        });
        const expensePredict = await expResponse.json();

        setPrediction({
          nextMonth: format(subMonths(now, -1), 'MMMM yyyy'),
          income: incomePredict.predicted_y,
          expense: expensePredict.predicted_y,
          profit: incomePredict.predicted_y - expensePredict.predicted_y
        });
      } catch (err) {
        console.error("Prediction error", err);
      }
      
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="flex h-96 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100">
          <BrainCircuit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-serif italic">AI Financial Prediction</h1>
          <p className="text-gray-500">ML-powered forecasting based on your historical hotel data.</p>
        </div>
      </header>

      {prediction && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PredictionCard 
            title="Predicted Income" 
            value={prediction.income} 
            subtitle={`Forecast for ${prediction.nextMonth}`}
            color="indigo"
          />
          <PredictionCard 
            title="Predicted Expenses" 
            value={prediction.expense} 
            subtitle="Based on spending trends"
            color="rose"
          />
          <PredictionCard 
            title="Net Expected Profit" 
            value={prediction.profit} 
            subtitle="Projected bottom line"
            color="emerald"
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Historical Trend Analysis</h3>
            <p className="text-sm text-gray-500">Tracking the last 6 months of financial behavior.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
            <Sparkles className="h-3 w-3" />
            LINEAR REGRESSION MODEL ACTIVE
          </div>
        </div>

        <div className="w-full min-w-[0] min-h-[400px] h-[400px]">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="income" stroke="#6366F1" strokeWidth={4} dot={{ r: 6, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={4} dot={{ r: 6, fill: '#F43F5E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-900 p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <AlertCircle className="h-6 w-6 text-indigo-400" />
          <h4 className="text-lg font-bold">Understanding the Forecast</h4>
        </div>
        <p className="text-gray-400 leading-relaxed text-sm">
          Our prediction module utilizes a <strong>Linear Regression algorithm</strong> to analyze patterns in your income and spending. 
          By calculating the "line of best fit" through your historical data points, the system can estimate future performance. 
          Note that these results are mathematical projections and may not account for seasonal spikes, market fluctuations, or sudden administrative changes.
        </p>
      </div>
    </div>
  );
}

function PredictionCard({ title, value, subtitle, color }: any) {
  const colors = {
    indigo: "from-indigo-600 to-indigo-700 shadow-indigo-100",
    rose: "from-rose-600 to-rose-700 shadow-rose-100",
    emerald: "from-emerald-600 to-emerald-700 shadow-emerald-100"
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6 text-white shadow-xl", colors[color as keyof typeof colors])}>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 uppercase tracking-widest">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{formatCurrency(value)}</p>
        <p className="mt-4 flex items-center gap-2 text-xs font-medium opacity-90">
          <TrendingUp className="h-3 w-3" />
          {subtitle}
        </p>
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}
