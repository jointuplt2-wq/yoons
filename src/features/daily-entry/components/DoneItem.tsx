'use client'

// Design Ref: §5.3 — 오늘 한 일 항목 (완료 체크 없음). Plan SC: FR-03
interface Props {
  text: string
  onRemove: () => void
}

export function DoneItem({ text, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 group py-1 min-h-[28px]">
      <span className="text-blue-400 text-sm shrink-0 leading-none">•</span>
      <span className="text-sm flex-1 text-gray-700 dark:text-gray-200">{text}</span>
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none"
        aria-label="항목 삭제"
      >
        ×
      </button>
    </div>
  )
}
