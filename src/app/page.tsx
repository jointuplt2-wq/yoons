import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center px-6">
      {/* 아이콘 */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-xl mb-8">
        <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>

      {/* 타이틀 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">daily planner</h1>
      <p className="text-gray-500 text-center text-sm leading-relaxed mb-2">
        오늘 할 일, 오늘 한 일, 내일 할 일<br />하루를 정리하는 가장 간단한 방법
      </p>

      {/* 특징 */}
      <div className="flex flex-col gap-2 my-8 w-full max-w-xs">
        {[
          { icon: '✅', text: '할 일 체크리스트' },
          { icon: '🔄', text: '내일 할 일 자동 이월' },
          { icon: '📝', text: '하루 반성 기록' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-gray-700 font-medium">{text}</span>
          </div>
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-center py-3.5 rounded-2xl font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          시작하기
        </Link>
        <Link
          href="/login"
          className="w-full bg-white text-indigo-600 text-center py-3.5 rounded-2xl font-semibold text-sm border border-indigo-200 hover:bg-indigo-50 transition-colors"
        >
          로그인
        </Link>
      </div>
    </main>
  )
}
