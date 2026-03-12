import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';

export default function DocumentModal({ doc, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vendor: doc.vendor || '',
    total_amount: doc.total_amount || '',
    date: doc.date || '',
    category: doc.category || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        vendor: formData.vendor || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        date: formData.date || null,
        category: formData.category || null
      })
      .eq('id', doc.id);

    setLoading(false);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-6xl h-[80vh] min-h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">HITL Verification</h2>
            <p className="text-xs md:text-sm text-slate-500 font-mono mt-0.5 truncate max-w-[200px] md:max-w-sm">ID: {doc.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Responsive Layout Grid (Stack on Mobile, 50/50 Split on Desktop) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
          
          {/* Top/Left Side: Document Preview Object/IFrame */}
          <div className="w-full md:flex-1 h-64 md:h-full bg-slate-100 p-2 md:p-4 border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden relative group shrink-0">
            <object 
              data={doc.file_url} 
              className="w-full h-full rounded-lg shadow-inner bg-white"
              aria-label="Document Preview"
            >
               <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center space-y-4">
                 <AlertCircle className="w-10 h-10 text-slate-400" />
                 <p className="text-sm">Preview unavailable.</p>
                 <p className="text-xs text-slate-400 max-w-xs">Older signed URLs expire after 60 seconds to protect your private bucket. Freshly uploaded documents will render properly.</p>
               </div>
            </object>
          </div>

          {/* Right Side: Editable Metadata Form */}
          <div className="w-full md:w-[400px] bg-white p-6 overflow-y-auto shrink-0 flex flex-col space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-slate-900">Extracted Metadata</h3>
                {doc.confidence_score !== null && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${doc.confidence_score > 85 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    AI Score: {doc.confidence_score}%
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-6">Review, correct, and save the AI's extraction data manually.</p>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4 border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                  <input 
                    type="text" 
                    name="vendor" 
                    value={formData.vendor} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm outline-none transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="total_amount" 
                    value={formData.total_amount} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm outline-none transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date (YYYY-MM-DD)</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm outline-none transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm bg-white outline-none transition-shadow"
                  >
                    <option value="">Uncategorized</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Software">Software</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Buttons pinned to bottom of flex-col */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={onClose} 
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
