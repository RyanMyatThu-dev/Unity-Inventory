'use client';

import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
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
  Upload,
  Save,
  TrendingUp,
  History,
  AlertCircle,
  Settings2,
  LayoutList,
  LayoutGrid
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
  categoryId?: number;
  categoryName?: string;
}

interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number;
  subCategories: Category[];
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

const CategoryOptions = ({ categories, level = 0 }: { categories: Category[], level?: number }) => (
  <>
    {categories.map(cat => (
      <React.Fragment key={cat.categoryId}>
        <option value={cat.categoryId}>
          {"\u00A0".repeat(level * 4)}{cat.categoryName}
        </option>
        {cat.subCategories && cat.subCategories.length > 0 && (
          <CategoryOptions categories={cat.subCategories} level={level + 1} />
        )}
      </React.Fragment>
    ))}
  </>
);

// --- Memoized Row ---
const InventoryRow = memo(({ product, index, onSelect, onDelete }: { 
  product: Product, 
  index: number,
  onSelect: (p: Product) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <tr 
    onClick={() => onSelect(product)}
    className="group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-b border-zinc-200 dark:border-zinc-700 last:border-0"
  >
    <td className="px-4 py-3 text-[10px] font-bold text-zinc-400 w-12 text-center border-r border-zinc-200 dark:border-zinc-700">
      {index}
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-zinc-400" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-zinc-400 font-medium">ID: {product.id.toString().padStart(5, '0')}</p>
            {product.categoryName && (
              <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md font-bold uppercase tracking-wider border border-zinc-200/50 dark:border-zinc-700/50">
                {product.categoryName}
              </span>
            )}
          </div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-right text-xs font-semibold text-zinc-900 dark:text-zinc-100">
      {formatCurrency(product.price)}
    </td>
    <td className="px-4 py-3 text-right">
      <div className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
        product.currentStock > 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}>
        {product.currentStock} Units
      </div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <Edit2 size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(product.id, product.versionStamp); }}
          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  </tr>
));
InventoryRow.displayName = 'InventoryRow';

