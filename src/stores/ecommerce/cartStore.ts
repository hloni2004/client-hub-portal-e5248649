import { create } from 'zustand';
import { toast } from 'sonner';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product } from '@/types/ecommerce';

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  
  addItem: (product: Product, quantity: number, colorId?: number, sizeId?: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncLocalToServer: () => Promise<{ success: boolean; message?: string }>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isOpen: false,

      addItem: async (product: Product, quantity: number, colorId?: number, sizeId?: number) => {
        // If colorId or sizeId is not provided, fetch product details to get the first available color/size
        if (!colorId || !sizeId) {
          try {
            const apiClient = (await import('@/lib/api')).default;
            const response = await apiClient.get(`/products/read/${product.id}`);
            const productData = response.data.data || response.data;
            
            // Get first available colour and size
            if (productData.colours && productData.colours.length > 0) {
              const firstColour = productData.colours[0];
              colorId = firstColour.colourId;
              
              if (firstColour.sizes && firstColour.sizes.length > 0) {
                sizeId = firstColour.sizes[0].sizeId;
              }
            }
          } catch (error) {
            console.error('Error fetching product details:', error);
          }
        }
        
        // If we still don't have color/size, show error
        if (!colorId || !sizeId) {
          return {
            success: false,
            message: 'This product requires color and size selection. Please view product details to add to cart.'
          };
        }
        
        // Save to backend first if user is logged in to validate stock
        try {
          // Use auth store to get the current logged-in user (zustand persisted store)
          const { useAuthStore } = await import('@/stores/authStore');
          const user = useAuthStore.getState().user;

          if (user) {
            const apiClient = (await import('@/lib/api')).default;

            const payload: any = {
              userId: user.userId,
              productId: product.id,
              colourId: colorId,
              sizeId: sizeId,
              quantity: quantity
            };

            const response = await apiClient.post('/carts/add-item', payload);

            // Check if backend returned an error
            if (response.data && !response.data.success) {
              return { 
                success: false, 
                message: response.data.message 
              };
            }
          }
        } catch (error: any) {
          console.error('Error saving to cart:', error);

          // If authorization failed (403/401), fall back to local-only cart and inform the user
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            console.warn('Auth error when saving to server cart; falling back to local cart');
            toast('Added to local cart. Please sign in to save to your account.');
            // Let the flow continue to update local cart (do not return failure)
          } else if (error.response?.data?.message) {
            // Check if it's a stock or business error from API
            return { 
              success: false, 
              message: error.response.data.message 
            };
          } else {
            return {
              success: false,
              message: 'Failed to add item to cart. Please try again.'
            };
          }
        }

        // Update local state
        const items = get().items;
        const existingIndex = items.findIndex(
          item => item.productId === product.id && item.colorId === colorId && item.sizeId === sizeId
        );

        let newItems: CartItem[];
        const price = product.salePrice || product.basePrice;

        if (existingIndex > -1) {
          newItems = items.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: Date.now(),
            productId: product.id,
            product,
            variantId: 0,
            colorId: colorId || 0,
            sizeId: sizeId || 0,
            quantity,
            unitPrice: price,
          };
          newItems = [...items, newItem];
        }

        const subtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ items: newItems, subtotal, itemCount, isOpen: true });
        
        return { success: true };
      },

      removeItem: (itemId: number) => {
        const newItems = get().items.filter(item => item.id !== itemId);
        const subtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        set({ items: newItems, subtotal, itemCount });
      },

      updateQuantity: (itemId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const newItems = get().items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        const subtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        set({ items: newItems, subtotal, itemCount });
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, itemCount: 0 });
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Sync local cart items to backend for logged-in users
      syncLocalToServer: async () => {
        const user = (await import('@/stores/authStore')).useAuthStore.getState().user;
        if (!user) return { success: false, message: 'No user logged in' };

        const apiClient = (await import('@/lib/api')).default;
        const items = get().items;

        for (const item of items) {
          try {
            await apiClient.post('/carts/add-item', {
              userId: user.userId,
              productId: item.productId,
              colourId: item.colorId,
              sizeId: item.sizeId,
              quantity: item.quantity,
            });
          } catch (e: any) {
            console.error('Failed to sync cart item', item, e);
            const status = e.response?.status;
            if (status === 401 || status === 403) {
              console.warn('Auth error while syncing cart item; skipping sync for this item');
              // Skip syncing this item (will remain in local cart)
              continue;
            }
            return { success: false, message: 'Failed to sync cart' };
          }
        }

        return { success: true };
      },
    }),
    {
      name: 'luxury-cart-storage',
    }
  )
);
