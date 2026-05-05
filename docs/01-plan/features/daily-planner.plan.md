# daily-planner Planning Document

> **Summary**: 오늘/내일 할 일, 오늘 한 일, 반성을 기록하는 개인 일일 플래너 PWA
>
> **Project**: daily-planner
> **Version**: 0.1.0
> **Author**: -
> **Date**: 2026-05-03
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 할 일과 회고가 분산되어 있어 하루를 체계적으로 관리하기 어렵다 |
| **Solution** | 4섹션(오늘 할 일·내일 할 일·오늘 한 일·반성) 구조의 PWA + 자동 이월 기능 |
| **Function/UX Effect** | 날짜별 기록 조회·자동 이월로 연속성 있는 생산성 루틴 형성 |
| **Core Value** | 하루 시작과 끝의 습관화 — 계획→실행→반성 사이클 자동 지원 |

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

### 1.1 Purpose

매일 아침 할 일을 계획하고, 저녁에 완료 항목과 반성을 기록하는 단순한 루틴 지원 앱. 전날 "내일 할 일"이 다음날 "오늘 할 일"로 자동 이월되어 연속성을 보장한다.

### 1.2 Background

메모 앱·캘린더·투두 앱을 따로 쓰면 컨텍스트 전환 비용이 크다. 4가지 섹션을 하나의 날짜 뷰에 모아 하루 루틴을 단일 화면에서 완결시킨다.

### 1.3 Related Documents

- 없음 (신규 프로젝트)

---

## 2. Scope

### 2.1 In Scope

- [x] 이메일/소셜 로그인 (bkend.ai Auth)
- [x] 날짜별 4섹션 기록 생성·수정·삭제
- [x] 내일 할 일 → 오늘 할 일 자동 이월 (앱 오픈 시 처리)
- [x] 날짜 이동 (이전/다음 버튼, 달력 선택)
- [x] PWA 설치 지원 (manifest + service worker)
- [x] 클라우드 동기화 (bkend.ai Database)

### 2.2 Out of Scope

- 팀/공유 기능
- 알림·푸시 (Phase 2 이후 검토)
- 태그·카테고리 분류
- 통계·차트 대시보드
- 오프라인 쓰기 (오프라인 시 읽기 전용 캐시만 제공)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 이메일 회원가입·로그인 | High | Pending |
| FR-02 | 날짜별 데이터 조회 (기본: 오늘) | High | Pending |
| FR-03 | 4섹션 항목 추가·수정·삭제 | High | Pending |
| FR-04 | 항목 완료 체크 토글 (오늘 할 일·내일 할 일) | High | Pending |
| FR-05 | 자동 이월: 앱 오픈 시 전날 "내일 할 일" → 오늘 "오늘 할 일"로 복사 | High | Pending |
| FR-06 | 날짜 이동 (이전/다음 버튼 + 달력 선택) | Medium | Pending |
| FR-07 | 반성 섹션: 자유 텍스트 입력 (최대 1000자) | Medium | Pending |
| FR-08 | PWA manifest + 오프라인 shell 캐시 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 첫 화면 로딩 < 2초 (3G 기준) | Lighthouse |
| Performance | 섹션 항목 저장 응답 < 500ms | 네트워크 탭 |
| Accessibility | 키보드 탐색 가능, 명암비 AA | axe DevTools |
| Offline | PWA shell 캐시로 UI 렌더링 가능 | Chrome DevTools 오프라인 모드 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] FR-01 ~ FR-08 모두 구현
- [x] 자동 이월 로직 단위 테스트 통과
- [x] 날짜 경계(자정) 케이스 E2E 검증
- [x] Lighthouse PWA 점수 70점 이상
- [x] 모바일 뷰(375px) 레이아웃 깨짐 없음

### 4.2 Quality Criteria

- [x] TypeScript strict mode 오류 없음
- [x] ESLint 오류 없음
- [x] 빌드 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 자동 이월 중복 실행 (같은 날 여러 번 앱 오픈) | High | High | 이월 실행 여부를 날짜 단위로 DB에 플래그 저장, 멱등 처리 |
| 자정 넘어 아직 "오늘" 세션 중인 경우 이월 타이밍 혼란 | Medium | Medium | 이월은 앱 오픈 시 클라이언트 로컬 날짜 기준으로 처리 |
| bkend.ai API 지연으로 저장 실패 | Medium | Low | 낙관적 업데이트 + 실패 시 재시도 토스트 안내 |
| PWA 캐시와 최신 데이터 불일치 | Low | Medium | API 응답은 캐시 제외, shell만 캐시 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `DailyEntry` | DB Model (bkend.ai) | 신규 생성 — 날짜별 4섹션 데이터 저장 |
| `CarryOverLog` | DB Model (bkend.ai) | 신규 생성 — 이월 실행 이력 (멱등 보장) |
| `User` | Auth (bkend.ai) | 기존 bkend.ai 사용자 모델 그대로 사용 |

### 6.2 Current Consumers

신규 프로젝트로 기존 소비자 없음.

### 6.3 Verification

- [x] 신규 테이블만 추가 — 기존 데이터 영향 없음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Starter** | 정적 사이트 | ☐ |
| **Dynamic** | Feature 모듈 + BaaS | ☑ |
| **Enterprise** | 마이크로서비스 | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | Next.js 14 (App Router) | PWA + SSR, 풀스택 단일 레포 |
| Styling | Tailwind CSS | 빠른 모바일 반응형 구현 |
| State Management | Zustand | 날짜 선택·섹션 로컬 상태 간결하게 관리 |
| API Client | TanStack Query | 서버 상태 캐시 + 낙관적 업데이트 |
| Backend | bkend.ai | Auth + Database 일체형, 서버 불필요 |
| PWA | next-pwa | manifest·service worker 자동 생성 |
| Testing | Playwright | E2E 이월 시나리오 검증 |

### 7.3 Folder Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # 로그인·회원가입 라우트
│   ├── (planner)/           # 플래너 메인 라우트
│   └── api/                 # Route Handlers (필요 시)
├── features/
│   ├── daily-entry/         # 섹션 CRUD 로직
│   └── carry-over/          # 자동 이월 로직
├── components/
│   ├── ui/                  # 공통 UI 컴포넌트
│   └── planner/             # 플래너 전용 컴포넌트
├── lib/
│   └── bkend.ts             # bkend.ai 클라이언트
└── types/
    └── index.ts             # 공통 타입 정의
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] CLAUDE.md 기본 가이드라인 존재 (생성됨)
- [ ] ESLint / Prettier 미설정 (프로젝트 초기화 시 설정 예정)
- [ ] TypeScript strict mode 사용

### 8.2 Conventions to Define

| Category | Rule |
|----------|------|
| Naming | 컴포넌트 PascalCase, 파일 kebab-case |
| 서버/클라이언트 | `"use client"` 명시 필수, 기본은 서버 컴포넌트 |
| API 호출 | 모든 bkend.ai 호출은 `lib/bkend.ts` 경유 |
| 날짜 | 날짜는 `YYYY-MM-DD` 문자열로 통일 (Date 객체 최소화) |

### 8.3 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_BKEND_URL` | bkend.ai API endpoint | Client |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | bkend.ai 프로젝트 ID | Client |

---

## 9. Next Steps

1. [ ] `/pdca design daily-planner` — 상세 설계 문서 작성
2. [ ] bkend.ai 프로젝트 생성 및 DB 스키마 정의
3. [ ] Next.js 프로젝트 초기화 + PWA 설정

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-03 | Initial draft | - |
