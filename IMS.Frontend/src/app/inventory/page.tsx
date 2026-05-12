'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Package, 
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  Trash2,
  Edit2,
  Info,
  Box,
  Image as ImageIcon,
  Save,
  TrendingUp,
  History,
  AlertCircle,
  Settings2
} from 'lucide-react';

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  currentStock: number;
  imageUrl: string;
  versionStamp: string;
  stockVersionStamp: string;
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

// --- Memoized Row ---
const InventoryRow = memo(({ product, onSelect, onDelete }: { 
  product: Product, 
  onSelect: (p: Product) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <tr 
    onClick={() => onSelect(product)}
    className="group hover:bg-zinc-50/50 transition-colors cursor-pointer border-b border-zinc-50 last:border-0"
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-zinc-400" />}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900 truncate tracking-tight">{product.name}</p>
          <p className="text-[10px] text-zinc-400 font-medium">SKU-{product.id.toString().padStart(5, '0')}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-right text-xs font-bold text-zinc-900">
      {formatCurrency(product.price)}
    </td>
    <td className="px-4 py-3 text-right">
      <div className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
        product.currentStock > 5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      )}>
        {product.currentStock} Units
      </div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-900 transition-colors">
          <Edit2 size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(product.id, product.versionStamp); }}
          className="p-1.5 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  </tr>
));
InventoryRow.displayName = 'InventoryRow';

