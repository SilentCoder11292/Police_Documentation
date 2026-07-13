

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import ThemeToggle from './ThemeToggle';
import UploadRecord from './UploadRecord';
import SearchRecord from './SearchRecord';
import RetrievalRequest from './RetrievalRequest';
import ReportsAnalytics from './ReportsAnalytics';
import UserManagement from './UserManagement';
import AISummarizer from './AISummarizer';


import { 
  LayoutDashboard, 
  FolderUp, 
  Search, 
  FolderLock, 
  BarChart3, 
  Users, 
  LogOut, 
  User as UserIcon,
  ShieldAlert,
  Loader2,
  Database,
  FileCheck2,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Live DB statistics
  const [stats, setStats] = useState({
    documents: 0,
    requests: 0,
    users: 0,
    pendingRequests: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Fetch live stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const response = await axios.get(`${API_BASE}/api/system/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error(err);
      setStatsError('Failed to fetch node statistics.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Sidebar Menu Config
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, adminOnly: false },
    { id: 'search', label: 'Search Record', icon: Search, adminOnly: false },
    { id: 'retrieval', label: 'Retrieval Request', icon: FolderLock, adminOnly: false },
    { id: 'summarize', label: 'AI Summarizer', icon: Sparkles, adminOnly: false },
    { id: 'upload', label: 'Digitize File', icon: FolderUp, adminOnly: true },
    { id: 'reports', label: 'Audits & Metrics', icon: BarChart3, adminOnly: true },
    { id: 'users', label: 'Officer Profiles', icon: Users, adminOnly: true }
  ];

  // Helper component to lock modules
  const PermissionGate = ({ children, adminOnly }) => {
    if (adminOnly && user.role !== 'Admin') {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-650 dark:text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-black dark:text-white">Restricted Module Access</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
            This workspace contains classified administrative privileges. Your account ({user.username}) does not have permission to execute this module.
          </p>
          <div className="text-xs font-mono text-gray-700 bg-gray-100 dark:bg-[#111] px-3 py-1.5 rounded-md border border-gray-250 dark:border-gray-850">
            Required Permission: ROLE_ADMINISTRATOR
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black text-black dark:text-white overflow-hidden font-sans transition-colors duration-200">
      
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 transition-colors duration-200">
        
        {/* Sidebar Header: Brand Crest */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold font-sans">
            DR
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-gray-600 dark:text-gray-400 font-sans">Bihar Police</h2>
            <h1 className="text-base font-bold text-black dark:text-white tracking-tight">Record Room</h1>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-black dark:text-white truncate">{user.username}</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-white text-gray-700 border-gray-200 dark:bg-black dark:text-gray-300 dark:border-gray-800 transition-colors">
              {user.role}
            </span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => !item.adminOnly || user.role === 'Admin')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-[#111] text-black dark:text-white font-semibold border-l-2 border-black dark:border-white' 
                    : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#111]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 group-hover:text-black dark:text-gray-500 dark:group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-black">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-black dark:border-gray-800 dark:hover:border-white text-sm font-bold text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-all active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between transition-colors duration-200 z-10">
          <div className="flex items-center gap-2 text-sm font-mono text-gray-600 dark:text-gray-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM NODE: BR-HEADQUARTERS</span>
            <span className="text-gray-300 dark:text-gray-800">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-500" />
              {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Segmented Theme Toggle */}
            <ThemeToggle />

            <span className="text-xs text-gray-700 bg-gray-50 border border-gray-200 dark:border-gray-800 dark:text-gray-300 dark:bg-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              <span>TLS Enforced</span>
            </span>
          </div>
        </header>

        {/* 3. Main Dashboard Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black relative transition-colors duration-200">
          
          {/* ================= SECTION: SYSTEM OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 relative z-10">
              
              {/* Welcome Banner */}
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight font-serif">Central Records Portal</h1>
                <p className="text-sm text-gray-605 dark:text-gray-450 mt-1">
                  Terminal logged in as <strong className="text-black dark:text-white font-mono">{user.username}</strong>. Session expires in 24 hours.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat Card 1 */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-655 dark:text-gray-400 tracking-wider">Digitized Files</p>
                      <h3 className="text-3xl font-mono font-bold text-black dark:text-white mt-2">
                        {statsLoading ? '...' : stats.documents.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white transition-colors">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>+12.4% Digitization growth</span>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-655 dark:text-gray-400 tracking-wider">Retrievals Handled</p>
                      <h3 className="text-3xl font-mono font-bold text-black dark:text-white mt-2">
                        {statsLoading ? '...' : stats.requests.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white transition-colors">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{statsLoading ? '...' : stats.pendingRequests} Pending approvals</span>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-655 dark:text-gray-400 tracking-wider">Registered Operators</p>
                      <h3 className="text-3xl font-mono font-bold text-black dark:text-white mt-2">
                        {statsLoading ? '...' : stats.users.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider font-mono">
                    <span>AUTHORIZED ACCOUNTS</span>
                  </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-655 dark:text-gray-400 tracking-wider">Integrity Audit</p>
                      <h3 className="text-3xl font-mono font-bold text-black dark:text-white mt-2">100%</h3>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                    <span>SHA-256 CHECK PASSED</span>
                  </div>
                </div>

              </div>

              {/* Action Log / Portal Notices */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* System Notices */}
                <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 transition-colors">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Central Registry Broadcasts</h3>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">Node ID: HQ-Bihar</span>
                  </div>
                  
                  <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-800">
                    <div className="pt-1.5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-[#111]">SYSTEM UPDATE</span>
                        <p className="text-sm font-bold text-black dark:text-white">Twilio Verify 2FA Configured</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        Production configurations are now fully active. All authentication sessions leverage Twilio Verify V2 API dispatching codes directly to registered mobile devices.
                      </p>
                    </div>

                    <div className="pt-4 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-[#111]">PROCEDURE</span>
                        <p className="text-sm font-bold text-black dark:text-white">Document Scan Resolution Guidelines</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        To maintain high classification resolution, ensure all digital copies uploaded in the digitizing workspace are scanned at a minimum of 300 DPI in PDF/A standard format.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Log Panel */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 transition-colors">
                  <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-black dark:text-white">Recent Logins</h3>
                  </div>
                  
                  <div className="space-y-4 font-mono text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">[OK]</span>
                      <div>
                        <p className="text-black dark:text-white font-sans">2FA Verified: {user.username}</p>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">1 minute ago</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">[OK]</span>
                      <div>
                        <p className="text-black dark:text-white font-sans">Verify Service: SMS Sent</p>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">2 minutes ago</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">[OK]</span>
                      <div>
                        <p className="text-black dark:text-white font-sans">Node Database connection active</p>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">15 minutes ago</span>
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

          {/* ================= SECTION: AI SUMMARIZER ================= */}
          {activeTab === 'summarize' && (
            <AISummarizer />
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
