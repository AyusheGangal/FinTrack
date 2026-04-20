import { useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, ChevronRight, PieChart, Trash2 } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function Budgets() {
  const { budgets, transactions } = useFinanceData();
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Food', limit: 500 });

  const categories = ['Food', 'Rent', 'Salary', 'Shopping', 'Transport', 'Utilities', 'Subscription', 'Entertainment', 'Health', 'Investment'];

  const addBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'budgets'), {
        ...newBudget,
        userId: auth.currentUser.uid
      });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, 'create', 'budgets');
    }
  };

  const deleteBudget = async (id: string) => {
    if (!confirm('Remove this budget goal?')) return;
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', 'budgets');
    }
  };

  // Calculate spent amount per budget
  const budgetStats = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'outflow' && t.category === budget.category && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    return { ...budget, spent };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight uppercase italic">Target Limits</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Budget Allocation Strategy</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/20 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Target</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 rounded-3xl overflow-hidden border border-white/10 max-w-lg mx-auto"
          >
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] mb-6 text-center">Establish Bound</h4>
             <form onSubmit={addBudget} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Category Domain</label>
                <select 
                  value={newBudget.category}
                  onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-[#1e293b]">{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Funding Limit</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newBudget.limit}
                  onChange={e => setNewBudget({ ...newBudget, limit: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 border-t border-white/5 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-white text-indigo-900 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 transition tracking-widest uppercase"
                >
                  Confirm Goal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetStats.map(budget => {
          const percent = Math.min((budget.spent / budget.limit) * 100, 100);
          const isOver = budget.spent > budget.limit;

          return (
            <motion.div 
              layout
              key={budget.id}
              className="glass p-6 rounded-3xl group border border-white/5 hover:bg-white/5 transition-colors relative"
            >
              <button 
                onClick={() => deleteBudget(budget.id)}
                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                    isOver ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/5 border-white/10 text-indigo-400'
                  }`}>
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider italic">{budget.category}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Objective</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold tracking-tighter ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                    ${budget.spent.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block opacity-60">OF ${budget.limit.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.2)] ${
                      isOver ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-500 shadow-indigo-500/20'
                    }`} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span className={isOver ? 'text-rose-400' : 'text-indigo-400'}>{percent.toFixed(0)}% Utilized</span>
                  <span className="text-slate-500">${Math.max(budget.limit - budget.spent, 0).toLocaleString()} Free</span>
                </div>

                {isOver && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-rose-400 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Threshold Exceeded</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
        {budgetStats.length === 0 && (
          <div className="md:col-span-2 py-20 text-center glass rounded-3xl border border-dashed border-white/10">
             <Target className="w-12 h-12 text-white/5 mx-auto mb-4" />
             <h4 className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">No Objectives Defined</h4>
             <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-slate-400 transition-colors cursor-pointer" onClick={() => setIsAdding(true)}>Initialize Targets</p>
          </div>
        )}
      </div>
    </div>
  );
}
