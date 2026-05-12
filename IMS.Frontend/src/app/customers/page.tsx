'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Trash2,
  Edit2,
  Info,
  DollarSign,
  Save,
  Activity,
  CreditCard,
  UserCheck,
  Settings2
} from 'lucide-react';

// --- Types ---
interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  totalPurchased: number;
  versionStamp: string;
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

// --- Memoized Row ---
const CustomerRow = memo(({ customer, onSelect, onDelete }: { 
  customer: Customer, 
  onSelect: (c: Customer) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <tr 
    onClick={() => onSelect(customer)}
    className="group hover:bg-zinc-50/50 transition-colors cursor-pointer border-b border-zinc-50 last:border-0"
  >
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[11px] font-black uppercase shadow-lg shadow-zinc-100">
          {customer.name?.[0] || '?'}
        </div>
        <div>
          <p className="text-xs font-black text-zinc-900 truncate tracking-tight uppercase">{customer.name}</p>
          <p className="text-[10px] text-zinc-400 font-bold italic tracking-wider">UID-{customer.id.toString().padStart(5, '0')}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-bold">
        <Phone size={12} className="text-zinc-400" />
        {customer.phone || 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 max-w-[250px] truncate">
        <MapPin size={12} className="text-zinc-400 shrink-0" />
        <span className="truncate font-medium">{customer.address || 'No registered address'}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-right text-xs font-black text-zinc-900">
      {formatCurrency(customer.totalPurchased)}
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
          <Edit2 size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(customer.id, customer.versionStamp); }}
          className="p-2 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  </tr>
));
CustomerRow.displayName = 'CustomerRow';

