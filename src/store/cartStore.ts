import { create } from "zustand";
import { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, cantidad: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product) => {
    const existing = get().items.find((i) => i.product.id === product.id);
    if (existing) {
      set((state) => ({
        items: state.items.map((i) =>
          i.product.id === product.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        ),
      }));
    } else {
      set((state) => ({ items: [...state.items, { product, cantidad: 1 }] }));
    }
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),

  updateQuantity: (productId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, cantidad } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  total: () =>
    get().items.reduce(
      (sum, item) => sum + item.product.precio * item.cantidad,
      0
    ),
}));
