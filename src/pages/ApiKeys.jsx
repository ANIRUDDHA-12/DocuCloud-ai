import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      setError('Failed to load API keys.');
    } else {
      setKeys(data || []);
    }
    setLoading(false);
  };

  const generateKey = async () => {
    setGenerating(true);
    setError(null);
    
    // Generate dc_live_ + 24 random hex characters for a secure cryptographic key
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    const newKey = `dc_live_${hex}`;

    const { data, error: insertError } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, api_key: newKey })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setKeys([data, ...keys]);
    }
    setGenerating(false);
  };

  const deleteKey = async (id) => {
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      setError('Failed to revoke key.');
    } else {
      setKeys(keys.filter(k => k.id !== id));
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskKey = (keyString) => {
    if (!keyString) return '';
    return 'dc_live_************************';
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Keys</h1>
          <p className="text-slate-500 mt-1">Manage your secret keys for automated server-to-server AI extraction.</p>
        </div>
        <button
          onClick={generateKey}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-75"
        >
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Generate Secret Key
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
          <Key className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-800">Active Secret Keys</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-green-500" />
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Key className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            You haven't generated any API keys yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">SECRET KEY</th>
                  <th className="px-6 py-4">CREATED</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono text-xs border border-slate-200">
                         {maskKey(key.api_key)}
                       </code>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <button 
                         onClick={() => copyToClipboard(key.id, key.api_key)}
                         className="p-1.5 text-slate-400 hover:text-green-600 transition-colors rounded-md hover:bg-green-50"
                         title="Copy Secret Key"
                       >
                         {copiedId === key.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                       </button>
                       <button 
                         onClick={() => deleteKey(key.id)}
                         className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Revoke Key"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
