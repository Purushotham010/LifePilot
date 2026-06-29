import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { fetchAPI } from '../../lib/api';
import Markdown from 'react-markdown';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-deep-space-violet w-80 sm:w-96 rounded-[20px] shadow-none border border-rich-violet/60 overflow-hidden flex flex-col h-[500px] max-h-[80vh] backdrop-blur-md">
          <div className="bg-deep-space-violet px-4 py-3 flex items-center justify-between text-off-white border-b border-rich-violet/60">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-bright-teal" />
              <span className="font-medium text-off-white">LifePilot Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-bright-teal transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-deep-space-violet/80">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-10 text-sm font-sans">
                Ask me how to plan your day, prioritize tasks, or beat procrastination!
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 max-w-[85%] rounded-[14px] text-sm ${m.role === 'user' ? 'bg-bright-teal text-deep-space-violet font-medium rounded-br-none' : 'bg-rich-violet/30 text-off-white border border-rich-violet/60 rounded-bl-none prose prose-invert prose-sm max-w-none'}`}>
                  {m.role === 'user' ? m.text : <Markdown>{m.text}</Markdown>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-[14px] bg-rich-violet/30 border border-rich-violet/60 rounded-bl-none">
                  <Loader2 className="w-4 h-4 text-bright-teal animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-deep-space-violet border-t border-rich-violet/60 flex items-center gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Message LifePilot..."
              className="flex-1 px-3 py-2 bg-deep-space-violet border border-rich-violet/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-bright-teal focus:border-transparent text-sm text-off-white placeholder-slate-500"
            />
            <button type="submit" disabled={!input.trim() || loading} className="p-2 bg-bright-teal text-deep-space-violet rounded-lg disabled:opacity-50 hover:bg-bright-teal/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-transform hover:scale-105 active:scale-95"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
