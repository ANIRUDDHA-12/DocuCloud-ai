import { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle2, XCircle, FileImage } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Uploader({ onSuccess }) {
  const { session, user } = useAuth();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict Frontend Validation (Mirroring backend limitations)
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMessage('Only images (JPEG, PNG, WebP) are supported by the AI Vision model.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setStatus('error');
      setErrorMessage('File size must be less than 10MB.');
      return;
    }

    try {
      setStatus('uploading');
      setErrorMessage('');

      // 1. Upload to Supabase Storage (Private Bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Enforced by RLS

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 2. Generate 60-second Signed URL for the backend to fetch securely
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(filePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error('Could not generate secure transmission URL.');
      }

      setStatus('analyzing');

      // 3. Call Serverless Function with JWT Auth Header
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ file_url: signedUrlData.signedUrl })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Server rejected the extraction request.');
      }

      // Success
      setStatus('success');
      
      // Trigger parent component to refresh the data table
      if (onSuccess) onSuccess();

      // Reset UI after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const handleBoxClick = () => {
    if (status === 'idle' || status === 'error') {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">Process Document</h2>
        <p className="text-sm text-slate-500">Upload a receipt or invoice to instantly extract structured data.</p>
      </div>

      <div className="p-6">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg, image/png, image/webp"
          capture="environment" /* Native mobile camera pop */
          className="hidden" 
        />

        <div 
          onClick={handleBoxClick}
          className={`
            border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center
            ${(status === 'idle' || status === 'error') ? 'cursor-pointer hover:bg-slate-50 hover:border-green-400 border-slate-300' : 'cursor-default border-slate-200 bg-slate-50'}
            ${status === 'error' ? 'border-red-300 bg-red-50 hover:bg-red-50 hover:border-red-400' : ''}
            ${status === 'success' ? 'border-green-300 bg-green-50' : ''}
          `}
        >
          {status === 'idle' && (
            <>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-slate-700 mb-1">Click to upload or drag & drop</h3>
              <p className="text-sm text-slate-500">Supports JPEG, PNG, or WebP (Max 10MB)</p>
            </>
          )}

          {status === 'uploading' && (
            <>
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4" />
              <h3 className="text-base font-medium text-slate-700">Uploading securely...</h3>
            </>
          )}

          {status === 'analyzing' && (
            <>
              <div className="relative mb-4">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
              </div>
              <h3 className="text-base font-medium text-slate-700 mb-1">AI is analyzing document</h3>
              <p className="text-sm text-slate-500">Extracting vendor, amounts, and metadata...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-green-800 mb-1">Extraction Complete!</h3>
              <p className="text-sm text-green-600">The data has been saved to your pipeline.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-red-800 mb-1">Processing Failed</h3>
              <p className="text-sm text-red-600 max-w-md">{errorMessage}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
                className="mt-4 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
