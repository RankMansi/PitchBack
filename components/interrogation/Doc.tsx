import type { ReactNode } from 'react'
import { T } from './theme'

const mono = { fontFamily: 'var(--font-doc)' } as const

export function DocStamp({
  children,
  color = T.borderBright,
  rotate = -4,
}: {
  children: ReactNode
  color?: string
  rotate?: number
}) {
  return (
    <div
      className="inline-block border-2 px-4 py-2 uppercase"
      style={{
        ...mono,
        color,
        borderColor: color,
        transform: `rotate(${rotate}deg)`,
        fontSize: '11px',
        letterSpacing: '0.25em',
        fontWeight: 500,
        opacity: 0.92,
      }}
    >
      {children}
    </div>
  )
}

export function DocTime({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        ...mono,
        fontSize: '9px',
        color: T.amberMuted,
        letterSpacing: '0.12em',
      }}
    >
      {children}
    </span>
  )
}

export function DocLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="uppercase"
      style={{
        ...mono,
        fontSize: '9px',
        color: T.amberMuted,
        letterSpacing: '0.14em',
        marginBottom: '4px',
      }}
    >
      {children}
    </p>
  )
}

export function DocMeta({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`uppercase ${className}`.trim()}
      style={{
        ...mono,
        fontSize: '9px',
        color: T.amberMuted,
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </span>
  )
}

export function DocNum({
  children,
  size = 'md',
}: {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizes = { sm: '14px', md: '20px', lg: '24px', xl: '32px' }
  return (
    <span
      style={{
        ...mono,
        fontSize: sizes[size],
        color: T.amberBright,
        fontWeight: 500,
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </span>
  )
}

export function DocRule() {
  return <div className="my-2 h-px w-full" style={{ backgroundColor: T.border }} />
}

export function DocBtn({
  children,
  href,
  onClick,
  variant = 'default',
  disabled,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}) {
  const border =
    variant === 'danger' ? '#8A3A2A' : variant === 'primary' ? T.borderBright : T.border
  const color =
    variant === 'danger' ? '#C44A3A' : variant === 'primary' ? T.amberBright : T.amberBody
  const style = {
    ...mono,
    fontSize: '9px',
    color,
    letterSpacing: '0.12em',
    padding: '10px 22px',
    border: `0.5px solid ${border}`,
    borderRadius: '2px',
    backgroundColor: 'transparent',
    textTransform: 'uppercase' as const,
    display: 'inline-block',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
  if (href) {
    return (
      <a href={href} className="no-underline" style={style}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

export function EvidenceFolder({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: '#090704',
        border: '0.5px solid #2A2220',
        borderRadius: '2px',
      }}
    >
      <div
        className="absolute -top-2 left-3 px-2"
        style={{ backgroundColor: '#090704' }}
      >
        <span
          className="uppercase"
          style={{
            ...mono,
            fontSize: '7px',
            color: '#3A2810',
            letterSpacing: '0.15em',
          }}
        >
          EVIDENCE FOLDER
        </span>
      </div>
      {children}
    </div>
  )
}
