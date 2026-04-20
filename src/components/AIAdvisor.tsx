import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

export default function AIAdvisor() {
  const { accounts, transactions, budgets } = useFinanceData();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hello! I'm your Vault AI Assistant. I've analyzed your portfolio. How can I help you optimize your assets today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getFinancialContext = () => {
    const context = `
      Current Financial Data:
      Accounts: ${accounts.map(a => `${a.name} (${a.type}): $${a.balance}`).join(', ')}
      Budgets: ${budgets.map(b => `${b.category}: $${b.limit}`).join(', ')}
      Recent Transactions (last 10): ${transactions.slice(0, 10).map(t => `${t.date}: ${t.description} - ${t.type === 'inflow' ? '+' : '-'}$${t.amount} (${t.category})`).join('; ')}
    `;
    return context;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const context = getFinancialContext();
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          { role: 'user', parts: [{ text: `System Instruction: You are a professional financial advisor. Use the user's data to provide specific, actionable advice. Be encouraging but realistic.\n\nContext: ${context}\n\nUser Question: ${userMessage}` }] }
        ],
        config: {
          temperature: 0.7,
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered an error while analyzing your data. Please check your connection and try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-220px)] flex flex-col glass rounded-3xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="bg-white/5 p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 glass bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight italic text-lg uppercase">Vault Advisor</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Analysis Engine</p>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="text-[10px] bg-white/5 px-4 py-1.5 rounded-full border border-white/10 font-bold text-slate-400 uppercase tracking-widest">Portfolio Context Active</span>
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
                msg.role === 'model' ? 'glass bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'glass bg-white/10 border-white/20 text-slate-300'
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
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-4 items-center">
               <div className="w-10 h-10 rounded-xl glass bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                 <Bot size={22} />
               </div>
               <div className="flex space-x-1.5">
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
               </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex items-center space-x-3 mb-5 overflow-x-auto pb-2 no-scrollbar">
           <QuickAction label="Risk Profile" onClick={() => setInputText("What's the risk profile of my recent activity?")} />
           <QuickAction label="Growth Strategy" onClick={() => setInputText("How can I improve my overall asset growth?")} />
           <QuickAction label="Spend Analysis" onClick={() => setInputText("Analyze my spending for potential leaks.")} />
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            placeholder="Query your portfolio insights..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4.5 text-sm text-white focus:ring-1 focus:ring-indigo-500/40 focus:outline-none placeholder:text-slate-600 font-medium"
          />
          <button 
            onClick={sendMessage}
            disabled={isTyping}
            className="w-16 h-16 bg-white text-indigo-900 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition shadow-2xl active:scale-95 disabled:opacity-50"
          >
            <Send className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all font-bold uppercase tracking-widest whitespace-nowrap"
    >
      {label}
    </button>
  );
}
