// Design Ref: §5.3 — 섹션 헤더 + 콘텐츠 래퍼
interface Props {
  title: string
  emoji?: string
  children: React.ReactNode
}

export function SectionCard({ title, emoji, children }: Props) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
        {emoji && <span className="text-base">{emoji}</span>}
        {title}
      </h2>
      {children}
    </section>
  )
}
