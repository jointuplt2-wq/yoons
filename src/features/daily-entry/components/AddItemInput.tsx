'use client'

// Design Ref: §5.4 — 인라인 항목 추가. Enter=저장, Escape=취소, blur=저장
import { useState } from 'react'

interface Props {
  onAdd: (text: string) => void
  placeholder?: string
}

export function AddItemInput({ onAdd, placeholder = '항목 추가...' }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (trimmed) onAdd(trimmed)
    setText('')
    setOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setOpen(false) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 mt-1 py-1 transition-colors"
      >
        <span className="text-base leading-none">+</span> 추가
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={text}
      onChange={e => setText(e.target.value)}
      onKeyDown={handleKey}
      onBlur={submit}
      placeholder={placeholder}
      className="w-full mt-1 py-1 text-sm border-b border-blue-400 outline-none bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
    />
  )
}
