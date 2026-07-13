import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  AlertTriangle, 
  Loader2, 
  FileCheck2, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  Cpu, 
  FileSearch,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function AISummarizer() {
  const { token, user } = useAuth();
  
  // Tab control: 'registry' vs 'quick'
  const [activeSubTab, setActiveSubTab] = useState('registry');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tab 1: Registry states
  const [documents, setDocuments] = useState([]);
  const [requestsMap, setRequestsMap] = useState({});
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [summaryOutput, setSummaryOutput] = useState('');
  const [summaryMeta, setSummaryMeta] = useState(null);

  // Tab 2: Quick Summarizer states
  const [quickFile, setQuickFile] = useState(null);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickSummary, setQuickSummary] = useState('');
  const fileInputRef = useRef(null);

  // Load documents and permissions on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update selected doc details when dropdown selection changes
  useEffect(() => {
    if (selectedDocId) {
      const doc = documents.find(d => d._id === selectedDocId);
      setSelectedDoc(doc);
      if (doc) {
        setSummaryOutput(doc.summary || '');
        setSummaryMeta(doc.summaryGeneratedAt ? { generatedAt: doc.summaryGeneratedAt } : null);
      }
    } else {
      setSelectedDoc(null);
      setSummaryOutput('');
      setSummaryMeta(null);
    }
  }, [selectedDocId, documents]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch user's access requests to compile RBAC map
      const reqResponse = await axios.get(`${API_BASE}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqMapping = {};
      reqResponse.data.requests.forEach((req) => {
        if (req.documentId) {
          reqMapping[req.documentId._id] = req.status;
        }
      });
      setRequestsMap(reqMapping);

      // 2. Fetch all registry documents
      const docResponse = await axios.get(`${API_BASE}/api/documents/search`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // 3. Filter documents based on permissions:
      // Admin accesses everything. Users only access documents with Status === 'Approved'.
      const allDocs = docResponse.data.documents || [];
      const accessible = allDocs.filter(
        doc => user.role === 'Admin' || reqMapping[doc._id] === 'Approved'
      );
      
      setDocuments(accessible);
    } catch (err) {
      console.error(err);
      setError('System Error: Failed to synchronize centralized record room access directory.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Gemini summary for registry document
  const handleGenerateRegistrySummary = async (e) => {
    e.preventDefault();
    if (!selectedDocId) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_BASE}/api/ai/summarize/${selectedDocId}`,
        { customPrompt },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const { summary, summaryGeneratedAt, cached } = response.data;
      setSummaryOutput(summary);
      setSummaryMeta({ generatedAt: summaryGeneratedAt, cached });

      // Update document list with cached summary to prevent reload triggers
      setDocuments(prev => prev.map(d => {
        if (d._id === selectedDocId) {
          return { ...d, summary, summaryGeneratedAt };
        }
        return d;
      }));

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'AI processing request failed. Verify central node connectivity.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Summarizer file selection handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetQuickFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetQuickFile(e.target.files[0]);
    }
  };

  const validateAndSetQuickFile = (selectedFile) => {
    setError('');
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid File Format: Only standard PDFs and JPEGs/PNGs are permitted.');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File Limit Exceeded: AI gateway inputs are limited to 25MB.');
      return;
    }
    setQuickFile(selectedFile);
  };

  // Trigger quick file upload & summarization on-the-fly
  const handleGenerateQuickSummary = async (e) => {
    e.preventDefault();
    if (!quickFile) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', quickFile);
    if (quickPrompt) {
      formData.append('customPrompt', quickPrompt);
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/ai/summarize-file`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setQuickSummary(response.data.summary);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Quick AI Analysis failed. Please confirm file validity.');
    } finally {
      setLoading(false);
    }
  };

  const clearQuickSummarizer = () => {
    setQuickFile(null);
    setQuickSummary('');
    setQuickPrompt('');
    setError('');
  };

  return (
    <div className="space-y-6 relative z-10 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight font-serif flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-police-500 dark:text-police-400" />
            AI Document Summarizer
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Leverage LLM intelligence to automatically extract case details, IPC charges, suspects, and event timelines.
          </p>
        </div>

        {/* Mode Selector Tab Group */}
        <div className="flex p-0.5 bg-gray-105 bg-gray-200/50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg shrink-0">
          <button
            onClick={() => { setActiveSubTab('registry'); setError(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold select-none transition-all ${
              activeSubTab === 'registry'
                ? 'bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Central Room Records
          </button>
          <button
            onClick={() => { setActiveSubTab('quick'); setError(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold select-none transition-all ${
              activeSubTab === 'quick'
                ? 'bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Quick File Summarizer
          </button>
        </div>
      </div>

      {/* Global System Errors */}
      {error && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-red-200 dark:border-red-900 text-red-750 dark:text-red-400 p-4 rounded-lg text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Filing Gate Alert:</strong>
            {error}
          </div>
        </div>
      )}

      {/* ================= MODE 1: CENTRAL ROOM RECORDS ================= */}
      {activeSubTab === 'registry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Card */}
          <div className="lg:col-span-1 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-5 space-y-4 h-fit transition-colors">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
              <Cpu className="w-4 h-4 text-police-500 dark:text-police-400" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Analysis Parameters</h3>
            </div>

            <form onSubmit={handleGenerateRegistrySummary} className="space-y-4">
              {/* Document Dropdown Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Select Digitized Case File
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg p-3 text-sm text-gray-850 dark:text-gray-200 focus:outline-none transition-all"
                >
                  <option value="" className="bg-white dark:bg-[#0a0a0a]">-- Select Accessible Record --</option>
                  {documents.map((doc) => (
                    <option key={doc._id} value={doc._id} className="bg-white dark:bg-[#0a0a0a]">
                      [{doc.recordType}] {doc.caseNumber} - {doc.policeStation} ({doc.year})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  Only documents you have verified cryptographic clearance (Approved Request) or administrative privileges (Admin role) to view will populate.
                </p>
              </div>

              {/* Selected Document Specs Summary Card */}
              {selectedDoc && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2 text-xs">
                  <p className="font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>Filing Year:</span>
                    <strong className="text-black dark:text-white font-mono">{selectedDoc.year}</strong>
                  </p>
                  <p className="font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>Police Station:</span>
                    <strong className="text-black dark:text-white truncate max-w-[150px]">{selectedDoc.policeStation}</strong>
                  </p>
                  <p className="font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>District:</span>
                    <strong className="text-black dark:text-white">{selectedDoc.district}</strong>
                  </p>
                  <p className="font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>Digital Signature SHA-256:</span>
                    <strong className="text-black dark:text-white font-mono truncate max-w-[100px]" title={selectedDoc.digitalSignature}>
                      {selectedDoc.digitalSignature}
                    </strong>
                  </p>
                </div>
              )}

              {/* Developer Custom System Focus Prompt */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Developer / Guidance Focus (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Extract specific details on accused suspects and charge sections specifically."
                  rows="3"
                  className="w-full bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg p-3 text-sm text-black dark:text-white placeholder-gray-450 dark:placeholder-gray-600 focus:outline-none transition-all resize-none font-sans"
                />
              </div>

              {/* Trigger Button */}
              <button
                type="submit"
                disabled={loading || !selectedDocId}
                className="w-full py-2.5 bg-black hover:bg-gray-850 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs uppercase tracking-wider font-extrabold rounded-lg disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing File Stream...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Summary Output */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 min-h-[400px] transition-colors relative flex flex-col justify-between">
            <div>
              {/* Output Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4.5 h-4.5 text-black dark:text-white" />
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Forensic summary output</h3>
                </div>
                {summaryMeta && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                    {summaryMeta.cached ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Served from Cache
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse text-police-500" />
                        AI Fresh Render
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Render Output Summary Text */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-police-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200">Retrieving case record binary stream...</p>
                    <p className="text-xs text-gray-500 max-w-xs font-sans">
                      Converting PDF structures and performing LLM inference analysis. This may take up to 10 seconds.
                    </p>
                  </div>
                </div>
              ) : summaryOutput ? (
                /* Dynamic HTML Rendering from Gemini output */
                <div 
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-800 dark:text-gray-300 py-4 space-y-4 
                  prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-wider prose-h3:text-black dark:prose-h3:text-white prose-h3:border-l-2 prose-h3:border-police-500 prose-h3:pl-2 prose-h3:mt-6
                  prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-strong:text-black dark:prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: summaryOutput }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 text-gray-500">
                  <FileSearch className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No AI analysis generated yet</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
                    Select a digitized police document from the left control parameters panel and click "Generate AI Analysis".
                  </p>
                </div>
              )}
            </div>

            {/* Summary Metadata Footer */}
            {summaryMeta && summaryOutput && !loading && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6 text-[10px] text-gray-600 dark:text-gray-400 font-mono flex items-center justify-between">
                <span>ANALYSIS PROTOCOL: GEMINI_1.5_FLASH</span>
                <span>GENERATED: {new Date(summaryMeta.generatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= MODE 2: QUICK FILE SUMMARIZER ================= */}
      {activeSubTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Uploader Card */}
          <div className="lg:col-span-1 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-5 space-y-4 h-fit transition-colors">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
              <Upload className="w-4 h-4 text-police-500 dark:text-police-400" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Upload Document</h3>
            </div>

            {!quickFile ? (
              /* Drag & Drop Target Area */
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-black dark:border-gray-800 dark:hover:border-white rounded-lg p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="p-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg group-hover:scale-[1.02] transition-all">
                  <Upload className="w-6 h-6 text-gray-550 dark:text-gray-450" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">Drag & drop police file here</p>
                  <p className="text-[10px] text-gray-500 mt-1">PDF, JPG, JPEG, or PNG (Max 25MB)</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white text-[10px] font-extrabold tracking-wider uppercase rounded-lg bg-white dark:bg-black dark:text-white transition-all active:scale-[0.99]"
                >
                  Select File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
              </div>
            ) : (
              /* Selected File Details */
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shrink-0 text-black dark:text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-black dark:text-white truncate">{quickFile.name}</p>
                    <p className="text-[10px] text-gray-650 dark:text-gray-400 font-mono mt-0.5">
                      {(quickFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearQuickSummarizer}
                  disabled={loading}
                  className="p-1 border border-gray-200 hover:border-black dark:border-gray-800 dark:hover:border-white rounded-md text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-all shrink-0 active:scale-[0.98]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Custom Focus Prompts */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Custom Focus prompt (Optional)
              </label>
              <textarea
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="e.g., Summarize only IPC sections violated and the names of the accused."
                rows="3"
                className="w-full bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg p-3 text-sm text-black dark:text-white placeholder-gray-450 dark:placeholder-gray-600 focus:outline-none transition-all resize-none font-sans"
              />
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleGenerateQuickSummary}
              disabled={loading || !quickFile}
              className="w-full py-2.5 bg-black hover:bg-gray-850 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs uppercase tracking-wider font-extrabold rounded-lg disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Temporary File...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Summarize File</span>
                </>
              )}
            </button>
          </div>

          {/* Output Results Container */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 min-h-[400px] transition-colors relative flex flex-col justify-between">
            <div>
              {/* Output Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4.5 h-4.5 text-black dark:text-white" />
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Extracted Analysis Summary</h3>
                </div>
                {quickSummary && !loading && (
                  <button
                    onClick={clearQuickSummarizer}
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-black dark:hover:text-white border border-gray-250 hover:border-black dark:border-gray-800 dark:hover:border-white px-2 py-0.5 rounded-md transition-all font-mono"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Analyzer
                  </button>
                )}
              </div>

              {/* Summary Text Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-police-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200">Streaming document data to Gemini AI Gateway...</p>
                    <p className="text-xs text-gray-500 max-w-xs font-sans">
                      Analyzing structures and running optical character extraction. This temporary file is not written to the central central room index.
                    </p>
                  </div>
                </div>
              ) : quickSummary ? (
                <div 
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-800 dark:text-gray-300 py-4 space-y-4 
                  prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-wider prose-h3:text-black dark:prose-h3:text-white prose-h3:border-l-2 prose-h3:border-police-500 prose-h3:pl-2 prose-h3:mt-6
                  prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-strong:text-black dark:prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: quickSummary }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 text-gray-500">
                  <Upload className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Awaiting document upload</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
                    Upload a local police FIR or case record file. The summary will display in real time without persisting file data.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Metadata */}
            {quickSummary && !loading && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6 text-[10px] text-gray-600 dark:text-gray-400 font-mono flex items-center justify-between">
                <span>GATEWAY SECURITY: DISPOSABLE_TEMP_STREAM</span>
                <span>STATUS: DIGITALLY DIGESTED</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
