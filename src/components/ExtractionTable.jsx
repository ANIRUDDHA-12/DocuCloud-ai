import { useState } from 'react';
import { FileText, ExternalLink, Loader2, AlertCircle, Search, Download } from 'lucide-react';

export default function ExtractionTable({ documents, loading, error }) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filter documents locally based on the search term
  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const vendorMatch = (doc.vendor || '').toLowerCase().includes(term);
    const catMatch = (doc.category || '').toLowerCase().includes(term);
    return vendorMatch || catMatch;
  });

  // 2. CSV Export Logic
  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return;

    // Standard CSV headers
    const headers = ['Pipeline ID', 'Date', 'Vendor', 'Category', 'Total Amount', 'Status'];

    // Map rows. Use standard escaping for CSV format (wrap strings in quotes)
    const rows = filteredDocuments.map(doc => [
      `"${doc.id}"`,
      `"${doc.created_at}"`,
      `"${(doc.vendor || '').replace(/"/g, '""')}"`,
      `"${(doc.category || 'Uncategorized').replace(/"/g, '""')}"`,
      `"${doc.total_amount || 0}"`,
      `"${doc.raw_json ? (doc.confidence_score > 85 ? 'Processed' : 'Needs Review') : 'Failed'}"`
    ].join(','));

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create Blob and trigger native browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', 'docucloud-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory
  };

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
    return 'bg-slate-100 text-slate-700 ring-slate-500/10'; 
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────
          HEADER TOOLBAR (Search & Export)
          ───────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Extraction History</h2>
          <p className="text-sm text-slate-500">Logs of all successfully processed documents.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search vendor or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
            />
          </div>

          {/* CSV Export Button */}
          <button 
            onClick={handleExportCSV}
            disabled={filteredDocuments.length === 0}
            className="flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Bulk Export CSV
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          DATA TABLE
          ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
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
            ) : filteredDocuments.length === 0 ? (
               <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  {searchTerm ? 'No results found for your search.' : 'No extractions yet. Upload a document to begin.'}
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(doc.created_at)}
                  </td>
                  
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {doc.vendor || <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getCategoryStyles(doc.category)}`}>
                      {doc.category || 'Uncategorized'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {formatCurrency(doc.total_amount)}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {doc.raw_json ? (
                       doc.confidence_score > 85 ? (
                         <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                           ● Processed
                         </span>
                       ) : (
                         <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                           ⚠ Needs Review
                         </span>
                       )
                    ) : (
                       <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                         Failed Payload
                       </span>
                    )}
                  </td>

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
