'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Trash2,
  User,
  Package,
  PlusCircle,
  MinusCircle,
  Download,
  Receipt,
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';

// --- Types ---
interface SaleReport {
  id: number;
  reportDate: string;
  totalAmount: number;
  customerName: string;
  status: string;
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

// --- Memoized Row ---
const SaleRow = memo(({ report, onDelete }: { 
  report: SaleReport, 
  onDelete: (id: number) => void 
}) => (
  <tr className="group hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-0">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
          <Receipt size={14} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900 truncate tracking-tight">INV-{report.id.toString().padStart(6, '0')}</p>
          <p className="text-[10px] text-zinc-400 font-medium">{new Date(report.reportDate).toLocaleDateString()}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-[11px] font-bold text-zinc-700 uppercase tracking-tight">
      {report.customerName || 'Walk-in Customer'}
    </td>
    <td className="px-4 py-3 text-right text-xs font-black text-zinc-900">
      {formatCurrency(report.totalAmount)}
    </td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-900 transition-colors">
          <Download size={14} />
        </button>
        <button 
          onClick={() => onDelete(report.id)}
          className="p-1.5 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  </tr>
));
SaleRow.displayName = 'SaleRow';

// --- Isolated New Sale Modal ---
const NewSaleModal = ({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<{ inventoryId: number, quantity: number, price: number, name: string }[]>([]);

  const fetchFormData = useCallback(async () => {
    try {
      const [custRes, invRes] = await Promise.all([
        api.get('/customers', { params: { pageSize: 100 } }),
        api.get('/inventories', { params: { pageSize: 100 } })
      ]);
      setCustomers(custRes.data.data || []);
      setInventories(invRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchFormData(); }, [fetchFormData]);

  const handleCreate = async () => {
    if (!selectedCustomerId || items.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/sales/reports', {
        customerId: selectedCustomerId,
        vouchers: items.map(i => ({
          inventoryId: i.inventoryId,
          quantity: i.quantity,
          sellPrice: i.price
        }))
      });
      if (response.data.isSuccess) {
        onCreated();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create sale:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = (inventory: any) => {
    const existing = items.find(i => i.inventoryId === inventory.id);
    if (existing) {
      setItems(items.map(i => i.inventoryId === inventory.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { inventoryId: inventory.id, quantity: 1, price: inventory.price, name: inventory.name }]);
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.inventoryId !== id));
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = inventories.filter(i => 
    i.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white border border-zinc-100 w-full max-w-4xl rounded-xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Register Transaction</h3>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-md transition-colors">
              <X size={16} className="text-zinc-400" />
           </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x divide-zinc-100">
           {/* Left: Customer Selection & Product Search */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Selector */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">1. Select Customer Entity</h4>
                 <div className="space-y-2">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                       <input 
                         type="text" 
                         placeholder="Type to filter clients..."
                         value={customerSearch}
                         onChange={(e) => setCustomerSearch(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded text-xs outline-none focus:border-zinc-900 transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-1 border border-zinc-100 rounded bg-white shadow-inner">
                       {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                         <button 
                           key={c.id} 
                           onClick={() => setSelectedCustomerId(c.id)}
                           className={cn(
                             "px-3 py-2 text-left text-[11px] font-bold rounded transition-all truncate",
                             selectedCustomerId === c.id ? "bg-zinc-900 text-white shadow-md" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                           )}
                         >
                            {c.name}
                         </button>
                       )) : <p className="col-span-2 text-[10px] text-center text-zinc-400 py-4 italic">No matching clients found</p>}
                    </div>
                 </div>
              </div>

              {/* Product Selector */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">2. Add Line Items</h4>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search inventory SKU or name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded text-xs outline-none focus:border-zinc-900 transition-all"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-1">
                    {filteredProducts.map(inv => (
                      <button 
                        key={inv.id} 
                        onClick={() => addItem(inv)}
                        className="p-3 bg-white border border-zinc-100 rounded-lg flex flex-col items-start gap-1 hover:border-zinc-900 hover:shadow-md transition-all text-left"
                      >
                         <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight truncate w-full">{inv.name}</p>
                         <p className="text-[10px] font-bold text-emerald-600">{formatCurrency(inv.price)}</p>
                         <p className="text-[9px] text-zinc-400 font-medium">Stock: {inv.currentStock} units</p>
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right: Checkout Summary */}
           <div className="w-full md:w-80 bg-zinc-50/50 p-6 flex flex-col shadow-inner">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order Summary</h4>
                 <div className="px-2 py-0.5 bg-zinc-200 text-zinc-600 text-[9px] font-black rounded uppercase tracking-widest">{items.length} Items</div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
                 {items.length > 0 ? items.map(item => (
                   <div key={item.inventoryId} className="flex items-center justify-between group animate-in slide-in-from-right-2 duration-150">
                      <div className="min-w-0">
                         <p className="text-[11px] font-bold text-zinc-900 truncate">{item.name}</p>
                         <p className="text-[10px] text-zinc-400 font-medium">{item.quantity} units @ {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-zinc-900">{(item.price * item.quantity).toLocaleString()}</p>
                         <button onClick={() => removeItem(item.inventoryId)} className="p-1 text-zinc-300 hover:text-rose-500 transition-colors">
                            <MinusCircle size={14} />
                         </button>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center opacity-30">
                      <ShoppingCart size={32} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Cart Empty</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4 border-t border-zinc-200 pt-6 mt-auto">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grand Total</p>
                       <p className="text-2xl font-black text-zinc-900 tracking-tighter">{formatCurrency(totalAmount)}</p>
                    </div>
                    {selectedCustomerId && (
                      <div className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in">
                         <CheckCircle2 size={12} />
                         <span className="text-[10px] font-black uppercase">Ready</span>
                      </div>
                    )}
                 </div>
                 <button 
                   disabled={isSubmitting || !selectedCustomerId || items.length === 0}
                   onClick={handleCreate}
                   className="w-full py-3 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-2"
                 >
                   {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Execute Transaction'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function SalesPage() {
  const [reports, setReports] = useState<SaleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales/reports', {
        params: { pageNumber: page, pageSize: 15, searchTerm: search }
      });
      if (response.data.isSuccess) {
        setReports(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch sales reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const handleDeleteReport = useCallback(async (id: number) => {
    if (!confirm('Permanently delete this invoice?')) return;
    try {
      await api.delete(`/sales/reports/${id}`);
      fetchReports();
    } catch (error) {
      console.error(error);
    }
  }, [fetchReports]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchReports(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  return (
    <div className="space-y-6 max-w-[1400px] animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-4 border border-zinc-100 rounded-lg shadow-sm">
        <div>
          <h1 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Financial Records</h1>
          <p className="text-[10px] text-zinc-500 font-medium italic">Comprehensive ledger of all business transactions.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
          <Plus size={14} /> New Transaction
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
        <input
          type="text"
          placeholder="Filter ledger..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-100 rounded text-xs outline-none focus:border-zinc-900 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Invoice Ref</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Client Name</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Gross Total</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={4} className="h-14 bg-white" /></tr>)
              ) : reports.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-24 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">No Records Found</td></tr>
              ) : (
                reports.map((report) => (
                  <SaleRow key={report.id} report={report} onDelete={handleDeleteReport} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && reports.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-zinc-100 bg-zinc-50/30">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-zinc-100 rounded bg-white disabled:opacity-20 hover:bg-zinc-50"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 border border-zinc-100 rounded bg-white disabled:opacity-20 hover:bg-zinc-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <NewSaleModal 
          onClose={() => setIsAddModalOpen(false)} 
          onCreated={fetchReports} 
        />
      )}
    </div>
  );
}
