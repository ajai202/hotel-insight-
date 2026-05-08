import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from '../../lib/firebase';
import { auth } from '../../lib/firebase';
import { Expense } from '../../types';
import { Plus, Search, Filter, Edit2, Trash2, X, Download, Upload, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: ''
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const promises = results.data.map(async (row: any) => {
            if (!row.amount) return;
            
            let dateStr = row.date;
            try {
              dateStr = new Date(row.date || new Date()).toISOString();
            } catch {
              dateStr = new Date().toISOString();
            }

            const payload = {
              date: dateStr,
              category: row.category || 'Other',
              amount: parseFloat(row.amount) || 0,
              description: row.description || '',
              createdBy: auth.currentUser!.uid
            };
            return addDoc(collection(db, 'expenses'), payload);
          });
          
          await Promise.all(promises);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error("Upload failed", error);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("Parse error", error);
        setIsUploading(false);
      }
    });
  };

  useEffect(() => {
    const q = query(collection(db, 'expenses'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdBy: auth.currentUser.uid
      };

      if (editingId) {
        await updateDoc(doc(db, 'expenses', editingId), payload);
      } else {
        await addDoc(collection(db, 'expenses'), payload);
      }

      resetForm();
    } catch (error) {
      console.error("Operation failed", error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id!);
    setFormData({
      date: expense.date.split('T')[0],
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'expenses', deletingId));
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      amount: '',
      description: ''
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) || 
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredExpenses.map(e => ({
      Date: formatDate(e.date),
      Category: e.category,
      Amount: e.amount,
      Description: e.description
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">Expense Records</h1>
          <p className="text-stone-500 font-medium mt-2">Monitor operational costs, salaries, and maintenance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-all hover:bg-stone-50 hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-all hover:bg-stone-50 hover:shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-sm bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search expense records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-stone-500 focus:ring-1 focus:ring-stone-500/10"
          />
        </div>
        <button className="flex items-center justify-center gap-2 rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-stone-50/50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-widest text-stone-500">
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Amount</th>
              <th className="px-6 py-5">Description</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="group transition-colors hover:bg-stone-50/50">
                <td className="px-6 py-5 text-sm font-medium text-stone-700">{formatDate(expense.date)}</td>
                <td className="px-6 py-5 text-sm">
                  <span className="inline-flex rounded-sm bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700 border border-stone-200">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-bold text-stone-900 tracking-tight font-serif text-[1rem]">{formatCurrency(expense.amount)}</td>
                <td className="px-6 py-5 text-sm font-medium text-stone-500 max-w-[200px] truncate">{expense.description}</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 text-stone-400 group-hover:text-stone-600">
                    <button onClick={() => handleEdit(expense)} className="rounded-sm p-2 hover:bg-white hover:text-stone-900 hover:shadow-sm border border-transparent hover:border-stone-200 transition-all">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(expense.id!)} className="rounded-sm p-2 hover:bg-red-50 hover:text-red-700 hover:shadow-sm border border-transparent hover:border-red-200 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-stone-400 font-medium tracking-wide">No expense records found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-sm bg-white p-6 md:p-8 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif text-stone-900">
                  {editingId ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button onClick={resetForm} className="rounded-sm p-2 hover:bg-stone-100">
                  <X className="h-5 w-5 text-stone-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Date</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-4 py-3 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-4 py-3 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500/10"
                  >
                    <option value="">Select category</option>
                    <option value="Staff Salaries">Staff Salaries</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Tax/Insurance">Tax/Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Amount</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-4 py-3 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Optional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-4 py-3 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500/10"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full rounded-sm bg-stone-900 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-stone-800 active:scale-95"
                  >
                    {editingId ? 'Update Record' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-sm bg-white p-8 shadow-xl border border-stone-200"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif">Confirm Deletion</h3>
              <p className="text-stone-500 mb-8 text-sm font-medium">Are you sure you want to delete this record? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeletingId(null)} 
                  className="px-5 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-5 py-2.5 text-sm bg-red-700 text-white font-bold rounded-sm hover:bg-red-800 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
