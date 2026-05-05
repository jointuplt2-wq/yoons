'use client'

// Design Ref: §5.4 — 반성 textarea. 500ms debounce 자동저장, 1000자 제한. Plan SC: FR-07
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_CHARS = 1000

interface Props {
  value: string
  onSave: (text: string) => void
}

export function ReflectionArea({ value, onSave }: Props) {
  const [text, setText] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 외부 value가 바뀌면(날짜 이동 등) 동기화
  useEffect(() => {
    setText(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value.slice(0, MAX_CHARS)
      setText(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onSave(val), 500)
    },
    [onSave]
  )

  const atLimit = text.length >= MAX_CHARS

  return (
    <div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="오늘 하루를 돌아보세요..."
        rows={4}
        className="w-full resize-none border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
      />
      <p className={`text-xs text-right mt-0.5 ${atLimit ? 'text-red-500' : 'text-gray-400'}`}>
        {text.length} / {MAX_CHARS}
      </p>
    </div>
  )
}
