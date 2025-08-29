export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <span style={{
          color: '#1a1a2e',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>E</span>
      </div>
      
      <h1 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        margin: '20px 0',
        background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        EA Plan
      </h1>
      
      <h2 style={{
        fontSize: '24px',
        color: '#94a3b8',
        margin: '10px 0 30px 0',
        fontWeight: '400'
      }}>
        웹·앱 서비스 기획의 새로운 경험
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        width: '100%',
        marginTop: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>제안 진행</h3>
          <p style={{ fontSize: '14px', opacity: '0.9', margin: '0 0 20px 0' }}>RFP 분석부터 제안서 작성까지</p>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500'
          }}>
            제안 시작하기
          </button>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #ec4899, #db2777)',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>구축 관리</h3>
          <p style={{ fontSize: '14px', opacity: '0.9', margin: '0 0 20px 0' }}>요구사항 정리부터 QA까지</p>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500'
          }}>
            구축 관리하기
          </button>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>운영 관리</h3>
          <p style={{ fontSize: '14px', opacity: '0.9', margin: '0 0 20px 0' }}>업무 분배와 일정 관리</p>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500'
          }}>
            운영 시작하기
          </button>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>AI 챗봇</h3>
          <p style={{ fontSize: '14px', opacity: '0.9', margin: '0 0 20px 0' }}>AI 모델로 스마트한 업무 지원</p>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500'
          }}>
            AI와 대화하기
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '60px' }}>
        <button style={{
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          border: 'none',
          color: 'white',
          padding: '16px 32px',
          borderRadius: '50px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(59,130,246,0.3)'
        }}>
          지금 시작하기
        </button>
      </div>
    </div>
  )
}