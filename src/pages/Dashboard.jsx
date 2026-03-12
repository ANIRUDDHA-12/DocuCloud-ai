import { useState } from 'react';
import Uploader from '../components/Uploader';
import ExtractionTable from '../components/ExtractionTable';

export default function Dashboard() {
  // Acts as our global trigger. Every time Uploader succeeds, 
  // it increments this value. Because ExtractionTable listens to it 
  // in its useEffect dependency array, it will automatically re-fetch!
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Automated Extraction</h1>
        <p className="text-slate-500">Upload documents to instantly extract and log structured data using Gemini 2.5 Flash.</p>
      </div>

      <Uploader onSuccess={handleUploadSuccess} />
      
      <ExtractionTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
