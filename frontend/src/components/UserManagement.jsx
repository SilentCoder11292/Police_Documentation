import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  
  // API states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores user ID being toggled
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal registration form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch user accounts database.');
    } finally {
      setLoading(false);
    }
  };

  // Create new user submit
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    // Validations
    if (!newUsername || newUsername.trim().length < 3) {
      setModalError('Username must be at least 3 characters.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }
    if (!newPhoneNumber || !/^\+?[1-9]\d{1,14}$/.test(newPhoneNumber)) {
      setModalError('Invalid mobile number. Use international format (e.g. +919999999999).');
      return;
    }

    setModalLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/users`, {
        username: newUsername,
        password: newPassword,
        role: newRole,
        phoneNumber: newPhoneNumber
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setSuccess(response.data.message);
      setIsModalOpen(false);
      resetModalForm();
      fetchUsers(); // Refresh grid

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to create officer account.');
    } finally {
      setModalLoading(false);
    }
  };

  // Enable/Disable user status toggle
  const handleToggleStatus = async (userId, username, currentStatus) => {
    // Lockout protection warning check
    if (userId === currentUser.id) {
      setError('System Prevention: You cannot disable your own admin session credentials.');
      return;
    }

    setActionLoading(userId);
    setError('');
    setSuccess('');
    try {
      const response = await axios.patch(`${API_BASE}/api/users/${userId}/status`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSuccess(response.data.message);
      fetchUsers(); // Refresh grid
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to update status for user: ${username}`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetModalForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewRole('User');
    setNewPhoneNumber('');
    setModalError('');
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight font-serif">System User Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage personnel, release authorization logs, and toggle access nodes.</p>
        </div>
        
        <button
          onClick={() => { resetModalForm(); setIsModalOpen(true); }}
          className="px-5 py-3 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Officer</span>
        </button>
      </div>

      {/* Global Status Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Security Alert:</strong>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Node:</strong>
            {success}
          </div>
        </div>
      )}

      {/* Users Data Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        
        <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-police-600 dark:text-gold-500" />
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-950 dark:text-white">Registered Operators Node</h3>
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">Total Nodes: {users.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-police-600 dark:text-gold-500 mx-auto" />
            <p className="text-sm text-slate-550 dark:text-slate-400 font-mono">Connecting to Bihar State Police registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Officer Name</th>
                  <th className="p-4">Privilege Role</th>
                  <th className="p-4">Filing Node Date</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                {users.map((u) => {
                  const isSelf = u._id === currentUser.id;
                  const isPending = actionLoading === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                      {/* Name */}
                      <td className="p-4 font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 flex items-center justify-center text-slate-500 shadow-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <span>{u.username}</span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full bg-police-50 border border-police-200/60 dark:bg-police-950/40 text-police-700 dark:text-police-400 text-[9px] uppercase tracking-wider font-bold">
                            Current User
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          u.role === 'Admin' 
                            ? 'bg-police-50 text-police-700 border-police-200/60 dark:bg-police-950/40 dark:text-police-400 dark:border-police-900/30' 
                            : 'bg-slate-100 text-slate-655 border-slate-200/40 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800/30'
                        }`}>
                          <Shield className="w-3 h-3 shrink-0" />
                          {u.role}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="p-4 text-slate-500 dark:text-slate-450 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          u.accountStatus === 'Active' 
                            ? 'bg-emerald-105 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u._id, u.username, u.accountStatus)}
                          disabled={isSelf || isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm border transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                            u.accountStatus === 'Active'
                              ? 'bg-red-50 hover:bg-red-105 dark:bg-red-950/5 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/5 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.accountStatus === 'Active' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{u.accountStatus === 'Active' ? 'Disable Access' : 'Enable Access'}</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= REGISTRATION MODAL FORM ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay background blur */}
          <div className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-filter backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-police-700 via-police-500 to-police-700 dark:from-gold-600 dark:via-gold-500 dark:to-gold-600"></div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserPlus className="w-4.5 h-4.5 text-police-600 dark:text-gold-500" />
                Register Officer Account
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-3.5 rounded-lg text-sm flex items-start gap-2 shadow-sm">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g., patna_officer_45"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-2">Mobile Number (2FA OTP Destination)</label>
                <input 
                  type="text" 
                  required
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="e.g., +919999999999"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-2">Administrative Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-350 focus:outline-none transition-all"
                >
                  <option value="User">User (Standard Officer Access)</option>
                  <option value="Admin">Admin (System Registry Administrator)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4.5 py-2.5 text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />}
                  <span>Register Account</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
