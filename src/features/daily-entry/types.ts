// Design Ref: §3.1 — Domain layer 타입 정의
export interface TaskItem {
  id: string
  text: string
  completed: boolean
}

export interface DoneItem {
  id: string
  text: string
}

export interface DailyEntry {
  _id: string
  userId: string
  date: string // YYYY-MM-DD
  todayTasks: TaskItem[]
  tomorrowTasks: TaskItem[]
  doneTasks: DoneItem[]
  reflection: string
  createdAt: string
  updatedAt: string
}

export type TaskSection = 'todayTasks' | 'tomorrowTasks'
export type AnySection = TaskSection | 'doneTasks'
