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
  Settings2,
  LayoutList,
  LayoutGrid
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
const CustomerRow = memo(({ customer, index, onSelect, onDelete }: { 
  customer: Customer, 
  index: number,
  onSelect: (c: Customer) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <tr 
    onClick={() => onSelect(customer)}
    className="group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-b border-zinc-200 dark:border-zinc-700 last:border-0"
  >
    <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 w-12 text-center">
      {index}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold uppercase shadow-lg dark:shadow-black/20 shadow-zinc-100">
          {customer.name?.[0] || '?'}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{customer.name}</p>
          <p className="text-[10px] text-zinc-400 font-semibold italic tracking-wider">UID-{customer.id.toString().padStart(5, '0')}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-semibold">
        <Phone size={12} className="text-zinc-400" />
        {customer.phone || 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-[10px] text-zinc-500 max-w-[250px] truncate">
        <MapPin size={12} className="text-zinc-400 shrink-0" />
        <span className="truncate font-medium">{customer.address || 'No registered address'}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-right text-xs font-bold text-zinc-900 dark:text-zinc-100">
      {formatCurrency(customer.totalPurchased)}
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <Edit2 size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(customer.id, customer.versionStamp); }}
          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  </tr>
));
CustomerRow.displayName = 'CustomerRow';

const CustomerCard = memo(({ customer, index, onSelect, onDelete }: { 
  customer: Customer, 
  index: number,
  onSelect: (c: Customer) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <div 
    onClick={() => onSelect(customer)}
    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
  >
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded shadow-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <Edit2 size={10} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(customer.id, customer.versionStamp); }}
        className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 rounded shadow-sm text-zinc-400 hover:text-rose-600 transition-colors"
      >
        <Trash2 size={10} />
      </button>
    </div>
    
    <div className="flex items-center gap-4 mb-6 relative">
      <div className="absolute -top-4 -left-4 w-6 h-6 bg-zinc-900/5 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 shadow-sm">
        {index}
      </div>
      <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white text-lg font-bold shadow-lg dark:shadow-black/20 shadow-zinc-200 shrink-0">
        {customer.name?.[0] || '?'}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight">{customer.name}</p>
        <p className="text-[10px] text-zinc-400 font-semibold italic tracking-wider">UID-{customer.id.toString().padStart(5, '0')}</p>
      </div>
    </div>
    
    <div className="space-y-3 mb-6 flex-1">
      <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-semibold">
        <Phone size={12} className="text-zinc-400" />
        {customer.phone || 'N/A'}
      </div>
      <div className="flex items-start gap-2 text-[10px] text-zinc-500 line-clamp-2">
        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
        <span className="font-medium leading-relaxed">{customer.address || 'No registered address'}</span>
      </div>
    </div>
    
    <div className="pt-4 border-t border-zinc-50 mt-auto">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lifetime Value</p>
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(customer.totalPurchased)}</p>
    </div>
  </div>
));
CustomerCard.displayName = 'CustomerCard';

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
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg dark:shadow-black/20 shadow-zinc-200">
                <UserIcon size={14} className="text-white dark:text-zinc-900" />
              </div>
              <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Client Intelligence</h3>
           </div>
           <div className="flex items-center gap-2">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <Settings2 size={10} />
                  Modify Profile
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                 <X size={16} className="text-zinc-400" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
           {/* Section 1: Identity */}
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-zinc-900 rounded-full" />
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Core Identity Profile</h4>
              </div>
              
              <div className="flex gap-8 items-center">
                 <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white shrink-0">
                    {customer.name[0]}
                 </div>
                 <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-bold text-zinc-400 uppercase">Legal Entity Name</label>
                           <input 
                            autoFocus
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                           />
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 shadow-lg dark:shadow-black/20 shadow-zinc-100">
                              {isSubmitting ? 'Syncing...' : 'Commit Changes'}
                           </button>
                           <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">{customer.name}</h2>
                        <div className="flex items-center gap-3 pt-1">
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-500/20">
                             <UserCheck size={10} />
                             Verified Client
                           </div>
                           <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Joined May 2024</span>
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
                   <p className="text-[10px] font-bold uppercase tracking-widest">Lifetime Portfolio Value</p>
                   <CreditCard size={18} />
                 </div>
                 <p className="text-4xl font-bold tracking-tighter">{formatCurrency(customer.totalPurchased)}</p>
                 <div className="mt-4 h-1 w-full bg-white dark:bg-zinc-900/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-3/4 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                 <DollarSign size={120} />
              </div>
           </div>

           {/* Section 3: Contact Channels */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Engagement Infrastructure</h4>
              <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-start gap-5 hover:border-zinc-300 transition-all cursor-pointer group shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                       <Phone size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Direct Comms</p>
                       {isEditing ? (
                         <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 mt-2 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600" />
                       ) : (
                         <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">{customer.phone || 'Restricted Access'}</p>
                       )}
                    </div>
                 </div>
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-start gap-5 hover:border-zinc-300 transition-all cursor-pointer group shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                       <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Logistics Anchor</p>
                       {isEditing ? (
                         <textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mt-2 outline-none min-h-[100px] focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600" />
                       ) : (
                         <p className="text-sm font-bold text-zinc-500 leading-relaxed mt-2">{customer.address || 'Geo-data unavailable'}</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
           <button onClick={() => onDelete(customer.id, customer.versionStamp)} className="px-4 py-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">Terminate Relationship</button>
           <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest opacity-50">Internal Record • Secured CID</span>
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
  const [viewType, setViewType] = useState<'table' | 'grid'>('table');
  
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
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Sync selected customer with background updates
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customers.find(c => c.id === selectedCustomer.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedCustomer)) {
        setSelectedCustomer(updated);
      }
    }
  }, [customers]);

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
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Client Ledger</h1>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">High-value relationship management & portfolio tracking.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100">
          <Plus size={16} /> Onboard Client
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Filter relationship database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => setViewType('table')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewType === 'table' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <LayoutList size={18} />
          </button>
          <button 
            onClick={() => setViewType('grid')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewType === 'grid' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {viewType === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-50 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client Entity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Communications</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Anchor Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">LTV Index</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && customers.length === 0 ? (
                  [...Array(10)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={6} className="h-16 bg-white dark:bg-zinc-900" /></tr>)
                ) : customers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-32 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">No client records found</td></tr>
                ) : (
                  customers.map((customer, idx) => (
                    <CustomerRow 
                      key={customer.id} 
                      customer={customer} 
                      index={(page - 1) * 15 + idx + 1}
                      onSelect={setSelectedCustomer} 
                      onDelete={handleDeleteCustomer} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
           {loading && customers.length === 0 ? (
             [...Array(8)].map((_, i) => <div key={i} className="h-64 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl animate-pulse" />)
           ) : customers.length === 0 ? (
             <div className="col-span-full py-32 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">No client records found</div>
           ) : (
             customers.map((customer, idx) => (
               <CustomerCard 
                 key={customer.id} 
                 customer={customer} 
                 index={(page - 1) * 15 + idx + 1}
                 onSelect={setSelectedCustomer} 
                 onDelete={handleDeleteCustomer} 
               />
             ))
           )}
        </div>
      )}

        {!loading && customers.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-50 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl mt-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}

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
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-98 duration-150">
            <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4">Onboard Client Entity</h3>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Legal Entity Name</label>
                <input required type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full Corporate Name" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Primary Comms</label>
                <input type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Direct Phone Line" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Physical Address</label>
                <textarea value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Logistics Anchor Point" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 min-h-[80px]" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/40 shadow-zinc-200 mt-4">
                {isSubmitting ? <Loader2 size={16} className="animate-spin m-auto" /> : 'Confirm Onboarding'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
