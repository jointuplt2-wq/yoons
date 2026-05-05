import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeKey = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet'

export const THEMES: Record<ThemeKey, { label: string; dot: string; from: string; to: string }> = {
  indigo: { label: '인디고', dot: '#6366f1', from: '#6366f1', to: '#3b82f6' },
  rose:   { label: '로즈',   dot: '#fb7185', from: '#fb7185', to: '#ec4899' },
  emerald:{ label: '에메랄드',dot: '#34d399', from: '#34d399', to: '#14b8a6' },
  amber:  { label: '앰버',   dot: '#fbbf24', from: '#fbbf24', to: '#fb923c' },
  violet: { label: '바이올렛',dot: '#8b5cf6', from: '#8b5cf6', to: '#a855f7' },
}

interface ThemeStore {
  theme: ThemeKey
  isDark: boolean
  setTheme: (t: ThemeKey) => void
  toggleDark: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'indigo',
      isDark: false,
      setTheme: (theme) => set({ theme }),
      toggleDark: () => set(s => ({ isDark: !s.isDark })),
    }),
    { name: 'planner-theme' }
  )
)
