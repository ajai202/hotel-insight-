import React, { useState, useRef } from 'react';
import { db, collection, getDocs } from '../../lib/firebase';
import { Income, Expense } from '../../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { FileText, Download, Calendar, Loader2, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '../../lib/utils';

export default function ReportGenerator() {
  const [month, setMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReportData = async () => {
    setIsGenerating(true);
    try {
      const incomeSnap = await getDocs(collection(db, 'incomes'));
      const expenseSnap = await getDocs(collection(db, 'expenses'));
      
      const targetDate = new Date(month + "-01");
      const mStart = startOfMonth(targetDate);
      const mEnd = endOfMonth(targetDate);

      const incomes = incomeSnap.docs
        .map(doc => doc.data() as Income)
        .filter(i => isWithinInterval(new Date(i.date), { start: mStart, end: mEnd }));
        
      const expenses = expenseSnap.docs
        .map(doc => doc.data() as Expense)
        .filter(e => isWithinInterval(new Date(e.date), { start: mStart, end: mEnd }));

      const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
      const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

      setReportData({
        monthName: format(targetDate, 'MMMM yyyy'),
        incomes,
        expenses,
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense
      });
    } catch (error) {
      console.error("Report generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Hotel_Report_${month}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-serif italic">Reports & Exports</h1>
        <p className="text-gray-500">Generate professional PDF financial statements for any month.</p>
      </header>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Select Month</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={fetchReportData}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate Report
            </button>
            
            {reportData && (
              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-900 px-8 py-3 text-sm font-bold text-gray-900 transition-all hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm"
          >
            <div className="overflow-x-auto w-full">
              <div 
                ref={reportRef} 
                className="mx-auto min-w-full sm:min-w-[700px] bg-white p-6 sm:p-12 text-gray-900"
              >
                <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-gray-900 pb-8 gap-6 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                      <Hotel className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 uppercase">Hotel Insight</h2>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-widest">Financial Performance Report</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 uppercase">Period</p>
                    <p className="text-xl sm:text-2xl font-black text-indigo-600">{reportData.monthName}</p>
                  </div>
                </div>

                <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Income</p>
                    <p className="text-xl sm:text-2xl font-black text-gray-900">{formatCurrency(reportData.totalIncome)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Expenses</p>
                    <p className="text-xl sm:text-2xl font-black text-gray-900">{formatCurrency(reportData.totalExpense)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-900 p-6 text-white">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Net Profit</p>
                    <p className="text-xl sm:text-2xl font-black">{formatCurrency(reportData.profit)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="overflow-x-auto">
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-indigo-600 border-l-4 border-indigo-600 pl-3">Income Breakdown</h3>
                    <table className="w-full text-left text-sm min-w-[300px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 font-bold">Source</th>
                          <th className="py-2 text-right font-bold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.incomes.map((i: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 text-gray-600">{i.source}</td>
                            <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(i.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="overflow-x-auto">
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-rose-600 border-l-4 border-rose-600 pl-3">Expense Breakdown</h3>
                    <table className="w-full text-left text-sm min-w-[300px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 font-bold">Category</th>
                          <th className="py-2 text-right font-bold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.expenses.map((e: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 text-gray-600">{e.category}</td>
                            <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-20 border-t border-gray-100 pt-8 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Generated automatically by Google AI Studio Hotel Insight System</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