// --- Optimized Detail Modal ---
const ProductDetailModal = ({ product, onClose, onUpdate, onDelete, onEditSuccess }: {
  product: Product,
  onClose: () => void,
  onUpdate: () => void,
  onDelete: (id: number, version: string) => void,
  onEditSuccess: (updated: Product) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ name: product.name, price: product.price.toString() });

  // Sync form ONLY when NOT editing (e.g. after background refresh or on mount)
  useEffect(() => {
    if (!isEditing) {
      setEditForm({ name: product.name, price: product.price.toString() });
    }
  }, [product, isEditing]);
  
  // Stock Update State
  const [newStock, setNewStock] = useState(product.currentStock.toString());
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const handleSaveInfo = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('Id', product.id.toString());
      formData.append('Name', editForm.name);
      formData.append('Price', editForm.price);
      formData.append('VersionStamp', product.versionStamp);
      if (product.stockVersionStamp) {
        formData.append('StockVersionStamp', product.stockVersionStamp);
      }

      const response = await api.put('/inventories', formData);
      if (response.data.isSuccess) {
        // OPTIMISTIC/IMMEDIATE UPDATE
        onEditSuccess({
          ...product,
          name: editForm.name,
          price: parseFloat(editForm.price)
        });
        setIsEditing(false);
        onUpdate(); // Trigger background sync
      }
    } catch (error: any) {
      console.error('Failed to update product:', error);
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async () => {
    setIsUpdatingStock(true);
    try {
      const response = await api.post('/inventories/update-stock', {
        inventoryId: product.id,
        currentStock: parseInt(newStock),
        stockVersionStamp: product.stockVersionStamp
      });
      if (response.data.isSuccess) {
        // Immediate visual update for stock
        onEditSuccess({
          ...product,
          currentStock: parseInt(newStock)
        });
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900/40 animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Box size={14} className="text-white" />
              </div>
              <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Management Console</h3>
           </div>
           <div className="flex items-center gap-2">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded text-[10px] font-black text-zinc-600 uppercase hover:bg-zinc-100 transition-all"
                >
                  <Edit2 size={10} />
                  Modify SKu
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-md transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
           {/* Section 1: Basic Info */}
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-zinc-900 rounded-full" />
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Core Product Specifications</h4>
              </div>
              
              <div className="flex gap-8 items-start">
                 <div className="w-24 h-24 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group relative">
                    {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-zinc-300" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <p className="text-[8px] font-black text-white uppercase">Replace</p>
                    </div>
                 </div>
                 <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-zinc-400 uppercase">Product Name</label>
                           <input 
                            autoFocus
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-base font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-zinc-900 transition-all"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-zinc-400 uppercase">Unit Price (MMK)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">MMK</span>
                              <input 
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                className="w-full pl-14 pr-4 py-2 text-base font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-zinc-900 transition-all"
                              />
                           </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button onClick={handleSaveInfo} disabled={isSubmitting} className="flex-1 py-2.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-800 disabled:opacity-50 shadow-lg shadow-zinc-100">
                              {isSubmitting ? 'Syncing...' : 'Commit Changes'}
                           </button>
                           <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{product.name}</h2>
                        <div className="flex items-baseline gap-2">
                           <p className="text-lg font-black text-emerald-600 tracking-tight">{formatCurrency(product.price)}</p>
                           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Per Unit</p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                              SKU-{product.id.toString().padStart(6, '0')}
                           </div>
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                              Ver: {product.versionStamp?.substring(0, 6)}
                           </div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <hr className="border-zinc-50" />

           {/* Section 2: Stock Management */}
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inventory Asset Control</h4>
              </div>
              
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Inventory Level</p>
                       <p className="text-3xl font-black text-zinc-900 tracking-tighter mt-1">{product.currentStock} <span className="text-sm text-zinc-400">Units</span></p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      product.currentStock > 10 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                       {product.currentStock > 10 ? 'Healthy Stock' : 'Low Inventory'}
                    </div>
                 </div>

                 <div className="flex items-end gap-4 border-t border-zinc-100 pt-6">
                    <div className="flex-1 space-y-2">
                       <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Manual Override Value</label>
                       <input 
                         type="number"
                         value={newStock}
                         onChange={(e) => setNewStock(e.target.value)}
                         className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl font-black text-zinc-900 outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-xl"
                       />
                    </div>
                    <button 
                     disabled={isUpdatingStock || newStock === product.currentStock.toString()}
                     onClick={handleUpdateStock}
                     className="px-8 py-3.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl shadow-zinc-100"
                    >
                       {isUpdatingStock ? 'Syncing...' : 'Update Asset'}
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-400 font-bold">
                    <AlertCircle size={12} className="text-amber-500" />
                    Adjustments are recorded for financial audit trails.
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
           <button onClick={() => onDelete(product.id, product.versionStamp)} className="px-4 py-2 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-all">Archive Product</button>
           <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest opacity-50">Confidential • Enterprise SKU Record</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventories', {
        params: { pageNumber: page, pageSize: 15, searchTerm: search }
      });
      if (response.data.isSuccess) {
        const items = response.data.data || [];
        const mappedItems: Product[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          currentStock: item.currentStock || 0,
          imageUrl: item.imageUrl,
          versionStamp: item.versionStamp,
          stockVersionStamp: item.stockVersionStamp
        }));
        setProducts(mappedItems);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // SYNC SELECTED PRODUCT
        if (selectedProduct) {
          const updated = mappedItems.find(p => p.id === selectedProduct.id);
          if (updated) setSelectedProduct(updated);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedProduct]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('businessId', '0'); 
      const response = await api.post('/inventories', formData);
      if (response.data.isSuccess) {
        setIsAddModalOpen(false);
        setNewProduct({ name: '', price: '', stock: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = useCallback(async (id: number, version: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/inventories/${id}`, { params: { version } });
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchProducts(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="space-y-6 max-w-[1400px] animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-6 border border-zinc-100 rounded-xl shadow-sm">
        <div>
          <h1 className="text-base font-black text-zinc-900 uppercase tracking-widest">Inventory Matrix</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Global supply chain oversight & asset management.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-100">
          <Plus size={16} /> Register SKU
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          type="text"
          placeholder="Filter SKU database..."
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
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Product Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">MSRP (MMK)</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Stock Integrity</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                [...Array(8)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={4} className="h-16 bg-white" /></tr>)
              ) : products.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-32 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">Database Empty</td></tr>
              ) : (
                products.map((product) => (
                  <InventoryRow key={product.id} product={product} onSelect={setSelectedProduct} onDelete={handleDeleteProduct} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && products.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-50 bg-zinc-50/20">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-zinc-100 rounded-lg bg-white disabled:opacity-20 hover:bg-zinc-50 shadow-sm"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-zinc-100 rounded-lg bg-white disabled:opacity-20 hover:bg-zinc-50 shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onUpdate={fetchProducts}
          onDelete={handleDeleteProduct}
          onEditSuccess={(updated) => setSelectedProduct(updated)}
        />
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white border border-zinc-100 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-98 duration-150">
            <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4">Onboard New SKU</h3>
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Product Identification</label>
                <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Legal Product Name" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Unit Price</label>
                  <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Initial Stock</label>
                  <input required type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900" />
                </div>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 mt-4">
                {isSubmitting ? <Loader2 size={16} className="animate-spin m-auto" /> : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
