import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  FileText, 
  MapPin, 
  Calendar, 
  Download, 
  Lock, 
  Clock, 
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Ban,
  FileSearch,
  Loader2
} from 'lucide-react';

export default function SearchRecord() {
  const { token, user } = useAuth();
  
  // Search parameters state
  const [firNumber, setFirNumber] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [year, setYear] = useState('');
  const [recordType, setRecordType] = useState('All');

  // API states
  const [documents, setDocuments] = useState([]);
  const [requestsMap, setRequestsMap] = useState({}); // docId -> status (Pending, Approved, Rejected)
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores docId being processed
  const [error, setError] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Load user's access requests on component mount
  useEffect(() => {
    fetchUserRequests();
  }, []);

  const fetchUserRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Map requests list to object for O(1) checks
      const reqs = response.data.requests;
      const mapping = {};
      reqs.forEach((r) => {
        // If there are multiple requests, keep the highest priority status (Approved > Pending > Rejected)
        const docId = r.document?._id || r.document;
        if (!mapping[docId] || r.status === 'Approved' || (r.status === 'Pending' && mapping[docId] === 'Rejected')) {
          mapping[docId] = r.status;
        }
      });
      setRequestsMap(mapping);
    } catch (err) {
      console.error('Failed to load user access requests:', err);
    }
  };

  // Perform search queries
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearchInitiated(true);

    try {
      const queryParams = new URLSearchParams();
      if (firNumber) queryParams.append('firNumber', firNumber);
      if (caseNumber) queryParams.append('caseNumber', caseNumber);
      if (district) queryParams.append('district', district);
      if (policeStation) queryParams.append('policeStation', policeStation);
      if (year) queryParams.append('year', year);
      if (recordType && recordType !== 'All') queryParams.append('recordType', recordType);

      const response = await axios.get(`http://localhost:5000/api/documents/search?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDocuments(response.data.documents);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Search execution failed. Verify network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  // Handle request access click (User only)
  const handleRequestAccess = async (docId, caseNumber) => {
    setActionLoading(docId);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/requests', { documentId: docId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state map to prevent re-querying
      setRequestsMap(prev => ({
        ...prev,
        [docId]: 'Pending'
      }));

      // Reload all requests in background
      fetchUserRequests();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Access request failed for document: ${caseNumber}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle secure download click (Admin or User with approved request)
  const handleDownload = async (docId, caseNumber) => {
    setActionLoading(docId);
    setError('');
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      // Handle Blob stream download
      const contentType = response.headers['content-type'] || 'application/pdf';
      let extension = '.pdf';
      if (contentType.includes('png')) extension = '.png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = '.jpg';

      const fileBlob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${caseNumber.replace(/[\/\\]/g, '_')}_verified${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Secure download failed. Confirm permission authority has not been revoked.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    setFirNumber('');
    setCaseNumber('');
    setDistrict('');
    setPoliceStation('');
    setYear('');
    setRecordType('All');
    setDocuments([]);
    setSearchInitiated(false);
    setError('');
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Module Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Search Portal Archival Node</h1>
        <p className="text-xs text-slate-400 mt-1">Filter state registry records by case number, FIR identifiers, or filing jurisdictions.</p>
      </div>

      {/* Advanced Filters Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* FIR Number */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-mono">FIR Identifier</label>
            <input 
              type="text" 
              value={firNumber}
              onChange={(e) => setFirNumber(e.target.value)}
              placeholder="e.g., FIR/0023/2026" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
            />
          </div>

          {/* Case Number */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-mono">Case Reference</label>
            <input 
              type="text" 
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g., CR-891/2026" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
            />
          </div>

          {/* Police Station */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Police Station (Thana)</label>
            <input 
              type="text" 
              value={policeStation}
              onChange={(e) => setPoliceStation(e.target.value)}
              placeholder="e.g., Patna Town PS" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">District</label>
            <input 
              type="text" 
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g., Patna" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* Filing Year */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-mono">Filing Year</label>
            <input 
              type="number" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2026" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
            />
          </div>

          {/* Record Type Classification */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Record Classification</label>
            <select 
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="All">All Categories</option>
              <option value="FIR">First Information Report (FIR)</option>
              <option value="Case Diary">Case Diary (CD)</option>
              <option value="Administrative Order">Administrative Order</option>
              <option value="Charge Sheet">Charge Sheet</option>
              <option value="General Diary">General Diary (GD)</option>
              <option value="Other">Other Miscellaneous Record</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
          <button 
            type="button" 
            onClick={handleClearFilters}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Clear Fields
          </button>
          
          <button 
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Filter Archive</span>
          </button>
        </div>
      </form>

      {/* Error Message Box */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Error:</strong>
            {error}
          </div>
        </div>
      )}

      {/* Query Results Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-wider font-bold text-white">Registry Documents</h3>
          <span className="text-[10px] text-slate-400 font-mono">Found: {documents.length} records</span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Retrieving matching index entries from DB cluster...</p>
          </div>
        ) : !searchInitiated ? (
          /* Landing Empty State */
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FolderOpen className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Entrypoint Ready</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
              Enter query fields in the panel above and click "Filter Archive" to browse verified digital records.
            </p>
          </div>
        ) : documents.length === 0 ? (
          /* Empty Search Results */
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileSearch className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">No Records Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal font-mono">
              Database returned 0 results for queries. Verify file numbers or jurisdiction codes.
            </p>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-4">Classification</th>
                  <th className="p-4">File ID & Reference No.</th>
                  <th className="p-4">Jurisdiction</th>
                  <th className="p-4 font-mono text-center">Year</th>
                  <th className="p-4">Index Keywords</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {documents.map((doc) => {
                  const docId = doc._id;
                  const reqStatus = requestsMap[docId];
                  const isProcessing = actionLoading === docId;

                  return (
                    <tr key={docId} className="hover:bg-slate-900/30 transition-colors">
                      {/* Classification Badge */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                          {doc.recordType}
                        </span>
                      </td>

                      {/* File Ref */}
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-white font-mono">{doc.caseNumber}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.firNumber}</p>
                        </div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="p-4">
                        <div>
                          <p className="text-slate-300">{doc.policeStation}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-600" />
                            {doc.district}
                          </p>
                        </div>
                      </td>

                      {/* Year */}
                      <td className="p-4 text-center font-mono text-slate-400">
                        {doc.year}
                      </td>

                      {/* Keywords */}
                      <td className="p-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {doc.keywords.map((kw, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850/80 text-slate-500 text-[9px] font-mono">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Security Action Controls */}
                      <td className="p-4 text-right">
                        {user.role === 'Admin' ? (
                          /* Admin direct download action */
                          <button
                            onClick={() => handleDownload(docId, doc.caseNumber)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-colors"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-slate-950" />
                            )}
                            <span>Secure Download</span>
                          </button>
                        ) : (
                          /* User Request status checking options */
                          (() => {
                            if (reqStatus === 'Approved') {
                              return (
                                <button
                                  onClick={() => handleDownload(docId, doc.caseNumber)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-colors"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5 text-slate-950" />
                                  )}
                                  <span>Download Copy</span>
                                </button>
                              );
                            }

                            if (reqStatus === 'Pending') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-wider font-bold rounded-lg select-none">
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  Pending Approval
                                </span>
                              );
                            }

                            if (reqStatus === 'Rejected') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-wider font-bold rounded-lg select-none">
                                  <Ban className="w-3.5 h-3.5 text-red-400" />
                                  Access Rejected
                                </span>
                              );
                            }

                            // Not requested access yet
                            return (
                              <button
                                onClick={() => handleRequestAccess(docId, doc.caseNumber)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-all"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                                )}
                                <span>Request Access</span>
                              </button>
                            );
                          })()
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
