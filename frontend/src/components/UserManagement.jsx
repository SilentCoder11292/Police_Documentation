import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User, 
  Unlock, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  LockKeyholeOpen,
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
      const response = await axios.get('http://localhost:5000/api/users', {
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
      const response = await axios.post('http://localhost:5000/api/users', {
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
      const response = await axios.patch(`http://localhost:5000/api/users/${userId}/status`, {}, {
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
          <h1 className="text-xl font-bold text-white tracking-tight">System User Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage personnel, release authorization logs, and toggle access nodes.</p>
        </div>
        
        <button
          onClick={() => { resetModalForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:shadow-gold-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Officer</span>
        </button>
      </div>

      {/* Global Status Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Security Alert:</strong>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Registry Node:</strong>
            {success}
          </div>
        </div>
      )}

      {/* Users Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-gold-500" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-white">Registered Operators Node</h3>
          <span className="ml-auto text-[10px] text-slate-450 font-mono">Total Nodes: {users.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Connecting to Bihar State Police registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-4">Officer Name</th>
                  <th className="p-4">Privilege Role</th>
                  <th className="p-4">Filing Node Date</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
                {users.map((u) => {
                  const isSelf = u._id === currentUser.id;
                  const isPending = actionLoading === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/10 transition-colors">
                      {/* Name */}
                      <td className="p-4 font-semibold text-white font-mono flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{u.username}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-gold-500 text-[8px] uppercase tracking-wider font-bold">
                            Current User
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          u.role === 'Admin' 
                            ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                            : 'bg-slate-950 border border-slate-800 text-slate-400'
                        }`}>
                          <Shield className="w-3 h-3 shrink-0" />
                          {u.role}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="p-4 text-slate-450 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          u.accountStatus === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u._id, u.username, u.accountStatus)}
                          disabled={isSelf || isPending}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                            u.accountStatus === 'Active'
                              ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/45 text-red-400'
                              : 'bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/45 text-emerald-400'
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal Container */}
          <div className="glass-panel w-full max-w-md rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600"></div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-gold-500" />
                Register Officer Account
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              
              {/* Username */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g., patna_officer_45"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Mobile Number (2FA OTP Destination)</label>
                <input 
                  type="text" 
                  required
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="e.g., +919999999999"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Administrative Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none transition-all"
                >
                  <option value="User">User (Standard Officer Access)</option>
                  <option value="Admin">Admin (System Registry Administrator)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
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