// --- Optimized Detail Modal ---
const CustomerDetailModal = ({ customer, onClose, onUpdate, onDelete, onEditSuccess }: {
  customer: Customer,
  onClose: () => void,
  onUpdate: () => void,
  onDelete: (id: number, version: string) => void,
  onEditSuccess: (updated: Customer) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: customer.name, 
    phone: customer.phone || '', 
    address: customer.address || '' 
  });

  // Sync state when props change ONLY if not currently editing
  useEffect(() => {
    if (!isEditing) {
      setEditForm({ 
        name: customer.name, 
        phone: customer.phone || '', 
        address: customer.address || '' 
      });
    }
  }, [customer, isEditing]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.put('/customers', {
        id: customer.id,
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        versionStamp: customer.versionStamp
      });
      if (response.data.isSuccess) {
        // OPTIMISTIC UPDATE
        onEditSuccess({
          ...customer,
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address
        });
        setIsEditing(false);
        onUpdate();
      }
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900/40 animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg shadow-zinc-200">
                <UserIcon size={14} className="text-white" />
              </div>
              <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Client Intelligence</h3>
           </div>
           <div className="flex items-center gap-2">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded text-[10px] font-black text-zinc-600 uppercase hover:bg-zinc-100 transition-all"
                >
                  <Settings2 size={10} />
                  Modify Profile
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-md transition-colors">
                 <X size={16} className="text-zinc-400" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
           {/* Section 1: Identity */}
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-zinc-900 rounded-full" />
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Core Identity Profile</h4>
              </div>
              
              <div className="flex gap-8 items-center">
                 <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white shrink-0">
                    {customer.name[0]}
                 </div>
                 <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-zinc-400 uppercase">Legal Entity Name</label>
                           <input 
                            autoFocus
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-base font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-zinc-900"
                           />
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-2.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 disabled:opacity-50 shadow-lg shadow-zinc-100">
                              {isSubmitting ? 'Syncing...' : 'Commit Changes'}
                           </button>
                           <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none uppercase">{customer.name}</h2>
                        <div className="flex items-center gap-3 pt-1">
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                             <UserCheck size={10} />
                             Verified Client
                           </div>
                           <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter">Joined May 2024</span>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Section 2: Financial Stats */}
           <div className="p-8 bg-zinc-900 rounded-3xl text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4 opacity-50">
                   <p className="text-[10px] font-black uppercase tracking-widest">Lifetime Portfolio Value</p>
                   <CreditCard size={18} />
                 </div>
                 <p className="text-4xl font-black tracking-tighter">{formatCurrency(customer.totalPurchased)}</p>
                 <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-3/4 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                 <DollarSign size={120} />
              </div>
           </div>

           {/* Section 3: Contact Channels */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Engagement Infrastructure</h4>
              <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-5 hover:border-zinc-300 transition-all cursor-pointer group shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                       <Phone size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Direct Comms</p>
                       {isEditing ? (
                         <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full text-base font-bold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 mt-2 outline-none focus:ring-1 focus:ring-zinc-900" />
                       ) : (
                         <p className="text-lg font-black text-zinc-900 tracking-tight mt-1">{customer.phone || 'Restricted Access'}</p>
                       )}
                    </div>
                 </div>
                 <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-5 hover:border-zinc-300 transition-all cursor-pointer group shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                       <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logistics Anchor</p>
                       {isEditing ? (
                         <textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full text-sm font-bold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-3 py-2 mt-2 outline-none min-h-[100px] focus:ring-1 focus:ring-zinc-900" />
                       ) : (
                         <p className="text-sm font-black text-zinc-500 leading-relaxed mt-2">{customer.address || 'Geo-data unavailable'}</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
           <button onClick={() => onDelete(customer.id, customer.versionStamp)} className="px-4 py-2 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-all">Terminate Relationship</button>
           <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest opacity-50">Internal Record • Secured CID</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: { pageNumber: page, pageSize: 15, searchTerm: search }
      });
      if (response.data.isSuccess) {
        const items: Customer[] = response.data.data || [];
        setCustomers(items);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // SYNC SELECTED CUSTOMER
        if (selectedCustomer) {
          const updated = items.find(c => c.id === selectedCustomer.id);
          if (updated) setSelectedCustomer(updated);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCustomer]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/customers', {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        businessId: 0
      });
      if (response.data.isSuccess) {
        setIsAddModalOpen(false);
        setNewCustomer({ name: '', phone: '', address: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = useCallback(async (id: number, version: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`, { params: { version } });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  }, [fetchCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchCustomers(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  return (
    <div className="space-y-6 max-w-[1400px] animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-6 border border-zinc-100 rounded-xl shadow-sm">
        <div>
          <h1 className="text-base font-black text-zinc-900 uppercase tracking-widest">Client Ledger</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">High-value relationship management & portfolio tracking.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-100">
          <Plus size={16} /> Onboard Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          type="text"
          placeholder="Filter relationship database..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/30">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Client Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Communications</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Anchor Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">LTV Index</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                [...Array(10)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={5} className="h-16 bg-white" /></tr>)
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-32 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">No client records found</td></tr>
              ) : (
                customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} onSelect={setSelectedCustomer} onDelete={handleDeleteCustomer} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-50 bg-zinc-50/20">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-zinc-100 rounded-lg bg-white disabled:opacity-20 hover:bg-zinc-50 shadow-sm"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-zinc-100 rounded-lg bg-white disabled:opacity-20 hover:bg-zinc-50 shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
          onUpdate={fetchCustomers}
          onDelete={handleDeleteCustomer}
          onEditSuccess={(updated) => setSelectedCustomer(updated)}
        />
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white border border-zinc-100 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-98 duration-150">
            <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4">Onboard Client Entity</h3>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Legal Entity Name</label>
                <input required type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full Corporate Name" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Primary Comms</label>
                <input type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Direct Phone Line" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Physical Address</label>
                <textarea value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Logistics Anchor Point" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 min-h-[80px]" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 mt-4">
                {isSubmitting ? <Loader2 size={16} className="animate-spin m-auto" /> : 'Confirm Onboarding'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
