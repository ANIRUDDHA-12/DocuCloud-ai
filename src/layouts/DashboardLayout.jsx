import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Settings, Key, LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // AuthContext and ProtectedRoute will automatically catch this
    // state change and reroute to /login
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/overview' },
    { label: 'Extraction Logs', icon: FileText, path: '/dashboard' }, // Default route for now
    { label: 'API Keys', icon: Key, path: '/dashboard/keys' },
    { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <div className="flex-1 flex w-full h-full min-w-0 bg-slate-50 overflow-hidden font-sans">
      
      {/* ─────────────────────────────────────────────────────────
          SIDEBAR: Fixed Left (Dark Navy)
          ───────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
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
            // Highlight 'Extraction Logs' as active by default for Phase 3
            const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/dashboard');
            
            return (
              <Link
                key={item.path}
                to={item.path}
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
        {/* Top Header / Breadcrumbs */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">Extraction Logs</h1>
        </header>

        {/* Scrollable Content Container (Future Data Table goes here) */}
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}
