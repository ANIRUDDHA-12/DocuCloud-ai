import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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



  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm md:text-base text-slate-500">Historical archive of all system-processed documents.</p>
      </div>

      {/* ─────────────────────────────────────────────────────────
          DATA TABLE ONLY
          ───────────────────────────────────────────────────────── */}
      
      <ExtractionTable 
        documents={documents} 
        loading={loading} 
        error={error} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
