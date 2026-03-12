import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      // AuthContext will automatically pick up the session change via onAuthStateChange,
      // but we explicitly redirect them to the dashboard now.
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="flex-1 flex w-full h-full bg-white">
      {/* ─────────────────────────────────────────────────────────
          LEFT PANEL: Dark Navy Branding (hidden on mobile)
          ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-center px-16 relative overflow-hidden">
        {/* Abstract background decoration */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500/10 rounded-full blur-3xl ring-1 ring-white/10" />
        <div className="absolute bottom-12 right-12 w-64 h-64 bg-slate-800/50 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center space-x-2 mb-12">
            <div className="w-8 h-8 bg-green-500 rounded flex flex-col items-center justify-center space-y-0.5">
               <div className="w-3 h-0.5 bg-slate-900 rounded-full" />
               <div className="w-4 h-0.5 bg-slate-900 rounded-full" />
               <div className="w-2 h-0.5 bg-slate-900 rounded-full" />
            </div>
            <span className="text-xl font-bold tracking-tight">DocuCloud AI</span>
          </div>

          <h1 className="text-5xl font-semibold leading-tight mb-6">
            Automate your unstructured data pipeline.
          </h1>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            Instantly extract structured JSON from receipts and invoices using vision models. Built for speed, security, and scale.
          </p>

          {/* Mock JSON Terminal */}
          <div className="bg-slate-950/80 rounded-lg p-6 font-mono text-sm border border-slate-800 shadow-2xl">
            <div className="flex space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-slate-300">
              <span className="text-green-400">const</span> extraction = <span className="text-blue-400">await</span> ai.extract(fileUrl);<br/><br/>
              <span className="text-blue-400">console</span>.log(extraction);<br/>
              <span className="text-slate-500">// Output:</span><br/>
              {`{`}<br/>
              &nbsp;&nbsp;<span className="text-green-400">"vendor"</span>: <span className="text-orange-300">"Stripe"</span>,<br/>
              &nbsp;&nbsp;<span className="text-green-400">"total_amount"</span>: <span className="text-purple-400">149.99</span>,<br/>
              &nbsp;&nbsp;<span className="text-green-400">"category"</span>: <span className="text-orange-300">"Software"</span><br/>
              {`}`}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          RIGHT PANEL: Login Form
          ───────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            {/* Mobile Logo Only */}
            <div className="flex lg:hidden justify-center items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-green-500 rounded flex flex-col items-center justify-center space-y-0.5">
                 <div className="w-3 h-0.5 bg-slate-900 rounded-full" />
                 <div className="w-4 h-0.5 bg-slate-900 rounded-full" />
                 <div className="w-2 h-0.5 bg-slate-900 rounded-full" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DocuCloud AI</span>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your dashboard to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start space-x-2">
                <span className="font-semibold px-1">•</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Internal administrative portal. Public registration is disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
