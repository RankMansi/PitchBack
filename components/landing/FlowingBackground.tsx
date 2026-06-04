interface FlowingBackgroundProps {
  subtle?: boolean
}

export function FlowingBackground({ subtle = false }: FlowingBackgroundProps) {
  const o = subtle ? 0.35 : 1

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0a0806' }}
      />
      <div
        className="landing-blob landing-blob-1"
        style={{
          position: 'absolute',
          width: '70vw',
          height: '70vw',
          top: '-15%',
          right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #c43c2a 0%, #c43c2a00 68%)',
          filter: 'blur(80px)',
          opacity: 0.55 * o,
        }}
      />
      <div
        className="landing-blob landing-blob-2"
        style={{
          position: 'absolute',
          width: '55vw',
          height: '55vw',
          top: '30%',
          left: '-15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6b1818 0%, #6b181800 70%)',
          filter: 'blur(90px)',
          opacity: 0.65 * o,
        }}
      />
      <div
        className="landing-blob landing-blob-3"
        style={{
          position: 'absolute',
          width: '50vw',
          height: '50vw',
          bottom: '-10%',
          right: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #d4a054 0%, #d4a05400 65%)',
          filter: 'blur(75px)',
          opacity: 0.35 * o,
        }}
      />
      <div
        className="landing-blob landing-blob-4"
        style={{
          position: 'absolute',
          width: '40vw',
          height: '40vw',
          bottom: '5%',
          left: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #3a1212 0%, #3a121200 70%)',
          filter: 'blur(70px)',
          opacity: 0.5 * o,
        }}
      />
    </div>
  )
}
