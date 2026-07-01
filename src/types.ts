export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  element: ZodiacElement;
  startAngle: number; // in degrees
  endAngle: number; // in degrees
  color: string;
  bgColor: string;
  description: string;
}

export interface Planet {
  id: string;
  name: string;
  symbol: string;
  color: string;
  angle: number; // 0 to 360 degrees
  active: boolean;
  baseOctave: number; // e.g. 2, 3, 4
  description: string;
  governingSign: string;
}

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface Aspect {
  id: string;
  planet1Id: string;
  planet2Id: string;
  type: AspectType;
  angleDiff: number;
  actualDiff: number;
  color: string;
  label: string;
}

export interface ScalePreset {
  id: string;
  name: string;
  intervals: number[]; // semitones relative to root
  description: string;
}

export interface CelestialPreset {
  id: string;
  name: string;
  description: string;
  planets: { id: string; angle: number; active: boolean }[];
  scaleId: string;
  rootNote: string; // e.g., 'C'
}

export interface SynthParams {
  masterVolume: number; // 0 to 1
  filterCutoff: number; // 200 to 8000 Hz
  filterQ: number; // 1 to 15
  delayTime: number; // 0 to 1 seconds
  delayFeedback: number; // 0 to 0.95
  reverbWet: number; // 0 to 1
  lfoRate: number; // 0.1 to 10 Hz
  lfoDepth: number; // 0 to 1000 Hz
}
