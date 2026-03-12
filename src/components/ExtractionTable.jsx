import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export default function ExtractionTable({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (dbError) {
        console.error('Error fetching docs:', dbError);
        setError('Failed to load extraction history.');
      } else {
        setDocuments(data || []);
      }
      
      setLoading(false);
    }
    
    fetchDocuments();
  }, [refreshTrigger]);

  // Format currency securely using Intl formatter
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format date reliably
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };
  
  // Style category pills dynamically
  const getCategoryStyles = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('software') || cat.includes('api')) return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    if (cat.includes('travel') || cat.includes('food')) return 'bg-orange-50 text-orange-700 ring-orange-600/20';
    if (cat.includes('hardware') || cat.includes('equipment')) return 'bg-purple-50 text-purple-700 ring-purple-600/20';
    return 'bg-slate-100 text-slate-700 ring-slate-500/10'; // default/unknown
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Extraction History</h2>
          <p className="text-sm text-slate-500">Logs of all successfully processed documents.</p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          {documents.length} Records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">TIMESTAMP</th>
              <th className="px-6 py-4">VENDOR</th>
              <th className="px-6 py-4">CATEGORY</th>
              <th className="px-6 py-4 text-right">TOTAL AMOUNT</th>
              <th className="px-6 py-4 text-center">STATUS</th>
              <th className="px-6 py-4 text-center">SOURCE</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-green-500" />
                  Loading records...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-red-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  {error}
                </td>
              </tr>
            ) : documents.length === 0 ? (
               <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  No extractions yet. Upload a document to begin.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  {/* Timestamp */}
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(doc.created_at)}
                  </td>
                  
                  {/* Vendor */}
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {doc.vendor || <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  
                  {/* Category Pill */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getCategoryStyles(doc.category)}`}>
                      {doc.category || 'Uncategorized'}
                    </span>
                  </td>
                  
                  {/* Amount */}
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {formatCurrency(doc.total_amount)}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    {doc.raw_json ? (
                       <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                         Processed
                       </span>
                    ) : (
                       <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                         Failed Payload
                       </span>
                    )}
                  </td>

                  {/* Private Document Link (Mock Action) */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => alert(`This file is sitting in a private bucket: ${doc.file_url}\nTo view it, we would generate a temporary Signed URL exactly like we did in the Uploader component.`)}
                      className="text-slate-400 hover:text-green-600 transition-colors"
                      title="View Origin File"
                    >
                      <ExternalLink className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
