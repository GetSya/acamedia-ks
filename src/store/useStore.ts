import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  nama_lengkap: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
    }),
    { name: 'auth-storage' }
  )
);

interface CartItem {
  kode_item: string;
  nama_item: string;
  harga_jual: number;
  quantity: number;
  image_url: string;
  diskon?: number;
  flashsale?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (kode_item: string) => void;
  updateQuantity: (kode_item: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.kode_item === item.kode_item);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.kode_item === item.kode_item
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (kode_item) =>
        set((state) => ({
          items: state.items.filter((i) => i.kode_item !== kode_item),
        })),
      updateQuantity: (kode_item, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.kode_item === kode_item ? { ...i, quantity } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' }
  )
);