const InventoryCard = memo(({ product, index, onSelect, onDelete }: { 
  product: Product, 
  index: number,
  onSelect: (p: Product) => void,
  onDelete: (id: number, version: string) => void 
}) => (
  <div 
    onClick={() => onSelect(product)}
    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
  >
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded shadow-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <Edit2 size={10} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(product.id, product.versionStamp); }}
        className="p-1.5 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 rounded shadow-sm text-zinc-400 hover:text-rose-600 transition-colors"
      >
        <Trash2 size={10} />
      </button>
    </div>
    
    <div className="w-full h-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden mb-4 relative">
      <div className="absolute top-2 left-2 w-6 h-6 bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 shadow-sm">
        {index}
      </div>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package size={32} className="text-zinc-200" />
      )}
    </div>
    
    <div className="space-y-1 mb-4 flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1 flex-1">{product.name}</p>
        {product.categoryName && (
          <span className="text-[8px] px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-bold uppercase rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
            {product.categoryName}
          </span>
        )}
      </div>
      <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest">ID: {product.id.toString().padStart(5, '0')}</p>
    </div>
    
    <div className="flex items-center justify-between pt-3 border-t border-zinc-50 mt-auto">
      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(product.price)}</p>
      <div className={cn(
        "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
        product.currentStock > 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}>
        {product.currentStock} Units
      </div>
    </div>
  </div>
));
InventoryCard.displayName = 'InventoryCard';

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
  const [editForm, setEditForm] = useState({ 
    name: product.name, 
    price: product.price.toString(),
    categoryId: product.categoryId?.toString() || '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync form ONLY when NOT editing (e.g. after background refresh or on mount)
  useEffect(() => {
    if (!isEditing) {
      setEditForm({ 
        name: product.name, 
        price: product.price.toString(),
        categoryId: product.categoryId?.toString() || ''
      });
    }
  }, [product, isEditing]);
  
  // Stock Update State
  const [newStock, setNewStock] = useState(product.currentStock.toString());
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReplaceImage = async () => {
    if (!imageFile) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('Id', product.id.toString());
      formData.append('Name', product.name);
      formData.append('Price', product.price.toString());
      formData.append('VersionStamp', product.versionStamp);
      if (product.stockVersionStamp) {
        formData.append('StockVersionStamp', product.stockVersionStamp);
      }
      formData.append('photoFile', imageFile);

      const response = await api.put('/inventories', formData);
      if (response.data.isSuccess) {
        setImageFile(null);
        setImagePreview(null);
        onUpdate();
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      alert(error.response?.data?.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveInfo = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('Id', product.id.toString());
      formData.append('Name', editForm.name);
      formData.append('Price', editForm.price);
      if (editForm.categoryId) {
        formData.append('CategoryId', editForm.categoryId);
      }
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
          price: parseFloat(editForm.price),
          categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : undefined,
          categoryName: categories.find(c => c.categoryId.toString() === editForm.categoryId)?.categoryName
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
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-xl shadow-2xl animate-in zoom-in-98 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
                <Box size={14} className="text-white dark:text-zinc-900" />
              </div>
              <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Management Console</h3>
           </div>
           <div className="flex items-center gap-2">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <Edit2 size={10} />
                  Update Product
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
           {/* Section 1: Basic Info */}
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-zinc-900 rounded-full" />
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Core Product Specifications</h4>
              </div>
              
              <div className="flex gap-8 items-start relative">
                 <div className="w-24 h-24 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-zinc-300" />
                    )}
                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <div 
                      onClick={() => imageInputRef.current?.click()} 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1"
                    >
                       <Upload size={14} className="text-white" />
                       <p className="text-[8px] font-bold text-white uppercase">Replace</p>
                    </div>
                 </div>
                 {imageFile && (
                   <div className="absolute -bottom-8 left-0">
                     <button
                       onClick={handleReplaceImage}
                       disabled={isUploadingImage}
                       className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
                     >
                       {isUploadingImage ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                       {isUploadingImage ? 'Uploading...' : 'Save Photo'}
                     </button>
                   </div>
                 )}
                 <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-bold text-zinc-400 uppercase">Product Name</label>
                           <input 
                            autoFocus
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-all"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-bold text-zinc-400 uppercase">Unit Price (MMK)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">MMK</span>
                              <input 
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                className="w-full pl-14 pr-4 py-2 text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-all"
                              />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Category</label>
                            <select 
                              value={editForm.categoryId}
                              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                              className="w-full text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all appearance-none"
                            >
                               <option value="">Uncategorized</option>
                               <CategoryOptions categories={categoryTree} />
                            </select>
                         </div>
                        <div className="flex gap-2 pt-2">
                           <button onClick={handleSaveInfo} disabled={isSubmitting} className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 shadow-lg dark:shadow-black/20 shadow-zinc-100">
                              {isSubmitting ? 'Syncing...' : 'Commit Changes'}
                           </button>
                           <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{product.name}</h2>
                        <div className="flex items-baseline gap-2">
                           <p className="text-lg font-bold text-emerald-600 tracking-tight">{formatCurrency(product.price)}</p>
                           <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">Per Unit</p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                              PROD-{product.id.toString().padStart(6, '0')}
                           </div>
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                              Ver: {product.versionStamp?.substring(0, 6)}
                           </div>
                            {product.categoryName && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-500/20">
                                {product.categoryName}
                              </div>
                            )}
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
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inventory Asset Control</h4>
              </div>
              
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Inventory Level</p>
                       <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter mt-1">{product.currentStock} <span className="text-sm text-zinc-400">Units</span></p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      product.currentStock > 10 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    )}>
                       {product.currentStock > 10 ? 'Healthy Stock' : 'Low Inventory'}
                    </div>
                 </div>

                 <div className="flex items-end gap-4 border-t border-zinc-200 dark:border-zinc-700 pt-6">
                    <div className="flex-1 space-y-2">
                       <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Manual Override Value</label>
                       <input 
                         type="number"
                         value={newStock}
                         onChange={(e) => setNewStock(e.target.value)}
                         className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-xl"
                       />
                    </div>
                    <button 
                      disabled={isUpdatingStock || newStock === product.currentStock.toString()}
                      onClick={handleUpdateStock}
                      className="px-8 py-3.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-xl dark:shadow-black/20 shadow-emerald-100"
                    >
                       {isUpdatingStock ? 'Syncing...' : 'Update Asset'}
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-400 font-semibold">
                    <AlertCircle size={12} className="text-amber-500" />
                    Adjustments are recorded for financial audit trails.
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
           <button onClick={() => onDelete(product.id, product.versionStamp)} className="px-4 py-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">Archive Product</button>
           <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest opacity-50">Confidential • Enterprise Product Record</span>
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
  const [viewType, setViewType] = useState<'table' | 'grid'>('table');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', categoryId: '' });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/categories/tree'),
        api.get('/categories')
      ]);
      if (treeRes.data.isSuccess) setCategoryTree(treeRes.data.data);
      if (flatRes.data.isSuccess) setCategories(flatRes.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
          stockVersionStamp: item.stockVersionStamp,
          categoryId: item.categoryId,
          categoryName: item.categoryName
        }));
        setProducts(mappedItems);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Sync selected product with background updates
  useEffect(() => {
    if (selectedProduct) {
      const updated = products.find(p => p.id === selectedProduct.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(updated);
      }
    }
  }, [products]);

  const handleNewProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewProductImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      if (newProduct.categoryId) {
        formData.append('categoryId', newProduct.categoryId);
      }
      formData.append('businessId', '0');

      let response;
      if (newProductImage) {
        formData.append('photoFile', newProductImage);
        response = await api.post('/inventories/photo-upload', formData);
      } else {
        response = await api.post('/inventories', formData);
      }

      if (response.data.isSuccess) {
        setIsAddModalOpen(false);
        setNewProduct({ name: '', price: '', stock: '', categoryId: '' });
        setNewProductImage(null);
        setNewProductImagePreview(null);
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
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Inventory Matrix</h1>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">Global supply chain oversight & asset management.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100">
          <Plus size={16} /> New Product
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Filter Product database..."
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
                  <th className="px-4 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product Entity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">MSRP (MMK)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Stock Integrity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  [...Array(8)].map((_, i) => <tr key={i} className="animate-pulse border-b border-zinc-50"><td colSpan={5} className="h-16 bg-white dark:bg-zinc-900" /></tr>)
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-32 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">Database Empty</td></tr>
                ) : (
                  products.map((product, idx) => (
                    <InventoryRow 
                      key={product.id} 
                      product={product} 
                      index={(page - 1) * 15 + idx + 1}
                      onSelect={setSelectedProduct} 
                      onDelete={handleDeleteProduct} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
           {loading && products.length === 0 ? (
             [...Array(10)].map((_, i) => <div key={i} className="h-64 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl animate-pulse" />)
           ) : products.length === 0 ? (
             <div className="col-span-full py-32 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">Database Empty</div>
           ) : (
             products.map((product, idx) => (
               <InventoryCard 
                 key={product.id} 
                 product={product} 
                 index={(page - 1) * 15 + idx + 1}
                 onSelect={setSelectedProduct} 
                 onDelete={handleDeleteProduct} 
               />
             ))
           )}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-50 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl mt-4 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"><ChevronLeft size={16} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-20 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

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
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-98 duration-150">
            <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4">Onboard New Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Product Photo</label>
                <input type="file" ref={addImageInputRef} accept="image/*" className="hidden" onChange={handleNewProductImageSelect} />
                <div 
                  onClick={() => addImageInputRef.current?.click()}
                  className="w-full h-36 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800/50 transition-all group overflow-hidden relative"
                >
                  {newProductImagePreview ? (
                    <>
                      <img src={newProductImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-[9px] font-bold text-white uppercase tracking-widest">Change Photo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-zinc-300 group-hover:text-zinc-500 transition-colors mb-2" />
                      <p className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors">Click to upload product image</p>
                      <p className="text-[9px] text-zinc-300 mt-1">Optional • JPG, PNG, WebP</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Product Identification</label>
                <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Legal Product Name" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all shadow-inner" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Category Assignment</label>
                <select 
                  value={newProduct.categoryId} 
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} 
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 appearance-none cursor-pointer"
                >
                  <option value="">Uncategorized</option>
                  <CategoryOptions categories={categoryTree} />
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest px-1">Unit Price</label>
                  <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest px-1">Initial Stock</label>
                  <input required type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all shadow-inner" />
                </div>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/40 shadow-zinc-200 mt-4">
                {isSubmitting ? <Loader2 size={16} className="animate-spin m-auto" /> : 'Register Inventory Asset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
