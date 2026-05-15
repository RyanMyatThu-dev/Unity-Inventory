'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  X,
  Loader2,
  CornerDownRight,
  FolderTree,
  Box
} from 'lucide-react';

interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number;
  subCategories: Category[];
}

const CategoryNode = ({ 
  category, 
  level = 0, 
  isLast = false,
  onAddChild, 
  onEdit, 
  onDelete 
}: { 
  category: Category, 
  level?: number,
  isLast?: boolean,
  onAddChild: (parent: Category) => void,
  onEdit: (cat: Category) => void,
  onDelete: (id: number) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.subCategories && category.subCategories.length > 0;

  return (
    <div className="relative">
      <div 
        className={cn(
          "group flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer border border-transparent mb-0.5",
          level > 0 && "ml-6"
        )}
      >
        {/* Lined Connector for nested items */}
        {level > 0 && (
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800">
            {isLast && <div className="absolute top-1/2 bottom-0 left-0 right-0 bg-white dark:bg-zinc-950" />}
            <div className="absolute top-1/2 left-0 w-3 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-1" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {hasChildren ? (
              isExpanded ? <ChevronDown size={10} className="text-zinc-600 dark:text-zinc-400" /> : <ChevronRight size={10} className="text-zinc-600 dark:text-zinc-400" />
            ) : (
              <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Folder size={14} className={cn("shrink-0", hasChildren ? "text-zinc-400 fill-zinc-100 dark:fill-zinc-800" : "text-zinc-300")} />
            <span className={cn("text-[11px] font-bold tracking-tight", level === 0 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400")}>
              {category.categoryName}
            </span>
            {category.description && (
              <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity">
                — {category.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddChild(category); }}
            title="Add Sub-category"
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Plus size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(category.categoryId); }}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-zinc-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {category.subCategories.map((child, idx) => (
            <CategoryNode 
              key={child.categoryId} 
              category={child} 
              level={level + 1} 
              isLast={idx === category.subCategories.length - 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories/tree');
      if (response.data.isSuccess) {
        setTree(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleOpenCreate = (parent: Category | null = null) => {
    setEditingCategory(null);
    setParentCategory(parent);
    setForm({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setForm({ name: category.categoryName, description: category.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await api.put('/categories', {
          categoryId: editingCategory.categoryId,
          categoryName: form.name,
          description: form.description,
          parentCategoryId: editingCategory.parentCategoryId
        });
      } else {
        await api.post('/categories', {
          categoryName: form.name,
          description: form.description,
          parentCategoryId: parentCategory?.categoryId
        });
      }
      setIsModalOpen(false);
      fetchTree();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? It must be empty of products and sub-categories.')) return;
    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.isSuccess) {
        fetchTree();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm mb-6">
        <div>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <FolderTree size={16} />
            Category Architecture
          </h1>
          <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">Hierarchical Taxonomy & Asset Grouping</p>
        </div>
        
        <button 
          onClick={() => handleOpenCreate()}
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100"
        >
          <Plus size={14} /> New Entry
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
        {loading && tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={24} className="animate-spin text-zinc-300" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loading Architecture...</p>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
               <Folder size={20} className="text-zinc-200" />
            </div>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">No Nodes Defined</p>
            <button onClick={() => handleOpenCreate()} className="mt-4 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 underline decoration-2 underline-offset-4 uppercase tracking-widest">Initialize Root</button>
          </div>
        ) : (
          <div className="space-y-1 w-full">
            {tree.map(cat => (
              <CategoryNode 
                key={cat.categoryId} 
                category={cat} 
                onAddChild={handleOpenCreate}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-98 duration-150">
            <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 dark:border-zinc-800 pb-4">
               <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-zinc-900">
                  {editingCategory ? <Edit2 size={14} /> : <Plus size={14} />}
               </div>
               <div>
                  <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                    {editingCategory ? 'Modify Node' : parentCategory ? 'Add Sub-Node' : 'New Root Node'}
                  </h3>
                  {parentCategory && (
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-tight mt-0.5">Parent: {parentCategory.categoryName}</p>
                  )}
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Node Label</label>
                <input 
                  required 
                  autoFocus
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g. Smartphones" 
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-inner" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Description <span className="opacity-50">(Optional)</span></label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  placeholder="Classification details..." 
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-inner min-h-[80px] resize-none" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  disabled={isSubmitting} 
                  type="submit" 
                  className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl dark:shadow-black/20 shadow-zinc-100"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin m-auto" /> : editingCategory ? 'Update' : 'Confirm'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
