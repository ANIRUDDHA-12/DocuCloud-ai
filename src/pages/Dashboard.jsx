import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, DollarSign, Activity } from 'lucide-react';
import Uploader from '../components/Uploader';
import ExtractionTable from '../components/ExtractionTable';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Uploader triggers this to refresh the data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Centralized Data Fetch (State Lifted from Table)
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

  // 2. Compute Top-Level Metrics
  const totalProcessed = documents.length;
  const totalVolume = documents.reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
  
  const docsWithScores = documents.filter(doc => typeof doc.confidence_score === 'number');
  const averageAccuracy = docsWithScores.length > 0 
    ? docsWithScores.reduce((sum, doc) => sum + doc.confidence_score, 0) / docsWithScores.length 
    : 0;

  // Formatting Helpers
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };



  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500">Monitor extraction volumes and upload new documents for processing.</p>
      </div>

      {/* ─────────────────────────────────────────────────────────
          METRIC CARDS (Phase 4 Deliverable)
          ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Documents Processed</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalProcessed}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Extraction Volume</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalVolume)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">System Accuracy</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{averageAccuracy > 0 ? `${averageAccuracy.toFixed(1)}%` : '—'}</h3>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          CORE FEATURES
          ───────────────────────────────────────────────────────── */}
      <Uploader onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      
      <ExtractionTable 
        documents={documents} 
        loading={loading} 
        error={error} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
