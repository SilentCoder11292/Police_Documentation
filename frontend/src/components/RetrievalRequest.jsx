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
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight font-serif">Access Retrieval Registry</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review permissions requests and audit historical file release cycles.</p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Error:</strong>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
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
          <Loader2 className="w-8 h-8 animate-spin text-police-600 dark:text-gold-500 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Loading approval index registries from DB server...</p>
        </div>
      ) : user.role === 'Admin' ? (
        /* ================= ADMIN INTERFACE (INBOX & ARCHIVE) ================= */
        <div className="space-y-6">
          
          {/* Pending Inbox Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-police-600 dark:text-gold-500" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-950 dark:text-white">Pending Access Requests Inbox</h3>
              <span className="ml-auto text-xs bg-police-50 dark:bg-gold-500/10 border border-police-100 dark:border-gold-500/30 text-police-700 dark:text-gold-450 font-bold px-2.5 py-0.5 rounded-md font-mono">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                <FolderLock className="w-10 h-10 text-slate-400 dark:text-slate-650 mx-auto" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inbox Clear</h4>
                <p className="text-sm text-slate-500 dark:text-slate-450 max-w-sm mx-auto leading-relaxed">
                  All requests have been reviewed. No pending security accesses require admin authorization signature.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    
                    {/* User and File description details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-450 font-bold uppercase tracking-wider text-[10px]">
                          {req.document?.recordType || 'Unknown'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{req.document?.caseNumber || 'N/A'}</h4>
                      </div>

                      <div className="text-slate-650 dark:text-slate-400 text-xs space-y-1">
                        <p className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          Requested by: <strong className="text-slate-800 dark:text-slate-300 font-mono">{req.requestedBy?.username}</strong> ({req.requestedBy?.role})
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-500">
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
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 text-red-650 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
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
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-650 hover:bg-emerald-500 disabled:opacity-50 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-emerald-500/25 active:scale-[0.98]"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
              <History className="w-4 h-4 text-police-600 dark:text-gold-500" />
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 dark:text-white">Access Review Audits</h3>
            </div>

            {archiveRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-mono">
                No past reviews logged in this node.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                      <th className="p-4">Requested File</th>
                      <th className="p-4">Requestor User</th>
                      <th className="p-4">Review Time</th>
                      <th className="p-4">Signing Officer</th>
                      <th className="p-4 text-right">Review Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-350 font-mono">
                    {archiveRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{req.document?.caseNumber || 'Deleted Document'}</td>
                        <td className="p-4 text-slate-650 dark:text-slate-400">{req.requestedBy?.username || 'N/A'}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{new Date(req.updatedAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 text-slate-650 dark:text-slate-400">{req.reviewedBy?.username || 'System Admin'}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'Approved' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-police-600 dark:text-gold-500" />
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 dark:text-white">Your Access Request Tracker</h3>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
              <FolderLock className="w-10 h-10 text-slate-450 dark:text-slate-650 mx-auto" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">No Requests Submitted</h4>
              <p className="text-sm text-slate-500 dark:text-slate-450 max-w-sm mx-auto leading-relaxed">
                You currently have no retrieval requests active. Query the archive registry under **Search Record** to request access permission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-150 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                    <th className="p-4">Document Details</th>
                    <th className="p-4">Police Station (Thana)</th>
                    <th className="p-4">Filing District</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Reviewing Officer</th>
                    <th className="p-4 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300 font-mono">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{req.document?.caseNumber || 'N/A'}</p>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-450 uppercase tracking-wider font-bold inline-block mt-1 font-sans">
                            {req.document?.recordType || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-650 dark:text-slate-450 font-sans">{req.document?.policeStation || 'N/A'}</td>
                      <td className="p-4 text-slate-655 dark:text-slate-455 font-sans">{req.document?.district || 'N/A'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-450">{new Date(req.requestDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-slate-655 dark:text-slate-450 font-sans">{req.reviewedBy?.username || 'Pending Assignment'}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'Approved' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : req.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            : 'bg-red-105 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
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
