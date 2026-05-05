'use client'

// Design Ref: §5.1 — 날짜 이전/다음 버튼 + 날짜 클릭 시 네이티브 달력 picker
import { useRef } from 'react'
import { useDateStore } from '@/store/useDateStore'

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const today = new Date()
  const isToday =
    y === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate()

  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dow = new Date(y, m - 1, d).getDay()

  if (isToday) return `오늘 ${m}월 ${d}일`
  return `${m}월 ${d}일 (${days[dow]})`
}

export function DateNav() {
  const { selectedDate, goPrev, goNext, setDate } = useDateStore()
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    // showPicker()는 Chrome 99+, Firefox 101+ 지원
    inputRef.current?.showPicker?.()
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={goPrev}
        className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-lg leading-none"
        aria-label="이전 날짜"
      >
        ‹
      </button>

      <button
        onClick={openPicker}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        {formatDisplay(selectedDate)}
      </button>

      {/* 시각적으로 숨긴 date input — 달력 picker 트리거용 */}
      <input
        ref={inputRef}
        type="date"
        value={selectedDate}
        onChange={e => e.target.value && setDate(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        onClick={goNext}
        className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-lg leading-none"
        aria-label="다음 날짜"
      >
        ›
      </button>
    </div>
  )
}
