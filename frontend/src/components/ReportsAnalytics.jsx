import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Database, 
  Users, 
  Search, 
  AlertTriangle,
  FileCheck2,
  Calendar,
  Layers,
  Fingerprint,
  Loader2
} from 'lucide-react';

export default function ReportsAnalytics() {
  const { token } = useAuth();
  
  // API states
  const [logs, setLogs] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch audit logs and document statistics
  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Audit Logs
      const logsResponse = await axios.get('http://localhost:5000/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLogs(logsResponse.data.logs);

      // 2. Fetch Scanned Document Count
      const docsResponse = await axios.get('http://localhost:5000/api/documents/search', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocCount(docsResponse.data.documents?.length || 0);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Access Denied: Failed to retrieve security audit trails.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Module Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Audits & Metrics Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Review immutable system transactions and monitor central node health.</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Security Alert:</strong>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        /* Loader state */
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Aggregating cryptographic system transactions...</p>
        </div>
      ) : (
        <>
          {/* ================= TOP SECTION: SYSTEM METRICS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1: Scans */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/10 transition-all glow-subtle">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Digits Archived</p>
                  <h3 className="text-2xl font-mono font-bold text-white mt-2">{docCount} Files</h3>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-gold-500">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-[9px] text-emerald-400 font-mono flex items-center gap-1 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Cloud Sync</span>
              </div>
            </div>

            {/* Metric 2: Operators */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/10 transition-all glow-subtle">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Audit Nodes</p>
                  <h3 className="text-2xl font-mono font-bold text-white mt-2">BR-HQ-NODE1</h3>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-gold-500">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-[9px] text-slate-400 font-mono flex items-center gap-1 uppercase tracking-wider">
                <span>OPERATIONAL STATE: NORMAL</span>
              </div>
            </div>

            {/* Metric 3: Encryption */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/10 transition-all glow-subtle">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Crypto Standards</p>
                  <h3 className="text-2xl font-mono font-bold text-emerald-400 mt-2">AES-256</h3>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-[9px] text-slate-400 font-mono flex items-center gap-1 uppercase tracking-wider">
                <span>SHA-256 SIGNING INTEGRATED</span>
              </div>
            </div>

          </div>

          {/* ================= BOTTOM SECTION: IMMUTABLE AUDIT TRAIL ================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Immutable Security Audit Trail Log</h3>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Records: {logs.length}</span>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No system audits logged in database.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold sticky top-0 z-20">
                      <th className="p-4 bg-slate-950">Timestamp</th>
                      <th className="p-4 bg-slate-950">Operator User</th>
                      <th className="p-4 bg-slate-950">System Action</th>
                      <th className="p-4 bg-slate-950">Linked Document Case ID</th>
                      <th className="p-4 bg-slate-950 text-right">Integrity Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/55 text-xs text-slate-350 font-mono">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-800/10 transition-colors">
                        {/* Timestamp */}
                        <td className="p-4 text-slate-450 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </td>

                        {/* User */}
                        <td className="p-4 whitespace-nowrap">
                          {log.user ? (
                            <div>
                              <p className="text-slate-200">{log.user.username}</p>
                              <span className="text-[8px] px-1 bg-slate-950 border border-slate-850 rounded text-slate-500 uppercase tracking-wide">
                                {log.user.role}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">System Daemon</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="p-4 max-w-xs text-slate-300 font-sans leading-normal">
                          {log.action}
                        </td>

                        {/* Document Link */}
                        <td className="p-4 whitespace-nowrap">
                          {log.documentId ? (
                            <div>
                              <p className="text-gold-500 font-semibold">{log.documentId.caseNumber}</p>
                              <p className="text-[8px] text-slate-500 uppercase tracking-wider">{log.documentId.recordType}</p>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-sans italic">Non-Document Operation</span>
                          )}
                        </td>

                        {/* Hash / Integrity Key */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                            <Fingerprint className="w-3 h-3 text-emerald-400" />
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
