export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-bold">EA Plan</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            대시보드
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <p className="text-gray-400 text-lg mb-4">기획자를 위한 AI 통합 플랫폼</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">웹·앱 서비스 기획의</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              새로운 경험
            </span>
          </h1>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 h-80 flex flex-col justify-between shadow-2xl">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">제안 진행</h3>
              <p className="text-white/80 text-sm mb-6">RFP 분석부터 제안서 작성까지</p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all">
                제안 시작하기
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-8 h-80 flex flex-col justify-between shadow-2xl">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">구축 관리</h3>
              <p className="text-white/80 text-sm mb-6">요구사항 정리부터 QA까지</p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all">
                구축 관리하기
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-8 h-80 flex flex-col justify-between shadow-2xl">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">운영 관리</h3>
              <p className="text-white/80 text-sm mb-6">업무 분배와 일정 관리</p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all">
                운영 시작하기
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-8 h-80 flex flex-col justify-between shadow-2xl">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M13 8H8"/>
                <path d="M16 12H8"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">AI 챗봇</h3>
              <p className="text-white/80 text-sm mb-6">AI 모델로 스마트한 업무 지원</p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all">
                AI와 대화하기
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl transition-all">
            지금 시작하기
          </button>
        </div>
      </main>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>
    </div>
  )
}