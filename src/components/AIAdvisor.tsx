import { useState, useRef, useEffect } from 'react';
import { Sparkles, FileDown, Bot, User, CheckCircle2, Shield, Info } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { generateFinancialSummary } from '../lib/pdfExport';

export default function AIAdvisor() {
  const { accounts, transactions, budgets, reminders } = useFinanceData();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { 
      role: 'model', 
      content: "Hello! I'm your Personal Finance Guide. To maintain your privacy and eliminate API costs, I've transitioned to a local processing mode.\n\nI can generate a comprehensive **Financial Summary PDF** for you. You can provide this file to other AI agents (like Gemini, ChatGPT, or Claude) to get personalized advice while keeping your data under your control." 
    }
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      generateFinancialSummary(accounts, transactions, budgets, reminders);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "✅ **Financial Summary Generated!**\n\nYour PDF includes:\n- Full Portfolio breakdown\n- Budget utilization rates\n- Recent transaction ledger\n- Upcoming payment reminders\n\nYou can now upload this to any AI assistant to ask questions like: *'Based on this PDF, what are 3 ways I can save $500 next month?'*" 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "❌ Failed to generate PDF. Please ensure you have data in your accounts and transactions." }]);
    } finally {
      setIsExporting(false);
    }
  };

  const getLocalAdvice = (topic: string) => {
    let content = "";
    if (topic === "savings") {
      const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
      content = `### Local Savings Insights\n\n- **Current Liquidity:** $${totalBalance.toLocaleString()}\n- **Rule of Thumb:** Try to keep 3-6 months of expenses in a high-yield savings account.\n- **Optimization:** You currently have ${accounts.length} active accounts. Consolidating small balances might reduce fee overhead.`;
    } else if (topic === "budget") {
      const overBudgets = budgets.filter(b => (transactions.filter(t => t.category === b.category && t.type === 'outflow').reduce((a, c) => a + c.amount, 0)) > b.limit);
      content = `### Budget Audit\n\n- **Status:** ${overBudgets.length > 0 ? `Alert: ${overBudgets.length} categories are exceeding targets.` : "Great job! All categories are within limits."}\n- **Advice:** For categories exceeding limits, review the 'History' tab to find non-essential recurring subscriptions.`;
    }

    setMessages(prev => [...prev, { role: 'model', content }]);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-220px)] flex flex-col glass rounded-3xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="bg-white/5 p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 glass bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight italic text-lg uppercase">Financial Guide</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Privacy-First Mode Active</p>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="text-[10px] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <CheckCircle2 className="w-3 h-3 text-emerald-400" />
             Zero API Costs
           </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                msg.role === 'model' ? 'glass bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'glass bg-white/10 border-white/20 text-slate-300'
              }`}>
                {msg.role === 'model' ? <Bot size={22} /> : <User size={22} />}
              </div>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-900/30 font-medium' 
                  : 'glass bg-white/5 text-slate-200 border border-white/5 rounded-tl-none font-medium'
              }`}>
                <div className="prose prose-sm prose-invert max-w-none opacity-90 leading-relaxed">
                   <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Action Area */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
           <button 
             onClick={() => getLocalAdvice('savings')}
             className="glass bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-left"
           >
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
               <Info size={16} />
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Analysis</p>
             <p className="text-xs font-bold text-white tracking-tight">Savings Insights</p>
           </button>
           <button 
             onClick={() => getLocalAdvice('budget')}
             className="glass bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-left"
           >
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
               <Sparkles size={16} />
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Analysis</p>
             <p className="text-xs font-bold text-white tracking-tight">Budget Audit</p>
           </button>
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="glass bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30 hover:bg-indigo-600/30 transition-all text-left group"
           >
             <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 mb-2 group-hover:scale-110 transition-transform">
               <FileDown size={16} />
             </div>
             <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Export Data</p>
             <p className="text-xs font-bold text-white tracking-tight">Generate Summary PDF</p>
           </button>
        </div>
        
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start space-x-3">
           <div className="mt-0.5 text-emerald-400">
             <Info size={16} />
           </div>
           <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
             This mode runs entirely on your device. No financial data leaves this browser session, and no AI API costs are incurred. The PDF export is optimized for use with Large Language Models.
           </p>
        </div>
      </div>
    </div>
  );
}
