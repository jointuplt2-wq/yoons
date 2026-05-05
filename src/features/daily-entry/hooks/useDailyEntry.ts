'use client'

// Design Ref: §9.2 — Application layer. bkend.ai CRUD + 낙관적 업데이트
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { bkend } from '@/lib/bkend'
import type { DailyEntry, TaskItem, DoneItem, TaskSection, AnySection } from '../types'

interface ListResponse<T> {
  data: T[]
}
interface ItemResponse<T> {
  data: T
}

async function fetchOrCreate(date: string): Promise<DailyEntry> {
  const res = await bkend.get<ListResponse<DailyEntry>>(
    `/daily-entries?filter[date]=${date}`
  )
  if (res.data.length > 0) return res.data[0]

  // Plan SC: FR-02 — 날짜별 데이터 없으면 자동 생성
  const created = await bkend.post<ItemResponse<DailyEntry>>('/daily-entries', {
    date,
    todayTasks: [],
    tomorrowTasks: [],
    doneTasks: [],
    reflection: '',
  })
  return created.data
}

async function saveEntry(id: string, patch: Partial<DailyEntry>): Promise<DailyEntry> {
  const res = await bkend.put<ItemResponse<DailyEntry>>(`/daily-entries/${id}`, patch)
  return res.data
}

export function useDailyEntry(date: string) {
  const queryClient = useQueryClient()
  const queryKey = ['daily-entry', date]

  const { data: entry, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchOrCreate(date),
    staleTime: 30_000,
  })

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: (patch: Partial<DailyEntry>) => {
      if (!entry) return Promise.reject(new Error('Entry not ready'))
      return saveEntry(entry._id, patch)
    },
    // 낙관적 업데이트: UI 즉시 반영 후 서버 응답 대기
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<DailyEntry>(queryKey)
      queryClient.setQueryData<DailyEntry>(queryKey, old => old ? { ...old, ...patch } : old)
      return { prev }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  // Plan SC: FR-03 — 섹션 항목 추가
  function addTask(section: TaskSection, text: string) {
    if (!entry) return
    const item: TaskItem = { id: nanoid(), text, completed: false }
    mutate({ [section]: [...entry[section], item] })
  }

  function addDoneItem(text: string) {
    if (!entry) return
    const item: DoneItem = { id: nanoid(), text }
    mutate({ doneTasks: [...entry.doneTasks, item] })
  }

  // Plan SC: FR-04 — 완료 체크 토글
  function toggleTask(section: TaskSection, id: string) {
    if (!entry) return
    mutate({
      [section]: entry[section].map(t => t.id === id ? { ...t, completed: !t.completed } : t),
    })
  }

  // Plan SC: FR-03 — 항목 삭제
  function removeItem(section: AnySection, id: string) {
    if (!entry) return
    const updated = (entry[section] as Array<{ id: string }>).filter(i => i.id !== id)
    mutate({ [section]: updated })
  }

  // Plan SC: FR-07 — 반성 저장 (debounce는 컴포넌트에서 처리)
  function updateReflection(text: string) {
    mutate({ reflection: text })
  }

  return { entry, isLoading, isSaving, addTask, addDoneItem, toggleTask, removeItem, updateReflection }
}
