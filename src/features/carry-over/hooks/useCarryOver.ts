'use client'

// Design Ref: §2.2 — 자동 이월 흐름. Plan SC: FR-05
// 멱등 보장: CarryOverLog에 오늘 날짜 존재 여부로 중복 실행 방지
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bkend } from '@/lib/bkend'
import type { DailyEntry, TaskItem } from '@/features/daily-entry/types'

interface CarryOverLog { _id: string; date: string }
interface ListResponse<T> { data: T[] }
interface ItemResponse<T> { data: T }

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return format(d, 'yyyy-MM-dd')
}

async function hasCarriedOver(date: string): Promise<boolean> {
  const res = await bkend.get<ListResponse<CarryOverLog>>(
    `/carry-over-logs?filter[date]=${date}`
  )
  return res.data.length > 0
}

async function getYesterdayTomorrowTasks(yesterday: string): Promise<TaskItem[]> {
  const res = await bkend.get<ListResponse<DailyEntry>>(
    `/daily-entries?filter[date]=${yesterday}`
  )
  return res.data[0]?.tomorrowTasks ?? []
}

async function mergeToTodayTasks(today: string, incoming: TaskItem[]): Promise<void> {
  if (incoming.length === 0) return

  const res = await bkend.get<ListResponse<DailyEntry>>(
    `/daily-entries?filter[date]=${today}`
  )

  const resetCompleted = incoming.map(t => ({ ...t, completed: false }))

  if (res.data.length > 0) {
    const entry = res.data[0]
    const existingIds = new Set(entry.todayTasks.map(t => t.id))
    const newTasks = resetCompleted.filter(t => !existingIds.has(t.id))
    if (newTasks.length === 0) return
    await bkend.put(`/daily-entries/${entry._id}`, {
      todayTasks: [...entry.todayTasks, ...newTasks],
    })
  } else {
    await bkend.post<ItemResponse<DailyEntry>>('/daily-entries', {
      date: today,
      todayTasks: resetCompleted,
      tomorrowTasks: [],
      doneTasks: [],
      reflection: '',
    })
  }
}

export function useCarryOver() {
  const queryClient = useQueryClient()
  const attempted = useRef(false)

  useEffect(() => {
    // 세션 중 한 번만 실행 (컴포넌트 re-render 무시)
    if (attempted.current) return
    attempted.current = true

    const today = todayStr()
    const yesterday = yesterdayStr()

    ;(async () => {
      try {
        const already = await hasCarriedOver(today)
        if (already) return

        const tasks = await getYesterdayTomorrowTasks(yesterday)
        await mergeToTodayTasks(today, tasks)
        await bkend.post('/carry-over-logs', { date: today })

        // 오늘 캐시 무효화 → useDailyEntry가 최신 데이터 재조회
        queryClient.invalidateQueries({ queryKey: ['daily-entry', today] })
      } catch {
        // 이월 실패는 조용히 처리 — 다음 앱 오픈 시 재시도 가능
      }
    })()
  }, [queryClient])
}
