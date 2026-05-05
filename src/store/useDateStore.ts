'use client'

// Design Ref: §9.2 — Application layer. 날짜 선택 전역 상태 (Zustand)
import { create } from 'zustand'
import { format } from 'date-fns'

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// 날짜 문자열 YYYY-MM-DD을 로컬 Date로 파싱 (UTC 파싱 방지)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shiftDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return format(d, 'yyyy-MM-dd')
}

interface DateStore {
  selectedDate: string
  setDate: (date: string) => void
  goNext: () => void
  goPrev: () => void
  goToday: () => void
}

export const useDateStore = create<DateStore>((set, get) => ({
  selectedDate: today(),
  setDate: (date) => set({ selectedDate: date }),
  goNext: () => set({ selectedDate: shiftDate(get().selectedDate, 1) }),
  goPrev: () => set({ selectedDate: shiftDate(get().selectedDate, -1) }),
  goToday: () => set({ selectedDate: today() }),
}))
