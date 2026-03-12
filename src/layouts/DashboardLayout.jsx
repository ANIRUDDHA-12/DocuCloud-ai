import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Settings, Key, LogOut, Menu, X } from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // AuthContext and ProtectedRoute will automatically catch this
    // state change and reroute to /login
  };

  const navItems = [
    { label: 'Overview Dashboard', icon: LayoutDashboard, path: '/dashboard/overview' },
    { label: 'Extraction Logs', icon: FileText, path: '/dashboard/logs' },
    { label: 'API Keys', icon: Key, path: '/dashboard/keys' },
    { label: 'Account Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <div className="flex-1 flex w-full h-full min-w-0 bg-slate-50 overflow-hidden font-sans">
      
      {/* ─────────────────────────────────────────────────────────
          MOBILE HEADER (Top)
          ───────────────────────────────────────────────────────── */}
      <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-green-500 rounded flex flex-col items-center justify-center space-y-px mr-2 shadow-lg shadow-green-500/20">
             <div className="w-2 h-px bg-slate-900 rounded-full" />
             <div className="w-3 h-px bg-slate-900 rounded-full" />
             <div className="w-1.5 h-px bg-slate-900 rounded-full" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">DocuCloud AI</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────
          SIDEBAR: Fixed Left (Dark Navy)
          ───────────────────────────────────────────────────────── */}
      {/* Mobile Backdrop overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Area (Desktop Only) */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-slate-800/50">
          <div className="w-6 h-6 bg-green-500 rounded flex flex-col items-center justify-center space-y-0.5 mr-3 shadow-lg shadow-green-500/20">
             <div className="w-2.5 h-px bg-slate-900 rounded-full" />
             <div className="w-3.5 h-px bg-slate-900 rounded-full" />
             <div className="w-1.5 h-px bg-slate-900 rounded-full" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">DocuCloud AI</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight based on current path exact match.
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${isActive 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                `}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-green-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Sign Out */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0 pr-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-xs font-semibold text-slate-300">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 truncate">Admin</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
          MAIN CONTENT AREA (White/Gray)
          ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Breadcrumbs (Desktop Only) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">Extraction Logs</h1>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}
