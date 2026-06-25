import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LayoutDashboard, CheckSquare, LogOut, BrainCircuit, Menu, X, Home } from 'lucide-react';
import ChatBot from '../features/ChatBot';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks & Planning', href: '/tasks', icon: CheckSquare },
    { name: 'Landing / Pitch', href: '/', icon: Home },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-deep-space-violet text-off-white font-sans overflow-hidden">
      {/* Mobile Header Bar */}
      <header className="md:hidden h-16 bg-deep-space-violet/90 border-b border-rich-violet/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center">
          <BrainCircuit className="w-6 h-6 text-bright-teal mr-2 animate-pulse" />
          <span className="text-lg font-semibold tracking-tight text-off-white">LifePilot AI</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-bright-teal rounded-md focus:outline-none transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-pure-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-deep-space-violet/95 md:bg-deep-space-violet/40 border-r border-rich-violet/60 backdrop-blur-md flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:flex md:inset-auto
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-rich-violet/60 shrink-0">
          <div className="flex items-center">
            <BrainCircuit className="w-6 h-6 text-bright-teal mr-2" />
            <h1 className="text-xl font-semibold tracking-tight text-off-white">LifePilot AI</h1>
          </div>
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-bright-teal rounded-md transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-bright-teal/10 text-bright-teal font-medium border-l-2 border-bright-teal' 
                    : 'text-slate-400 hover:bg-rich-violet/20 hover:text-off-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-rich-violet/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-bright-teal/10 border border-bright-teal/20 flex items-center justify-center text-bright-teal font-semibold shrink-0">
              {user?.name?.charAt(0) || '?'}
            </div>
            <span className="text-sm font-medium text-slate-300 truncate">{user?.name || 'User'}</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-500 hover:text-bright-teal rounded-md transition-colors">
             <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-deep-space-violet">
        <div className="p-4 sm:p-8 pb-32">
          {children}
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
