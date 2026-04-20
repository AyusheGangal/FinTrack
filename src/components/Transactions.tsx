import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Calendar, Tag, Search, Filter, Trash2, ChevronRight, FileText } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Account, Transaction } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Transactions() {
  const { transactions, accounts } = useFinanceData();
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({
    accountId: '',
    amount: 0,
    type: 'outflow' as 'inflow' | 'outflow',
    category: 'General',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['General', 'Food', 'Rent', 'Salary', 'Shopping', 'Transport', 'Utilities', 'Subscription', 'Entertainment', 'Health', 'Investment'];

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newTx.accountId) return;

    try {
      // 1. Add transaction
      await addDoc(collection(db, 'transactions'), {
        ...newTx,
        userId: auth.currentUser.uid,
        date: new Date(newTx.date).toISOString()
      });

      // 2. Update account balance
      const accountRef = doc(db, 'accounts', newTx.accountId);
      const adjustment = newTx.type === 'inflow' ? newTx.amount : -newTx.amount;
      await updateDoc(accountRef, {
        balance: increment(adjustment),
        lastUpdated: new Date().toISOString()
      });

      setIsAdding(false);
      setNewTx({ accountId: '', amount: 0, type: 'outflow', category: 'General', description: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      handleFirestoreError(err, 'create', 'transactions');
    }
  };

  const deleteTransaction = async (tx: Transaction) => {
    if (!confirm('Delete this transaction? This will also revert the account balance adjustment.')) return;
    try {
      // Revert account balance
      const accountRef = doc(db, 'accounts', tx.accountId);
      const revertAdjustment = tx.type === 'inflow' ? -tx.amount : tx.amount;
      await updateDoc(accountRef, {
        balance: increment(revertAdjustment)
      });

      await deleteDoc(doc(db, 'transactions', tx.id));
    } catch (err) {
      handleFirestoreError(err, 'delete', 'transactions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight uppercase italic">Ledger History</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Transaction audit trail</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/20 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 rounded-3xl overflow-hidden border border-white/10"
          >
            <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Source Account</label>
                <select 
                  value={newTx.accountId}
                  onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  required
                >
                  <option value="" className="bg-[#1e293b]">Select Context</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1e293b]">{a.name} (${a.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Flow Type</label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: 'inflow' })}
                    className={`flex-1 py-3 text-[10px] font-bold rounded-lg transition uppercase tracking-widest ${newTx.type === 'inflow' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Inflow
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: 'outflow' })}
                    className={`flex-1 py-3 text-[10px] font-bold rounded-lg transition uppercase tracking-widest ${newTx.type === 'outflow' ? 'bg-rose-600/80 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Outflow
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Magnitude</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newTx.amount}
                  onChange={e => setNewTx({ ...newTx, amount: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Description Label</label>
                <input 
                  type="text" 
                  value={newTx.description}
                  onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                  placeholder="Retail / Compensation / ..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Domain Class</label>
                <select 
                  value={newTx.category}
                  onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-[#1e293b]">{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Timestamp</label>
                <input 
                  type="date" 
                  value={newTx.date}
                  onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-end space-x-4 border-t border-white/5 pt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">Discard</button>
                <button type="submit" className="bg-white text-indigo-900 px-10 py-3 rounded-xl text-[10px] font-extrabold shadow-xl hover:bg-slate-100 transition uppercase tracking-widest">Commit Transaction</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center space-x-5">
             <div className="flex glass p-1 rounded-xl">
               <button className="px-4 py-1.5 text-[10px] font-bold text-white bg-indigo-500/40 rounded-lg uppercase tracking-widest border border-indigo-400/20">All Flux</button>
               <button className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Inflow</button>
               <button className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Outflow</button>
             </div>
             <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
             <button className="text-slate-500 hover:text-white flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest transition-colors">
               <Filter className="w-4 h-4" />
               <span>Refine</span>
             </button>
           </div>
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">{transactions.length} entries indexed</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Identity</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Classification</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Temporal</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Allocation</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] text-right">Magnitude</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map(tx => {
                const account = accounts.find(a => a.id === tx.accountId);
                return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={tx.id} 
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                           tx.type === 'inflow' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                         }`}>
                           {tx.type === 'inflow' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                         </div>
                         <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight italic">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-bold px-3 py-1 bg-white/5 rounded-lg border uppercase tracking-widest ${
                        tx.category === 'Salary' ? 'text-emerald-400 border-emerald-500/20' : 'text-slate-400 border-white/10'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest italic">
                      {account?.name || 'External'}
                    </td>
                    <td className={`px-6 py-5 text-sm font-bold text-right tracking-tight ${tx.type === 'inflow' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'inflow' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button 
                         onClick={() => deleteTransaction(tx)}
                         className="p-2 text-slate-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                        >
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-24 text-center">
              <FileText className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <h4 className="text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">Audit Log Empty</h4>
              <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-2">Initialize flux entries in sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
