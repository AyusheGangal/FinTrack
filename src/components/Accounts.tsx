import { useState } from 'react';
import { Plus, CreditCard, PiggyBank, Briefcase, ChevronRight, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Account, AccountType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  checking: <CreditCard className="w-6 h-6" />,
  savings: <PiggyBank className="w-6 h-6" />,
  credit: <CreditCard className="w-6 h-6 text-rose-500" />,
  loan: <ChevronRight className="w-6 h-6 text-amber-500" />,
  retirement: <Briefcase className="w-6 h-6 text-indigo-500" />,
  hsa: <Plus className="w-6 h-6 text-emerald-500" />
};

export default function Accounts() {
  const { accounts, loading } = useFinanceData();
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking' as AccountType, balance: 0 });

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'accounts'), {
        ...newAccount,
        userId: auth.currentUser.uid,
        lastUpdated: new Date().toISOString(),
        currency: 'USD'
      });
      setIsAdding(false);
      setNewAccount({ name: '', type: 'checking', balance: 0 });
    } catch (err) {
      handleFirestoreError(err, 'create', 'accounts');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? Settings and transactions may be affected.')) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', 'accounts');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white tracking-tight">Your Portfolio</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/20 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          <span>New Account</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 rounded-3xl overflow-hidden ring-1 ring-white/10"
          >
            <form onSubmit={addAccount} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Account Label</label>
                <input 
                  type="text" 
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g. Vault Savings"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Class</label>
                <select 
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="checking" className="bg-[#1e293b]">Checking</option>
                  <option value="savings" className="bg-[#1e293b]">Savings</option>
                  <option value="credit" className="bg-[#1e293b]">Credit Card</option>
                  <option value="loan" className="bg-[#1e293b]">Loan</option>
                  <option value="retirement" className="bg-[#1e293b]">Retirement</option>
                  <option value="hsa" className="bg-[#1e293b]">HSA</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Starting Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-4 border-t border-white/5 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="bg-white text-indigo-900 px-8 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 transition tracking-widest uppercase"
                >
                  Confirm Account
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <motion.div 
            layout
            key={account.id}
            className="glass p-6 rounded-3xl hover:bg-white/5 transition-colors relative group border border-white/5"
          >
            <button 
              onClick={() => deleteAccount(account.id)}
              className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 glass bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-lg">
                {ACCOUNT_ICONS[account.type]}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide uppercase italic">{account.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{account.type}</p>
              </div>
            </div>

            <div className="space-y-1 relative">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">Total Valuation</p>
              <div className="text-3xl font-bold text-white tracking-tighter italic">
                ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em]">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]"></div>
                <span className="text-emerald-400">Synced</span>
              </div>
              <span className="text-slate-500">Asset Class • USD</span>
            </div>
          </motion.div>
        ))}
        {accounts.length === 0 && (
          <div className="md:col-span-3 py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-500 font-bold">No accounts yet</h4>
            <p className="text-slate-400 text-sm mt-1">Add your first account to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
