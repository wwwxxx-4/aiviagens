export default function Loading() {
  return (
    <div
      id="mt-skeleton"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'linear-gradient(135deg, #f4f6fa 0%, #e9eef5 100%)',
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: '#185FA5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 600,
          fontSize: 22,
          boxShadow: '0 8px 24px rgba(24, 95, 165, 0.18)',
        }}
      >
        MT
      </div>
      <div style={{ color: '#1a2937', fontSize: 16, fontWeight: 600 }}>
        Mesquita Turismo
      </div>
      <div style={{ color: '#5a6878', fontSize: 13 }}>
        Carregando sua proposta…
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(24, 95, 165, 0.2)',
          borderTopColor: '#185FA5',
          borderRadius: '50%',
          animation: 'mtspin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes mtspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
