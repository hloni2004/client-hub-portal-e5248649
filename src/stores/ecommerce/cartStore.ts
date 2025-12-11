import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product } from '@/types/ecommerce';

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  
  addItem: (product: Product, quantity: number, colorId?: number, sizeId?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isOpen: false,

      addItem: async (product: Product, quantity: number, colorId?: number, sizeId?: number) => {
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

        // Save to backend if user is logged in
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const apiClient = (await import('@/lib/api')).default;
            await apiClient.post('/carts/add-item', {
              userId: user.userId,
              productId: product.id,
              colourId: colorId,
              sizeId: sizeId,
              quantity: quantity
            });
          }
        } catch (error) {
          console.error('Error saving to cart:', error);
          // Continue anyway - item is saved in localStorage
        }
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
    }),
    {
      name: 'luxury-cart-storage',
    }
  )
);
