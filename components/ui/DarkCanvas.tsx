import { FlowingBackground } from '@/components/landing/FlowingBackground'
import { GrainOverlay } from '@/components/landing/GrainOverlay'

interface DarkCanvasProps {
  subtle?: boolean
}

export function DarkCanvas({ subtle = false }: DarkCanvasProps) {
  return (
    <>
      <FlowingBackground subtle={subtle} />
      <GrainOverlay opacity={subtle ? 0.15 : 0.22} />
    </>
  )
}
