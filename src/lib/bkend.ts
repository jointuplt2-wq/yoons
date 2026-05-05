// Firebase 기반 백엔드 레이어 — bkend.ai 대체
// 기존 훅(useDailyEntry, useCarryOver) 인터페이스 유지
import { auth, db } from './firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'

// ─── 쿠키 (미들웨어 인증 체크용) ──────────────────────────────
const TOKEN_COOKIE = 'auth_token'

function setToken(token: string) {
  const maxAge = 60 * 60 * 24 * 30 // 30일
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`
}

// ─── Firebase Auth 상태 복원 대기 ───────────────────────────────
function waitForUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      if (user) resolve(user)
      else reject(new Error('로그인이 필요합니다'))
    })
  })
}

async function getCurrentUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser
  return waitForUser()
}

// ─── URL 쿼리에서 filter 값 추출 ────────────────────────────────
// "/daily-entries?filter[date]=2024-01-01" → "2024-01-01"
function extractFilterDate(path: string): string | null {
  const match = path.match(/filter\[date\]=([^&]+)/)
  return match ? match[1] : null
}

// ─── 메인 bkend 객체 ────────────────────────────────────────────
export const bkend = {
  auth: {
    async login(email: string, password: string): Promise<void> {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      setToken(token)
    },

    async signup(email: string, password: string): Promise<void> {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      setToken(token)
    },

    logout(): void {
      signOut(auth)
      clearToken()
    },
  },

  // GET /daily-entries?filter[date]=YYYY-MM-DD
  // GET /carry-over-logs?filter[date]=YYYY-MM-DD
  async get<T>(path: string): Promise<T> {
    const user = await getCurrentUser()
    const uid = user.uid
    const date = extractFilterDate(path)

    if (path.includes('/daily-entries')) {
      const col = collection(db, 'users', uid, 'daily-entries')
      const q = date ? query(col, where('date', '==', date)) : query(col)
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ ...d.data(), _id: d.id }))
      return { data } as T
    }

    if (path.includes('/carry-over-logs')) {
      const col = collection(db, 'users', uid, 'carry-over-logs')
      const q = date ? query(col, where('date', '==', date)) : query(col)
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ ...d.data(), _id: d.id }))
      return { data } as T
    }

    throw new Error(`Unknown GET path: ${path}`)
  },

  // POST /daily-entries  |  POST /carry-over-logs
  async post<T>(path: string, body: unknown): Promise<T> {
    const user = await getCurrentUser()
    const uid = user.uid

    if (path.includes('/daily-entries')) {
      const col = collection(db, 'users', uid, 'daily-entries')
      const now = new Date().toISOString()
      const payload = { ...(body as object), userId: uid, createdAt: now, updatedAt: now }
      const docRef = await addDoc(col, payload)
      const snap = await getDoc(docRef)
      return { data: { ...snap.data(), _id: docRef.id } } as T
    }

    if (path.includes('/carry-over-logs')) {
      const col = collection(db, 'users', uid, 'carry-over-logs')
      await addDoc(col, { ...(body as object), userId: uid })
      return { data: body } as T
    }

    throw new Error(`Unknown POST path: ${path}`)
  },

  // PUT /daily-entries/{id}
  async put<T>(path: string, body: unknown): Promise<T> {
    const user = await getCurrentUser()
    const uid = user.uid
    const now = new Date().toISOString()

    const match = path.match(/\/daily-entries\/(.+)/)
    if (match) {
      const id = match[1]
      const docRef = doc(db, 'users', uid, 'daily-entries', id)
      await updateDoc(docRef, { ...(body as object), updatedAt: now })
      const snap = await getDoc(docRef)
      return { data: { ...snap.data(), _id: id } } as T
    }

    throw new Error(`Unknown PUT path: ${path}`)
  },

  async delete<T>(path: string): Promise<T> {
    throw new Error(`DELETE not implemented for: ${path}`)
  },
}
