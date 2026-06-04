import { T } from './theme'

interface CaseStripProps {
  left: string
  right: string
}

export function CaseStrip({ left, right }: CaseStripProps) {
  return (
    <footer
      className="flex h-8 items-center justify-between border-t px-7"
      style={{
        backgroundColor: T.bg,
        borderColor: T.border,
      }}
    >
      <span
        className="uppercase"
        style={{
          fontFamily: 'var(--font-doc)',
          fontSize: '9px',
          color: T.amberMuted,
          letterSpacing: '0.1em',
        }}
      >
        {left}
      </span>
      {right ? (
        <span
          className="uppercase"
          style={{
            fontFamily: 'var(--font-doc)',
            fontSize: '9px',
            color: T.amberMuted,
            letterSpacing: '0.1em',
          }}
        >
          {right}
        </span>
      ) : (
        <span />
      )}
    </footer>
  )
}
