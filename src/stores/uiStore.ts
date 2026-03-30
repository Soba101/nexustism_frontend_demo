import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket } from '@/types';

interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'info' | 'error';
}

interface UIState {
  selectedTicket: Ticket | null;
  selectedTicketForAnalysis: Ticket | null;
  theme: 'light' | 'dark';
  isMobileOpen: boolean;
  toasts: Toast[];
}

interface UIActions {
  setSelectedTicket: (ticket: Ticket | null) => void;
  setSelectedTicketForAnalysis: (ticket: Ticket | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsMobileOpen: (open: boolean) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  dismissToast: (id: number) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      selectedTicket: null,
      selectedTicketForAnalysis: null,
      theme: 'light',
      isMobileOpen: false,
      toasts: [],

      setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
      setSelectedTicketForAnalysis: (ticket) => set({ selectedTicketForAnalysis: ticket }),
      setTheme: (theme) => set({ theme }),
      setIsMobileOpen: (open) => set({ isMobileOpen: open }),

      addToast: (msg, type) => {
        const id = Date.now();
        set((state) => ({ toasts: [...state.toasts, { id, msg, type }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
      },

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'itsm-ui-theme',
      // Only persist theme — all other state is session-only
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
