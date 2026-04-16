import { create } from "zustand";

interface UserSession {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
}

interface AuthStore {
  user: UserSession | null;
  loading: boolean;
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  loading: true,

  fetchSession: async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.loggedIn) {
        set({
          user: {
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion,
            comuna: data.comuna,
          },
          loading: false,
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
