import type { Emotion } from './types'

export interface RoomLightProfile {
  bulb: string
  beamFills: string[]
  coneWidth: number
  label: string
  accent: string
  stamp: string
}

/** Reactive interrogation room lighting — flat fills only */
export const ROOM_LIGHT: Record<Emotion, RoomLightProfile> = {
  neutral: {
    bulb: '#C17B3A',
    beamFills: ['#0A0704', '#100C06', '#161008', '#1C140A', '#22180C', '#2A1E0E', '#322410'],
    coneWidth: 1,
    label: 'STANDARD AMBER',
    accent: '#C17B3A',
    stamp: '#8B5A2B',
  },
  skeptical: {
    bulb: '#E2EAEF',
    beamFills: ['#080A0C', '#0C1014', '#10161C', '#141C24', '#182228', '#1C2830', '#203038'],
    coneWidth: 0.72,
    label: 'SURGICAL WHITE',
    accent: '#B8C8D4',
    stamp: '#6A7A88',
  },
  impressed: {
    bulb: '#E8A848',
    beamFills: ['#120C04', '#1A1206', '#22180A', '#2A1E0E', '#342610', '#3E2E14', '#4A3818'],
    coneWidth: 1.35,
    label: 'WARM EXPANSION',
    accent: '#E8A848',
    stamp: '#C17B3A',
  },
  confused: {
    bulb: '#A89888',
    beamFills: ['#0A0908', '#100E0C', '#161410', '#1C1A14', '#222018', '#28261C', '#2E2C20'],
    coneWidth: 0.85,
    label: 'DIM UNCERTAIN',
    accent: '#9A8878',
    stamp: '#5A4A3A',
  },
  excited: {
    bulb: '#F0B858',
    beamFills: ['#140E04', '#1C1406', '#241A0A', '#2E220E', '#382A12', '#443216', '#503A1A'],
    coneWidth: 1.28,
    label: 'HIGH WARMTH',
    accent: '#F0B858',
    stamp: '#C17B3A',
  },
  concerned: {
    bulb: '#C8B8A8',
    beamFills: ['#0A0806', '#100C08', '#16100A', '#1C140C', '#22180E', '#281C10', '#2E2012'],
    coneWidth: 0.8,
    label: 'COOLED AMBER',
    accent: '#AA9480',
    stamp: '#6A5A48',
  },
}

export function getRoomLight(emotion: Emotion): RoomLightProfile {
  return ROOM_LIGHT[emotion] ?? ROOM_LIGHT.neutral
}
