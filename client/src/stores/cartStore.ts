import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  stock: number; // 商品庫存上限，用於防超賣驗證
  selectedSpecs?: Record<string, string>;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          // Items with different specs are treated as distinct cart entries
          const specsKey = JSON.stringify(item.selectedSpecs ?? {});
          const existingItem = state.items.find(
            (i) => i.id === item.id && JSON.stringify(i.selectedSpecs ?? {}) === specsKey
          );
          if (existingItem) {
            const newQty = Math.min(existingItem.quantity + item.quantity, item.stock);
            return {
              items: state.items.map((i) =>
                i.id === item.id && JSON.stringify(i.selectedSpecs ?? {}) === specsKey
                  ? { ...i, quantity: newQty, stock: item.stock }
                  : i
              ),
            };
          }
          // New item: clamp quantity to stock
          return { items: [...state.items, { ...item, quantity: Math.min(item.quantity, item.stock) }] };
        });
      },

      // Returns the current quantity in cart for a given product+specs combination
      getItemQuantity: (id: number, selectedSpecs?: Record<string, string>) => {
        const specsKey = JSON.stringify(selectedSpecs ?? {});
        const found = get().items.find(
          (i) => i.id === id && JSON.stringify(i.selectedSpecs ?? {}) === specsKey
        );
        return found?.quantity ?? 0;
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
