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
  categoriesLoading: boolean;
  error: string | null;
  
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  fetchProductsByCategory: (categoryId: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  searchProducts: (query: string) => Promise<void>;
  searchSuggestions: (query: string) => Promise<Product[]>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  featuredProducts: [],
  categories: [],
  currentProduct: null,
  filters: {},
  loading: false,
  categoriesLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/products/getAll');
      const products = response.data.data || response.data;
      
      // Transform backend data to frontend format
      const transformedProducts = products.map((p: any) => ({
        id: p.productId,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        salePrice: p.comparePrice > 0 ? p.comparePrice : undefined,
        sku: p.sku,
        categoryId: p.category?.categoryId || 0,
        category: p.category,
        brand: 'Maison Luxe',
        rating: 4.5,
        reviewCount: 0,
        variants: [],
        images: [], // Legacy field
        productImages: p.images, // New blob-based images
        isActive: p.isActive,
        isNew: false,
        isFeatured: false,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      }));
      
      set({ 
        products: transformedProducts, 
        featuredProducts: transformedProducts.filter((p: any) => p.isFeatured), 
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to fetch products', loading: false, products: [] });
    }
  },

  fetchProductById: async (id: number) => {
    set({ loading: true, error: null, currentProduct: null });
    try {
      const response = await apiClient.get(`/products/read/${id}`);
      const p = response.data.data || response.data;
      
      const transformedProduct = {
        id: p.productId,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        salePrice: p.comparePrice > 0 ? p.comparePrice : undefined,
        sku: p.sku,
        categoryId: p.category?.categoryId || 0,
        category: p.category,
        brand: 'Maison Luxe',
        rating: 4.5,
        reviewCount: 0,
        variants: [],
        images: [],
        productImages: p.images,
        colours: p.colours || [], // Add colours from backend
        isActive: p.isActive,
        isNew: false,
        isFeatured: false,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
      
      set({ currentProduct: transformedProduct, loading: false });
    } catch (error) {
      console.error('Error fetching product:', error);
      set({ currentProduct: null, loading: false, error: 'Failed to fetch product' });
    }
  },

  fetchProductsByCategory: async (categoryId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/products/category/${categoryId}`);
      const products = response.data?.data || response.data;
      
      const transformedProducts = Array.isArray(products) ? products.map((p: any) => ({
        id: p.productId,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        salePrice: p.comparePrice > 0 ? p.comparePrice : undefined,
        sku: p.sku,
        categoryId: p.category?.categoryId || 0,
        category: p.category,
        brand: 'Maison Luxe',
        rating: 4.5,
        reviewCount: 0,
        variants: [],
        images: [],
        productImages: p.images,
        isActive: p.isActive,
        isNew: false,
        isFeatured: false,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      })) : [];
      
      set({ products: transformedProducts, loading: false });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      set({ error: 'Failed to fetch products', loading: false, products: [] });
    }
  },

  fetchCategories: async () => {
    const { categoriesLoading, categories } = get();
    
    // Prevent duplicate fetches only if loading or already successfully loaded
    if (categoriesLoading) {
      return;
    }
    
    set({ categoriesLoading: true });
    try {
      const response = await apiClient.get('/categories/getAll');
      const categoriesData = response.data?.data || response.data;
      
      console.log('Categories API response:', categoriesData);
      console.log('Is array?', Array.isArray(categoriesData));
      
      // Map backend categories to frontend Category interface
      // Include ALL categories, not just active ones
      const mappedCategories = Array.isArray(categoriesData) 
        ? categoriesData
            .map((cat: any) => {
              console.log(`Category ${cat.name}: isActive = ${cat.isActive}, imageUrl = ${cat.imageUrl}`);
              // Handle both blob images and URL strings
              let imageUrl = cat.imageUrl;
              
              // If imageUrl looks like base64 data, use it directly
              if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                // Assume it's base64 blob data
                imageUrl = `data:image/jpeg;base64,${imageUrl}`;
              }
              
              return {
                id: cat.categoryId,
                name: cat.name,
                description: cat.description,
                image: imageUrl,
                isActive: cat.isActive,
              };
            })
            .filter((category, index, self) => 
              index === self.findIndex((c) => c.id === category.id)
            )
        : [];
      
      console.log('Mapped categories:', mappedCategories);
      console.log('Number of categories:', mappedCategories.length);
      
      set({ categories: mappedCategories, categoriesLoading: false });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({ categories: [], categoriesLoading: false, error: 'Failed to fetch categories' });
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
      if (!query.trim()) {
        await get().fetchProducts();
        return;
      }
      const response = await apiClient.get('/products/search', { params: { query } });
      const productsData = response.data?.data || response.data;
      set({ products: Array.isArray(productsData) ? productsData : [], loading: false });
    } catch (error) {
      console.error('Failed to search products:', error);
      set({ error: 'Failed to search products', loading: false });
    }
  },

  searchSuggestions: async (query: string) => {
    try {
      if (!query.trim() || query.length < 2) {
        return [];
      }
      const response = await apiClient.get('/products/search', { params: { query } });
      const productsData = response.data?.data || response.data;
      return Array.isArray(productsData) ? productsData.slice(0, 5) : [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }
  },
}));
