/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · component: RetrievalRequest · genre: modern-minimal · theme: custom
 * contrast: pass (40-41) · slop: pass (42-45)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Inbox, 
  UserCheck, 
  XOctagon, 
  Clock, 
  AlertTriangle,
  FolderLock,
  FileCheck2,
  Calendar,
  History,
  CheckCircle,
  User as UserIcon,
  Loader2
} from 'lucide-react';

export default function RetrievalRequest() {
  const { token, user } = useAuth();
  
  // API states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores request ID being updated
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch retrieval requests on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRequests(response.data.requests);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch access retrieval logs.');
    } finally {
      setLoading(false);
    }
  };

  // Admin action: approve or reject a request
  const handleReviewRequest = async (requestId, status) => {
    setActionLoading(requestId);
    setError('');
    setSuccess('');
    try {
      const response = await axios.patch(`${API_BASE}/api/requests/${requestId}/status`, { status }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess(response.data.message);
      await fetchRequests(); // Reload requests
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} request.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Split requests into Pending and Decided for Admin Inbox sorting
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const archiveRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight font-serif">Access Retrieval Registry</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review permissions requests and audit historical file release cycles.</p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-red-200 dark:border-red-900 text-red-700 dark:text-red-405 p-4 rounded-lg text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Error:</strong>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-green-200 dark:border-green-800 text-green-700 dark:text-green-405 p-4 rounded-lg text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Verification Node:</strong>
            {success}
          </div>
        </div>
      )}

      {loading ? (
        /* Loader state */
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Loading approval index registries from DB server...</p>
        </div>
      ) : user.role === 'Admin' ? (
        /* ================= ADMIN INTERFACE (INBOX & ARCHIVE) ================= */
        <div className="space-y-6">
          
          {/* Pending Inbox Section */}
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] flex items-center gap-2">
              <Inbox className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Pending Access Requests Inbox</h3>
              <span className="ml-auto text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-black dark:text-gray-300 dark:border-gray-800 font-bold px-2.5 py-0.5 rounded-full font-mono border">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center text-gray-600 dark:text-gray-400 space-y-3 bg-gray-50 dark:bg-black">
                <FolderLock className="w-10 h-10 text-gray-600 dark:text-gray-450 mx-auto" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Inbox Clear</h4>
                <p className="text-sm text-gray-655 dark:text-gray-450 max-w-sm mx-auto leading-relaxed">
                  All requests have been reviewed. No pending security accesses require admin authorization signature.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#111]/30 transition-colors">
                    
                    {/* User and File description details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-black uppercase tracking-wider">
                          {req.document?.recordType || 'Unknown'}
                        </span>
                        <h4 className="text-sm font-bold text-black dark:text-white font-mono">{req.document?.caseNumber || 'N/A'}</h4>
                      </div>

                      <div className="text-gray-600 dark:text-gray-400 text-xs space-y-1">
                        <p className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                          Requested by: <strong className="text-black dark:text-white font-mono">{req.requestedBy?.username}</strong> ({req.requestedBy?.role})
                        </p>
                        <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-450">
                          <Calendar className="w-3.5 h-3.5" />
                          Filing Date: {new Date(req.requestDate).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReviewRequest(req._id, 'Rejected')}
                        disabled={actionLoading === req._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 text-red-700 dark:text-red-405 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm"
                      >
                        {actionLoading === req._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XOctagon className="w-3.5 h-3.5" />
                        )}
                        Reject
                      </button>

                      <button
                        onClick={() => handleReviewRequest(req._id, 'Approved')}
                        disabled={actionLoading === req._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-gray-850 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-[0.99]"
                      >
                        {actionLoading === req._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                        Approve Access
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Archive Decisions Section */}
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] flex items-center gap-2">
              <History className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Access Review Audits</h3>
            </div>

            {archiveRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-655 dark:text-gray-400 text-sm font-mono">
                No past reviews logged in this node.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800 text-xs text-gray-655 dark:text-gray-400 uppercase tracking-wider font-bold">
                      <th className="p-4">Requested File</th>
                      <th className="p-4">Requestor User</th>
                      <th className="p-4">Review Time</th>
                      <th className="p-4">Signing Officer</th>
                      <th className="p-4 text-right">Review Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-805 text-sm text-black dark:text-gray-300 font-mono">
                    {archiveRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-[#111]/30 transition-colors">
                        <td className="p-4 font-bold text-black dark:text-white">{req.document?.caseNumber || 'Deleted Document'}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{req.requestedBy?.username || 'N/A'}</td>
                        <td className="p-4 text-gray-500 dark:text-gray-450 font-mono">{new Date(req.updatedAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{req.reviewedBy?.username || 'System Admin'}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            req.status === 'Approved' 
                              ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:bg-green-950/20' 
                              : 'border-red-200 text-red-700 bg-red-50 dark:border-red-900/50 dark:text-red-405 dark:bg-red-950/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ================= USER INTERFACE (TIMELINE TRACKER) ================= */
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] flex items-center gap-2">
            <Clock className="w-4 h-4 text-black dark:text-white" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Your Access Request Tracker</h3>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-gray-600 dark:text-gray-400 space-y-3 bg-gray-50 dark:bg-black">
              <FolderLock className="w-10 h-10 text-gray-600 dark:text-gray-450 mx-auto" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">No Requests Submitted</h4>
              <p className="text-sm text-gray-655 dark:text-gray-450 max-w-sm mx-auto leading-relaxed">
                You currently have no retrieval requests active. Query the archive registry under **Search Record** to request access permission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider font-bold">
                    <th className="p-4">Document Details</th>
                    <th className="p-4">Police Station (Thana)</th>
                    <th className="p-4">Filing District</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Reviewing Officer</th>
                    <th className="p-4 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm text-black dark:text-gray-300 font-mono">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-[#111]/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-black dark:text-white">{req.document?.caseNumber || 'N/A'}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-black uppercase tracking-wider font-sans mt-1">
                            {req.document?.recordType || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-black dark:text-white font-sans">{req.document?.policeStation || 'N/A'}</td>
                      <td className="p-4 text-black dark:text-white font-sans">{req.document?.district || 'N/A'}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(req.requestDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-black dark:text-white font-sans">{req.reviewedBy?.username || 'Pending Assignment'}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          req.status === 'Approved' 
                            ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-900/50 dark:text-green-405 dark:bg-green-950/20' 
                            : req.status === 'Pending' 
                            ? 'border-amber-200 text-amber-850 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-955/20'
                            : 'border-red-200 text-red-700 bg-red-50 dark:border-red-900/50 dark:text-red-405 dark:bg-red-950/20'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
