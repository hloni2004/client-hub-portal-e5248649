import { create } from 'zustand';
import { Product, Category, Cart, CartItem } from '@/types/ecommerce';
import apiClient from '@/lib/api';

interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  rating?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'rating';
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
  currentProduct: Product | null;
  filters: ProductFilters;
  loading: boolean;
  error: string | null;
  
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  fetchProductsByCategory: (categoryId: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  searchProducts: (query: string) => Promise<void>;
}

// Mock data for development
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Silk Evening Gown',
    description: 'Exquisite hand-crafted silk evening gown with delicate embroidery. A masterpiece of Italian craftsmanship.',
    basePrice: 2850,
    sku: 'EVE-001',
    categoryId: 1,
    brand: 'Maison Élégance',
    rating: 4.9,
    reviewCount: 127,
    variants: [],
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
    isActive: true,
    isNew: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Cashmere Blazer',
    description: 'Premium Italian cashmere blazer with mother-of-pearl buttons. Timeless elegance for the discerning gentleman.',
    basePrice: 1890,
    salePrice: 1512,
    sku: 'BLZ-002',
    categoryId: 2,
    brand: 'Artisan Milano',
    rating: 4.8,
    reviewCount: 89,
    variants: [],
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Leather Handbag',
    description: 'Hand-stitched calfskin leather handbag with 24k gold-plated hardware. Made in Florence.',
    basePrice: 3200,
    sku: 'BAG-003',
    categoryId: 3,
    brand: 'Casa Fiorentina',
    rating: 5.0,
    reviewCount: 56,
    variants: [],
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
    isActive: true,
    isNew: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Diamond Pendant',
    description: 'Brilliant-cut diamond pendant set in 18k white gold. 1.5 carat center stone with VS1 clarity.',
    basePrice: 12500,
    sku: 'JWL-004',
    categoryId: 4,
    brand: 'Maison Diamant',
    rating: 4.9,
    reviewCount: 23,
    variants: [],
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Wool Overcoat',
    description: 'Double-breasted virgin wool overcoat. Expertly tailored in London with silk lining.',
    basePrice: 2400,
    sku: 'COT-005',
    categoryId: 2,
    brand: 'Savile & Co',
    rating: 4.7,
    reviewCount: 145,
    variants: [],
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Velvet Loafers',
    description: 'Belgian velvet loafers with hand-embroidered gold crest. Ultimate evening sophistication.',
    basePrice: 890,
    sku: 'SHO-006',
    categoryId: 5,
    brand: 'Atelier Luxe',
    rating: 4.8,
    reviewCount: 67,
    variants: [],
    images: ['https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=800'],
    isActive: true,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCategories: Category[] = [
  { id: 1, name: 'Evening Wear', description: 'Elegant attire for special occasions', isActive: true, productCount: 24 },
  { id: 2, name: 'Outerwear', description: 'Premium coats and jackets', isActive: true, productCount: 18 },
  { id: 3, name: 'Accessories', description: 'Luxury handbags and accessories', isActive: true, productCount: 32 },
  { id: 4, name: 'Jewelry', description: 'Fine jewelry and timepieces', isActive: true, productCount: 15 },
  { id: 5, name: 'Footwear', description: 'Handcrafted luxury footwear', isActive: true, productCount: 21 },
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  featuredProducts: [],
  categories: [],
  currentProduct: null,
  filters: {},
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      // const response = await apiClient.get('/products/getAll');
      // set({ products: response.data, loading: false });
      // Mock data for now
      set({ products: mockProducts, featuredProducts: mockProducts.filter(p => p.isFeatured), loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  fetchProductById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      // const response = await apiClient.get(`/products/read/${id}`);
      // set({ currentProduct: response.data, loading: false });
      const product = mockProducts.find(p => p.id === id) || null;
      set({ currentProduct: product, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch product', loading: false });
    }
  },

  fetchProductsByCategory: async (categoryId: number) => {
    set({ loading: true, error: null });
    try {
      // const response = await apiClient.get(`/products/category/${categoryId}`);
      // set({ products: response.data, loading: false });
      const filtered = mockProducts.filter(p => p.categoryId === categoryId);
      set({ products: filtered, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      // const response = await apiClient.get('/categories/getAll');
      // set({ categories: response.data });
      set({ categories: mockCategories });
    } catch (error) {
      set({ error: 'Failed to fetch categories' });
    }
  },

  setFilters: (filters: ProductFilters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  searchProducts: async (query: string) => {
    set({ loading: true, error: null });
    try {
      const filtered = mockProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );
      set({ products: filtered, loading: false });
    } catch (error) {
      set({ error: 'Failed to search products', loading: false });
    }
  },
}));
