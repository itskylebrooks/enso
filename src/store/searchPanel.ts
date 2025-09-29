import { create } from 'zustand';

type SearchPanelOpenSource = 'hotkey' | 'slash' | 'button';

type SearchPanelState = {
  open: boolean;
  query: string;
  selectedIndex: number;
  resultCount: number;
  lastActiveElement: HTMLElement | null;
  openWithHotkey: (initial?: string, source?: SearchPanelOpenSource) => void;
  close: () => void;
  setQuery: (q: string) => void;
  moveSelection: (delta: number) => void;
  setResultCount: (count: number) => void;
  setSelectedIndex: (value: number | ((prev: number) => number)) => void;
};

const captureActiveElement = (): HTMLElement | null => {
  if (typeof window === 'undefined') return null;
  const active = document.activeElement;
  if (active && active instanceof HTMLElement) {
    return active;
  }
  return null;
};

export const useSearchPanelStore = create<SearchPanelState>((set, get) => ({
  open: false,
  query: '',
  selectedIndex: -1,
  resultCount: 0,
  lastActiveElement: null,
  openWithHotkey: (initial, source = 'hotkey') => {
    const shouldResetQuery = source === 'slash' || initial === '';
    const nextQuery = shouldResetQuery ? initial ?? '' : initial ?? get().query;
    const prior = captureActiveElement();
    set({
      open: true,
      query: nextQuery,
      selectedIndex: -1,
      lastActiveElement: prior,
    });
  },
  close: () => {
    const { lastActiveElement } = get();
    set({ open: false, selectedIndex: -1 });
    if (lastActiveElement) {
      window.requestAnimationFrame(() => {
        lastActiveElement.focus({ preventScroll: true });
      });
    }
  },
  setQuery: (q) => set({ query: q }),
  moveSelection: (delta) => {
    const { resultCount, selectedIndex } = get();
    if (resultCount <= 0) {
      set({ selectedIndex: -1 });
      return;
    }
    const nextIndex = (selectedIndex + delta + resultCount) % resultCount;
    set({ selectedIndex: nextIndex });
  },
  setResultCount: (count) => {
    set({ resultCount: count });
    if (count === 0) {
      set({ selectedIndex: -1 });
      return;
    }
    if (get().selectedIndex >= count || get().selectedIndex === -1) {
      set({ selectedIndex: 0 });
    }
  },
  setSelectedIndex: (value) => {
    set((state) => ({ selectedIndex: typeof value === 'function' ? value(state.selectedIndex) : value }));
  },
}));
