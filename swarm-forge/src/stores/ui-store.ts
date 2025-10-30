import { create } from 'zustand';

/**
 * UI state management with Zustand
 * 
 * Manages UI-specific state like panels, modals, etc.
 */
interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  statsOpen: boolean;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleStats: () => void;
  closeSidebar: () => void;
  closeSettings: () => void;
  closeStats: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  statsOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  toggleStats: () => set((state) => ({ statsOpen: !state.statsOpen })),
  
  closeSidebar: () => set({ sidebarOpen: false }),
  closeSettings: () => set({ settingsOpen: false }),
  closeStats: () => set({ statsOpen: false }),
}));
