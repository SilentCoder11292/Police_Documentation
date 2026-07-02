import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  FileText,
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
      const response = await axios.get('http://localhost:5000/api/requests', {
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
      const response = await axios.patch(`http://localhost:5000/api/requests/${requestId}/status`, { status }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess(response.data.message);
      // Reload requests
      await fetchRequests();
      // Clear success alert after 3 seconds
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
        <h1 className="text-xl font-bold text-white tracking-tight">Access Retrieval Registry</h1>
        <p className="text-xs text-slate-400 mt-1">Review permissions requests and audit historical file release cycles.</p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Error:</strong>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs flex items-start gap-3">
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
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading approval index registries from DB server...</p>
        </div>
      ) : user.role === 'Admin' ? (
        /* ================= ADMIN INTERFACE (INBOX & ARCHIVE) ================= */
        <div className="space-y-6">
          
          {/* Pending Inbox Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-gold-500" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Pending Access Requests Inbox</h3>
              <span className="ml-auto text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-400 font-bold px-2 py-0.5 rounded font-mono">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center text-slate-500 space-y-3 bg-slate-950/20">
                <FolderLock className="w-8 h-8 text-slate-700 mx-auto" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inbox Clear</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                  All requests have been reviewed. No pending security accesses require admin authorization signature.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-800/10 transition-colors">
                    
                    {/* User and File description details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                          {req.document?.recordType || 'Unknown'}
                        </span>
                        <h4 className="text-xs font-bold text-white font-mono">{req.document?.caseNumber || 'N/A'}</h4>
                      </div>

                      <div className="text-slate-400 text-xs space-y-1">
                        <p className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          Requested by: <strong className="text-slate-300 font-mono">{req.requestedBy?.username}</strong> ({req.requestedBy?.role})
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500">
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
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-50 text-red-400 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all"
                      >
                        {actionLoading === req._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XOctagon className="w-3.5 h-3.5" />
                        )}
                        Reject Request
                      </button>

                      <button
                        onClick={() => handleReviewRequest(req._id, 'Approved')}
                        disabled={actionLoading === req._id}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 disabled:opacity-50 text-emerald-400 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Access Review Audits</h3>
            </div>

            {archiveRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-600 text-xs font-mono">
                No past reviews logged in this node.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="p-4">Requested File</th>
                      <th className="p-4">Requestor User</th>
                      <th className="p-4">Review Time</th>
                      <th className="p-4">Signing Officer</th>
                      <th className="p-4 text-right">Review Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/55 text-xs text-slate-350 font-mono">
                    {archiveRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-800/10">
                        <td className="p-4 font-semibold text-slate-200">{req.document?.caseNumber || 'Deleted Document'}</td>
                        <td className="p-4 text-slate-400">{req.requestedBy?.username || 'N/A'}</td>
                        <td className="p-4 text-slate-400">{new Date(req.updatedAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 text-slate-400">{req.reviewedBy?.username || 'System Admin'}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            req.status === 'Approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-white">Your Access Request Tracker</h3>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-950/20">
              <FolderLock className="w-10 h-10 text-slate-700 mx-auto" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">No Requests Submitted</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                You currently have no retrieval requests active. Query the archive registry under **Search Record** to request access permission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Document Details</th>
                    <th className="p-4">Police Station (Thana)</th>
                    <th className="p-4">Filing District</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Reviewing Officer</th>
                    <th className="p-4 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 font-mono">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-200">{req.document?.caseNumber || 'N/A'}</p>
                          <span className="text-[9px] bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-slate-500 uppercase tracking-widest text-[8px] font-bold inline-block mt-1">
                            {req.document?.recordType || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{req.document?.policeStation || 'N/A'}</td>
                      <td className="p-4 text-slate-400">{req.document?.district || 'N/A'}</td>
                      <td className="p-4 text-slate-400">{new Date(req.requestDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-slate-400">{req.reviewedBy?.username || 'Pending Assignment'}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          req.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : req.status === 'Pending' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
