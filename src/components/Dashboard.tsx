import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Calculator, CreditCard, ChevronRight, TrendingUp, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { accounts, transactions, budgets, reminders, loading } = useFinanceData();

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyInflow = transactions
    .filter(t => t.type === 'inflow' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const monthlyOutflow = transactions
    .filter(t => t.type === 'outflow' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Group transactions by category for pie chart
  const spendingByCategory = transactions
    .filter(t => t.type === 'outflow')
    .reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const pieData = Object.entries(spendingByCategory).map(([name, value]: [string, any]) => ({ name, value }));
  const COLORS = ['#6366f1', '#e11d48', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Cash flow trend (last 6 months - mock derived from transactions)
  const cashFlowTrend = [
    { name: 'Jan', inflow: 4000, outflow: 2400 },
    { name: 'Feb', inflow: 3000, outflow: 1398 },
    { name: 'Mar', inflow: 2000, outflow: 9800 },
    { name: 'Apr', inflow: 2780, outflow: 3908 },
    { name: 'May', inflow: 1890, outflow: 4800 },
    { name: 'Jun', inflow: monthlyInflow, outflow: monthlyOutflow },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Net Worth" 
          amount={totalBalance} 
          icon={<Wallet className="text-[#38bdf8]" />} 
          trend="+5.2%"
          positive
        />
        <StatCard 
          title="Monthly Inflow" 
          amount={monthlyInflow} 
          icon={<ArrowUpRight className="text-[#4ade80]" />} 
          trend="+12%"
          positive
        />
        <StatCard 
          title="Monthly Outflow" 
          amount={monthlyOutflow} 
          icon={<ArrowDownLeft className="text-[#fb7185]" />} 
          trend="-2%"
          positive={false}
        />
        <StatCard 
          title="Goal Progress" 
          amount={82} 
          icon={<Sparkles className="text-[#c084fc]" />} 
          trend="82%"
          positive
          isPercentage
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Cash Flow Activity</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Inflow vs Outflow analysis</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs font-bold px-3 py-1.5 text-slate-300 focus:ring-0">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                <YAxis dataKey="inflow" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                 />
                <Line type="monotone" dataKey="inflow" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Spending Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {pieData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-slate-200">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Activity</h3>
            <button className="text-indigo-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-300">View All</button>
          </div>
          <div className="divide-y divide-white/5">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                    t.type === 'inflow' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-white/10 text-slate-400'
                  }`}>
                    {t.type === 'inflow' ? <ArrowUpRight className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{t.description}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t.category} • {format(new Date(t.date), 'MMM dd')}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {t.type === 'inflow' ? '+' : '-'}${t.amount.toLocaleString()}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm italic">
                No transactions yet.
              </div>
            )}
          </div>
        </div>

        {/* Reminders & Budget Progress */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight italic">Upcoming Payments</h3>
            <div className="space-y-3">
              {reminders.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center space-x-4 hover:bg-white/10 transition-colors">
                   <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
                   <div className="flex-1 min-w-0">
                     <h4 className="text-xs font-bold text-slate-200 truncate uppercase tracking-wider">{r.name}</h4>
                     <p className="text-[10px] text-slate-500 font-bold">Due {format(new Date(r.dueDate), 'MMM dd')}</p>
                   </div>
                   <div className="text-sm font-bold text-[#fb7185]">
                     ${r.amount.toLocaleString()}
                   </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">No pending items</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-indigo p-6 rounded-3xl text-white relative overflow-hidden ring-1 ring-indigo-500/30">
             <div className="relative z-10">
               <h4 className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 mb-2">Portfolio Strategy</h4>
               <p className="text-sm font-medium leading-relaxed text-indigo-50">
                 Market volatility is up 4%. Highlighting savings buffer in <span className="text-white font-bold italic">$3,200</span> range recommended.
               </p>
               <button className="mt-5 bg-white text-indigo-600 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/40">
                 <span>Vault AI</span>
                 <Sparkles className="w-3.5 h-3.5" />
               </button>
             </div>
             <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, icon, trend, positive, isPercentage }: { title: string, amount: number, icon: React.ReactNode, trend: string, positive: boolean, isPercentage?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass p-6 rounded-3xl shadow-xl shadow-black/10 group overflow-hidden relative"
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-widest ${
          positive 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-[#4ade80]' 
            : 'bg-rose-500/10 border-rose-500/20 text-[#fb7185]'
        }`}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</h4>
        <div className="text-3xl font-bold text-white tracking-tighter italic">
          {isPercentage ? '' : '$'}{amount.toLocaleString(undefined, { minimumFractionDigits: isPercentage ? 0 : 2, maximumFractionDigits: 2 })}
          {isPercentage ? '%' : ''}
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-5 rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
    </motion.div>
  );
}
