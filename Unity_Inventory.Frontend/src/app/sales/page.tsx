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
  User,
  Package,
  PlusCircle,
  MinusCircle,
  Download,
  Receipt,
  ShoppingCart,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
  Eye,
  Calendar,
  CreditCard,
  Hash
} from 'lucide-react';

// --- Types ---
interface SaleReport {
  id: number;
  reportDate: string;
  totalAmount: number;
  customerName: string;
  status: string;
  vouchers?: {
    id: number;
    inventoryName: string;
    quantity: number;
    sellPrice: number;
    totalPrice: number;
  }[];
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

// --- Memoized Row ---
const SaleRow = memo(({ report, index, onSelect }: { 
  report: SaleReport, 
  index: number,
  onSelect: (id: number) => void
}) => (
  <tr 
    onClick={() => onSelect(report.id)}
    className="group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-200 dark:border-zinc-700 last:border-0 cursor-pointer"
  >
    <td className="px-4 py-3 text-[10px] font-bold text-zinc-400 w-12 text-center">
      {index}
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
          <Receipt size={14} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">INV-{report.id.toString().padStart(6, '0')}</p>
          <p className="text-[10px] text-zinc-400 font-medium">{new Date(report.reportDate).toLocaleDateString()}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 tracking-tight">
      {report.customerName || 'Walk-in Customer'}
    </td>
    <td className="px-4 py-3 text-right text-xs font-bold text-zinc-900 dark:text-zinc-100">
      {formatCurrency(report.totalAmount)}
    </td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onSelect(report.id); }}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Eye size={14} />
        </button>
        <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <Download size={14} />
        </button>
      </div>
    </td>
  </tr>
));
SaleRow.displayName = 'SaleRow';

const SaleCard = memo(({ report, index, onSelect }: { 
  report: SaleReport, 
  index: number,
  onSelect: (id: number) => void,
}) => (
  <div 
    onClick={() => onSelect(report.id)}
    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full cursor-pointer"
  >
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect(report.id); }}
        className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded shadow-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <Eye size={12} />
      </button>
      <button className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded shadow-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <Download size={12} />
      </button>
    </div>
    
    <div className="flex items-center justify-between mb-4">
      <div className="w-6 h-6 bg-zinc-900/5 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
        {index}
      </div>
      <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase rounded tracking-widest">
        {report.status || 'Completed'}
      </div>
    </div>
    
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
        <Receipt size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight uppercase">INV-{report.id.toString().padStart(6, '0')}</p>
        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(report.reportDate).toLocaleDateString()}</p>
      </div>
    </div>
    
    <div className="mb-4 flex-1">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Customer Entity</p>
      <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{report.customerName || 'Walk-in Customer'}</p>
    </div>
    
    <div className="pt-4 border-t border-zinc-50 mt-auto">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Amount</p>
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(report.totalAmount)}</p>
    </div>
  </div>
));
SaleCard.displayName = 'SaleCard';

