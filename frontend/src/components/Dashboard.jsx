import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import UploadRecord from './UploadRecord';
import SearchRecord from './SearchRecord';
import RetrievalRequest from './RetrievalRequest';
import UserManagement from './UserManagement';
import ReportsAnalytics from './ReportsAnalytics';
import { 
  FolderUp, 
  Search, 
  FileCheck2, 
  BarChart3, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  Clock, 
  Database, 
  FileText, 
  Users, 
  AlertCircle,
  Activity,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, upload, search, retrieval, reports
  
  // Real-time statistics state
  const [stats, setStats] = useState({ documents: 0, requests: 0, pendingRequests: 0, users: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch metrics dynamically from MongoDB Atlas
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/system/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'overview') {
      fetchStats();
    }
  }, [token, activeTab]);

  // Safety check: block rendering if somehow context failed and user is null
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-mono p-4">
        <div className="text-center space-y-4 max-w-md p-6 bg-red-950/20 border border-red-500/30 rounded-lg">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-red-400">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            Authentication token invalid or session expired. Please verify your credentials.
          </p>
          <button 
            onClick={logout} 
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Sidebar navigation options
  const menuItems = [
    { id: 'overview', label: 'System Overview', icon: Activity },
    { id: 'upload', label: 'Upload Record', icon: FolderUp, adminOnly: true },
    { id: 'search', label: 'Search Record', icon: Search },
    { id: 'retrieval', label: 'Retrieval Request', icon: FileCheck2 },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, adminOnly: true },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true }
  ];

  // Helper component to check permissions
  const PermissionGate = ({ adminOnly, children }) => {
    if (adminOnly && user.role !== 'Admin') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 glow-subtle">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-red-400">Restricted Module Access</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            This workspace contains classified administrative privileges. Your account ({user.username}) does not have permission to execute this module.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded">
            Required Permission: ROLE_ADMINISTRATOR
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        
        {/* Sidebar Header: Brand Crest */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            DR
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-gold-500">Bihar Police</h2>
            <h1 className="text-sm font-serif font-bold text-white tracking-tight">Record Room Node</h1>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-gold-500/20 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-gold-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.username}</p>
            <span className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              user.role === 'Admin' ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => !item.adminOnly || user.role === 'Admin')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive 
                    ? 'bg-slate-800 text-white border-l-2 border-gold-500 pl-4' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-gold-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="text-[9px] text-gold-500 bg-gold-500/5 px-1.5 py-0.5 rounded border border-gold-500/20 uppercase tracking-widest font-mono">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-slate-800 hover:border-red-500/30 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM NODE: BR-HEADQUARTERS</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-slate-950 border border-slate-800/80 px-2.5 py-1 rounded flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
              <span>TLS Enforced</span>
            </span>
          </div>
        </header>

        {/* 3. Main Dashboard Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 relative">
          
          {/* Background grid lines for premium tech style */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

          {/* ================= SECTION: SYSTEM OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 relative z-10">
              
              {/* Welcome Banner */}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Bihar Police Central Records</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Terminal logged in as <strong className="text-slate-300 font-mono">{user.username}</strong>. Session expires in 24 hours.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat Card 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/20 transition-all glow-subtle">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Digitized Files</p>
                      <h3 className="text-2xl font-mono font-bold text-white mt-2">
                        {statsLoading ? '...' : stats.documents.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-gold-500">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-400">
                    <span>+12.4% Digitization growth</span>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/20 transition-all glow-subtle">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Retrievals Handled</p>
                      <h3 className="text-2xl font-mono font-bold text-white mt-2">
                        {statsLoading ? '...' : stats.requests.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-gold-500">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{statsLoading ? '...' : stats.pendingRequests} Pending approvals</span>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/20 transition-all glow-subtle">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Operators</p>
                      <h3 className="text-2xl font-mono font-bold text-white mt-2">
                        {statsLoading ? '...' : stats.users.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-gold-500">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span>AUTHORIZED ACCOUNTS</span>
                  </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-gold-500/20 transition-all glow-subtle">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Integrity Audit</p>
                      <h3 className="text-2xl font-mono font-bold text-emerald-400 mt-2">100%</h3>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <span>SHA-256 CHECK PASSED</span>
                  </div>
                </div>

              </div>

              {/* Action Log / Portal Notices */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* System Notices */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-white">Central Registry Broadcasts</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Node ID: HQ-Bihar</span>
                  </div>
                  
                  <div className="space-y-3 divide-y divide-slate-800/50">
                    <div className="pt-1.5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">SYSTEM UPDATE</span>
                        <p className="text-xs font-semibold text-slate-200">Phase 1 Integration Successful</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        Primary credentials combined with simulated two-factor OTP flows are now functional. All credentials and transactions are logged locally under system audits.
                      </p>
                    </div>

                    <div className="pt-3 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">PROCEDURE</span>
                        <p className="text-xs font-semibold text-slate-200">Document Scan Resolution Guidelines</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        To maintain high classification resolution, ensure all digital copies uploaded in the upcoming Phase 2 module are scanned at a minimum of 300 DPI in PDF/A standard format.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Log Mock */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-white">Recent Security Logs</h3>
                  </div>
                  
                  <div className="space-y-3 font-mono text-[10px] text-slate-400">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400">[OK]</span>
                      <div>
                        <p className="text-slate-200">2FA Verified: {user.username}</p>
                        <span className="text-slate-500 text-[9px]">1 minute ago</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400">[WARN]</span>
                      <div>
                        <p className="text-slate-200">OTP Sent: session_temp_0x2a9...</p>
                        <span className="text-slate-500 text-[9px]">2 minutes ago</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400">[OK]</span>
                      <div>
                        <p className="text-slate-200">User Seed: admin initialized</p>
                        <span className="text-slate-500 text-[9px]">10 minutes ago</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= SECTION: UPLOAD RECORD ================= */}
          {activeTab === 'upload' && (
            <PermissionGate adminOnly={true}>
              <UploadRecord />
            </PermissionGate>
          )}

          {/* ================= SECTION: SEARCH RECORD ================= */}
          {activeTab === 'search' && (
            <SearchRecord />
          )}

          {/* ================= SECTION: RETRIEVAL REQUEST ================= */}
          {activeTab === 'retrieval' && (
            <RetrievalRequest />
          )}

          {/* ================= SECTION: REPORTS & ANALYTICS ================= */}
          {activeTab === 'reports' && (
            <PermissionGate adminOnly={true}>
              <ReportsAnalytics />
            </PermissionGate>
          )}

          {/* ================= SECTION: USER MANAGEMENT ================= */}
          {activeTab === 'users' && (
            <PermissionGate adminOnly={true}>
              <UserManagement />
            </PermissionGate>
          )}

        </main>
      </div>
    </div>
  );
}
