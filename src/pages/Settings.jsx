import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Calendar, LogOut, Shield } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // Format Supabase Timestamp strictly
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8">
      {/* Page Header */}
      <div className="mb-6 md:mb-8 pl-1">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">Account Settings</h1>
        <p className="text-sm md:text-base text-slate-500">Manage your profile, security preferences, and active sessions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Profile Details Header section */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
            <User className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">{user?.email || 'Authenticated User'}</h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-green-500" /> 
              Standard Administrator Role
            </p>
          </div>
        </div>

        {/* Data List Section */}
        <div className="p-0">
          <dl className="divide-y divide-slate-100">
            <div className="px-6 py-5 md:px-8 flex flex-col md:flex-row md:items-center">
              <dt className="text-sm font-medium text-slate-500 md:w-1/3 flex items-center mb-1 md:mb-0">
                <Mail className="w-4 h-4 mr-2" /> Email Address
              </dt>
              <dd className="text-sm text-slate-900 md:w-2/3 font-medium">{user?.email}</dd>
            </div>
            
            <div className="px-6 py-5 md:px-8 flex flex-col md:flex-row md:items-center">
              <dt className="text-sm font-medium text-slate-500 md:w-1/3 flex items-center mb-1 md:mb-0">
                <Shield className="w-4 h-4 mr-2" /> Account UUID
              </dt>
              <dd className="text-sm text-slate-500 md:w-2/3 font-mono truncate bg-slate-50 px-2 py-1 rounded inline-block">
                {user?.id}
              </dd>
            </div>

            <div className="px-6 py-5 md:px-8 flex flex-col md:flex-row md:items-center">
              <dt className="text-sm font-medium text-slate-500 md:w-1/3 flex items-center mb-1 md:mb-0">
                <Calendar className="w-4 h-4 mr-2" /> Member Since
              </dt>
              <dd className="text-sm text-slate-900 md:w-2/3">{formatDate(user?.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Destructive Actions Section */}
        <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out of Application
          </button>
        </div>
      </div>
    </div>
  );
}