// --- Detailed Sale Inspection Modal ---
const SaleDetailModal = ({ reportId, onClose }: { reportId: number, onClose: () => void }) => {
  const [report, setReport] = useState<SaleReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/sales/reports/${reportId}`);
        if (res.data.isSuccess) setReport(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [reportId]);

  if (loading) return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <Loader2 className="text-white animate-spin" size={32} />
    </div>
  );

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg dark:shadow-black/20 shadow-zinc-200">
              <FileText className="text-white dark:text-zinc-900" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">Invoice Details</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Invoice #{report.id.toString().padStart(6, '0')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-full border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-sm">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Top Meta */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <User size={10} /> Customer
              </div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase">{report.customerName || 'Standard Client'}</p>
            </div>
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <Calendar size={10} /> Date
              </div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">{new Date(report.reportDate).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <CreditCard size={10} /> Status
              </div>
              <span className="inline-block px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded uppercase">
                {report.status || 'Verified'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-zinc-900 rounded-full" />
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Items</h4>
            </div>
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Description</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Qty</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Unit Price</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {report.vouchers?.map((v, i) => (
                    <tr key={i} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">{v.inventoryName}</p>
                        <p className="text-[9px] text-zinc-400 font-medium">Product ID: {v.id}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-bold text-zinc-900 dark:text-zinc-100 transition-colors">{v.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors">
                        {(v.sellPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                        {(v.totalPrice || (v.sellPrice * v.quantity) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Traditional Voucher Total */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t-2 border-zinc-900">
               <div className="flex items-center gap-8">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(report.totalAmount)}</p>
               </div>
               <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md">
                     <Download size={14} /> Download PDF
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Isolated New Sale Modal ---
const NewSaleModal = ({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<{ inventoryId: number, quantity: number, price: number, name: string }[]>([]);
  
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers', { 
        params: { pageNumber: customerPage, pageSize: 8, searchTerm: customerSearch } 
      });
      setCustomers(res.data.data || []);
      setCustomerTotalPages(res.data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
  }, [customerPage, customerSearch]);

  const fetchInventories = useCallback(async () => {
    try {
      const res = await api.get('/inventories', { 
        params: { pageNumber: productPage, pageSize: 6, searchTerm: productSearch } 
      });
      setInventories(res.data.data || []);
      setProductTotalPages(res.data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
  }, [productPage, productSearch]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchCustomers(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchInventories(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchInventories]);

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

  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-full max-w-4xl rounded-xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-white dark:text-zinc-900" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Register Transaction</h3>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <X size={16} className="text-zinc-400" />
           </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x divide-zinc-100 dark:divide-zinc-800">
           {/* Left: Customer Selection & Product Search */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Selector */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">1. Select Customer Entity</h4>
                 <div className="space-y-2">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                       <input 
                         type="text" 
                         placeholder="Type to filter clients..."
                         value={customerSearch}
                         onChange={(e) => setCustomerSearch(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-1 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 shadow-inner min-h-[100px]">
                       {customers.length > 0 ? customers.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => setSelectedCustomerId(c.id)}
                            className={cn(
                              "px-3 py-2.5 text-left text-[10px] font-bold rounded-lg border transition-all duration-200 truncate hover:scale-[1.02] active:scale-95",
                              selectedCustomerId === c.id 
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-lg shadow-zinc-200 dark:shadow-black/20" 
                                : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 hover:shadow-md hover:-translate-y-0.5"
                            )}
                          >
                             {c.name}
                          </button>
                       )) : <p className="col-span-2 text-[10px] text-center text-zinc-400 py-4 italic">No matching clients found</p>}
                    </div>
                    {customerTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button 
                          onClick={() => setCustomerPage(p => Math.max(1, p - 1))} 
                          disabled={customerPage === 1}
                          className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900/50 disabled:opacity-20 transition-all"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <span className="text-[10px] font-bold text-zinc-400">{customerPage} / {customerTotalPages}</span>
                        <button 
                          onClick={() => setCustomerPage(p => Math.min(customerTotalPages, p + 1))}
                          disabled={customerPage === customerTotalPages}
                          className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900/50 disabled:opacity-20 transition-all"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                 </div>
              </div>

              {/* Product Selector */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">2. Add Line Items</h4>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search Product ID or name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition-all"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3 min-h-[200px]">
                    {inventories.map(inv => (
                      <button 
                        key={inv.id} 
                        onClick={() => addItem(inv)}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center gap-3 hover:border-violet-400 dark:hover:border-violet-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group active:scale-95"
                      >
                         <div className="w-12 h-12 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                            {inv.imageUrl ? (
                              <img src={inv.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <Package size={20} className="text-zinc-200" />
                            )}
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{inv.name}</p>
                            <p className="text-[10px] font-bold text-emerald-600">{formatCurrency(inv.price)}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                               Stock: <span className="text-zinc-900 dark:text-zinc-100 font-black">{inv.currentStock}</span>
                            </p>
                         </div>
                      </button>
                    ))}
                 </div>
                 {productTotalPages > 1 && (
                   <div className="flex items-center justify-center gap-2 pt-2">
                     <button 
                       onClick={() => setProductPage(p => Math.max(1, p - 1))} 
                       disabled={productPage === 1}
                       className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900/50 disabled:opacity-20 transition-all"
                     >
                       <ChevronLeft size={12} />
                     </button>
                     <span className="text-[10px] font-bold text-zinc-400">{productPage} / {productTotalPages}</span>
                     <button 
                       onClick={() => setProductPage(p => Math.min(productTotalPages, p + 1))}
                       disabled={productPage === productTotalPages}
                       className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900/50 disabled:opacity-20 transition-all"
                     >
                       <ChevronRight size={12} />
                     </button>
                   </div>
                 )}
              </div>
           </div>

           {/* Right: Checkout Summary */}
           <div className="w-full md:w-80 bg-zinc-50 dark:bg-zinc-800/50 p-6 flex flex-col shadow-inner">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Summary</h4>
                 <div className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold rounded uppercase tracking-widest">{items.length} Items</div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
                 {items.length > 0 ? items.map(item => (
                   <div key={item.inventoryId} className="flex items-center justify-between group animate-in slide-in-from-right-2 duration-150">
                      <div className="min-w-0">
                         <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                         <p className="text-[10px] text-zinc-400 font-medium">{item.quantity} units @ {(item.price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{((item.price || 0) * item.quantity).toLocaleString()}</p>
                         <button onClick={() => removeItem(item.inventoryId)} className="p-1 text-zinc-300 hover:text-rose-500 transition-colors">
                            <MinusCircle size={14} />
                         </button>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center opacity-30">
                      <ShoppingCart size={32} className="mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Cart Empty</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-auto">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grand Total</p>
                       <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(totalAmount)}</p>
                    </div>
                    {selectedCustomerId && (
                      <div className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in">
                         <CheckCircle2 size={12} />
                         <span className="text-[10px] font-bold uppercase">Ready</span>
                      </div>
                    )}
                 </div>
                 <button 
                   disabled={isSubmitting || !selectedCustomerId || items.length === 0}
                   onClick={handleCreate}
                   className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-20 transition-all shadow-xl dark:shadow-black/50 shadow-zinc-200 flex items-center justify-center gap-2"
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
  const [viewType, setViewType] = useState<'table' | 'grid'>('table');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => { fetchReports(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Financial Records</h1>
          <p className="text-[10px] text-zinc-500 font-medium italic">Comprehensive ledger of all business transactions.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/50 shadow-zinc-100">
          <Plus size={14} /> New Transaction
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Filter ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 rounded-lg shadow-sm">
          <button 
            onClick={() => setViewType('table')}
            className={cn(
              "p-1.5 rounded transition-all",
              viewType === 'table' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <LayoutList size={14} />
          </button>
          <button 
            onClick={() => setViewType('grid')}
            className={cn(
              "p-1.5 rounded transition-all",
              viewType === 'grid' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {viewType === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Ref</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Gross Total</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody>
                {loading && reports.length === 0 ? (
                  [...Array(10)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={5} className="h-14 bg-white dark:bg-zinc-900" /></tr>)
                ) : reports.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-24 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">No Records Found</td></tr>
                ) : (
                  reports.map((report, idx) => (
                    <SaleRow 
                      key={report.id} 
                      report={report} 
                      index={(page - 1) * 15 + idx + 1}
                      onSelect={setSelectedReportId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {loading && reports.length === 0 ? (
             [...Array(8)].map((_, i) => <div key={i} className="h-48 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl animate-pulse" />)
           ) : reports.length === 0 ? (
             <div className="col-span-full py-24 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">No Records Found</div>
           ) : (
             reports.map((report, idx) => (
               <SaleCard 
                 key={report.id} 
                 report={report} 
                 index={(page - 1) * 15 + idx + 1}
                 onSelect={setSelectedReportId}
               />
             ))
           )}
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mt-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}

      {isAddModalOpen && (
        <NewSaleModal 
          onClose={() => setIsAddModalOpen(false)} 
          onCreated={fetchReports} 
        />
      )}

      {selectedReportId && (
        <SaleDetailModal 
          reportId={selectedReportId} 
          onClose={() => setSelectedReportId(null)} 
        />
      )}
    </div>
  );
}
