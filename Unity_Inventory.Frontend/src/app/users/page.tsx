'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Search, 
  User as UserIcon,
  X,
  Loader2,
  Shield,
  ShieldAlert,
  Check,
  Mail,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import { canProvisionNewBusiness } from '@/lib/accountType';
import { useRouter } from 'next/navigation';

interface UserDto {
  userId: number;
  name: string;
  email: string;
  accountType: string;
  createdAt: string;
}

interface RolePermissionDTO {
  menuCode: string;
  actionCode: string;
  isAllowed: boolean;
  isRevoked: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { menu: 'dashboard', actions: ['view'] },
  { menu: 'inventory', actions: ['view', 'create', 'edit', 'delete'] },
  { menu: 'sales', actions: ['view', 'create'] },
  { menu: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
  { menu: 'customerprices', actions: ['view', 'create', 'edit', 'delete'] },
];

const PermissionModal = ({ userDto, businessId, onClose }: {
  userDto: UserDto;
  businessId: number;
  onClose: () => void;
}) => {
  const [permissions, setPermissions] = useState<RolePermissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const isOwner = userDto.accountType?.toLowerCase() === 'owner';

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/permissions/${businessId}/user/${userDto.userId}?roleName=${userDto.accountType || 'Staff'}`);
      if (res.data.isSuccess) {
        setPermissions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, userDto.userId, userDto.accountType]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = (menu: string, action: string) => {
    const p = permissions.find(x => x.menuCode === menu && x.actionCode === action);
    if (!p) return false;
    return p.isAllowed && !p.isRevoked;
  };

  const togglePermission = async (menu: string, action: string, currentStatus: boolean) => {
    const key = `${menu}-${action}`;
    setIsUpdating(key);
    try {
      const endpoint = currentStatus ? '/permissions/revoke' : '/permissions/grant';
      await api.post(endpoint, {
        userId: userDto.userId,
        businessId: businessId,
        menuCode: menu,
        actionCode: action,
        roleName: userDto.accountType || 'Staff'
      });
      await fetchPermissions(); // Refresh after update
    } catch (error) {
      console.error('Failed to update permission:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 text-xl font-bold uppercase shadow-md">
              {userDto.name?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{userDto.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{userDto.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isOwner ? (
            <div className="mb-6 flex items-center gap-2 px-3 py-2 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-zinc-900/50 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-500">
              <ShieldAlert size={14} className="text-amber-600 dark:text-amber-500" />
              <span>Owner permissions are absolute and cannot be modified.</span>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <ShieldAlert size={14} className="text-zinc-900 dark:text-zinc-100" />
              <span>Changes applied here take effect immediately for this business.</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {AVAILABLE_PERMISSIONS.map((group) => (
                <div key={group.menu} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-300 uppercase tracking-widest">{group.menu}</h3>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {group.actions.map((action) => {
                      const allowed = isOwner || hasPermission(group.menu, action);
                      const key = `${group.menu}-${action}`;
                      const updating = isUpdating === key;
                      
                      return (
                        <div key={action} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              allowed ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                            )}>
                              {allowed ? <Unlock size={14} /> : <Lock size={14} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{action}</p>
                              <p className="text-[10px] text-zinc-500">Allow user to {action} {group.menu}</p>
                            </div>
                          </div>
                          
                          <button
                            disabled={updating || isOwner}
                            onClick={() => !isOwner && togglePermission(group.menu, action, allowed)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50",
                              allowed ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              allowed ? "translate-x-[18px]" : "translate-x-[2px]"
                            )} />
                            {updating && (
                              <Loader2 size={10} className="absolute inset-0 m-auto text-zinc-600 animate-spin" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddUserModal = ({ businessId, onClose, onSuccess }: {
  businessId: number;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    accountType: 'Staff' as 'Admin' | 'Staff'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/users/create', {
        ...formData,
        businessId
      });

      if (res.data.isSuccess) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred during user creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Onboard Team Member</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">Provision access for new administrative or staff entities.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Legal Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all"
              placeholder="Full Entity Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
            <input 
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all"
              placeholder="corporate@identity.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Access Credentials</label>
            <input 
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all"
              placeholder="Secure Passcode"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Access Level (Role)</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Admin', 'Staff'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: role })}
                  className={cn(
                    "px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    formData.accountType === role 
                      ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-none" 
                      : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-800 dark:hover:border-zinc-700"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100 mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Check size={16} />
                Confirm Provisioning
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const { user: authUser, currentBusinessId } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  useEffect(() => {
    // Only Owners can access this page
    if (authUser && !canProvisionNewBusiness(authUser.accountType)) {
      router.push('/dashboard');
    }
  }, [authUser, router]);

  const loadUsers = useCallback(async () => {
    if (!currentBusinessId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/users?businessId=${currentBusinessId}`);
      if (res.data.isSuccess) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusinessId]);

  useEffect(() => {
    if (currentBusinessId) {
      loadUsers();
    }
  }, [currentBusinessId, loadUsers]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!authUser || !canProvisionNewBusiness(authUser.accountType)) {
    return null;
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Team & Permissions</h1>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">Manage system users and their access within your active business.</p>
        </div>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100"
        >
          <UserIcon size={16} /> Onboard Team Member
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all shadow-sm"
          />
        </div>
      </div>

      <div>
        <div className="w-full">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">No</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.userId} className="group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                      <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 text-center">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 text-xs font-bold uppercase shadow-sm">
                            {u.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{u.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium mt-0.5">
                              <Mail size={10} />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                          u.accountType.toLowerCase() === 'owner' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          {u.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                          <Calendar size={10} />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-all"
                        >
                          <Shield size={12} />
                          Permissions
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                          <UserIcon size={20} className="text-zinc-400" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No users found</h3>
                        <p className="text-xs text-zinc-500">Try adjusting your search query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedUser && currentBusinessId && (
        <PermissionModal 
          userDto={selectedUser} 
          businessId={currentBusinessId} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {isAddUserModalOpen && currentBusinessId && (
        <AddUserModal 
          businessId={currentBusinessId} 
          onClose={() => setIsAddUserModalOpen(false)} 
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}
