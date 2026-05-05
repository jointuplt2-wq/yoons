'use client'

// Design Ref: §5.1 — 메인 플래너 페이지. 4섹션 + 날짜 네비게이션 조합
import { useState } from 'react'
import { useDateStore } from '@/store/useDateStore'
import { useThemeStore, THEMES, ThemeKey } from '@/store/useThemeStore'
import { useDailyEntry } from '@/features/daily-entry/hooks/useDailyEntry'
import { useCarryOver } from '@/features/carry-over/hooks/useCarryOver'
import { SectionCard } from '@/features/daily-entry/components/SectionCard'
import { TaskItem } from '@/features/daily-entry/components/TaskItem'
import { DoneItem } from '@/features/daily-entry/components/DoneItem'
import { AddItemInput } from '@/features/daily-entry/components/AddItemInput'
import { ReflectionArea } from '@/features/daily-entry/components/ReflectionArea'
import { DateNav } from '@/components/planner/DateNav'
import { useRouter } from 'next/navigation'
import { bkend } from '@/lib/bkend'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 mt-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 h-24" />
      ))}
    </div>
  )
}

export default function PlannerPage() {
  const router = useRouter()
  const { theme, setTheme, isDark, toggleDark } = useThemeStore()
  const t = THEMES[theme]
  const [showThemePicker, setShowThemePicker] = useState(false)

  // Plan SC: FR-05 — 앱 오픈 시 자동 이월 실행
  useCarryOver()

  function handleLogout() {
    bkend.auth.logout()
    router.push('/')
  }

  const { selectedDate } = useDateStore()
  const {
    entry,
    isLoading,
    addTask,
    addDoneItem,
    toggleTask,
    removeItem,
    updateReflection,
  } = useDailyEntry(selectedDate)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-lg mx-auto px-4">
        {/* 헤더 */}
        <header className="flex items-center justify-between py-5 border-b border-gray-100 dark:border-gray-700 mb-4">
          <div className="flex items-center gap-2">
            {/* 아이콘 */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(to bottom right, ${t.from}, ${t.to})` }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">daily planner</h1>
          </div>
          <div className="flex items-center gap-3">
            <DateNav />

            {/* 다크모드 토글 */}
            <button
              onClick={toggleDark}
              className="text-lg hover:scale-110 transition-transform"
              title={isDark ? '라이트 모드' : '다크 모드'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* 테마 선택 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(p => !p)}
                className="text-lg hover:scale-110 transition-transform"
                title="테마 변경"
              >
                🎨
              </button>
              {showThemePicker && (
                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-3 flex gap-2 z-10">
                  {(Object.entries(THEMES) as [ThemeKey, typeof t][]).map(([key, th]) => (
                    <button
                      key={key}
                      onClick={() => { setTheme(key); setShowThemePicker(false) }}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: `linear-gradient(to bottom right, ${th.from}, ${th.to})`,
                        outline: theme === key ? `2px solid ${th.dot}` : 'none',
                        outlineOffset: '2px',
                      }}
                      title={th.label}
                    />
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">로그아웃</button>
          </div>
        </header>

        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="space-y-3">
            {/* 오늘 할 일 — Plan SC: FR-03, FR-04 */}
            <SectionCard title="오늘 할 일" emoji="✅">
              {entry?.todayTasks.length === 0 && (
                <p className="text-xs text-gray-300 py-1">아직 할 일이 없어요</p>
              )}
              {entry?.todayTasks.map(task => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onToggle={() => toggleTask('todayTasks', task.id)}
                  onRemove={() => removeItem('todayTasks', task.id)}
                />
              ))}
              <AddItemInput onAdd={text => addTask('todayTasks', text)} />
            </SectionCard>

            {/* 오늘 한 일 */}
            <SectionCard title="오늘 한 일" emoji="🏆">
              {entry?.doneTasks.length === 0 && (
                <p className="text-xs text-gray-300 py-1">완료한 일을 기록해보세요</p>
              )}
              {entry?.doneTasks.map(item => (
                <DoneItem
                  key={item.id}
                  text={item.text}
                  onRemove={() => removeItem('doneTasks', item.id)}
                />
              ))}
              <AddItemInput onAdd={addDoneItem} placeholder="완료한 일 추가..." />
            </SectionCard>

            {/* 내일 할 일 */}
            <SectionCard title="내일 할 일" emoji="📅">
              {entry?.tomorrowTasks.length === 0 && (
                <p className="text-xs text-gray-300 py-1">내일을 미리 준비해보세요</p>
              )}
              {entry?.tomorrowTasks.map(task => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onToggle={() => toggleTask('tomorrowTasks', task.id)}
                  onRemove={() => removeItem('tomorrowTasks', task.id)}
                />
              ))}
              <AddItemInput onAdd={text => addTask('tomorrowTasks', text)} placeholder="내일 할 일 추가..." />
            </SectionCard>

            {/* 반성 — Plan SC: FR-07 */}
            <SectionCard title="오늘의 반성" emoji="📝">
              {entry && (
                <ReflectionArea
                  value={entry.reflection}
                  onSave={updateReflection}
                />
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </main>
  )
}
