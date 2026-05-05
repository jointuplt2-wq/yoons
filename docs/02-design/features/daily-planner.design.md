# daily-planner Design Document

> **Summary**: 오늘/내일 할 일, 오늘 한 일, 반성을 기록하는 개인 일일 플래너 PWA 설계
>
> **Project**: daily-planner
> **Version**: 0.1.0
> **Author**: -
> **Date**: 2026-05-03
> **Status**: Draft
> **Planning Doc**: [daily-planner.plan.md](../../01-plan/features/daily-planner.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 할 일·완료·반성이 제각각이라 하루 흐름을 한눈에 파악하기 어렵다 |
| **WHO** | 매일 할 일 관리와 간단한 회고가 필요한 개인 사용자 |
| **RISK** | 자동 이월 타이밍(자정 기준) 처리 오류 시 데이터 중복/누락 가능 |
| **SUCCESS** | 날짜별 4섹션 CRUD 완성 + 자동 이월 정상 동작 + PWA 오프라인 UI 렌더링 |
| **SCOPE** | Phase 1: 인증·CRUD·자동이월 / Phase 2: 날짜 탐색·PWA 설치 지원 |

---

## 1. Overview

### 1.1 Design Goals

- 단일 날짜 뷰에서 4섹션을 모두 조작 가능한 UX
- bkend.ai 직접 연동으로 별도 서버 없이 클라우드 저장
- 자동 이월 로직의 멱등성 보장 (중복 실행 방지)
- 모바일 375px ~ 데스크톱 1280px 반응형 레이아웃

### 1.2 Design Principles

- Feature 모듈 단위 응집도 유지 (daily-entry / carry-over 분리)
- 날짜는 `YYYY-MM-DD` 문자열로 통일 — Date 객체 변환은 경계에서만
- 낙관적 업데이트로 체감 속도 확보, 실패 시 롤백 토스트

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **New Files** | ~10 | ~28 | ~18 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low | High | High |
| **Effort** | Low | High | Medium |

**Selected**: **Option C (Pragmatic)** — 개인 앱 규모에 적합, 유지보수 가능한 Feature 모듈 구조

### 2.1 Component Diagram

```
Browser (PWA)
│
├── app/(auth)/          로그인·회원가입 페이지
└── app/(planner)/       플래너 메인 페이지
        │
        ├── features/daily-entry/    4섹션 CRUD
        │       hooks/useDailyEntry  ─────────────┐
        │       components/SectionCard             │
        │                                          ▼
        ├── features/carry-over/         bkend.ai REST API
        │       hooks/useCarryOver  ─────────────▶ (Auth + DB)
        │
        ├── store/useDateStore       날짜 선택 (Zustand)
        └── lib/bkend.ts             API 클라이언트 (공통)
```

### 2.2 Data Flow

```
사용자 입력
  → SectionCard (UI)
    → useDailyEntry (TanStack Query mutation)
      → lib/bkend.ts (fetch)
        → bkend.ai API
          → MongoDB (bkend.ai managed)
```

자동 이월 흐름:
```
앱 오픈
  → useCarryOver.checkAndCarryOver(today)
    → CarryOverLog 조회 (today 날짜 존재?)
      → 없으면: 전날 TomorrowTasks → 오늘 TodayTasks 복사
               CarryOverLog에 today 삽입 (멱등 보장)
      → 있으면: 스킵
```

### 2.3 Dependencies

| Package | Purpose |
|---------|---------|
| `next` 14 | App Router, RSC, PWA shell |
| `next-pwa` | Service worker + manifest 자동 생성 |
| `@tanstack/react-query` | 서버 상태 캐시 + 낙관적 업데이트 |
| `zustand` | 날짜 선택 상태 (UI 전역) |
| `tailwindcss` | 반응형 스타일링 |
| `date-fns` | 날짜 파싱·포맷 (YYYY-MM-DD) |
| `@radix-ui/react-popover` | 달력 팝오버 |
| `react-day-picker` | 달력 컴포넌트 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// 할 일 항목 (오늘/내일 할 일 공용)
interface TaskItem {
  id: string;        // nanoid 생성
  text: string;
  completed: boolean;
}

// 오늘 한 일 항목
interface DoneItem {
  id: string;
  text: string;
}

// 날짜별 일지 (bkend.ai DailyEntry 테이블)
interface DailyEntry {
  _id: string;
  userId: string;          // bkend.ai auth user ID (자동)
  date: string;            // YYYY-MM-DD
  todayTasks: TaskItem[];
  tomorrowTasks: TaskItem[];
  doneTasks: DoneItem[];
  reflection: string;      // 최대 1000자
  createdAt: Date;
  updatedAt: Date;
}

// 자동 이월 실행 기록 (bkend.ai CarryOverLog 테이블)
interface CarryOverLog {
  _id: string;
  userId: string;
  date: string;      // YYYY-MM-DD (이월 대상 날짜 = "오늘")
  createdAt: Date;
}
```

### 3.2 Entity Relationships

```
[User (bkend.ai auth)]
  │
  ├── 1 ──── N  [DailyEntry]   (date unique per user)
  └── 1 ──── N  [CarryOverLog] (date unique per user)
```

### 3.3 bkend.ai Collection Schema

#### DailyEntry

| Field | Type | Required | Index | Description |
|-------|------|:--------:|:-----:|-------------|
| `_id` | ObjectId | auto | PK | 자동 생성 |
| `userId` | String | auto | ✓ | bkend.ai 인증 사용자 ID |
| `date` | String | ✓ | ✓ | YYYY-MM-DD (userId+date 복합 유니크) |
| `todayTasks` | Array | - | - | TaskItem[] |
| `tomorrowTasks` | Array | - | - | TaskItem[] |
| `doneTasks` | Array | - | - | DoneItem[] |
| `reflection` | String | - | - | 최대 1000자 |
| `createdAt` | Date | auto | - | |
| `updatedAt` | Date | auto | - | |

#### CarryOverLog

| Field | Type | Required | Index | Description |
|-------|------|:--------:|:-----:|-------------|
| `_id` | ObjectId | auto | PK | 자동 생성 |
| `userId` | String | auto | ✓ | bkend.ai 인증 사용자 ID |
| `date` | String | ✓ | ✓ | YYYY-MM-DD (이월 실행 날짜) |
| `createdAt` | Date | auto | - | |

---

## 4. API Specification

bkend.ai 자동 생성 REST API 사용 (별도 Route Handler 불필요).

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|:----:|
| GET | `/api/daily-entries?filter[date]=YYYY-MM-DD` | 날짜별 일지 조회 | ✓ |
| POST | `/api/daily-entries` | 일지 생성 | ✓ |
| PUT | `/api/daily-entries/:id` | 일지 전체 업데이트 | ✓ |
| GET | `/api/carry-over-logs?filter[date]=YYYY-MM-DD` | 이월 기록 조회 | ✓ |
| POST | `/api/carry-over-logs` | 이월 기록 생성 | ✓ |

### 4.2 Detailed Specification

#### `GET /api/daily-entries?filter[date]=2026-05-03`

**Response (200 OK):**
```json
{
  "data": [{
    "_id": "abc123",
    "userId": "user_xyz",
    "date": "2026-05-03",
    "todayTasks": [{ "id": "t1", "text": "기획서 작성", "completed": false }],
    "tomorrowTasks": [],
    "doneTasks": [],
    "reflection": ""
  }],
  "pagination": { "total": 1 }
}
```

#### `POST /api/daily-entries`

**Request:**
```json
{
  "date": "2026-05-03",
  "todayTasks": [],
  "tomorrowTasks": [],
  "doneTasks": [],
  "reflection": ""
}
```

**Response (201 Created):**
```json
{ "data": { "_id": "abc123", "date": "2026-05-03", ... } }
```

**Error Responses:**
- `400`: 입력 유효성 오류
- `401`: 인증 필요 (bkend.ai JWT 만료)

---

## 5. UI/UX Design

### 5.1 Screen Layout

#### 모바일 (375px)
```
┌─────────────────────────────────────┐
│  daily planner        [아이콘] [날짜] │  ← Header
│  < 2026-05-03 >  [📅]               │  ← Date Nav
├─────────────────────────────────────┤
│  오늘 할 일                    [+]   │
│  ☐ 기획서 작성                       │
│  ☑ 메일 확인                         │
├─────────────────────────────────────┤
│  오늘 한 일                    [+]   │
│  • 회의록 정리                        │
├─────────────────────────────────────┤
│  내일 할 일                    [+]   │
│  ☐ 발표 준비                         │
├─────────────────────────────────────┤
│  반성                                │
│  ┌─────────────────────────────┐    │
│  │ 오늘 집중력이 낮았다...      │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### 데스크톱 (768px+)
```
┌──────────────────────────────────────────────────┐
│  daily planner                    < 2026-05-03 > │
├──────────────┬──────────────┬────────────────────┤
│ 오늘 할 일   │ 오늘 한 일   │ 내일 할 일         │
│ ☐ 기획서 작성│ • 회의록 정리│ ☐ 발표 준비        │
│ ☑ 메일 확인  │              │                    │
│         [+] │         [+] │               [+]  │
├──────────────┴──────────────┴────────────────────┤
│ 반성                                             │
│ ┌──────────────────────────────────────────────┐ │
│ │ 오늘 집중력이 낮았다...                      │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
진입
  ├── 비로그인 → /login → (회원가입) → /planner
  └── 로그인됨 → /planner (오늘 날짜)
          │
          ├── 날짜 이동 → 해당 날짜 데이터 로드
          ├── 항목 추가 → 인라인 입력 → Enter/blur 저장
          ├── 항목 수정 → 클릭 → 인라인 편집
          ├── 항목 삭제 → 호버 시 삭제 버튼
          ├── 완료 토글 → 체크박스 클릭
          └── 반성 입력 → debounce 500ms 자동 저장
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `PlannerPage` | `app/(planner)/page.tsx` | 날짜 상태 + 4섹션 조합 |
| `DateNav` | `components/planner/DateNav.tsx` | 날짜 이전/다음/달력 |
| `SectionCard` | `features/daily-entry/components/SectionCard.tsx` | 섹션 헤더 + 항목 목록 |
| `TaskItem` | `features/daily-entry/components/TaskItem.tsx` | 체크박스 항목 (완료 토글) |
| `DoneItem` | `features/daily-entry/components/DoneItem.tsx` | 완료 항목 (체크 없음) |
| `AddItemInput` | `features/daily-entry/components/AddItemInput.tsx` | 인라인 항목 추가 입력 |
| `ReflectionArea` | `features/daily-entry/components/ReflectionArea.tsx` | textarea + 글자수 카운터 |
| `CalendarPopover` | `components/planner/CalendarPopover.tsx` | react-day-picker 래퍼 |
| `LoginForm` | `app/(auth)/login/LoginForm.tsx` | 이메일 로그인 폼 |
| `SignupForm` | `app/(auth)/signup/SignupForm.tsx` | 회원가입 폼 |

### 5.4 Page UI Checklist

#### /login 페이지
- [ ] Input: 이메일 (type=email, placeholder, validation)
- [ ] Input: 비밀번호 (type=password)
- [ ] Button: 로그인 (submit, loading state)
- [ ] Link: 회원가입 페이지로 이동
- [ ] Error: 로그인 실패 메시지 표시 영역

#### /signup 페이지
- [ ] Input: 이메일 (type=email)
- [ ] Input: 비밀번호 (type=password, 최소 8자)
- [ ] Input: 비밀번호 확인
- [ ] Button: 회원가입 (submit, loading state)
- [ ] Link: 로그인 페이지로 이동
- [ ] Error: 유효성 오류 메시지 (필드별)

#### /planner 메인 페이지
- [ ] Header: 앱 이름 "daily planner"
- [ ] DateNav: 이전 날짜 버튼 (`<`)
- [ ] DateNav: 현재 날짜 표시 (YYYY-MM-DD 또는 한국어 형식)
- [ ] DateNav: 다음 날짜 버튼 (`>`)
- [ ] DateNav: 달력 아이콘 버튼 → CalendarPopover
- [ ] CalendarPopover: react-day-picker 달력 (날짜 선택 시 닫힘)
- [ ] Section: "오늘 할 일" — TaskItem 목록 (체크박스 + 텍스트 + 삭제)
- [ ] Section: "오늘 한 일" — DoneItem 목록 (텍스트 + 삭제)
- [ ] Section: "내일 할 일" — TaskItem 목록 (체크박스 + 텍스트 + 삭제)
- [ ] Section: "반성" — ReflectionArea (textarea, 글자수/1000 표시)
- [ ] Button: 각 섹션 하단 [+] 항목 추가 버튼
- [ ] AddItemInput: Enter 키 저장, Escape 취소
- [ ] Toast: 저장 실패 시 재시도 안내
- [ ] Loading: 데이터 로딩 중 skeleton UI
- [ ] Empty state: 항목 없을 때 안내 텍스트

---

## 6. Error Handling

### 6.1 Error Scenarios

| Scenario | Handling |
|----------|----------|
| bkend.ai 401 | 토큰 갱신 시도 → 실패 시 /login 리다이렉트 |
| 저장 실패 (네트워크) | 낙관적 업데이트 롤백 + 토스트 "저장 실패, 재시도" |
| 이월 실패 | 콘솔 경고만 (사용자에게 노출 안 함, 다음 오픈 시 재시도) |
| 데이터 없는 날짜 조회 | 빈 DailyEntry 자동 생성 (POST) |
| reflection 1000자 초과 | 입력 차단 + 글자수 카운터 빨간색 |

### 6.2 Error Response Format (bkend.ai 표준)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## 7. Security Considerations

- [ ] bkend.ai JWT 토큰 — HttpOnly 쿠키 저장 (XSS 방지)
- [ ] Row-level security: userId 필터를 bkend.ai가 자동 적용 (타인 데이터 접근 불가)
- [ ] reflection 입력: 최대 1000자 클라이언트+서버 양측 검증
- [ ] HTTPS 강제 (Vercel 배포 시 자동)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| Unit | useCarryOver 이월 로직 | Jest / Vitest | Do |
| L1: API | DailyEntry CRUD, CarryOverLog | curl | Do |
| L2: UI | 섹션 항목 추가·삭제·토글 | Playwright | Do |
| L3: E2E | 회원가입→로그인→플래너→이월 | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Description | Expected Status |
|---|----------|--------|-------------|:---------------:|
| 1 | `/api/daily-entries?filter[date]=today` | GET | 오늘 일지 조회 | 200 |
| 2 | `/api/daily-entries` | POST | 일지 생성 | 201 |
| 3 | `/api/daily-entries/:id` | PUT | 섹션 업데이트 | 200 |
| 4 | `/api/daily-entries` | GET | 미인증 차단 | 401 |
| 5 | `/api/carry-over-logs?filter[date]=today` | GET | 이월 기록 조회 | 200 |
| 6 | `/api/carry-over-logs` | POST | 이월 기록 생성 | 201 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | /planner | 페이지 로드 | 4섹션 모두 표시, 오늘 날짜 표시 |
| 2 | /planner | [+] 클릭 → "테스트 항목" 입력 → Enter | 항목 추가됨 (API 201) |
| 3 | /planner | 체크박스 클릭 | 완료 스타일 적용 (취소선) |
| 4 | /planner | 삭제 버튼 클릭 | 항목 제거 (API PUT) |
| 5 | /planner | < 버튼 클릭 | 전날 날짜로 이동 |
| 6 | /planner | 달력 아이콘 → 날짜 선택 | 선택 날짜로 이동 |
| 7 | /planner | 반성 텍스트 입력 | 500ms 후 자동 저장 |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 신규 사용자 온보딩 | 회원가입 → 로그인 → /planner 진입 | 빈 플래너 화면 표시 |
| 2 | 기본 일지 작성 | 오늘 할 일 추가 → 완료 토글 → 반성 입력 | 모든 변경사항 DB 저장 |
| 3 | 자동 이월 | 어제 "내일 할 일" 입력 → 다음날 앱 오픈 | 오늘 "오늘 할 일"에 복사됨 |
| 4 | 날짜 탐색 | 이전/다음 버튼 + 달력 선택 | 해당 날짜 데이터 정확히 표시 |
| 5 | 오류 복구 | 오프라인 상태에서 항목 추가 시도 | 토스트 메시지 표시, 데이터 유실 없음 |

### 8.5 Seed Data Requirements

| Entity | Count | Key Fields |
|--------|:-----:|------------|
| User | 1 | 테스트 이메일·비밀번호 |
| DailyEntry (어제) | 1 | tomorrowTasks: [{text: "이월 테스트"}] |
| DailyEntry (오늘) | 0 | 이월 전 비어있어야 함 |

---

## 9. Clean Architecture (Dynamic Level)

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 페이지·컴포넌트 렌더링 | `src/app/`, `src/components/` |
| **Application** | 비즈니스 로직 (hooks) | `src/features/*/hooks/` |
| **Domain** | 타입·인터페이스 | `src/features/*/types.ts`, `src/types/` |
| **Infrastructure** | bkend.ai API 호출 | `src/lib/bkend.ts` |

### 9.2 Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `PlannerPage` | Presentation | `src/app/(planner)/page.tsx` |
| `SectionCard`, `TaskItem` | Presentation | `src/features/daily-entry/components/` |
| `useDailyEntry` | Application | `src/features/daily-entry/hooks/` |
| `useCarryOver` | Application | `src/features/carry-over/hooks/` |
| `useDateStore` | Application | `src/store/useDateStore.ts` |
| `DailyEntry`, `TaskItem` | Domain | `src/features/daily-entry/types.ts` |
| `bkendClient` | Infrastructure | `src/lib/bkend.ts` |

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention |
|------|-----------|
| 컴포넌트 파일 | `PascalCase.tsx` |
| 훅 파일 | `camelCase.ts` (use 접두사) |
| 폴더 | `kebab-case/` |
| 날짜 타입 | `string` (YYYY-MM-DD), Date 객체 지양 |
| `"use client"` | 상태·이벤트 있는 컴포넌트에만 명시 |
| API 호출 | 반드시 `lib/bkend.ts` 경유 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── LoginForm.tsx
│   │   └── signup/
│   │       ├── page.tsx
│   │       └── SignupForm.tsx
│   ├── (planner)/
│   │   └── page.tsx               # PlannerPage
│   ├── layout.tsx                 # QueryClientProvider + Toaster
│   └── globals.css
├── features/
│   ├── daily-entry/
│   │   ├── hooks/
│   │   │   └── useDailyEntry.ts   # CRUD + 낙관적 업데이트
│   │   ├── components/
│   │   │   ├── SectionCard.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── DoneItem.tsx
│   │   │   ├── AddItemInput.tsx
│   │   │   └── ReflectionArea.tsx
│   │   └── types.ts
│   └── carry-over/
│       └── hooks/
│           └── useCarryOver.ts    # 이월 로직 + 멱등 처리
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Toast.tsx
│   └── planner/
│       ├── DateNav.tsx
│       └── CalendarPopover.tsx
├── store/
│   └── useDateStore.ts            # Zustand (selectedDate)
├── lib/
│   └── bkend.ts                   # fetch wrapper (auth header 자동 주입)
└── types/
    └── index.ts                   # 공통 타입 re-export
```

### 11.2 Implementation Order

1. [ ] Next.js 프로젝트 초기화 + Tailwind + next-pwa 설정
2. [ ] `lib/bkend.ts` — bkend.ai fetch 래퍼 (토큰 헤더 자동 주입)
3. [ ] `features/daily-entry/types.ts` — 타입 정의
4. [ ] bkend.ai 테이블 생성 (DailyEntry, CarryOverLog)
5. [ ] 인증 페이지 (login / signup)
6. [ ] `store/useDateStore.ts` — Zustand 날짜 스토어
7. [ ] `useDailyEntry` 훅 — CRUD + TanStack Query
8. [ ] 4섹션 컴포넌트 구현
9. [ ] `DateNav` + `CalendarPopover`
10. [ ] `useCarryOver` 훅 — 이월 로직
11. [ ] `PlannerPage` 조합
12. [ ] PWA manifest + service worker 검증

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| 프로젝트 초기화 + 인증 | `module-1` | Next.js 셋업, bkend.ai 연동, 로그인/회원가입 | 15-20 |
| 데이터 레이어 + CRUD | `module-2` | bkend.ai 테이블, useDailyEntry, 타입 | 15-20 |
| 플래너 UI | `module-3` | 4섹션 컴포넌트, DateNav, CalendarPopover | 20-25 |
| 이월 로직 + PWA | `module-4` | useCarryOver, next-pwa, E2E 테스트 | 15-20 |

#### Recommended Session Plan

| Session | Scope | Turns |
|---------|-------|:-----:|
| Session 1 | Plan + Design (완료) | 35 |
| Session 2 | `--scope module-1` (초기화 + 인증) | 20 |
| Session 3 | `--scope module-2` (데이터 레이어) | 20 |
| Session 4 | `--scope module-3` (플래너 UI) | 25 |
| Session 5 | `--scope module-4` (이월 + PWA + QA) | 20 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-03 | Initial draft (Option C selected) | - |
