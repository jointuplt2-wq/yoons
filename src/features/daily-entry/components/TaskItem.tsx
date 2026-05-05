'use client'

// Design Ref: §5.3 — 체크박스 항목 (오늘 할 일 / 내일 할 일). Plan SC: FR-04
interface Props {
  id: string
  text: string
  completed: boolean
  onToggle: () => void
  onRemove: () => void
}

export function TaskItem({ text, completed, onToggle, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 group py-1 min-h-[28px]">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          completed
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        aria-label={completed ? '완료 취소' : '완료 표시'}
      >
        {completed && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`text-sm flex-1 ${completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
        {text}
      </span>

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
