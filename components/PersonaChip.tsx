interface PersonaChipProps {
  name: string
  title: string
  firm: string
  color: string
}

export function PersonaChip({ name, title, firm, color }: PersonaChipProps) {
  return (
    <div
      className="glass-pill absolute left-4 top-4 z-20 flex items-center gap-3 rounded-2xl px-3 py-2"
      style={{ borderColor: `${color}44` }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
      >
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-zinc-400">
          {title}, {firm}
        </p>
      </div>
    </div>
  )
}
