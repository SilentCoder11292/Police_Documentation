/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · component: SearchRecord · genre: modern-minimal · theme: custom
 * contrast: pass (40-41) · slop: pass (42-45)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Search, 
  MapPin, 
  Download, 
  Lock, 
  Clock, 
  AlertTriangle,
  Ban,
  Loader2,
  FileCheck2
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
      const response = await axios.get(`${API_BASE}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Map requests list to object for O(1) checks
      const mapping = {};
      response.data.requests.forEach((req) => {
        if (req.documentId) {
          mapping[req.documentId._id] = req.status;
        }
      });
      setRequestsMap(mapping);
    } catch (err) {
      console.error('Failed to load user access requests map:', err);
    }
  };

  // Submit search query to Express API
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

      const response = await axios.get(`${API_BASE}/api/documents/search?${queryParams.toString()}`, {
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
      await axios.post(`${API_BASE}/api/requests`, { documentId: docId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local requests state mapping to Pending
      setRequestsMap((prev) => ({
        ...prev,
        [docId]: 'Pending'
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to submit access request for ${caseNumber}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Secure download operations
  const handleDownload = async (docId, caseNumber) => {
    setActionLoading(docId);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/documents/${docId}/download`, {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-serif">Search Portal Archival Node</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Filter state registry records by case number, FIR identifiers, or filing jurisdictions.</p>
      </div>

      {/* Advanced Filters Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-5 shadow-sm transition-colors">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* FIR Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 font-mono">FIR Identifier</label>
            <input 
              type="text" 
              value={firNumber}
              onChange={(e) => setFirNumber(e.target.value)}
              placeholder="e.g., FIR/0023/2026" 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Case Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 font-mono">Case Reference</label>
            <input 
              type="text" 
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g., CR-891/2026" 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Police Station */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Police Station (Thana)</label>
            <input 
              type="text" 
              value={policeStation}
              onChange={(e) => setPoliceStation(e.target.value)}
              placeholder="e.g., Patna Town PS" 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">District</label>
            <input 
              type="text" 
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g., Patna" 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          {/* Filing Year */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 font-mono">Filing Year</label>
            <input 
              type="number" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2026" 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Record Type Classification */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Record Classification</label>
            <select 
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-police-500 dark:focus:border-police-400 focus:ring-1 focus:ring-police-500 dark:focus:ring-police-400 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none transition-all"
            >
              <option value="All">All Categories</option>
              <option value="FIR">First Information Report (FIR)</option>
              <option value="Case Diary">Case Diary (CD)</option>
              <option value="Administrative Order">Administrative Order</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-5 py-3 border border-gray-250 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            Clear Filters
          </button>
          
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-police-700 to-police-600 dark:from-police-500 dark:to-police-400 hover:from-police-600 hover:to-police-500 dark:hover:from-police-400 dark:hover:to-police-300 text-white dark:text-gray-950 font-bold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Filter Archive</span>
          </button>
        </div>

      </form>

      {/* Global Errors Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Filing System Message:</strong>
            {error}
          </div>
        </div>
      )}

      {/* Search Output Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm transition-colors">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-police-600 dark:text-police-400" />
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-900 dark:text-white">Query Results Registry</h3>
          <span className="ml-auto text-xs text-gray-700 dark:text-gray-300 font-mono">Found: {documents.length} Records</span>
        </div>

        {loading ? (
          /* Loading overlay skeleton */
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-police-600 dark:text-police-400 mx-auto" />
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">Querying Central State Database...</p>
          </div>
        ) : !searchInitiated ? (
          <div className="p-12 text-center text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto space-y-2">
            <Search className="w-8 h-8 mx-auto text-gray-700 dark:text-gray-300" />
            <p>Ready to search. Use the input parameters above to filter the digital record room archives.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-gray-700 dark:text-gray-300" />
            <p>No matching case files found inside Patna Headquarter Node registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider font-bold">
                  <th className="p-4">Classification</th>
                  <th className="p-4">Case Identifiers</th>
                  <th className="p-4">Filing Jurisdiction</th>
                  <th className="p-4 text-center">Filing Year</th>
                  <th className="p-4">Index Keys</th>
                  <th className="p-4 text-right">Filing Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-850 dark:text-gray-350">
                {documents.map((doc) => {
                  const docId = doc._id;
                  const reqStatus = requestsMap[docId];
                  const isProcessing = actionLoading === docId;

                  return (
                    <tr key={docId} className="hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
                      {/* Classification Badge */}
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-950 border border-gray-205 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                          {doc.recordType}
                        </span>
                      </td>

                      {/* File Ref */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white font-mono">{doc.caseNumber}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-mono mt-0.5">{doc.firNumber}</p>
                        </div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="p-4">
                        <div>
                          <p className="text-gray-900 dark:text-white font-semibold">{doc.policeStation}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            {doc.district}
                          </p>
                        </div>
                      </td>

                      {/* Year */}
                      <td className="p-4 text-center font-mono text-gray-900 dark:text-white font-bold">
                        {doc.year}
                      </td>

                      {/* Keywords */}
                      <td className="p-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {doc.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-mono font-medium">
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
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
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                  <span>Download Copy</span>
                                </button>
                              );
                            }

                            if (reqStatus === 'Pending') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 text-xs uppercase tracking-wider font-bold rounded-xl select-none">
                                  <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 animate-pulse" />
                                  Pending Approval
                                </span>
                              );
                            }

                            if (reqStatus === 'Rejected') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-400 text-xs uppercase tracking-wider font-bold rounded-xl select-none">
                                  <Ban className="w-3.5 h-3.5" />
                                  Access Rejected
                                </span>
                              );
                            }

                            // Not requested access yet
                            return (
                              <button
                                onClick={() => handleRequestAccess(docId, doc.caseNumber)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-police-700 to-police-600 dark:from-police-500 dark:to-police-400 hover:from-police-600 hover:to-police-500 dark:hover:from-police-450 dark:hover:to-police-350 disabled:opacity-50 text-white dark:text-slate-955 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-[0.98] transition-all"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" />
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
