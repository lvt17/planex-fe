'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    ShoppingBagIcon,
    TagIcon,
    CubeIcon,
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    XMarkIcon,
    ShoppingCartIcon,
    PhotoIcon,
    MinusIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from './ConfirmModal';

interface Category {
    id: number;
    name: string;
    description: string;
    product_count: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    category_id: number | null;
    category_name: string | null;
    total_sold: number;
    image_url: string | null;
}

interface SalesPageProps {
    onBack: () => void;
}

// MMO Category Suggestions
const CATEGORY_SUGGESTIONS = [
    'Via Facebook',
    'Clone Facebook',
    'Account Facebook',
    'Via Google',
    'Gmail',
    'Hotmail/Outlook',
    'VPS',
    'Proxy',
    'RDP',
    'SIM/OTP',
    'Tài khoản game',
    'Dịch vụ MMO khác',
];

export default function SalesPage({ onBack }: SalesPageProps) {
    const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'sales'>('sales');
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | null>(null);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
    const [sellQuantity, setSellQuantity] = useState(1);

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [productForm, setProductForm] = useState({ name: '', price: '', category_id: '', image_url: '' });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Handle image upload to Cloudinary
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Chỉ hỗ trợ: PNG, JPG, GIF, WEBP');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh không được quá 5MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setProductForm({ ...productForm, image_url: response.data.url });
            toast.success('Đã tải ảnh lên!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Lỗi khi tải ảnh');
        } finally {
            setUploading(false);
        }
    };

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/api/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.append('category_id', filterCategory.toString());
            if (searchQuery) params.append('search', searchQuery);

            const response = await api.get(`/api/products${params.toString() ? `?${params.toString()}` : ''}`);
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    }, [filterCategory, searchQuery]);

    useEffect(() => {
        Promise.all([fetchCategories(), fetchProducts()]).finally(() => setLoading(false));
    }, [fetchCategories, fetchProducts]);

    // Category CRUD
    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }
        try {
            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory.id}`, categoryForm);
                toast.success('Đã cập nhật danh mục');
            } else {
                await api.post('/api/categories', categoryForm);
                toast.success('Đã thêm danh mục mới');
            }
            setShowCategoryModal(false);
            setCategoryForm({ name: '', description: '' });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            toast.error('Lỗi khi lưu danh mục');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa danh mục',
            message: 'Xóa danh mục này sẽ xóa tất cả sản phẩm bên trong. Bạn có chắc chắn muốn tiếp tục?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/categories/${id}`);
                    toast.success('Đã xóa danh mục');
                    fetchCategories();
                    fetchProducts();
                } catch (error) {
                    toast.error('Lỗi khi xóa danh mục');
                }
            }
        });
    };

    // Product CRUD
    const handleSaveProduct = async () => {
        if (saving) return;
        if (!productForm.name.trim() || !productForm.price) {
            toast.error('Vui lòng nhập tên và giá sản phẩm');
            return;
        }
        setSaving(true);
        try {
            const data = {
                name: productForm.name,
                price: parseFloat(productForm.price),
                category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
                image_url: productForm.image_url || null
            };
            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, data);
                toast.success('Đã cập nhật sản phẩm');
            } else {
                await api.post('/api/products', data);
                toast.success('Đã thêm sản phẩm mới');
            }
            setShowProductModal(false);
            setProductForm({ name: '', price: '', category_id: '', image_url: '' });
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            toast.error('Lỗi khi lưu sản phẩm');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa sản phẩm',
            message: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/products/${id}`);
                    toast.success('Đã xóa sản phẩm');
                    fetchProducts();
                } catch (error) {
                    toast.error('Lỗi khi xóa sản phẩm');
                }
            }
        });
    };

    // Sell product with quantity
    const openSellModal = (product: Product) => {
        setSellingProduct(product);
        setSellQuantity(1);
        setShowSellModal(true);
    };

    const handleSellProduct = async () => {
        if (!sellingProduct || sellQuantity < 1) return;
        try {
            await api.post('/api/sales', {
                product_id: sellingProduct.id,
                quantity: sellQuantity
            });
            const total = sellingProduct.price * sellQuantity;
            toast.success(`+${total.toLocaleString('vi-VN')}đ từ ${sellingProduct.name} x${sellQuantity}`);
            setShowSellModal(false);
            setSellingProduct(null);
            fetchProducts();
        } catch (error) {
            toast.error('Lỗi khi ghi nhận bán hàng');
        }
    };

    // Quick sell (1 item)
    const handleQuickSell = async (product: Product) => {
        try {
            await api.post('/api/sales', { product_id: product.id, quantity: 1 });
            toast.success(`+${product.price.toLocaleString('vi-VN')}đ từ ${product.name}`);
            fetchProducts();
        } catch (error) {
            toast.error('Lỗi khi ghi nhận bán hàng');
        }
    };

    const tabs = [
        { id: 'sales', label: 'Bán hàng', icon: ShoppingCartIcon },
        { id: 'products', label: 'Hàng hoá', icon: CubeIcon },
        { id: 'categories', label: 'Danh mục', icon: TagIcon },
    ] as const;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                        <ShoppingBagIcon className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                        Bán hàng
                    </h1>
                    <p className="text-secondary text-xs sm:text-sm mt-1">Quản lý danh mục, sản phẩm và bán hàng</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover transition-colors cursor-pointer self-start sm:self-auto"
                >
                    Quay lại
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface p-1 rounded-xl mb-4 sm:mb-6 w-full sm:w-fit overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center sm:justify-start ${activeTab === tab.id
                            ? 'bg-accent text-page shadow-sm'
                            : 'text-secondary hover:text-primary hover:bg-hover'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden xs:inline sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                    {/* SALES TAB */}
                    {activeTab === 'sales' && (
                        <div>
                            {/* Search & Filter */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="flex-1 relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm sản phẩm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-surface border border-border text-primary text-sm focus:border-accent focus:outline-none"
                                    />
                                </div>
                                <select
                                    value={filterCategory || ''}
                                    onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface border border-border text-primary text-sm focus:border-accent focus:outline-none cursor-pointer"
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Products Grid */}
                            {products.length === 0 ? (
                                <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border">
                                    <CubeIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                                    <p className="text-secondary">Chưa có sản phẩm nào. Vào tab "Hàng hoá" để thêm sản phẩm.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {products.map(product => (
                                        <div key={product.id} className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-all group">
                                            {/* Product Image */}
                                            <div className="aspect-square bg-page rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <CubeIcon className="w-12 h-12 text-muted" />
                                                )}
                                            </div>
                                            <h3 className="font-bold text-primary text-sm line-clamp-2 mb-1">{product.name}</h3>
                                            {product.category_name && (
                                                <span className="text-[10px] text-muted uppercase tracking-wider">{product.category_name}</span>
                                            )}
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="font-bold text-accent">{product.price.toLocaleString('vi-VN')}đ</span>
                                                <span className="text-xs text-muted">Đã bán: {product.total_sold}</span>
                                            </div>
                                            {/* Sell Buttons */}
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleQuickSell(product)}
                                                    className="flex-1 py-2 rounded-lg bg-accent/10 text-accent font-bold text-sm hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Bán 1
                                                </button>
                                                <button
                                                    onClick={() => openSellModal(product)}
                                                    className="px-3 py-2 rounded-lg bg-surface border border-border text-secondary hover:text-accent hover:border-accent transition-all cursor-pointer"
                                                    title="Bán nhiều"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setProductForm({ name: '', price: '', category_id: '', image_url: '' });
                                        setShowProductModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Thêm sản phẩm
                                </button>
                            </div>

                            {products.length === 0 ? (
                                <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border">
                                    <CubeIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                                    <p className="text-secondary">Chưa có sản phẩm nào</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {products.map(product => (
                                        <div key={product.id} className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent transition-all group">
                                            {/* Product Image */}
                                            <div className="aspect-video bg-page flex items-center justify-center overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <PhotoIcon className="w-12 h-12 text-muted" />
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-primary line-clamp-1">{product.name}</h3>
                                                <p className="text-xs text-muted mt-1">{product.category_name || 'Không có danh mục'}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="font-bold text-accent text-lg">{product.price.toLocaleString('vi-VN')}đ</span>
                                                    <span className="text-xs text-secondary">Đã bán: {product.total_sold}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setProductForm({
                                                                name: product.name,
                                                                price: product.price.toString(),
                                                                category_id: product.category_id?.toString() || '',
                                                                image_url: product.image_url || ''
                                                            });
                                                            setShowProductModal(true);
                                                        }}
                                                        className="p-2 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 cursor-pointer"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-2 rounded-lg text-secondary hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CATEGORIES TAB */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-muted">Gợi ý:</span>
                                    {CATEGORY_SUGGESTIONS.slice(0, 6).map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                setCategoryForm({ name: suggestion, description: '' });
                                                setEditingCategory(null);
                                                setShowCategoryModal(true);
                                            }}
                                            className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
                                        >
                                            + {suggestion}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingCategory(null);
                                        setCategoryForm({ name: '', description: '' });
                                        setShowCategoryModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Thêm danh mục
                                </button>
                            </div>

                            {categories.length === 0 ? (
                                <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border">
                                    <TagIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                                    <p className="text-secondary mb-4">Chưa có danh mục nào</p>
                                    <p className="text-xs text-muted">Click vào gợi ý phía trên để thêm nhanh</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map(category => (
                                        <div key={category.id} className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                                        <TagIcon className="w-5 h-5 text-accent" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-primary">{category.name}</h3>
                                                        <p className="text-xs text-muted">{category.product_count} sản phẩm</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(category);
                                                            setCategoryForm({ name: category.name, description: category.description });
                                                            setShowCategoryModal(true);
                                                        }}
                                                        className="p-1.5 rounded text-secondary hover:text-accent hover:bg-accent/10 cursor-pointer"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="p-1.5 rounded text-secondary hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {category.description && (
                                                <p className="text-sm text-secondary mt-3 line-clamp-2">{category.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-primary">
                                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
                            </h2>
                            <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded hover:bg-hover cursor-pointer">
                                <XMarkIcon className="w-5 h-5 text-secondary" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Tên danh mục *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    placeholder="VD: Via Facebook, Clone, Gmail..."
                                />
                                {/* Quick suggestions */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {CATEGORY_SUGGESTIONS.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setCategoryForm({ ...categoryForm, name: s })}
                                            className="text-[10px] px-2 py-0.5 rounded bg-page text-muted hover:text-accent cursor-pointer"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Mô tả</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none resize-none h-20"
                                    placeholder="Mô tả ngắn về danh mục..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-accent text-page hover:opacity-90 cursor-pointer"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-primary">
                                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
                            </h2>
                            <button onClick={() => setShowProductModal(false)} className="p-1 rounded hover:bg-hover cursor-pointer">
                                <XMarkIcon className="w-5 h-5 text-secondary" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Ảnh sản phẩm</label>
                                {productForm.image_url ? (
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-page border border-border group">
                                        <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <label className="px-3 py-1.5 rounded-lg bg-white text-black text-sm font-medium cursor-pointer hover:bg-gray-100">
                                                Đổi ảnh
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setProductForm({ ...productForm, image_url: '' })}
                                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className={`flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-border bg-page cursor-pointer hover:border-accent transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent mb-2" />
                                                <span className="text-sm text-muted">Đang tải lên...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-10 h-10 text-muted mb-2" />
                                                <span className="text-sm text-muted">Click để chọn ảnh</span>
                                                <span className="text-xs text-muted mt-1">PNG, JPG, GIF, WEBP (max 5MB)</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Tên sản phẩm *</label>
                                <input
                                    type="text"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    placeholder="VD: Via 902 XMDT, Clone 5 năm..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Giá (VNĐ) *</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    placeholder="VD: 50000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">Danh mục</label>
                                <select
                                    value={productForm.category_id}
                                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none cursor-pointer"
                                >
                                    <option value="">Không có danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-accent text-page hover:opacity-90 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal (Multiple Quantity) */}
            {showSellModal && sellingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-primary">Bán hàng</h2>
                            <button onClick={() => setShowSellModal(false)} className="p-1 rounded hover:bg-hover cursor-pointer">
                                <XMarkIcon className="w-5 h-5 text-secondary" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="font-bold text-primary text-lg">{sellingProduct.name}</h3>
                            <p className="text-accent font-bold text-xl mt-1">{sellingProduct.price.toLocaleString('vi-VN')}đ / cái</p>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                                onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                                className="w-12 h-12 rounded-xl bg-page border border-border flex items-center justify-center text-primary hover:border-accent cursor-pointer"
                            >
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="number"
                                value={sellQuantity}
                                onChange={(e) => setSellQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 h-12 rounded-xl bg-page border border-border text-center text-xl font-bold text-primary focus:border-accent focus:outline-none"
                            />
                            <button
                                onClick={() => setSellQuantity(sellQuantity + 1)}
                                className="w-12 h-12 rounded-xl bg-page border border-border flex items-center justify-center text-primary hover:border-accent cursor-pointer"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Total */}
                        <div className="bg-page rounded-xl p-4 mb-6 text-center">
                            <p className="text-sm text-secondary">Tổng tiền</p>
                            <p className="text-2xl font-bold text-accent">
                                {(sellingProduct.price * sellQuantity).toLocaleString('vi-VN')}đ
                            </p>
                        </div>

                        <button
                            onClick={handleSellProduct}
                            className="w-full py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <ShoppingCartIcon className="w-5 h-5" />
                            Xác nhận bán {sellQuantity} sản phẩm
                        </button>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDanger={true}
            />
        </div>
    );
}
