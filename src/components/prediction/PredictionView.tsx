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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-stone-900 shadow-sm border border-stone-800">
          <BrainCircuit className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">AI Financial Prediction</h1>
          <p className="text-stone-500 font-medium mt-1">ML-powered forecasting based on your historical hotel data.</p>
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

      <div className="rounded-sm border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900 font-serif">Historical Trend Analysis</h3>
            <p className="text-sm font-medium text-stone-500 mt-1">Tracking the last 6 months of financial behavior.</p>
          </div>
          <div className="flex items-center gap-2 rounded-sm bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs font-bold text-indigo-800 tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            LINEAR REGRESSION MODEL ACTIVE
          </div>
        </div>

        <div className="w-full min-w-[0] min-h-[400px] h-[400px]">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeWidth={1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 500, color: '#1c1917' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}/>
              <Line type="monotone" name="Income" dataKey="income" stroke="#1c1917" strokeWidth={3} dot={{ r: 5, fill: '#1c1917', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              <Line type="monotone" name="Expense" dataKey="expense" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#991b1b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-sm bg-stone-900 border border-stone-800 p-8 text-white shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <AlertCircle className="h-6 w-6 text-stone-400" />
          <h4 className="text-lg font-bold font-serif">Understanding the Forecast</h4>
        </div>
        <p className="text-stone-400 leading-relaxed text-[0.95rem]">
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
    indigo: "bg-white border border-stone-200 shadow-sm",
    rose: "bg-white border border-stone-200 shadow-sm",
    emerald: "bg-white border border-stone-200 shadow-sm"
  };

  const accentColors = {
    indigo: "text-stone-900",
    rose: "text-red-800",
    emerald: "text-emerald-700"
  };

  const subtitleColors = {
    indigo: "text-stone-500",
    rose: "text-red-500",
    emerald: "text-emerald-600"
  };

  return (
    <div className={cn("relative overflow-hidden rounded-sm p-8 transition-transform hover:-translate-y-1", colors[color as keyof typeof colors])}>
      <div className="relative z-10">
        <p className="text-[11px] uppercase tracking-widest font-bold text-stone-500">{title}</p>
        <p className={cn("mt-3 text-3xl font-bold font-serif", accentColors[color as keyof typeof accentColors])}>
          {value != null && !isNaN(value) ? formatCurrency(value) : "Calculating..."}
        </p>
        <p className={cn("mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider", subtitleColors[color as keyof typeof subtitleColors])}>
          <TrendingUp className="h-3.5 w-3.5" />
          {subtitle}
        </p>
      </div>
    </div>
  );
}
