import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  PieChart, 
  Target, 
  Bell, 
  Sparkles,
  Search,
  LogOut,
  ChevronRight,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Briefcase,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useAuth, signIn, signOut } from './lib/firebase';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import AIAdvisor from './components/AIAdvisor';

type View = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'advisor';

export default function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FinTrack Pro</h1>
          <p className="text-gray-500 mb-8">Manage all your finances in one place with AI-powered insights.</p>
          <button 
            onClick={signIn}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
          >
            <span>Login with Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex">
      <div className="mesh-bg" />
      
      {/* Sidebar */}
      <aside className="w-72 flex flex-col hidden lg:flex p-6">
        <div className="glass rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
              V
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase italic">Vault</span>
          </div>

          <nav className="space-y-2">
            <NavItem 
              active={activeView === 'dashboard'} 
              onClick={() => setActiveView('dashboard')}
              icon={<BarChart3 />} 
              label="Overview" 
            />
            <NavItem 
              active={activeView === 'accounts'} 
              onClick={() => setActiveView('accounts')}
              icon={<CreditCard />} 
              label="Accounts" 
            />
            <NavItem 
              active={activeView === 'transactions'} 
              onClick={() => setActiveView('transactions')}
              icon={<RefreshCw />} 
              label="History" 
            />
            <NavItem 
              active={activeView === 'budgets'} 
              onClick={() => setActiveView('budgets')}
              icon={<Target />} 
              label="Budgets" 
            />
            <NavItem 
              active={activeView === 'advisor'} 
              onClick={() => setActiveView('advisor')}
              icon={<Sparkles />} 
              label="AI Advisor" 
              accent
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 glass-indigo rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-2">AI Insights</p>
              <p className="text-xs leading-relaxed text-slate-300">Your savings rate is 12% higher this month. Keep it up!</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Global Dashboard</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {activeView === 'dashboard' ? 'Net Worth' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="relative">
               <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Search..." 
                 className="glass rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 w-full sm:w-64 text-white placeholder:text-slate-500"
               />
             </div>
             <button className="glass p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0f172a]"></span>
             </button>
             <div className="flex items-center space-x-3 ml-4">
               <button onClick={signOut} className="glass p-2.5 rounded-xl text-slate-400 hover:text-rose-400">
                  <LogOut className="w-5 h-5" />
               </button>
               <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-xl border border-white/10" referrerPolicy="no-referrer" />
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'accounts' && <Accounts />}
            {activeView === 'transactions' && <Transactions />}
            {activeView === 'budgets' && <Budgets />}
            {activeView === 'advisor' && <AIAdvisor />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 glass rounded-2xl px-6 py-4 flex justify-between items-center z-50">
        <MobileNavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<BarChart3 className="w-6 h-6" />} />
        <MobileNavItem active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} icon={<CreditCard className="w-6 h-6" />} />
        <MobileNavItem active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} icon={<RefreshCw className="w-6 h-6" />} />
        <MobileNavItem active={activeView === 'budgets'} onClick={() => setActiveView('budgets')} icon={<Target className="w-6 h-6" />} />
        <MobileNavItem active={activeView === 'advisor'} onClick={() => setActiveView('advisor')} icon={<Sparkles className="w-6 h-6 text-indigo-400" />} />
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, accent }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void, accent?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
        active 
          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      } ${accent && !active ? 'text-indigo-400' : ''}`}
    >
      <span className={`w-5 h-5 flex items-center justify-center ${active ? 'text-indigo-400' : ''}`}>
        {icon}
      </span>
      <span className="font-semibold text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeRule" className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />}
    </button>
  );
}

function MobileNavItem({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded-xl transition-colors ${active ? 'text-indigo-400 bg-white/10' : 'text-slate-500'}`}
    >
      {icon}
    </button>
  );
}
